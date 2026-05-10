from fastapi import APIRouter, Depends, HTTPException

from app.db.database import db
from app.models.streak import StreakData
from app.core.security import get_current_user
from app.services.streakservice import calculate_streaks

router = APIRouter(prefix="/streak")


@router.get("/{user_id}", response_model=StreakData)
async def streak(user_id: str, user=Depends(get_current_user)):
    if user["id"] != user_id:
        raise HTTPException(403, "Access denied")

    data = await db.streaks.find_one({"user_id": user_id})
    if not data:
        return StreakData(user_id=user_id, dates=[], current_streak=0, longest_streak=0)

    data.pop("_id", None)
    data["dates"] = sorted(data["dates"])

    streaks = calculate_streaks(data["dates"])
    data["current_streak"] = streaks["current_streak"]
    data["longest_streak"]  = streaks["longest_streak"]

    return data