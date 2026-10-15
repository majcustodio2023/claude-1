import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agency Tracker",
    short_name: "Tracker",
    description: "Money, pipeline, team and ads for your agency, gamified.",
    start_url: "/",
    display: "standalone",
    background_color: "#06070d",
    theme_color: "#06070d",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  };
}
