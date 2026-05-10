"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, FileText, Send, Plus, ExternalLink } from "lucide-react";

interface Stats {
  balance: string;
  activated: boolean;
  emailVerified: boolean;
  publicKey: string;
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
}

function truncate(str: string, n = 8) {
  if (!str) return "";
  return str.length > n * 2 + 3 ? `${str.substring(0, n)}...${str.substring(str.length - 4)}` : str;
}

function typeColor(type: string) {
  if (["receive", "deposit"].includes(type)) return "#10b981";
  if (["send", "withdraw"].includes(type)) return "#f87171";
  return "#94a3b8";
}

function typeIcon(type: string) {
  if (["receive", "deposit"].includes(type)) return <ArrowDownLeft size={14} />;
  return <ArrowUpRight size={14} />;
}

export default function DashboardPage() {
  const [wallet, setWallet] = useState<Stats | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/wallet").then(r => r.json()),
      fetch("/api/wallet/transactions?limit=5").then(r => r.json()),
      fetch("/api/pages").then(r => r.json()),
      fetch("/api/requests?limit=1").then(r => r.json()),
    ]).then(([w, t, p, rq]) => {
      if (w.success) setWallet(w.data);
      if (t.success) setTxs(t.data.transactions);
      if (p.success) setPageCount(p.data.pages.length);
      if (rq.success) setRequestCount(rq.data.pagination.total);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: 100, borderRadius: 12, marginBottom: "1rem" }} />)}
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 900 }} className="fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.75rem", fontWeight: 700 }}>Dashboard</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Overview of your account</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="stat-card">
          <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: "0.75rem" }}>USDC Balance</p>
          <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2rem", fontWeight: 800, color: "#10b981" }}>
            ${parseFloat(wallet?.balance || "0").toFixed(2)}
          </p>
          <p style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>USDC</p>
        </div>
        <div className="stat-card">
          <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: "0.75rem" }}>Payment Pages</p>
          <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2rem", fontWeight: 800 }}>{pageCount}</p>
          <Link href="/dashboard/pages" style={{ fontSize: 12, color: "#0070f3", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
            Manage <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="stat-card">
          <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: "0.75rem" }}>Payment Requests</p>
          <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2rem", fontWeight: 800 }}>{requestCount}</p>
          <Link href="/dashboard/requests" style={{ fontSize: 12, color: "#0070f3", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="stat-card">
          <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: "0.75rem" }}>Wallet Status</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
            <div className={wallet?.activated ? "pulse-dot" : ""} style={!wallet?.activated ? { width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" } : {}} />
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1rem", fontWeight: 700 }}>{wallet?.activated ? "Active" : "Pending"}</span>
          </div>
          <p style={{ fontSize: 11, color: "#4b5563", marginTop: 4, fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all" }}>
            {truncate(wallet?.publicKey || "", 6)}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <Link href="/dashboard/wallet" className="btn-primary" style={{ fontSize: 14, padding: "0.625rem 1.25rem" }}>
          <Send size={14} /> Send USDC
        </Link>
        <Link href="/dashboard/pages" className="btn-secondary" style={{ fontSize: 14, padding: "0.625rem 1.25rem" }}>
          <Plus size={14} /> New Payment Page
        </Link>
        <Link href="/dashboard/requests" className="btn-secondary" style={{ fontSize: 14, padding: "0.625rem 1.25rem" }}>
          <FileText size={14} /> New Payment Request
        </Link>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1rem", fontWeight: 700 }}>Recent Transactions</h2>
          <Link href="/dashboard/wallet" style={{ fontSize: 13, color: "#0070f3" }}>View all</Link>
        </div>

        {txs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "#4b5563" }}>
            <TrendingUp size={32} style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: 14 }}>No transactions yet.</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Create a payment page and share it to get started.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {txs.map(tx => (
              <div key={tx._id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", background: "#0d1424", borderRadius: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: typeColor(tx.type) + "20", display: "flex", alignItems: "center", justifyContent: "center", color: typeColor(tx.type), flexShrink: 0 }}>
                  {typeIcon(tx.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.description}</p>
                  <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: typeColor(tx.type) }}>
                    {["receive", "deposit"].includes(tx.type) ? "+" : "-"}${parseFloat(tx.amount).toFixed(2)}
                  </p>
                  {tx.txHash && (
                    <a href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 2, marginTop: 2 }}>
                      Explorer <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
