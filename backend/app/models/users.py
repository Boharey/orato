from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
import re

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Za-z]", v) or not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one letter and one number")
        return v

class EmailRequest(BaseModel):
    email: EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str


class TokenResponse(BaseModel):
    token: str
    user: UserResponse

# Stored in DB under users collection
class GazeCalibration(BaseModel):
    neutral_horiz: float
    neutral_vert: float
    neutral_pitch: float
    neutral_yaw: float
    calibrated: bool = True