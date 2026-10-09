import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import DemoBadge from "./DemoBadge";
import { Button } from "../ui/primitives";

const links = [
  { to: "/#how", label: "How it works" },
  { to: "/#features", label: "Features" },
  { to: "/jobs", label: "Open roles" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed top-4 inset-x-0 z-40 px-4">
      <nav className="mx-auto max-w-6xl glass rounded-full px-4 py-2 flex items-center justify-between shadow-glass">
        <Link to="/" className="font-display font-semibold tracking-tight px-2">
          SmartAssess-AI
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="text-ink-500 hover:text-ink-950 dark:hover:text-white">
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <DemoBadge />
          <ThemeToggle />
          {user ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => navigate(user.role === "admin" ? "/admin" : "/app")}>
                Dashboard
              </Button>
              <Button size="sm" variant="outline" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Start Interview
              </Button>
            </>
          )}
        </div>
        <button className="md:hidden h-11 w-11 grid place-items-center" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu />
        </button>
      </nav>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white dark:bg-ink-950 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <span className="font-display font-semibold">Menu</span>
              <button aria-label="Close menu" className="h-11 w-11 grid place-items-center" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              ))}
              <ThemeToggle />
              {user ? (
                <Button onClick={() => { setOpen(false); navigate(user.role === "admin" ? "/admin" : "/app"); }}>Dashboard</Button>
              ) : (
                <Button onClick={() => { setOpen(false); navigate("/register"); }}>Start Interview</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
