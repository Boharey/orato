from faster_whisper import WhisperModel
import re

MODEL = WhisperModel("base", device="cpu", compute_type="int8")

FILLERS = ["um", "uh", "like", "you know", "actually", "basically", "so"]

def analyze_audio(file_path: str):

    segments, info = MODEL.transcribe(
        file_path,
        language="en",
        temperature=0.2,
        initial_prompt = (
    "This is a spoken English conversation. "
    "The speaker may use filler words like um, uh, like, or you know."
)
    )

    segments = list(segments)

    text = " ".join([s.text for s in segments]).lower()
    text = re.sub(r"\s+", " ", text).strip()

    # -------------------------
    # WORD METRICS
    # -------------------------
    words = text.split()
    word_count = len(words)

    duration = segments[-1].end if segments else 0
    wpm = (word_count / duration) * 60 if duration > 0 else 0

    # -------------------------
    # FILLERS
    # -------------------------
    filler_count = {}
    for f in FILLERS:
        c = text.count(f)
        if c:
            filler_count[f] = c

    total_fillers = sum(filler_count.values())

    # -------------------------
    # PAUSES
    # -------------------------
    pauses = 0
    for i in range(1, len(segments)):
        if (segments[i].start - segments[i-1].end) > 0.5:
            pauses += 1

    # -------------------------
    # SIMPLE SCORE (v1)
    # -------------------------
    filler_penalty = total_fillers * 2
    pause_penalty = pauses * 3

    pace_score = 100 if 120 <= wpm <= 160 else 80

    final_score = max(0, 100 - filler_penalty - pause_penalty)

    return {
        "transcript": text,
        "wpm": round(wpm, 2),
        "fillers": filler_count,
        "total_fillers": total_fillers,
        "pause_count": pauses,
        "final_score": round(final_score, 2),
        "pace_score": pace_score,
        "word_count": word_count   
    }