from fastapi import APIRouter, Depends, UploadFile, File, Form
import uuid
from datetime import datetime, timezone, date, timedelta
import asyncio
import os
from app.services.video_compositor import generate_annotated_video

from app.services.streakservice import calculate_streaks
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
    """
    Research-backed scoring model for interview/presentation evaluation.

    Audio is the foundation (content + delivery).
    Eye contact acts as a trust multiplier — poor gaze penalises even great audio.
    Either dimension being critically bad floors the final score.

    Sources:
    - MIT Interview Dataset (Naim et al., 2015): fluency, fillers, vocabulary
      are top predictors of interview performance ratings.
    - Martín-Raugh et al. (2022) meta-analysis: eye contact ρ=.45 with ratings.
    - NIH study (2024): off-camera gaze directly decreases evaluation scores.
    """

    grades = {}

    # ══════════════════════════════════════════════════════
    # AUDIO SCORE  (0–100)
    # Built from 5 sub-dimensions, each 0–100
    # ══════════════════════════════════════════════════════

    # 1. PACE  — WPM  (weight: 20%)
    # 120–160 WPM is ideal for interview/presentation
    wpm = audio.get("wpm", 0)
    if 120 <= wpm <= 160:
        pace_s = 100; grades["wpm"] = "good"
    elif 100 <= wpm < 120 or 160 < wpm <= 175:
        pace_s = 78;  grades["wpm"] = "warning"
    elif 80 <= wpm < 100 or 175 < wpm <= 195:
        pace_s = 52;  grades["wpm"] = "bad"
    else:
        pace_s = 25;  grades["wpm"] = "bad"   # too slow or racing

    # 2. FLUENCY — filler rate + long pauses  (weight: 28%)
    # MIT study: filler reduction is the single highest-weight lexical feature
    filler_rate  = audio.get("filler_rate", 0)
    pause_count  = audio.get("pause_count", 0)
    duration     = audio.get("duration", 60)

    if filler_rate < 3:    filler_s = 100; grades["fillers"] = "good"
    elif filler_rate < 6:  filler_s = 80;  grades["fillers"] = "good"
    elif filler_rate < 10: filler_s = 55;  grades["fillers"] = "warning"
    elif filler_rate < 15: filler_s = 30;  grades["fillers"] = "bad"
    else:                  filler_s = 10;  grades["fillers"] = "bad"

    # Pause penalty — normalise by duration so long speeches aren't unfairly penalised
    pauses_per_min = (pause_count / max(duration / 60, 0.5))
    if pauses_per_min == 0:    pause_s = 100; grades["pauses"] = "good"
    elif pauses_per_min <= 1:  pause_s = 85;  grades["pauses"] = "good"
    elif pauses_per_min <= 2:  pause_s = 65;  grades["pauses"] = "warning"
    elif pauses_per_min <= 4:  pause_s = 40;  grades["pauses"] = "bad"
    else:                      pause_s = 20;  grades["pauses"] = "bad"

    fluency_s = round(filler_s * 0.65 + pause_s * 0.35)

    # 3. SPEECH CONTINUITY — speech_ratio  (weight: 17%)
    # How much of the recording was actual speech vs silence
    speech_ratio = audio.get("speech_ratio", 1.0)
    if speech_ratio >= 0.80:   ratio_s = 100; grades["speech_ratio"] = "good"
    elif speech_ratio >= 0.68: ratio_s = 78;  grades["speech_ratio"] = "good"
    elif speech_ratio >= 0.55: ratio_s = 52;  grades["speech_ratio"] = "warning"
    else:                      ratio_s = 28;  grades["speech_ratio"] = "bad"

    # 4. VOCABULARY — richness  (weight: 20%)
    # MIT study: unique word usage positively weighted by judges
    vocab = audio.get("vocabulary_richness", 0)
    if vocab >= 0.75:   vocab_s = 100; grades["vocabulary"] = "good"
    elif vocab >= 0.60: vocab_s = 80;  grades["vocabulary"] = "good"
    elif vocab >= 0.45: vocab_s = 58;  grades["vocabulary"] = "warning"
    elif vocab >= 0.30: vocab_s = 35;  grades["vocabulary"] = "bad"
    else:               vocab_s = 15;  grades["vocabulary"] = "bad"

    # 5. PACE VARIATION — expressiveness  (weight: 15%)
    # Some variation = engaging; monotone or erratic = bad
    pace_var = audio.get("pace_variation", 0)
    if 10 <= pace_var <= 35:   pvar_s = 100; grades["pace_variation"] = "good"
    elif 5 <= pace_var < 10:   pvar_s = 72;  grades["pace_variation"] = "warning"
    elif 35 < pace_var <= 55:  pvar_s = 72;  grades["pace_variation"] = "warning"
    elif pace_var < 5:         pvar_s = 45;  grades["pace_variation"] = "bad"   # monotone
    else:                      pvar_s = 35;  grades["pace_variation"] = "bad"   # erratic

    # Weighted audio score
    audio_score = round(
        pace_s    * 0.20 +
        fluency_s * 0.28 +
        ratio_s   * 0.17 +
        vocab_s   * 0.20 +
        pvar_s    * 0.15,
        1
    )

    # ══════════════════════════════════════════════════════
    # VIDEO MULTIPLIER  (0.50 → 1.00)
    # Eye contact acts as a trust/engagement multiplier
    # Research: ρ=.45 with interview ratings (Martín-Raugh 2022)
    #           Off-camera gaze directly lowers scores (NIH 2024)
    # ══════════════════════════════════════════════════════
    eye_pct     = video.get("gaze_on_screen_pct")
    blink_count = video.get("blink_count")
    has_video   = eye_pct is not None

    if has_video:
        # Eye contact multiplier: 0.50 (never looks) → 1.00 (always looks)
        # Deliberately steep — looking away in an interview is severely penalised
        if eye_pct >= 75:
            eye_multiplier = 1.00; grades["eye_contact"] = "good"
        elif eye_pct >= 60:
            eye_multiplier = 0.92; grades["eye_contact"] = "good"
        elif eye_pct >= 45:
            eye_multiplier = 0.80; grades["eye_contact"] = "warning"
        elif eye_pct >= 30:
            eye_multiplier = 0.65; grades["eye_contact"] = "bad"
        else:
            eye_multiplier = 0.50; grades["eye_contact"] = "bad"

        # Blink rate — secondary signal (comfort/naturalness)
        if blink_count is not None and duration > 0:
            bpm = (blink_count / duration) * 60
            if 10 <= bpm <= 20:                    grades["blink_rate"] = "good"
            elif 6 <= bpm < 10 or 20 < bpm <= 28: grades["blink_rate"] = "warning"
            else:                                   grades["blink_rate"] = "bad"
        else:
            grades["blink_rate"] = "unknown"

        combined = round(audio_score * eye_multiplier, 1)

    else:
        # No video — score on audio only, cap at 85
        # Can't give full marks without presence signals
        grades["eye_contact"] = "unknown"
        grades["blink_rate"]  = "unknown"
        combined = round(min(audio_score, 85.0), 1)

    # ══════════════════════════════════════════════════════
    # CRITICAL FLOOR — if either dimension is catastrophic,
    # cap the combined score regardless of the other
    # ══════════════════════════════════════════════════════

    # Audio floor: if speech is nearly absent or incomprehensible
    if audio_score < 25:
        combined = min(combined, 30.0)

    # Eye contact floor: if never looking at camera in a video session
    if has_video and eye_pct is not None and eye_pct < 20:
        combined = min(combined, 35.0)

    return {
        "combined_score": combined,
        "audio_score":    audio_score,
        "grades":         grades,
    }


