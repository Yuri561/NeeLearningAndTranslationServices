from pydantic import BaseModel, Field
from decimal import Decimal
from pydantic import ConfigDict
class PayPalCreateOrderRequest(BaseModel):
    booking_id: int = Field(gt=0)


class PayPalCaptureOrderRequest(BaseModel):
    paypal_order_id: str = Field(min_length=1)


class PayPalOrderResponse(BaseModel):
    paypal_order_id: str
    status: str
    approval_url: str | None = None
    
class PaymentResponse(BaseModel):
    booking_id: int
    learner_id: int
    tutor_id: int
    paypal_order_id: str
    paypal_capture_id: str
    amount: Decimal
    currency: str
    status: str
    
    model_config = ConfigDict(from_attributes=True)