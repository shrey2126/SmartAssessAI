function notFound(req, res, _next) {
  res.status(404).json({
    success: false,
    message: `Not found: ${req.method} ${req.originalUrl}`,
    data: null,
  });
}

function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "Audio file is too large", data: null });
  }
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ success: false, message, data: err.data || null });
}

module.exports = { notFound, errorHandler };
