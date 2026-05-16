"""
video_analyzer.py
Processes a video file, returns blink_count, attention_score, gaze_on_screen_pct.
If user_calibration dict provided, uses those neutral values instead of
computing from the video itself.
"""

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import os

LEFT_EYE_IDX  = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_IDX = [362, 385, 387, 263, 373, 380]
LEFT_IRIS_IDX  = 468
RIGHT_IRIS_IDX = 473
LEFT_INNER, LEFT_OUTER, LEFT_TOP, LEFT_BOT     = 133, 33, 159, 145
RIGHT_INNER, RIGHT_OUTER, RIGHT_TOP, RIGHT_BOT = 362, 263, 386, 374

EAR_BLINK_THRESH = 0.20
GAZE_H_THRESH    = 0.12
GAZE_V_THRESH    = 0.12
MODEL_PATH       = "app/models/face_landmarker.task"

DISCARD_FRAMES = 30
CALIB_FRAMES   = 60
H_SCALE        = 1.8
V_SCALE_UP     = 7.0
V_SCALE_DOWN   = 5.0
HEAD_YAW_WEIGHT     = 0.4
HEAD_PITCH_UP_DEG   = np.deg2rad(8)
HEAD_PITCH_DOWN_DEG = np.deg2rad(8)
LID_NORM_MIN = 6.0
LID_NORM_MAX = 16.0
NOSE_TIP, CHIN = 1, 152
LEFT_EYE_CORNER, RIGHT_EYE_CORNER = 33, 263
LEFT_MOUTH, RIGHT_MOUTH = 61, 291


def _lm_px(lm, idx, w, h):
    return np.array([lm[idx][0] * w, lm[idx][1] * h])

def _ear(pts):
    A = np.linalg.norm(pts[1] - pts[5])
    B = np.linalg.norm(pts[2] - pts[4])
    C = np.linalg.norm(pts[0] - pts[3])
    return (A + B) / (2.0 * C + 1e-6)

def iris_offset(iris, inner, outer):
    eye_vec = outer - inner
    return (iris - (inner + outer) / 2) / (np.linalg.norm(eye_vec) + 1e-6)

def eyelid_ratio(top, bot):
    return float(np.linalg.norm(bot - top))

def solve_head_pose(lm, w, h):
    image_pts = np.array([_lm_px(lm, idx, w, h) for idx in
                          [NOSE_TIP, CHIN, LEFT_EYE_CORNER, RIGHT_EYE_CORNER,
                           LEFT_MOUTH, RIGHT_MOUTH]], dtype=np.float32)
    model_pts = np.array([(0,0,0),(0,-330,-65),(-225,170,-135),(225,170,-135),
                          (-150,-150,-125),(150,-150,-125)], dtype=np.float32)
    cam = np.array([[w,0,w/2],[0,w,h/2],[0,0,1]], dtype=np.float32)
    ok, rvec, _ = cv2.solvePnP(model_pts, image_pts, cam,
                                np.zeros((4,1)), flags=cv2.SOLVEPNP_ITERATIVE)
    if not ok:
        return np.eye(3, dtype=np.float32)
    R, _ = cv2.Rodrigues(rvec)
    return R

def _classify_zone(dx, dy, h_thresh, v_thresh):
    if abs(dx) < h_thresh and abs(dy) < v_thresh:
        return "ON_CAMERA"
    if abs(dx) >= abs(dy):
        return "LEFT" if dx < 0 else "RIGHT"
    return "UP" if dy < 0 else "DOWN"


