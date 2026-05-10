import os
import logging

logger = logging.getLogger("uvicorn")

async def send_verification_email(email: str, token: str):
    verify_url = (
        f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}"
        f"/verify-email?token={token}"
    )
    logger.info("─" * 48)
    logger.info(f"📧 Verification email for {email}")
    logger.info(f"🔗 {verify_url}")
    logger.info("─" * 48)
    # TODO: replace with real SMTP / SendGrid / Mailgun integration