"use client";

import { useEffect, useState, useRef } from "react";
import { Copy, Send, QrCode, ExternalLink, Loader2, CheckCircle, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import QRCode from "qrcode";

interface WalletInfo {
  publicKey: string;
  balance: string;
  activated: boolean;
  emailVerified: boolean;
}

interface Transaction {
  _id: string;
  type: string;
  amount: string;
  netAmount: string;
  description: string;
  txHash: string | null;
  createdAt: string;
  status: string;
  memo: string | null;
  toAddress: string | null;
  toUsername: string | null;
  fromAddress: string | null;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendForm, setSendForm] = useState({ recipient: "", amount: "", memo: "" });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch("/api/wallet").then(r => r.json()).then(d => {
      if (d.success) {
        setWallet(d.data);
        generateQR(d.data.publicKey);
      }
    });
    loadTxs(1);
    setLoading(false);
  }, []);

  const generateQR = async (address: string) => {
    try {
      const url = await QRCode.toDataURL(address, { width: 200, margin: 1, color: { dark: "#f1f5f9", light: "#111827" } });
      setQrDataUrl(url);
    } catch {}
  };

  const loadTxs = async (p: number) => {
    const r = await fetch(`/api/wallet/transactions?page=${p}&limit=15`);
    const d = await r.json();
    if (d.success) {
      setTxs(d.data.transactions);
      setTotalPages(d.data.pagination.pages);
      setPage(p);
    }
  };

  const copyAddress = async () => {
    if (!wallet) return;
    await navigator.clipboard.writeText(wallet.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(""); setSendSuccess("");
    setSending(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });
      const d = await res.json();
      if (!res.ok) { setSendError(d.error); return; }
      setSendSuccess(`Payment sent! TX: ${d.data.hash?.substring(0, 16)}...`);
      setSendForm({ recipient: "", amount: "", memo: "" });
      // Refresh wallet and txs
      fetch("/api/wallet").then(r => r.json()).then(d => { if (d.success) setWallet(d.data); });
      loadTxs(1);
    } catch { setSendError("Network error"); }
    finally { setSending(false); }
  };

  const typeColor = (type: string) => ["receive", "deposit"].includes(type) ? "#10b981" : "#f87171";
  const typeLabel = (type: string) => ({ send: "Sent", receive: "Received", deposit: "Deposited", withdraw: "Withdrawn", fee: "Fee", refund: "Refunded" }[type] || type);

  if (loading) return <div style={{ padding: "2rem" }}><div className="shimmer" style={{ height: 200, borderRadius: 12 }} /></div>;

  return (
    <div style={{ padding: "2rem", maxWidth: 900 }} className="fade-in">
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>Wallet</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Balance card */}
        <div className="stat-card" style={{ gridColumn: "1 / -1" }}>
          <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: "0.5rem" }}>Available Balance</p>
          <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3rem", fontWeight: 800, color: "#10b981", lineHeight: 1 }}>
            ${parseFloat(wallet?.balance || "0").toFixed(2)}<span style={{ fontSize: "1.25rem", marginLeft: 8 }}>USDC</span>
          </p>

          <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#64748b", flex: 1, minWidth: 0, wordBreak: "break-all" }}>
              {wallet?.publicKey}
            </div>
            <button onClick={copyAddress} className="btn-secondary" style={{ fontSize: 12, padding: "0.375rem 0.75rem", flexShrink: 0 }}>
              {copied ? <><CheckCircle size={12} color="#10b981" /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
            <button onClick={() => setShowQR(v => !v)} className="btn-secondary" style={{ fontSize: 12, padding: "0.375rem 0.75rem", flexShrink: 0 }}>
              <QrCode size={12} /> {showQR ? "Hide QR" : "Show QR"}
            </button>
          </div>

          {showQR && qrDataUrl && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
              <img src={qrDataUrl} alt="Wallet QR" style={{ borderRadius: 8, width: 160, height: 160 }} />
              <p style={{ fontSize: 12, color: "#64748b" }}>Scan this QR to auto-fill your wallet address</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Send form */}
        <div className="card">
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Send size={16} color="#0070f3" /> Send USDC
          </h2>

          {sendError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#f87171", fontSize: 13 }}>{sendError}</div>}
          {sendSuccess && <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "0.625rem", marginBottom: "1rem", color: "#34d399", fontSize: 13 }}>{sendSuccess}</div>}

          <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">Recipient (username or wallet address)</label>
              <input className="input-field" placeholder="@username or G..." value={sendForm.recipient} onChange={e => setSendForm(f => ({ ...f, recipient: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Amount (USDC)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 14 }}>$</span>
                <input className="input-field" type="number" min="1" step="0.01" placeholder="0.00" value={sendForm.amount} onChange={e => setSendForm(f => ({ ...f, amount: e.target.value }))} required style={{ paddingLeft: "1.75rem" }} />
              </div>
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>0.5% platform fee applies. Minimum $1.</p>
            </div>
            <div>
              <label className="label">Memo (optional)</label>
              <input className="input-field" placeholder="Invoice #42, project name..." maxLength={28} value={sendForm.memo} onChange={e => setSendForm(f => ({ ...f, memo: e.target.value }))} />
            </div>
            <button className="btn-primary" type="submit" disabled={sending || !wallet?.activated} style={{ justifyContent: "center" }}>
              {sending ? <Loader2 size={14} /> : <Send size={14} />}
              {sending ? "Sending..." : "Send USDC"}
            </button>
            {!wallet?.activated && <p style={{ fontSize: 12, color: "#f59e0b", textAlign: "center" }}>Verify your email to activate your wallet</p>}
          </form>
        </div>

        {/* Deposit info */}
        <div className="card">
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowDownLeft size={16} color="#10b981" /> Receive USDC
          </h2>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, marginBottom: "1rem" }}>
            To fund your wallet, send USDC to your wallet address from any Stellar-compatible wallet or exchange.
          </p>
          <div style={{ background: "#0d1424", borderRadius: 8, padding: "0.875rem", fontFamily: "JetBrains Mono, monospace", fontSize: 12, wordBreak: "break-all", color: "#60a5fa", marginBottom: "0.75rem" }}>
            {wallet?.publicKey}
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: "1rem" }}>
            Make sure to send <strong style={{ color: "#f1f5f9" }}>USDC only</strong> on the Stellar network. Other assets will be returned.
          </p>
          <button onClick={copyAddress} className="btn-secondary" style={{ width: "100%", justifyContent: "center", fontSize: 14 }}>
            {copied ? <><CheckCircle size={14} color="#10b981" /> Address Copied!</> : <><Copy size={14} /> Copy Wallet Address</>}
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card">
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>Transaction History</h2>
        {txs.length === 0 ? (
          <p style={{ color: "#4b5563", fontSize: 14, textAlign: "center", padding: "2rem 0" }}>No transactions yet.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {txs.map(tx => (
                <div key={tx._id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem", background: "#0d1424", borderRadius: 10, border: "1px solid #1f2937" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: typeColor(tx.type) + "20", display: "flex", alignItems: "center", justifyContent: "center", color: typeColor(tx.type), flexShrink: 0 }}>
                    {["receive", "deposit"].includes(tx.type) ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{tx.description}</p>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{new Date(tx.createdAt).toLocaleString()}</span>
                      {tx.memo && <span style={{ fontSize: 11, color: "#4b5563", background: "#1f2937", borderRadius: 4, padding: "1px 6px" }}>{tx.memo}</span>}
                      <span className={`badge ${tx.status === "completed" ? "badge-green" : tx.status === "failed" ? "badge-red" : "badge-yellow"}`} style={{ fontSize: 10 }}>{tx.status}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: typeColor(tx.type) }}>
                      {["receive", "deposit"].includes(tx.type) ? "+" : "-"}${parseFloat(tx.amount).toFixed(2)}
                    </p>
                    {tx.txHash && (
                      <a href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 2, marginTop: 2 }}>
                        <ExternalLink size={10} /> View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1.25rem" }}>
                <button className="btn-secondary" style={{ fontSize: 13, padding: "0.375rem 0.875rem" }} disabled={page <= 1} onClick={() => loadTxs(page - 1)}>Previous</button>
                <span style={{ fontSize: 13, color: "#64748b", padding: "0.375rem 0.5rem" }}>Page {page} of {totalPages}</span>
                <button className="btn-secondary" style={{ fontSize: 13, padding: "0.375rem 0.875rem" }} disabled={page >= totalPages} onClick={() => loadTxs(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
