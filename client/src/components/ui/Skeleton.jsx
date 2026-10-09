export default function Skeleton({ className = "h-4 w-full" }) {
  return <div className={`rounded-xl bg-ink-200/80 dark:bg-ink-800 animate-pulse ${className}`} />;
}
