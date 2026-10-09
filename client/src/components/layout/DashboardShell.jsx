import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Briefcase, Users, UserRound, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import DemoBadge from "./DemoBadge";

export default function DashboardShell({ mode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const admin = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/roles", label: "Job roles", icon: Briefcase },
    { to: "/admin/candidates", label: "Candidates", icon: Users },
  ];
  const cand = [
    { to: "/app", label: "Home", icon: LayoutDashboard, end: true },
    { to: "/app/profile", label: "Profile", icon: UserRound },
    { to: "/jobs", label: "Jobs", icon: Briefcase },
  ];
  const items = mode === "admin" ? admin : cand;

  const sidebar = (
    <aside className="w-64 shrink-0 p-4 hidden md:flex flex-col gap-4 border-r border-ink-200 dark:border-ink-800 min-h-screen sticky top-0">
      <button className="text-left font-display font-semibold" onClick={() => navigate("/")}>
        SmartAssess-AI
      </button>
      <DemoBadge />
      <nav className="flex flex-col gap-1">
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.end}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-3 h-11 text-sm ${isActive ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950" : "hover:bg-ink-100 dark:hover:bg-ink-900"}`
            }
          >
            <i.icon size={16} /> {i.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-2">
        <ThemeToggle />
        <button className="h-11 px-3 rounded-full border border-ink-200 dark:border-ink-700" onClick={async () => { await logout(); navigate("/"); }}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-ink-50 dark:bg-ink-950">
      {sidebar}
      <div className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-30 glass flex items-center justify-between px-4 py-3">
          <button aria-label="Open navigation" className="h-11 w-11 grid place-items-center" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <span className="text-sm">{user?.name}</span>
          <ThemeToggle />
        </div>
        {open && (
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)}>
            <div className="w-72 h-full bg-white dark:bg-ink-950 p-4" onClick={(e) => e.stopPropagation()}>
              {items.map((i) => (
                <NavLink key={i.to} to={i.to} onClick={() => setOpen(false)} className="block py-3">
                  {i.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
        <main className="p-4 md:p-8 max-w-6xl">
          <Outlet />
        </main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 glass flex justify-around py-2 z-30">
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} className="flex flex-col items-center text-[11px] min-w-[44px] min-h-[44px] justify-center">
            <i.icon size={16} />
            {i.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
