"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", username: "", displayName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, username: form.username.toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="card" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <CheckCircle size={48} color="#10b981" />
          </div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Check your email</h2>
          <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            We sent a verification link to <strong style={{ color: "#f1f5f9" }}>{form.email}</strong>. Click it to activate your account and wallet.
          </p>
          <Link href="/login" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <Link href="/" style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, color: "#0070f3", textDecoration: "none", marginBottom: "2rem" }}>
        Remiovas
      </Link>
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Create your account</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: "1.5rem" }}>
          Already have an account? <Link href="/login" style={{ color: "#0070f3" }}>Log in</Link>
        </p>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#f87171", fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="label">Display Name</label>
            <input className="input-field" type="text" placeholder="Ada Okafor" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} required maxLength={60} />
          </div>
          <div>
            <label className="label">Username</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 14 }}>@</span>
              <input className="input-field" type="text" placeholder="ada-okafor" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))} required minLength={3} maxLength={30} style={{ paddingLeft: "2rem" }} />
            </div>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Your payment link: remiovas.app/pay/{form.username || "username"}</p>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input-field" type="email" placeholder="ada@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Password</label>
            <div style={{ position: "relative" }}>
              <input className="input-field" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} style={{ paddingRight: "3rem" }} />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex" }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: "0.5rem", justifyContent: "center" }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#4b5563", marginTop: "1.5rem", textAlign: "center", lineHeight: 1.6 }}>
          By signing up, you agree to our{" "}
          <Link href="/terms" style={{ color: "#64748b" }}>Terms of Service</Link>{" "}
          and{" "}
          <Link href="/privacy" style={{ color: "#64748b" }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
