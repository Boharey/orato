from fastapi import APIRouter, Depends, UploadFile, File
import uuid
from datetime import datetime, timezone, date
import asyncio
import os

from app.db.database import db
from app.services.orato_engine import analyze_audio
from app.services.video_analyzer import analyze_video
from app.core.security import get_current_user

router = APIRouter(prefix="/evaluation")


async def convert_to_wav(input_path: str, output_path: str):
    process = await asyncio.create_subprocess_exec(
        "ffmpeg", "-i", input_path,
        "-vn", "-acodec", "pcm_s16le",
        "-ar", "16000", "-ac", "1",
        "-af", "loudnorm,afftdn",
        output_path,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )
    await process.communicate()


@router.post("/analyze")
async def analyze(video: UploadFile = File(...), user=Depends(get_current_user)):
    uid = str(uuid.uuid4())
    webm_path = f"/tmp/{uid}.webm"
    wav_path  = f"/tmp/{uid}.wav"

    content = await video.read()
    with open(webm_path, "wb") as f:
        f.write(content)

    # Audio conversion + analysis
    await convert_to_wav(webm_path, wav_path)
    audio_result = analyze_audio(wav_path)


    # Fetch user's personal gaze calibration if available
    user_doc = await db.users.find_one({"_id": user["id"]})
    user_calibration = user_doc.get("gaze_calibration") if user_doc else None

    
    # Video (gaze) analysis — run in thread so it doesn't block event loop
    loop = asyncio.get_event_loop()
    # Pass to video analyzer
    video_result = await loop.run_in_executor(
        None, analyze_video, webm_path, user_calibration
    )

    # Cleanup
    for p in [webm_path, wav_path]:
        try:
            os.remove(p)
        except OSError:
            pass

    transcript = audio_result.get("transcript", "")
    word_count = len(transcript.split()) if transcript else 1
    total_fillers = audio_result["total_fillers"]
    filler_percentage = round((total_fillers / word_count) * 100, 2)

    # Streak logic (unchanged)
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
        {"$addToSet": {"dates": today},
         "$set": {"current_streak": new_streak, "last_active": today}},
        upsert=True,
    )

    response = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "wpm": audio_result["wpm"],
        "filler_words": audio_result["fillers"],
        "filler_count": total_fillers,
        "filler_percentage": filler_percentage,
        "eye_contact_percentage": video_result.get("gaze_on_screen_pct"),
        "long_pauses": audio_result["pause_count"],
        "confidence_score": audio_result["final_score"],
        "transcript": transcript,
        "blink_count": video_result.get("blink_count"),
        "attention_score": video_result.get("attention_score"),
        "gaze_on_screen_pct": video_result.get("gaze_on_screen_pct"),
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
            "eye_gaze": d.get("gaze_on_screen_pct") or d.get("eye_contact_percentage", 0),
        })
    return formatted