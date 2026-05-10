import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/service-worker-registration";

export const metadata: Metadata = {
  title: {
    default: "Remiovas — Get Paid in Dollars. Instantly.",
    template: "%s | Remiovas",
  },
  description: "Create a shareable payment page on Stellar in 30 seconds. Accept USDC from anyone, anywhere.",
  manifest: "/manifest.webmanifest",
  keywords: ["stellar", "payments", "usdc", "crypto", "payment link", "paylink"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
