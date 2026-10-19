// Dawnterra's characters as pixel art: a cute chibi on a 16 x 24 pixel grid, drawn from the
// same look (HeroLook) the comic hero uses, so everyone keeps their own hair, colours and
// extras. Pure functions: a look goes in, rows of colours come out (null = see-through).
//
// Each character has 3 directions (down, up, side = facing right; left is mirrored) and
// 4 walk frames (step, stand, other step, stand). Every sprite gets the same treatment:
// soft shading, light from the top left, and an outline one shade darker than what it wraps.

import type { HeroLook } from "./types";
import { HERO_DEFAULTS } from "./heroLook";

export const CW = 16;
export const CH = 24;
export const DIRS = ["down", "up", "side"] as const;
export type Dir = (typeof DIRS)[number];
/** Frame order in a walk cycle. Frame 1 is standing still. */
export const FRAMES = 4;

export type Pixels = (string | null)[][];

// ---------- colour helpers ----------

const hex = (n: number) => n.toString(16).padStart(2, "0");
function toRgb(c: string): [number, number, number] {
  const h = c.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (r: number, g: number, b: number) => `#${hex(Math.round(r))}${hex(Math.round(g))}${hex(Math.round(b))}`;

/** Mixes a toward b by k (0..1). */
export function mix(a: string, b: string, k: number): string {
  const x = toRgb(a);
  const y = toRgb(b);
  return toHex(x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k);
}

/** Pixel outline and shadow ink: warm dark plum, the same as the scenery's lines. */
export const INK = "#2b1d2e";
export const dark = (c: string, k = 0.28) => mix(c, INK, k);
export const light = (c: string, k = 0.28) => mix(c, "#fff4dc", k);

/**
 * Tames a colour for the cozy autumn palette: very loud, saturated picks are pulled a little
 * toward warm, so a neon cyan outfit still reads as cyan but sits in the same world.
 */
export function cozy(c: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(c)) return c;
  const [r, g, b] = toRgb(c);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max ? (max - min) / max : 0;
  return sat > 0.75 ? mix(c, "#c99a6b", 0.16) : c;
}

// ---------- the look, reduced to what a 16 px sprite can show ----------

type HairTop = "cap" | "spiky" | "mohawk" | "bun" | "curly" | "buzz" | "none";
interface HairShape {
  top: HairTop;
  /** How far the side hair falls: 0 ears, 1 chin, 2 past the shoulders */
  length: 0 | 1 | 2;
  tails?: "pony" | "twin";
  /** Fringe over the forehead (row 6), 10 pixels across the head, h = hair */
  fringe: string;
}

const HAIR: Record<string, HairShape> = {
  spiky: { top: "spiky", length: 0, fringe: "hhh.hh.hhh" },
  wild: { top: "spiky", length: 0, fringe: "hh.hhh.h.h" },
  crest: { top: "spiky", length: 0, fringe: "hhhh..hhhh" },
  mohawk: { top: "mohawk", length: 0, fringe: "h........h" },
  long: { top: "cap", length: 2, fringe: "hhh....hhh" },
  straight: { top: "cap", length: 2, fringe: "hhhhhhhhhh" },
  wavy: { top: "curly", length: 2, fringe: "hh.h..h.hh" },
  bob: { top: "cap", length: 1, fringe: "hhhhh.hhhh" },
  hime: { top: "cap", length: 2, fringe: "hhhhhhhhhh" },
  fringe: { top: "cap", length: 1, fringe: "hhhhhhhhhh" },
  swoop: { top: "cap", length: 0, fringe: "hhhhhhh..h" },
  messy: { top: "spiky", length: 0, fringe: "h.hh.hh.hh" },
  pompadour: { top: "curly", length: 0, fringe: "h........h" },
  buzz: { top: "buzz", length: 0, fringe: ".........." },
  bun: { top: "bun", length: 0, fringe: "hh......hh" },
  ponytail: { top: "cap", length: 0, tails: "pony", fringe: "hhh.hh.hhh" },
  twintails: { top: "cap", length: 1, tails: "twin", fringe: "hhhh..hhhh" },
  curly: { top: "curly", length: 1, fringe: "h.hh.hh.hh" },
  bald: { top: "none", length: 0, fringe: ".........." },
};

