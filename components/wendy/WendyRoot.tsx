"use client";

import { useEffect } from "react";

/** Gives the page Wendy's light look (the tracker's theme attributes are cleared while she's open). */
export function WendyRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const saved = { style: html.getAttribute("data-style"), theme: html.getAttribute("data-theme") };
    html.classList.add("wendy");
    html.removeAttribute("data-style");
    html.removeAttribute("data-theme");
    return () => {
      html.classList.remove("wendy");
      if (saved.style) html.setAttribute("data-style", saved.style);
      if (saved.theme) html.setAttribute("data-theme", saved.theme);
    };
  }, []);
  return <div className="wd min-h-screen">{children}</div>;
}
