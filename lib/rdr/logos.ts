// Real marks for the press and client rows. A file the team drops in /public/rdr/logos wins;
// otherwise the outlet's own site icon is used; otherwise a clean monogram.
import { assets } from "./assets";

const mediaDomains: Record<string, string> = {
  PTV: "ptvnews.ph",
  GMA: "gmanetwork.com",
  TV5: "tv5.com.ph",
  "ABS-CBN": "abs-cbn.com",
  NET25: "net25.tv",
  Bilyonaryo: "bilyonaryo.com",
  "Manila Bulletin": "mb.com.ph",
  "Manila Standard": "manilastandard.net",
  "The Philippine Star": "philstar.com",
};

const brandDomains: Record<string, string> = {
  "Brilliant Skin": "brilliantskinessentials.com",
};

export interface Mark {
  name: string;
  src: string;
  kind: "file" | "icon" | "mono";
}

const icon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export function mediaMark(name: string): Mark {
  if (assets.mediaLogos[name]) return { name, src: assets.mediaLogos[name], kind: "file" };
  if (mediaDomains[name]) return { name, src: icon(mediaDomains[name]), kind: "icon" };
  return { name, src: "", kind: "mono" };
}

export function brandMark(name: string): Mark {
  if (assets.brandLogos[name]) return { name, src: assets.brandLogos[name], kind: "file" };
  if (brandDomains[name]) return { name, src: icon(brandDomains[name]), kind: "icon" };
  return { name, src: "", kind: "mono" };
}

export const monogram = (name: string) =>
  name
    .replace(/[^A-Za-z0-9 +]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
