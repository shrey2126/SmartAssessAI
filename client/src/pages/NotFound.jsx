import { Link } from "react-router-dom";
import { Button } from "../components/ui/primitives";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="text-center">
        <p className="font-display text-7xl">404</p>
        <p className="text-ink-500 mb-6">This route does not exist.</p>
        <Link to="/"><Button>Back home</Button></Link>
      </div>
    </div>
  );
}
