# ============================================================================
# EMAIL UTILITY (Brevo)
# ----------------------------------------------------------------------------
# Sends password reset emails via the Brevo transactional email API.
# Configure these in your .env:
#   BREVO_API_KEY        (your Brevo API key)
#   BREVO_SENDER_EMAIL   (verified sender email in your Brevo account)
#   BREVO_SENDER_NAME    (display name that shows up in the inbox)
#   FRONTEND_URL         (e.g. http://localhost:5173)
# ============================================================================

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "Nee's Learning")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_password_reset_email(to_email: str, reset_token: str) -> None:
    """
    Sends a password reset link to the user's email via Brevo.
    The link points to the frontend reset page with the token as a query param.
    Raises an exception on failure so the caller can return a 500.
    """
    if not BREVO_API_KEY or not BREVO_SENDER_EMAIL:
        raise RuntimeError(
            "Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL in .env."
        )

    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
        <p><a href="{reset_link}" style="
            background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
        ">Reset Password</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>{reset_link}</p>
        <hr>
        <p style="color: #888; font-size: 12px;">
            If you did not request this reset, please ignore this email.
        </p>
    </body>
    </html>
    """

    payload = {
        "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        "to": [{"email": to_email}],
        "subject": "Password Reset Request — Nee's Learning",
        "htmlContent": html_body,
    }

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    with httpx.Client(timeout=15.0) as client:
        response = client.post(BREVO_API_URL, json=payload, headers=headers)
        response.raise_for_status()



def send_welcome_email(to_email: str, full_name: str) -> None:
    """
    Sends a welcome email to a newly registered user via Brevo.
    Raises an exception on failure so the caller can decide how to handle it.
    """
    if not BREVO_API_KEY or not BREVO_SENDER_EMAIL:
        raise RuntimeError(
            "Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL in .env."
        )

    display_name = full_name.strip() if full_name else "there"

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Welcome to Nee's Learning, {display_name}! 🎉</h2>
        <p>We're thrilled to have you join our community of learners.</p>
        <p>Here's what you can do next:</p>
        <ul>
            <li>Browse our Haitian Creole tutoring services</li>
            <li>Book a session with a tutor that fits your schedule</li>
            <li>Track your progress through your lesson history</li>
        </ul>
        <p>
            <a href="{FRONTEND_URL}" style="
                background-color: #4CAF50;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 4px;
                display: inline-block;
            ">Get Started</a>
        </p>
        <hr>
        <p style="color: #888; font-size: 12px;">
            If you have any questions, just reply to this email — we're here to help.
        </p>
    </body>
    </html>
    """

    payload = {
        "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        "to": [{"email": to_email, "name": display_name}],
        "subject": f"Welcome to Nee's Learning, {display_name}!",
        "htmlContent": html_body,
    }

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    with httpx.Client(timeout=15.0) as client:
        response = client.post(BREVO_API_URL, json=payload, headers=headers)
        response.raise_for_status()
