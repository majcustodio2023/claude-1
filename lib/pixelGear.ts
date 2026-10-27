// The hero's portrait in pixel art: the same 16 x 24 sprite that walks around Dawnterra, set on a
// bigger canvas so everything bought in the shop or earned from achievements fits around it:
// hats above the head, wings and jetpacks behind, a weapon in the right hand, a shield on the left
// arm, a pet at the feet and an aura glowing around the whole outline. Pure functions, like
// lib/pixelChar.ts: a look and a list of items go in, rows of colours come out.

import type { HeroLook } from "./types";
import { CH, CW, Grid, INK, cozy, drawFrame, type Pixels } from "./pixelChar";

/** Portrait canvas, in art pixels. The sprite sits at (OX, OY). */
export const PW = 30;
export const PH = 29;
const OX = 7;
const OY = 5;

/** Draws rows of a pattern: each character maps to a colour in `pal`, "." is see-through. */
function rows(g: Grid, x: number, y: number, art: string[], pal: Record<string, string>, mirror = false) {
  art.forEach((r, j) =>
    [...r].forEach((ch, i) => {
      const c = pal[ch];
      if (c) g.set(mirror ? PW - 1 - (x + i) : x + i, y + j, c);
    }),
  );
}

const GOLD = "#e8a33d";
const GOLD_HI = "#f4c95d";
const STEEL = "#c8bdae";
const STEEL_HI = "#fbf1dc";
const WOOD = "#6e4425";

function hat(g: Grid, items: Set<string>, hairC: string) {
  if (items.has("devil-horns")) {
    rows(g, 9, 4, ["h...", ".h..", ".hh."], { h: "#c0392b" });
    rows(g, 9, 4, ["h...", ".h..", ".hh."], { h: "#c0392b" }, true);
  }
  if (items.has("cat-ears")) {
    // drawn on the sprite itself (pixelChar's cat ears); a touch more ear here so it reads big
    rows(g, 10, 4, ["h..", "hh."], { h: hairC });
    rows(g, 10, 4, ["h..", "hh."], { h: hairC }, true);
  }
  if (items.has("wizard-hat"))
    rows(
      g,
      8,
      2,
      [".......hh.....", "......hhh.....", ".....hhhhh....", ".....hhshh....", "....hhhhhhh...", "...hhhhhhhhh..", ".bbbbbbbbbbbb.", "..bbbbbbbbbb.."],
      { h: "#5a4290", s: GOLD_HI, b: "#3a2a5a" },
    );
  if (items.has("kabuto")) {
    rows(g, 10, 4, ["g........g", ".g......g.", "..g.rr.g..", ".kkkkkkkk.", "kkkkkkkkkk", "kkkkkkkkkk", "gggggggggg"], { g: GOLD, r: "#c0392b", k: "#6b2a22" });
  }
  if (items.has("flame-crown")) {
    rows(g, 10, 2, ["....o..o..", "...oyo.oo.", "..oyyoyyo.", "g.gg.gg.g.", "gggggggggg"], { o: "#d9703b", y: GOLD_HI, g: GOLD });
  }
}

