import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", size = "md", ...props }) {
  const variants = {
    primary:
      "bg-ink-950 text-white dark:bg-white dark:text-ink-950 hover:opacity-90",
    ghost: "bg-transparent hover:bg-ink-100 dark:hover:bg-ink-800",
    outline: "border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-900",
    danger: "bg-ink-800 text-white",
  };
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-ring disabled:opacity-50 min-h-[44px]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full h-11 rounded-xl border border-ink-200 dark:border-ink-700 bg-white/80 dark:bg-ink-900 px-3 text-sm focus-ring",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full min-h-[96px] rounded-xl border border-ink-200 dark:border-ink-700 bg-white/80 dark:bg-ink-900 px-3 py-2 text-sm focus-ring",
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, children }) {
  return <div className={cn("glass rounded-2xl p-6 shadow-luxe", className)}>{children}</div>;
}

export function Badge({ children, className }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs border border-ink-200 dark:border-ink-700", className)}>
      {children}
    </span>
  );
}

export function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="text-xs uppercase tracking-wide text-ink-500 mb-1.5 block">
      {children}
    </label>
  );
}
