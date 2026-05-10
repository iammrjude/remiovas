"use client";

import Link from "next/link";
import { ArrowRight, Zap, Shield, Globe, QrCode, CreditCard, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#f1f5f9" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #1f2937", padding: "0 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, color: "#0070f3", letterSpacing: -0.5 }}>
            Remiovas
          </span>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Link href="/login" className="btn-secondary" style={{ padding: "0.5rem 1.25rem", fontSize: 14 }}>Log in</Link>
            <Link href="/signup" className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: 14 }}>Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "6rem 2rem 4rem", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div className="badge badge-blue" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
          <Zap size={12} />
          Built on Stellar · Settles in ~5 seconds
        </div>
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: "1.5rem" }}>
          Get paid in dollars.{" "}
          <span className="gradient-text">Instantly.</span>{" "}
          From anywhere.
        </h1>
        <p style={{ fontSize: "1.125rem", color: "#94a3b8", lineHeight: 1.7, marginBottom: "3rem", maxWidth: 560, margin: "0 auto 3rem" }}>
          Create a shareable payment page for your Stellar wallet in 30 seconds.
          No code. No crypto expertise needed.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" className="btn-primary" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}>
            Create your payment page <ArrowRight size={16} />
          </Link>
          <Link href="/pay/demo" className="btn-secondary" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}>
            See a live example
          </Link>
        </div>

        <p style={{ marginTop: "1.5rem", color: "#4b5563", fontSize: 13 }}>
          Free to start · 0.5% fee on payments · No monthly fees
        </p>
      </section>

      {/* How it works */}
      <section style={{ padding: "5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", textAlign: "center", fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
          How it works
        </h2>
        <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: "3rem" }}>
          From signup to first payment in under 2 minutes.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
          {[
            { step: "01", title: "Create an account", desc: "Sign up with your email. We automatically generate a Stellar wallet for you." },
            { step: "02", title: "Create your payment page", desc: "Choose a URL slug, add a title and description. Done in under a minute." },
            { step: "03", title: "Share your link", desc: "Share the link on WhatsApp, Twitter, Instagram bio, or print the QR code." },
            { step: "04", title: "Get paid in USDC", desc: "Payments settle in ~5 seconds. Withdraw to any Stellar wallet anytime." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="card card-hover">
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0070f3", fontFamily: "JetBrains Mono, monospace", marginBottom: "1rem" }}>{step}</div>
              <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</h3>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "5rem 2rem", background: "#0d1424", borderTop: "1px solid #1f2937", borderBottom: "1px solid #1f2937" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", textAlign: "center", fontSize: "2rem", fontWeight: 700, marginBottom: "3rem" }}>
            Everything you need to get paid
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {[
              { icon: <Zap size={20} />, title: "Instant settlement", desc: "Payments land in your wallet in ~5 seconds, 24/7, on any day including holidays." },
              { icon: <Shield size={20} />, title: "Non-custodial wallet", desc: "Your encrypted keys live in your account. We never hold your funds in a pooled account." },
              { icon: <Globe size={20} />, title: "Accept from anywhere", desc: "Anyone with a Stellar wallet can pay you. No bank account or crypto exchange needed." },
              { icon: <QrCode size={20} />, title: "QR codes built in", desc: "Every payment page comes with a QR code. Print it, share it, embed it anywhere." },
              { icon: <CreditCard size={20} />, title: "Fixed & flexible amounts", desc: "Set a fixed price for products, flexible amount for services, or tip-jar style for donations." },
              { icon: <CheckCircle size={20} />, title: "Payment requests", desc: "Generate unique payment links per invoice. Wrong amount? Automatic refund." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: "flex", gap: "1rem", padding: "1.5rem", background: "#111827", border: "1px solid #1f2937", borderRadius: 12 }}>
                <div style={{ color: "#0070f3", flexShrink: 0, marginTop: 2 }}>{icon}</div>
                <div>
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1rem", fontWeight: 600, marginBottom: "0.375rem" }}>{title}</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "6rem 2rem", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
            Start accepting payments today
          </h2>
          <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
            Free to create. 0.5% fee only when you receive payments.
          </p>
          <Link href="/signup" className="btn-primary" style={{ fontSize: "1rem", padding: "0.875rem 2.5rem" }}>
            Create your free account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1f2937", padding: "2rem", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, color: "#0070f3" }}>Remiovas</span>
          <div style={{ display: "flex", gap: "2rem" }}>
            <Link href="/terms" style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>Terms</Link>
            <Link href="/privacy" style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>Privacy</Link>
            <a href="https://github.com" style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>GitHub</a>
          </div>
          <span style={{ color: "#4b5563", fontSize: 13 }}>Built on Stellar · © {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
