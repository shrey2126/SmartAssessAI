# SmartAssess AI — Project Documentation

**SmartAssess AI** is an automated technical screening platform. Candidates complete a timed, camera-proctored test matched to a job’s tech stack. The system scores answers immediately. HR/admin can review every candidate’s scores, answers, and live-session recording.

---

## 1. Project overview

| Item | Detail |
| --- | --- |
| Product | AI-assisted hiring screen (MCQ + coding), not a live human interview |
| Users | **Candidate** and **Admin / HR** |
| Goal | Replace the first technical round with a fair, timed, proctored test |
| Demo vs live | Works without API keys (demo/mock scoring). Gemini / Whisper / MediaPipe unlock live generation, grading, and gaze |

**Problem it solves:** HR cannot interview every applicant in person. SmartAssess generates a role-specific easy–medium test, blocks common cheating, and gives a scored report in minutes.

---

## 2. Technologies used

### 2.1 Architecture (three services)

```
Browser (React, port 5173)
    └── REST + JWT / cookies
Express API (Node, port 5000)
    ├── MongoDB (Mongoose)
    └── HTTP to FastAPI (port 8000)
          ├── Google Gemini (questions + code grade)
          ├── OpenAI Whisper (optional speech)
          └── MediaPipe Face Mesh (gaze / face present)
```

The **browser never calls Gemini or Whisper**. Keys stay on the Python/Node hosts.

### 2.2 Frontend (`client/`)

| Tech | Role |
| --- | --- |
| React 18 | UI |
| Vite 6 | Dev server + build |
| React Router 6 | Routes, role-based protection |
| Tailwind CSS | Monochrome design system |
| Framer Motion | Page / landing motion |
| Chart.js + react-chartjs-2 | Score charts |
| Axios | API client (`/api/v1`, credentials) |
| react-hot-toast | Toasts |
| MediaRecorder + getUserMedia | Camera, mic, session video |

### 2.3 Backend (`server/`)

| Tech | Role |
| --- | --- |
| Node.js + Express | REST API `/api/v1` |
| MongoDB + Mongoose | Users, profiles, roles, applications, interviews |
| JWT + httpOnly cookie | Auth |
| bcryptjs | Password hashing |
| Multer | Recording / audio uploads |
| Helmet, CORS, rate-limit | Hardening |
| express-validator | Input validation |

### 2.4 AI service (`ai-service/`)

| Tech | Role |
| --- | --- |
| Python 3.11 + FastAPI + Uvicorn | Internal AI HTTP API |
| Google Gemini | Assessment generation, code grading |
| OpenAI Whisper | Optional audio transcription |
| MediaPipe + OpenCV (optional) | Face / gaze on camera frames |
| Fallback packs | If keys/quota fail, still generate 10 MCQs + 2 coding tasks |

### 2.5 Tooling

- Concurrently (one `npm run dev` starts client + API + AI)
- Nodemon (API reload)
- ESLint, PostCSS, Autoprefixer

---

## 3. Repository layout

```
SmartAssess AI/
  client/          React app
  server/          Express API, models, uploads
  ai-service/      FastAPI (Gemini, Whisper, gaze)
  scripts/         setup.js, run-ai.js
  package.json     Root scripts: setup, seed, dev
```

**Main data models**

- **User** — `candidate` or `admin`
- **Profile** — resume fields; apply allowed at **≥ 70%** completion
- **JobRole** — title, description, **skills (tech stack)**, optional question bank
- **Application** — candidate × role (`applied` / `interviewing` / `completed`)
- **Interview** — 12 generated questions, answers, scores, recording path, termination reason, gaze stats

---

## 4. Functionalities

### 4.1 Public / auth

- Landing page, job listing, job detail
- Register (always as **candidate**; admins are seeded)
- Login / logout, protected routes by role

### 4.2 Candidate

1. **Profile wizard** — personal, skills, education, experience, projects (autosave).
2. **Browse jobs** and **apply** (blocked until profile ≥ 70%).
3. **Interview (required camera + mic)**
   - **Part 1:** 10 timed MCQs (~60s each), easy–medium, from the job’s skills.
   - **Part 2:** 2 timed coding tasks (~7 min each), language from the stack (JS / Python / Java).
   - Questions are **generated per interview** (dynamic). Correct answers are **not** sent to the browser.
4. **Instant result** after submit or early terminate: overall, technical, MCQ, coding, presence, verdict.
5. Resume an in-progress test; completed tests open the result page only.

### 4.3 Integrity (anti-cheat)

- Camera and microphone are **mandatory** (no “skip camera”).
- If the face is missing for a few seconds: **black screen**, test **stops**, **partial result** from answers so far (blanks = 0).
- Copy / cut / paste and right-click blocked during the test.
- Leaving the tab: warning, then terminate on repeat.
- Full session **video recording** uploaded for HR.

### 4.4 Admin / HR

- Dashboard: KPIs, funnel, verdicts, score buckets, recent results, CSV export
- Job roles: create / edit / close; skills drive the live test
- **All candidates:** status, overall / MCQ / coding, verdict, recording flag
- **Report:** scores, charts, profile, per-question answers + answer key, **playback of recording**

