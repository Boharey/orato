#!/usr/bin/env python3
"""
Download 50 LibriSpeech test-clean files with proper transcripts.
Run: uv run python tests/download_librispeech_small.py
"""

import subprocess
from pathlib import Path

BASE_URL = "https://www.openslr.org/resources/12/test-clean.tar.gz"

def download_and_extract():
    audio_dir = Path(__file__).parent / "audio"
    audio_dir.mkdir(exist_ok=True)

    tar_path = Path("/tmp/librispeech_test_clean.tar.gz")
    if not tar_path.exists():
        print("Downloading LibriSpeech test-clean (330 MB)...")
        subprocess.run(["wget", "-O", str(tar_path), BASE_URL], check=True)
    else:
        print("Using cached tar file.")

    extracted_dir = Path("/tmp/LibriSpeech/test-clean")
    if not extracted_dir.exists():
        print("Extracting...")
        subprocess.run(["tar", "-xzf", str(tar_path), "-C", "/tmp"], check=True)

    # Build a dictionary of stem -> transcript from all trans.txt files
    stem_to_transcript = {}
    for trans_file in extracted_dir.rglob("trans.txt"):
        for line in trans_file.read_text().splitlines():
            if not line.strip():
                continue
            parts = line.split(maxsplit=1)
            if len(parts) == 2:
                stem_to_transcript[parts[0]] = parts[1].strip().lower()

    # Find first 50 .flac files
    flac_files = list(extracted_dir.rglob("*.flac"))[:50]
    print(f"Found {len(flac_files)} .flac files. Copying with transcripts...")
    copied = 0
    for flac in flac_files:
        stem = flac.stem
        if stem not in stem_to_transcript:
            print(f"No transcript for {stem}, skipping")
            continue
        # Copy the flac file
        target_flac = audio_dir / flac.name
        if not target_flac.exists():
            target_flac.write_bytes(flac.read_bytes())
        # Write the transcript file
        target_txt = audio_dir / f"{stem}.txt"
        if not target_txt.exists():
            target_txt.write_text(stem_to_transcript[stem])
        copied += 1
        if copied >= 50:
            break

    print(f"Done. Copied {copied} files to {audio_dir}")

if __name__ == "__main__":
    download_and_extract()