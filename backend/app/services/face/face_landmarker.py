"""
face_landmarker.py
------------------
MediaPipe FaceLandmarker wrapper.

Per-frame:
  - Eye metrics (via EyeTracker)
  - Head pose: yaw / pitch / roll via solvePnP
  - Smile score from lip-corner to lip-width ratio
  - Brow tension (surprise / stress indicator)

Session-level:
  - Accumulates head pose history, smile events, brow events
  - Exposes session_summary() for final scoring
"""

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from src.face.eye_tracker import EyeTracker

MODEL_PATH = "models/face_landmarker.task"

BaseOptions           = mp.tasks.BaseOptions
FaceLandmarker        = vision.FaceLandmarker
FaceLandmarkerOptions = vision.FaceLandmarkerOptions
VisionRunningMode     = vision.RunningMode


# ─── 3-D model points for solvePnP (standard 6-point face model) ─────────────
_MODEL_3D = np.array([
    [0.0,    0.0,    0.0],       # Nose tip          (1)
    [0.0,   -330.0, -65.0],      # Chin              (152)
    [-225.0,  170.0, -135.0],    # Left eye corner   (33)
    [225.0,   170.0, -135.0],    # Right eye corner  (263)
    [-150.0, -150.0, -125.0],    # Left mouth corner (61)
    [150.0,  -150.0, -125.0],    # Right mouth corner(291)
], dtype=np.float64)

_MODEL_LM_IDX = [1, 152, 33, 263, 61, 291]   # FaceMesh indices matching above

# ─── Smile landmark indices ───────────────────────────────────────────────────
MOUTH_LEFT   = 61
MOUTH_RIGHT  = 291
UPPER_LIP    = 13
LOWER_LIP    = 14
CHEEK_LEFT   = 116
CHEEK_RIGHT  = 345

# ─── Brow landmarks (inner brow raise = stress / surprise) ───────────────────
BROW_LEFT_INNER  = 107
BROW_RIGHT_INNER = 336
BROW_LEFT_MID    = 105
BROW_RIGHT_MID   = 334
EYE_LEFT_TOP     = 159
EYE_RIGHT_TOP    = 386


# ─── FaceAnalyser (one instance per session) ─────────────────────────────────

