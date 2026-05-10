"use client";

import { useEffect, useState } from "react";
import { Plus, Link2, Copy, CheckCircle, ToggleLeft, ToggleRight, Trash2, QrCode, ExternalLink, Loader2 } from "lucide-react";
import QRCode from "qrcode";

interface PaymentPage {
  _id: string;
  slug: string;
  title: string;
  description: string;
  amountMode: string;
  fixedAmount: string | null;
  isActive: boolean;
  totalReceived: string;
  paymentCount: number;
  createdAt: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function PagesPage() {
  const [pages, setPages] = useState<PaymentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ slug: "", title: "", description: "", amountMode: "flexible", fixedAmount: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ url: string; title: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => { loadPages(); }, []);

  const loadPages = async () => {
    setLoading(true);
    const r = await fetch("/api/pages");
    const d = await r.json();
    if (d.success) setPages(d.data.pages);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setCreateError(d.error); return; }
      setShowCreate(false);
      setForm({ slug: "", title: "", description: "", amountMode: "flexible", fixedAmount: "" });
      loadPages();
    } catch { setCreateError("Network error"); }
    finally { setCreating(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/pages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
    loadPages();
  };

  const deletePage = async (id: string) => {
    if (!confirm("Delete this payment page? This cannot be undone.")) return;
    await fetch(`/api/pages/${id}`, { method: "DELETE" });
    loadPages();
  };

  const copyLink = async (slug: string, id: string) => {
    await navigator.clipboard.writeText(`${APP_URL}/pay/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showQR = async (slug: string, title: string) => {
    const url = `${APP_URL}/pay/${slug}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: "#f1f5f9", light: "#111827" } });
    setQrDataUrl(dataUrl);
    setQrModal({ url, title });
  };

  const downloadQR = () => {
    if (!qrDataUrl || !qrModal) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${qrModal.title.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    a.click();
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 900 }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.75rem", fontWeight: 700 }}>Payment Pages</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Create shareable pages to accept USDC payments</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: 14 }}>
          <Plus size={16} /> New Page
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 500 }}>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" }}>Create Payment Page</h2>
            {createError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#f87171", fontSize: 13 }}>{createError}</div>}
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Page Title</label>
                <input className="input-field" placeholder="Design Services" value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })); }} required maxLength={80} />
              </div>
              <div>
                <label className="label">URL Slug</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>remiovas.app/pay/</span>
                  <input className="input-field" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} required minLength={3} maxLength={50} style={{ paddingLeft: 175 }} />
                </div>
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea className="input-field" placeholder="What is this page for?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={300} rows={2} style={{ resize: "vertical" }} />
              </div>
              <div>
                <label className="label">Amount Mode</label>
                <select className="input-field" value={form.amountMode} onChange={e => setForm(f => ({ ...f, amountMode: e.target.value }))}>
                  <option value="flexible">Flexible — payer chooses amount</option>
                  <option value="fixed">Fixed — set a specific amount</option>
                </select>
              </div>
              {form.amountMode === "fixed" && (
                <div>
                  <label className="label">Fixed Amount (USDC)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>$</span>
                    <input className="input-field" type="number" min="1" step="0.01" value={form.fixedAmount} onChange={e => setForm(f => ({ ...f, fixedAmount: e.target.value }))} required style={{ paddingLeft: "1.75rem" }} />
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating} style={{ flex: 1, justifyContent: "center" }}>
                  {creating ? <Loader2 size={14} /> : <Plus size={14} />}
                  {creating ? "Creating..." : "Create Page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setQrModal(null)}>
          <div className="card" style={{ maxWidth: 360, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, marginBottom: "0.25rem" }}>{qrModal.title}</h3>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: "1rem" }}>Scan to open payment page</p>
            <img src={qrDataUrl} alt="QR Code" style={{ width: 240, height: 240, margin: "0 auto", display: "block", borderRadius: 8 }} />
            <p style={{ fontSize: 11, color: "#64748b", marginTop: "0.75rem", wordBreak: "break-all" }}>{qrModal.url}</p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button className="btn-secondary" onClick={() => setQrModal(null)} style={{ flex: 1, justifyContent: "center", fontSize: 13 }}>Close</button>
              <button className="btn-primary" onClick={downloadQR} style={{ flex: 1, justifyContent: "center", fontSize: 13 }}>Download PNG</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[1, 2].map(i => <div key={i} className="shimmer" style={{ height: 120, borderRadius: 12 }} />)}
        </div>
      ) : pages.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <Link2 size={40} style={{ margin: "0 auto 1rem", color: "#374151" }} />
          <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, marginBottom: "0.5rem" }}>No payment pages yet</h3>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: "1.5rem" }}>Create your first payment page to start accepting USDC.</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: 14 }}>
            <Plus size={16} /> Create your first page
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {pages.map(page => (
            <div key={page._id} className="card card-hover">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
                    <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem" }}>{page.title}</h3>
                    <span className={`badge ${page.isActive ? "badge-green" : "badge-gray"}`}>{page.isActive ? "Active" : "Inactive"}</span>
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>{page.amountMode}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: "0.75rem" }}>remiovas.app/pay/{page.slug}</p>
                  {page.description && <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: "0.75rem" }}>{page.description}</p>}
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <div><p style={{ fontSize: 11, color: "#64748b" }}>Total received</p><p style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>${parseFloat(page.totalReceived).toFixed(2)} USDC</p></div>
                    <div><p style={{ fontSize: 11, color: "#64748b" }}>Payments</p><p style={{ fontSize: 14, fontWeight: 700 }}>{page.paymentCount}</p></div>
                    {page.fixedAmount && <div><p style={{ fontSize: 11, color: "#64748b" }}>Fixed amount</p><p style={{ fontSize: 14, fontWeight: 700 }}>${page.fixedAmount}</p></div>}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button className="btn-secondary" onClick={() => copyLink(page.slug, page._id)} style={{ fontSize: 12, padding: "0.375rem 0.75rem" }}>
                  {copiedId === page._id ? <><CheckCircle size={12} color="#10b981" /> Copied</> : <><Copy size={12} /> Copy Link</>}
                </button>
                <button className="btn-secondary" onClick={() => showQR(page.slug, page.title)} style={{ fontSize: 12, padding: "0.375rem 0.75rem" }}>
                  <QrCode size={12} /> QR Code
                </button>
                <a href={`/pay/${page.slug}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: 12, padding: "0.375rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  <ExternalLink size={12} /> Preview
                </a>
                <button className="btn-secondary" onClick={() => toggleActive(page._id, page.isActive)} style={{ fontSize: 12, padding: "0.375rem 0.75rem" }}>
                  {page.isActive ? <><ToggleRight size={12} /> Deactivate</> : <><ToggleLeft size={12} /> Activate</>}
                </button>
                <button onClick={() => deletePage(page._id)} style={{ fontSize: 12, padding: "0.375rem 0.75rem", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
