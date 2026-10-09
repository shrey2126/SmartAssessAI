const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const root = path.resolve(__dirname, "..", "ai-service");
const isWin = os.platform() === "win32";
const py = isWin
  ? path.join(root, ".venv", "Scripts", "python.exe")
  : path.join(root, ".venv", "bin", "python");
const bin = fs.existsSync(py) ? py : "python";

const child = spawn(bin, ["-m", "uvicorn", "main:app", "--reload", "--port", "8000", "--host", "127.0.0.1"], {
  cwd: root,
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    TMP: path.join(root, ".tmp"),
    TEMP: path.join(root, ".tmp"),
  },
});

child.on("exit", (code) => process.exit(code || 0));