interface Look {
  skin: string;
  hair: HairShape;
  hairC: string;
  eyes: string;
  eyewear: string;
  headwear: string;
  marks: string;
  earrings: boolean;
  top: string;
  outfit: string;
  accent: string;
  neck: string;
  neckC: string;
  back: string;
  backC: string;
  bottoms: string;
  bottomsC: string;
  shoes: string;
  gloves: string | null;
}

function readLook(l: HeroLook | undefined): Look {
  const v = { ...HERO_DEFAULTS, ...Object.fromEntries(Object.entries(l ?? {}).filter(([, x]) => x !== undefined && x !== "")) } as Required<HeroLook>;
  const outfit = cozy(v.outfit);
  return {
    skin: v.skin,
    hair: HAIR[v.hair] ?? HAIR.spiky,
    hairC: cozy(v.hairColor),
    eyes: v.eyes,
    eyewear: v.eyewear,
    headwear: v.headwear,
    marks: v.marks,
    earrings: v.earrings === "studs",
    top: v.top,
    outfit,
    accent: cozy(v.accent),
    neck: v.neck,
    neckC: cozy(v.scarf),
    back: v.back,
    backC: cozy(v.backColor),
    bottoms: v.bottoms,
    bottomsC: l?.bottomsColor ? cozy(l.bottomsColor) : dark(outfit, 0.45),
    shoes: v.shoes,
    gloves: v.gloves && v.gloves !== "none" ? v.gloves : null,
  };
}

// ---------- drawing ----------

export class Grid {
  px: Pixels;
  constructor(
    readonly w = CW,
    readonly h = CH,
  ) {
    this.px = Array.from({ length: h }, () => Array<string | null>(w).fill(null));
  }
  set(x: number, y: number, c: string | null) {
    if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.px[y][x] = c;
  }
  get(x: number, y: number) {
    return x >= 0 && x < this.w && y >= 0 && y < this.h ? this.px[y][x] : null;
  }
  rect(x: number, y: number, w: number, h: number, c: string) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }
  /** Draws a row pattern starting at x: "h" = colour, anything else is skipped. */
  row(x: number, y: number, pattern: string, c: string) {
    [...pattern].forEach((ch, i) => ch !== "." && ch !== " " && this.set(x + i, y, c));
  }
  /** Wraps every shape in a one-pixel outline, a darker shade of what it touches. */
  outline() {
    const out: [number, number, string][] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.px[y][x]) continue;
        const n = [this.get(x, y - 1), this.get(x - 1, y), this.get(x + 1, y), this.get(x, y + 1)].filter((c): c is string => Boolean(c) && c !== INK);
        if (n.length) out.push([x, y, mix(n[0], INK, 0.72)]);
      }
    for (const [x, y, c] of out) this.px[y][x] = c;
  }
}

const HEAD = { x: 3, y: 3, w: 10, h: 10 };

function head(g: Grid, L: Look, dy: number) {
  const { x, y, w, h } = HEAD;
  g.rect(x, y + dy, w, h, L.skin);
  // rounded corners
  for (const [cx, cy] of [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]]) g.set(cx, cy + dy, null);
  // soft shade under the chin and on the right cheek
  g.rect(x + 1, y + h - 1 + dy, w - 2, 1, dark(L.skin, 0.18));
  g.rect(x + w - 1, y + 2 + dy, 1, h - 4, dark(L.skin, 0.12));
}