@router.post("/analyze")
async def analyze(
    video: UploadFile = File(...),
    language: str = Form("en"),
    user=Depends(get_current_user)
):
    uid       = str(uuid.uuid4())
    webm_path = f"/tmp/{uid}.webm"
    wav_path  = f"/tmp/{uid}.wav"

    content = await video.read()
    with open(webm_path, "wb") as f:
        f.write(content)

    await convert_to_wav(webm_path, wav_path)
    if not os.path.exists(wav_path):
        for p in [webm_path]:
            try: os.remove(p)
            except OSError: pass
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Could not extract audio from video. Please ensure the video has an audio track.")

    user_doc         = await db.users.find_one({"_id": user["id"]})
    user_calibration = user_doc.get("gaze_calibration") if user_doc else None

    loop = asyncio.get_event_loop()
    audio_result, video_result = await asyncio.gather(
        loop.run_in_executor(None, analyze_audio, wav_path, language),
        loop.run_in_executor(None, analyze_video, webm_path, user_calibration, True),  # True = return_per_frame
    )

    # Generate annotated video BEFORE deleting webm
    annotated_video_url = None
    try:
        os.makedirs("static/annotated", exist_ok=True)
        out_path = f"static/annotated/{uid}.mp4"
        success = await loop.run_in_executor(
            None,
            generate_annotated_video,
            webm_path,
            out_path,
            audio_result.get("all_words", []),
            audio_result.get("filler_instances", []),
            video_result.get("gaze_per_frame", []),
        )
        if success:
            annotated_video_url = f"/static/annotated/{uid}.mp4"
    except Exception as e:
        print(f"[evaluation] annotated video failed: {e}")

    for p in [webm_path, wav_path]:
        try: os.remove(p)
        except OSError: pass

    transcript    = audio_result.get("transcript", "")
    total_fillers = audio_result["total_fillers"]
    word_count    = audio_result.get("word_count", len(transcript.split()))
    word_count    = word_count if word_count > 0 else 1
    filler_pct    = round((total_fillers / word_count) * 100, 2)
    scoring       = compute_combined_score(audio_result, video_result)


    today_str = date.today().isoformat()
    streak_doc = await db.streaks.find_one({"user_id": user["id"]})
    existing_dates = streak_doc.get("dates", []) if streak_doc else []
    all_dates = sorted(set(existing_dates + [today_str]))

    streaks = calculate_streaks(all_dates)

    await db.streaks.update_one(
        {"user_id": user["id"]},
        {
            "$set": {
                "dates": all_dates,
                "current_streak": streaks["current_streak"],
                "last_active": today_str,
            }
        },
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
        "audio_score":      scoring["audio_score"],
        "grades":           scoring["grades"],

        # Meta
        "transcript":  transcript,
        "video_data":  annotated_video_url,

        "created_at":  datetime.now(timezone.utc).isoformat(),

        # Optional new fields from enhanced audio engine
        "filler_instances": audio_result.get("filler_instances", []),
        "repetition_bursts": audio_result.get("repetition_bursts", []),
        "avg_confidence": audio_result.get("avg_confidence", 0),
        "speech_timeline": audio_result.get("speech_timeline", []),
        "speech_start_latency": audio_result.get("speech_start_latency", 0),

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


@router.get("/session-count")
async def session_count(user=Depends(get_current_user)):
    count = await db.evaluations.count_documents({
        "user_id": user["id"],
        "duration": {"$gte": 60}          # only sessions ≥ 1 minute
    })
    return {"count": count}