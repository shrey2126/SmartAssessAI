const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = path.resolve(__dirname, "..");
const isWin = os.platform() === "win32";

function run(cmd, cwd = root) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", shell: true });
}

function copyEnv(examplePath, destPath) {
  if (!fs.existsSync(destPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, destPath);
    console.log(`Created ${path.relative(root, destPath)}`);
  }
}

run("npm install");
run("npm install", path.join(root, "client"));
run("npm install", path.join(root, "server"));

const venv = path.join(root, "ai-service", ".venv");
const py = isWin ? path.join(venv, "Scripts", "python.exe") : path.join(venv, "bin", "python");
const pip = isWin ? path.join(venv, "Scripts", "pip.exe") : path.join(venv, "bin", "pip");

if (!fs.existsSync(py)) {
  run("python -m venv .venv", path.join(root, "ai-service"));
}

const pipEnv = {
  ...process.env,
  PIP_CACHE_DIR: path.join(root, "ai-service", ".pip-cache"),
  TMP: path.join(root, "ai-service", ".tmp"),
  TEMP: path.join(root, "ai-service", ".tmp"),
};
fs.mkdirSync(pipEnv.PIP_CACHE_DIR, { recursive: true });
fs.mkdirSync(pipEnv.TEMP, { recursive: true });
console.log(`\n> pip install -r requirements.txt`);
execSync(`"${pip}" install -r requirements.txt`, {
  cwd: path.join(root, "ai-service"),
  stdio: "inherit",
  shell: true,
  env: pipEnv,
});

copyEnv(path.join(root, "client", ".env.example"), path.join(root, "client", ".env"));
copyEnv(path.join(root, "server", ".env.example"), path.join(root, "server", ".env"));
copyEnv(path.join(root, "ai-service", ".env.example"), path.join(root, "ai-service", ".env"));

console.log("\nSetup complete. Start MongoDB, then run: npm run seed && npm run dev");
console.log("Ports: client 5173 | server 5000 | ai-service 8000");
