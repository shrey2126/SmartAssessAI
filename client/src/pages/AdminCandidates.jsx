import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Card, Input, Badge } from "../components/ui/primitives";
import { verdictTone } from "../lib/utils";

export default function AdminCandidates() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/admin/applications", { params: { limit: 200, status } }).then(({ data }) => setItems(data.data.items));
  }, [status]);

  const filtered = items.filter((a) => {
    const s = search.toLowerCase();
    if (!s) return true;
    return `${a.candidate?.name} ${a.candidate?.email} ${a.jobRole?.title}`.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4 pb-16">
      <div>
        <h1 className="font-display text-3xl">All candidate results</h1>
        <p className="text-sm text-ink-500 mt-1">Open any report to review MCQ, coding, presence, and the live recording.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <Input placeholder="Search name, email, or role" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="h-11 rounded-xl border px-3 bg-transparent" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="applied">applied</option>
          <option value="interviewing">interviewing</option>
          <option value="completed">completed</option>
        </select>
      </div>
      {filtered.map((a) => {
        const i = a.interview;
        return (
          <Card key={a._id} className="flex flex-col md:flex-row justify-between gap-3">
            <div>
              <p className="font-medium">{a.candidate?.name}</p>
              <p className="text-sm text-ink-500">{a.candidate?.email} · {a.jobRole?.title}</p>
              {i?.completedAt && (
                <p className="text-xs text-ink-400 mt-1">
                  Overall {i.overallScore} · MCQ {i.mcqScore} · Coding {i.codingScore} · {i.terminationReason || "submitted"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge>{a.status}</Badge>
              {i?.verdict && i.verdict !== "Pending" && (
                <Badge className={verdictTone(i.verdict)}>{i.verdict}</Badge>
              )}
              {i?.recordingPath && <Badge>Recording</Badge>}
              {i && (
                <Link className="underline text-sm" to={`/admin/candidates/${i._id}`}>
                  {i.completedAt ? "View result" : "Open session"}
                </Link>
              )}
            </div>
          </Card>
        );
      })}
      {!filtered.length && <Card>No candidates match this filter.</Card>}
    </div>
  );
}
