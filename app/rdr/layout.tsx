import type { Metadata, Viewport } from "next";
import "./rdr3.css";

export const metadata: Metadata = {
  title: "Boss RDR — Get Your Business Known, Trusted and Chosen",
  description: "A personal message from Boss RDR, Reymond delos Reyes. An audience of more than 1.4 billion views, now used to help good Filipino businesses become easier to see, understand, trust and buy from.",
  openGraph: {
    title: "Boss RDR — Get Your Business Known, Trusted and Chosen",
    description: "If your business is already good, give me a chance to help make sure the market knows it.",
    type: "website",
    siteName: "RDR Business Solutions",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#071128" };

export default function RdrLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rdr no-js" id="rdr-root">
      <script dangerouslySetInnerHTML={{ __html: "document.getElementById('rdr-root').classList.remove('no-js')" }} />
      {children}
    </div>
  );
}
