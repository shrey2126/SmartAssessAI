const mongoose = require("mongoose");
const { execSync } = require("child_process");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tryStartLocalMongo() {
  if (process.platform !== "win32") return;
  try {
    execSync("net start MongoDB", { stdio: "ignore" });
    console.log("Started Windows MongoDB service");
  } catch {
    /* already running or not installed */
  }
}

async function connectDb() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smartassess";
  mongoose.set("strictQuery", true);
  tryStartLocalMongo();

  let lastErr;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB connected (${uri})`);
      return mongoose.connection;
    } catch (err) {
      lastErr = err;
      console.error(`MongoDB connection attempt ${attempt}/8 failed: ${err.message}`);
      if (attempt === 1) tryStartLocalMongo();
      await sleep(1500);
    }
  }
  throw new Error(
    `Could not connect to MongoDB at ${uri}. Start MongoDB locally (Windows: net start MongoDB) or set MONGO_URI in server/.env. Last error: ${lastErr?.message}`
  );
}

module.exports = { connectDb };
