"""
orato_engine.py  —  Audio analysis engine for ORATO
Uses faster-whisper with word-level timestamps for accurate metrics.
"""

from faster_whisper import WhisperModel
import re
import numpy as np
from collections import Counter

MODEL = WhisperModel("base", device="cpu", compute_type="int8")

FILLERS            = ["um", "uh", "like", "you know", "actually", "basically", "so"]
LONG_PAUSE_THRESH  = 1.5   # seconds — real disruptive pauses
SHORT_PAUSE_THRESH = 0.3   # seconds — natural breath pauses
IDEAL_WPM_LOW      = 120
IDEAL_WPM_HIGH     = 160


# ── Helpers ───────────────────────────────────────────────────────────────────

def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def _sentences(text: str) -> list:
    parts = re.split(r'[.!?]+', text)
    return [p.strip() for p in parts if p.strip()]


def _ngrams(words: list, n: int) -> list:
    return [" ".join(words[i:i+n]) for i in range(len(words) - n + 1)]


def _repeated_phrases(words: list, min_n: int = 3, min_count: int = 2) -> list:
    found = []
    for n in range(min_n, min(7, len(words))):
        counts = Counter(_ngrams(words, n))
        for phrase, count in counts.items():
            if count >= min_count:
                if not any(
                    phrase in f["phrase"] and len(phrase) < len(f["phrase"])
                    for f in found
                ):
                    found.append({"phrase": phrase, "count": count})
    return sorted(found, key=lambda x: -x["count"])


def _pace_variation(segments) -> float:
    seg_wpms = []
    for s in segments:
        dur = s.end - s.start
        if dur > 0.5:
            w = len(s.text.split())
            seg_wpms.append((w / dur) * 60)
    if len(seg_wpms) < 2:
        return 0.0
    return round(float(np.std(seg_wpms)), 2)