function behind(g: Grid, items: Set<string>, gear: Set<string>) {
  if (items.has("angel-wings")) {
    const art = ["......www", "....wwwww", "..wwwwwwww", ".wwwwwwwww", "wwwwwwwwsw", ".wwwwwwssw", "..wwswswsw", "....s.s.s."];
    rows(g, 0, 10, art, { w: "#fbf1dc", s: "#b4d0e6" });
    rows(g, 0, 10, art, { w: "#fbf1dc", s: "#b4d0e6" }, true);
  }
  if (items.has("demon-wings")) {
    const art = ["......dd", "....ddddd", "..ddmmmddd", ".dmmmmmddd", "dmmmmmmddd", "d.dm.mmddd", "...d..dddd", "......dddd"];
    rows(g, 0, 11, art, { d: "#5a2034", m: "#7a2f45" });
    rows(g, 0, 11, art, { d: "#5a2034", m: "#7a2f45" }, true);
  }
  if (items.has("red-cape"))
    rows(g, 8, 17, ["..cccccccccc..", "..cccccccccc..", ".cccccccccccc.", ".cccccccccccc.", "cccccccccccccc", "cccccccccccccc", "cccccccccccccc", "dcddcddcddcddd"], { c: "#c0392b", d: "#93392a" });
  if (items.has("jetpack")) {
    for (const x of [8, 20]) {
      rows(g, x, 17, ["ss", "ts", "ss", "ss", "ss", "ss", "ss", "ff", "yf", ".f"], { s: "#a3998f", t: STEEL_HI, f: "#d9703b", y: GOLD_HI });
    }
  }
  if (gear.has("first-blood")) {
    // the hero blade, slung across the back: the hilt shows over the right shoulder
    for (let i = 0; i < 13; i++) g.set(9 + i, 24 - i, i < 2 ? "#a3998f" : STEEL);
    rows(g, 20, 10, ["..ww", ".gw.", "gg..", ".g.."], { w: WOOD, g: GOLD });
  }
}

/** Held in the right hand, which sits at (19, 22) on the canvas. */
function weapon(g: Grid, items: Set<string>) {
  if (items.has("katana")) {
    g.set(18, 23, "#3b2416");
    rows(g, 19, 20, [".g", "g."], { g: GOLD });
    for (let i = 0; i < 8; i++) {
      g.set(21 + i, 19 - i, STEEL);
      if (i < 7) g.set(22 + i, 19 - i, STEEL_HI);
    }
  }
  if (items.has("laser")) rows(g, 18, 20, ["..ssssssc", ".ssttssss", "..kk.....", "..kk....."], { s: "#7d7574", t: "#a3998f", k: "#3d3a40", c: "#86d0bd" });
  if (items.has("staff")) {
    for (let y = 10; y < 28; y++) g.set(20, y, y % 4 ? WOOD : "#8a5a32");
    rows(g, 19, 6, [".c.", "cwc", "ccc", ".c."], { c: "#4fb0a0", w: "#c4ead9" });
  }
  if (items.has("hammer")) {
    for (let y = 13; y < 27; y++) g.set(24, y, WOOD);
    rows(g, 20, 22, ["wwww"], { w: WOOD });
    rows(g, 20, 8, ["sssssssss", "stsssssss", "skkkkkkks", "sssssssss", "sssssssss"], { s: "#7d7574", t: STEEL_HI, k: "#5a5458" });
  }
  if (items.has("scythe")) {
    for (let y = 4; y < 28; y++) g.set(21, y, "#3a2a5a");
    rows(g, 13, 2, ["..vvvvvvvv", "vvvlllllvv", "vll.......", "v........."], { v: "#5a4290", l: "#a996d6" });
  }
}

function front(g: Grid, gear: Set<string>) {
  if (gear.has("shields-up")) rows(g, 6, 17, ["bbbbb", "bbwbb", "bbwwb", "bbbwb", ".bbb.", "..b.."], { b: "#34507a", w: "#b4d0e6" });
}

function pet(g: Grid, items: Set<string>) {
  if (items.has("slime")) rows(g, 0, 23, ["..ggg..", ".glggg.", "gkgkggg", "ggggggg", ".ggggg."], { g: "#6aa645", l: "#b5d67a", k: INK });
  if (items.has("ghost")) rows(g, 0, 21, ["..www..", ".wwwww.", "wkwkwww", "wwwwwww", "wwwwwss", "w.w.w.s"], { w: "#fbf1dc", s: "#c8bdae", k: INK });
  if (items.has("mini-dragon"))
    rows(g, 0, 21, ["....r..", "...ggg.", "w..gkgg", "ww.ggg.", "wgggg..", ".gbbg..", ".g..g.."], { g: "#4f8a3a", b: "#b5d67a", w: "#93392a", r: "#c0392b", k: INK });
}

