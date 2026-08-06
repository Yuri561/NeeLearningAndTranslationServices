from typing import Any

import httpx
from fastapi import HTTPException, status

from config.paypal_config import paypal_settings


class PayPalService:
    def __init__(self) -> None:
        self.base_url = paypal_settings.base_url
        self.client_id = paypal_settings.client_id
        self.client_secret = paypal_settings.client_secret

    async def get_access_token(self) -> str:
        url = f"{self.base_url}/v1/oauth2/token"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                data={"grant_type": "client_credentials"},
                auth=(self.client_id, self.client_secret),
                headers={
                    "Accept": "application/json",
                    "Accept-Language": "en_US",
                },
            )

        if response.status_code != status.HTTP_200_OK:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "message": "Unable to authenticate with PayPal",
                    "paypal_error": response.text,
                },
            )

        data = response.json()
        access_token = data.get("access_token")

        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="PayPal did not return an access token",
            )

        return access_token

    async def create_order(
        self,
        amount: str,
        currency: str,
        booking_id: int,
    ) -> dict[str, Any]:
        access_token = await self.get_access_token()

        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": str(booking_id),
                    "custom_id": str(booking_id),
                    "description": f"Nee's Learning booking #{booking_id}",
                    "amount": {
                        "currency_code": currency,
                        "value": amount,
                    },
                }
            ],
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/v2/checkout/orders",
                json=payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                    "PayPal-Request-Id": f"booking-create-{booking_id}",
                },
            )

        if response.status_code not in {
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
        }:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "message": "PayPal order creation failed",
                    "paypal_error": response.text,
                },
            )

        return response.json()

    async def capture_order(
        self,
        paypal_order_id: str,
    ) -> dict[str, Any]:
        access_token = await self.get_access_token()

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                (
                    f"{self.base_url}/v2/checkout/orders/"
                    f"{paypal_order_id}/capture"
                ),
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                    "PayPal-Request-Id": f"capture-{paypal_order_id}",
                },
            )

        if response.status_code not in {
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
        }:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "message": "PayPal order capture failed",
                    "paypal_error": response.text,
                },
            )

        return response.json()


paypal_service = PayPalService()