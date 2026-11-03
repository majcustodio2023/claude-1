import type { Metadata, Viewport } from "next";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/600-italic.css";
import "@fontsource/quicksand/500.css";
import "@fontsource/quicksand/600.css";
import "@fontsource/quicksand/700.css";
import "./wendy.css";
import { WendyRoot } from "@/components/wendy/WendyRoot";

export const metadata: Metadata = {
  title: "Wendy",
  description: "Turn a client's socials into a beautiful website prototype.",
  icons: { icon: [{ url: "/wendy-icon.svg", type: "image/svg+xml" }], apple: "/wendy-icon.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fdeef5" };

export default function WendyLayout({ children }: { children: React.ReactNode }) {
  return <WendyRoot>{children}</WendyRoot>;
}
