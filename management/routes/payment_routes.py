#######################################################################
#                                                                     #
#                      PAYPAL PAYMENT API                             #
#                                                                     #
#   Handles PayPal order creation and payment capture.               #
#                                                                     #
#   - POST /payments/paypal/create-order      → create PayPal order   #
#   - POST /payments/paypal/capture-order     → capture payment       #
#   - GET  /payments/paypal/test-connection   → verify PayPal API     #
#                                                                     #
#######################################################################

from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from config.paypal_config import paypal_settings
from database.database import get_db
from models.booking import Booking
from models.payment import Payment
from models.user import User
from schemas.payment import (
    PayPalCaptureOrderRequest,
    PayPalCreateOrderRequest,
    PayPalOrderResponse,
    PaymentResponse,
)
from services.paypal_service import paypal_service


router = APIRouter(
    prefix="/payments/paypal",
    tags=["PayPal Payments"],
)


# ─────────────────────────────────────────────────────────────────────
# CREATE PAYPAL ORDER
# ─────────────────────────────────────────────────────────────────────
@router.post(
    "/create-order",
    response_model=PayPalOrderResponse,
)
async def create_paypal_order(
    payload: PayPalCreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a PayPal order for an existing booking.

    The frontend only sends the booking ID.
    The backend retrieves the price from the database so the learner
    cannot manipulate the payment amount from the frontend.
    """

    # ---------------------------------------------------------
    # 1. Find booking
    # ---------------------------------------------------------
    booking = db.execute(
        select(Booking).where(
            Booking.id == payload.booking_id
        )
    ).scalars().first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # ---------------------------------------------------------
    # 2. Confirm booking belongs to logged-in learner
    # ---------------------------------------------------------
    if booking.learner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot pay for this booking",
        )

    # ---------------------------------------------------------
    # 3. Prevent payment if booking is already paid
    # ---------------------------------------------------------
    existing_payment = db.execute(
        select(Payment).where(
            Payment.booking_id == booking.id,
            Payment.status == "COMPLETED",
        )
    ).scalars().first()

    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This booking has already been paid",
        )

    # ---------------------------------------------------------
    # 4. Read trusted price from database
    # ---------------------------------------------------------
    try:
        amount = Decimal(
            str(booking.total_price)
        ).quantize(Decimal("0.01"))

    except (InvalidOperation, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Booking contains an invalid price",
        )

    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking amount must be greater than zero",
        )

    # ---------------------------------------------------------
    # 5. Create PayPal order
    # ---------------------------------------------------------
    paypal_order = await paypal_service.create_order(
        amount=f"{amount:.2f}",
        currency="USD",
        booking_id=booking.id,
    )

    # ---------------------------------------------------------
    # 6. Find PayPal approval URL
    # ---------------------------------------------------------
    approval_url = next(
        (
            link.get("href")
            for link in paypal_order.get("links", [])
            if link.get("rel") == "approve"
        ),
        None,
    )

    if not approval_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="PayPal did not return an approval URL",
        )

    # ---------------------------------------------------------
    # 7. Return order information to frontend
    # ---------------------------------------------------------
    return {
        "paypal_order_id": paypal_order["id"],
        "status": paypal_order["status"],
        "approval_url": approval_url,
    }


# ─────────────────────────────────────────────────────────────────────
# CAPTURE PAYPAL ORDER
# ─────────────────────────────────────────────────────────────────────
@router.post(
    "/capture-order",
    response_model=PaymentResponse,
)
async def capture_paypal_order(
    payload: PayPalCaptureOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Capture an approved PayPal order.

    After PayPal confirms the payment:
    - verify ownership
    - verify booking
    - verify amount
    - verify currency
    - save payment record
    - mark booking paid
    """

    # ---------------------------------------------------------
    # 1. Check whether this PayPal order was already processed
    # ---------------------------------------------------------
    existing_payment = db.execute(
        select(Payment).where(
            Payment.paypal_order_id
            == payload.paypal_order_id
        )
    ).scalars().first()

    if existing_payment:
        # Do NOT expose another learner's payment
        if existing_payment.learner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot access this payment",
            )

        return existing_payment

    # ---------------------------------------------------------
    # 2. Capture PayPal order
    # ---------------------------------------------------------
    captured_order = await paypal_service.capture_order(
        payload.paypal_order_id
    )

    # ---------------------------------------------------------
    # 3. Verify PayPal order status
    # ---------------------------------------------------------
    if captured_order.get("status") != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PayPal payment was not completed",
        )

    # ---------------------------------------------------------
    # 4. Pull purchase units from PayPal response
    # ---------------------------------------------------------
    purchase_units = captured_order.get(
        "purchase_units",
        [],
    )

    if not purchase_units:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "PayPal response did not include "
                "purchase information"
            ),
        )

    purchase_unit = purchase_units[0]

    # ---------------------------------------------------------
    # 5. Retrieve our booking ID from PayPal
    # ---------------------------------------------------------
    booking_reference = (
        purchase_unit.get("custom_id")
        or purchase_unit.get("reference_id")
    )

    if not booking_reference:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "PayPal response is missing "
                "the booking reference"
            ),
        )

    try:
        booking_id = int(booking_reference)

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="PayPal returned an invalid booking reference",
        )

    # ---------------------------------------------------------
    # 6. Find booking
    # ---------------------------------------------------------
    booking = db.execute(
        select(Booking).where(
            Booking.id == booking_id
        )
    ).scalars().first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Booking associated with this "
                "payment was not found"
            ),
        )

    # ---------------------------------------------------------
    # 7. Confirm learner owns booking
    # ---------------------------------------------------------
    if booking.learner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You cannot capture payment "
                "for this booking"
            ),
        )

    # ---------------------------------------------------------
    # 8. Pull PayPal capture data
    # ---------------------------------------------------------
    payments_data = purchase_unit.get(
        "payments",
        {},
    )

    captures = payments_data.get(
        "captures",
        [],
    )

    if not captures:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="PayPal did not return a capture record",
        )

    capture = captures[0]

    # ---------------------------------------------------------
    # 9. Verify capture itself is completed
    # ---------------------------------------------------------
    if capture.get("status") != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PayPal capture is not completed",
        )

    paypal_capture_id = capture.get("id")

    if not paypal_capture_id:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="PayPal did not return a capture ID",
        )

    # ---------------------------------------------------------
    # 10. Pull actual amount PayPal captured
    # ---------------------------------------------------------
    paypal_amount_data = capture.get(
        "amount",
        {},
    )

    paypal_amount_raw = paypal_amount_data.get(
        "value"
    )

    paypal_currency = paypal_amount_data.get(
        "currency_code"
    )

    if (
        paypal_amount_raw is None
        or paypal_currency is None
    ):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "PayPal capture did not include "
                "amount information"
            ),
        )

    # ---------------------------------------------------------
    # 11. Convert PayPal amount safely
    # ---------------------------------------------------------
    try:
        paypal_amount = Decimal(
            str(paypal_amount_raw)
        ).quantize(Decimal("0.01"))

    except (InvalidOperation, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="PayPal returned an invalid payment amount",
        )

    # ---------------------------------------------------------
    # 12. Convert booking amount safely
    # ---------------------------------------------------------
    try:
        booking_amount = Decimal(
            str(booking.total_price)
        ).quantize(Decimal("0.01"))

    except (InvalidOperation, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Booking contains an invalid price",
        )

    # ---------------------------------------------------------
    # 13. Verify PayPal amount matches booking amount
    # ---------------------------------------------------------
    if paypal_amount != booking_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": (
                    "PayPal amount does not match "
                    "booking amount"
                ),
                "booking_amount": str(
                    booking_amount
                ),
                "paypal_amount": str(
                    paypal_amount
                ),
            },
        )

    # ---------------------------------------------------------
    # 14. Verify currency
    # ---------------------------------------------------------
    if paypal_currency.upper() != "USD":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unexpected payment currency: "
                f"{paypal_currency}"
            ),
        )

    # ---------------------------------------------------------
    # 15. Prevent duplicate PayPal capture IDs
    # ---------------------------------------------------------
    capture_exists = db.execute(
        select(Payment).where(
            Payment.paypal_capture_id
            == paypal_capture_id
        )
    ).scalars().first()

    if capture_exists:
        if capture_exists.learner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot access this payment",
            )

        return capture_exists

    # ---------------------------------------------------------
    # 16. Create Payment record
    # ---------------------------------------------------------
    new_payment = Payment(
        booking_id=booking.id,
        learner_id=booking.learner_id,
        tutor_id=booking.tutor_id,
        paypal_order_id=payload.paypal_order_id,
        paypal_capture_id=paypal_capture_id,
        amount=paypal_amount,
        currency=paypal_currency.upper(),
        status="COMPLETED",
    )

    db.add(new_payment)

    # ---------------------------------------------------------
    # 17. Mark booking as paid
    # ---------------------------------------------------------
    booking.status = "CONFIRMED" #change to reflect enum 

    # ---------------------------------------------------------
    # 18. Commit Payment + Booking together
    # ---------------------------------------------------------
    try:
        db.commit()
        db.refresh(new_payment)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Payment succeeded with PayPal, "
                "but the database could not be updated"
            ),
        ) from exc

    # ---------------------------------------------------------
    # 19. Return saved payment
    # ---------------------------------------------------------
    return new_payment


# ─────────────────────────────────────────────────────────────────────
# TEST PAYPAL CONNECTION
# ─────────────────────────────────────────────────────────────────────
@router.get("/test-connection")
async def test_paypal_connection():
    """
    Development endpoint used to verify that the backend
    can authenticate with PayPal.

    Remove or protect this endpoint before production launch.
    """

    token = await paypal_service.get_access_token()

    return {
        "connected": True,
        "token_received": bool(token),
        "mode": paypal_settings.mode,
        "base_url": paypal_settings.base_url,
    }