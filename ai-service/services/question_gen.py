from typing import List

from utils.config import use_mock
from utils.gemini import generate_text
from utils.json_safe import parse_json_safe

PROMPT = """Generate exactly 10 interview questions for this role.
Title: {title}
Description: {description}
Skills: {skills}

Return ONLY a JSON array of 10 objects:
[{{"text":"...","type":"dynamic","idealAnswerHint":"..."}}]
Mix behavioral and technical. No markdown.
"""

ASSESS_PROMPT = """Create an easy-to-medium timed screening for this job.
Title: {title}
Description: {description}
Tech stack / skills: {skills}

Rules:
- Every question MUST be about the listed tech stack.
- Difficulty: easy to medium only.
- Exactly 10 multiple-choice questions, each with 4 distinct options.
- Mix 6 easy and 4 medium MCQs.
- Exactly 2 coding problems (1 easy, 1 medium) solvable in about 7 minutes each.
- Coding language must match the stack: javascript, python, or java.
- correctAnswer must be an exact copy of one option string.
- Return ONLY JSON (no markdown):
{{
  "mcqs": [{{"text":"...","options":["a","b","c","d"],"correctAnswer":"a","difficulty":"easy"}}],
  "coding": [{{"text":"problem statement","language":"javascript","starterCode":"...","idealAnswerHint":"...","difficulty":"easy"}}]
}}
"""


def _fallback(title: str, skills: List[str]) -> list:
    skill = ", ".join(skills[:4]) or "this domain"
    templates = [
        f"Walk through a production system you built related to {title}.",
        f"How do you test and monitor features that use {skill}?",
        f"Describe a difficult debugging session relevant to {title}.",
        "How do you handle ambiguous requirements from hiring managers?",
        f"Design an API for {title.lower()} screening at scale.",
        "Explain a tradeoff you made between speed and quality.",
        f"How would you onboard onto a codebase using {skill}?",
        "Tell us about a time you improved interview or candidate experience.",
        "What security issues would you watch for in media uploads?",
        "How do you communicate technical scores to non-technical HR partners?",
    ]
    return [
        {
            "text": t,
            "type": "dynamic",
            "idealAnswerHint": "Be specific: situation, approach, result.",
        }
        for t in templates
    ]


def generate_questions(title: str, description: str, skills: List[str]) -> dict:
    if use_mock("gemini"):
        return {"questions": _fallback(title, skills), "mock": True}
    prompt = PROMPT.format(title=title, description=description, skills=", ".join(skills))
    parsed = parse_json_safe(generate_text(prompt) or "")
    if parsed is None:
        parsed = parse_json_safe(generate_text(prompt + "\nJSON array only.") or "")
    if not isinstance(parsed, list) or len(parsed) != 10:
        return {"questions": _fallback(title, skills), "mock": True}
    questions = []
    for item in parsed:
        questions.append(
            {
                "text": item.get("text") if isinstance(item, dict) else str(item),
                "type": "dynamic",
                "idealAnswerHint": (item.get("idealAnswerHint") if isinstance(item, dict) else "") or "",
            }
        )
    return {"questions": questions, "mock": False}


def _fallback_assessment(title: str, skills: List[str]) -> dict:
    skill = skills[0] if skills else "JavaScript"
    extra = ", ".join(skills[:4]) or skill
    joined = " ".join(skills).lower()
    if "python" in joined or "django" in joined:
        language = "python"
        starter = "def solve(input):\n    return input\n"
    elif "java" in joined and "javascript" not in joined:
        language = "java"
        starter = "class Solution {\n  static Object solve(Object input) {\n    return input;\n  }\n}\n"
    else:
        language = "javascript"
        starter = "function solve(input) {\n  return input;\n}\n"

    def mcq(text, options, correct, difficulty):
        return {
            "text": text,
            "options": options,
            "correctAnswer": correct,
            "difficulty": difficulty,
        }

    mcqs = [
        mcq(
            f"How should secrets used by {skill} be stored?",
            [
                "In the git repo",
                "In environment variables or a secret manager",
                "In the frontend bundle",
                "In a public README",
            ],
            "In environment variables or a secret manager",
            "easy",
        ),
        mcq(
            f"What most improves reliability in a {extra} project?",
            [
                "Skipping tests",
                "Automated tests for critical paths",
                "Only testing in production",
                "Disabling logs",
            ],
            "Automated tests for critical paths",
            "easy",
        ),
        mcq(
            "What does HTTP 400 usually mean?",
            ["Server crash", "Invalid client request", "Success", "Created"],
            "Invalid client request",
            "easy",
        ),
        mcq(
            "Which Git command creates a new branch?",
            ["git clone", "git branch new-feature", "git blame", "git stash drop"],
            "git branch new-feature",
            "easy",
        ),
        mcq(
            f"Which statement about collections in {skill} is typically true?",
            [
                "They only store numbers",
                "Index access is often O(1)",
                "They cannot be empty",
                "They replace databases",
            ],
            "Index access is often O(1)",
            "easy",
        ),
        mcq(
            "Main benefit of version control?",
            ["Compiles the app", "History and collaboration", "Replaces code review", "Auto-fixes bugs"],
            "History and collaboration",
            "easy",
        ),
        mcq(
            f"A {skill} function receives missing input. Best response?",
            [
                "Ignore it",
                "Validate and return a clear error",
                "Crash without logs",
                "Retry forever",
            ],
            "Validate and return a clear error",
            "medium",
        ),
        mcq(
            "Which SQL clause filters rows before grouping?",
            ["HAVING", "WHERE", "ORDER BY", "LIMIT"],
            "WHERE",
            "medium",
        ),
        mcq(
            "Which REST method is idempotent and typically replaces a resource?",
            ["POST", "PUT", "PATCH only", "CONNECT"],
            "PUT",
            "medium",
        ),
        mcq(
            f"First step when a {skill} feature is slow?",
            ["Rewrite everything", "Measure, then fix the hotspot", "Add CSS", "Delete tests"],
            "Measure, then fix the hotspot",
            "medium",
        ),
    ]
    coding = [
        {
            "text": (
                f"Easy: Write a {language} function solve(nums) that returns the sum of unique numbers. "
                f"Example: [1,2,2,3] → 6. Used when aggregating {skill} metrics."
            ),
            "language": language,
            "starterCode": starter,
            "idealAnswerHint": "Use a set, then sum. Empty → 0.",
            "difficulty": "easy",
        },
        {
            "text": (
                f"Medium: Write a {language} function solve(text) that returns the most frequent lowercase word. "
                f"Ties: lexicographically smallest word. Relates to parsing logs in {extra}."
            ),
            "language": language,
            "starterCode": starter,
            "idealAnswerHint": "Count with a map, then pick max count / min word.",
            "difficulty": "medium",
        },
    ]
    return {"mcqs": mcqs, "coding": coding, "mock": True}


def generate_assessment(title: str, description: str, skills: List[str]) -> dict:
    if use_mock("gemini"):
        return _fallback_assessment(title, skills)
    prompt = ASSESS_PROMPT.format(title=title, description=description or "", skills=", ".join(skills or []))
    raw = generate_text(prompt)
    parsed = parse_json_safe(raw or "")
    if not isinstance(parsed, dict):
        return _fallback_assessment(title, skills)
    mcqs = parsed.get("mcqs") if isinstance(parsed.get("mcqs"), list) else []
    coding = parsed.get("coding") if isinstance(parsed.get("coding"), list) else []
    if len(mcqs) != 10 or len(coding) != 2:
        return _fallback_assessment(title, skills)
    parsed["mock"] = False
    return parsed
