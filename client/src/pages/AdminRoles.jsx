import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";
import { Button, Card, Badge } from "../components/ui/primitives";

export default function AdminRoles() {
  const [items, setItems] = useState([]);

  function load() {
    api.get("/admin/roles", { params: { limit: 50 } }).then(({ data }) => setItems(data.data.items));
  }
  useEffect(() => { load(); }, []);

  async function toggle(id) {
    await api.patch(`/admin/roles/${id}/toggle`);
    load();
  }
  async function remove(id) {
    if (!confirm("Delete this role?")) return;
    await api.delete(`/admin/roles/${id}`);
    toast.success("Deleted");
    load();
  }

  return (
    <div className="space-y-4 pb-16">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl">Job roles</h1>
        <Link to="/admin/roles/new"><Button>Add role</Button></Link>
      </div>
      {items.map((r) => (
        <Card key={r._id} className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="font-medium">{r.title}</p>
            <p className="text-sm text-ink-500">{r.details?.location} · {r.questions?.length} questions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{r.isOpen ? "Open" : "Closed"}</Badge>
            <Button variant="outline" onClick={() => toggle(r._id)}>Toggle</Button>
            <Link to={`/admin/roles/${r._id}`}><Button variant="ghost">Edit</Button></Link>
            <Button variant="danger" onClick={() => remove(r._id)}>Delete</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
