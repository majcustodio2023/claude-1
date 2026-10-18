"use client";

// The Dawnterra pixel look outside the city: when the "Dawnterra pixel" style is on (or inside the
// city), portraits and mascots are redrawn as pixel art in the shared palette, so a person looks
// the same on the dashboard as they do walking around town.

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactElement } from "react";
import { pixelGrid, svgText } from "./city/pixel";
import { CH, CW, drawFrame } from "@/lib/pixelChar";
import { snapPixels } from "@/lib/palette";
import type { HeroLook } from "@/lib/types";

/** Set inside the city, which is always pixel art whatever style the rest of the app uses. */
export const PixelForce = createContext(false);

function subscribe(cb: () => void) {
  const o = new MutationObserver(cb);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-style"] });
  return () => o.disconnect();
}

export function usePixelStyle(): boolean {
  const forced = useContext(PixelForce);
  const page = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.style === "pixel",
    () => false,
  );
  return forced || page;
}

const cache = new Map<string, Promise<string>>();

/** Shows an SVG picture redrawn as pixel art, `grid` art pixels across. */
export function PixelImg({ node, width, height, grid, className = "", label }: { node: ReactElement; width: number; height: number; grid: number; className?: string; label?: string }) {
  const markup = svgText(node);
  const gw = Math.max(8, Math.round(grid));
  const gh = Math.max(8, Math.round((grid * height) / width));
  const key = `${gw}x${gh}:${markup}`;
  const [url, setUrl] = useState("");
  useEffect(() => {
    let live = true;
    let p = cache.get(key);
    if (!p) {
      p = pixelGrid(markup, gw, gh);
      cache.set(key, p);
      if (cache.size > 400) cache.delete(cache.keys().next().value!);
    }
    p.then((u) => live && setUrl(u)).catch(() => {});
    return () => {
      live = false;
    };
  }, [key, markup, gw, gh]);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} width={width} height={height} alt={label ?? ""} className={`pixelated shrink-0 ${className}`} draggable={false} />
  ) : (
    <span className={`inline-block shrink-0 ${className}`} style={{ width, height }} aria-label={label} />
  );
}

const frames = new Map<string, string>();

/** The hero's standing pixel sprite (the same one that walks around the city). */
function heroFrame(look: HeroLook | undefined): string {
  const key = JSON.stringify(look ?? null);
  let url = frames.get(key);
  if (!url) {
    const px = drawFrame(look, "down", 1);
    const c = document.createElement("canvas");
    c.width = CW;
    c.height = CH;
    const g = c.getContext("2d")!;
    px.forEach((row, y) =>
      row.forEach((col, x) => {
        if (!col) return;
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }),
    );
    const img = g.getImageData(0, 0, CW, CH);
    snapPixels(img.data);
    g.putImageData(img, 0, 0);
    url = c.toDataURL("image/png");
    frames.set(key, url);
  }
  return url;
}

/** Pixel hero sized to fit where the drawn hero (size x size*1.125) used to go. */
export function PixelHero({ look, size, className = "", lively = false }: { look?: HeroLook; size: number; className?: string; lively?: boolean }) {
  const [url, setUrl] = useState("");
  const key = JSON.stringify(look ?? null);
  useEffect(() => setUrl(heroFrame(look)), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const h = size * 1.125;
  // Whole art pixels only, so every pixel is the same size on screen.
  const scale = Math.max(1, Math.floor((h * 0.92) / CH));
  return (
    <span className={`relative inline-flex shrink-0 items-end justify-center ${className}`} style={{ width: size, height: h }} role="img" aria-label="Hero">
      <span className="absolute bottom-[3%] left-1/2 -translate-x-1/2 bg-black/25" style={{ width: scale * 9, height: scale * 2 }} />
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" width={CW * scale} height={CH * scale} className={`pixelated relative mb-[4%] ${lively ? "pix-bob" : ""}`} draggable={false} />
      )}
    </span>
  );
}
