import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import api from "../lib/api";
import { Card, Input, Button, Badge } from "../components/ui/primitives";
import CountUp from "../components/charts/CountUp";
import { verdictTone, formatDate } from "../lib/utils";

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("completedAt");

  useEffect(() => {
    api.get("/admin/dashboard").then(({ data }) => setStats(data.data));
  }, []);

  const rows = useMemo(() => {
    let list = stats?.recent || [];
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((r) => `${r.candidate} ${r.email} ${r.role}`.toLowerCase().includes(s));
    }
    return [...list].sort((a, b) => {
      if (sort === "overall") return (b.overall || 0) - (a.overall || 0);
      return new Date(b.completedAt) - new Date(a.completedAt);
    });
  }, [stats, q, sort]);

  if (!stats) return <p>Loading…</p>;
  const k = stats.kpis;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-tight">HR overview</h1>
        <Button
          variant="outline"
          onClick={async () => {
            const res = await api.get("/admin/export.csv", { responseType: "blob" });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = "smartassess-results.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Candidates", k.candidates],
          ["Roles", k.roles],
          ["Completed", k.completedInterviews],
          ["Avg overall", k.avgOverall],
        ].map((x) => (
          <Card key={x[0]}>
            <p className="text-xs uppercase tracking-widest text-ink-400">{x[0]}</p>
            <p className="font-display text-4xl mt-2">
              <CountUp value={x[1]} decimals={x[0].includes("Avg") ? 1 : 0} />
            </p>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm mb-2">Candidates per role</p>
          <Bar
            data={{
              labels: Object.keys(stats.byRole),
              datasets: [{ data: Object.values(stats.byRole), backgroundColor: "#111111", label: "Completed" }],
            }}
            options={{ plugins: { legend: { display: false } } }}
          />
        </Card>
        <Card>
          <p className="text-sm mb-2">Score distribution</p>
          <Bar
            data={{
              labels: Object.keys(stats.scoreBuckets),
              datasets: [{ data: Object.values(stats.scoreBuckets), backgroundColor: "#52525b", label: "Count" }],
            }}
            options={{ plugins: { legend: { display: false } } }}
          />
        </Card>
        <Card>
          <p className="text-sm mb-2">Hiring funnel</p>
          <Bar
            data={{
              labels: Object.keys(stats.funnel),
              datasets: [{ data: Object.values(stats.funnel), backgroundColor: "#a1a1aa", label: "People" }],
            }}
          />
        </Card>
        <Card>
          <p className="text-sm mb-2">Verdicts</p>
          <Doughnut
            data={{
              labels: Object.keys(stats.verdicts),
              datasets: [{ data: Object.values(stats.verdicts), backgroundColor: ["#0a0a0a", "#27272a", "#71717a", "#d4d4d8"] }],
            }}
          />
        </Card>
      </div>
      <Card>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input placeholder="Search candidate or role" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="h-11 rounded-xl border px-3 bg-transparent" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="completedAt">Newest</option>
            <option value="overall">Highest score</option>
          </select>
        </div>
        <div className="hidden md:block overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-400">
                <th className="py-2">Candidate</th>
                <th>Role</th>
                <th>Overall</th>
                <th>MCQ</th>
                <th>Code</th>
                <th>Verdict</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-ink-100 dark:border-ink-800">
                  <td className="py-3">
                    <Link className="underline" to={`/admin/candidates/${r.id}`}>{r.candidate}</Link>
                    <div className="text-xs text-ink-400">{r.email}</div>
                  </td>
                  <td>{r.role}</td>
                  <td>{r.overall}</td>
                  <td>{r.mcq ?? "—"}</td>
                  <td>{r.coding ?? "—"}</td>
                  <td><span className={`rounded-full px-2 py-1 text-xs ${verdictTone(r.verdict)}`}>{r.verdict}</span></td>
                  <td>{formatDate(r.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="border border-ink-200 dark:border-ink-800 rounded-xl p-3">
              <Link to={`/admin/candidates/${r.id}`} className="font-medium">{r.candidate}</Link>
              <p className="text-sm text-ink-500">{r.role} · overall {r.overall} · MCQ {r.mcq ?? "—"} · code {r.coding ?? "—"}</p>
              <Badge className={verdictTone(r.verdict)}>{r.verdict}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