const AURAS: Record<string, { inner: string; outer?: string; sparks?: string; stars?: boolean }> = {
  "on-fire": { inner: "#f4c95d", outer: "#d9703b" },
  galaxy: { inner: "#5a4290", outer: "#2c2148", stars: true },
  shadow: { inner: "#5a4290", outer: "#3a2a5a" },
  sakura: { inner: "#f5cfc4", sparks: "#e8a0a0" },
  electric: { inner: "#c4ead9", sparks: "#4fb0a0" },
  unstoppable: { inner: "#b4d0e6", sparks: "#4f78a8" },
};

/** Paints a glow one (and two) pixels out from every filled pixel, only into empty space. */
function glow(g: Grid, colour: string, ring: number) {
  const fill: [number, number][] = [];
  for (let y = 0; y < PH; y++)
    for (let x = 0; x < PW; x++) {
      if (g.px[y][x]) continue;
      let near = false;
      for (let dy = -ring; dy <= ring && !near; dy++) for (let dx = -ring; dx <= ring && !near; dx++) if (Math.abs(dx) + Math.abs(dy) <= ring && g.get(x + dx, y + dy)) near = true;
      if (near) fill.push([x, y]);
    }
  for (const [x, y] of fill) g.set(x, y, colour);
}

const SPARKS = [[1, 6], [27, 4], [2, 15], [26, 13], [5, 2], [24, 23], [28, 18], [0, 24]];

function aura(g: Grid, items: Set<string>, gear: Set<string>) {
  const on = [...items, ...gear].map((id) => AURAS[id]).filter(Boolean);
  const a = on[0];
  if (!a) return;
  // see-through sparks first, then the glow wraps the outline
  if (a.sparks)
    SPARKS.forEach(([x, y], i) => {
      g.set(x, y, a.sparks!);
      if (i % 2) g.set(x + 1, y + 1, a.sparks!);
      else g.set(x, y + 1, a.sparks!);
    });
  if (a.outer) {
    const snap = g.px.map((r) => [...r]);
    glow(g, a.inner, 1);
    glow(g, a.outer, 1);
    // keep the outer ring a little broken, like flickering light
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (!snap[y][x] && g.px[y][x] === a.outer && (x + y) % 3 === 0) g.px[y][x] = null;
  } else glow(g, a.inner, 1);
  if (a.stars) SPARKS.forEach(([x, y]) => g.get(x, y) || g.set(x, y, "#fbe29a"));
}

/**
 * The hero, wearing everything: `items` are equipped shop items, `gear` the achievement gear to show.
 * Returns PW x PH rows of colours.
 */
export function drawPortrait(look: HeroLook | undefined, items: string[] = [], gear: string[] = []): Pixels {
  const it = new Set(items);
  const ge = new Set(gear);
  const hairC = look?.hairColor ?? "#2b2350";

  const back = new Grid(PW, PH);
  behind(back, it, ge);
  back.outline();

  const sprite = drawFrame(look, "down", 1, { items, gear });

  const over = new Grid(PW, PH);
  hat(over, it, cozy(hairC));
  weapon(over, it);
  front(over, ge);
  pet(over, it);
  over.outline();

  const out = new Grid(PW, PH);
  const paint = (px: Pixels, dx = 0, dy = 0) => px.forEach((r, y) => r.forEach((c, x) => c && out.set(x + dx, y + dy, c)));
  paint(back.px);
  paint(sprite, OX, OY);
  paint(over.px);
  // the halo glows, so it has no dark outline
  if (it.has("halo")) rows(out, 11, 2, ["..hhhh..", ".g....g.", "..hhhh.."], { h: GOLD_HI, g: GOLD });
  aura(out, it, ge);
  return out.px;
}

/** Where the plain sprite sits inside the portrait (for tests and layout). */
export const SPRITE_BOX = { x: OX, y: OY, w: CW, h: CH };
