"use client";

// Turns the pixel characters from lib/pixelChar.ts into small sprite-sheet pictures, kept for
// as long as the page is open (one per look). The page shows them scaled up with hard edges.

import { CH, CW, DIRS, FRAMES, drawKit, drawSheet, type Pixels } from "@/lib/pixelChar";
import { PX } from "./pixel";
import { snapPixels } from "@/lib/palette";
import type { HeroLook } from "@/lib/types";

/** Size of one character on screen, in world units (one art pixel = PX units). */
export const SPRITE_W = CW * PX;
export const SPRITE_H = CH * PX;

const cache = new Map<string, string>();

function paint(frames: Pixels[][]): string {
  const c = document.createElement("canvas");
  c.width = CW * frames[0].length;
  c.height = CH * frames.length;
  const g = c.getContext("2d")!;
  frames.forEach((row, d) =>
    row.forEach((px, f) =>
      px.forEach((line, y) =>
        line.forEach((col, x) => {
          if (!col) return;
          g.fillStyle = col;
          g.fillRect(f * CW + x, d * CH + y, 1, 1);
        }),
      ),
    ),
  );
  const img = g.getImageData(0, 0, c.width, c.height);
  snapPixels(img.data);
  g.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

/** Sprite sheet for a look: rows down, up, side; 4 walk frames across. */
export function sheetUrl(look: HeroLook | undefined): string {
  const key = JSON.stringify(look ?? null);
  let url = cache.get(key);
  if (!url) {
    url = paint(drawSheet(look));
    cache.set(key, url);
  }
  return url;
}

export function kitUrl(): string {
  let url = cache.get("kit");
  if (!url) {
    url = paint([[drawKit()]]);
    cache.set("kit", url);
  }
  return url;
}

export const SHEET = { w: SPRITE_W * FRAMES, h: SPRITE_H * DIRS.length };
