from pydantic import BaseModel, EmailStr, ConfigDict

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str


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