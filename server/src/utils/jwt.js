const jwt = require("jsonwebtoken");

function secret() {
  return process.env.JWT_SECRET || "dev-smartassess-jwt-change-me";
}

function signToken(payload) {
  return jwt.sign(payload, secret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearAuthCookie(res) {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", path: "/" });
}

module.exports = { signToken, setAuthCookie, clearAuthCookie, secret };