### 4.5 Scoring (automatic)

```
MCQ score     = average of 10 MCQs (correct = 10, else 0)
Coding score  = average of 2 AI/fallback code grades (0–10)
Technical     = 0.5 × MCQ + 0.5 × coding
Presence      = eye-contact / gaze penalty / tab distractions
Overall       = 0.6 × technical + 0.4 × presence
```

**Verdicts:** Strong Hire ≥ 8.5 · Hire ≥ 7 · Borderline ≥ 5.5 · else Reject.

Early exit (camera / tab) still writes a full result so HR can compare candidates.

### 4.6 Demo mode

If `GEMINI_API_KEY` / Whisper are missing or quota is hit, the AI service returns **fallback** questions and mock grades. The UI can show a **Demo mode** badge. The product still runs end-to-end.

---

## 5. Project flow (end-to-end)

### 5.1 Candidate path

```
Register / Login
    → Complete profile (≥ 70%)
    → Browse jobs → Apply
    → Device check (camera + mic)
    → Timed Part 1: 10 MCQs
    → Timed Part 2: 2 coding tasks
    → Auto-score + optional recording upload
    → Result page (verdict + charts)
```

### 5.2 Admin path

```
Login as HR
    → Create job role (title, skills, description)
    → Candidates apply and sit the test
    → Overview dashboard
    → Candidates list (every applicant)
    → Open report: scores + recording + answers
    → Compare / export CSV
```

### 5.3 Interview runtime (system)

1. `POST /interviews/start/:applicationId` upserts the interview and attaches **12 questions** (Gemini or stack fallback).
2. Client shows one question at a time with a countdown.
3. `POST /interviews/:id/answers` saves MCQ or code; MCQ is marked locally on the server; code is graded by FastAPI.
4. `POST /interviews/:id/proctor` + on-device face check watch the camera.
5. `POST /interviews/:id/recording` stores the WebM session.
6. `POST /interviews/:id/complete` with `submitted` | `camera_lost` | `tab_switch` computes scores and sets application `completed`.

### 5.4 High-level data flow

```
Candidate UI  →  Express  →  MongoDB
                    ↓
              FastAPI AI
                    ↓
         Gemini / Whisper / MediaPipe
```

---

## 6. How to run from scratch

### 6.1 Prerequisites

| Requirement | Version / notes |
| --- | --- |
| Node.js | 20 or newer |
| Python | 3.11 recommended |
| MongoDB | Community Server, running locally |
| Browser | Chrome / Edge / Firefox on **localhost** (camera requires localhost or HTTPS) |
| Optional keys | Google Gemini, OpenAI (Whisper) |

Install MongoDB and confirm it is running (`mongodb://127.0.0.1:27017`).

Windows (if MongoDB is a service):

```bat
net start MongoDB
```

### 6.2 Install and configure (first time)

From the project root (`F:\SmartAssess AI` or your clone path):

```bash
npm run setup
```

This will:

- `npm install` at root, `client/`, and `server/`
- Create `ai-service/.venv` and `pip install -r requirements.txt`
- Copy `.env.example` → `.env` if those files do not exist

**Edit env files (optional but recommended):**

