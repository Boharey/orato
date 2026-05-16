"""
video_compositor.py — generates annotated output video
Draws gaze label, rolling captions, filler highlights.
"""
import cv2
import numpy as np
import os

def _zone_at(gaze_per_frame, frame_idx):
    """Binary search closest frame entry."""
    for g in reversed(gaze_per_frame):
        if g["frame"] <= frame_idx:
            return g["zone"]
    return "UNKNOWN"

def _words_at(all_words, t, window=4):
    """Return up to `window` words centered on current time."""
    result = []
    for i, w in enumerate(all_words):
        if w["start"] <= t <= w["end"]:
            start = max(0, i - window // 2)
            end = min(len(all_words), start + window)
            return all_words[start:end], i - start
    # between words — find next upcoming
    for i, w in enumerate(all_words):
        if w["start"] > t:
            start = max(0, i - 1)
            end = min(len(all_words), start + window)
            return all_words[start:end], -1
    return [], -1

def _is_filler(word_entry, filler_instances):
    for f in filler_instances:
        if abs(f["start"] - word_entry["start"]) < 0.05:
            return True
    return False

def generate_annotated_video(
    input_video_path: str,
    output_video_path: str,
    all_words: list,
    filler_instances: list,
    gaze_per_frame: list,
) -> bool:
    """
    Returns True on success, False on failure.
    Safe to call — will not raise, just return False.
    """
    try:
        cap = cv2.VideoCapture(input_video_path)
        if not cap.isOpened():
            return False

        fps  = cap.get(cv2.CAP_PROP_FPS) or 30.0
        w    = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h    = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        os.makedirs(os.path.dirname(output_video_path), exist_ok=True)
        # Write to a temp file first — mp4v isn't browser-compatible
        temp_path = output_video_path + "_temp.mp4"
        out = cv2.VideoWriter(
            temp_path,
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps, (w, h)
        )

        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            t = frame_idx / fps

            # ── Gaze label (top-left) ────────────────────────────────
            zone  = _zone_at(gaze_per_frame, frame_idx)
            color = (0, 210, 80) if zone == "ON_CAMERA" else (50, 50, 230)
            label = "FOCUS ON" if zone == "ON_CAMERA" else "FOCUS OFF"
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.85, 2)
            label_x = (w - label_size[0]) // 2
            cv2.rectangle(frame, (label_x - 10, 10), (label_x + label_size[0] + 10, 50), (0, 0, 0), -1)
            cv2.putText(frame, label, (label_x, 38),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.85, color, 2, cv2.LINE_AA)

            # ── Caption bar (bottom) ─────────────────────────────────
            words_window, active_idx = _words_at(all_words, t)
            if words_window:
                bar_h = 50
                bar_y = h - 90          # lifted above the very bottom
                cv2.rectangle(frame, (0, bar_y), (w, bar_y + bar_h), (0, 0, 0), -1)
                # measure total width of all words to center them
                total_w = 0
                for wd in words_window:
                    is_active = (words_window.index(wd) == active_idx)
                    fs = 0.75 if is_active else 0.65
                    th = 2 if is_active else 1
                    (tw, _), _ = cv2.getTextSize(wd["word"] + " ", cv2.FONT_HERSHEY_SIMPLEX, fs, th)
                    total_w += tw
                x_cursor = max(20, (w - total_w) // 2)

                for i, wd in enumerate(words_window):
                    is_active = (i == active_idx)
                    is_fill   = _is_filler(wd, filler_instances)

                    if is_fill:
                        txt_color = (0, 220, 255)   # yellow — filler
                    elif is_active:
                        txt_color = (255, 255, 255) # white  — current
                    else:
                        txt_color = (160, 160, 160) # gray   — context

                    font_scale = 0.75 if is_active else 0.65
                    thickness  = 2 if is_active else 1
                    text = wd["word"] + " "
                    cv2.putText(frame, text, (x_cursor, bar_y + 33),
                                cv2.FONT_HERSHEY_SIMPLEX, font_scale,
                                txt_color, thickness, cv2.LINE_AA)
                    (tw, _), _ = cv2.getTextSize(
                        text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
                    x_cursor += tw

            out.write(frame)
            frame_idx += 1

        cap.release()
        out.release()

        import subprocess
        # temp_path already exists — OpenCV wrote directly to it

        result = subprocess.run([
            "ffmpeg", "-y",
            "-i", temp_path,
            "-i", input_video_path,
            "-c:v", "libx264",
            "-c:a", "aac",
            "-b:a", "128k",
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-shortest",
            "-pix_fmt", "yuv420p",
            output_video_path,
        ], capture_output=True)

        if result.returncode != 0:
            print(f"[compositor] ffmpeg error: {result.stderr.decode()}")

        try: os.remove(temp_path)
        except OSError: pass

        return True

    except Exception as e:
        print(f"[video_compositor] error: {e}")
        return False