function face(g: Grid, L: Look, dir: Dir, dy: number) {
  const eyeTop = INK;
  const eyeLow = mix(L.eyes, INK, 0.25);
  const eyes = dir === "down" ? [6, 9] : dir === "side" ? [10] : [];
  for (const ex of eyes) {
    g.set(ex, 8 + dy, eyeTop);
    g.set(ex, 9 + dy, eyeLow);
  }
  if (dir === "down") {
    if (L.marks === "blush") (g.set(5, 10 + dy, "#f19a8f"), g.set(10, 10 + dy, "#f19a8f"));
    if (L.marks === "freckles") (g.set(5, 10 + dy, dark(L.skin, 0.3)), g.set(10, 10 + dy, dark(L.skin, 0.3)));
    if (L.marks === "scar" || L.marks === "bandage") g.set(10, 10 + dy, L.marks === "bandage" ? "#f4efe6" : "#c75c5c");
    g.set(7, 11 + dy, dark(L.skin, 0.35));
    g.set(8, 11 + dy, dark(L.skin, 0.35));
    if (L.eyewear === "shades") g.rect(5, 8 + dy, 6, 1, INK), g.rect(5, 9 + dy, 2, 1, "#3d3a55"), g.rect(9, 9 + dy, 2, 1, "#3d3a55");
    else if (L.eyewear === "glasses" || L.eyewear === "round") [5, 7, 8, 10].forEach((ex) => g.set(ex, 8 + dy, INK));
    else if (L.eyewear === "eyepatch") g.rect(5, 8 + dy, 2, 2, INK), g.set(4, 7 + dy, INK);
    if (L.earrings) (g.set(3, 10 + dy, "#e8b33d"), g.set(12, 10 + dy, "#e8b33d"));
  }
  if (dir === "side") {
    if (L.marks === "blush") g.set(11, 10 + dy, "#f19a8f");
    g.set(11, 11 + dy, dark(L.skin, 0.35));
    if (L.eyewear === "shades") g.rect(9, 8 + dy, 3, 1, INK), g.set(10, 9 + dy, "#3d3a55");
    else if (L.eyewear === "glasses" || L.eyewear === "round") (g.set(9, 8 + dy, INK), g.set(11, 8 + dy, INK));
    else if (L.eyewear === "eyepatch") g.set(10, 8 + dy, INK), g.set(10, 9 + dy, INK);
  }
}

/** Hair that sits behind the body (long hair, a cape-side pony tail). */
function hairBack(g: Grid, L: Look, dir: Dir, dy: number) {
  const c = dark(L.hairC, 0.12);
  const H = L.hair;
  if (H.length === 2) {
    if (dir === "down") g.rect(2, 8 + dy, 12, 9, c);
    if (dir === "side") g.rect(2, 7 + dy, 5, 10, c);
  }
  if (H.tails === "pony" && dir === "down") g.rect(12, 4 + dy, 2, 6, c);
}

/** Hair on and around the head. */
function hairFront(g: Grid, L: Look, dir: Dir, dy: number) {
  const H = L.hair;
  const c = L.hairC;
  const hi = light(c, 0.3);
  const sh = dark(c, 0.22);
  if (H.top === "none") return;
  if (H.top === "buzz") {
    if (dir === "up") g.rect(3, 3 + dy, 10, 9, c);
    else g.rect(4, 3 + dy, 8, 2, c), dir === "side" && g.rect(3, 4 + dy, 4, 4, c);
    return;
  }
  // the cap over the top of the head
  g.rect(3, 2 + dy, 10, 4, c);
  g.set(3, 2 + dy, null);
  g.set(12, 2 + dy, null);
  g.rect(4, 2 + dy, 2, 1, hi);
  g.set(4, 3 + dy, hi);
  if (H.top === "spiky") g.row(3, 1 + dy, ".h.hh.h.h.", c), g.row(3, 0 + dy, "....h...h.", c);
  if (H.top === "mohawk") g.rect(7, 0 + dy, 2, 2, c), g.set(7, 0 + dy, hi);
  if (H.top === "bun") g.rect(6, 0 + dy, 4, 2, c), g.set(6, 0 + dy, null), g.set(9, 0 + dy, null), g.set(7, 0 + dy, hi);
  if (H.top === "curly") g.row(3, 1 + dy, ".hh.hh.hh.", c), g.rect(2, 4 + dy, 1, 5, c), g.rect(13, 4 + dy, 1, 5, c);

  const sideTo = H.length === 2 ? 12 : H.length === 1 ? 11 : 8;
  if (dir === "down") {
    g.row(3, 6 + dy, H.fringe, c);
    g.rect(3, 6 + dy, 1, sideTo - 5, c);
    g.rect(12, 6 + dy, 1, sideTo - 5, sh);
    if (H.length >= 1) g.rect(4, 7 + dy, 1, sideTo - 7, c), g.rect(11, 7 + dy, 1, sideTo - 7, sh);
  } else if (dir === "up") {
    g.rect(3, 6 + dy, 10, sideTo - 5, c);
    g.rect(4, 6 + dy, 8, Math.max(0, sideTo - 6), sh);
    g.rect(4, 6 + dy, 8, 1, c);
    if (H.length === 2) g.rect(4, 12 + dy, 8, 5, sh), g.rect(5, 17 + dy, 6, 1, sh), g.rect(4, 12 + dy, 8, 1, c);
  } else {
    // facing right: hair covers the back of the head, a little fringe in front
    g.rect(3, 6 + dy, 5, sideTo - 5, c);
    g.rect(3, 6 + dy, 1, sideTo - 5, sh);
    g.row(8, 6 + dy, H.fringe.slice(5), c);
    g.set(12, 6 + dy, c);
  }
  if (H.tails === "twin") {
    if (dir !== "side") g.rect(1, 5 + dy, 2, 8, c), g.rect(13, 5 + dy, 2, 8, sh), g.set(1, 12 + dy, null), g.set(14, 12 + dy, null);
    else g.rect(1, 5 + dy, 2, 8, c);
  }
  if (H.tails === "pony") {
    if (dir === "up") g.rect(7, 9 + dy, 2, 6, sh), g.set(7, 9 + dy, c);
    if (dir === "side") g.rect(1, 4 + dy, 2, 6, c), g.set(1, 9 + dy, null);
  }
}

