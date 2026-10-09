from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ROOT / ".env"), extra="ignore")

    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.0-flash"
    whisper_model: str = "whisper-1"
    mock_mode: str = "auto"


settings = Settings()


def _usable_key(value: Optional[str]) -> bool:
    if not value:
        return False
    key = value.strip()
    if not key:
        return False
    lowered = key.lower()
    if any(token in lowered for token in ("changeme", "your-key", "your_key", "example", "placeholder")):
        return False
    if key.startswith("sk-abcdef"):
        return False
    return True


def use_mock(kind: str) -> bool:
    if settings.mock_mode == "always":
        return True
    if settings.mock_mode == "never":
        return False
    if kind == "gemini":
        return not _usable_key(settings.gemini_api_key)
    if kind == "whisper":
        return not _usable_key(settings.openai_api_key)
    return False
