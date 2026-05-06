"""
eye_tracker.py
--------------
Per-frame eye metrics:
  - EAR-based blink detection with debounce
  - Iris-ratio gaze direction (proper, not center_x heuristic)
  - Gaze zone classification → ON_CAMERA / LEFT / RIGHT / UP / DOWN
  - Kalman-smoothed iris position
  - Fixation vs saccade detection
"""

import numpy as np
import cv2


# ─── Landmark index constants ────────────────────────────────────────────────

# EAR points: [p1_inner, p2_upper-inner, p3_upper-outer, p4_outer, p5_lower-outer, p6_lower-inner]
LEFT_EYE_IDX  = [33,  160, 158, 133, 153, 144]
RIGHT_EYE_IDX = [362, 385, 387, 263, 373, 380]

# Iris centers (only available with refine_landmarks=True)
LEFT_IRIS_IDX  = 468
RIGHT_IRIS_IDX = 473

# Eye corner anchors for iris-ratio denominator
# For BOTH eyes the ratio is computed left-to-right in image space:
#   inner = the corner closer to the nose (nasal canthus)
#   outer = the corner closer to the ear  (temporal canthus)
# Left eye:  outer=33 is on the LEFT in image, inner=133 is on the RIGHT
#            so we use OUTER as x-origin to go left→right naturally.
# Right eye: inner=362 is on the LEFT, outer=263 is on the RIGHT → same order.
LEFT_INNER  = 33;   LEFT_OUTER  = 133   # image-left → image-right for left eye
LEFT_TOP    = 159;  LEFT_BOT    = 145
RIGHT_INNER = 362;  RIGHT_OUTER = 263   # image-left → image-right for right eye
RIGHT_TOP   = 386;  RIGHT_BOT   = 374

# EAR threshold
EAR_BLINK_THRESH  = 0.20
EAR_CONSEC_FRAMES = 2          # frames EAR must be below thresh to count as blink

# Gaze zone thresholds (iris ratio deviation from 0.5)
# Calibrated against real iris landmark output — wider than theoretical
# because iris position has natural variance even when looking straight ahead.
GAZE_H_THRESH = 0.18           # horizontal: >0.18 off-center → left/right
GAZE_V_THRESH = 0.15           # vertical:   >0.15 off-center → up/down

# Fixation detection
FIXATION_THRESH_PX = 20        # max spread in px across buffer to call it a fixation
FIXATION_BUFFER_N  = 8         # frames (~250ms at 30fps)


# ─── Simple Kalman smoother (1-D, applied per axis) ─────────────────────────

class KalmanSmoother1D:
    """Constant-velocity Kalman filter for one scalar signal."""
    def __init__(self, process_noise=1e-3, measurement_noise=1e-1):
        self.x = None          # state estimate
        self.P = 1.0           # estimate covariance
        self.Q = process_noise
        self.R = measurement_noise

    def update(self, z):
        if self.x is None:
            self.x = z
            return z
        # Predict
        P_pred = self.P + self.Q
        # Update
        K = P_pred / (P_pred + self.R)
        self.x = self.x + K * (z - self.x)
        self.P = (1 - K) * P_pred
        return self.x


# ─── Stateful tracker (one instance per session) ─────────────────────────────

