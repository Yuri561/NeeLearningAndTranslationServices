from pydantic import BaseModel, Field


class PayPalCreateOrderRequest(BaseModel):
    booking_id: int = Field(gt=0)


class PayPalCaptureOrderRequest(BaseModel):
    paypal_order_id: str = Field(min_length=1)


class PayPalOrderResponse(BaseModel):
    paypal_order_id: str
    status: str
    approval_url: str | None = None