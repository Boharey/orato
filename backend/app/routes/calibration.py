"""
calibration.py
POST /api/calibration/run  — accepts a short video, extracts neutral gaze values,
                             saves to user's DB record.
GET  /api/calibration/status — returns whether user has calibration data
"""

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from fastapi import APIRouter, Depends, UploadFile, File
import uuid, os, asyncio

from app.db.database import db
from app.core.security import get_current_user

router = APIRouter(prefix="/calibration")

MODEL_PATH = "app/models/face_landmarker.task"

# Same constants as video_analyzer.py
NOSE_TIP, CHIN = 1, 152
LEFT_EYE_CORNER, RIGHT_EYE_CORNER = 33, 263
LEFT_MOUTH, RIGHT_MOUTH = 61, 291
LEFT_IRIS_IDX, RIGHT_IRIS_IDX = 468, 473
LEFT_INNER, LEFT_OUTER = 133, 33
RIGHT_INNER, RIGHT_OUTER = 362, 263
LEFT_TOP, LEFT_BOT = 159, 145
RIGHT_TOP, RIGHT_BOT = 386, 374
LID_NORM_MIN, LID_NORM_MAX = 6.0, 16.0

DISCARD_FRAMES = 60   # ~2s at 30fps — discard while user settles
CALIB_FRAMES   = 450  # ~15s at 30fps — actual calibration window


def _lm_px(lm, idx, w, h):
    return np.array([lm[idx][0] * w, lm[idx][1] * h])

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


def _extract_calibration(video_path: str) -> dict | None:
    """
    Process calibration video. Returns neutral gaze values or None if failed.
    First DISCARD_FRAMES are thrown away (user settling).
    Next CALIB_FRAMES are averaged for neutral baseline.
    """
    if not os.path.exists(MODEL_PATH):
        return None

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
        return None

    frame_n = 0
    calib_buffer = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        fh, fw = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = detector.detect(mp_img)

        if not result.face_landmarks:
            frame_n += 1
            continue

        lm = np.array([(p.x, p.y) for p in result.face_landmarks[0]])
        has_iris = len(lm) > 473

        if not has_iris:
            frame_n += 1
            continue

        # Skip discard frames
        if frame_n < DISCARD_FRAMES:
            frame_n += 1
            continue

        # Collect calibration frames
        if len(calib_buffer) >= CALIB_FRAMES:
            break

        l_iris = _lm_px(lm, LEFT_IRIS_IDX, fw, fh)
        r_iris = _lm_px(lm, RIGHT_IRIS_IDX, fw, fh)
        l_off = iris_offset(l_iris, _lm_px(lm, LEFT_INNER, fw, fh), _lm_px(lm, LEFT_OUTER, fw, fh))
        r_off = iris_offset(r_iris, _lm_px(lm, RIGHT_INNER, fw, fh), _lm_px(lm, RIGHT_OUTER, fw, fh))
        horiz = (l_off[0] + r_off[0]) / 2.0
        vert  = (l_off[1] + r_off[1]) / 2.0

        R = solve_head_pose(lm, fw, fh)
        pitch = float(np.arcsin(-R[2, 0]))
        yaw   = float(np.arctan2(R[1, 0], R[0, 0]))

        calib_buffer.append((pitch, vert, horiz, yaw))
        frame_n += 1

    cap.release()

    if len(calib_buffer) < 30:  # need at least 1s of good data
        return None

    return {
        "neutral_pitch": round(float(np.mean([x[0] for x in calib_buffer])), 6),
        "neutral_vert":  round(float(np.mean([x[1] for x in calib_buffer])), 6),
        "neutral_horiz": round(float(np.mean([x[2] for x in calib_buffer])), 6),
        "neutral_yaw":   round(float(np.mean([x[3] for x in calib_buffer])), 6),
        "calibrated":    True,
        "frames_used":   len(calib_buffer),
    }


@router.post("/run")
async def run_calibration(video: UploadFile = File(...), user=Depends(get_current_user)):
    uid = str(uuid.uuid4())
    webm_path = f"/tmp/calib_{uid}.webm"

    with open(webm_path, "wb") as f:
        f.write(await video.read())

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _extract_calibration, webm_path)

    try:
        os.remove(webm_path)
    except OSError:
        pass

    if result is None:
        return {"success": False, "message": "Calibration failed — ensure face is visible and well-lit"}

    # Save to DB
    await db.users.update_one(
        {"_id": user["id"]},
        {"$set": {"gaze_calibration": result}},
        upsert=False,
    )

    return {
        "success": True,
        "message": f"Calibration complete ({result['frames_used']} frames)",
        "calibration": result,
    }


@router.get("/status")
async def calibration_status(user=Depends(get_current_user)):
    doc = await db.users.find_one({"_id": user["id"]})
    if not doc:
        return {"calibrated": False}
    calib = doc.get("gaze_calibration")
    if not calib:
        return {"calibrated": False}
    return {"calibrated": True, "calibration": calib}