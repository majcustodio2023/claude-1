"use client";

// Dawnterra's one art style: pixel art. Every scene (the town, each interior, your home) is
// drawn as shapes, then painted onto a small canvas where one art pixel is PX world units,
// with no smoothing, and shown scaled back up with hard pixel edges. Characters are drawn
// pixel by pixel at the same size (components/city/pixelChars.ts), so the whole world shares
// one pixel grid, one palette and one outline.

import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { snapPixels } from "@/lib/palette";

/** World units per art pixel. A street tile (T = 40) is 16 art pixels. */
export const PX = 2.5;

export const svgText = (node: ReactElement) => {
  let s = renderToStaticMarkup(node);
  if (!s.slice(0, 200).includes("xmlns=")) s = s.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  // Hard edges everywhere: no blended in-between colours, just pixels.
  return s.replace("<svg", '<svg shape-rendering="crispEdges"');
};

const load = (url: string) =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = url;
  });

/** Draws the scene as pixel art and returns a picture URL (free it with URL.revokeObjectURL). */
export function pixelPicture(node: ReactElement, w: number, h: number): Promise<string> {
  return pixelGrid(node, Math.ceil(w / PX), Math.ceil(h / PX));
}

/** Draws a picture as pixel art on a grid of cw x ch art pixels (for portraits and icons). */
export async function pixelGrid(node: ReactElement | string, cw: number, ch: number): Promise<string> {
  const src = URL.createObjectURL(new Blob([typeof node === "string" ? node : svgText(node)], { type: "image/svg+xml" }));
  try {
    const img = await load(src);
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, cw, ch);
    const px = g.getImageData(0, 0, cw, ch);
    const d = px.data;
    // Snap every pixel to the shared Dawnterra palette (lib/palette.ts), so soft gradients
    // become flat pixel bands and every scene uses the same colours.
    snapPixels(d);
    g.putImageData(px, 0, 0);
    const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/png"));
    return URL.createObjectURL(blob!);
  } finally {
    URL.revokeObjectURL(src);
  }
}
