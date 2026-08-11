import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class PayPalSettings:
    def __init__(self) -> None:
        self.client_id = os.getenv(
            "PAYPAL_CLIENT_ID",
            "",
        ).strip()

        self.client_secret = os.getenv(
            "PAYPAL_SECRET_KEY",
            "",
        ).strip()

        self.mode = os.getenv(
            "PAYPAL_MODE",
            "live",
        ).strip().lower()

        default_base_url = (
            "https://api-m.paypal.com"
            if self.mode == "live"
            else "https://api-m.sandbox.paypal.com"
        )

        self.base_url = os.getenv(
            "PAYPAL_URL",
            default_base_url,
        ).strip().rstrip("/")

    def validate(self) -> None:
        if not self.client_id:
            raise RuntimeError("PAYPAL_CLIENT_ID is missing")

        if not self.client_secret:
            raise RuntimeError("PAYPAL_SECRET_KEY is missing")

        if self.mode not in {"sandbox", "live"}:
            raise RuntimeError(
                "PAYPAL_MODE must be sandbox or live"
            )


paypal_settings = PayPalSettings()
paypal_settings.validate()