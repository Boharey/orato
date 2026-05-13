"""
orato_engine.py  —  Audio analysis engine for ORATO
Multilingual support (English / Nepali) with filler timestamps, confidence scoring,
speech timeline, and repetition burst detection.
"""

from faster_whisper import WhisperModel
import re
import numpy as np
from collections import Counter

import os

_CPU_THREADS = min(4, os.cpu_count() or 2)
MODEL = WhisperModel(
    "medium",
    device="cpu",
    compute_type="int8",
    cpu_threads=_CPU_THREADS,
    num_workers=1,
)


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()

# ============================================================
# LANGUAGE CONFIGURATION
# ============================================================
LANGUAGE_CONFIG = {
    "en": {
        "prompt": (
            "This is verbatim spoken English. "
            "Transcribe every word exactly as spoken, including filler words like "
            "um, uh, ah, er, like, you know, I mean, sort of, kind of, well, right, okay. "
            "Do not clean or edit the speech. Add punctuation at sentence boundaries."
        ),
        "fillers": [
            "um", "uh", "ah", "er", "hmm",
            "like", "you know", "i mean", "you see",
            "sort of", "kind of", "basically", "actually",
            "literally", "honestly", "so", "well", "right", "okay",
        ],
        "multi_fillers": ["you know", "i mean", "you see", "sort of", "kind of"],
    },
    "ne": {
        "prompt": (
            "यो नेपाली भाषण हो। "
            "सबै शब्द जस्ताको तस्तै लेख्नुहोस्। "
            "ए, उम्, मतलब, हैन, अनि, त्यस्तो जस्ता filler शब्दहरू पनि लेख्नुहोस्। "
            "बोली सफा नगर्नुहोस्।"
        ),
        "fillers": [
            "ए", "उम्", "मतलब", "अनि", "हैन", "त्यस्तो", "के", "यानी", "ल", "हजुर"
        ],
        "multi_fillers": ["त्यो भनेको", "के भन्या", "हैन र"],
    }
}


# Normalize filler lists (strip spaces, lowercase for English only but safe for Nepali)
def _normalize_fillers(config):
    config["fillers"] = [_clean(f) for f in config["fillers"]]
    config["multi_fillers"] = [_clean(f) for f in config["multi_fillers"]]
    return config

LANGUAGE_CONFIG["en"] = _normalize_fillers(LANGUAGE_CONFIG["en"])
LANGUAGE_CONFIG["ne"] = _normalize_fillers(LANGUAGE_CONFIG["ne"])

# Combined filler lists for Nepali+English mixed speech (used only when language="ne")
COMBINED_FILLERS = list(set(LANGUAGE_CONFIG["en"]["fillers"] + LANGUAGE_CONFIG["ne"]["fillers"]))
COMBINED_MULTI_FILLERS = list(set(LANGUAGE_CONFIG["en"]["multi_fillers"] + LANGUAGE_CONFIG["ne"]["multi_fillers"]))

LONG_PAUSE_THRESH = 1.5   # seconds — real disruptive pauses
SHORT_PAUSE_THRESH = 0.3  # seconds — natural breath pauses
IDEAL_WPM_LOW = 120
IDEAL_WPM_HIGH = 160

# ============================================================
# HELPERS
# ============================================================


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
                if not any(phrase in f["phrase"] and len(phrase) < len(f["phrase"]) for f in found):
                    found.append({"phrase": phrase, "count": count})
    return sorted(found, key=lambda x: -x["count"])

def _pace_variation(segments) -> float:
    MIN_WINDOW = 2.5
    windows = []
    buf_words, buf_start, buf_end = 0, None, None
    for s in segments:
        dur = s.end - s.start
        if dur <= 0:
            continue
        w = len(s.text.split())
        if buf_start is None:
            buf_start = s.start
        buf_words += w
        buf_end = s.end
        if (buf_end - buf_start) >= MIN_WINDOW:
            windows.append((buf_words / (buf_end - buf_start)) * 60)
            buf_words, buf_start, buf_end = 0, None, None
    if buf_start is not None and (buf_end - buf_start) >= 1.0:
        windows.append((buf_words / (buf_end - buf_start)) * 60)
    if len(windows) < 2:
        return 0.0
    return round(float(np.std(windows)), 2)

