const path = require("path");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const Profile = require("../models/Profile");
const scoring = require("../config/scoring");
const ai = require("../services/aiClient");
const { ok, fail, asyncHandler, round1, computeVerdict } = require("../utils/helpers");
const { fallbackAssessment, publicQuestions, normalizePack } = require("../utils/assessment");

function mergeGaze(interview, gaze, frames) {
  const g = interview.gazeData || {};
  const prevFrames = g.framesAnalyzed || 0;
  const newFrames = gaze.framesAnalyzed || (frames || []).length || 0;
  const totalFrames = prevFrames + newFrames;
  interview.gazeData = {
    framesAnalyzed: totalFrames,
    eyeContactRatio:
      totalFrames > 0
        ? ((g.eyeContactRatio || 0) * prevFrames + (gaze.eyeContactRatio || 0) * newFrames) / totalFrames
        : gaze.eyeContactRatio || 0,
    lookAwayEvents: (g.lookAwayEvents || 0) + (gaze.lookAwayEvents || 0),
    noFaceFrames: (g.noFaceFrames || 0) + (gaze.noFaceFrames || 0),
    penalty: (g.penalty || 0) + (gaze.penalty || 0),
  };
}

async function loadOwnedInterview(req, { populateRole = false } = {}) {
  const interview = await Interview.findById(req.params.id).populate({
    path: "application",
    populate: populateRole
      ? [{ path: "jobRole" }, { path: "candidate", select: "name email" }]
      : { path: "candidate", select: "name email" },
  });
  return interview;
}

function isOwnerOrAdmin(req, interview) {
  const candidateId = interview.application?.candidate?._id || interview.application?.candidate;
  return String(candidateId) === String(req.user._id) || req.user.role === "admin";
}

async function finalizeInterview(interview, reason) {
  const questions = interview.questions || [];
  const byIndex = Object.fromEntries((interview.answers || []).map((a) => [a.questionIndex, a]));

  const indexesOf = (type, fallback) => {
    const found = questions.map((q, i) => (q.type === type ? i : -1)).filter((i) => i >= 0);
    return found.length ? found : fallback;
  };
  const avg = (idxs) => {
    if (!idxs.length) return 0;
    return idxs.reduce((s, i) => s + Number(byIndex[i]?.technicalScore || 0), 0) / idxs.length;
  };

  const mcqAvg = avg(indexesOf("mcq", Array.from({ length: 10 }, (_, i) => i)));
  const codingAvg = avg(indexesOf("coding", [10, 11]));

  const technical = scoring.mcqWeight * mcqAvg + scoring.codingWeight * codingAvg;
  const gaze = interview.gazeData || {};
  let confidence = (gaze.eyeContactRatio || 0) * 10 - (gaze.penalty || 0) - interview.distractionEvents * 0.3;
  if (reason === "camera_lost") confidence = Math.min(confidence, 3);
  if (reason === "tab_switch" || reason === "integrity") confidence = Math.min(confidence, 4);
  confidence = Math.max(0, Math.min(10, confidence));
  const overall = scoring.technicalWeight * technical + scoring.confidenceWeight * confidence;

  interview.mcqScore = round1(mcqAvg);
  interview.codingScore = round1(codingAvg);
  interview.technicalScore = round1(technical);
  interview.confidenceScore = round1(confidence);
  interview.overallScore = round1(overall);
  interview.verdict = computeVerdict(interview.overallScore, scoring.verdict);
  interview.terminationReason = reason || "submitted";
  interview.completedAt = new Date();
  await interview.save();
  if (interview.application) {
    interview.application.status = "completed";
    await interview.application.save();
  }
  return interview;
}

async function getOrCreateInterview(applicationId) {
  try {
    return await Interview.findOneAndUpdate(
      { application: applicationId },
      { $setOnInsert: { application: applicationId, answers: [], questions: [] } },
      { upsert: true, new: true }
    );
  } catch (e) {
    if (e.code === 11000) {
      return Interview.findOne({ application: applicationId });
    }
    throw e;
  }
}

async function persistQuestions(interviewId, pack) {
  const updated = await Interview.findOneAndUpdate(
    { _id: interviewId, "questions.0": { $exists: false } },
    { $set: { questions: pack.questions, mockMode: Boolean(pack.mock) } },
    { new: true }
  );
  if (updated) return updated;
  return Interview.findById(interviewId);
}

