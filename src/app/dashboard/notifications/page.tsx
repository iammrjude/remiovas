"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Wallet, Link2, Send, ShieldCheck, RotateCcw } from "lucide-react";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, string>;
  createdAt: string;
}

function notifIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    payment_received: <Wallet size={16} color="#10b981" />,
    transfer_received: <Wallet size={16} color="#10b981" />,
    transfer_sent: <Send size={16} color="#60a5fa" />,
    email_verified: <ShieldCheck size={16} color="#10b981" />,
    wallet_activated: <Wallet size={16} color="#0070f3" />,
    refund_issued: <RotateCcw size={16} color="#fbbf24" />,
    payment_request_completed: <Link2 size={16} color="#10b981" />,
    payment_request_expired: <Link2 size={16} color="#94a3b8" />,
  };
  return icons[type] || <Bell size={16} color="#94a3b8" />;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadNotifications(1); }, []);

  const loadNotifications = async (p: number) => {
    setLoading(true);
    const r = await fetch(`/api/notifications?page=${p}&limit=20`);
    const d = await r.json();
    if (d.success) {
      setNotifications(d.data.notifications);
      setUnreadCount(d.data.unreadCount);
      setTotalPages(Math.ceil(d.data.total / 20));
      setPage(p);
    }
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return "Just now";
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 700 }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{ background: "#0070f3", color: "white", fontSize: 13, fontWeight: 700, borderRadius: 9999, padding: "2px 10px" }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Your activity and account updates</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={markAllRead} style={{ fontSize: 13, padding: "0.5rem 1rem" }}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="shimmer" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <Bell size={40} style={{ margin: "0 auto 1rem", color: "#374151" }} />
          <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, marginBottom: "0.5rem" }}>No notifications yet</h3>
          <p style={{ color: "#64748b", fontSize: 14 }}>You'll see payment updates and account activity here.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {notifications.map(n => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem", background: n.isRead ? "#111827" : "rgba(0,112,243,0.06)", border: `1px solid ${n.isRead ? "#1f2937" : "rgba(0,112,243,0.2)"}`, borderRadius: 12, cursor: n.isRead ? "default" : "pointer", transition: "all 0.15s ease" }}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1f2937", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {notifIcon(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <p style={{ fontSize: 14, fontWeight: n.isRead ? 500 : 700, color: n.isRead ? "#cbd5e1" : "#f1f5f9" }}>{n.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0070f3" }} />}
                      <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 2, lineHeight: 1.5 }}>{n.message}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1.5rem" }}>
              <button className="btn-secondary" style={{ fontSize: 13, padding: "0.375rem 0.875rem" }} disabled={page <= 1} onClick={() => loadNotifications(page - 1)}>Previous</button>
              <span style={{ fontSize: 13, color: "#64748b", padding: "0.375rem 0.5rem" }}>Page {page} of {totalPages}</span>
              <button className="btn-secondary" style={{ fontSize: 13, padding: "0.375rem 0.875rem" }} disabled={page >= totalPages} onClick={() => loadNotifications(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
