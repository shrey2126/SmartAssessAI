const Application = require("../models/Application");
const Profile = require("../models/Profile");
const JobRole = require("../models/JobRole");
const Interview = require("../models/Interview");
const { ok, fail, asyncHandler, paginate } = require("../utils/helpers");

const apply = asyncHandler(async (req, res) => {
  const role = await JobRole.findById(req.params.roleId);
  if (!role || !role.isOpen) return fail(res, "This role is not open", 400);
  const profile = await Profile.findOne({ user: req.user._id });
  if (!profile || profile.completionPercent < 70) {
    return fail(res, "Complete at least 70% of your profile before applying", 400);
  }
  const existing = await Application.findOne({ candidate: req.user._id, jobRole: role._id });
  if (existing) return ok(res, { application: existing }, "Already applied");
  const application = await Application.create({
    candidate: req.user._id,
    jobRole: role._id,
    status: "applied",
  });
  return ok(res, { application }, "Application submitted", 201);
});

const mine = asyncHandler(async (req, res) => {
  const items = await Application.find({ candidate: req.user._id })
    .populate("jobRole")
    .sort({ createdAt: -1 });
  return ok(res, { items });
});

const adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const q = {};
  if (req.query.status) q.status = req.query.status;
  if (req.query.roleId) q.jobRole = req.query.roleId;
  const [apps, total] = await Promise.all([
    Application.find(q)
      .populate("candidate", "name email")
      .populate("jobRole", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(q),
  ]);
  const interviews = await Interview.find({
    application: { $in: apps.map((a) => a._id) },
  });
  const map = Object.fromEntries(interviews.map((i) => [String(i.application), i]));
  const items = apps.map((a) => ({
    ...a.toObject(),
    interview: map[String(a._id)] || null,
  }));
  return ok(res, { items, total, page, limit });
});

module.exports = { apply, mine, adminList };
