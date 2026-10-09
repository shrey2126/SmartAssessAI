import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";
import { Button, Card } from "../components/ui/primitives";
import { useAuth } from "../context/AuthContext";

const startInflight = new Map();

function startInterviewRequest(applicationId) {
  const key = String(applicationId);
  if (!startInflight.has(key)) {
    startInflight.set(
      key,
      api
        .post(`/interviews/start/${applicationId}`, null, { timeout: 25000 })
        .finally(() => startInflight.delete(key))
    );
  }
  return startInflight.get(key);
}

function pickMime() {
  const types = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  return types.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || "";
}

function clock(sec) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function frameLooksCovered(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const { width, height } = canvas;
  if (!width || !height) return true;
  const sample = ctx.getImageData(0, 0, width, height).data;
  let sum = 0;
  let sumSq = 0;
  const n = sample.length / 4;
  for (let i = 0; i < sample.length; i += 4) {
    const y = sample[i] * 0.3 + sample[i + 1] * 0.59 + sample[i + 2] * 0.11;
    sum += y;
    sumSq += y * y;
  }
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  return mean < 18 || variance < 40;
}

export default function Interview() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { setDemoMode } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const sessionRecRef = useRef(null);
  const sessionChunksRef = useRef([]);
  const framesRef = useRef([]);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const distractionsRef = useRef(0);
  const tabWarnRef = useRef(0);
  const finishingRef = useRef(false);
  const submittingRef = useRef(false);
  const missRef = useRef(0);
  const indexRef = useRef(0);
  const selectedRef = useRef("");
  const codeRef = useRef("");
  const interviewRef = useRef(null);
  const questionsRef = useRef([]);

  const [phase, setPhase] = useState("permissions");
  const [error, setError] = useState("");
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [level, setLevel] = useState(0);
  const [typed, setTyped] = useState("");
  const [uploading, setUploading] = useState(false);
  const [count, setCount] = useState(3);
  const [selectedOption, setSelectedOption] = useState("");
  const [code, setCode] = useState("");
  const [faceMissing, setFaceMissing] = useState(false);

  indexRef.current = index;
  selectedRef.current = selectedOption;
  codeRef.current = code;
  interviewRef.current = interview;
  questionsRef.current = questions;

  const load = useCallback(async () => {
    setError("");
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const { data } = await startInterviewRequest(applicationId);
        const pack = data.data;
        const qs = pack.questions || [];
        if (!qs.length) throw new Error("Questions were empty");
        setInterview(pack.interview);
        setQuestions(qs);
        if (pack.interview?.completedAt) {
          navigate(`/app/complete/${applicationId}`, { replace: true });
          return;
        }
        setIndex(Math.min(pack.nextIndex || 0, Math.max(0, qs.length - 1)));
        if (pack.interview?.mockMode) setDemoMode(true);
        return;
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 400));
      }
    }
    setError(lastErr?.response?.data?.message || lastErr?.message || "Could not start interview");
  }, [applicationId, setDemoMode, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const q = questions[index];
    setTyped("");
    setSelectedOption("");
    setCode(q?.starterCode || "");
    setSecondsLeft(q?.timeLimitSec || (q?.type === "coding" ? 420 : 60));
    framesRef.current = [];
    let i = 0;
    const text = q?.text || "";
    const t = setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, 8);
    return () => clearInterval(t);
  }, [index, questions]);

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden || phase !== "live" || finishingRef.current) return;
      distractionsRef.current += 1;
      tabWarnRef.current += 1;
      if (tabWarnRef.current === 1) {
        toast.error("Stay on this tab. Another switch ends the test.");
      } else {
        finish("tab_switch");
      }
    };
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const block = (e) => e.preventDefault();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "live") return undefined;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setTimeout(() => submitCurrent(true), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, index]);

  function stopMedia() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  async function enableMedia() {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera API unavailable. Use Chrome/Edge/Firefox on localhost or HTTPS.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        setLevel(data.reduce((a, b) => a + b, 0) / data.length / 255);
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => finish("camera_lost"));
      });
      setPhase("ready");
    } catch (e) {
      if (e.name === "NotAllowedError") setError("Camera and microphone are required. Enable access and retry.");
      else if (e.name === "NotFoundError") setError("No camera or microphone was found. The test cannot start without a camera.");
      else setError(e.message || "Could not access devices.");
    }
  }

  function beginCountdown() {
    setPhase("countdown");
    setCount(3);
    let n = 3;
    const t = setInterval(() => {
      n -= 1;
      setCount(n);
      if (n <= 0) {
        clearInterval(t);
        startSessionRec();
        setPhase("live");
      }
    }, 800);
  }

  function startSessionRec() {
    if (!streamRef.current || !window.MediaRecorder) return;
    const mime = pickMime();
    const rec = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined);
    sessionRecRef.current = rec;
    sessionChunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) sessionChunksRef.current.push(e.data);
    };
    rec.start(1000);
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return null;
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 320, 180);
    const url = canvas.toDataURL("image/jpeg", 0.5);
    framesRef.current.push(url);
    if (framesRef.current.length > 40) framesRef.current.shift();
    return { covered: frameLooksCovered(canvas), canvas };
  }

  async function detectFace() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return false;
    if ("FaceDetector" in window) {
      try {
        const fd = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
        const faces = await fd.detect(video);
        return faces.length > 0;
      } catch {
        /* fall through */
      }
    }
    const shot = captureFrame();
    if (!shot) return false;
    if (shot.covered) return false;
    try {
      const { data } = await api.post(`/interviews/${interviewRef.current._id}/proctor`, {
        frames: framesRef.current.slice(-2),
      });
      if (data.data.mock) return !shot.covered;
      return Boolean(data.data.facePresent);
    } catch {
      return !shot.covered;
    }
  }

  useEffect(() => {
    if (phase !== "live") return undefined;
    const cap = setInterval(() => captureFrame(), 700);
    const watch = setInterval(async () => {
      if (finishingRef.current) return;
      const present = await detectFace();
      if (present) {
        missRef.current = 0;
        setFaceMissing(false);
        return;
      }
      missRef.current += 1;
      setFaceMissing(true);
      if (missRef.current >= 5) {
        finish("camera_lost");
      }
    }, 700);
    return () => {
      clearInterval(cap);
      clearInterval(watch);
    };
  }, [phase]);

  async function stopAndUploadRecording() {
    const rec = sessionRecRef.current;
    if (rec && rec.state !== "inactive") {
      await new Promise((resolve) => {
        rec.onstop = resolve;
        rec.stop();
      });
    }
    sessionRecRef.current = null;
    const chunks = sessionChunksRef.current;
    if (!chunks.length || !interviewRef.current) return;
    const blob = new Blob(chunks, { type: rec?.mimeType || "video/webm" });
    const fd = new FormData();
    fd.append("recording", blob, "session.webm");
    try {
      await api.post(`/interviews/${interviewRef.current._id}/recording`, fd, { timeout: 120000 });
    } catch {
      /* still complete */
    }
  }

  async function finish(reason) {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFaceMissing(reason === "camera_lost");
    setPhase(reason === "camera_lost" ? "blackout" : "evaluating");
    try {
      await stopAndUploadRecording();
      await api.post(`/interviews/${interviewRef.current._id}/complete`, { reason });
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not finalize result");
    } finally {
      stopMedia();
      navigate(`/app/complete/${applicationId}`);
    }
  }

  async function submitCurrent(timedOut = false) {
    if (finishingRef.current || submittingRef.current) return;
    submittingRef.current = true;
    const q = questionsRef.current[indexRef.current];
    const id = interviewRef.current?._id;
    if (!q || !id) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("questionIndex", String(indexRef.current));
      fd.append("frames", JSON.stringify(framesRef.current.slice(0, 40)));
      fd.append("distractionEvents", String(distractionsRef.current));
      fd.append("timedOut", String(Boolean(timedOut)));
      if (q.type === "mcq") fd.append("selectedOption", selectedRef.current || "");
      else fd.append("code", codeRef.current || "");
      distractionsRef.current = 0;
      const { data } = await api.post(`/interviews/${id}/answers`, fd, { timeout: 60000 });
      if (data.data.mock) setDemoMode(true);
      const last = indexRef.current >= questionsRef.current.length - 1;
      if (last) {
        await finish("submitted");
      } else {
        setIndex((i) => i + 1);
        toast.success(timedOut ? "Time up — saved" : "Saved");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Submit failed");
    } finally {
      submittingRef.current = false;
      setUploading(false);
    }
  }

  useEffect(() => () => stopMedia(), []);

  const q = questions[index];
  const mcqCount = questions.filter((x) => x.type === "mcq").length || 10;
  const codingCount = questions.filter((x) => x.type === "coding").length || 2;
  const part = q?.type === "coding" ? 2 : 1;
  const partIndex =
    q?.type === "coding"
      ? index - questions.findIndex((x) => x.type === "coding") + 1
      : index + 1;
  const partTotal = q?.type === "coding" ? codingCount : mcqCount;
  const lowTime = secondsLeft <= 10;

  return (
    <div className={`min-h-screen p-4 md:p-8 ${phase === "blackout" || faceMissing ? "bg-black" : "bg-ink-50 dark:bg-ink-950"}`}>
      {(phase === "blackout" || (faceMissing && phase === "live")) && (
        <div className="fixed inset-0 z-50 bg-black text-white grid place-items-center p-8 text-center">
          <div>
            <p className="font-display text-4xl mb-3">Camera lost</p>
            <p className="text-white/70">
              Your face was not visible. The screen is locked and the test is being terminated. A result will be generated from answers so far.
            </p>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between gap-2 text-sm text-ink-500 mb-4">
          <p>
            Part {part} of 2 · {q?.type === "coding" ? "Coding" : "MCQ"} {partIndex} of {partTotal}
          </p>
          {phase === "live" && (
            <p className={`font-mono text-base ${lowTime ? "text-red-600" : ""}`}>Time {clock(secondsLeft)}</p>
          )}
        </div>
        {error && <Card className="mb-4 text-sm">{error}</Card>}
        {phase === "permissions" && (
          <Card className="max-w-lg mx-auto text-center space-y-4">
            <h1 className="font-display text-3xl">Device check</h1>
            <p className="text-ink-500 text-sm">
              Camera and microphone are required. If you leave the frame, the test ends immediately and a partial result is saved.
              Copy/paste and leaving this tab are blocked.
            </p>
            <p className="text-xs text-ink-400">
              Part 1: 10 timed MCQs (easy–medium, this role’s stack). Part 2: 2 timed coding tasks.
            </p>
            {!questions.length && !error && <p className="text-sm text-ink-500">Loading questions…</p>}
            {error && (
              <Button variant="outline" onClick={load}>
                Retry loading questions
              </Button>
            )}
            <Button onClick={enableMedia} disabled={!questions.length}>
              Allow camera & mic
            </Button>
          </Card>
        )}
        <div className={`grid lg:grid-cols-2 gap-4 ${phase === "permissions" ? "hidden" : ""}`}>
          <Card className="p-0 overflow-hidden relative">
            <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video bg-black object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute top-4 left-4 flex items-center gap-2 text-white text-sm">
              <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" /> LIVE
            </div>
            <div className="absolute bottom-4 left-4 right-4 h-2 rounded-full bg-white/20">
              <div className="h-2 rounded-full bg-white" style={{ width: `${Math.min(100, level * 140)}%` }} />
            </div>
          </Card>
          <Card className="min-h-[280px] flex flex-col">
            {phase === "countdown" && <p className="font-display text-7xl m-auto">{count}</p>}
            {phase === "evaluating" && (
              <div className="m-auto text-center">
                <div className="h-12 w-12 rounded-full border-2 border-ink-300 border-t-ink-950 dark:border-t-white animate-spin mx-auto mb-4" />
                <p className="font-display text-2xl">Scoring your test…</p>
              </div>
            )}
            {(phase === "ready" || phase === "live") && (
              <>
                <div className="flex justify-between text-xs uppercase tracking-widest text-ink-400">
                  <span>{q?.difficulty || "easy"} · {q?.type}</span>
                  <span>Question {index + 1} / {questions.length || 12}</span>
                </div>
                <p className="font-display text-xl mt-3 whitespace-pre-wrap">{typed || q?.text}</p>
                {phase === "ready" && (
                  <div className="mt-6">
                    <Button onClick={beginCountdown} disabled={!q?.text}>
                      Begin test
                    </Button>
                  </div>
                )}
                {phase === "live" && q?.type === "mcq" && (
                  <div className="flex flex-col gap-2 w-full mt-4">
                    {q.options?.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => setSelectedOption(opt)}
                        className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                          selectedOption === opt
                            ? "bg-ink-950 text-white border-ink-950 dark:bg-white dark:text-ink-950 dark:border-white"
                            : "bg-white dark:bg-ink-900 border-ink-200 dark:border-ink-700"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                    <Button className="mt-3" disabled={uploading} onClick={() => submitCurrent(false)}>
                      {uploading ? "Submitting…" : "Submit & next"}
                    </Button>
                  </div>
                )}
                {phase === "live" && q?.type === "coding" && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-ink-400">Language: {q.language || "javascript"} · paste is disabled</p>
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      spellCheck={false}
                      className="w-full min-h-[240px] font-mono text-sm rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-950 text-white p-3"
                    />
                    <Button disabled={uploading} onClick={() => submitCurrent(false)}>
                      {uploading ? "Grading…" : "Submit code & next"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
