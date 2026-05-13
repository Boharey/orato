#!/usr/bin/env python3
"""
Test ORATO audio engine on local audio files.
Place audio files (.wav or .flac) and matching .txt transcripts in tests/audio/
Run: uv run python tests/test_audio_engine.py
"""

import os
import sys
import json
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.orato_engine import analyze_audio
import numpy as np
import jiwer

def test_local_audio():
    audio_dir = Path(__file__).parent / "audio"
    if not audio_dir.exists():
        print(f"Audio folder not found: {audio_dir}")
        print("Create it and add .wav/.flac files with matching .txt transcripts.")
        return

    # Find all audio files (supports .wav, .flac)
    audio_files = []
    for ext in ["*.wav", "*.flac"]:
        audio_files.extend(audio_dir.glob(ext))

    if not audio_files:
        print(f"No .wav or .flac files found in {audio_dir}")
        return

    results = []
    references = []
    hypotheses = []

    for audio_path in sorted(audio_files):
        txt_path = audio_path.with_suffix(".txt")
        if not txt_path.exists():
            print(f"Skipping {audio_path.name} – missing transcript .txt")
            continue

        with open(txt_path, "r", encoding="utf-8") as f:
            ref_text = f.read().strip().lower()

        print(f"Processing: {audio_path.name}")
        out = analyze_audio(str(audio_path))

        if not out or out.get("word_count", 0) == 0:
            print("  → Engine returned empty or zero words")
            continue

        hyp_text = out["transcript"].strip().lower()
        references.append(ref_text)
        hypotheses.append(hyp_text)
        results.append(out)

        # Print per-file WER
        wer = jiwer.wer(ref_text, hyp_text)
        print(f"  WER: {wer:.4f} | Audio score: {out.get('audio_score', 0)}")

    if not references:
        print("No valid test samples processed.")
        return

    overall_wer = jiwer.wer(references, hypotheses)
    overall_cer = jiwer.cer(references, hypotheses)

    print("\n" + "="*60)
    print(f"OVERALL on {len(references)} samples")
    print("="*60)
    print(f"Word Error Rate (WER): {overall_wer:.4f}")
    print(f"Character Error Rate (CER): {overall_cer:.4f}")

    # Average metrics
    avg_audio = np.mean([r.get("audio_score", 0) for r in results])
    avg_wpm = np.mean([r.get("wpm", 0) for r in results])
    avg_filler = np.mean([r.get("filler_rate", 0) for r in results])
    avg_vocab = np.mean([r.get("vocabulary_richness", 0) for r in results])
    print(f"\nAverage audio score: {avg_audio:.1f}/100")
    print(f"Average WPM: {avg_wpm:.1f}")
    print(f"Average filler rate: {avg_filler:.2f}%")
    print(f"Average vocabulary richness: {avg_vocab:.3f}")

    # Save results
    out_file = audio_dir / "test_results.json"
    with open(out_file, "w") as f:
        json.dump({
            "overall_wer": overall_wer,
            "overall_cer": overall_cer,
            "num_samples": len(references),
            "per_file": results
        }, f, indent=2)
    print(f"\nDetailed results saved to {out_file}")

if __name__ == "__main__":
    test_local_audio()