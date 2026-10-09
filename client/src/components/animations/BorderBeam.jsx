export default function BorderBeam({ children, className = "" }) {
  return (
    <div className={`relative rounded-2xl p-[1px] overflow-hidden ${className}`}>
      <div className="absolute inset-[-50%] bg-[conic-gradient(from_90deg,transparent_0%,#a1a1aa_10%,transparent_20%)] animate-[spin_6s_linear_infinite] opacity-70" />
      <div className="relative rounded-2xl bg-white dark:bg-ink-950">{children}</div>
    </div>
  );
}
