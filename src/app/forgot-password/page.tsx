"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error); return; }
      setSent(true);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <Link href="/" style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, color: "#0070f3", textDecoration: "none", marginBottom: "2rem" }}>Remiovas</Link>
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: "0 auto 1rem" }} />
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.75rem" }}>Check your inbox</h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem" }}>If an account exists with that email, you will receive a password reset link shortly.</p>
            <Link href="/login" className="btn-primary" style={{ display: "inline-flex" }}>Back to Login</Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Forgot password?</h1>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: "1.5rem" }}>Enter your email and we will send you a reset link.</p>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#f87171", fontSize: 13 }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Email</label>
                <input className="input-field" type="email" placeholder="ada@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
                {loading ? <Loader2 size={14} /> : null} {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <p style={{ marginTop: "1rem", textAlign: "center", fontSize: 14 }}>
              <Link href="/login" style={{ color: "#64748b" }}>Back to Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
