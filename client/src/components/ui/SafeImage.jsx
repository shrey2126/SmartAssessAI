import { useState } from "react";

export default function SafeImage({ src, alt, width, height, className = "" }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div
        className={`bg-gradient-to-br from-ink-200 to-ink-500 dark:from-ink-800 dark:to-ink-950 ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      className={`img-mono object-cover bg-ink-200 ${className}`}
      onError={() => setOk(false)}
    />
  );
}