`server/.env`

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smartassess
JWT_SECRET=change-me-to-a-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
AI_SERVICE_URL=http://127.0.0.1:8000
```

`ai-service/.env`

```
PORT=8000
GEMINI_API_KEY=          # optional
OPENAI_API_KEY=          # optional
GEMINI_MODEL=gemini-2.0-flash
MOCK_MODE=auto
```

`client/.env`

```
VITE_API_URL=/api/v1
```

Vite proxies `/api` and `/uploads` to port 5000.

### 6.3 Seed demo data

```bash
npm run seed
```

Creates demo users, three job roles, and a sample completed interview.

| Role | Email | Password |
| --- | --- | --- |
| Admin / HR | `admin@smartassess.ai` | `Admin@123` |
| Candidate | `jordan@demo.ai` | `Candidate@123` |

The API also **auto-seeds** missing demo data when it starts.

### 6.4 Start all services

```bash
npm run dev
```

| Process | URL |
| --- | --- |
| Client | http://localhost:5173 |
| API | http://localhost:5000 |
| AI | http://127.0.0.1:8000 |

Open **http://localhost:5173**.

### 6.5 Individual scripts

```bash
npm run dev:client    # Vite only
npm run dev:server    # Express only
npm run dev:ai        # FastAPI only
npm run build         # Production client build
npm run lint          # Client ESLint
```

### 6.6 First-time walkthrough

**As candidate**

1. Login `jordan@demo.ai` / `Candidate@123` (or register a new account).
2. Fill profile to ≥ 70%.
3. Jobs → apply → **Continue interview**.
4. Allow camera & mic → Begin test → submit MCQs and code.
5. See **Your result** automatically.

**As admin**

1. Login `admin@smartassess.ai` / `Admin@123`.
2. Overview charts + CSV.
3. **Candidates** → open a report → play recording and review MCQ/coding.

### 6.7 Common issues

| Symptom | What to do |
| --- | --- |
| Cannot reach API | Start MongoDB, then `npm run dev`; API must listen on 5000 |
| Empty questions | Refresh; start is idempotent and uses fallback if Gemini quota fails |
| Camera blocked | Use `localhost` (not a LAN IP) or HTTPS; grant permission |
| Demo mode badge | Add keys in `ai-service/.env` or ignore (demo still works) |
| Gemini 429 quota | Fallback questions/grades are used automatically |

---

## 7. Main API (`/api/v1`)

Envelope: `{ success, message, data }`. Auth: `Authorization: Bearer` or `token` cookie.

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Candidate signup |
| POST | `/auth/login` | public | Login |
| GET | `/auth/me` | auth | Current user |
| GET/PUT | `/profile` | candidate | Profile |
| GET | `/roles` | public | Open jobs |
| CRUD | `/admin/roles` | admin | Job roles |
| POST | `/applications/:roleId` | candidate | Apply |
| GET | `/applications/me` | candidate | My applications |
| GET | `/admin/applications` | admin | All applicants + interviews |
| POST | `/interviews/start/:applicationId` | auth | Start / resume + generate test |
| POST | `/interviews/:id/answers` | candidate | Submit MCQ or code |
| POST | `/interviews/:id/proctor` | candidate | Face / gaze batch |
| POST | `/interviews/:id/recording` | candidate | Session video |
| POST | `/interviews/:id/complete` | auth | Finalize scores |
| GET | `/interviews/:id` | owner/admin | Full report |
| GET | `/admin/dashboard` | admin | KPIs |
| GET | `/admin/export.csv` | admin | CSV |

**Python (Node only):** `GET /health`, `POST /generate-assessment`, `POST /grade-code`, `POST /analyze-frames`, `POST /generate-questions`, `POST /transcribe-grade`.

---

## 8. Design notes

- Palette: black / gray / white (Monochrome Luxe), light and dark theme.
- Landing: motion, blur-in headlines, job photography.
- Interview UI: live camera + question card + countdown.
- Reports: score rings + bar / radar / line / doughnut charts.

---

## 9. Project decisions

- Dynamic tests are **per interview**, driven by **role skills**, not a fixed 10 spoken questions.
- Correct MCQ keys stay on the server.
- Unanswered items score 0 so early termination is comparable.
- Integrity events (`camera_lost`, `tab_switch`) still produce a result for HR.
- Recordings live under `uploads/recordings` and are played from `/uploads/...`.

---

## 10. Presentation (5–6 slides) — copy-paste content

Use one title + 3–5 bullets per slide. Keep speaker notes in parentheses if needed.

---

### Slide 1 — Title

**SmartAssess AI**  
Automated, proctored technical screening for hiring

- Timed MCQ + coding test matched to the job stack  
- Instant scores for HR and the candidate  
- Camera integrity + session recording  

*Subtitle:* MERN + Python FastAPI · Demo: localhost:5173

---

### Slide 2 — Problem & solution

**Problem**

- Too many applicants; first round is slow and inconsistent  
- Hard to compare candidates fairly  

**Solution**

- One standard test per role, generated from **skills**  
- Auto-score in seconds; HR reviews reports in parallel  

---

### Slide 3 — How it works (flow)

**Candidate:** Profile (≥70%) → Apply → Camera check → **10 MCQs** → **2 coding** → Result  

**Admin:** Create role (stack) → View all results → Open report + **recording**  

**Stack:** React (5173) → Express (5000) → MongoDB · FastAPI (8000) → Gemini / gaze  

---

### Slide 4 — Core features

- Dynamic easy–medium paper (10 MCQ + 2 code), timed  
- Instant overall / MCQ / coding / presence + hire verdict  
- Anti-cheat: face required, black screen + stop if missing; no paste; tab watch  
- HR: every candidate, charts, CSV, video playback  

---

### Slide 5 — Tech & scoring

**Tech:** React, Vite, Tailwind · Node/Express, JWT, MongoDB · FastAPI, Gemini, MediaPipe  

**Score:** Technical = 50% MCQ + 50% coding · Overall = 60% technical + 40% presence  

**Verdict:** Strong Hire ≥ 8.5 · Hire ≥ 7 · Borderline ≥ 5.5 · Reject  

---

### Slide 6 — Demo & close

**Run:** `npm run setup` → start MongoDB → `npm run seed` → `npm run dev`  

**Logins:** HR `admin@smartassess.ai` / `Admin@123` · Candidate `jordan@demo.ai` / `Candidate@123`  

**Ask:** Questions? (Works in demo mode without paid AI keys.)

---

### Optional speaker lines (30 seconds)

“SmartAssess turns the first technical round into a 20-minute, camera-proctored test. Ten MCQs and two coding tasks are generated from the job’s stack, scored on the spot, and stored with a recording so HR can compare everyone in one dashboard.”
