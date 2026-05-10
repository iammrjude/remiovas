"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Invalid verification link."); return; }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(r => r.json()).then(d => {
      if (d.success) { setStatus("success"); setMessage(d.data.message); }
      else { setStatus("error"); setMessage(d.error || "Verification failed."); }
    }).catch(() => { setStatus("error"); setMessage("Network error."); });
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <Link href="/" style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, color: "#0070f3", textDecoration: "none", marginBottom: "2rem" }}>Remiovas</Link>
      <div className="card" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        {status === "loading" && <><Loader2 size={40} color="#0070f3" style={{ margin: "0 auto 1rem" }} /><p style={{ color: "#94a3b8" }}>Verifying your email...</p></>}
        {status === "success" && <><CheckCircle size={48} color="#10b981" style={{ margin: "0 auto 1rem" }} /><h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>Email Verified!</h2><p style={{ color: "#94a3b8", marginBottom: "1.5rem", lineHeight: 1.6 }}>{message}</p><Link href="/dashboard" className="btn-primary" style={{ display: "inline-flex" }}>Go to Dashboard</Link></>}
        {status === "error" && <><XCircle size={48} color="#ef4444" style={{ margin: "0 auto 1rem" }} /><h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>Verification Failed</h2><p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>{message}</p><Link href="/login" className="btn-secondary" style={{ display: "inline-flex" }}>Back to Login</Link></>}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0f1e" }} />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