async function buildAssessment(role) {
  const fallback = fallbackAssessment(role.title, role.skills);
  try {
    const raw = await Promise.race([
      ai.generateAssessment({
        title: role.title,
        description: `${role.description || ""}\n${role.details?.requirements || ""}`,
        skills: role.skills || [],
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("assessment timeout")), 8000)),
    ]);
    const pack = normalizePack(raw, role.title, role.skills);
    pack.mock = Boolean(raw.mock) || pack.mock;
    if (pack.questions?.length === 12) return pack;
  } catch {
    /* use stack fallback so the test always starts */
  }
  return fallback;
}

const start = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.applicationId).populate("jobRole");
  if (!application) return fail(res, "Application not found", 404);
  if (String(application.candidate) !== String(req.user._id) && req.user.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }
  const role = application.jobRole;
  if (!role) return fail(res, "Job role is missing for this application", 400);

  let interview = await getOrCreateInterview(application._id);
  if (!interview) return fail(res, "Could not start interview", 500);

  if (!interview.questions?.length) {
    const pack = await buildAssessment(role);
    interview = await persistQuestions(interview._id, pack);
  }
  if (!interview?.questions?.length) {
    return fail(res, "Could not load assessment questions", 500);
  }

  if (application.status !== "completed") {
    try {
      application.status = interview.completedAt ? "completed" : "interviewing";
      await application.save();
    } catch {
      await Application.updateOne(
        { _id: application._id, status: { $ne: "completed" } },
        { $set: { status: "interviewing" } }
      );
    }
  }

  const answered = new Set((interview.answers || []).map((a) => a.questionIndex));
  let nextIndex = 0;
  while (answered.has(nextIndex) && nextIndex < interview.questions.length) nextIndex += 1;

  return ok(res, {
    interview: {
      _id: interview._id,
      completedAt: interview.completedAt,
      mockMode: interview.mockMode,
      terminationReason: interview.terminationReason,
      startedAt: interview.startedAt,
    },
    questions: publicQuestions(interview.questions),
    lastAnswered: interview.answers.length,
    nextIndex,
    totals: { mcq: 10, coding: 2 },
  });
});

const submitAnswer = asyncHandler(async (req, res) => {
  const interview = await loadOwnedInterview(req, { populateRole: true });
  if (!interview) return fail(res, "Interview not found", 404);
  if (!isOwnerOrAdmin(req, interview)) {
    return fail(res, "Forbidden", 403);
  }
  if (interview.completedAt) return fail(res, "Interview already completed", 400);
  const questionIndex = Number(req.body.questionIndex);
  const question = interview.questions[questionIndex];
  if (!question) return fail(res, "Invalid question", 400);

  let frames = [];
  try {
    frames = req.body.frames ? JSON.parse(req.body.frames) : [];
  } catch {
    frames = [];
  }
  const distractions = Number(req.body.distractionEvents || 0);
  interview.distractionEvents += distractions;

  let grade = {
    transcript: "",
    technicalScore: 0,
    feedback: "No answer received.",
    strengths: [],
    gaps: ["Unanswered"],
    mock: false,
    selectedOption: "",
    isCorrect: false,
  };

  if (question.type === "mcq") {
    const selectedOption = req.body.selectedOption || "";
    const isCorrect = Boolean(selectedOption) && selectedOption === question.correctAnswer;
    grade = {
      transcript: selectedOption,
      technicalScore: isCorrect ? 10 : 0,
      feedback: isCorrect ? "Correct." : selectedOption ? "Incorrect." : "No option selected before time ran out.",
      strengths: isCorrect ? ["Accurate knowledge"] : [],
      gaps: isCorrect ? [] : ["Missed this concept"],
      mock: false,
      selectedOption,
      isCorrect,
    };
  } else {
    const code = req.body.code || "";
    try {
      grade = await ai.gradeCode({
        code,
        question: question.text,
        hint: question.idealAnswerHint,
        language: question.language,
      });
    } catch (e) {
      grade = {
        transcript: code,
        technicalScore: code.trim() ? 4 : 0,
        feedback: `AI unavailable: ${e.message}`,
        strengths: code.trim() ? ["Submitted code"] : [],
        gaps: ["Could not fully grade"],
        mock: true,
      };
    }
    grade.selectedOption = "";
    grade.isCorrect = Number(grade.technicalScore || 0) >= 7;
  }

  let gaze = {
    framesAnalyzed: 0,
    eyeContactRatio: 0.7,
    lookAwayEvents: 0,
    noFaceFrames: 0,
    penalty: 0,
    mock: true,
  };
  try {
    gaze = await ai.analyzeFrames(frames);
  } catch {
    /* keep mock gaze */
  }

  const existingIdx = interview.answers.findIndex((a) => a.questionIndex === questionIndex);
  const answer = {
    questionIndex,
    questionText: question.text,
    questionType: question.type,
    transcript: grade.transcript || req.body.code || "",
    code: req.body.code || "",
    technicalScore: Number(grade.technicalScore || 0),
    feedback: grade.feedback || "",
    strengths: grade.strengths || [],
    gaps: grade.gaps || [],
    audioPath: req.file ? req.file.path : "",
    selectedOption: grade.selectedOption || "",
    isCorrect: Boolean(grade.isCorrect),
    timedOut: req.body.timedOut === "true" || req.body.timedOut === true,
  };
  if (existingIdx >= 0) interview.answers[existingIdx] = answer;
  else interview.answers.push(answer);

  mergeGaze(interview, gaze, frames);
  interview.mockMode = Boolean(interview.mockMode || grade.mock || gaze.mock);
  await interview.save();

  return ok(res, {
    answer: {
      questionIndex: answer.questionIndex,
      technicalScore: answer.technicalScore,
      feedback: answer.feedback,
      isCorrect: answer.isCorrect,
    },
    gaze,
    mock: interview.mockMode,
    nextIndex: questionIndex + 1,
  });
});

