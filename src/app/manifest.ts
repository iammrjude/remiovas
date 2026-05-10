import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Remiovas",
    short_name: "Remiovas",
    description: "Create a shareable payment page on Stellar in 30 seconds. Accept USDC from anyone, anywhere.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0c2a4b",
    theme_color: "#0070f3",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
