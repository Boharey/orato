from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime, timezone

from app.db.database import db
from app.models.users import UserRegister, UserLogin, TokenResponse, UserResponse
from app.core.security import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/auth")


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister):

    if await db.users.find_one({"email": data.email}):
        raise HTTPException(400, "Email already exists")

    user_id = str(uuid.uuid4())

    user = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.users.insert_one(user)

    token = create_token(user_id)

    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": data.email,
            "name": data.name,
            "created_at": user["created_at"],
        },
    }


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):

    user = await db.users.find_one({"email": data.email})

    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")

    return {
        "token": create_token(user["id"]),
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "created_at": user["created_at"],
        },
    }


@router.get("/me", response_model=UserResponse)
async def me(user=Depends(get_current_user)):
    return UserResponse(**user)