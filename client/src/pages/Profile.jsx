import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { Button, Card, Input, Label, Textarea, Badge } from "../components/ui/primitives";

const STEPS = ["Personal", "Links", "Skills", "Education", "Experience", "Projects"];

const empty = {
  fullName: "",
  phone: "",
  email: "",
  location: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  skills: [],
  education: [{ degree: "", institution: "", passingYear: "", cgpa: "" }],
  experience: [{ jobTitle: "", company: "", startDate: "", endDate: "", description: "" }],
  projects: [{ title: "", techStack: [], objective: "" }],
  summary: "",
};

export default function Profile() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    api.get("/profile").then(({ data }) => {
      const p = data.data.profile || {};
      setForm({
        ...empty,
        ...p,
        education: p.education?.length ? p.education : empty.education,
        experience: p.experience?.length ? p.experience : empty.experience,
        projects: p.projects?.length ? p.projects : empty.projects,
      });
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return undefined;
    const t = setTimeout(() => {
      save(true);
    }, 900);
    return () => clearTimeout(t);
  }, [form]);

  async function save(silent) {
    setSaving(true);
    try {
      const { data } = await api.put("/profile", form);
      setForm((f) => ({ ...f, completionPercent: data.data.profile.completionPercent }));
      if (!silent) toast.success("Saved");
    } catch (e) {
      if (!silent) toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const preview = useMemo(() => form, [form]);

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6 pb-20">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl">Profile builder</h1>
          <Badge>{form.completionPercent || 0}% complete {saving ? "· saving" : ""}</Badge>
        </div>
        <div className="h-2 rounded-full bg-ink-200 dark:bg-ink-800 mb-6">
          <div className="h-2 rounded-full bg-ink-950 dark:bg-white transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="flex gap-2 overflow-auto mb-6">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)} className={`rounded-full px-3 h-11 text-sm whitespace-nowrap ${i === step ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950" : "border border-ink-200 dark:border-ink-700"}`}>
              {s}
            </button>
          ))}
        </div>
        <Card className="space-y-4">
          {step === 0 && (
            <>
              <Field label="Full name"><Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Email"><Input value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Location"><Input value={form.location} onChange={(e) => set("location", e.target.value)} /></Field>
              <Field label="Summary"><Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
            </>
          )}
          {step === 1 && (
            <>
              <Field label="LinkedIn"><Input value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} /></Field>
              <Field label="GitHub"><Input value={form.githubUrl} onChange={(e) => set("githubUrl", e.target.value)} /></Field>
              <Field label="Portfolio"><Input value={form.portfolioUrl} onChange={(e) => set("portfolioUrl", e.target.value)} /></Field>
            </>
          )}
          {step === 2 && (
            <div>
              <Label>Core skills</Label>
              <div className="flex gap-2">
                <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (skillInput.trim()) set("skills", [...form.skills, skillInput.trim()]);
                    setSkillInput("");
                  }
                }} placeholder="Type and press Enter" />
                <Button type="button" variant="outline" onClick={() => { if (skillInput.trim()) set("skills", [...form.skills, skillInput.trim()]); setSkillInput(""); }}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {form.skills.map((s) => (
                  <button key={s} className="rounded-full border px-3 py-1 text-sm" onClick={() => set("skills", form.skills.filter((x) => x !== s))}>{s} ×</button>
                ))}
              </div>
            </div>
          )}
          {step === 3 && form.education.map((ed, i) => (
            <div key={i} className="grid md:grid-cols-2 gap-3">
              <Input placeholder="Degree" value={ed.degree} onChange={(e) => { const n = [...form.education]; n[i] = { ...ed, degree: e.target.value }; set("education", n); }} />
              <Input placeholder="Institution" value={ed.institution} onChange={(e) => { const n = [...form.education]; n[i] = { ...ed, institution: e.target.value }; set("education", n); }} />
              <Input placeholder="Year" value={ed.passingYear} onChange={(e) => { const n = [...form.education]; n[i] = { ...ed, passingYear: e.target.value }; set("education", n); }} />
              <Input placeholder="CGPA" value={ed.cgpa} onChange={(e) => { const n = [...form.education]; n[i] = { ...ed, cgpa: e.target.value }; set("education", n); }} />
            </div>
          ))}
          {step === 3 && <Button variant="outline" onClick={() => set("education", [...form.education, { degree: "", institution: "", passingYear: "", cgpa: "" }])}>Add education</Button>}
          {step === 4 && form.experience.map((ex, i) => (
            <div key={i} className="space-y-2">
              <Input placeholder="Title" value={ex.jobTitle} onChange={(e) => { const n = [...form.experience]; n[i] = { ...ex, jobTitle: e.target.value }; set("experience", n); }} />
              <Input placeholder="Company" value={ex.company} onChange={(e) => { const n = [...form.experience]; n[i] = { ...ex, company: e.target.value }; set("experience", n); }} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Start" value={ex.startDate} onChange={(e) => { const n = [...form.experience]; n[i] = { ...ex, startDate: e.target.value }; set("experience", n); }} />
                <Input placeholder="End" value={ex.endDate} onChange={(e) => { const n = [...form.experience]; n[i] = { ...ex, endDate: e.target.value }; set("experience", n); }} />
              </div>
              <Textarea placeholder="Description" value={ex.description} onChange={(e) => { const n = [...form.experience]; n[i] = { ...ex, description: e.target.value }; set("experience", n); }} />
            </div>
          ))}
          {step === 4 && <Button variant="outline" onClick={() => set("experience", [...form.experience, { jobTitle: "", company: "", startDate: "", endDate: "", description: "" }])}>Add experience</Button>}
          {step === 5 && form.projects.map((p, i) => (
            <div key={i} className="space-y-2">
              <Input placeholder="Title" value={p.title} onChange={(e) => { const n = [...form.projects]; n[i] = { ...p, title: e.target.value }; set("projects", n); }} />
              <Input placeholder="Tech stack (comma)" value={(p.techStack || []).join(", ")} onChange={(e) => { const n = [...form.projects]; n[i] = { ...p, techStack: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) }; set("projects", n); }} />
              <Textarea placeholder="Objective" value={p.objective} onChange={(e) => { const n = [...form.projects]; n[i] = { ...p, objective: e.target.value }; set("projects", n); }} />
            </div>
          ))}
          {step === 5 && <Button variant="outline" onClick={() => set("projects", [...form.projects, { title: "", techStack: [], objective: "" }])}>Add project</Button>}
          <div className="flex justify-between pt-4">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            ) : (
              <Button onClick={() => save(false)}>Save profile</Button>
            )}
          </div>
        </Card>
      </div>
      <Card className="h-fit sticky top-6">
        <p className="text-xs uppercase tracking-widest text-ink-400">Resume preview</p>
        <h2 className="font-display text-2xl mt-2">{preview.fullName || "Your name"}</h2>
        <p className="text-sm text-ink-500">{preview.location} · {preview.email}</p>
        <p className="text-sm mt-4">{preview.summary}</p>
        <div className="flex flex-wrap gap-1 mt-3">
          {(preview.skills || []).map((s) => <Badge key={s}>{s}</Badge>)}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