function headwear(g: Grid, L: Look, dir: Dir, dy: number) {
  const a = L.accent;
  switch (L.headwear) {
    case "cap":
      g.rect(3, 2 + dy, 10, 3, a);
      g.rect(4, 2 + dy, 3, 1, light(a, 0.3));
      if (dir === "down") g.rect(3, 5 + dy, 10, 1, dark(a, 0.3));
      if (dir === "side") g.rect(9, 5 + dy, 5, 1, dark(a, 0.3));
      break;
    case "beanie":
      g.rect(3, 1 + dy, 10, 4, L.outfit);
      g.rect(3, 4 + dy, 10, 1, a);
      g.rect(7, 0 + dy, 2, 1, a);
      break;
    case "headband":
      g.rect(3, 5 + dy, 10, 1, a);
      if (dir === "up") g.rect(6, 6 + dy, 1, 3, a), g.rect(9, 6 + dy, 1, 3, a);
      break;
    case "catears":
      for (const x of dir === "side" ? [5] : [3, 10]) g.row(x, 0 + dy, "h.h", L.hairC), g.rect(x, 1 + dy, 3, 1, L.hairC), g.set(x + 1, 1 + dy, "#f4a3b4");
      break;
    case "horns":
      for (const x of dir === "side" ? [6] : [4, 11]) g.rect(x, 0 + dy, 1, 2, "#efe3c8");
      break;
    case "crown":
      g.row(5, 0 + dy, "h.hh.h", "#e8b33d");
      g.rect(5, 1 + dy, 6, 1, "#e8b33d");
      g.set(7, 1 + dy, "#d9443a");
      break;
    case "headphones":
    case "headset":
      g.rect(3, 2 + dy, 10, 1, "#3d3a55");
      if (dir !== "side") g.rect(2, 6 + dy, 1, 3, a), g.rect(13, 6 + dy, 1, 3, a);
      else g.rect(6, 6 + dy, 2, 3, a);
      if (L.headwear === "headset" && dir === "down") g.rect(4, 9 + dy, 1, 2, "#3d3a55");
      break;
    case "star":
      if (dir !== "up") g.set(11, 3 + dy, "#e8b33d"), g.set(11, 2 + dy, "#e8b33d"), g.set(10, 3 + dy, "#e8b33d"), g.set(12, 3 + dy, "#e8b33d");
      break;
  }
}

