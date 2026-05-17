"""
video_compositor.py — generates annotated output video
Draws gaze label, rolling captions, filler highlights.

Fixes:
1. Cap FPS — browser recorders report 250fps which ffmpeg rejects immediately
2. Extract audio to temp file first, completely separate from frame pipe
3. Check proc.stdin not closed before writing (ffmpeg early exit guard)
4. Print real ffmpeg stderr so failures are visible
"""

import cv2
import os
import subprocess


def _zone_at(gaze_per_frame, frame_idx):
    for g in reversed(gaze_per_frame):
        if g["frame"] <= frame_idx:
            return g["zone"]
    return "UNKNOWN"


def _words_at(all_words, t, window=4):
    for i, w in enumerate(all_words):
        if w["start"] <= t <= w["end"]:
            start = max(0, i - window // 2)
            end   = min(len(all_words), start + window)
            return all_words[start:end], i - start
    for i, w in enumerate(all_words):
        if w["start"] > t:
            start = max(0, i - 1)
            end   = min(len(all_words), start + window)
            return all_words[start:end], -1
    return [], -1


def _is_filler(word_entry, filler_instances):
    for f in filler_instances:
        if abs(f["start"] - word_entry["start"]) < 0.05:
            return True
    return False


def _extract_audio(input_path: str, audio_out: str) -> bool:
    """Extract audio to a separate aac file. Returns True if successful."""
    result = subprocess.run([
        "ffmpeg", "-y",
        "-i", input_path,
        "-vn",
        "-acodec", "aac",
        "-b:a", "128k",
        audio_out,
    ], capture_output=True)
    has = result.returncode == 0 and os.path.exists(audio_out) and os.path.getsize(audio_out) > 0
    if not has:
        print(f"[compositor] audio extract stderr: {result.stderr.decode()[:300]}")
    return has


def generate_annotated_video(
    input_video_path: str,
    output_video_path: str,
    all_words: list,
    filler_instances: list,
    gaze_per_frame: list,
) -> bool:
    audio_tmp = None
    try:
        print(f"[compositor] input        : {input_video_path}")
        print(f"[compositor] output       : {output_video_path}")
        print(f"[compositor] gaze_frames  : {len(gaze_per_frame)}")
        print(f"[compositor] words        : {len(all_words)}")

        # ── Step 1: extract audio BEFORE opening video with OpenCV ───────────
        audio_tmp = input_video_path + "_audio.aac"
        has_audio = _extract_audio(input_video_path, audio_tmp)
        print(f"[compositor] has_audio    : {has_audio}")
        if not has_audio:
            try: os.remove(audio_tmp)
            except OSError: pass
            audio_tmp = None

        # ── Step 2: open video ────────────────────────────────────────────────
        cap = cv2.VideoCapture(input_video_path)
        if not cap.isOpened():
            print("[compositor] ERROR: cannot open video")
            return False

        raw_fps = cap.get(cv2.CAP_PROP_FPS)
        # Browser MediaRecorder sometimes reports 250fps or 0fps — both are wrong.
        # Clamp to a sane range. 30fps is the safe default for webm recordings.
        if raw_fps <= 0 or raw_fps > 60:
            fps = 30.0
            print(f"[compositor] WARNING: raw fps={raw_fps} → clamped to {fps}")
        else:
            fps = raw_fps

        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        print(f"[compositor] {w}x{h} @ {fps}fps  (raw_fps={raw_fps})")

        # Convert to absolute — ffmpeg uses its own cwd and cannot resolve relative paths
        output_video_path = os.path.abspath(output_video_path)
        print(f"[compositor] abs output   : {output_video_path}")

        os.makedirs(os.path.dirname(os.path.abspath(output_video_path)), exist_ok=True)

        # ── Step 3: build ffmpeg command ──────────────────────────────────────
        ffmpeg_cmd = [
            "ffmpeg", "-y",

            # input 0: annotated raw frames from stdin
            "-f", "rawvideo",
            "-vcodec", "rawvideo",
            "-pix_fmt", "bgr24",
            "-s", f"{w}x{h}",
            "-r", str(fps),        # use clamped fps, not raw
            "-i", "pipe:0",
        ]

        if audio_tmp:
            ffmpeg_cmd += ["-i", audio_tmp]

        ffmpeg_cmd += ["-map", "0:v:0"]
        if audio_tmp:
            ffmpeg_cmd += ["-map", "1:a:0"]

        ffmpeg_cmd += [
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-vsync", "cfr",
            "-pix_fmt", "yuv420p",
        ]
        if audio_tmp:
            ffmpeg_cmd += ["-c:a", "aac", "-b:a", "128k", "-shortest"]

        ffmpeg_cmd += ["-movflags", "+faststart", output_video_path]

        print(f"[compositor] ffmpeg: {' '.join(ffmpeg_cmd)}")

        proc = subprocess.Popen(
            ffmpeg_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )

        # ── Step 4: annotate and pipe frames ──────────────────────────────────
        frame_idx     = 0
        drawn_gaze    = 0
        drawn_caption = 0
        pipe_error    = False

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Guard: if ffmpeg has exited early, stop trying to write
            if proc.poll() is not None:
                print(f"[compositor] ffmpeg exited early at frame {frame_idx}")
                pipe_error = True
                break

            t = frame_idx / fps

            # Gaze label — top center
            zone  = _zone_at(gaze_per_frame, frame_idx)
            color = (0, 210, 80) if zone == "ON_CAMERA" else (50, 50, 230)
            label = "FOCUS ON" if zone == "ON_CAMERA" else "FOCUS OFF"
            if zone != "UNKNOWN":
                drawn_gaze += 1
            lsz, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.85, 2)
            lx = (w - lsz[0]) // 2
            cv2.rectangle(frame, (lx - 10, 10), (lx + lsz[0] + 10, 50), (0, 0, 0), -1)
            cv2.putText(frame, label, (lx, 38),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.85, color, 2, cv2.LINE_AA)

            # Caption bar — bottom
            words_window, active_idx = _words_at(all_words, t)
            if words_window:
                drawn_caption += 1
                bar_y = h - 90
                cv2.rectangle(frame, (0, bar_y), (w, bar_y + 50), (0, 0, 0), -1)

                total_tw = 0
                for wd in words_window:
                    ia = (words_window.index(wd) == active_idx)
                    (tw, _), _ = cv2.getTextSize(
                        wd["word"] + " ", cv2.FONT_HERSHEY_SIMPLEX,
                        0.75 if ia else 0.65, 2 if ia else 1)
                    total_tw += tw
                x_cursor = max(20, (w - total_tw) // 2)

                for i, wd in enumerate(words_window):
                    is_active = (i == active_idx)
                    is_fill   = _is_filler(wd, filler_instances)
                    txt_color = (
                        (0, 220, 255)   if is_fill   else
                        (255, 255, 255) if is_active else
                        (160, 160, 160)
                    )
                    fs = 0.75 if is_active else 0.65
                    th = 2    if is_active else 1
                    text = wd["word"] + " "
                    cv2.putText(frame, text, (x_cursor, bar_y + 33),
                                cv2.FONT_HERSHEY_SIMPLEX, fs, txt_color, th, cv2.LINE_AA)
                    (tw, _), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, fs, th)
                    x_cursor += tw

            try:
                proc.stdin.write(frame.tobytes())
            except (BrokenPipeError, OSError) as e:
                print(f"[compositor] pipe write failed at frame {frame_idx}: {e}")
                pipe_error = True
                break

            frame_idx += 1

        cap.release()

        # Close stdin then wait — do NOT call communicate() after manual close
        # communicate() tries to flush stdin internally which crashes if already closed
        if not pipe_error:
            try:
                proc.stdin.close()
            except OSError:
                pass

        # Wait for ffmpeg to finish and collect stderr
        try:
            stderr = proc.stderr.read()
        except Exception:
            stderr = b""
        proc.wait()

        print(f"[compositor] frames written : {frame_idx}")
        print(f"[compositor] gaze labels    : {drawn_gaze}")
        print(f"[compositor] captions       : {drawn_caption}")
        print(f"[compositor] pipe_error     : {pipe_error}")
        print(f"[compositor] ffmpeg rc      : {proc.returncode}")
        # Always print ffmpeg stderr so we can see what went wrong
        if stderr:
            print(f"[compositor] ffmpeg stderr:\n{stderr.decode(errors='replace')}")

        if proc.returncode != 0 or pipe_error:
            return False

        print(f"[compositor] success → {output_video_path}")
        return True

    except Exception as e:
        import traceback
        print(f"[compositor] exception: {e}")
        traceback.print_exc()
        return False

    finally:
        if audio_tmp and os.path.exists(audio_tmp):
            try: os.remove(audio_tmp)
            except OSError: pass