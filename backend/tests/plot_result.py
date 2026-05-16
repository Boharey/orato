import json
import matplotlib.pyplot as plt
import numpy as np

with open("") as f:
    data = json.load(f)

samples = data["per_sample"]
wer = [s["wer"] for s in samples]
actual = [s["actual_final_score"] for s in samples]
ref = [s["reference_final_score"] for s in samples]

# 1. Histogram of WER
plt.figure(figsize=(8,5))
plt.hist(wer, bins=30, edgecolor='black', alpha=0.7)
plt.xlabel("Word Error Rate")
plt.ylabel("Frequency")
plt.title(f"WER Distribution (n={len(samples)}), mean={data['summary']['overall_wer']:.4f}")
plt.grid(True, alpha=0.3)
plt.savefig("wer_histogram.png", dpi=150)
plt.show()

# 2. Scatter plot: actual vs reference score
plt.figure(figsize=(8,5))
plt.scatter(ref, actual, alpha=0.5, s=10)
plt.plot([0,100], [0,100], 'r--', label="Ideal (y=x)")
plt.xlabel("Reference Final Score (ideal)")
plt.ylabel("Actual Final Score (ORATO)")
plt.title(f"Actual vs Reference Score (gap = {data['summary']['gap']:.1f} pts)")
plt.legend()
plt.grid(True, alpha=0.3)
plt.savefig("score_scatter.png", dpi=150)
plt.show()

# 3. Box plot of WER by batch (if you have separate batches)
# Optional: if you want to show filler rate distribution
print(f"Average filler rate: {data['summary']['avg_filler_rate']:.2f}%")