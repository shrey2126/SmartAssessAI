require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const { connectDb } = require("../config/db");
const User = require("../models/User");
const Profile = require("../models/Profile");
const JobRole = require("../models/JobRole");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const { fallbackAssessment } = require("../utils/assessment");

function q(text, hint) {
  return { text, type: "static", idealAnswerHint: hint };
}

const frontendQs = [
  q("Explain the virtual DOM and why React uses it.", "Diffing, reconciliation, performance."),
  q("How do you manage global state in a large React app?", "Context vs Redux/Zustand, when each fits."),
  q("What is the difference between useMemo and useCallback?", "Referential equality, expensive calc vs functions."),
  q("How would you optimize a slow list of 10,000 items?", "Virtualization, keys, memo, pagination."),
  q("Describe CSS specificity and how you avoid conflicts in Tailwind.", "Utility-first, layers, important rarely."),
  q("How does HTTPS protect a login form?", "TLS, certificates, MITM prevention."),
  q("Walk through an accessible modal implementation.", "Focus trap, aria-modal, Escape, restore focus."),
  q("How do you handle API errors and loading states in SPA forms?", "Toasts, disabled submit, retry."),
  q("Explain CORS and cookies with credentials.", "Access-Control-Allow-Credentials, SameSite."),
  q("Design a component API for a multi-step wizard.", "Controlled steps, validation, autosave."),
];

const backendQs = [
  q("Compare SQL and NoSQL for an interview platform.", "Relations vs flexibility, indexes."),
  q("How do you store passwords securely?", "bcrypt/argon2, salt, never plaintext."),
  q("Design JWT auth with httpOnly cookies.", "CSRF, SameSite, refresh strategy."),
  q("How would you rate-limit login attempts?", "IP+email keys, lockouts, 429."),
  q("Explain N+1 queries and how Mongoose populate can cause them.", "Batch, aggregation."),
  q("How do you stream or store interview audio safely?", "size limits, virus scan, signed URLs."),
  q("What is idempotency in REST?", "same request twice, unique keys."),
  q("How do you structure a Node service that calls Python?", "timeouts, retries, circuit breaker."),
  q("Describe indexes you would add for applications by candidate and role.", "compound unique index."),
  q("How do you handle file cleanup after grading?", "cron, TTL, unlink after process."),
];

const fullstackQs = [
  {
    text: "Which protocol is typically used to serve a web page?",
    type: "mcq",
    options: ["HTTP", "FTP", "SMTP", "SSH"],
    correctAnswer: "HTTP"
  },
  q("How would you keep camera frames under bandwidth limits?", "JPEG quality, 2fps, batch."),
  q("Explain gaze estimation from Face Mesh iris landmarks.", "normalized coords vs center."),
  q("How do you grade spoken answers fairly?", "Whisper + rubric + JSON schema."),
  q("What happens if Gemini returns invalid JSON?", "strip fences, retry, mock fallback."),
  q("How do you prevent tab-switch cheating?", "visibilitychange, fullscreen, log events."),
  q("Design the scoring formula.", "0.6 technical + 0.4 confidence, verdicts."),
  q("How would you test MediaRecorder across browsers?", "mime types, fallbacks."),
  q("Describe a CI pipeline for this monorepo.", "lint, vite build, pytest, seed."),
  q("How do you keep secrets out of the client?", "proxy AI via Node, env files."),
];

const candidateProfile = {
  fullName: "Jordan Blake",
  phone: "+1 415 555 0199",
  email: "jordan@demo.ai",
  location: "San Francisco, CA",
  linkedinUrl: "https://linkedin.com/in/jordanblake",
  githubUrl: "https://github.com/jordanblake",
  portfolioUrl: "https://jordanblake.dev",
  skills: ["React", "Node.js", "MongoDB", "Python", "System Design", "TypeScript"],
  education: [
    {
      degree: "B.S. Computer Science",
      institution: "University of California, Berkeley",
      passingYear: "2022",
      cgpa: "3.8",
    },
  ],
  experience: [
    {
      jobTitle: "Software Engineer Intern",
      company: "Northstar Labs",
      startDate: "2021-06",
      endDate: "2021-09",
      description: "Built internal dashboards and REST APIs used by 40+ recruiters.",
    },
  ],
  projects: [
    {
      title: "InterviewPrep Live",
      techStack: ["React", "WebRTC", "FastAPI"],
      objective: "Practice interviews with live transcription and scoring.",
    },
  ],
  summary: "Full-stack engineer focused on hiring products, realtime media, and thoughtful UX.",
};

