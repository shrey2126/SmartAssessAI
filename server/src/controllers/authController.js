const { body } = require("express-validator");
const User = require("../models/User");
const Profile = require("../models/Profile");
const { ok, fail, asyncHandler } = require("../utils/helpers");
const { signToken, setAuthCookie, clearAuthCookie } = require("../utils/jwt");
const { validate } = require("../middleware/validate");

const registerRules = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
  body("email").trim().isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["candidate", "admin"]),
  validate,
];

const loginRules = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required"),
  validate,
];

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return fail(res, "Email already registered", 409);
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "candidate",
  });
  try {
    await Profile.create({
      user: user._id,
      fullName: name,
      email: user.email,
    });
  } catch {
    /* profile is created on first GET /profile if this fails */
  }
  const token = signToken({ id: user._id, role: user.role });
  setAuthCookie(res, token);
  return ok(
    res,
    { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token },
    "Registered",
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return fail(res, "Invalid credentials", 401);
  const match = await user.comparePassword(password);
  if (!match) return fail(res, "Invalid credentials", 401);
  const token = signToken({ id: user._id, role: user.role });
  setAuthCookie(res, token);
  return ok(res, {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token,
  });
});

const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return ok(res, null, "Logged out");
});

const me = asyncHandler(async (req, res) => {
  return ok(res, {
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
});

module.exports = { register, login, logout, me, registerRules, loginRules };
