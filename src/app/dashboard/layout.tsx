"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Wallet, Link2, FileText, Bell, User, LogOut, Menu, X, AlertCircle
} from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  emailVerified: boolean;
  walletActivated: boolean;
  walletPublicKey: string;
  usdcBalance: string;
}

interface Notification {
  _id: string;
  isRead: boolean;
}

function getInitials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().substring(0, 2);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.success) { router.push("/login"); return; }
      setUser(d.data.user);
    }).catch(() => router.push("/login")).finally(() => setLoading(false));

    fetch("/api/notifications?limit=1").then(r => r.json()).then(d => {
      if (d.success) setUnread(d.data.unreadCount);
    });
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/wallet", label: "Wallet", icon: <Wallet size={18} /> },
    { href: "/dashboard/pages", label: "Payment Pages", icon: <Link2 size={18} /> },
    { href: "/dashboard/requests", label: "Payment Requests", icon: <FileText size={18} /> },
    { href: "/dashboard/notifications", label: "Notifications", icon: <Bell size={18} />, badge: unread },
    { href: "/dashboard/profile", label: "Profile", icon: <User size={18} /> },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #1f2937", borderTop: "3px solid #0070f3", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const Sidebar = () => (
    <div style={{ width: 240, background: "#0d1424", borderRight: "1px solid #1f2937", height: "100vh", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1f2937" }}>
        <Link href="/" style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 18, color: "#0070f3", textDecoration: "none" }}>
          Remiovas
        </Link>
      </div>

      {user && !user.emailVerified && (
        <div style={{ margin: "0.75rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "0.625rem 0.875rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <AlertCircle size={14} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>Verify your email</p>
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Some features are locked until you verify.</p>
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: "0.75rem" }}>
        {navItems.map(({ href, label, icon, badge }) => (
          <Link key={href} href={href} className={`nav-link${pathname === href ? " active" : ""}`} style={{ marginBottom: 2, position: "relative" }}>
            {icon}
            <span style={{ flex: 1 }}>{label}</span>
            {badge ? (
              <span style={{ background: "#0070f3", color: "white", fontSize: 11, fontWeight: 700, borderRadius: 9999, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      {user && (
        <div style={{ padding: "1rem", borderTop: "1px solid #1f2937" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div className="avatar-initials" style={{ width: 36, height: 36, fontSize: 13 }}>
              {getInitials(user.displayName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.displayName}</p>
              <p style={{ fontSize: 11, color: "#64748b" }}>@{user.username}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-secondary" style={{ width: "100%", fontSize: 13, padding: "0.5rem", justifyContent: "center", gap: "0.5rem" }}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e" }}>
      {/* Desktop sidebar */}
      <div style={{ display: "none" }} className="sidebar-desktop">
        <Sidebar />
      </div>
      <style>{`
        @media (min-width: 768px) { .sidebar-desktop { display: flex !important; } .mobile-header { display: none !important; } }
        @media (max-width: 767px) { .sidebar-desktop { display: none !important; } }
      `}</style>

      {/* Mobile header */}
      <div className="mobile-header" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "#0d1424", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1rem", height: 56 }}>
        <Link href="/" style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 16, color: "#0070f3", textDecoration: "none" }}>Remiovas</Link>
        <button onClick={() => setMobileOpen(o => !o)} style={{ background: "none", border: "none", color: "#f1f5f9", cursor: "pointer" }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)" }} onClick={() => setMobileOpen(false)}>
          <div style={{ width: 240, height: "100%", background: "#0d1424" }} onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ paddingTop: 0 }} className="main-pad">
          <style>{`@media (max-width: 767px) { .main-pad { padding-top: 56px !important; } }`}</style>
          {user && !user.emailVerified && (
            <div style={{ background: "rgba(245,158,11,0.08)", borderBottom: "1px solid rgba(245,158,11,0.2)", padding: "0.75rem 2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <AlertCircle size={16} color="#fbbf24" />
              <p style={{ fontSize: 14, color: "#fbbf24" }}>
                Please verify your email to unlock all features. Check your inbox or{" "}
                <button style={{ background: "none", border: "none", color: "#0070f3", cursor: "pointer", fontSize: 14, textDecoration: "underline" }}>
                  resend verification email
                </button>.
              </p>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