def _empty_result() -> dict:
    """Complete empty result — all keys must match what analyze_audio returns."""
    return {
        "transcript":          "",
        "word_count":          0,
        "duration":            0,
        "wpm":                 0,
        "articulation_rate":   0,
        "speech_ratio":        0,
        "pace_variation":      0,
        "fillers":             {},
        "total_fillers":       0,
        "filler_rate":         0,
        "pause_count":         0,
        "long_pauses":         [],
        "avg_pause_duration":  0,
        "max_pause_duration":  0,
        "short_pause_count":   0,
        "vocabulary_richness": 0,
        "avg_sentence_length": 0,
        "repeated_phrases":    [],
        "final_score":         0,
        "pace_score":          0,
        "clarity_score":       0,
        "fluency_score":       0,
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def analyze_audio(file_path: str) -> dict:
    try:
        segments_gen, info = MODEL.transcribe(
            file_path,
            language="en",
            temperature=0.2,
            word_timestamps=True,
            initial_prompt=(
                "This is a spoken English conversation. "
                "The speaker may use filler words like um, uh, like, or you know."
            ),
        )
        segments = list(segments_gen)
    except Exception as e:
        print(f"[orato_engine] transcribe error: {e}")
        return _empty_result()

    if not segments:
        return _empty_result()

    # ── Build flat word list from word-level timestamps ───────────────────────
    all_words = []
    for seg in segments:
        if seg.words:                          # word_timestamps gave us words
            for w in seg.words:
                word_text = _clean(w.word)
                if word_text:
                    all_words.append({
                        "word":  word_text,
                        "start": w.start,
                        "end":   w.end,
                    })

    # Fallback: word_timestamps didn't populate — use segment text + timing
    if not all_words:
        for seg in segments:
            seg_words = seg.text.split()
            if not seg_words:
                continue
            dur_per_word = (seg.end - seg.start) / len(seg_words)
            for j, w in enumerate(seg_words):
                all_words.append({
                    "word":  _clean(w),
                    "start": seg.start + j * dur_per_word,
                    "end":   seg.start + (j + 1) * dur_per_word,
                })

    if not all_words:
        return _empty_result()

    text       = _clean(" ".join(w["word"] for w in all_words))
    words      = [w for w in text.split() if w]
    word_count = len(words)
    duration   = segments[-1].end

    if word_count == 0 or duration == 0:
        return _empty_result()

    # ── WPM ───────────────────────────────────────────────────────────────────
    wpm = round((word_count / duration) * 60, 2)

    # ── Pause detection (word-level gaps) ─────────────────────────────────────
    long_pauses  = []
    short_pauses = 0

    for i in range(1, len(all_words)):
        gap = all_words[i]["start"] - all_words[i - 1]["end"]
        if gap >= LONG_PAUSE_THRESH:
            long_pauses.append({
                "start":    round(all_words[i - 1]["end"], 2),
                "end":      round(all_words[i]["start"], 2),
                "duration": round(gap, 2),
            })
        elif gap >= SHORT_PAUSE_THRESH:
            short_pauses += 1

    pause_count   = len(long_pauses)
    avg_pause_dur = round(float(np.mean([p["duration"] for p in long_pauses])), 2) \
                    if long_pauses else 0.0
    max_pause_dur = round(max((p["duration"] for p in long_pauses), default=0.0), 2)

    # ── Articulation rate & speech ratio ──────────────────────────────────────
    total_pause_time  = sum(p["duration"] for p in long_pauses)
    speech_time       = max(duration - total_pause_time, 0.1)
    speech_ratio      = round(speech_time / duration, 3)
    articulation_rate = round((word_count / speech_time) * 60, 2)

    # ── Fillers (word-boundary regex) ─────────────────────────────────────────
    filler_count = {}
    for f in FILLERS:
        pattern = r'\b' + re.escape(f) + r'\b'
        c = len(re.findall(pattern, text))
        if c:
            filler_count[f] = c
    total_fillers = sum(filler_count.values())
    filler_rate   = round((total_fillers / word_count) * 100, 2)

    # ── Vocabulary richness ────────────────────────────────────────────────────
    content_words       = [w for w in words if len(w) > 2 and w not in FILLERS]
    unique_content      = len(set(content_words))
    vocabulary_richness = round(unique_content / max(len(content_words), 1), 3)

    # ── Sentence metrics ──────────────────────────────────────────────────────
    sentences        = _sentences(text)
    sent_lengths     = [len(s.split()) for s in sentences if s]
    avg_sentence_len = round(float(np.mean(sent_lengths)), 1) if sent_lengths else 0.0

    # ── Repeated phrases ──────────────────────────────────────────────────────
    repeated = _repeated_phrases(words) if len(words) >= 6 else []

    # ── Pace variation ────────────────────────────────────────────────────────
    pace_var = _pace_variation(segments)

    # ── Scoring ───────────────────────────────────────────────────────────────
    # Pace (0–100)
    if IDEAL_WPM_LOW <= wpm <= IDEAL_WPM_HIGH:
        pace_score = 100
    elif 100 <= wpm < IDEAL_WPM_LOW or IDEAL_WPM_HIGH < wpm <= 180:
        pace_score = 75
    elif 80 <= wpm < 100 or 180 < wpm <= 200:
        pace_score = 50
    else:
        pace_score = 25

    # Clarity — filler penalty
    filler_penalty = min(50, total_fillers * 3)
    clarity_score  = max(0, 100 - filler_penalty)

    # Fluency — pause penalty + speech ratio bonus
    pause_penalty  = min(40, pause_count * 8)
    ratio_bonus    = (speech_ratio - 0.7) * 30 if speech_ratio > 0.7 else 0
    fluency_score  = max(0, min(100, 100 - pause_penalty + ratio_bonus))

    # Final combined
    final_score = round(
        pace_score    * 0.30 +
        clarity_score * 0.40 +
        fluency_score * 0.30,
        2
    )

    return {
        "transcript":          text,
        "word_count":          word_count,
        "duration":            round(duration, 2),
        "wpm":                 wpm,
        "articulation_rate":   articulation_rate,
        "speech_ratio":        speech_ratio,
        "pace_variation":      pace_var,
        "fillers":             filler_count,
        "total_fillers":       total_fillers,
        "filler_rate":         filler_rate,
        "pause_count":         pause_count,
        "long_pauses":         long_pauses,
        "avg_pause_duration":  avg_pause_dur,
        "max_pause_duration":  max_pause_dur,
        "short_pause_count":   short_pauses,
        "vocabulary_richness": vocabulary_richness,
        "avg_sentence_length": avg_sentence_len,
        "repeated_phrases":    repeated,
        "final_score":         final_score,
        "pace_score":          pace_score,
        "clarity_score":       clarity_score,
        "fluency_score":       fluency_score,
    }