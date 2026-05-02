from fastapi import APIRouter, HTTPException, Depends

from app.db.database import db
from app.models.analytics import AnalyticsData
from app.core.security import get_current_user

router = APIRouter(prefix="/analytics")


@router.get("/{user_id}")
async def get_analytics(user_id: str, user=Depends(get_current_user)):

    if user["id"] != user_id:
        raise HTTPException(403, "Access denied")

    data = await db.evaluations.find({"user_id": user_id}).to_list(100)

    wpm = []
    fillers = []
    eye_gaze = []

    for d in data:
        date = d.get("created_at", "")[:10]

        wpm.append({
            "date": date,
            "value": d.get("wpm", 0)
        })

        fillers.append({
            "date": date,
            "value": d.get("filler_count", 0)
        })

        eye_gaze.append({
            "date": date,
            "value": d.get("eye_contact_percentage", 0)
        })

    return {
        "wpm": wpm,
        "fillers": fillers,
        "eye_gaze": eye_gaze
    }


@router.post("/{user_id}")
async def update_analytics(user_id: str, data: dict, user=Depends(get_current_user)):

    if user["id"] != user_id:
        raise HTTPException(403, "Access denied")

    await db.analytics.update_one(
        {"user_id": user_id}, {"$set": data}, upsert=True
    )

    return {"message": "ok"}