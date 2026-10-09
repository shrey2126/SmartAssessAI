import { motion } from "framer-motion";

export default function ScoreRing({ value = 0, label }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(10, Number(value) || 0)) / 10;
  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" className="text-ink-200 dark:text-ink-800" strokeWidth="10" />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.1 }}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="76" textAnchor="middle" className="fill-current font-display" fontSize="22">
          {Number(value || 0).toFixed(1)}
        </text>
      </svg>
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}