class EyeTracker:
    def __init__(self):
        # Kalman smoothers for iris ratio (left + right, x + y)
        self._kf = {
            "x": KalmanSmoother1D(), "y": KalmanSmoother1D(),
        }

        # Blink debounce
        self._ear_below_count = 0
        

        # Fixation buffer: list of (screen_x, screen_y) smoothed positions
        self._fix_buf = []

        # Session accumulators (read by session_report)
        self.total_frames   = 0
        self.on_camera_frames = 0
        self.blink_count    = 0
        self.blink_durations = []
        self._blink_start = None
        self.gaze_zone_history = []
        self.ear_history = []
        self.iris_rx_history = []
        self.iris_ry_history = []
        self.fixation_frames = 0
        self.saccade_frames  = 0
        self.off_camera_streak = 0
        self.max_off_camera_streak = 0

    # ── helpers ──────────────────────────────────────────────────────────────

    def _lm(self, landmarks, idx, w, h):
        """Return landmark as pixel coords."""
        return np.array([landmarks[idx][0] * w, landmarks[idx][1] * h])

    def _ear(self, eye_pts):
        A = np.linalg.norm(eye_pts[1] - eye_pts[5])
        B = np.linalg.norm(eye_pts[2] - eye_pts[4])
        C = np.linalg.norm(eye_pts[0] - eye_pts[3])
        return (A + B) / (2.0 * C + 1e-6)

    def _iris_ratio(self, iris_px, inner_px, outer_px, top_px, bot_px):
        """
        Compute (ratio_x, ratio_y) where 0.5 = dead center.
        ratio_x: 0 = fully inner, 1 = fully outer (LEFT iris: inner=nasal)
        ratio_y: 0 = top, 1 = bottom
        """
        w = np.linalg.norm(outer_px - inner_px) + 1e-6
        h = np.linalg.norm(bot_px   - top_px)   + 1e-6
        rx = (iris_px[0] - inner_px[0]) / w
        ry = (iris_px[1] - top_px[1])   / h
        return float(np.clip(rx, 0, 1)), float(np.clip(ry, 0, 1))

    def _classify_zone(self, rx, ry):
        dx = rx - 0.5
        dy = ry - 0.5
        if abs(dx) < GAZE_H_THRESH and abs(dy) < GAZE_V_THRESH:
            return "ON_CAMERA"
        if abs(dx) >= abs(dy):
            return "LEFT" if dx < 0 else "RIGHT"
        return "UP" if dy < 0 else "DOWN"

    def _update_fixation(self, sx, sy):
        self._fix_buf.append((sx, sy))
        if len(self._fix_buf) > FIXATION_BUFFER_N:
            self._fix_buf.pop(0)
        if len(self._fix_buf) < FIXATION_BUFFER_N:
            return "unknown"
        xs = [p[0] for p in self._fix_buf]
        ys = [p[1] for p in self._fix_buf]
        spread = max(max(xs)-min(xs), max(ys)-min(ys))
        return "fixation" if spread < FIXATION_THRESH_PX else "saccade"

    # ── main per-frame call ───────────────────────────────────────────────────

    def process(self, frame, landmarks):
        """
        landmarks: np.array shape (N, 2), normalised [0..1]
        Returns: (annotated_frame, metrics_dict)
        """
        h, w = frame.shape[:2]
        lm = landmarks

        # ── EAR ──────────────────────────────────────────────────────────────
        left_eye  = np.array([self._lm(lm, i, w, h) for i in LEFT_EYE_IDX])
        right_eye = np.array([self._lm(lm, i, w, h) for i in RIGHT_EYE_IDX])
        left_ear  = self._ear(left_eye)
        right_ear = self._ear(right_eye)
        avg_ear   = (left_ear + right_ear) / 2.0

        # Blink debounce
        if avg_ear < EAR_BLINK_THRESH:
            self._ear_below_count += 1
            if self._blink_start is None:
                self._blink_start = self.total_frames
        else:
            if self._ear_below_count >= EAR_CONSEC_FRAMES:
                self.blink_count += 1
                if self._blink_start is not None:
                    self.blink_durations.append(self._ear_below_count)
            self._ear_below_count = 0
            self._blink_start = None
        blink_active = self._ear_below_count >= EAR_CONSEC_FRAMES

        # ── Iris ratio gaze ───────────────────────────────────────────────────
        has_iris = len(lm) > 473

        if has_iris:
            l_iris = self._lm(lm, LEFT_IRIS_IDX,  w, h)
            r_iris = self._lm(lm, RIGHT_IRIS_IDX, w, h)

            lrx, lry = self._iris_ratio(
                l_iris,
                self._lm(lm, LEFT_INNER,  w, h),
                self._lm(lm, LEFT_OUTER,  w, h),
                self._lm(lm, LEFT_TOP,    w, h),
                self._lm(lm, LEFT_BOT,    w, h),
            )
            rrx, rry = self._iris_ratio(
                r_iris,
                self._lm(lm, RIGHT_INNER, w, h),
                self._lm(lm, RIGHT_OUTER, w, h),
                self._lm(lm, RIGHT_TOP,   w, h),
                self._lm(lm, RIGHT_BOT,   w, h),
            )

            # Both ratios now naturally go left→right in image space.
            # No manual mirroring needed — the corner swap handles it.
            raw_rx = (lrx + rrx) / 2.0
            raw_ry = (lry + rry) / 2.0
        else:
            # Fallback: use FaceMesh outer corners to approximate
            raw_rx = 0.5
            raw_ry = 0.5

        iris_rx = self._kf["x"].update(raw_rx)
        iris_ry = self._kf["y"].update(raw_ry)

        gaze_zone = self._classify_zone(iris_rx, iris_ry)

        # ── Fixation / saccade ────────────────────────────────────────────────
        screen_x = iris_rx * w
        screen_y = iris_ry * h
        fix_state = self._update_fixation(screen_x, screen_y)

        # ── Session accumulators ──────────────────────────────────────────────
        self.total_frames += 1
        self.ear_history.append(float(avg_ear))
        self.iris_rx_history.append(float(iris_rx))
        self.iris_ry_history.append(float(iris_ry))
        self.gaze_zone_history.append(gaze_zone)

        if gaze_zone == "ON_CAMERA" and not blink_active:
            self.on_camera_frames += 1
            self.off_camera_streak = 0
        else:
            self.off_camera_streak += 1
            self.max_off_camera_streak = max(self.max_off_camera_streak,
                                             self.off_camera_streak)

        if fix_state == "fixation":
            self.fixation_frames += 1
        elif fix_state == "saccade":
            self.saccade_frames += 1

        # ── Draw overlays ─────────────────────────────────────────────────────
        eye_color = (0, 200, 100)
        for (x, y) in left_eye:
            cv2.circle(frame, (int(x), int(y)), 2, eye_color, -1)
        for (x, y) in right_eye:
            cv2.circle(frame, (int(x), int(y)), 2, eye_color, -1)

        if has_iris:
            iris_color = (255, 200, 0) if gaze_zone == "ON_CAMERA" else (0, 100, 255)
            cv2.circle(frame, (int(l_iris[0]), int(l_iris[1])), 4, iris_color, -1)
            cv2.circle(frame, (int(r_iris[0]), int(r_iris[1])), 4, iris_color, -1)

        metrics = {
            "ear":          float(avg_ear),
            "blink_active": blink_active,
            "blink_count":  self.blink_count,
            "iris_rx":      float(iris_rx),
            "iris_ry":      float(iris_ry),
            "gaze_zone":    gaze_zone,
            "fix_state":    fix_state,
            # rolling stats (last 90 frames = ~3s)
            "on_camera_pct": self._rolling_on_camera_pct(),
        }
        return frame, metrics

    def _rolling_on_camera_pct(self, window=90):
        recent = self.gaze_zone_history[-window:]
        if not recent:
            return 0.0
        return round(recent.count("ON_CAMERA") / len(recent) * 100, 1)

    def session_summary(self):
        """Return aggregated stats for session_report.py."""
        tf = max(self.total_frames, 1)
        return {
            "total_frames":           self.total_frames,
            "on_camera_pct":          round(self.on_camera_frames / tf * 100, 1),
            "blink_count":            self.blink_count,
            "avg_blink_duration_ms":  round(
                (np.mean(self.blink_durations) / 30.0 * 1000)
                if self.blink_durations else 0, 1),
            "max_off_camera_streak_s": round(self.max_off_camera_streak / 30.0, 2),
            "gaze_stability":         round(
                1.0 - float(np.std(self.iris_rx_history + self.iris_ry_history))
                if self.iris_rx_history else 0, 3),
            "fixation_pct":           round(self.fixation_frames / tf * 100, 1),
            "avg_ear":                round(float(np.mean(self.ear_history))
                                            if self.ear_history else 0, 3),
            "zone_distribution":      self._zone_dist(),
        }

    def _zone_dist(self):
        h = self.gaze_zone_history
        if not h:
            return {}
        zones = ["ON_CAMERA", "LEFT", "RIGHT", "UP", "DOWN"]
        return {z: round(h.count(z) / len(h) * 100, 1) for z in zones}