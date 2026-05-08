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


def compute_combined_score(audio: dict, video: dict, duration_seconds: float = 60.0) -> dict:
    """
    Combines audio + video signals into a single confidence score and per-metric grades.

    Grades: "good" | "warning" | "bad"
    Weights: wpm 25%, fillers 25%, eye_contact 30%, blink_rate 20%
    """

    scores = {}
    grades = {}

    # ── WPM (smooth scoring around ideal pace) ───────────────────────────────
    wpm = audio.get("wpm", 0)
    ideal_wpm = 140
    distance = abs(wpm - ideal_wpm)

    # Lose 1.25 points per WPM away from ideal
    score = max(0, 100 - (distance * 1.25))
    scores["wpm"] = round(score)

    # Grade labels
    if score >= 80:
        grades["wpm"] = "good"
    elif score >= 55:
        grades["wpm"] = "warning"
    else:
        grades["wpm"] = "bad"
    # ────────────────── WPM Logic end ────────────────── #

    # ── Filler % (ideal <5%) ───────────────────────────────────────────────
    word_count = audio.get("word_count", 1) or 1
    total_fillers = audio.get("total_fillers", 0)
    filler_pct = (total_fillers / word_count) * 100
    if filler_pct < 5:
        scores["fillers"] = 100
        grades["fillers"] = "good"
    elif filler_pct < 10:
        scores["fillers"] = 65
        grades["fillers"] = "warning"
    else:
        scores["fillers"] = 30
        grades["fillers"] = "bad"

    # ── Visual attention / eye contact (smooth scoring) ────────────────────
    eye_pct = video.get("gaze_on_screen_pct")
    if eye_pct is not None:
        ideal_eye = 85
        # Only penalize below ideal
        if eye_pct >= ideal_eye:
            score = 100
        else:
            distance = ideal_eye - eye_pct
            # Smooth penalty curve
            score = max(0, 100 - (distance * 1.5))

        scores["eye_contact"] = round(score)

        # Grade labels
        if score >= 80:
            grades["eye_contact"] = "good"
        elif score >= 55:
            grades["eye_contact"] = "warning"
        else:
            grades["eye_contact"] = "bad"

    else:
        scores["eye_contact"] = None
        grades["eye_contact"] = "unknown"



    # ── Blink rate (ideal 10–25 blinks/min) ───────────────────────────────
    blink_count = video.get("blink_count")
    if blink_count is not None and duration_seconds > 0:
        blinks_per_min = (blink_count / duration_seconds) * 60
        if 10 <= blinks_per_min <= 25:
            scores["blink_rate"] = 100
            grades["blink_rate"] = "good"
        elif 6 <= blinks_per_min < 10 or 20 < blinks_per_min <= 30:
            scores["blink_rate"] = 65
            grades["blink_rate"] = "warning"
        else:
            scores["blink_rate"] = 30
            grades["blink_rate"] = "bad"
    else:
        scores["blink_rate"] = None
        grades["blink_rate"] = "unknown"

    # ── Weighted combined score ────────────────────────────────────────────
    has_video = eye_pct is not None and blink_count is not None

    if has_video:
        weights = {
            "wpm": 0.25,
            "fillers": 0.25,
            "eye_contact": 0.30,
            "blink_rate": 0.20,
        }
    else:
        weights = {
            "wpm": 0.40,
            "fillers": 0.40,
            "eye_contact": 0.0,
            "blink_rate": 0.0,
        }

    combined = sum(
        scores[k] * weights[k]
        for k in weights
        if scores.get(k) is not None
    )

    # Normalize if some weights were skipped
    active_weight = sum(
        w for k, w in weights.items()
        if scores.get(k) is not None
    )

    if active_weight > 0:
        combined = combined / active_weight

    combined = round(min(100, max(0, combined)), 1)
    
    return {
        "combined_score": combined,
        "grades": grades,
        "scores": scores,
    }

@router.post("/analyze")
async def analyze(video: UploadFile = File(...), user=Depends(get_current_user)):
    uid = str(uuid.uuid4())
    webm_path = f"/tmp/{uid}.webm"
    wav_path  = f"/tmp/{uid}.wav"

    content = await video.read()
    with open(webm_path, "wb") as f:
        f.write(content)

    # Run audio conversion + video analysis concurrently
    await convert_to_wav(webm_path, wav_path)

    user_doc = await db.users.find_one({"_id": user["id"]})
    user_calibration = user_doc.get("gaze_calibration") if user_doc else None

    loop = asyncio.get_event_loop()
    audio_task = loop.run_in_executor(None, analyze_audio, wav_path)
    video_task = loop.run_in_executor(None, analyze_video, webm_path, user_calibration)

    audio_result, video_result = await asyncio.gather(audio_task, video_task)

    for p in [webm_path, wav_path]:
        try:
            os.remove(p)
        except OSError:
            pass

    transcript  = audio_result.get("transcript", "")
    word_count  = len(transcript.split()) if transcript else 1
    total_fillers     = audio_result["total_fillers"]
    filler_percentage = round((total_fillers / word_count) * 100, 2)

    # Estimate duration from WPM + word count
    wpm = audio_result.get("wpm", 0)
    duration_sec = (word_count / wpm * 60) if wpm > 0 else 60.0

    scoring = compute_combined_score(audio_result, video_result, duration_sec)

    # Streak
    today = str(date.today())
    streak_doc = await db.streaks.find_one({"user_id": user["id"]})
    if not streak_doc:
        new_streak = 1
    else:
        last_active = streak_doc.get("last_active")
        new_streak = streak_doc.get("current_streak", 0) if last_active == today \
                     else streak_doc.get("current_streak", 0) + 1

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
        # Legacy field — keep for dashboard charts
        "confidence_score": scoring["combined_score"],
        # New fields
        "combined_score": scoring["combined_score"],
        "grades": scoring["grades"],
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