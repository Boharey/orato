import os
import secrets
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

# ── JWT Configuration ────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"



# In production, a strong secret is mandatory
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET is not set. Add a strong random key to your .env file."
    )
if len(SECRET_KEY) < 32:
    raise RuntimeError(
        "JWT_SECRET is too short. Use at least 32 characters (ideally 64+)."
    )

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "120"))