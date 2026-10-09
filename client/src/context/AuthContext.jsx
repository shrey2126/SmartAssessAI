import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const sessionRef = useRef(0);

  async function syncAiStatus() {
    try {
      const st = await api.get("/ai/status");
      setDemoMode(Boolean(st.data?.data?.mock));
    } catch {
      setDemoMode(false);
    }
  }

  async function refresh() {
    const session = sessionRef.current;
    try {
      const { data } = await api.get("/auth/me");
      if (session !== sessionRef.current) return;
      setUser(data.data.user);
      await syncAiStatus();
    } catch {
      if (session !== sessionRef.current) return;
      setUser(null);
    } finally {
      if (session === sessionRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function applySession(payload) {
    if (!payload?.token || !payload?.user) {
      throw new Error("Login response was incomplete. Is the API running on port 5000?");
    }
    sessionRef.current += 1;
    localStorage.setItem("sa_token", payload.token);
    setUser(payload.user);
    setLoading(false);
  }

  async function login(form) {
    const { data } = await api.post("/auth/login", form);
    applySession(data.data);
    await syncAiStatus();
    return data.data.user;
  }

  async function register(form) {
    const { data } = await api.post("/auth/register", form);
    applySession(data.data);
    await syncAiStatus();
    return data.data.user;
  }

  async function logout() {
    sessionRef.current += 1;
    try {
      await api.post("/auth/logout");
    } catch {
      /* still clear local session */
    }
    localStorage.removeItem("sa_token");
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, demoMode, setDemoMode }),
    [user, loading, demoMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
