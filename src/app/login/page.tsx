"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid email or password"); return; }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <Link href="/" style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, color: "#0070f3", textDecoration: "none", marginBottom: "2rem" }}>
        Remiovas
      </Link>
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Welcome back</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: "1.5rem" }}>
          New here? <Link href="/signup" style={{ color: "#0070f3" }}>Create an account</Link>
        </p>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#f87171", fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="label">Email</label>
            <input className="input-field" type="email" placeholder="ada@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoFocus />
          </div>
          <div>
            <label className="label">
              <span>Password</span>
            </label>
            <div style={{ position: "relative" }}>
              <input className="input-field" type={showPassword ? "text" : "password"} placeholder="Your password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required style={{ paddingRight: "3rem" }} />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex" }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ textAlign: "right", marginTop: 4 }}>
              <Link href="/forgot-password" style={{ color: "#64748b", fontSize: 13 }}>Forgot password?</Link>
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: "0.5rem", justifyContent: "center" }}>
            {loading ? <Loader2 size={16} /> : null}
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
