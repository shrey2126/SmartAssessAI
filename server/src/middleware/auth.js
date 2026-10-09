const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { fail } = require("../utils/helpers");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
    const token = bearer || req.cookies?.token;
    if (!token) return fail(res, "Authentication required", 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-smartassess-jwt-change-me");
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) return fail(res, "User not found", 401);
    req.user = user;
    next();
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return fail(res, "Admin access required", 403);
  next();
}

function requireCandidate(req, res, next) {
  if (req.user?.role !== "candidate") return fail(res, "Candidate access required", 403);
  next();
}

module.exports = { requireAuth, requireAdmin, requireCandidate };
