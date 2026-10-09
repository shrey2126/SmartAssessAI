function ok(res, data = null, message = "OK", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message = "Request failed", status = 400, data = null) {
  return res.status(status).json({ success: false, message, data });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function computeVerdict(overall, thresholds) {
  if (overall >= thresholds.strong) return "Strong Hire";
  if (overall >= thresholds.hire) return "Hire";
  if (overall >= thresholds.borderline) return "Borderline";
  return "Reject";
}

function paginate(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

module.exports = { ok, fail, asyncHandler, round1, computeVerdict, paginate };
