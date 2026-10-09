const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: { type: String, enum: ["mcq", "coding"], required: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, default: "" },
    idealAnswerHint: { type: String, default: "" },
    starterCode: { type: String, default: "" },
    language: { type: String, default: "" },
    difficulty: { type: String, enum: ["easy", "medium"], default: "easy" },
    timeLimitSec: { type: Number, default: 60 },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    questionIndex: Number,
    questionText: String,
    questionType: { type: String, default: "mcq" },
    transcript: { type: String, default: "" },
    code: { type: String, default: "" },
    technicalScore: { type: Number, default: 0 },
    feedback: { type: String, default: "" },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    audioPath: { type: String, default: "" },
    selectedOption: { type: String, default: "" },
    isCorrect: { type: Boolean, default: false },
    timedOut: { type: Boolean, default: false },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, unique: true },
    questions: { type: [questionSchema], default: [] },
    answers: { type: [answerSchema], default: [] },
    gazeData: {
      framesAnalyzed: { type: Number, default: 0 },
      eyeContactRatio: { type: Number, default: 0 },
      lookAwayEvents: { type: Number, default: 0 },
      noFaceFrames: { type: Number, default: 0 },
      penalty: { type: Number, default: 0 },
    },
    distractionEvents: { type: Number, default: 0 },
    mcqScore: { type: Number, default: 0 },
    codingScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
    verdict: {
      type: String,
      enum: ["Strong Hire", "Hire", "Borderline", "Reject", "Pending"],
      default: "Pending",
    },
    terminationReason: {
      type: String,
      enum: ["", "submitted", "camera_lost", "tab_switch", "integrity"],
      default: "",
    },
    recordingPath: { type: String, default: "" },
    mockMode: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Interview", interviewSchema);
