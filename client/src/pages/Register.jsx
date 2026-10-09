import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Input, Label } from "../components/ui/primitives";
import SafeImage from "../components/ui/SafeImage";
import ThemeToggle from "../components/layout/ThemeToggle";
import { IMAGES } from "../lib/utils";

export default function Register() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!name || name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters";
    }
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
      await signup({ name: name.trim(), email: email.trim(), password });
      toast.success("Account created! Welcome aboard.");
      navigate("/app/profile");
    } catch (err) {
      toast.error(err.userMessage || err.response?.data?.message || "Could not register. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <SafeImage
        src={IMAGES.workspace}
        alt="Minimal workspace"
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
          <h1 className="font-display text-3xl mb-6">Create candidate account</h1>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <Label htmlFor="reg-name">Full name</Label>
              <Input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                }}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                }}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password with show/hide toggle */}
            <div>
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Creating…" : "Register"}
            </Button>
          </form>
          <p className="text-sm mt-4">
            Have an account?{" "}
            <Link className="underline" to="/login">Login</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

