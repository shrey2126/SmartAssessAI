import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Input, Label } from "../components/ui/primitives";
import SafeImage from "../components/ui/SafeImage";
import ThemeToggle from "../components/layout/ThemeToggle";
import { IMAGES } from "../lib/utils";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState(
    params.get("role") === "admin" ? "admin@smartassess.ai" : ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Valid email required";
    }
    if (!password || password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    return errs;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const user = await login({ email: email.trim(), password });
      toast.success("Welcome back!");
      navigate(user.role === "admin" ? "/admin" : "/app");
    } catch (err) {
      toast.error(err.userMessage || err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <SafeImage
        src={IMAGES.architecture}
        alt="Minimal dark architecture"
        width={1200}
        height={1600}
        className="hidden md:block w-full h-full object-cover"
      />
      <div className="p-6 md:p-12 flex flex-col">
        <div className="flex justify-between items-center">
          <Link to="/" className="font-display font-semibold">SmartAssess-AI</Link>
          <ThemeToggle />
        </div>
        <Card className="max-w-md w-full m-auto">
          <h1 className="font-display text-3xl">Sign in</h1>
          <p className="text-sm text-ink-500 mt-1 mb-4">
            Use a demo account or register a new candidate.
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("admin@smartassess.ai");
                setPassword("Admin@123");
                setErrors({});
              }}
            >
              Fill admin demo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("jordan@demo.ai");
                setPassword("Candidate@123");
                setErrors({});
              }}
            >
              Fill candidate demo
            </Button>
          </div>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                }}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password with show/hide toggle */}
            <div>
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                  }}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Login"}
            </Button>
          </form>
          <p className="text-sm mt-4">
            No account?{" "}
            <Link className="underline" to="/register">Register</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}


