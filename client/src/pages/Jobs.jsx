import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Card, Input, Button, Badge } from "../components/ui/primitives";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SafeImage from "../components/ui/SafeImage";
import { IMAGES } from "../lib/utils";
import { TiltCard } from "../components/animations/Motion";

export default function Jobs() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get("/roles", { params: { search, location, type, limit: 20 } })
        .then(({ data }) => {
          setItems(data.data?.items || []);
          setError("");
        })
        .catch((e) => setError(e.userMessage || "Could not load roles. Is the API running?"));
    }, 200);
    return () => clearTimeout(t);
  }, [search, location, type]);

  return (
    <div>
      <Navbar />
      <div className="pt-28 max-w-6xl mx-auto px-4 pb-16">
        <h1 className="font-display text-4xl mb-6">Open roles</h1>
        <div className="grid md:grid-cols-3 gap-3 mb-8">
          <Input placeholder="Search title or skill" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <select className="h-11 rounded-xl border border-ink-200 dark:border-ink-700 bg-transparent px-3" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            <option>Full-time</option>
            <option>Hybrid</option>
            <option>Contract</option>
          </select>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((r, i) => (
            <TiltCard key={r._id}>
              <Card className="p-0 overflow-hidden">
                <SafeImage src={[IMAGES.office, IMAGES.laptop, IMAGES.team][i % 3]} alt="" width={600} height={220} className="w-full h-36" />
                <div className="p-5">
                  <h2 className="font-display text-xl">{r.title}</h2>
                  <p className="text-sm text-ink-500 line-clamp-3 mt-2">{r.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(r.skills || []).slice(0, 4).map((s) => <Badge key={s}>{s}</Badge>)}
                  </div>
                  <Link to={`/jobs/${r._id}`}><Button className="mt-4 w-full">View role</Button></Link>
                </div>
              </Card>
            </TiltCard>
          ))}
        </div>
        {error && <Card className="mt-6 text-sm">{error}</Card>}
        {!items.length && !error && <Card className="mt-6">No open roles match those filters.</Card>}
      </div>
      <Footer />
    </div>
  );
}
