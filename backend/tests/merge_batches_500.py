import json
import os
import jiwer
from pathlib import Path

# Get the directory where this script lives
script_dir = Path(__file__).parent

# Define possible batch filenames (adjust pattern if needed)
batch_files = [
    "librispeech_batch_1_100_samples.json",
    "librispeech_batch_2_100_200_samples.json",
    "librispeech_batch_3_200_300_samples.json",
    "librispeech_batch_4_300_400_samples.json",
    "librispeech_batch_5_400_500_samples.json",
]

existing_batches = []
for f in batch_files:
    full_path = script_dir / f
    if full_path.exists():
        existing_batches.append(full_path)
        print(f"Found {f}")
    else:
        print(f"Not found: {f} – skipping")

if not existing_batches:
    print("No batch files found. Please run test batches first.")
    exit(1)

all_samples = []
for path in existing_batches:
    with open(path, "r") as fp:
        data = json.load(fp)
        all_samples.extend(data["per_sample"])

print(f"Total samples merged: {len(all_samples)}")

# Recompute overall metrics
refs = [s["reference"] for s in all_samples]
hyps = [s["transcribed"] for s in all_samples]
wer = jiwer.wer(refs, hyps)
avg_actual = sum(s["actual_final_score"] for s in all_samples) / len(all_samples)
avg_ref = sum(s["reference_final_score"] for s in all_samples) / len(all_samples)
avg_filler = sum(s["filler_rate"] for s in all_samples) / len(all_samples)
gap = avg_ref - avg_actual

summary = {
    "merged_batches": [int(p.stem.split("_")[2]) for p in existing_batches],
    "total_samples": len(all_samples),
    "overall_wer": round(wer, 4),
    "avg_actual_final_score": round(avg_actual, 1),
    "avg_reference_final_score": round(avg_ref, 1),
    "gap": round(gap, 1),
    "avg_filler_rate": round(avg_filler, 2),
}

output = {"summary": summary, "per_sample": all_samples}
out_file = script_dir / "librispeech_combined_existing.json"
with open(out_file, "w") as f:
    json.dump(output, f, indent=2)
print(f"Merged JSON saved as {out_file}")