function roleDocs(adminId) {
  return [
    {
      title: "Frontend Engineer",
      description: "Ship premium candidate experiences with React, motion, and accessibility.",
      details: {
        responsibilities: "Own dashboard UI, interview recorder, and design system.",
        requirements: "React 18, Tailwind, Chart.js, accessibility mindset.",
        location: "Remote",
        type: "Full-time",
        experienceLevel: "Mid",
      },
      skills: ["React", "Tailwind", "Framer Motion", "Accessibility"],
      questions: frontendQs,
      isOpen: true,
      createdBy: adminId,
    },
    {
      title: "Backend Engineer",
      description: "Design secure APIs, auth, and media pipelines for automated interviews.",
      details: {
        responsibilities: "Express services, Mongo models, AI proxy, uploads.",
        requirements: "Node, MongoDB, JWT, production hardening.",
        location: "New York, NY",
        type: "Hybrid",
        experienceLevel: "Mid",
      },
      skills: ["Node.js", "Express", "MongoDB", "Security"],
      questions: backendQs,
      isOpen: true,
      createdBy: adminId,
    },
    {
      title: "Full-Stack AI Engineer",
      description: "Connect MERN surfaces to Whisper, Gemini, and MediaPipe scoring.",
      details: {
        responsibilities: "End-to-end interview flow, scoring, HR analytics.",
        requirements: "MERN + Python services, ML API integration.",
        location: "Remote",
        type: "Full-time",
        experienceLevel: "Senior",
      },
      skills: ["MERN", "FastAPI", "Whisper", "Gemini", "MediaPipe"],
      questions: fullstackQs,
      isOpen: true,
      createdBy: adminId,
    },
  ];
}

async function upsertUser({ name, email, password, role }) {
  const passwordHash = await User.hashPassword(password);
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, passwordHash, role } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return user;
}

async function createSampleInterview(candidate, role) {
  let application = await Application.findOne({ candidate: candidate._id, jobRole: role._id });
  if (!application) {
    application = await Application.create({
      candidate: candidate._id,
      jobRole: role._id,
      status: "completed",
    });
  } else {
    application.status = "completed";
    await application.save();
  }

  const { questions } = fallbackAssessment(role.title, role.skills);
  const mcqScores = [10, 10, 0, 10, 10, 10, 10, 0, 10, 10];
  const codingScores = [8.2, 7.4];
  const answers = questions.map((question, i) => {
    const isMcq = question.type === "mcq";
    const technicalScore = isMcq ? mcqScores[i] ?? 10 : codingScores[i - 10] ?? 7;
    return {
      questionIndex: i,
      questionText: question.text,
      questionType: question.type,
      transcript: isMcq ? (technicalScore === 10 ? question.correctAnswer : question.options[0]) : "function solve(input) { return input; }",
      code: isMcq ? "" : "function solve(input) {\n  return input;\n}\n",
      technicalScore,
      feedback: isMcq ? (technicalScore === 10 ? "Correct." : "Incorrect.") : "Working approach with room for edge cases.",
      strengths: technicalScore >= 7 ? ["Solid on this topic"] : [],
      gaps: technicalScore < 7 ? ["Review this concept"] : [],
      selectedOption: isMcq ? (technicalScore === 10 ? question.correctAnswer : question.options[0]) : "",
      isCorrect: isMcq && technicalScore === 10,
      audioPath: "",
    };
  });

  const payload = {
    application: application._id,
    questions,
    answers,
    gazeData: {
      framesAnalyzed: 240,
      eyeContactRatio: 0.82,
      lookAwayEvents: 6,
      noFaceFrames: 4,
      penalty: 0.6,
    },
    distractionEvents: 1,
    mcqScore: 8.0,
    codingScore: 7.8,
    technicalScore: 7.9,
    confidenceScore: 7.6,
    overallScore: 7.8,
    verdict: "Hire",
    terminationReason: "submitted",
    mockMode: true,
    startedAt: new Date(Date.now() - 1000 * 60 * 42),
    completedAt: new Date(Date.now() - 1000 * 60 * 8),
  };

  const existing = await Interview.findOne({ application: application._id });
  if (existing) {
    if (!existing.questions?.length || existing.mcqScore == null) {
      Object.assign(existing, payload);
      await existing.save();
    }
    return;
  }

  await Interview.create(payload);
}

async function seed({ wipe = false } = {}) {
  if (wipe) {
    await Promise.all([
      User.deleteMany({}),
      Profile.deleteMany({}),
      JobRole.deleteMany({}),
      Application.deleteMany({}),
      Interview.deleteMany({}),
    ]);
  }

  const admin = await upsertUser({
    name: "Avery Chen",
    email: "admin@smartassess.ai",
    password: "Admin@123",
    role: "admin",
  });

  const candidate = await upsertUser({
    name: "Jordan Blake",
    email: "jordan@demo.ai",
    password: "Candidate@123",
    role: "candidate",
  });

  await Profile.findOneAndUpdate(
    { user: candidate._id },
    { $set: { ...candidateProfile, user: candidate._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if ((await JobRole.countDocuments()) === 0) {
    await JobRole.insertMany(roleDocs(admin._id));
  }

  const sampleRole = await JobRole.findOne({ title: "Full-Stack AI Engineer" }) || (await JobRole.findOne());
  if (sampleRole) {
    await createSampleInterview(candidate, sampleRole);
  }

  console.log("Demo data ready");
  console.log("Admin: admin@smartassess.ai / Admin@123");
  console.log("Candidate: jordan@demo.ai / Candidate@123");
}

async function ensureDemoData() {
  try {
    await seed({ wipe: false });
  } catch (err) {
    console.error("Could not load demo data:", err.message);
  }
}

async function runCli() {
  await connectDb();
  await seed({ wipe: true });
  await mongoose.disconnect();
}

if (require.main === module) {
  runCli().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { seed, ensureDemoData };
