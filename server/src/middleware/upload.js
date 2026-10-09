const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(path.join(uploadDir, "audio"), { recursive: true });
fs.mkdirSync(path.join(uploadDir, "recordings"), { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const folder = file.fieldname === "recording" ? "recordings" : "audio";
    cb(null, path.join(uploadDir, folder));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webm";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const maxMb = Number(process.env.MAX_AUDIO_MB || 80);

const upload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    const ok = /audio|video|webm|wav|ogg|mp4|mpeg/.test(file.mimetype);
    if (!ok) return cb(new Error("Unsupported media type"));
    cb(null, true);
  },
});

module.exports = { upload, uploadDir };
