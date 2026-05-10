"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Copy, CheckCircle, QrCode, ExternalLink, Loader2, FileText, Clock } from "lucide-react";
import QRCode from "qrcode";

interface PaymentRequest {
  _id: string;
  requestId: string;
  pageSlug: string;
  title: string;
  description: string;
  expectedAmount: string;
  memo: string;
  status: string;
  expiresAt: string;
  paidAt: string | null;
  txHash: string | null;
  createdAt: string;
}

interface PaymentPage {
  _id: string;
  slug: string;
  title: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function statusBadge(status: string) {
  const map: Record<string, string> = { pending: "badge-yellow", completed: "badge-green", expired: "badge-gray", refunded: "badge-blue", held: "badge-red" };
  return map[status] || "badge-gray";
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [pages, setPages] = useState<PaymentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ pageId: "", title: "", description: "", expectedAmount: "", expiryHours: 24 });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ url: string; title: string; memo: string; amount: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      const url = `/api/requests?limit=20${statusFilter ? `&status=${statusFilter}` : ""}`;
      const r = await fetch(url);
      const d = await r.json();
      if (d.success) setRequests(d.data.requests);
      setLoading(false);
    };

    loadRequests();
    fetch("/api/pages").then(r => r.json()).then(d => {
      if (d.success) setPages(d.data.pages);
    });
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setCreateError(d.error); return; }
      setShowCreate(false);
      setForm({ pageId: "", title: "", description: "", expectedAmount: "", expiryHours: 24 });
      loadRequests();
    } catch { setCreateError("Network error"); }
    finally { setCreating(false); }
  };

  const copyLink = async (req: PaymentRequest) => {
    const url = `${APP_URL}/pay/${req.pageSlug}/request/${req.requestId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(req._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showQR = async (req: PaymentRequest) => {
    const url = `${APP_URL}/pay/${req.pageSlug}/request/${req.requestId}`;
    // SEP-0007 URI encoded in QR
    const sep0007 = `web+stellar:pay?destination=${process.env.NEXT_PUBLIC_INTERMEDIARY_KEY || ""}&amount=${req.expectedAmount}&asset_code=USDC&memo=${req.memo}&memo_type=text`;
    const dataUrl = await QRCode.toDataURL(sep0007, { width: 280, margin: 2, color: { dark: "#f1f5f9", light: "#111827" } });
    setQrDataUrl(dataUrl);
    setQrModal({ url, title: req.title, memo: req.memo, amount: req.expectedAmount });
  };

  const downloadQR = () => {
    if (!qrDataUrl || !qrModal) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${qrModal.title.replace(/\s+/g, "-").toLowerCase()}-payment-qr.png`;
    a.click();
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 900 }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.75rem", fontWeight: 700 }}>Payment Requests</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Fixed-amount links for invoices and products</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: 14 }}>
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["", "pending", "completed", "expired", "refunded"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ fontSize: 13, padding: "0.375rem 0.875rem", borderRadius: 8, border: `1px solid ${statusFilter === s ? "#0070f3" : "#1f2937"}`, background: statusFilter === s ? "rgba(0,112,243,0.1)" : "transparent", color: statusFilter === s ? "#60a5fa" : "#94a3b8", cursor: "pointer" }}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" }}>Create Payment Request</h2>
            {createError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#f87171", fontSize: 13 }}>{createError}</div>}
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Payment Page</label>
                <select className="input-field" value={form.pageId} onChange={e => setForm(f => ({ ...f, pageId: e.target.value }))} required>
                  <option value="">Select a payment page</option>
                  {pages.map(p => <option key={p._id} value={p._id}>{p.title} (/pay/{p.slug})</option>)}
                </select>
                {pages.length === 0 && <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 4 }}>Create a payment page first.</p>}
              </div>
              <div>
                <label className="label">Request Title</label>
                <input className="input-field" placeholder="Logo Design — Invoice #42" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required maxLength={80} />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea className="input-field" placeholder="Additional details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={300} rows={2} style={{ resize: "vertical" }} />
              </div>
              <div>
                <label className="label">Amount (USDC) — Fixed & Enforced</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>$</span>
                  <input className="input-field" type="number" min="1" step="0.01" placeholder="50.00" value={form.expectedAmount} onChange={e => setForm(f => ({ ...f, expectedAmount: e.target.value }))} required style={{ paddingLeft: "1.75rem" }} />
                </div>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Wrong amounts are automatically refunded.</p>
              </div>
              <div>
                <label className="label">Expires In</label>
                <select className="input-field" value={form.expiryHours} onChange={e => setForm(f => ({ ...f, expiryHours: parseInt(e.target.value) }))}>
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={24}>24 hours (default)</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                  <option value={720}>30 days</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating || pages.length === 0} style={{ flex: 1, justifyContent: "center" }}>
                  {creating ? <Loader2 size={14} /> : <Plus size={14} />}
                  {creating ? "Creating..." : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setQrModal(null)}>
          <div className="card" style={{ maxWidth: 380, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, marginBottom: "0.25rem" }}>{qrModal.title}</h3>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: "0.5rem" }}>SEP-0007 QR — auto-fills amount + memo in compatible wallets</p>
            <div className="badge badge-green" style={{ margin: "0 auto 1rem", display: "inline-flex" }}>${parseFloat(qrModal.amount).toFixed(2)} USDC</div>
            <Image src={qrDataUrl} alt="QR Code" width={240} height={240} style={{ margin: "0 auto", display: "block", borderRadius: 8 }} unoptimized />
            <div style={{ marginTop: "0.75rem", background: "#0d1424", borderRadius: 8, padding: "0.625rem" }}>
              <p style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Memo (include in your wallet app)</p>
              <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#60a5fa" }}>{qrModal.memo}</p>
            </div>
            <p style={{ fontSize: 11, color: "#4b5563", marginTop: "0.5rem" }}>For wallets without SEP-0007 support (e.g. Freighter), enter the address, amount, and memo manually.</p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button className="btn-secondary" onClick={() => setQrModal(null)} style={{ flex: 1, justifyContent: "center", fontSize: 13 }}>Close</button>
              <button className="btn-primary" onClick={downloadQR} style={{ flex: 1, justifyContent: "center", fontSize: 13 }}>Download PNG</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: 110, borderRadius: 12 }} />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <FileText size={40} style={{ margin: "0 auto 1rem", color: "#374151" }} />
          <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, marginBottom: "0.5rem" }}>No payment requests yet</h3>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: "1.5rem" }}>Create a fixed-amount request for an invoice or product sale.</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: 14 }}>
            <Plus size={16} /> Create your first request
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {requests.map(req => (
            <div key={req._id} className="card card-hover">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.875rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                    <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem" }}>{req.title}</h3>
                    <span className={`badge ${statusBadge(req.status)}`}>{req.status}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: "0.5rem" }}>
                    /pay/{req.pageSlug}/request/{req.requestId}
                  </p>
                  {req.description && <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: "0.5rem" }}>{req.description}</p>}
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontSize: 11, color: "#64748b" }}>Amount</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#10b981" }}>${parseFloat(req.expectedAmount).toFixed(2)} USDC</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: "#64748b" }}>Memo</p>
                      <p style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#60a5fa" }}>{req.memo}</p>
                    </div>
                    {req.status === "pending" && (
                      <div>
                        <p style={{ fontSize: 11, color: "#64748b" }}>Time left</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24", display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} /> {timeLeft(req.expiresAt)}
                        </p>
                      </div>
                    )}
                    {req.paidAt && (
                      <div>
                        <p style={{ fontSize: 11, color: "#64748b" }}>Paid at</p>
                        <p style={{ fontSize: 13, color: "#94a3b8" }}>{new Date(req.paidAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn-secondary" onClick={() => copyLink(req)} style={{ fontSize: 12, padding: "0.375rem 0.75rem" }}>
                  {copiedId === req._id ? <><CheckCircle size={12} color="#10b981" /> Copied</> : <><Copy size={12} /> Copy Link</>}
                </button>
                <button className="btn-secondary" onClick={() => showQR(req)} style={{ fontSize: 12, padding: "0.375rem 0.75rem" }}>
                  <QrCode size={12} /> QR Code
                </button>
                <a href={`/pay/${req.pageSlug}/request/${req.requestId}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: 12, padding: "0.375rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  <ExternalLink size={12} /> Preview
                </a>
                {req.txHash && (
                  <a href={`https://stellar.expert/explorer/testnet/tx/${req.txHash}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: 12, padding: "0.375rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                    <ExternalLink size={12} /> Stellar Explorer
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
