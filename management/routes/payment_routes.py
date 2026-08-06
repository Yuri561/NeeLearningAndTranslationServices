from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database.database import get_db
from models.booking import Booking
from models.user import User
from schemas.payment import (
    PayPalCaptureOrderRequest,
    PayPalCreateOrderRequest,
)
from services.paypal_service import paypal_service


router = APIRouter(
    prefix="/payments/paypal",
    tags=["PayPal Payments"],
)


@router.post("/create-order")
async def create_paypal_order(
    payload: PayPalCreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.execute(
        select(Booking).where(Booking.id == payload.booking_id)
    ).scalars().first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Change learner_id if your booking model uses another field name.
    if booking.learner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot pay for this booking",
        )

    # Replace total_price with your real Booking price field.
    amount = Decimal(str(booking.total_price)).quantize(Decimal("0.01"))

    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking amount must be greater than zero",
        )

    paypal_order = await paypal_service.create_order(
        amount=f"{amount:.2f}",
        currency="USD",
        booking_id=booking.id,
    )

    approval_url = next(
        (
            link["href"]
            for link in paypal_order.get("links", [])
            if link.get("rel") == "approve"
        ),
        None,
    )

    return {
        "paypal_order_id": paypal_order["id"],
        "status": paypal_order["status"],
        "approval_url": approval_url,
    }


@router.post("/capture-order")
async def capture_paypal_order(
    payload: PayPalCaptureOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    captured_order = await paypal_service.capture_order(
        payload.paypal_order_id
    )

    if captured_order.get("status") != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PayPal payment was not completed",
        )


    return captured_order




@router.get("/test-connection")
async def test_paypal_connection():
    token = await paypal_service.get_access_token()

    return {
        "connected": True,
        "token_received": bool(token),
        "mode": paypal_settings.mode,
    }