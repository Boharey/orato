import uuid
from datetime import datetime, timezone
import jwt                                      # <-- new
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials  # <-- new
from app.db.database import db
from app.models.users import UserRegister, UserLogin, TokenResponse, UserResponse, EmailRequest
from app.core.security import hash_password, verify_password, create_token, get_current_user, security   # <-- added 'security'
from app.core.config import SECRET_KEY, ALGORITHM          # <-- new
from app.services.email_service import send_verification_email
from app.core.limiter import limiter
router = APIRouter(prefix="/auth")


@router.post("/register")
@limiter.limit("5/minute")
async def register(request: Request, data: UserRegister):
    if await db.users.find_one({"email": data.email}):
        raise HTTPException(400, "Email already exists")

    user_id = str(uuid.uuid4())
    verification_token = str(uuid.uuid4())

    user = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "verified": False,
        "verification_token": verification_token,
    }
    await db.users.insert_one(user)
    await send_verification_email(data.email, verification_token)

    return {
        "message": "Registration successful. Please check your email to verify your account."
    }


@router.get("/verify-email")
async def verify_email(token: str):
    token = token.strip()   # ← add this line
    user = await db.users.find_one({"verification_token": token})
    if not user:
        raise HTTPException(400, "Invalid or expired verification token.")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"verified": True}, "$unset": {"verification_token": ""}}
    )
    return {"message": "Email verified successfully! You can now log in."}

@router.post("/resend-verification")
@limiter.limit("3/minute")
async def resend_verification(request: Request, data: EmailRequest):   # only needs email
    user = await db.users.find_one({"email": data.email})
    if not user:
        # Don't reveal if email doesn't exist
        return {"message": "If your account exists, a new verification email has been sent."}

    if user.get("verified", False):
        raise HTTPException(400, "Account is already verified. Please log in.")

    new_token = str(uuid.uuid4())
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"verification_token": new_token}}
    )
    await send_verification_email(data.email, new_token)

    return {"message": "A new verification email has been sent. The previous link is now invalid."}

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user.get("password", "")):
        raise HTTPException(401, "Invalid credentials")

    if not user.get("verified", False):
        raise HTTPException(403, "Please verify your email before logging in.")

    return {
        "token": create_token(user["id"]),
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "created_at": user["created_at"],
        },
    }


@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Insert the current token into the blocklist."""
    token = credentials.credentials
    # Decode to extract expiration (we need it for TTL)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    except Exception:
        # If token is invalid, still success – nothing to block
        return {"message": "Logged out"}

    # Insert into blocklist with TTL index (see next step)
    await db.token_blocklist.insert_one({"token": token, "expires_at": exp})
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def me(user=Depends(get_current_user)):
    return UserResponse(**user)