def _detect_repetition_bursts(words_with_timestamps: list) -> list:
    """Detect bursts of identical word repetitions (e.g., 'like like like')."""
    bursts = []
    i = 0
    n = len(words_with_timestamps)
    while i < n:
        word = words_with_timestamps[i]["word"]
        j = i + 1
        while j < n and words_with_timestamps[j]["word"] == word:
            j += 1
        count = j - i
        if count >= 3:
            bursts.append({
                "word": word,
                "count": count,
                "start": words_with_timestamps[i]["start"],
                "end": words_with_timestamps[j-1]["end"],
                "duration": round(words_with_timestamps[j-1]["end"] - words_with_timestamps[i]["start"], 2)
            })
        i = j
    return bursts

def _empty_result() -> dict:
    return {
        "transcript": "",
        "word_count": 0,
        "duration": 0,
        "wpm": 0,
        "articulation_rate": 0,
        "speech_ratio": 0,
        "pace_variation": 0,
        "fillers": {},
        "total_fillers": 0,
        "filler_rate": 0,
        "filler_instances": [],
        "pause_count": 0,
        "long_pauses": [],
        "avg_pause_duration": 0,
        "max_pause_duration": 0,
        "short_pause_count": 0,
        "vocabulary_richness": 0,
        "avg_sentence_length": 0,
        "repeated_phrases": [],
        "repetition_bursts": [],
        "avg_confidence": 0,
        "speech_timeline": [],
        "speech_start_latency": 0,
        "final_score": 0,
        "pace_score": 0,
        "clarity_score": 0,
        "fluency_score": 0,
    }