class FaceAnalyser:
    def __init__(self):
        options = FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=MODEL_PATH),
            running_mode=VisionRunningMode.IMAGE,
            num_faces=1,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self._detector = FaceLandmarker.create_from_options(options)
        self._eye_tracker = EyeTracker()

        # Session accumulators
        self.yaw_history:   list[float] = []
        self.pitch_history: list[float] = []
        self.roll_history:  list[float] = []
        self.smile_history: list[float] = []
        self.brow_history:  list[float] = []
        self.total_frames = 0
        self.no_face_frames = 0

    # ── public: process one frame ─────────────────────────────────────────────

    def process_frame(self, frame: np.ndarray) -> tuple[np.ndarray, dict]:
        """
        Run full face analysis on a BGR frame.
        Returns annotated frame + metrics dict.
        """
        rgb      = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result   = self._detector.detect(mp_image)

        h, w = frame.shape[:2]
        self.total_frames += 1

        if not result.face_landmarks:
            self.no_face_frames += 1
            self._draw_no_face(frame)
            return frame, {"face_detected": False}

        face_lms = result.face_landmarks[0]
        lm = np.array([(p.x, p.y) for p in face_lms])  # shape (N, 2)

        # ── Eye metrics ───────────────────────────────────────────────────────
        frame, eye_metrics = self._eye_tracker.process(frame, lm)

        # ── Head pose ─────────────────────────────────────────────────────────
        yaw, pitch, roll = self._head_pose(lm, w, h)
        self.yaw_history.append(yaw)
        self.pitch_history.append(pitch)
        self.roll_history.append(roll)

        # ── Smile score ───────────────────────────────────────────────────────
        smile = self._smile_score(lm, w, h)
        self.smile_history.append(smile)

        # ── Brow tension score ────────────────────────────────────────────────
        brow = self._brow_score(lm, h)
        self.brow_history.append(brow)

        # ── Overlays ──────────────────────────────────────────────────────────
        self._draw_overlays(frame, eye_metrics, yaw, pitch, roll, smile, brow, w, h)

        metrics = {
            "face_detected":  True,
            **eye_metrics,
            "yaw":            round(yaw, 1),
            "pitch":          round(pitch, 1),
            "roll":           round(roll, 1),
            "smile_score":    round(smile, 3),
            "brow_tension":   round(brow, 3),
            "head_centered":  abs(yaw) < 15 and abs(pitch) < 15,
        }
        return frame, metrics

    # ── Head pose via solvePnP ────────────────────────────────────────────────

    def _head_pose(self, lm, w, h):
        img_pts = np.array(
            [(lm[i][0] * w, lm[i][1] * h) for i in _MODEL_LM_IDX],
            dtype=np.float64
        )
        cam_matrix = np.array([
            [w, 0,   w / 2],
            [0, w,   h / 2],
            [0, 0,   1    ],
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1))

        ok, rvec, _ = cv2.solvePnP(
            _MODEL_3D, img_pts, cam_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )
        if not ok:
            return 0.0, 0.0, 0.0

        rmat, _ = cv2.Rodrigues(rvec)
        # Decompose rotation matrix to Euler angles
        sy = np.sqrt(rmat[0,0]**2 + rmat[1,0]**2)
        singular = sy < 1e-6
        if not singular:
            pitch = float(np.degrees(np.arctan2( rmat[2,1], rmat[2,2])))
            yaw   = float(np.degrees(np.arctan2(-rmat[2,0], sy)))
            roll  = float(np.degrees(np.arctan2( rmat[1,0], rmat[0,0])))
        else:
            pitch = float(np.degrees(np.arctan2(-rmat[1,2], rmat[1,1])))
            yaw   = float(np.degrees(np.arctan2(-rmat[2,0], sy)))
            roll  = 0.0
        return yaw, pitch, roll

    # ── Smile score ──────────────────────────────────────────────────────────

    def _smile_score(self, lm, w, h):
        """
        Ratio of mouth width to vertical lip gap.
        Higher = wider smile relative to face width.
        Normalise against cheek distance to handle face scale.
        Returns 0..1 approx.
        """
        def px(idx): return np.array([lm[idx][0]*w, lm[idx][1]*h])

        mouth_w  = np.linalg.norm(px(MOUTH_RIGHT) - px(MOUTH_LEFT))
        lip_h    = np.linalg.norm(px(LOWER_LIP)   - px(UPPER_LIP))
        face_w   = np.linalg.norm(px(CHEEK_RIGHT)  - px(CHEEK_LEFT)) + 1e-6

        # smile = wide mouth + relatively closed lips
        score = (mouth_w / face_w) - (lip_h / face_w) * 0.5
        return float(np.clip(score, 0, 1))

    # ── Brow tension score ────────────────────────────────────────────────────

    def _brow_score(self, lm, h):
        """
        Distance between inner brow and top of eye (normalised by face height).
        Low value = brows drawn down (tension/stress/confusion).
        High value = brows raised (surprise, engagement).
        Returns normalised 0..1.
        """
        def py(idx): return lm[idx][1] * h

        left_gap  = py(EYE_LEFT_TOP)  - py(BROW_LEFT_MID)
        right_gap = py(EYE_RIGHT_TOP) - py(BROW_RIGHT_MID)
        avg_gap   = (left_gap + right_gap) / 2.0

        # Normalise: typical gap ~10–30px; below 8px = tense, above 25px = raised
        score = float(np.clip(avg_gap / 30.0, 0, 1))
        return score

    # ── Overlays ──────────────────────────────────────────────────────────────

    def _draw_overlays(self, frame, eye_m, yaw, pitch, roll, smile, brow, w, h):
        font   = cv2.FONT_HERSHEY_SIMPLEX
        small  = 0.55
        medium = 0.7
        pad    = 10

        # ── Top-left HUD panel ────────────────────────────────────────────────
        panel_lines = [
            (f"Gaze: {eye_m.get('gaze_zone','?')}",
             (0, 220, 100) if eye_m.get("gaze_zone") == "ON_CAMERA" else (0, 100, 255)),
            (f"On-cam: {eye_m.get('on_camera_pct', 0):.0f}%",  (200, 200, 200)),
            (f"Blinks: {eye_m.get('blink_count', 0)}",          (200, 200, 200)),
            (f"EAR: {eye_m.get('ear', 0):.3f}",                 (200, 200, 200)),
        ]
        cv2.rectangle(frame, (0, 0), (220, 110), (0, 0, 0), -1)
        for i, (text, color) in enumerate(panel_lines):
            cv2.putText(frame, text, (pad, 25 + i*22),
                        font, small, color, 1, cv2.LINE_AA)

        # ── Top-right: head pose panel ────────────────────────────────────────
        pose_lines = [
            f"Yaw:   {yaw:+.1f}°",
            f"Pitch: {pitch:+.1f}°",
            f"Roll:  {roll:+.1f}°",
        ]
        pose_color = (0, 220, 100) if abs(yaw) < 15 and abs(pitch) < 15 else (0, 100, 255)
        panel_w = 180
        cv2.rectangle(frame, (w - panel_w, 0), (w, 80), (0, 0, 0), -1)
        for i, text in enumerate(pose_lines):
            cv2.putText(frame, text, (w - panel_w + pad, 22 + i*22),
                        font, small, pose_color, 1, cv2.LINE_AA)

        # ── Bottom-left: smile + brow ─────────────────────────────────────────
        smile_text = (
            "Smiling :)"   if smile > 0.55 else
            "Neutral"      if smile > 0.35 else
            "Tense :("
        )
        brow_text = (
            "Brows relaxed" if brow > 0.55 else
            "Brows tense"
        )
        cv2.rectangle(frame, (0, h-65), (240, h), (0, 0, 0), -1)
        cv2.putText(frame, smile_text, (pad, h - 45), font, small, (200,200,200), 1, cv2.LINE_AA)
        cv2.putText(frame, brow_text,  (pad, h - 22), font, small, (200,200,200), 1, cv2.LINE_AA)

        # ── Blink flash ───────────────────────────────────────────────────────
        if eye_m.get("blink_active"):
            cv2.putText(frame, "BLINK", (w//2 - 50, 50),
                        font, medium, (0, 0, 255), 2, cv2.LINE_AA)

        # ── Gaze off-cam alert (if off-camera for >2 seconds) ─────────────────
        if eye_m.get("on_camera_pct", 100) < 30:
            cv2.putText(frame, "LOOK AT CAMERA", (w//2 - 130, h - 80),
                        font, medium, (0, 80, 255), 2, cv2.LINE_AA)

        # ── Head pose guide arrows (subtle) ───────────────────────────────────
        cx, cy = w // 2, h // 2
        if abs(yaw) > 20:
            arrow_dir = (-30, 0) if yaw > 0 else (30, 0)
            cv2.arrowedLine(frame, (cx, cy), (cx + arrow_dir[0], cy + arrow_dir[1]),
                           (0, 180, 255), 2, tipLength=0.4)

    def _draw_no_face(self, frame):
        h, w = frame.shape[:2]
        cv2.putText(frame, "No face detected", (w//2 - 120, h//2),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 200), 2)

    # ── Session summary ───────────────────────────────────────────────────────

    def session_summary(self) -> dict:
        """
        Merged summary from eye tracker + head pose + smile + brow.
        Passed to session_report.py for final scoring.
        """
        eye_sum = self._eye_tracker.session_summary()

        tf = max(self.total_frames, 1)
        return {
            **eye_sum,
            "face_detected_pct": round((tf - self.no_face_frames) / tf * 100, 1),
            "avg_yaw":           round(float(np.mean(np.abs(self.yaw_history)))   if self.yaw_history   else 0, 1),
            "avg_pitch":         round(float(np.mean(np.abs(self.pitch_history))) if self.pitch_history else 0, 1),
            "avg_roll":          round(float(np.mean(np.abs(self.roll_history)))  if self.roll_history  else 0, 1),
            "head_stability":    self._head_stability(),
            "smile_pct":         round(sum(1 for s in self.smile_history if s > 0.50) / tf * 100, 1),
            "avg_smile_score":   round(float(np.mean(self.smile_history)) if self.smile_history else 0, 3),
            "brow_tension_pct":  round(sum(1 for b in self.brow_history  if b < 0.35) / tf * 100, 1),
        }

    def _head_stability(self) -> float:
        """1.0 = perfectly still, 0.0 = very unstable."""
        if not self.yaw_history:
            return 1.0
        yaw_std   = float(np.std(self.yaw_history))
        pitch_std = float(np.std(self.pitch_history))
        combined  = (yaw_std + pitch_std) / 2.0
        # normalise: 0° std = 1.0, 20° std = 0.0
        return round(float(np.clip(1.0 - combined / 20.0, 0, 1)), 3)