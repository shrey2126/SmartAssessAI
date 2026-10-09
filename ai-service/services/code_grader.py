import hashlib
from typing import Optional

from utils.config import use_mock
from utils.gemini import generate_text
from utils.json_safe import parse_json_safe

PROMPT = """You are grading a timed, easy-to-medium coding screen.
Language: {language}
Problem: {question}
Ideal solution notes: {hint}
Candidate code:
```
{code}
```

Return ONLY JSON:
{{"technicalScore": <number 0-10>, "feedback": "<2-4 sentences>", "strengths": ["..."], "gaps": ["..."]}}
Score for correctness, completeness, and whether it would run. Empty or unrelated code should score 0-2.
Difficulty is easy-medium — do not demand production-grade architecture.
"""


def _mock_grade(code: str, question: str) -> dict:
    blob = (question + (code or "")).encode("utf-8", errors="ignore")
    n = int(hashlib.sha256(blob).hexdigest()[:8], 16)
    lines = [ln for ln in (code or "").splitlines() if ln.strip() and not ln.strip().startswith("#") and not ln.strip().startswith("//")]
    words = len((code or "").split())
    base = 3.2 + (n % 25) / 10
    if words < 8 or len(lines) < 2:
        base = 1.4
    elif words > 25:
        base += 1.2
    if "return" in (code or "").lower() or "def " in (code or "") or "function" in (code or ""):
        base += 0.8
    score = max(0.0, min(9.2, base))
    return {
        "transcript": code or "",
        "technicalScore": round(score, 1),
        "feedback": "Demo grading for the coding task. Live Gemini keys produce a fuller rubric.",
        "strengths": ["Submitted code"] if words > 4 else [],
        "gaps": ["Add a complete working solution"] if words < 20 else ["Explain edge cases in comments"],
        "mock": True,
    }


def grade_code(code: str, question: str, hint: str = "", language: str = "javascript") -> dict:
    if not (code or "").strip():
        return {
            "transcript": "",
            "technicalScore": 0,
            "feedback": "No code was submitted.",
            "strengths": [],
            "gaps": ["Empty submission"],
            "mock": False,
        }
    if use_mock("gemini"):
        return _mock_grade(code, question)
    prompt = PROMPT.format(
        language=language or "javascript",
        question=question,
        hint=hint or "n/a",
        code=code[:8000],
    )
    parsed = parse_json_safe(generate_text(prompt) or "")
    if parsed is None:
        parsed = parse_json_safe(generate_text(prompt + "\nJSON only.") or "")
    if not isinstance(parsed, dict):
        out = _mock_grade(code, question)
        out["feedback"] = "Grader fallback: " + out["feedback"]
        return out
    score = max(0.0, min(10.0, float(parsed.get("technicalScore", 5))))
    return {
        "transcript": code,
        "technicalScore": round(score, 1),
        "feedback": str(parsed.get("feedback", "")),
        "strengths": list(parsed.get("strengths") or []),
        "gaps": list(parsed.get("gaps") or []),
        "mock": False,
    }
