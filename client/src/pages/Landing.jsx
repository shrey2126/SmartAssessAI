import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SmoothScroll from "../components/animations/SmoothScroll";
import BlurIn from "../components/animations/BlurIn";
import { Magnetic, Reveal, TiltCard } from "../components/animations/Motion";
import BorderBeam from "../components/animations/BorderBeam";
import { Button, Card } from "../components/ui/primitives";
import SafeImage from "../components/ui/SafeImage";
import CountUp from "../components/charts/CountUp";
import { IMAGES } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const logos = ["Northstar", "Helix", "Orbit HR", "Lumen", "Cascade", "Vesper"];
const faqs = [
  ["Do I need camera access?", "Yes. Interviews record audio and sample video frames locally, then upload to your Node API."],
  ["What if AI keys are missing?", "The Python service falls back to labelled Demo mode so the product still works."],
  ["How is confidence scored?", "MediaPipe Face Mesh iris landmarks estimate gaze. Look-aways and missing faces reduce the 0–10 score."],
  ["Can HR write their own questions?", "Yes — exactly 10 per role, or generate them with Gemini."],
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [faq, setFaq] = useState(0);

  return (
    <div className="relative overflow-x-hidden">
      <SmoothScroll />
      <div className="noise-overlay hidden md:block" />
      <Navbar />
      <section className="relative min-h-[100svh] pt-28 pb-16">
        <div className="absolute inset-0 grid-bg opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg)]" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <p className="text-xs uppercase tracking-[0.28em] text-ink-500 mb-6">Monochrome Luxe · AI screening</p>
          <BlurIn
            text="Replace the first HR round with a scored, recorded interview."
            className="font-display text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight max-w-5xl leading-[1.05]"
          />
          <p className="mt-6 max-w-xl text-ink-500 text-lg">
            Candidates answer 10 questions on camera. Whisper transcribes. Gemini grades. MediaPipe measures eye contact. HR sees a verdict in minutes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Magnetic>
              <Button size="lg" onClick={() => navigate(user ? (user.role === "admin" ? "/admin" : "/app") : "/register")}>
                Start Interview
              </Button>
            </Magnetic>
            <Magnetic>
              <Button size="lg" variant="outline" onClick={() => navigate("/login?role=admin")}>
                Admin Login
              </Button>
            </Magnetic>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-4">
            {[
              ["Technical 8.4", "Whisper + Gemini"],
              ["Confidence 7.8", "Gaze / iris mesh"],
              ["Verdict Hire", "0.6 / 0.4 blend"],
            ].map((c, i) => (
              <motion.div
                key={c[0]}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="glass rounded-2xl p-5 shadow-luxe"
              >
                <p className="font-display text-2xl">{c[0]}</p>
                <p className="text-sm text-ink-500">{c[1]}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 overflow-hidden border-y border-ink-200 dark:border-ink-800">
        <p className="text-center text-xs uppercase tracking-widest text-ink-400 mb-4">Trusted by modern talent teams</p>
        <div className="flex w-max animate-marquee gap-12 px-8 text-ink-400 font-display text-2xl">
          {[...logos, ...logos].map((l, i) => (
            <span key={i} className="whitespace-nowrap">
              {l}
            </span>
          ))}
        </div>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-4 py-24">
        <Reveal>
          <h2 className="font-display text-4xl tracking-tight mb-12">How it works</h2>
        </Reveal>
        <div className="grid md:grid-cols-4 gap-4">
          {["Profile", "Apply", "AI Interview", "Instant Report"].map((s, i) => (
            <Reveal key={s} delay={i * 0.08}>
              <Card>
                <p className="text-xs text-ink-400">0{i + 1}</p>
                <p className="font-display text-2xl mt-2">{s}</p>
                <p className="text-sm text-ink-500 mt-2">A complete step from resume-style profile to scored verdict.</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-4">
          {[
            ["Technical Score", "Whisper speech-to-text then Gemini grades correctness."],
            ["Confidence Score", "Face Mesh iris landmarks estimate gaze and look-away events."],
            ["Dynamic Questions", "Generate 10 role-specific questions with Gemini."],
            ["HR Dashboard", "Funnels, histograms, CSV export, candidate reports."],
          ].map((f, i) => (
            <TiltCard key={f[0]}>
              <BorderBeam>
                <div className="p-6 min-h-[180px]">
                  <p className="font-display text-xl">{f[0]}</p>
                  <p className="text-sm text-ink-500 mt-2">{f[1]}</p>
                </div>
              </BorderBeam>
            </TiltCard>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8 items-center">
        <Card>
          <p className="text-sm text-ink-500 mb-4">Live score demo</p>
          <Bar
            data={{
              labels: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10"],
              datasets: [
                {
                  label: "Technical",
                  data: [7.2, 8.1, 6.8, 8.8, 7.5, 9.0, 8.2, 7.0, 8.4, 8.1],
                  backgroundColor: "#111111",
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: { x: { grid: { display: false } }, y: { max: 10, grid: { color: "#e4e4e7" } } },
              responsive: true,
            }}
          />
        </Card>
        <Reveal>
          <h2 className="font-display text-4xl tracking-tight">Scores that hiring teams can defend.</h2>
          <p className="text-ink-500 mt-4">Every answer has a transcript, 0–10 technical score, and feedback. Confidence is independent of content — it is gaze, presence, and focus.</p>
        </Reveal>
      </section>

      <section className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-4">
        {[
          [IMAGES.office, "Modern office collaboration"],
          [IMAGES.laptop, "Engineer coding on a laptop"],
          [IMAGES.handshake, "Interview handshake"],
        ].map(([src, alt]) => (
          <SafeImage key={alt} src={src} alt={alt} width={800} height={520} className="w-full h-64 rounded-2xl" />
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          [1280, "Interviews run"],
          [4.2, "Avg hours saved"],
          [92, "HR satisfaction"],
          [10, "Questions / role"],
        ].map((s) => (
          <div key={s[1]}>
            <p className="font-display text-4xl">
              <CountUp value={s[0]} decimals={s[0] % 1 ? 1 : 0} />
              {s[1].includes("hours") ? "k" : s[1].includes("%") || s[1].includes("satisfaction") ? "%" : ""}
            </p>
            <p className="text-sm text-ink-500">{s[1]}</p>
          </div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="overflow-hidden">
          <div className="flex gap-4 animate-marquee w-max">
            {[
              ["Priya S.", "We hired two seniors after watching scored interviews instead of calendar Tetris."],
              ["Marcus L.", "The confidence score caught distracted candidates we would have missed on paper."],
              ["Elena R.", "Demo mode meant we could trial internally before wiring API keys."],
              ["Priya S.", "We hired two seniors after watching scored interviews instead of calendar Tetris."],
            ].map((t, i) => (
              <Card key={i} className="w-[320px] shrink-0">
                <p className="text-sm">{t[1]}</p>
                <p className="mt-4 text-xs uppercase tracking-widest text-ink-400">{t[0]}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="font-display text-3xl mb-6">FAQ</h2>
        {faqs.map((item, i) => (
          <button
            key={item[0]}
            className="w-full text-left border-b border-ink-200 dark:border-ink-800 py-4"
            onClick={() => setFaq(faq === i ? -1 : i)}
            aria-expanded={faq === i}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{item[0]}</span>
              <ChevronDown className={`transition ${faq === i ? "rotate-180" : ""}`} />
            </div>
            {faq === i && <p className="text-sm text-ink-500 mt-2">{item[1]}</p>}
          </button>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <Card className="text-center py-16 bg-ink-950 text-white dark:bg-white dark:text-ink-950">
          <h2 className="font-display text-4xl">Run your next screen without a calendar.</h2>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/register">
              <Button className="bg-white text-ink-950 dark:bg-ink-950 dark:text-white">Create candidate account</Button>
            </Link>
            <Link to="/jobs">
              <Button variant="outline" className="border-white text-white dark:border-ink-950 dark:text-ink-950">
                Browse roles
              </Button>
            </Link>
          </div>
        </Card>
      </section>
      <Footer />
    </div>
  );
}
