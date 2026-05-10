"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle, Copy, ExternalLink, Shield, Zap, AlertCircle } from "lucide-react";
import QRCode from "qrcode";
import Link from "next/link";

interface PageData {
  page: {
    _id: string;
    slug: string;
    title: string;
    description: string;
    amountMode: string;
    fixedAmount: string | null;
    tipAmounts: { label: string; amount: string }[];
  };
  owner: {
    displayName: string;
    username: string;
    bio: string;
  };
  intermediaryAddress: string;
  sep0007URI: string;
}

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().substring(0, 2);
}

export default function PayPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [payMethod, setPayMethod] = useState<"platform" | "external">("platform");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState<{ hash: string; netAmount: string } | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showMemo, setShowMemo] = useState(false);
  const [addressQR, setAddressQR] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    fetch(`/api/pay/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { setNotFound(true); return; }
        setData(d.data);
        if (d.data.page.fixedAmount) setAmount(d.data.page.fixedAmount);
        QRCode.toDataURL(d.data.intermediaryAddress, {
          width: 200, margin: 1,
          color: { dark: "#f1f5f9", light: "#111827" },
        }).then(setAddressQR).catch(() => {});
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.success) setIsLoggedIn(true);
    });
  }, [slug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const d = await res.json();
      if (!res.ok) { setLoginError(d.error); return; }
      setIsLoggedIn(true);
    } catch { setLoginError("Network error"); }
    finally { setLoggingIn(false); }
  };

  const handlePlatformPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");
    setPaying(true);
    try {
      const res = await fetch(`/api/pay/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, memo: memo || undefined }),
      });
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

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={32} color="#0070f3" />
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <AlertCircle size={48} color="#374151" style={{ marginBottom: "1rem" }} />
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Page not found</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>This payment page does not exist or has been deactivated.</p>
      <Link href="/" className="btn-primary">Go to Remiovas</Link>
    </div>
  );

  if (paySuccess) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div className="card" style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <CheckCircle size={32} color="#10b981" />
        </div>
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Payment sent!</h2>
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
          You paid <strong style={{ color: "#10b981" }}>${parseFloat(paySuccess.netAmount).toFixed(2)} USDC</strong> to {data?.owner.displayName}.
        </p>
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${paySuccess.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: 14, marginBottom: "1rem" }}
        >
          <ExternalLink size={14} /> View on Stellar Explorer
        </a>
        <p style={{ fontSize: 12, color: "#4b5563", fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all" }}>{paySuccess.hash}</p>
      </div>
    </div>
  );

  if (!data) return null;
  const { page, owner } = data;
  const isFixed = page.amountMode === "fixed" && page.fixedAmount;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Creator card */}
        <div className="card" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="avatar-initials" style={{ width: 56, height: 56, fontSize: 20, flexShrink: 0 }}>
            {getInitials(owner.displayName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.125rem", fontWeight: 700 }}>{page.title}</h1>
            <p style={{ fontSize: 13, color: "#64748b" }}>@{owner.username}</p>
            {page.description && <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{page.description}</p>}
          </div>
        </div>

        {/* Payment form card */}
        <div className="card">
          {/* Payment method tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "#0d1424", padding: "4px", borderRadius: 10 }}>
            {[
              { key: "platform", label: "Remiovas Account" },
              { key: "external", label: "External Wallet" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPayMethod(key as "platform" | "external")}
                style={{
                  flex: 1, padding: "0.5rem", fontSize: 13, fontWeight: 600, borderRadius: 7, border: "none", cursor: "pointer",
                  background: payMethod === key ? "#111827" : "transparent",
                  color: payMethod === key ? "#f1f5f9" : "#64748b",
                  transition: "all 0.15s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {payMethod === "platform" ? (
            <>
              {!isLoggedIn ? (
                <>
                  <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: "1.25rem" }}>
                    Log in to pay instantly from your Remiovas balance.
                    <Link href="/signup" style={{ color: "#0070f3", marginLeft: 4 }}>New? Sign up free</Link>
                  </p>
                  {loginError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#f87171", fontSize: 13 }}>{loginError}</div>}
                  <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    <input className="input-field" type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} required />
                    <input className="input-field" type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required />
                    <button className="btn-primary" type="submit" disabled={loggingIn} style={{ justifyContent: "center" }}>
                      {loggingIn ? <Loader2 size={14} /> : null}
                      {loggingIn ? "Logging in..." : "Log in to Pay"}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {payError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#f87171", fontSize: 13 }}>{payError}</div>}
                  <form onSubmit={handlePlatformPay} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label className="label">Amount (USDC)</label>
                      {isFixed ? (
                        <div style={{ background: "#0d1424", borderRadius: 10, padding: "0.875rem 1rem", fontSize: "1.5rem", fontWeight: 700, color: "#10b981", fontFamily: "Space Grotesk, sans-serif" }}>
                          ${parseFloat(page.fixedAmount!).toFixed(2)} USDC
                        </div>
                      ) : (
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>$</span>
                          <input className="input-field" type="number" min="1" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required style={{ paddingLeft: "1.75rem", fontSize: "1.125rem" }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <button type="button" onClick={() => setShowMemo(v => !v)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", padding: 0 }}>
                        {showMemo ? "Hide" : "+ Add"} memo (optional)
                      </button>
                      {showMemo && (
                        <input className="input-field" style={{ marginTop: "0.5rem" }} placeholder="Invoice #42, order number..." maxLength={28} value={memo} onChange={e => setMemo(e.target.value)} />
                      )}
                    </div>
                    <button className="btn-primary" type="submit" disabled={paying} style={{ justifyContent: "center", padding: "0.875rem" }}>
                      {paying ? <Loader2 size={16} /> : null}
                      {paying ? "Processing..." : `Pay ${amount ? "$" + parseFloat(amount).toFixed(2) : ""} USDC`}
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            // External wallet
            <div>
              <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                Send <strong style={{ color: "#f1f5f9" }}>USDC only</strong> on the Stellar network to the address below.
                {isFixed && <> The exact amount is <strong style={{ color: "#10b981" }}>${parseFloat(page.fixedAmount!).toFixed(2)} USDC</strong>.</>}
              </p>

              {addressQR && (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
                  <Image src={addressQR} alt="Wallet QR" width={180} height={180} style={{ borderRadius: 8 }} unoptimized />
                </div>
              )}

              <div style={{ background: "#0d1424", borderRadius: 10, padding: "0.875rem", marginBottom: "0.75rem" }}>
                <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>SEND TO (Platform Address)</p>
                <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#60a5fa", wordBreak: "break-all" }}>
                  {data.intermediaryAddress}
                </p>
              </div>

              {isFixed && (
                <div style={{ background: "#0d1424", borderRadius: 10, padding: "0.875rem", marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>EXACT AMOUNT</p>
                  <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "#10b981" }}>
                    ${parseFloat(page.fixedAmount!).toFixed(2)} USDC
                  </p>
                  <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>Wrong amount will be automatically refunded.</p>
                </div>
              )}

              <button onClick={copyAddress} className="btn-secondary" style={{ width: "100%", justifyContent: "center", fontSize: 14, marginBottom: "0.75rem" }}>
                {copiedAddress ? <><CheckCircle size={14} color="#10b981" /> Address Copied!</> : <><Copy size={14} /> Copy Address</>}
              </button>

              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "0.75rem", fontSize: 12, color: "#fbbf24", lineHeight: 1.6 }}>
                Scan with <strong>Lobstr</strong> or <strong>Solar</strong> for auto-fill. Using Freighter? Copy the address and enter the amount manually. Only send USDC — other assets will be returned.
              </div>
            </div>
          )}
        </div>

        {/* Trust footer */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#4b5563", display: "flex", alignItems: "center", gap: 4 }}>
            <Shield size={12} /> Secured by Stellar
          </span>
          <span style={{ fontSize: 12, color: "#4b5563", display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={12} /> Settles in ~5 seconds
          </span>
          <span style={{ fontSize: 12, color: "#4b5563" }}>0.5% fee</span>
        </div>
        <p style={{ textAlign: "center", marginTop: "0.75rem", fontSize: 11, color: "#374151" }}>
          <Link href="/" style={{ color: "#374151" }}>Powered by Remiovas</Link>
          {" · "}
          <a href="#" style={{ color: "#374151" }}>Report this page</a>
        </p>
      </div>
    </div>
  );
}
