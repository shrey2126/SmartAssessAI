import hashlib
from typing import Optional

from utils.config import settings, use_mock
from utils.gemini import generate_text
from utils.json_safe import parse_json_safe


GRADE_PROMPT = """You are a strict technical interviewer.
Question: {question}
Ideal answer hint: {hint}
Candidate transcript: {transcript}

Return ONLY JSON:
{{"technicalScore": <number 0-10>, "feedback": "<2-4 sentences>", "strengths": ["..."], "gaps": ["..."]}}
Score for correctness, relevance, and technical accuracy. Be strict but fair.
"""


def _mock_grade(question: str, transcript: str) -> dict:
    blob = (question + transcript).encode("utf-8", errors="ignore")
    n = int(hashlib.sha256(blob).hexdigest()[:8], 16)
    words = len((transcript or "").split())
    base = 4.5 + (n % 40) / 10
    if words < 12:
        base -= 1.5
    elif words > 40:
        base += 0.8
    score = max(1.0, min(9.6, base))
    return {
        "transcript": transcript or "Mock transcript: candidate outlined an approach with tradeoffs.",
        "technicalScore": round(score, 1),
        "feedback": "Demo mode grading. Answer showed structure; live Gemini/Whisper keys will produce real scores.",
        "strengths": ["Attempted the question", "Mentioned a technical approach"],
        "gaps": ["Add more specifics", "Quantify impact"],
        "mock": True,
    }


def transcribe(audio_path: Optional[str]) -> tuple[str, bool]:
    if use_mock("whisper") or not audio_path:
        return ("Candidate described architecture, constraints, and a practical implementation path.", True)
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        with open(audio_path, "rb") as f:
            result = client.audio.transcriptions.create(model=settings.whisper_model, file=f)
        text = getattr(result, "text", "") or str(result)
        return (text.strip(), False)
    except Exception as exc:
        return (f"Transcription fallback ({exc})", True)


def grade_with_gemini(question: str, transcript: str, hint: str = "") -> tuple[dict, bool]:
    if use_mock("gemini"):
        return (_mock_grade(question, transcript), True)
    prompt = GRADE_PROMPT.format(question=question, hint=hint or "n/a", transcript=transcript)
    text = generate_text(prompt)
    parsed = parse_json_safe(text or "")
    if parsed is None:
        parsed = parse_json_safe(generate_text(prompt + "\nReturn valid JSON only.") or "")
    if not isinstance(parsed, dict):
        return (_mock_grade(question, transcript), True)
    score = float(parsed.get("technicalScore", 5))
    score = max(0.0, min(10.0, score))
    return (
        {
            "transcript": transcript,
            "technicalScore": round(score, 1),
            "feedback": str(parsed.get("feedback", "")),
            "strengths": list(parsed.get("strengths") or []),
            "gaps": list(parsed.get("gaps") or []),
            "mock": False,
        },
        False,
    )


def transcribe_and_grade(audio_path: Optional[str], question: str, hint: str = "") -> dict:
    transcript, mock_t = transcribe(audio_path)
    graded, mock_g = grade_with_gemini(question, transcript, hint)
    graded["transcript"] = transcript
    graded["mock"] = mock_t or mock_g
    return graded
