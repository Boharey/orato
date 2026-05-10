import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.db.database import db

security = HTTPBearer()

def hash_password(p): 
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p, h):
    return bcrypt.checkpw(p.encode(), h.encode())


def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"user_id": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(401, "Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except Exception:
        raise HTTPException(401, "Invalid token")

    # Check blocklist
    blocked = await db.token_blocklist.find_one({"token": token})
    if blocked:
        raise HTTPException(401, "Token has been revoked")

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(401, "User not found")
    user.pop("_id", None)
    return user