def analyze_video(video_path: str, user_calibration: dict = None, return_per_frame: bool = False) -> dict:
    """
    user_calibration: optional dict with keys:
        neutral_horiz, neutral_vert, neutral_pitch, neutral_yaw
    If provided, skips in-video calibration — uses user's personal baseline.
    """
    null_result = {"blink_count": None, "attention_score": None, "gaze_on_screen_pct": None}

    if not os.path.exists(MODEL_PATH):
        return null_result

    BaseOptions           = mp.tasks.BaseOptions
    FaceLandmarker        = vision.FaceLandmarker
    FaceLandmarkerOptions = vision.FaceLandmarkerOptions
    VisionRunningMode     = vision.RunningMode

    opts = FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=VisionRunningMode.IMAGE,
        num_faces=1,
    )
    detector = FaceLandmarker.create_from_options(opts)
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return null_result

    # ── If user has personal calibration, use it immediately ──────────────────
    has_user_calib = (
        user_calibration is not None
        and user_calibration.get("calibrated", False)
    )

    if has_user_calib:
        calib_state    = 2   # skip calibration phase entirely
        neutral_pitch  = user_calibration["neutral_pitch"]
        neutral_vert   = user_calibration["neutral_vert"]
        neutral_horiz  = user_calibration["neutral_horiz"]
        neutral_yaw    = user_calibration["neutral_yaw"]
    else:
        calib_state    = 0
        neutral_pitch = neutral_vert = neutral_horiz = neutral_yaw = 0.0

    calib_counter = 0
    calib_buffer  = []

    frame_n     = 0
    blink_count = 0
    ear_below   = 0
    on_cam_total = 0
    valid_frames = 0
    frame_zones  = []   # NEW


    while True:
        ret, frame = cap.read()
        if not ret:
            break

        fh, fw = frame.shape[:2]
        rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = detector.detect(mp_img)

        if not result.face_landmarks:
            frame_n += 1
            continue

        lm        = np.array([(p.x, p.y) for p in result.face_landmarks[0]])
        has_iris  = len(lm) > 473

        # EAR / blink
        le_pts  = np.array([_lm_px(lm, i, fw, fh) for i in LEFT_EYE_IDX])
        re_pts  = np.array([_lm_px(lm, i, fw, fh) for i in RIGHT_EYE_IDX])
        avg_ear = (_ear(le_pts) + _ear(re_pts)) / 2.0
        is_blink = avg_ear < EAR_BLINK_THRESH
        if is_blink:
            ear_below += 1
        else:
            if ear_below >= 2:
                blink_count += 1
            ear_below = 0

        # Iris offsets
        if has_iris:
            l_iris = _lm_px(lm, LEFT_IRIS_IDX, fw, fh)
            r_iris = _lm_px(lm, RIGHT_IRIS_IDX, fw, fh)
            l_off  = iris_offset(l_iris, _lm_px(lm, LEFT_INNER, fw, fh), _lm_px(lm, LEFT_OUTER, fw, fh))
            r_off  = iris_offset(r_iris, _lm_px(lm, RIGHT_INNER, fw, fh), _lm_px(lm, RIGHT_OUTER, fw, fh))
            horiz    = (l_off[0] + r_off[0]) / 2.0
            vert_avg = (l_off[1] + r_off[1]) / 2.0
            l_top = _lm_px(lm, LEFT_TOP, fw, fh);  l_bot = _lm_px(lm, LEFT_BOT, fw, fh)
            r_top = _lm_px(lm, RIGHT_TOP, fw, fh); r_bot = _lm_px(lm, RIGHT_BOT, fw, fh)
            lid_avg  = (eyelid_ratio(l_top, l_bot) + eyelid_ratio(r_top, r_bot)) / 2.0
            lid_norm = np.clip((lid_avg - LID_NORM_MIN) / (LID_NORM_MAX - LID_NORM_MIN), 0.0, 1.0)
        else:
            horiz = vert_avg = lid_norm = 0.0

        # Head pose
        R     = solve_head_pose(lm, fw, fh)
        pitch = float(np.arcsin(-R[2, 0]))
        yaw   = float(np.arctan2(R[1, 0], R[0, 0]))

        # In-video calibration (only if no user calibration)
        if not has_user_calib:
            if calib_state == 0:
                calib_counter += 1
                if calib_counter >= DISCARD_FRAMES:
                    calib_state = 1; calib_counter = 0; calib_buffer.clear()
            elif calib_state == 1:
                calib_buffer.append((pitch, vert_avg, horiz, yaw))
                calib_counter += 1
                if calib_counter >= CALIB_FRAMES:
                    neutral_pitch = float(np.mean([x[0] for x in calib_buffer]))
                    neutral_vert  = float(np.mean([x[1] for x in calib_buffer]))
                    neutral_horiz = float(np.mean([x[2] for x in calib_buffer]))
                    neutral_yaw   = float(np.mean([x[3] for x in calib_buffer]))
                    calib_state = 2

        # Gaze classification
        if calib_state == 2 and has_iris and not is_blink:
            dx_eye  = (horiz - neutral_horiz) * H_SCALE
            dx_head = (yaw - neutral_yaw) * 1.2
            x_final = (1 - HEAD_YAW_WEIGHT) * dx_eye + HEAD_YAW_WEIGHT * dx_head

            rel_pitch = pitch - neutral_pitch
            if rel_pitch > HEAD_PITCH_DOWN_DEG:
                y_final = 0.6
            elif rel_pitch < -HEAD_PITCH_UP_DEG:
                y_final = -0.6
            else:
                dy_raw     = vert_avg - neutral_vert
                scale      = V_SCALE_UP if dy_raw < 0 else V_SCALE_DOWN
                eye_weight = max(0.5, 1.0 - float(lid_norm))
                y_final    = dy_raw * scale * eye_weight

            zone = _classify_zone(x_final, y_final, GAZE_H_THRESH, GAZE_V_THRESH)
            valid_frames += 1
            if zone == "ON_CAMERA":
                on_cam_total += 1
            frame_zones.append({"frame": frame_n, "time": round(frame_n / (cap.get(cv2.CAP_PROP_FPS) or 30), 3), "zone": zone})  # NEW

        frame_n += 1

    cap.release()

    if valid_frames == 0:
        return {"blink_count": blink_count, "attention_score": None, "gaze_on_screen_pct": None, "gaze_per_frame": []}  # NEW

    gaze_on_pct    = round((on_cam_total / valid_frames) * 100, 1)
    attention_score = round(gaze_on_pct * 0.85 + min(100, gaze_on_pct) * 0.15, 1)

    return {
        "blink_count":        blink_count,
        "attention_score":    attention_score,
        "gaze_on_screen_pct": gaze_on_pct,
        "gaze_per_frame":     frame_zones if return_per_frame else [],  # NEW
    }