from typing import Optional

from utils.config import settings, use_mock


def generate_text(prompt: str) -> Optional[str]:
    if use_mock("gemini"):
        return None
    try:
        import google.generativeai as genai
    except Exception:
        return None

    genai.configure(api_key=settings.gemini_api_key)
    models = []
    for name in (
        settings.gemini_model,
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-flash-latest",
    ):
        if name and name not in models:
            models.append(name)

    last_error = None
    for name in models:
        try:
            model = genai.GenerativeModel(name)
            response = model.generate_content(prompt)
            text = getattr(response, "text", "") or ""
            if text.strip():
                return text
        except Exception as exc:
            last_error = exc
            err = str(exc)
            if "429" in err or "quota" in err.lower() or "rate" in err.lower():
                break
            continue
    if last_error:
        print(f"Gemini failed: {last_error}")
    return None
