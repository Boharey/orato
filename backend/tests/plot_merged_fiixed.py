#!/usr/bin/env python3
"""
Generate report‑ready plots from merged ORATO evaluation JSON.
Run: uv run python tests/plot_merged_results.py
"""

import json
import matplotlib
matplotlib.use('Agg')  # No GUI, just save files
import matplotlib.pyplot as plt
import numpy as np

# Load the merged JSON
json_path = "tests/librispeech_combined_existing.json"
with open(json_path, "r") as f:
    data = json.load(f)

samples = data["per_sample"]
summary = data["summary"]

# Extract data
wer = [s["wer"] for s in samples]
actual = [s["actual_final_score"] for s in samples]
ref = [s["reference_final_score"] for s in samples]
filler = [s.get("filler_rate", 0) for s in samples]

# 1. WER histogram
plt.figure(figsize=(8,5))
plt.hist(wer, bins=30, edgecolor='black', alpha=0.7, color='steelblue')
plt.axvline(summary["overall_wer"], color='red', linestyle='dashed', linewidth=2, label=f"Mean WER = {summary['overall_wer']:.4f}")
plt.xlabel("Word Error Rate")
plt.ylabel("Frequency")
plt.title(f"WER Distribution (n={len(samples)})")
plt.legend()
plt.grid(True, alpha=0.3)
plt.savefig("wer_histogram.png", dpi=150)
print("Saved wer_histogram.png")

# 2. Actual vs reference score scatter
plt.figure(figsize=(8,5))
plt.scatter(ref, actual, alpha=0.5, s=15, c='darkgreen')
plt.plot([0,100], [0,100], 'r--', linewidth=2, label="Ideal (y=x)")
plt.xlabel("Reference Final Score (ideal delivery)")
plt.ylabel("Actual Final Score (ORATO)")
plt.title(f"Actual vs Reference Score (n={len(samples)}, gap={summary['gap']:.1f} pts)")
plt.legend()
plt.grid(True, alpha=0.3)
plt.savefig("score_scatter.png", dpi=150)
print("Saved score_scatter.png")

# 3. Filler rate histogram (if any filler > 0)
if max(filler) > 0:
    plt.figure(figsize=(8,5))
    plt.hist(filler, bins=20, edgecolor='black', alpha=0.7, color='orange')
    plt.axvline(summary["avg_filler_rate"], color='red', linestyle='dashed', linewidth=2, label=f"Mean filler rate = {summary['avg_filler_rate']:.2f}%")
    plt.xlabel("Filler Rate (%)")
    plt.ylabel("Frequency")
    plt.title("Filler Rate Distribution")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.savefig("filler_histogram.png", dpi=150)
    print("Saved filler_histogram.png")
else:
    print("No filler data (all zero) – skipping filler histogram.")

# 4. Score gap distribution (ref - actual)
gap_dist = [ref[i] - actual[i] for i in range(len(samples))]
plt.figure(figsize=(8,5))
plt.hist(gap_dist, bins=20, edgecolor='black', alpha=0.7, color='purple')
plt.axvline(summary["gap"], color='red', linestyle='dashed', linewidth=2, label=f"Mean gap = {summary['gap']:.1f} pts")
plt.xlabel("Score Gap (Reference - Actual)")
plt.ylabel("Frequency")
plt.title("Distribution of Score Gaps")
plt.legend()
plt.grid(True, alpha=0.3)
plt.savefig("gap_histogram.png", dpi=150)
print("Saved gap_histogram.png")

print("All plots generated.")