/** Arms swing and legs step: frame 0 and 2 are steps, 1 and 3 are standing. */
function body(g: Grid, L: Look, dir: Dir, frame: number) {
  const step = frame === 0 ? 1 : frame === 2 ? -1 : 0;
  const o = L.outfit;
  const oSh = dark(o, 0.2);
  const hand = L.gloves ?? L.skin;
  const pants = L.bottomsC;
  const shoe = L.shoes;
  const side = dir === "side";

  // legs and shoes
  if (side) {
    if (step) {
      g.rect(5, 19, 2, 3, dark(pants, 0.15));
      g.rect(9, 19, 2, 3, pants);
      g.rect(4, 22, 3, 1, shoe);
      g.rect(9, 22, 3, 1, shoe);
    } else {
      g.rect(6, 19, 4, 3, pants);
      g.set(8, 19, dark(pants, 0.15));
      g.rect(6, 22, 5, 1, shoe);
    }
  } else {
    const lUp = step > 0 ? 1 : 0;
    const rUp = step < 0 ? 1 : 0;
    g.rect(5, 19, 2, 3 - lUp, pants);
    g.rect(9, 19, 2, 3 - rUp, pants);
    g.rect(5, 22 - lUp, 2, 1, shoe);
    g.rect(9, 22 - rUp, 2, 1, shoe);
  }
  if (L.bottoms === "shorts") side ? g.rect(5, 20, 7, 2, L.skin) : (g.rect(5, 21, 2, 1, L.skin), g.rect(9, 21, 2, 1, L.skin));
  if (L.bottoms === "skirt") {
    side ? g.rect(4, 18, 7, 3, pants) : g.rect(4, 18, 8, 3, pants);
    side ? g.rect(4, 20, 7, 1, dark(pants, 0.2)) : g.rect(4, 20, 8, 1, dark(pants, 0.2));
  }
  if (L.bottoms === "cargo" && !side) g.set(5, 20, dark(pants, 0.25)), g.set(10, 20, dark(pants, 0.25));

  // torso
  if (side) {
    g.rect(5, 13, 6, 6, o);
    g.rect(5, 18, 6, 1, oSh);
  } else {
    g.rect(4, 13, 8, 6, o);
    g.rect(4, 18, 8, 1, oSh);
    g.set(4, 13, oSh);
    g.set(11, 13, oSh);
  }

  // what's on the chest
  const a = L.accent;
  if (dir === "down") {
    switch (L.top) {
      case "hero":
        g.rect(7, 14, 2, 2, a);
        g.rect(4, 17, 8, 1, a);
        break;
      case "hoodie":
        g.rect(5, 13, 6, 1, dark(o, 0.15));
        g.set(6, 14, a);
        g.set(9, 14, a);
        g.rect(6, 16, 4, 2, oSh);
        break;
      case "jacket":
        g.rect(7, 13, 2, 6, a);
        break;
      case "suit":
      case "uniform":
        g.rect(6, 13, 4, 2, "#f4efe6");
        g.rect(7, 14, 2, 3, a);
        g.set(7, 13, "#f4efe6");
        break;
      case "gi":
        g.rect(7, 13, 2, 2, L.skin);
        g.rect(4, 17, 8, 1, a);
        break;
      case "armor":
        g.rect(4, 13, 2, 2, a);
        g.rect(10, 13, 2, 2, a);
        g.rect(7, 15, 2, 1, light(o, 0.35));
        break;
      case "sailor":
        g.rect(5, 13, 6, 1, "#f4efe6");
        g.rect(7, 14, 2, 1, a);
        break;
      default:
        g.rect(6, 13, 4, 1, a);
    }
    if (L.neck === "scarf" || L.neck === "bandana") g.rect(4, 13, 8, 1, L.neckC), g.set(10, 14, L.neckC), g.set(10, 15, dark(L.neckC, 0.2));
    if (L.neck === "tie") g.rect(7, 13, 2, 4, L.neckC);
    if (L.neck === "bow") g.row(6, 13, "hhhh", L.neckC), g.set(7, 13, dark(L.neckC, 0.25)), g.set(8, 13, dark(L.neckC, 0.25));
    if (L.neck === "necklace") g.row(6, 14, "h..h", "#e8b33d"), g.set(7, 15, "#e8b33d");
  } else if (dir === "side") {
    if (L.top === "hero" || L.top === "gi") g.rect(5, 17, 6, 1, a);
    if (L.top === "jacket" || L.top === "suit" || L.top === "uniform") g.rect(9, 13, 2, 5, a);
    if (L.neck === "scarf" || L.neck === "bandana") g.rect(5, 13, 6, 1, L.neckC), g.rect(3, 13, 2, 2, L.neckC);
  } else {
    if (L.top === "hoodie") g.rect(5, 13, 6, 2, dark(o, 0.12));
    if (L.top === "hero" || L.top === "gi") g.rect(4, 17, 8, 1, a);
    if (L.neck === "scarf" || L.neck === "bandana") g.rect(4, 13, 8, 1, L.neckC), g.rect(9, 14, 2, 2, L.neckC);
  }

  // arms
  if (side) {
    const ay = 13 + (step > 0 ? 1 : step < 0 ? 0 : 0);
    const ax = step > 0 ? 8 : step < 0 ? 6 : 7;
    g.rect(ax, ay, 2, 4, oSh);
    g.rect(ax, ay + 4, 2, 1, hand);
  } else {
    const lA = step > 0 ? -1 : step < 0 ? 1 : 0;
    g.rect(3, 13, 1, 4 + lA, oSh);
    g.set(3, 17 + lA, hand);
    g.rect(12, 13, 1, 4 - lA, oSh);
    g.set(12, 17 - lA, hand);
  }
}

