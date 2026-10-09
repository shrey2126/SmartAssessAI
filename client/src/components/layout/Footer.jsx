import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-ink-200 dark:border-ink-800 mt-24">
      <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <p className="font-display font-semibold text-lg">SmartAssess-AI</p>
          <p className="text-ink-500 mt-2">Replace the first HR screen with scored, recorded interviews.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Link to="/jobs">Open roles</Link>
          <Link to="/login">Candidate login</Link>
          <Link to="/login?role=admin">Admin login</Link>
        </div>
        <p className="text-ink-400">© {new Date().getFullYear()} SmartAssess-AI. Monochrome Luxe.</p>
      </div>
    </footer>
  );
}
