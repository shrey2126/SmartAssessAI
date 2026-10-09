const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");

const base = () => process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

async function aiFetch(url, options = {}, ms = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function health() {
  try {
    const res = await aiFetch(`${base()}/health`, {}, 4000);
    return res.json();
  } catch {
    return { status: "down", mock: true };
  }
}

async function generateQuestions(payload) {
  const res = await aiFetch(`${base()}/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Question generation failed");
  return res.json();
}

async function generateAssessment(payload) {
  const res = await aiFetch(
    `${base()}/generate-assessment`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    90000
  );
  if (!res.ok) throw new Error("Assessment generation failed");
  return res.json();
}

async function gradeCode({ code, question, hint, language }) {
  const res = await aiFetch(
    `${base()}/grade-code`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code || "", question, hint: hint || "", language: language || "javascript" }),
    },
    60000
  );
  if (!res.ok) throw new Error("Code grading failed");
  return res.json();
}

async function analyzeFrames(frames) {
  const res = await aiFetch(`${base()}/analyze-frames`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ frames: (frames || []).slice(0, 40) }),
  });
  if (!res.ok) throw new Error("Frame analysis failed");
  return res.json();
}

async function transcribeGrade({ audioPath, question, hint }) {
  const form = new FormData();
  form.append("question", question);
  if (hint) form.append("hint", hint);
  if (audioPath && fs.existsSync(audioPath)) {
    form.append("audio", fs.createReadStream(audioPath));
  }
  const res = await aiFetch(
    `${base()}/transcribe-grade`,
    {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    },
    60000
  );
  if (!res.ok) throw new Error("Transcription/grading failed");
  return res.json();
}

module.exports = { health, generateQuestions, generateAssessment, analyzeFrames, transcribeGrade, gradeCode };
