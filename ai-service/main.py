from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os

from schemas.models import FrameBatch, GenerateRequest, GradeCodeRequest
from services.eye_tracker import analyze_frames
from services.question_gen import generate_questions, generate_assessment
from services.speech_grader import transcribe_and_grade
from services.code_grader import grade_code
from utils.config import settings, use_mock

app = FastAPI(title="SmartAssess AI Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    mock = use_mock("gemini") or use_mock("whisper")
    return {
        "status": "ok",
        "mock": mock,
        "gemini": not use_mock("gemini"),
        "whisper": not use_mock("whisper"),
        "model": settings.gemini_model,
    }


@app.post("/analyze-frames")
def analyze(batch: FrameBatch):
    return analyze_frames(batch.frames)


@app.post("/generate-questions")
def generate(req: GenerateRequest):
    return generate_questions(req.title, req.description, req.skills)


@app.post("/generate-assessment")
def generate_assess(req: GenerateRequest):
    return generate_assessment(req.title, req.description, req.skills)


@app.post("/grade-code")
def grade_coding(req: GradeCodeRequest):
    return grade_code(req.code, req.question, req.hint or "", req.language or "javascript")


@app.post("/transcribe-grade")
async def transcribe_grade(
    question: str = Form(...),
    hint: str = Form(""),
    audio: Optional[UploadFile] = File(None),
):
    path = None
    tmp = None
    try:
        if audio is not None:
            suffix = os.path.splitext(audio.filename or "clip.webm")[1] or ".webm"
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
            content = await audio.read()
            tmp.write(content)
            tmp.close()
            path = tmp.name
        return transcribe_and_grade(path, question, hint)
    finally:
        if path and os.path.exists(path):
            try:
                os.unlink(path)
            except OSError:
                pass
