"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle, Copy, ExternalLink, Shield, Zap, AlertCircle, Clock } from "lucide-react";
import QRCode from "qrcode";
import Link from "next/link";

interface RequestData {
  request: {
    requestId: string;
    title: string;
    description: string;
    expectedAmount: string;
    memo: string;
    status: string;
    expiresAt: string;
  };
  page: { slug: string; title: string };
  owner: { displayName: string; username: string };
  intermediaryAddress: string;
  sep0007URI: string;
}

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().substring(0, 2);
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

export default function PayRequestPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const requestId = params?.requestId as string;

  const [data, setData] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [payMethod, setPayMethod] = useState<"platform" | "external">("platform");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState<{ hash: string; netAmount: string } | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);

  useEffect(() => {
    fetch(`/api/pay/${slug}/request/${requestId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { setNotFound(true); return; }
        setData(d.data);
        QRCode.toDataURL(d.data.sep0007URI, {
          width: 220, margin: 1,
          color: { dark: "#f1f5f9", light: "#111827" },
        }).then(setQrDataUrl).catch(() => {});
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.success) setIsLoggedIn(true);
    });
  }, [slug, requestId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginForm) });
      const d = await res.json();
      if (!res.ok) { setLoginError(d.error); return; }
      setIsLoggedIn(true);
    } catch { setLoginError("Network error"); }
    finally { setLoggingIn(false); }
  };

  const handlePlatformPay = async () => {
    setPayError("");
    setPaying(true);
    try {
      const res = await fetch(`/api/pay/${slug}/request/${requestId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const d = await res.json();
      if (!res.ok) { setPayError(d.error); return; }
      setPaySuccess({ hash: d.data.hash, netAmount: d.data.netAmount });
    } catch { setPayError("Network error"); }
    finally { setPaying(false); }
  };

  const copyAddress = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.intermediaryAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const copyMemo = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.request.memo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={32} color="#0070f3" />
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <AlertCircle size={48} color="#374151" style={{ marginBottom: "1rem" }} />
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Request not found</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>This payment request does not exist, has expired, or has already been paid.</p>
      <Link href="/" className="btn-primary">Go to Remiovas</Link>
    </div>
  );

  if (paySuccess) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div className="card" style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <CheckCircle size={32} color="#10b981" />
        </div>
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Payment complete!</h2>
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
          You paid <strong style={{ color: "#10b981" }}>${parseFloat(paySuccess.netAmount).toFixed(2)} USDC</strong> to {data?.owner.displayName}.
        </p>
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${paySuccess.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: 14 }}
        >
          <ExternalLink size={14} /> View on Stellar Explorer
        </a>
      </div>
    </div>
  );

  if (!data) return null;
  const { request, owner } = data;
  const isExpired = request.status === "expired" || new Date(request.expiresAt) < new Date();
  const isCompleted = request.status === "completed";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Creator + request info */}
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div className="avatar-initials" style={{ width: 48, height: 48, fontSize: 18, flexShrink: 0 }}>
              {getInitials(owner.displayName)}
            </div>
            <div>
              <p style={{ fontSize: 13, color: "#64748b" }}>Payment request from</p>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem" }}>{owner.displayName}</p>
            </div>
          </div>

          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.375rem" }}>{request.title}</h1>
          {request.description && <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: "0.75rem" }}>{request.description}</p>}

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 11, color: "#64748b" }}>Amount</p>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: "#10b981", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.1 }}>
                ${parseFloat(request.expectedAmount).toFixed(2)}<span style={{ fontSize: "1rem", marginLeft: 6 }}>USDC</span>
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#64748b" }}>Status</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: isExpired ? "#94a3b8" : isCompleted ? "#10b981" : "#fbbf24", display: "flex", alignItems: "center", gap: 4 }}>
                {isExpired ? "Expired" : isCompleted ? "Paid" : <><Clock size={12} /> {timeLeft(request.expiresAt)}</>}
              </p>
            </div>
          </div>
        </div>

        {isExpired && (
          <div style={{ background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.3)", borderRadius: 12, padding: "1.5rem", textAlign: "center", marginBottom: "1rem" }}>
            <AlertCircle size={32} color="#64748b" style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, marginBottom: "0.375rem" }}>This request has expired</p>
            <p style={{ fontSize: 13, color: "#64748b" }}>Please contact the creator for a new payment link.</p>
          </div>
        )}

        {isCompleted && (
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "1.5rem", textAlign: "center", marginBottom: "1rem" }}>
            <CheckCircle size={32} color="#10b981" style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700 }}>This request has already been paid</p>
          </div>
        )}

        {!isExpired && !isCompleted && (
          <div className="card">
            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "#0d1424", padding: "4px", borderRadius: 10 }}>
              {[{ key: "platform", label: "Remiovas Account" }, { key: "external", label: "External Wallet" }].map(({ key, label }) => (
                <button key={key} onClick={() => setPayMethod(key as "platform" | "external")}
                  style={{ flex: 1, padding: "0.5rem", fontSize: 13, fontWeight: 600, borderRadius: 7, border: "none", cursor: "pointer", background: payMethod === key ? "#111827" : "transparent", color: payMethod === key ? "#f1f5f9" : "#64748b", transition: "all 0.15s ease" }}>
                  {label}
                </button>
              ))}
            </div>

            {payMethod === "platform" ? (
              !isLoggedIn ? (
                <>
                  <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: "1.25rem" }}>Log in to pay instantly from your balance. <Link href="/signup" style={{ color: "#0070f3" }}>New? Sign up free</Link></p>
                  {loginError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#f87171", fontSize: 13 }}>{loginError}</div>}
                  <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    <input className="input-field" type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} required />
                    <input className="input-field" type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required />
                    <button className="btn-primary" type="submit" disabled={loggingIn} style={{ justifyContent: "center" }}>
                      {loggingIn ? <Loader2 size={14} /> : null} {loggingIn ? "Logging in..." : "Log in to Pay"}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {payError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#f87171", fontSize: 13 }}>{payError}</div>}
                  <div style={{ background: "#0d1424", borderRadius: 10, padding: "1rem", marginBottom: "1.25rem", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>You are about to pay</p>
                    <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2rem", fontWeight: 800, color: "#10b981" }}>
                      ${parseFloat(request.expectedAmount).toFixed(2)} USDC
                    </p>
                  </div>
                  <button className="btn-primary" onClick={handlePlatformPay} disabled={paying} style={{ width: "100%", justifyContent: "center", padding: "0.875rem" }}>
                    {paying ? <Loader2 size={16} /> : null}
                    {paying ? "Processing..." : `Pay $${parseFloat(request.expectedAmount).toFixed(2)} USDC`}
                  </button>
                </>
              )
            ) : (
              // External wallet
              <div>
                <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                  Scan the QR code below with Lobstr or Solar. All fields auto-fill. For other wallets, copy the details manually.
                </p>
                {qrDataUrl && (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
                    <img src={qrDataUrl} alt="SEP-0007 QR" style={{ width: 200, height: 200, borderRadius: 8 }} />
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1rem" }}>
                  <div style={{ background: "#0d1424", borderRadius: 10, padding: "0.875rem" }}>
                    <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>SEND TO (Platform Address)</p>
                    <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#60a5fa", wordBreak: "break-all", marginBottom: "0.5rem" }}>{data.intermediaryAddress}</p>
                    <button onClick={copyAddress} className="btn-secondary" style={{ fontSize: 11, padding: "0.25rem 0.625rem" }}>
                      {copiedAddress ? <><CheckCircle size={11} color="#10b981" /> Copied</> : <><Copy size={11} /> Copy</>}
                    </button>
                  </div>
                  <div style={{ background: "#0d1424", borderRadius: 10, padding: "0.875rem" }}>
                    <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>EXACT AMOUNT</p>
                    <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "#10b981" }}>${parseFloat(request.expectedAmount).toFixed(2)} USDC</p>
                    <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>Wrong amount will be automatically refunded.</p>
                  </div>
                  <div style={{ background: "#0d1424", borderRadius: 10, padding: "0.875rem" }}>
                    <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>MEMO (required)</p>
                    <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, color: "#f1f5f9", marginBottom: "0.5rem" }}>{request.memo}</p>
                    <button onClick={copyMemo} className="btn-secondary" style={{ fontSize: 11, padding: "0.25rem 0.625rem" }}>
                      {copiedMemo ? <><CheckCircle size={11} color="#10b981" /> Copied</> : <><Copy size={11} /> Copy Memo</>}
                    </button>
                  </div>
                </div>
                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "0.75rem", fontSize: 12, color: "#fbbf24", lineHeight: 1.6 }}>
                  You must include the memo exactly as shown. Payments without the correct memo or wrong amount will be automatically refunded.
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#4b5563", display: "flex", alignItems: "center", gap: 4 }}><Shield size={12} /> Secured by Stellar</span>
          <span style={{ fontSize: 12, color: "#4b5563", display: "flex", alignItems: "center", gap: 4 }}><Zap size={12} /> Settles in ~5 seconds</span>
        </div>
        <p style={{ textAlign: "center", marginTop: "0.75rem", fontSize: 11, color: "#374151" }}>
          <Link href="/" style={{ color: "#374151" }}>Powered by Remiovas</Link>
        </p>
      </div>
    </div>
  );
}
