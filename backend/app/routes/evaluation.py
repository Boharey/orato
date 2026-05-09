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


def compute_combined_score(audio: dict, video: dict) -> dict:
    scores = {}
    grades = {}

    wpm = audio.get("wpm", 0)
    if 120 <= wpm <= 160:   scores["wpm"] = 100; grades["wpm"] = "good"
    elif 100 <= wpm < 120 or 160 < wpm <= 180: scores["wpm"] = 70; grades["wpm"] = "warning"
    else:                   scores["wpm"] = 40;  grades["wpm"] = "bad"

    filler_rate = audio.get("filler_rate", 0)
    if filler_rate < 5:     scores["fillers"] = 100; grades["fillers"] = "good"
    elif filler_rate < 10:  scores["fillers"] = 65;  grades["fillers"] = "warning"
    else:                   scores["fillers"] = 30;  grades["fillers"] = "bad"

    pause_count = audio.get("pause_count", 0)
    if pause_count == 0:    scores["pauses"] = 100; grades["pauses"] = "good"
    elif pause_count <= 2:  scores["pauses"] = 70;  grades["pauses"] = "warning"
    else:                   scores["pauses"] = 40;  grades["pauses"] = "bad"

    speech_ratio = audio.get("speech_ratio", 1.0)
    if speech_ratio >= 0.75:   scores["speech_ratio"] = 100; grades["speech_ratio"] = "good"
    elif speech_ratio >= 0.55: scores["speech_ratio"] = 65;  grades["speech_ratio"] = "warning"
    else:                      scores["speech_ratio"] = 30;  grades["speech_ratio"] = "bad"

    eye_pct = video.get("gaze_on_screen_pct")
    if eye_pct is not None:
        if eye_pct >= 70:   scores["eye_contact"] = 100; grades["eye_contact"] = "good"
        elif eye_pct >= 50: scores["eye_contact"] = 65;  grades["eye_contact"] = "warning"
        else:               scores["eye_contact"] = 30;  grades["eye_contact"] = "bad"
    else:
        scores["eye_contact"] = None; grades["eye_contact"] = "unknown"

    blink_count = video.get("blink_count")
    duration    = audio.get("duration", 60)
    if blink_count is not None and duration > 0:
        bpm = (blink_count / duration) * 60
        if 10 <= bpm <= 20:                    scores["blink_rate"] = 100; grades["blink_rate"] = "good"
        elif 6 <= bpm < 10 or 20 < bpm <= 30: scores["blink_rate"] = 65;  grades["blink_rate"] = "warning"
        elif bpm > 30:                        scores["blink_rate"] = 30;  grades["blink_rate"] = "bad"
    else:
        scores["blink_rate"] = None; grades["blink_rate"] = "unknown"

    has_video = eye_pct is not None and blink_count is not None
    if has_video:
        weights = {"wpm": 0.20, "fillers": 0.20, "pauses": 0.10,
                   "speech_ratio": 0.10, "eye_contact": 0.25, "blink_rate": 0.15}
    else:
        weights = {"wpm": 0.30, "fillers": 0.30, "pauses": 0.20,
                   "speech_ratio": 0.20, "eye_contact": 0.0, "blink_rate": 0.0}

    # ── FIX: weighted average, not weighted sum ────────────────────────────
    active = {k: w for k, w in weights.items() if scores.get(k) is not None and w > 0}
    total_w = sum(active.values())
    if total_w == 0:
        combined = 0.0
    else:
        weighted_sum = sum(scores[k] * active[k] for k in active)
        combined = round(weighted_sum / total_w, 1)   # ← NO * 100 here

    return {"combined_score": combined, "grades": grades}


@router.post("/analyze")
async def analyze(video: UploadFile = File(...), user=Depends(get_current_user)):
    uid       = str(uuid.uuid4())
    webm_path = f"/tmp/{uid}.webm"
    wav_path  = f"/tmp/{uid}.wav"

    content = await video.read()
    with open(webm_path, "wb") as f:
        f.write(content)

    await convert_to_wav(webm_path, wav_path)

    user_doc         = await db.users.find_one({"_id": user["id"]})
    user_calibration = user_doc.get("gaze_calibration") if user_doc else None

    loop = asyncio.get_event_loop()
    audio_result, video_result = await asyncio.gather(
        loop.run_in_executor(None, analyze_audio, wav_path),
        loop.run_in_executor(None, analyze_video, webm_path, user_calibration),
    )

    for p in [webm_path, wav_path]:
        try: os.remove(p)
        except OSError: pass

    transcript    = audio_result.get("transcript", "")
    total_fillers = audio_result["total_fillers"]
    word_count    = audio_result.get("word_count", max(len(transcript.split()), 1))
    filler_pct    = round((total_fillers / word_count) * 100, 2)
    scoring       = compute_combined_score(audio_result, video_result)

    today      = str(date.today())
    streak_doc = await db.streaks.find_one({"user_id": user["id"]})
    if not streak_doc:
        new_streak = 1
    else:
        last = streak_doc.get("last_active")
        new_streak = streak_doc.get("current_streak", 0) if last == today \
                     else streak_doc.get("current_streak", 0) + 1

    await db.streaks.update_one(
        {"user_id": user["id"]},
        {"$addToSet": {"dates": today},
         "$set": {"current_streak": new_streak, "last_active": today}},
        upsert=True,
    )

    response = {
        "id":      str(uuid.uuid4()),
        "user_id": user["id"],

        # Audio
        "wpm":                 audio_result["wpm"],
        "articulation_rate":   audio_result["articulation_rate"],
        "speech_ratio":        audio_result["speech_ratio"],
        "pace_variation":      audio_result["pace_variation"],
        "filler_words":        audio_result["fillers"],
        "filler_count":        total_fillers,
        "filler_percentage":   filler_pct,
        "filler_rate":         audio_result["filler_rate"],

        # Pauses
        "long_pauses":         audio_result["pause_count"],
        "pause_details":       audio_result["long_pauses"],
        "avg_pause_duration":  audio_result["avg_pause_duration"],
        "max_pause_duration":  audio_result["max_pause_duration"],
        "short_pause_count":   audio_result["short_pause_count"],

        # Language
        "vocabulary_richness": audio_result["vocabulary_richness"],
        "avg_sentence_length": audio_result["avg_sentence_length"],
        "repeated_phrases":    audio_result["repeated_phrases"],

        # Sub-scores
        "pace_score":    audio_result["pace_score"],
        "clarity_score": audio_result["clarity_score"],
        "fluency_score": audio_result["fluency_score"],

        # Video
        "eye_contact_percentage": video_result.get("gaze_on_screen_pct"),
        "gaze_on_screen_pct":     video_result.get("gaze_on_screen_pct"),
        "blink_count":            video_result.get("blink_count"),
        "attention_score":        video_result.get("attention_score"),

        # Combined
        "confidence_score": scoring["combined_score"],
        "combined_score":   scoring["combined_score"],
        "grades":           scoring["grades"],

        # Meta
        "transcript":  transcript,
        "video_data":  None,
        "created_at":  datetime.now(timezone.utc).isoformat(),
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
            "date":         d.get("created_at", "")[:10],
            "wpm":          d.get("wpm", 0),
            "filler_count": d.get("filler_count", 0),
            "eye_gaze":     d.get("gaze_on_screen_pct") or d.get("eye_contact_percentage", 0),
        })
    return formatted