/** Things worn on the back: in front of the body seen from behind, behind it otherwise. */
function backItem(g: Grid, L: Look, dir: Dir, layer: "behind" | "over") {
  const c = L.backC;
  const over = dir === "up";
  if ((layer === "over") !== over) {
    // the parts that peek out from behind
    if (layer === "behind") {
      if (L.back === "cape") dir === "side" ? g.rect(2, 13, 4, 8, dark(c, 0.15)) : g.rect(2, 13, 12, 8, dark(c, 0.15));
      if (L.back === "wings") dir === "side" ? (g.rect(2, 11, 3, 3, "#f4efe6"), g.rect(3, 14, 2, 1, "#f4efe6")) : (g.row(0, 11, "hh", "#f4efe6"), g.rect(1, 12, 2, 3, "#f4efe6"), g.row(14, 11, "hh", "#f4efe6"), g.rect(13, 12, 2, 3, "#f4efe6"));
      if (L.back === "backpack" && dir === "side") g.rect(3, 14, 2, 4, c);
      if (L.back === "sword") dir === "side" ? g.rect(3, 12, 1, 9, "#8a6a4a") : g.rect(12, 10, 2, 2, "#8a6a4a");
    }
    return;
  }
  if (L.back === "cape") g.rect(3, 13, 10, 8, c), g.rect(3, 13, 10, 1, dark(c, 0.2));
  if (L.back === "backpack") g.rect(5, 14, 6, 5, c), g.rect(5, 16, 6, 1, dark(c, 0.25));
  if (L.back === "wings") g.row(1, 11, "hh", "#f4efe6"), g.rect(2, 12, 3, 3, "#f4efe6"), g.row(13, 11, "hh", "#f4efe6"), g.rect(11, 12, 3, 3, "#f4efe6");
  if (L.back === "sword") for (let i = 0; i < 8; i++) g.set(4 + i, 11 + i, i < 2 ? "#e8b33d" : "#8a6a4a");
  if (L.back === "backpack" && dir === "down") g.rect(5, 13, 1, 3, c), g.rect(10, 13, 1, 3, c);
}

/**
 * Shop items and achievement gear that change the sprite itself (the rest, like wings, weapons,
 * auras and pets, are drawn around it in lib/pixelGear.ts).
 */
export interface Worn {
  items?: string[];
  gear?: string[];
}

const WORN_HAT: Record<string, string> = { "cat-ears": "catears" };

function wear(L: Look, w: Worn | undefined): Look {
  if (!w) return L;
  const it = new Set(w.items ?? []);
  const gear = new Set(w.gear ?? []);
  const out = { ...L };
  if (gear.has("goal-crusher")) out.headwear = "crown";
  if (gear.has("ad-commander")) out.headwear = "headset";
  if (gear.has("closer")) out.gloves = "#e8b33d";
  for (const [id, hw] of Object.entries(WORN_HAT)) if (it.has(id)) out.headwear = hw;
  // A hat from the shop sits where a crown or headset would.
  if ([...it].some((i) => HAT_ITEMS.includes(i) && !WORN_HAT[i])) out.headwear = "none";
  if (it.has("shades")) out.eyewear = "shades";
  if (it.has("eyepatch")) out.eyewear = "eyepatch";
  if (it.has("scar")) out.marks = "scar";
  if (it.has("red-cape")) (out.back = "cape"), (out.backC = "#c0392b");
  if (it.has("jetpack") || it.has("demon-wings") || it.has("angel-wings")) out.back = "none";
  return out;
}

