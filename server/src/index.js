require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { connectDb } = require("./config/db");
const { ensureDemoData } = require("./seed/seed");
const { notFound, errorHandler } = require("./middleware/error");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: [
      process.env.CLIENT_ORIGIN,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Try again later.", data: null },
  })
);

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
app.use("/uploads", express.static(uploadDir));

app.get("/health", (_req, res) => {
  const mongoState = require("mongoose").connection.readyState;
  res.json({
    success: mongoState === 1,
    message: mongoState === 1 ? "SmartAssess API healthy" : "API up, MongoDB not connected",
    data: { ts: Date.now(), mongo: mongoState },
  });
});

app.use("/api/v1", routes);
app.use(notFound);
app.use(errorHandler);

connectDb()
  .then(() => ensureDemoData())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start", err);
    process.exit(1);
  });



