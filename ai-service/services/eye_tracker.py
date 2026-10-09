import base64
import hashlib
from typing import Dict, List

import numpy as np

try:
    import cv2
    import mediapipe as mp

    _MP_OK = True
except Exception:
    _MP_OK = False


def _decode_frame(b64: str):
    import cv2

    raw = b64.split(",")[-1]
    data = base64.b64decode(raw)
    arr = np.frombuffer(data, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _gaze_from_landmarks(landmarks, w: int, h: int) -> str:
    # Iris landmarks (refine_landmarks=True): left iris 468-472, right 473-477
    try:
        left_iris = landmarks[468]
        right_iris = landmarks[473]
        left_eye_outer = landmarks[33]
        left_eye_inner = landmarks[133]
        right_eye_outer = landmarks[263]
        right_eye_inner = landmarks[362]
    except IndexError:
        nose = landmarks[1]
        if nose.x < 0.4:
            return "left"
        if nose.x > 0.6:
            return "right"
        if nose.y < 0.38:
            return "up"
        if nose.y > 0.62:
            return "down"
        return "center"

    def ratio(iris, inner, outer):
        span = abs(outer.x - inner.x) or 1e-6
        return (iris.x - min(inner.x, outer.x)) / span

    lr = (ratio(left_iris, left_eye_inner, left_eye_outer) + ratio(right_iris, right_eye_inner, right_eye_outer)) / 2
    y = (left_iris.y + right_iris.y) / 2
    if lr < 0.35:
        return "left"
    if lr > 0.65:
        return "right"
    if y < 0.38:
        return "up"
    if y > 0.58:
        return "down"
    return "center"


def analyze_frames(frames: List[str]) -> Dict:
    if not frames:
        return {
            "framesAnalyzed": 0,
            "eyeContactRatio": 0.7,
            "lookAwayEvents": 0,
            "noFaceFrames": 0,
            "multipleFaces": 0,
            "penalty": 0.4,
            "confidenceScore": 6.6,
            "directions": [],
            "mock": True,
        }

    if not _MP_OK:
        return _mock_gaze(frames)

    mesh = mp.solutions.face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=2,
        refine_landmarks=True,
        min_detection_confidence=0.5,
    )
    directions = []
    no_face = 0
    multi = 0
    try:
        for item in frames:
            img = _decode_frame(item)
            if img is None:
                no_face += 1
                directions.append("none")
                continue
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            result = mesh.process(rgb)
            faces = result.multi_face_landmarks or []
            if not faces:
                no_face += 1
                directions.append("none")
                continue
            if len(faces) > 1:
                multi += 1
            h, w = img.shape[:2]
            directions.append(_gaze_from_landmarks(faces[0].landmark, w, h))
    finally:
        mesh.close()

    center = sum(1 for d in directions if d == "center")
    analyzed = len(frames)
    eye_ratio = center / analyzed if analyzed else 0
    look_away = 0
    prev = None
    for d in directions:
        if d not in ("center", None) and prev == "center":
            look_away += 1
        prev = d
    look_away += sum(1 for d in directions if d not in ("center", "none")) // 4
    penalty = min(4.0, look_away * 0.25 + no_face * 0.08 + multi * 0.6)
    score = max(0.0, min(10.0, eye_ratio * 10 - penalty))
    return {
        "framesAnalyzed": analyzed,
        "eyeContactRatio": round(eye_ratio, 3),
        "lookAwayEvents": look_away,
        "noFaceFrames": no_face,
        "multipleFaces": multi,
        "penalty": round(penalty, 2),
        "confidenceScore": round(score, 1),
        "directions": directions[:40],
        "mock": False,
    }


def _mock_gaze(frames: List[str]) -> Dict:
    h = hashlib.sha256("".join(frames[:3]).encode("utf-8", errors="ignore")).hexdigest()
    n = int(h[:8], 16)
    analyzed = len(frames)
    eye_ratio = 0.68 + (n % 25) / 100
    look_away = 3 + (n % 8)
    no_face = n % 4
    penalty = min(3.0, look_away * 0.2 + no_face * 0.1)
    score = max(0.0, min(10.0, eye_ratio * 10 - penalty))
    return {
        "framesAnalyzed": analyzed,
        "eyeContactRatio": round(eye_ratio, 3),
        "lookAwayEvents": look_away,
        "noFaceFrames": no_face,
        "multipleFaces": 0,
        "penalty": round(penalty, 2),
        "confidenceScore": round(score, 1),
        "directions": ["center"] * min(analyzed, 8),
        "mock": True,
    }
