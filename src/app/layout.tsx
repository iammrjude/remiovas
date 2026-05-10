import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/service-worker-registration";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: {
    default: "Remiovas — Get Paid in Dollars. Instantly.",
    template: "%s | Remiovas",
  },
  description: "Create a shareable payment page on Stellar in 30 seconds. Accept USDC from anyone, anywhere.",
  manifest: "/manifest.webmanifest",
  keywords: ["stellar", "payments", "usdc", "crypto", "payment link", "paylink"],
  icons: [
    {
      rel: "icon",
      url: "/favicon.svg",
      type: "image/svg+xml",
    },
    {
      rel: "apple-touch-icon",
      url: "/logo.svg",
      type: "image/svg+xml",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      {/* <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head> */}
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