# ============================================================
# MAIN ANALYSIS FUNCTION (with language support)
# ============================================================
def analyze_audio(file_path: str, language: str = "en") -> dict:
    if language == "en":
        # Strict English mode
        prompt = LANGUAGE_CONFIG["en"]["prompt"]
        filler_list = LANGUAGE_CONFIG["en"]["fillers"]
        multi_filler_list = LANGUAGE_CONFIG["en"]["multi_fillers"]
        transcribe_lang = "en"
    else:  # "ne" -> mixed Nepali+English mode
        # Use English prompt for auto‑detection, combined fillers for both languages
        prompt = LANGUAGE_CONFIG["ne"]["prompt"]
        filler_list = COMBINED_FILLERS
        multi_filler_list = COMBINED_MULTI_FILLERS
        transcribe_lang = "ne"   # auto‑detect per segment

    try:
        segments_gen, info = MODEL.transcribe(
            file_path,
            language=transcribe_lang,
            temperature=0.0,
            word_timestamps=True,
            initial_prompt=prompt,
            vad_filter=True,
            condition_on_previous_text=False,
        )
        segments = list(segments_gen)
    except Exception as e:
        print(f"[orato_engine] transcribe error: {e}")
        return _empty_result()

    if not segments:
        return _empty_result()

    # ── Build flat word list with word-level timestamps and confidences ──
    all_words = []
    word_confidences = []
    for seg in segments:
        if seg.words:
            for w in seg.words:
                word_text = _clean(w.word)
                if word_text:
                    all_words.append({
                        "word": word_text,
                        "start": w.start,
                        "end": w.end,
                    })
                    word_confidences.append(w.probability)   # confidence per word
    # Fallback if no word timestamps
    if not all_words:
        for seg in segments:
            seg_words = seg.text.split()
            if not seg_words:
                continue
            dur_per_word = (seg.end - seg.start) / len(seg_words)
            for j, w in enumerate(seg_words):
                all_words.append({
                    "word": _clean(w),
                    "start": seg.start + j * dur_per_word,
                    "end": seg.start + (j + 1) * dur_per_word,
                })
            # no confidence info in fallback
            word_confidences = []

    if not all_words:
        return _empty_result()

    text = _clean(" ".join(w["word"] for w in all_words))
    words = [w for w in text.split() if w]
    word_count = len(words)
    duration = segments[-1].end

    if word_count == 0 or duration == 0:
        return _empty_result()

    # ── Confidence score ─────────────────────────────────────────────
    avg_confidence = round(float(np.mean(word_confidences)), 3) if word_confidences else 0.0

    # ── Speech start latency (time to first word) ───────────────────
    speech_start_latency = round(all_words[0]["start"], 2) if all_words else 0.0

    # ── WPM ─────────────────────────────────────────────────────────
    wpm = round((word_count / duration) * 60, 2)

    # ── Pause detection (word-level gaps) and speech timeline ───────
    long_pauses = []
    short_pauses = 0
    speech_timeline = []   # list of {"type": "speech"/"pause", "start": ..., "end": ...}
    # Start with first speech segment
    if all_words:
        speech_start = all_words[0]["start"]
        last_end = all_words[0]["end"]
        for i in range(1, len(all_words)):
            gap = all_words[i]["start"] - all_words[i-1]["end"]
            if gap <= 0 or gap > 10.0:
                continue
            if gap >= LONG_PAUSE_THRESH:
                long_pauses.append({
                    "start": round(all_words[i-1]["end"], 2),
                    "end": round(all_words[i]["start"], 2),
                    "duration": round(gap, 2),
                })
                # add previous speech segment
                speech_timeline.append({"type": "speech", "start": round(speech_start,2), "end": round(all_words[i-1]["end"],2)})
                # add pause segment
                speech_timeline.append({"type": "pause", "start": round(all_words[i-1]["end"],2), "end": round(all_words[i]["start"],2)})
                speech_start = all_words[i]["start"]
            elif gap >= SHORT_PAUSE_THRESH:
                short_pauses += 1
        # add final speech segment
        speech_timeline.append({"type": "speech", "start": round(speech_start,2), "end": round(all_words[-1]["end"],2)})

    pause_count = len(long_pauses)
    avg_pause_dur = round(float(np.mean([p["duration"] for p in long_pauses])), 2) if long_pauses else 0.0
    max_pause_dur = round(max((p["duration"] for p in long_pauses), default=0.0), 2)

    # ── Articulation rate & speech ratio ────────────────────────────
    total_pause_time = sum(p["duration"] for p in long_pauses)
    speech_time = max(duration - total_pause_time, 0.1)
    speech_ratio = round(speech_time / duration, 3)
    articulation_rate = round((word_count / speech_time) * 60, 2)

    # ── Fillers (multi‑word first, with timestamps) ─────────────────
    filler_count = {}
    filler_instances = []   # list of {"word": f, "start": s, "end": e}
    # To avoid double counting, we'll process multi-word then single-word
    # We'll scan the text with original case (all lowercase) and also keep positions?
    # Simpler: run regex on the whole text to get spans, then map to word indices.
    # But for timestamps, we need to locate the filler in the word list.
    # Approach: iterate over all_words and match against filler patterns.
    # Because faster-whisper timestamps are per word, we can detect filler words directly.
    used = [False] * len(all_words)
    # Multi-word fillers (longest first)
    for f in sorted(multi_filler_list, key=lambda x: -len(x.split())):
        words_in_filler = f.split()
        n = len(words_in_filler)
        for i in range(len(all_words) - n + 1):
            if used[i]:
                continue
            match = True
            for j in range(n):
                if all_words[i+j]["word"] != words_in_filler[j]:
                    match = False
                    break
            if match:
                # mark all words as used
                for j in range(n):
                    used[i+j] = True
                filler_count[f] = filler_count.get(f, 0) + 1
                filler_instances.append({
                    "word": f,
                    "start": round(all_words[i]["start"], 2),
                    "end": round(all_words[i+n-1]["end"], 2)
                })
    # Single-word fillers
    for f in filler_list:
        if f in multi_filler_list:
            continue
        pattern = re.compile(r'\b' + re.escape(f) + r'\b')
        for i, w in enumerate(all_words):
            if used[i]:
                continue
            if pattern.search(w["word"]):
                used[i] = True
                filler_count[f] = filler_count.get(f, 0) + 1
                filler_instances.append({
                    "word": f,
                    "start": round(w["start"], 2),
                    "end": round(w["end"], 2)
                })

    total_fillers = sum(filler_count.values())
    filler_rate = round((total_fillers / word_count) * 100, 2) if word_count else 0

    # ── Vocabulary richness (MATTR) ────────────────────────────────
    content_words = [w for w in words if len(w) > 2 and w not in filler_list]
    if len(content_words) >= 50:
        try:
            from lexicalrichness import LexicalRichness
            lex = LexicalRichness(" ".join(content_words))
            vocabulary_richness = round(lex.mattr(window_size=25), 3)
        except Exception:
            unique_content = len(set(content_words))
            vocabulary_richness = round(unique_content / max(len(content_words), 1), 3)
    else:
        unique_content = len(set(content_words))
        vocabulary_richness = round(unique_content / max(len(content_words), 1), 3)

    # ── Sentence metrics ───────────────────────────────────────────
    sentences = _sentences(text)
    sent_lengths = [len(s.split()) for s in sentences if s]
    avg_sentence_len = round(float(np.mean(sent_lengths)), 1) if sent_lengths else 0.0

    # ── Repeated phrases (using existing function) ────────────────
    repeated = _repeated_phrases(words) if len(words) >= 6 else []

    # ── Repetition bursts (e.g., "like like like") ────────────────
    bursts = _detect_repetition_bursts(all_words)

    # ── Pace variation ────────────────────────────────────────────
    pace_var = _pace_variation(segments)

    # ── Scoring (pace, clarity, fluency) – unchanged ──────────────
    if IDEAL_WPM_LOW <= wpm <= IDEAL_WPM_HIGH:
        pace_score = 100
    elif 100 <= wpm < IDEAL_WPM_LOW or IDEAL_WPM_HIGH < wpm <= 180:
        pace_score = 75
    elif 80 <= wpm < 100 or 180 < wpm <= 200:
        pace_score = 50
    else:
        pace_score = 25

    filler_penalty = min(50, total_fillers * 3)
    clarity_score = max(0, 100 - filler_penalty)

    pause_penalty = min(40, pause_count * 8)
    ratio_bonus = (speech_ratio - 0.7) * 30 if speech_ratio > 0.7 else 0
    fluency_score = max(0, min(100, 100 - pause_penalty + ratio_bonus))

    final_score = round(pace_score * 0.30 + clarity_score * 0.40 + fluency_score * 0.30, 2)

    return {
        # Existing keys
        "transcript": text,
        "word_count": word_count,
        "duration": round(duration, 2),
        "wpm": wpm,
        "articulation_rate": articulation_rate,
        "speech_ratio": speech_ratio,
        "pace_variation": pace_var,
        "fillers": filler_count,
        "total_fillers": total_fillers,
        "filler_rate": filler_rate,
        "pause_count": pause_count,
        "long_pauses": long_pauses,
        "avg_pause_duration": avg_pause_dur,
        "max_pause_duration": max_pause_dur,
        "short_pause_count": short_pauses,
        "vocabulary_richness": vocabulary_richness,
        "avg_sentence_length": avg_sentence_len,
        "repeated_phrases": repeated,
        "final_score": final_score,
        "pace_score": pace_score,
        "clarity_score": clarity_score,
        "fluency_score": fluency_score,
        # NEW KEYS
        "filler_instances": filler_instances,
        "repetition_bursts": bursts,
        "avg_confidence": avg_confidence,
        "speech_timeline": speech_timeline,
        "speech_start_latency": speech_start_latency,
    }