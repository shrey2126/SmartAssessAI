import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Card, Button } from "../components/ui/primitives";
import { useAuth } from "../context/AuthContext";
import Skeleton from "../components/ui/Skeleton";

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/applications/me"), api.get("/profile")])
      .then(([a, p]) => {
        setApps(a.data.data.items);
        setProfile(p.data.data.profile);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40" />;

  return (
    <div className="space-y-6 pb-16">
      <div>
        <p className="text-sm text-ink-500">Welcome</p>
        <h1 className="font-display text-4xl tracking-tight">{user?.name}</h1>
      </div>
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-500">Profile completion</p>
          <p className="font-display text-3xl">{profile?.completionPercent || 0}%</p>
          <p className="text-xs text-ink-400">Need 70% to apply</p>
        </div>
        <Link to="/app/profile"><Button>Edit profile</Button></Link>
      </Card>
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-display text-2xl">Applications</h2>
          <Link to="/jobs"><Button variant="outline">Browse jobs</Button></Link>
        </div>
        {!apps.length && <Card>No applications yet. Complete your profile and apply.</Card>}
        <div className="grid gap-3">
          {apps.map((a) => (
            <Card key={a._id} className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="font-medium">{a.jobRole?.title}</p>
                <p className="text-sm text-ink-500 capitalize">{a.status}</p>
              </div>
              {a.status !== "completed" ? (
                <Link to={`/app/interview/${a._id}`}><Button>Continue interview</Button></Link>
              ) : (
                <Link to={`/app/complete/${a._id}`}><Button variant="outline">View result</Button></Link>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
