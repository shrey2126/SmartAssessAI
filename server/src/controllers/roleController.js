const { body } = require("express-validator");
const JobRole = require("../models/JobRole");
const { ok, fail, asyncHandler, paginate } = require("../utils/helpers");
const { validate } = require("../middleware/validate");
const ai = require("../services/aiClient");

const roleRules = [
  body("title").trim().notEmpty().withMessage("Title required"),
  body("description").trim().notEmpty().withMessage("Description required"),
  body("questions").optional().isArray().withMessage("Questions must be an array"),
  validate,
];

const publicList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const q = { isOpen: true };
  if (req.query.search) {
    q.$or = [
      { title: new RegExp(req.query.search, "i") },
      { description: new RegExp(req.query.search, "i") },
      { skills: new RegExp(req.query.search, "i") },
    ];
  }
  if (req.query.location) q["details.location"] = new RegExp(req.query.location, "i");
  if (req.query.type) q["details.type"] = req.query.type;
  if (req.query.level) q["details.experienceLevel"] = req.query.level;
  const [items, total] = await Promise.all([
    JobRole.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
    JobRole.countDocuments(q),
  ]);
  return ok(res, { items, total, page, limit });
});

const publicOne = asyncHandler(async (req, res) => {
  const role = await JobRole.findById(req.params.id);
  if (!role || !role.isOpen) return fail(res, "Role not found", 404);
  return ok(res, { role });
});

const adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const q = {};
  if (req.query.search) q.title = new RegExp(req.query.search, "i");
  if (req.query.open === "true") q.isOpen = true;
  if (req.query.open === "false") q.isOpen = false;
  const [items, total] = await Promise.all([
    JobRole.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
    JobRole.countDocuments(q),
  ]);
  return ok(res, { items, total, page, limit });
});

const adminOne = asyncHandler(async (req, res) => {
  const role = await JobRole.findById(req.params.id);
  if (!role) return fail(res, "Role not found", 404);
  return ok(res, { role });
});

const create = asyncHandler(async (req, res) => {
  const role = await JobRole.create({ ...req.body, createdBy: req.user._id });
  return ok(res, { role }, "Role created", 201);
});

const update = asyncHandler(async (req, res) => {
  const role = await JobRole.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!role) return fail(res, "Role not found", 404);
  return ok(res, { role }, "Role updated");
});

const remove = asyncHandler(async (req, res) => {
  const role = await JobRole.findByIdAndDelete(req.params.id);
  if (!role) return fail(res, "Role not found", 404);
  return ok(res, null, "Role deleted");
});

const toggle = asyncHandler(async (req, res) => {
  const role = await JobRole.findById(req.params.id);
  if (!role) return fail(res, "Role not found", 404);
  role.isOpen = !role.isOpen;
  await role.save();
  return ok(res, { role }, role.isOpen ? "Role opened" : "Role closed");
});

const generateQuestions = asyncHandler(async (req, res) => {
  const { title, description, skills } = req.body;
  try {
    const data = await ai.generateQuestions({ title, description, skills: skills || [] });
    return ok(res, data);
  } catch (e) {
    const fallback = Array.from({ length: 10 }).map((_, i) => ({
      text: `Describe a real project related to ${title || "this role"} (question ${i + 1}).`,
      type: "dynamic",
      idealAnswerHint: "Cover problem, approach, tradeoffs, and results.",
    }));
    return ok(res, { questions: fallback, mock: true, message: e.message });
  }
});

module.exports = {
  publicList,
  publicOne,
  adminList,
  adminOne,
  create,
  update,
  remove,
  toggle,
  generateQuestions,
  roleRules,
};