const proctor = asyncHandler(async (req, res) => {
  const interview = await loadOwnedInterview(req);
  if (!interview) return fail(res, "Interview not found", 404);
  if (!isOwnerOrAdmin(req, interview)) {
    return fail(res, "Forbidden", 403);
  }
  if (interview.completedAt) return ok(res, { facePresent: true, terminated: true });
  let frames = req.body.frames || [];
  if (!Array.isArray(frames)) frames = [];
  let gaze = { framesAnalyzed: frames.length, noFaceFrames: 0, mock: true };
  try {
    gaze = await ai.analyzeFrames(frames);
  } catch {
    /* ignore */
  }
  mergeGaze(interview, gaze, frames);
  await interview.save();
  const analyzed = gaze.framesAnalyzed || frames.length || 0;
  const noFace = gaze.noFaceFrames || 0;
  const facePresent = gaze.mock ? true : analyzed === 0 ? true : noFace < analyzed;
  return ok(res, { facePresent, mock: Boolean(gaze.mock), gaze });
});

const uploadRecording = asyncHandler(async (req, res) => {
  const interview = await loadOwnedInterview(req);
  if (!interview) return fail(res, "Interview not found", 404);
  if (!isOwnerOrAdmin(req, interview)) {
    return fail(res, "Forbidden", 403);
  }
  const file = req.file || (req.files && (req.files.recording?.[0] || req.files.audio?.[0]));
  if (!file) return fail(res, "No recording uploaded", 400);
  const rel = path.posix.join(file.fieldname === "recording" ? "recordings" : "audio", path.basename(file.path));
  interview.recordingPath = rel.replace(/\\/g, "/");
  await interview.save();
  return ok(res, { recordingPath: interview.recordingPath });
});

const complete = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id).populate("application");
  if (!interview) return fail(res, "Interview not found", 404);
  if (!isOwnerOrAdmin(req, interview)) {
    return fail(res, "Forbidden", 403);
  }
  if (interview.completedAt) return ok(res, { interview }, "Interview already completed");
  const reason = ["submitted", "camera_lost", "tab_switch", "integrity"].includes(req.body.reason)
    ? req.body.reason
    : "submitted";
  await finalizeInterview(interview, reason);
  return ok(res, { interview }, "Interview completed");
});

const getOne = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id).populate({
    path: "application",
    populate: [{ path: "jobRole" }, { path: "candidate", select: "name email" }],
  });
  if (!interview) return fail(res, "Interview not found", 404);
  if (!isOwnerOrAdmin(req, interview)) return fail(res, "Forbidden", 403);
  const profile = await Profile.findOne({
    user: interview.application.candidate._id || interview.application.candidate,
  });
  const payload = interview.toObject();
  if (req.user.role !== "admin") {
    payload.questions = publicQuestions(payload.questions);
  }
  return ok(res, { interview: payload, profile });
});

const byApplication = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ application: req.params.applicationId }).populate({
    path: "application",
    populate: [{ path: "jobRole" }, { path: "candidate", select: "name email" }],
  });
  if (!interview) return fail(res, "Interview not found", 404);
  if (!isOwnerOrAdmin(req, interview)) return fail(res, "Forbidden", 403);
  const profile = await Profile.findOne({
    user: interview.application.candidate._id || interview.application.candidate,
  });
  const payload = interview.toObject();
  if (req.user.role !== "admin") {
    payload.questions = publicQuestions(payload.questions);
  }
  return ok(res, { interview: payload, profile });
});

module.exports = { start, submitAnswer, complete, getOne, byApplication, proctor, uploadRecording };