/** Hats drawn over the head in lib/pixelGear.ts. */
export const HAT_ITEMS = ["cat-ears", "devil-horns", "halo", "wizard-hat", "kabuto", "flame-crown"];

/** Gear drawn onto the body, facing you. */
function wornDetails(g: Grid, L: Look, w: Worn) {
  const it = new Set(w.items ?? []);
  const gear = new Set(w.gear ?? []);
  if (it.has("oni-mask")) g.rect(8, 10, 4, 2, "#c0392b"), g.set(9, 11, "#fbf1dc"), g.set(11, 11, "#fbf1dc"), g.set(11, 9, "#c0392b");
  if (gear.has("first-strike") && L.headwear !== "crown") g.rect(3, 5, 10, 1, "#c0392b"), g.set(13, 5, "#c0392b"), g.set(14, 6, "#93392a");
  if (gear.has("strategist")) [[8, 7], [9, 7], [10, 7], [10, 8], [11, 8], [12, 8]].forEach(([x, y]) => g.set(x, y, "#4fb0a0"));
  if (gear.has("giant-slayer")) [[3, 13], [4, 13], [3, 14], [11, 13], [12, 13], [12, 14]].forEach(([x, y]) => g.set(x, y, "#e8a33d"));
  if (gear.has("full-house")) g.rect(7, 15, 2, 1, "#86d0bd"), g.rect(7, 16, 2, 1, "#2f8f83");
  if (gear.has("quest-master")) g.rect(4, 18, 8, 1, "#6e4425"), g.rect(7, 18, 2, 1, "#f4c95d");
}

/** One frame of one direction. `worn` adds shop items and gear (facing you only). */
export function drawFrame(look: HeroLook | undefined, dir: Dir, frame: number, worn?: Worn): Pixels {
  const L = wear(readLook(look), dir === "down" ? worn : undefined);
  const g = new Grid();
  const dy = 0;
  backItem(g, L, dir, "behind");
  hairBack(g, L, dir, dy);
  body(g, L, dir, frame);
  if (L.back === "backpack" && dir === "down") g.rect(5, 13, 1, 3, L.backC), g.rect(10, 13, 1, 3, L.backC);
  backItem(g, L, dir, "over");
  head(g, L, dy);
  if (dir !== "up") face(g, L, dir, dy);
  hairFront(g, L, dir, dy);
  headwear(g, L, dir, dy);
  if (worn && dir === "down") wornDetails(g, L, worn);
  g.outline();
  // a one-pixel hop on each step
  if (frame === 0 || frame === 2) g.px = [...g.px.slice(1), Array<string | null>(CW).fill(null)];
  return g.px;
}

/** The whole sheet: rows are directions (down, up, side), columns are the 4 walk frames. */
export function drawSheet(look: HeroLook | undefined): Pixels[][] {
  return DIRS.map((d) => Array.from({ length: FRAMES }, (_, f) => drawFrame(look, d, f)));
}

// ---------- Kit, the town's fox guide ----------

const KIT_ROWS = [
  "................",
  "...o........o...",
  "..oao......oao..",
  "..oaao....oaao..",
  "..oaaoooooooao..",
  "..oaaaaaaaaaao..",
  ".oaaaaaaaaaaaao.",
  ".oaakaaaaaakaao.",
  ".oaakaaaaaakaao.",
  ".oawwwwnnwwwwao.",
  "..owwwwwwwwwwo..",
  "...oowwwwwwoo...",
  "....oaaaaaao....",
  "...oaawwwwaao...",
  "...oaawwwwaao...",
  "...oaawwwwaao...oo",
  "...oaaaaaaaao.oaao",
  "....oaaoaaaoooawwo",
  "....okkookko..oo..",
  "................",
  "................",
  "................",
  "................",
  "................",
];

/** Kit the fox as a pixel sprite (standing, facing you). */
export function drawKit(): Pixels {
  const pal: Record<string, string> = { o: INK, a: "#e8813a", w: "#fbefdc", k: "#3a2730", n: "#2b1d2e" };
  return KIT_ROWS.map((r) => Array.from({ length: CW }, (_, x) => pal[r[x]] ?? null));
}
