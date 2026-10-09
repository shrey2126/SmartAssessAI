import { useAuth } from "../../context/AuthContext";
import { Badge } from "../ui/primitives";

export default function DemoBadge() {
  const { demoMode } = useAuth();
  if (!demoMode) return null;
  return <Badge className="bg-ink-100 dark:bg-ink-800">Demo mode</Badge>;
}
