"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, CheckCircle, Copy, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface UserProfile {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  emailVerified: boolean;
  walletPublicKey: string;
  walletActivated: boolean;
  usdcBalance: string;
  createdAt: string;
}

function getInitials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().substring(0, 2);
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ displayName: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.success) {
        setUser(d.data.user);
        setForm({ displayName: d.data.user.displayName, bio: d.data.user.bio || "" });
        generateQR(d.data.user.username);
      }
    }).finally(() => setLoading(false));
  }, []);

  const generateQR = async (username: string) => {
    try {
      // Personal receive QR encodes username
      const url = await QRCode.toDataURL(username, { width: 200, margin: 1, color: { dark: "#f1f5f9", light: "#111827" } });
      setQrDataUrl(url);
    } catch {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error); return; }
      setUser(d.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const copyWallet = async () => {
    if (!user) return;
    await navigator.clipboard.writeText(user.walletPublicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    if (!qrDataUrl || !user) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${user.username}-receive-qr.png`;
    a.click();
  };

  if (loading) return <div style={{ padding: "2rem" }}><div className="shimmer" style={{ height: 300, borderRadius: 12 }} /></div>;
  if (!user) return null;

  return (
    <div style={{ padding: "2rem", maxWidth: 700 }} className="fade-in">
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>Profile</h1>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* Avatar + identity */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div className="avatar-initials" style={{ width: 72, height: 72, fontSize: 28, flexShrink: 0 }}>
            {getInitials(user.displayName)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.25rem", fontWeight: 700 }}>{user.displayName}</h2>
            <p style={{ color: "#64748b", fontSize: 14 }}>@{user.username}</p>
            <p style={{ color: "#4b5563", fontSize: 13, marginTop: 4 }}>{user.email}</p>
            <div style={{ display: "flex", gap: "0.625rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
              <span className={`badge ${user.emailVerified ? "badge-green" : "badge-yellow"}`}>
                {user.emailVerified ? "Email verified" : "Email not verified"}
              </span>
              <span className={`badge ${user.walletActivated ? "badge-blue" : "badge-gray"}`}>
                {user.walletActivated ? "Wallet active" : "Wallet pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>Edit Profile</h2>

          {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#f87171", fontSize: 13 }}>{error}</div>}
          {saved && <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#34d399", fontSize: 13, display: "flex", alignItems: "center", gap: "0.5rem" }}><CheckCircle size={14} /> Profile saved!</div>}

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">Display Name</label>
              <input className="input-field" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} required maxLength={60} />
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input-field" value={user.username} disabled style={{ opacity: 0.5 }} />
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Username cannot be changed.</p>
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea className="input-field" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} maxLength={160} rows={3} placeholder="Tell people what you do..." style={{ resize: "vertical" }} />
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{form.bio.length}/160</p>
            </div>
            <button className="btn-primary" type="submit" disabled={saving} style={{ justifyContent: "center", alignSelf: "flex-start", minWidth: 140 }}>
              {saving ? <Loader2 size={14} /> : null}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Wallet info */}
        <div className="card">
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>Wallet Details</h2>
          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Public Key</label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <div style={{ flex: 1, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#60a5fa", background: "#0d1424", padding: "0.75rem", borderRadius: 8, wordBreak: "break-all" }}>
                {user.walletPublicKey}
              </div>
              <button onClick={copyWallet} className="btn-secondary" style={{ padding: "0.625rem 0.875rem", fontSize: 13, flexShrink: 0 }}>
                {copied ? <CheckCircle size={14} color="#10b981" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.25rem" }}>
            <div>
              <label className="label">USDC Balance</label>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10b981", fontFamily: "Space Grotesk, sans-serif" }}>${parseFloat(user.usdcBalance || "0").toFixed(2)}</p>
            </div>
            <div>
              <label className="label">Member Since</label>
              <p style={{ fontSize: 14, color: "#94a3b8" }}>{new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            </div>
          </div>

          {/* Personal receive QR */}
          <div style={{ borderTop: "1px solid #1f2937", paddingTop: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>Personal Receive QR</p>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Other Remiovas users scan this to send you money directly.</p>
              </div>
              <button className="btn-secondary" onClick={() => setShowQR(v => !v)} style={{ fontSize: 13, padding: "0.5rem 0.875rem" }}>
                <QrCode size={14} /> {showQR ? "Hide" : "Show QR"}
              </button>
            </div>
            {showQR && qrDataUrl && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" }}>
                <Image src={qrDataUrl} alt="Receive QR" width={180} height={180} style={{ borderRadius: 8 }} unoptimized />
                <button className="btn-secondary" onClick={downloadQR} style={{ fontSize: 13, padding: "0.5rem 0.875rem" }}>Download PNG</button>
              </div>
            )}
          </div>
        </div>

        {/* Public profile link */}
        <div className="card">
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Your Default Payment Link</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: "0.75rem" }}>Share this link to let anyone pay you from your first active payment page.</p>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#60a5fa", background: "#0d1424", padding: "0.75rem 1rem", borderRadius: 8, wordBreak: "break-all" }}>
            {APP_URL}/pay/{user.username}
          </div>
        </div>
      </div>
    </div>
  );
}
