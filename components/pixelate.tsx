"use client";

// The Dawnterra pixel look outside the city: when the "Dawnterra pixel" style is on (or inside the
// city), portraits and mascots are redrawn as pixel art in the shared palette, so a person looks
// the same on the dashboard as they do walking around town.

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactElement } from "react";
import { pixelGrid, svgText } from "./city/pixel";
import { PH, SPRITE_BOX, drawPortrait } from "@/lib/pixelGear";
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

const frames = new Map<string, { url: string; w: number; h: number }>();

/**
 * The hero's pixel portrait: the city sprite plus everything worn (see lib/pixelGear.ts), cropped
 * to what's drawn (kept centred on the hero) so a plain hero shows as big as it can.
 */
function heroFrame(look: HeroLook | undefined, items: string[], gear: string[]) {
  const key = JSON.stringify([look ?? null, items, gear]);
  let f = frames.get(key);
  if (!f) {
    const px = drawPortrait(look, items, gear);
    let top = PH;
    let bottom = 0;
    let half = 0;
    const mid = SPRITE_BOX.x + SPRITE_BOX.w / 2;
    px.forEach((row, y) =>
      row.forEach((col, x) => {
        if (!col) return;
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        half = Math.max(half, Math.abs(x + 0.5 - mid));
      }),
    );
    half = Math.ceil(half);
    const w = half * 2;
    const h = bottom - top + 1;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    px.forEach((row, y) =>
      row.forEach((col, x) => {
        if (!col) return;
        g.fillStyle = col;
        g.fillRect(x - (mid - half), y - top, 1, 1);
      }),
    );
    const img = g.getImageData(0, 0, w, h);
    snapPixels(img.data);
    g.putImageData(img, 0, 0);
    f = { url: c.toDataURL("image/png"), w, h };
    frames.set(key, f);
    if (frames.size > 200) frames.delete(frames.keys().next().value!);
  }
  return f;
}

/**
 * Pixel hero sized to fit where the drawn hero (size x size*1.125) used to go, wearing its shop
 * items and achievement gear. Drawn at whole art pixels only, so every pixel is the same size.
 */
export function PixelHero({ look, items = [], gear = [], size, className = "", lively = false }: { look?: HeroLook; items?: string[]; gear?: string[]; size: number; className?: string; lively?: boolean }) {
  const [f, setF] = useState<{ url: string; w: number; h: number } | null>(null);
  const key = JSON.stringify([look ?? null, items, gear]);
  useEffect(() => setF(heroFrame(look, items, gear)), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const h = size * 1.125;
  const scale = f ? Math.max(1, Math.floor(Math.min((h * 0.96) / f.h, (size * 1.2) / f.w))) : 1;
  return (
    <span className={`relative inline-flex shrink-0 items-end justify-center ${className}`} style={{ width: size, height: h }} role="img" aria-label="Hero">
      {f && <span className="absolute bottom-[1%] left-1/2 -translate-x-1/2 bg-black/25" style={{ width: scale * 10, height: scale * 2 }} />}
      {f && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={f.url} alt="" width={f.w * scale} height={f.h * scale} className={`pixelated relative mb-[2%] max-w-none ${lively ? "pix-bob" : ""}`} draggable={false} />
      )}
    </span>
  );
}
