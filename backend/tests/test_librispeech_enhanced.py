#!/usr/bin/env python3
"""
Enhanced test script for ORATO audio engine on LibriSpeech.
Supports skipping samples (e.g., to start from 101).
Run: 
  uv run python tests/test_librispeech_enhanced.py --max 100 --batch 1
  uv run python tests/test_librispeech_enhanced.py --max 100 --skip 100 --batch 2
"""

import multiprocessing
multiprocessing.set_start_method('spawn', force=True)

import sys
import json
import tempfile
import argparse
from pathlib import Path
import time

sys.path.insert(0, str(Path(__file__).parent.parent))
from app.services.orato_engine import analyze_audio
import numpy as np
import jiwer
from datasets import load_dataset, Audio
import soundfile as sf

def reference_final_score(transcript: str, duration: float) -> float:
    word_count = len(transcript.split())
    if word_count == 0 or duration <= 0:
        return 0.0
    wpm = (word_count / duration) * 60
    if 120 <= wpm <= 160:
        pace = 100
    elif 100 <= wpm < 120 or 160 < wpm <= 180:
        pace = 75
    elif 80 <= wpm < 100 or 180 < wpm <= 200:
        pace = 50
    else:
        pace = 25
    return round(pace * 0.30 + 100 * 0.40 + 100 * 0.30, 1)

def test_librispeech_enhanced(max_samples=100, skip=0, batch_id=1, output_dir=None):
    if output_dir is None:
        output_dir = Path(__file__).parent
    else:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Streaming LibriSpeech test-clean, skipping {skip}, processing up to {max_samples} samples...")
    dataset = load_dataset("openslr/librispeech_asr", "clean", split="test", streaming=True)
    dataset = dataset.cast_column("audio", Audio(decode=False))

    per_sample = []
    refs = []
    hyps = []
    
    total_actual = 0.0
    total_ref = 0.0
    total_filler_rate = 0.0
    all_filler_rates = []
    all_filler_counts = []
    filler_words_global = {}
    
    count = 0
    start_time = time.time()
    
    skipped = 0
    processed = 0
    for sample in dataset:
        if skipped < skip:
            skipped += 1
            continue
        if processed >= max_samples:
            break
        
        audio_bytes = sample["audio"]["bytes"]
        ref_text = sample["text"].strip().lower()
        
        with tempfile.NamedTemporaryFile(suffix=".flac", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        with sf.SoundFile(tmp_path) as f:
            duration = len(f) / f.samplerate
        
        out = analyze_audio(tmp_path)
        Path(tmp_path).unlink(missing_ok=True)
        
        if not out or out.get("word_count", 0) == 0:
            print(f"[{processed+1}] Skipped (engine empty)")
            processed += 1
            continue
        
        hyp = out["transcript"].strip().lower()
        actual_score = out.get("final_score", 0)
        ref_score = reference_final_score(ref_text, duration)
        wer = jiwer.wer(ref_text, hyp)
        filler_rate = out.get("filler_rate", 0)
        total_fillers = out.get("total_fillers", 0)
        fillers_dict = out.get("fillers", {})
        
        for word, cnt in fillers_dict.items():
            filler_words_global[word] = filler_words_global.get(word, 0) + cnt
        
        per_sample.append({
            "sample_index": skip + processed,
            "reference": ref_text,
            "transcribed": hyp,
            "wer": round(wer, 4),
            "actual_final_score": actual_score,
            "reference_final_score": ref_score,
            "filler_rate": filler_rate,
            "total_fillers": total_fillers,
            "fillers": fillers_dict,
            "duration": round(duration, 2),
            "wpm": out.get("wpm", 0),
            "word_count": out.get("word_count", 0),
        })
        
        refs.append(ref_text)
        hyps.append(hyp)
        total_actual += actual_score
        total_ref += ref_score
        total_filler_rate += filler_rate
        all_filler_rates.append(filler_rate)
        all_filler_counts.append(total_fillers)
        count += 1
        processed += 1
        print(f"[{skip+processed}/{skip+max_samples}] WER:{wer:.4f} | Actual:{actual_score:.1f} | Ref:{ref_score:.1f} | Fillers:{filler_rate:.1f}%")
    
    if count == 0:
        print("No valid samples processed.")
        return
    
    elapsed = time.time() - start_time
    overall_wer = jiwer.wer(refs, hyps)
    avg_actual = total_actual / count
    avg_ref = total_ref / count
    avg_filler_rate = total_filler_rate / count
    std_filler_rate = np.std(all_filler_rates) if count > 1 else 0
    total_fillers_sum = sum(all_filler_counts)
    
    summary = {
        "batch_id": batch_id,
        "skip": skip,
        "num_samples": count,
        "overall_wer": round(overall_wer, 4),
        "avg_actual_final_score": round(avg_actual, 1),
        "avg_reference_final_score": round(avg_ref, 1),
        "gap": round(avg_ref - avg_actual, 1),
        "filler_rate_avg": round(avg_filler_rate, 2),
        "filler_rate_std": round(std_filler_rate, 2),
        "total_fillers_detected": total_fillers_sum,
        "processing_time_seconds": round(elapsed, 2),
        "filler_word_frequencies": filler_words_global,
    }
    
    results = {
        "summary": summary,
        "per_sample": per_sample,
    }
    
    out_file = output_dir / f"librispeech_batch_{batch_id}_{skip}_{skip+count}_samples.json"
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*60)
    print(f"BATCH {batch_id} SUMMARY on {count} samples (from {skip} to {skip+count-1})")
    print("="*60)
    print(f"Overall WER: {overall_wer:.4f}")
    print(f"Avg actual final score: {avg_actual:.1f}")
    print(f"Avg reference final score: {avg_ref:.1f}")
    print(f"Gap: {avg_ref - avg_actual:.1f} points")
    print(f"Avg filler rate: {avg_filler_rate:.2f}%")
    print(f"Total fillers detected: {total_fillers_sum}")
    print(f"Processing time: {elapsed:.1f} sec")
    print(f"Saved to {out_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--max", type=int, default=100, help="Number of samples to process")
    parser.add_argument("--skip", type=int, default=0, help="Number of samples to skip at start")
    parser.add_argument("--batch", type=int, default=1, help="Batch ID for output filename")
    parser.add_argument("--output_dir", type=str, default=None, help="Directory to save results")
    args = parser.parse_args()
    test_librispeech_enhanced(args.max, args.skip, args.batch, args.output_dir)