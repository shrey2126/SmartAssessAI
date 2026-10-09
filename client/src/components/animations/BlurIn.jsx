import { motion } from "framer-motion";

export default function BlurIn({ text, className = "" }) {
  const words = String(text).split(" ");
  return (
    <h1 className={className}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          initial={{ opacity: 0, filter: "blur(10px)", y: 12 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.5 }}
          className="inline-block mr-[0.3em]"
        >
          {w}
        </motion.span>
      ))}
    </h1>
  );
}
