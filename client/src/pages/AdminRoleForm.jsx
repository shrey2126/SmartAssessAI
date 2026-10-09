import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";
import { Button, Card, Input, Label, Textarea } from "../components/ui/primitives";

const blankQ = () => ({ text: "", type: "static", idealAnswerHint: "", options: ["", "", "", ""], correctAnswer: "" });

export default function AdminRoleForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    details: { responsibilities: "", requirements: "", location: "Remote", type: "Full-time", experienceLevel: "Mid" },
    skills: [],
    questions: Array.from({ length: 10 }, blankQ),
    isOpen: true,
  });
  const [skill, setSkill] = useState("");

  useEffect(() => {
    if (!isNew) {
      api.get(`/admin/roles/${id}`).then(({ data }) => setForm(data.data.role));
    }
  }, [id, isNew]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function generate() {
    setBusy(true);
    try {
      const { data } = await api.post("/admin/roles/generate-questions", {
        title: form.title,
        description: form.description,
        skills: form.skills,
      });
      set("questions", data.data.questions);
      if (data.data.mock) toast("Generated in demo mode");
      else toast.success("Generated 10 questions");
    } catch (e) {
      toast.error(e.response?.data?.message || "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    const qs = (form.questions || []).filter((q) => q.text && q.text.trim());
    if (!form.skills?.length) {
      toast.error("Add at least one skill so interviews can generate a stack-specific test");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        details: form.details,
        skills: form.skills,
        questions: qs,
        isOpen: form.isOpen,
      };
      if (isNew) await api.post("/admin/roles", payload);
      else await api.put(`/admin/roles/${id}`, payload);
      toast.success("Saved");
      navigate("/admin/roles");
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 pb-20 max-w-3xl">
      <h1 className="font-display text-3xl">{isNew ? "New role" : "Edit role"}</h1>
      <Card className="space-y-3">
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} required /></div>
        <div><Label>Responsibilities</Label><Textarea value={form.details?.responsibilities} onChange={(e) => set("details", { ...form.details, responsibilities: e.target.value })} /></div>
        <div><Label>Requirements</Label><Textarea value={form.details?.requirements} onChange={(e) => set("details", { ...form.details, requirements: e.target.value })} /></div>
        <div className="grid md:grid-cols-3 gap-2">
          <Input placeholder="Location" value={form.details?.location} onChange={(e) => set("details", { ...form.details, location: e.target.value })} />
          <Input placeholder="Type" value={form.details?.type} onChange={(e) => set("details", { ...form.details, type: e.target.value })} />
          <Input placeholder="Level" value={form.details?.experienceLevel} onChange={(e) => set("details", { ...form.details, experienceLevel: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <Input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Add skill" />
          <Button type="button" variant="outline" onClick={() => { if (skill.trim()) set("skills", [...(form.skills || []), skill.trim()]); setSkill(""); }}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">{(form.skills || []).map((s) => <button type="button" key={s} onClick={() => set("skills", form.skills.filter((x) => x !== s))} className="text-sm border rounded-full px-3 py-1">{s} ×</button>)}</div>
        <p className="text-xs text-ink-400">Live interviews generate 10 timed MCQs and 2 timed coding tasks from this tech stack (easy–medium, unique per candidate).</p>
      </Card>
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl">Optional question bank</h2>
        <Button type="button" variant="outline" disabled={busy} onClick={generate}>Generate with AI</Button>
      </div>
      {form.questions.map((q, i) => (
        <Card key={i}>
          <Label>Question {i + 1}</Label>
          <div className="flex gap-2 mb-2">
            <select
              value={q.type || "static"}
              onChange={(e) => {
                const n = [...form.questions];
                n[i] = { ...q, type: e.target.value };
                if (e.target.value === "mcq" && !n[i].options) {
                  n[i].options = ["", "", "", ""];
                }
                set("questions", n);
              }}
              className="w-full border border-ink-200 dark:border-ink-700 bg-white/80 dark:bg-ink-900 rounded px-2 py-2 text-sm"
            >
              <option value="static">Static (Pre-defined)</option>
              <option value="dynamic">Dynamic (AI Generated)</option>
              <option value="mcq">Multiple Choice</option>
            </select>
          </div>
          <Textarea value={q.text} onChange={(e) => {
            const n = [...form.questions];
            n[i] = { ...q, text: e.target.value };
            set("questions", n);
          }} />
          
          {q.type === "mcq" ? (
            <div className="space-y-2 mt-2">
              <Label>Options (Check correct answer)</Label>
              {(q.options || ["", "", "", ""]).map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={q.correctAnswer === opt && opt !== ""}
                    onChange={() => {
                      const n = [...form.questions];
                      n[i] = { ...q, correctAnswer: opt };
                      set("questions", n);
                    }}
                  />
                  <Input
                    placeholder={`Option ${oIdx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const val = e.target.value;
                      const n = [...form.questions];
                      const newOpts = [...(q.options || ["", "", "", ""])];
                      newOpts[oIdx] = val;
                      n[i] = { ...q, options: newOpts };
                      if (q.correctAnswer === opt) n[i].correctAnswer = val;
                      set("questions", n);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Input className="mt-2" placeholder="Ideal answer hint" value={q.idealAnswerHint} onChange={(e) => {
              const n = [...form.questions];
              n[i] = { ...q, idealAnswerHint: e.target.value };
              set("questions", n);
            }} />
          )}
        </Card>
      ))}
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save role"}</Button>
    </form>
  );
}
