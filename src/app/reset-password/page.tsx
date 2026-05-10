"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error); return; }
      router.push("/login?reset=1");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <Link href="/" style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, color: "#0070f3", textDecoration: "none", marginBottom: "2rem" }}>Remiovas</Link>
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Set new password</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: "1.5rem" }}>Choose a strong password for your account.</p>
        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#f87171", fontSize: 13 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="label">New Password</label>
            <div style={{ position: "relative" }}>
              <input className="input-field" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={{ paddingRight: "3rem" }} />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={loading || !token} style={{ justifyContent: "center" }}>
            {loading ? <Loader2 size={14} /> : null} {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
