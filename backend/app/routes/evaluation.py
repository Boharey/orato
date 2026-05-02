from fastapi import APIRouter, Depends, UploadFile, File
import uuid
from datetime import datetime, timezone, date

from app.db.database import db
from app.services.orato_engine import analyze_audio
from app.core.security import get_current_user

router = APIRouter(prefix="/evaluation")


@router.post("/analyze")
async def analyze(video: UploadFile = File(...), user=Depends(get_current_user)):

    file_path = f"/tmp/{uuid.uuid4()}.webm"

    with open(file_path, "wb") as f:
        f.write(await video.read())

    result = analyze_audio(file_path)

    # -------------------------
    # FIX 1: SAFE WORD COUNT
    # -------------------------
    transcript = result.get("transcript", "")
    word_count = len(transcript.split()) if transcript else 1

    total_fillers = result["total_fillers"]
    filler_percentage = round((total_fillers / word_count) * 100, 2)

    # -------------------------
    # STREAK LOGIC (UNCHANGED - SIMPLE)
    # -------------------------
    today = str(date.today())

    streak_doc = await db.streaks.find_one({"user_id": user["id"]})

    if not streak_doc:
        new_streak = 1
    else:
        last_active = streak_doc.get("last_active")

        if last_active == today:
            new_streak = streak_doc.get("current_streak", 0)
        else:
            new_streak = streak_doc.get("current_streak", 0) + 1

    await db.streaks.update_one(
        {"user_id": user["id"]},
        {
            "$addToSet": {"dates": today},
            "$set": {
                "current_streak": new_streak,
                "last_active": today
            }
        },
        upsert=True
    )

    # -------------------------
    # RESPONSE (UNCHANGED)
    # -------------------------
    response = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],

        "wpm": result["wpm"],

        "filler_words": result["fillers"],
        "filler_count": total_fillers,
        "filler_percentage": filler_percentage,

        "eye_contact_percentage": None,

        "long_pauses": result["pause_count"],

        "confidence_score": result["final_score"],

        "video_data": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.evaluations.insert_one(response)

    response.pop("_id", None)
    return response


@router.get("/history")
async def history(user=Depends(get_current_user)):

    data = await db.evaluations.find({"user_id": user["id"]}).to_list(50)

    formatted = []

    for d in data:
        d.pop("_id", None)

        formatted.append({
            "date": d.get("created_at", "")[:10],
            "wpm": d.get("wpm", 0),
            "filler_count": d.get("filler_count", 0),
            "eye_gaze": d.get("eye_contact_percentage", 0)
        })

    return formatted