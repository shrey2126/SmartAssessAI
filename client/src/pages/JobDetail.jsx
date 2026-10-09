import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Button, Card, Badge } from "../components/ui/primitives";
import { useAuth } from "../context/AuthContext";

export default function JobDetail() {
  const { id } = useParams();
  const [role, setRole] = useState(null);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/roles/${id}`).then(({ data }) => setRole(data.data.role)).catch(() => toast.error("Role not found"));
  }, [id]);

  async function apply() {
    if (!user) return navigate("/login");
    if (user.role !== "candidate") {
      toast.error("Log in as a candidate to apply. Admin accounts manage roles from the dashboard.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/applications/${id}`);
      const app = data.data.application;
      toast.success(data.message === "Already applied" ? "Resuming your application" : "Applied");
      navigate(app.status === "completed" ? `/app/complete/${app._id}` : `/app/interview/${app._id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not apply");
    } finally {
      setBusy(false);
    }
  }

  if (!role) return <div className="pt-28 px-4">Loading…</div>;

  return (
    <div>
      <Navbar />
      <div className="pt-28 max-w-3xl mx-auto px-4 pb-16 space-y-6">
        <Link to="/jobs" className="text-sm text-ink-500">← All roles</Link>
        <h1 className="font-display text-4xl">{role.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge>{role.details?.location}</Badge>
          <Badge>{role.details?.type}</Badge>
          <Badge>{role.details?.experienceLevel}</Badge>
        </div>
        <Card>
          <p>{role.description}</p>
          <h2 className="font-display text-xl mt-6">Responsibilities</h2>
          <p className="text-ink-500">{role.details?.responsibilities}</p>
          <h2 className="font-display text-xl mt-6">Requirements</h2>
          <p className="text-ink-500">{role.details?.requirements}</p>
        </Card>
        <Button className="w-full" disabled={busy} onClick={apply}>{busy ? "Applying…" : "Apply & start interview"}</Button>
      </div>
      <Footer />
    </div>
  );
}
