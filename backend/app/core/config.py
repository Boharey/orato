import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

SECRET_KEY = os.environ.get("JWT_SECRET", "change-this-key-to-a-long-secure-one")
ALGORITHM = "HS256"