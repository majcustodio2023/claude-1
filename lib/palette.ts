// Dawnterra's one palette: warm autumn ramps (each listed dark to light). Every scene and every
// character is snapped to these colours, so the town, the rooms, the people and the UI all share
// the same cozy colours instead of each piece picking its own.

const RAMPS: string[][] = [
  ["#1a1218", "#2b1d2e", "#3b2416", "#4a3040"], // ink and deep shadow
  ["#4e2f1d", "#6e4425", "#8a5a32", "#a8743f", "#c9955a", "#e0b57a"], // wood
  ["#e8cfa2", "#f3e2c0", "#fbf1dc", "#fffaf0", "#ffffff"], // parchment and cream
  ["#253d24", "#2f4a2a", "#3e6b32", "#4f8a3a", "#6aa645", "#8cc05a", "#b5d67a"], // grass and leaves
  ["#6b2a22", "#93392a", "#c0502f", "#d9703b", "#e8954a", "#f2b866"], // autumn roofs and leaves
  ["#9a6a1c", "#cf8a1f", "#e8a33d", "#f4c95d", "#fbe29a"], // gold and lamplight
  ["#1f4a52", "#2a6a6e", "#2f8f83", "#4fb0a0", "#86d0bd", "#c4ead9"], // teal and water
  ["#1c2540", "#23314f", "#34507a", "#4f78a8", "#7aa3cc", "#b4d0e6"], // blue and glass
  ["#3d3a40", "#5a5458", "#7d7574", "#a3998f", "#c8bdae", "#e4dacb"], // warm stone
  ["#5a2034", "#7a2f45", "#a8475e", "#cf6f7d", "#e8a0a0", "#f5cfc4"], // rose
  ["#2c2148", "#3a2a5a", "#5a4290", "#7f67b8", "#a996d6", "#d3c8ec"], // violet
  ["#6a4030", "#8d5a3c", "#b87a55", "#d9a07a", "#f0c4a0", "#fbe0c8"], // skin
];

export const PALETTE: [number, number, number][] = RAMPS.flat().map((h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
});

// Nearest palette colour by "redmean" distance (close to how eyes judge colour), cached on a
// 32-level grid so a whole scene snaps quickly.
const cache = new Int16Array(32 * 32 * 32).fill(-1);

function nearest(r: number, g: number, b: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < PALETTE.length; i++) {
    const [pr, pg, pb] = PALETTE[i];
    const rm = (r + pr) / 2;
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Snaps an RGB colour to the Dawnterra palette. */
export function snap(r: number, g: number, b: number): [number, number, number] {
  const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
  let i = cache[key];
  if (i < 0) {
    i = nearest((r & 0xf8) + 4, (g & 0xf8) + 4, (b & 0xf8) + 4);
    cache[key] = i;
  }
  return PALETTE[i];
}

/** Snaps every opaque pixel of an RGBA buffer to the palette, in place; alpha becomes on or off. */
export function snapPixels(d: Uint8ClampedArray) {
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) {
      d[i + 3] = 0;
      continue;
    }
    const [r, g, b] = snap(d[i], d[i + 1], d[i + 2]);
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = 255;
  }
}

/** Hex form of snap, for code that draws with colour strings. */
export function snapHex(hex: string): string {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const [r, g, b] = snap((n >> 16) & 255, (n >> 8) & 255, n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
