from pydantic import BaseModel, Field
from typing import List, Optional


class FrameBatch(BaseModel):
    frames: List[str] = Field(default_factory=list)


class GenerateRequest(BaseModel):
    title: str
    description: str = ""
    skills: List[str] = Field(default_factory=list)


class GradeCodeRequest(BaseModel):
    code: str = ""
    question: str
    hint: str = ""
    language: str = "javascript"


class Question(BaseModel):
    text: str
    type: str = "dynamic"
    idealAnswerHint: str = ""


class GradeResult(BaseModel):
    transcript: str
    technicalScore: float
    feedback: str
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    mock: bool = False
