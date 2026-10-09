const Application = require("../models/Application");
const Interview = require("../models/Interview");
const JobRole = require("../models/JobRole");
const User = require("../models/User");
const { ok, asyncHandler } = require("../utils/helpers");

const stats = asyncHandler(async (_req, res) => {
  const [candidates, roles, applications, interviews] = await Promise.all([
    User.countDocuments({ role: "candidate" }),
    JobRole.countDocuments(),
    Application.countDocuments(),
    Interview.find({ completedAt: { $ne: null } }).populate({
      path: "application",
      populate: [{ path: "candidate", select: "name email" }, { path: "jobRole", select: "title" }],
    }),
  ]);

  const completed = interviews.length;
  const avgOverall = completed
    ? interviews.reduce((s, i) => s + (i.overallScore || 0), 0) / completed
    : 0;

  const byRole = {};
  const scoreBuckets = { "0-2": 0, "2-4": 0, "4-6": 0, "6-8": 0, "8-10": 0 };
  const funnel = { applied: 0, interviewing: 0, completed: 0 };
  const verdicts = { "Strong Hire": 0, Hire: 0, Borderline: 0, Reject: 0 };

  applications &&
    (await Application.find().then((apps) => {
      apps.forEach((a) => {
        funnel[a.status] = (funnel[a.status] || 0) + 1;
      });
    }));

  interviews.forEach((i) => {
    const title = i.application?.jobRole?.title || "Unknown";
    byRole[title] = (byRole[title] || 0) + 1;
    const s = i.overallScore || 0;
    if (s < 2) scoreBuckets["0-2"] += 1;
    else if (s < 4) scoreBuckets["2-4"] += 1;
    else if (s < 6) scoreBuckets["4-6"] += 1;
    else if (s < 8) scoreBuckets["6-8"] += 1;
    else scoreBuckets["8-10"] += 1;
    if (verdicts[i.verdict] !== undefined) verdicts[i.verdict] += 1;
  });

  const recent = interviews
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 80)
    .map((i) => ({
      id: i._id,
      candidate: i.application?.candidate?.name,
      email: i.application?.candidate?.email,
      role: i.application?.jobRole?.title,
      overall: i.overallScore,
      technical: i.technicalScore,
      mcq: i.mcqScore,
      coding: i.codingScore,
      confidence: i.confidenceScore,
      verdict: i.verdict,
      completedAt: i.completedAt,
      mockMode: i.mockMode,
      terminationReason: i.terminationReason,
      recordingPath: i.recordingPath,
    }));

  return ok(res, {
    kpis: {
      candidates,
      roles,
      applications: funnel.applied + funnel.interviewing + funnel.completed,
      completedInterviews: completed,
      avgOverall: Math.round(avgOverall * 10) / 10,
    },
    byRole,
    scoreBuckets,
    funnel,
    verdicts,
    recent,
  });
});

const exportCsv = asyncHandler(async (_req, res) => {
  const interviews = await Interview.find({ completedAt: { $ne: null } }).populate({
    path: "application",
    populate: [{ path: "candidate", select: "name email" }, { path: "jobRole", select: "title" }],
  });
  const header = "Candidate,Email,Role,MCQ,Coding,Technical,Confidence,Overall,Verdict,Ended,CompletedAt\n";
  const rows = interviews
    .map((i) =>
      [
        i.application?.candidate?.name,
        i.application?.candidate?.email,
        i.application?.jobRole?.title,
        i.mcqScore,
        i.codingScore,
        i.technicalScore,
        i.confidenceScore,
        i.overallScore,
        i.verdict,
        i.terminationReason,
        i.completedAt?.toISOString(),
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=smartassess-results.csv");
  res.send(header + rows);
});

module.exports = { stats, exportCsv };
