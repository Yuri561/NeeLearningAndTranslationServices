import os 
from pathlib import Path
from dotenv import load_dotenv 


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class PayPalSettings:
    client_id: str = os.getenv("PAYPAL_CLIENT_ID", "")
    client_secret: str = os.getenv("PAYPAL_SECRET_KEY", "")
    mode: str = os.getenv("PAYPAL_MODE", "sandbox")
    base_url: str = os.getenv("PAYPAL_URL", "https://sandbox.paypal.com")
    
    def validate(self) -> None:
        if not self.client_id:
            raise RuntimeError("PAYPAL_CLIENT_ID is missing!! please try again")
        
        if not self.client_secret:
            raise  RuntimeError("PAYPAL_SECRET_KEY is missing!")
        
        if self.mode not in {"sandbox", "live"}:
            raise RuntimeError("PAYPAL_MODE must be in sandbox or live")
        
        
paypal_settings = PayPalSettings()
paypal_settings.validate()

