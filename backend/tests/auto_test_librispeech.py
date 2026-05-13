#!/usr/bin/env python3
"""
Automated test of ORATO audio engine on LibriSpeech test-clean.
Uses in‑memory audio decoding and temporary files (no local files required).
Run: uv run python tests/auto_test_librispeech.py --max 50 --config clean
"""

import os
import sys
import json
import tempfile
import argparse
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.orato_engine import analyze_audio
import numpy as np
import jiwer
from datasets import load_dataset, Audio

# Try to import soundfile for writing WAV files
try:
    import soundfile as sf
except ImportError:
    print("Installing soundfile...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "soundfile"])
    import soundfile as sf

def test_librispeech(max_samples: int = 50, output_file: str = None, config: str = "clean"):
    if output_file is None:
        output_file = Path(__file__).parent / f"librispeech_{config}_test_results.json"

    print(f"Loading LibriSpeech {config} test set (streaming, first {max_samples} samples)...")
    # Load with streaming and keep audio as decoded array (default)
    dataset = load_dataset("openslr/librispeech_asr", config, split="test", streaming=True)
    # Cast audio column to decode (it will give us array and sampling rate)
    dataset = dataset.cast_column("audio", Audio())

    per_sample = []
    references = []
    hypotheses = []

    for idx, sample in enumerate(dataset):
        if idx >= max_samples:
            break

        audio = sample["audio"]
        array = audio["array"]          # numpy array of audio samples
        sr = audio["sampling_rate"]     # usually 16000
        ref_text = sample["text"].strip().lower()

        # Save to a temporary WAV file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name
        sf.write(tmp_path, array, sr)

        print(f"[{idx+1}/{max_samples}] {Path(audio['path']).name}")
        out = analyze_audio(tmp_path)

        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except:
            pass

        if not out or out.get("word_count", 0) == 0:
            print("  → Engine returned empty result – skipping")
            continue

        hyp_text = out["transcript"].strip().lower()
        references.append(ref_text)
        hypotheses.append(hyp_text)

        wer = jiwer.wer(ref_text, hyp_text)
        cer = jiwer.cer(ref_text, hyp_text)

        per_sample.append({
            "file": Path(audio['path']).name,
            "reference": ref_text,
            "transcribed": hyp_text,
            "wer": round(wer, 4),
            "cer": round(cer, 4),
            "word_count": out.get("word_count", 0),
            "duration": out.get("duration", 0),
            "wpm": out.get("wpm", 0),
            "filler_rate": out.get("filler_rate", 0),
            "vocabulary_richness": out.get("vocabulary_richness", 0),
            "pace_variation": out.get("pace_variation", 0),
            "audio_score": out.get("audio_score", 0),
        })

        print(f"    WER: {wer:.4f} | CER: {cer:.4f} | Audio score: {out.get('audio_score',0)}")

    if not references:
        print("No valid samples processed.")
        return

    overall_wer = jiwer.wer(references, hypotheses)
    overall_cer = jiwer.cer(references, hypotheses)

    avg_audio = np.mean([s["audio_score"] for s in per_sample])
    avg_wpm = np.mean([s["wpm"] for s in per_sample])
    avg_filler = np.mean([s["filler_rate"] for s in per_sample])
    avg_vocab = np.mean([s["vocabulary_richness"] for s in per_sample])

    results = {
        "config": config,
        "num_samples": len(per_sample),
        "overall_wer": round(overall_wer, 4),
        "overall_cer": round(overall_cer, 4),
        "average_metrics": {
            "audio_score": round(avg_audio, 1),
            "wpm": round(avg_wpm, 1),
            "filler_rate": round(avg_filler, 2),
            "vocabulary_richness": round(avg_vocab, 3),
        },
        "per_sample": per_sample,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n" + "="*60)
    print(f"OVERALL on {len(per_sample)} samples")
    print("="*60)
    print(f"WER: {overall_wer:.4f}")
    print(f"CER: {overall_cer:.4f}")
    print(f"Avg audio score: {avg_audio:.1f}/100")
    print(f"Avg WPM: {avg_wpm:.1f}")
    print(f"Avg filler rate: {avg_filler:.2f}%")
    print(f"Avg vocabulary richness: {avg_vocab:.3f}")
    print(f"\nDetailed results saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--max", type=int, default=50, help="Number of samples to process")
    parser.add_argument("--output", type=str, help="Output JSON file path")
    parser.add_argument("--config", type=str, default="clean", choices=["clean", "other"], help="LibriSpeech config")
    args = parser.parse_args()
    test_librispeech(args.max, args.output, args.config)