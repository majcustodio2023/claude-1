// The Wilds: the first biome past Dawnterra's north gate. A big green valley in three bands, from
// the sunny meadow by the gate (easy), through Mosswood and its river (medium), up to the Old
// Grove (hard) where the Grove King sleeps. Monsters wander their band, some chase you, and
// touching one starts a turn-based fight on the real battle engine (lib/battle.ts). Beaten
// monsters drop loot into your bag (lib/bag.ts). Pure data and layout here; drawing lives in
// components/wilds.

import { T, type Pt, type Rect } from "./city";
import type { BossSpec } from "./battle";
import { rng } from "./avatar";

export type ZoneId = "meadow" | "mosswood" | "grove";

export interface Zone {
  id: ZoneId;
  name: string;
  blurb: string;
  /** Which part of the map it covers. */
  rect: Rect;
  /** How hard, for the area banner. */
  danger: string;
}

export interface Drop {
  id: string;
  /** 0 to 1. */
  chance: number;
}

export interface Monster {
  id: string;
  name: string;
  /** Shown like a Pokemon level, for how tough it is. */
  lv: number;
  zone: ZoneId;
  about: string;
  spec: BossSpec;
  drops: Drop[];
  /** How many roam the map at once. */
  count: number;
  /** Walking speed in the field (the player walks at 190). */
  speed: number;
  /** Comes after you when you get close. */
  aggressive?: boolean;
  /** Seconds before a beaten one comes back. */
  respawn: number;
  /** Drawn bigger in the field. */
  big?: boolean;
}

const spec = (name: string, tier: number, stats: BossSpec["stats"], moves: BossSpec["moves"], names: BossSpec["names"]): BossSpec => ({ name, tier, stats, moves, names });

// Stats sit around the Training Hall's: the meadow is a bit easier than its Straw Dummy and Bog
// Slime, Mosswood is about its Bog Slime, and the Old Grove is past its Ember Wolf.
export const MONSTERS: Monster[] = [
  {
    id: "jelly",
    name: "Meadow Jelly",
    lv: 3,
    zone: "meadow",
    about: "A wobbly green jelly. Slow, soft, and it heals itself if you take too long.",
    spec: spec("Meadow Jelly", 1, { hp: 120, atk: 7, def: 2, spd: 6, crit: 3 }, ["slam", "heal"], { slam: "Wobble Bump", heal: "Re-jiggle" }),
    drops: [{ id: "jelly", chance: 0.85 }, { id: "red-herb", chance: 0.35 }, { id: "red-potion", chance: 0.08 }, { id: "leaf-cap", chance: 0.05 }, { id: "pet-sprout", chance: 0.025 }],
    count: 9,
    speed: 34,
    respawn: 25,
  },
  {
    id: "puff",
    name: "Puffball",
    lv: 4,
    zone: "meadow",
    about: "A dandelion puff with a temper. Quick little flurries, but it falls apart fast.",
    spec: spec("Puffball", 1, { hp: 105, atk: 8, def: 1, spd: 12, crit: 5 }, ["slam", "flurry"], { slam: "Puff Tackle", flurry: "Seed Spray" }),
    drops: [{ id: "fluff", chance: 0.85 }, { id: "red-herb", chance: 0.3 }, { id: "green-potion", chance: 0.1 }, { id: "moss-cloak", chance: 0.05 }],
    count: 8,
    speed: 55,
    respawn: 25,
  },
  {
    id: "bee",
    name: "Buzzbee",
    lv: 5,
    zone: "meadow",
    about: "Fast and stingy. Its sting poisons you, so pack a green potion.",
    spec: spec("Buzzbee", 2, { hp: 110, atk: 8, def: 2, spd: 14, crit: 8 }, ["slam", "drain"], { slam: "Dive", drain: "Poison Sting" }),
    drops: [{ id: "stinger", chance: 0.85 }, { id: "red-herb", chance: 0.25 }, { id: "honey-jar", chance: 0.03 }, { id: "pet-bee", chance: 0.035 }, { id: "blue-potion", chance: 0.06 }],
    count: 7,
    speed: 70,
    aggressive: true,
    respawn: 30,
  },
  {
    id: "shroom",
    name: "Shroomkin",
    lv: 8,
    zone: "mosswood",
    about: "Puffs spores that weaken you, and rests to heal. Hit it before it settles in.",
    spec: spec("Shroomkin", 3, { hp: 175, atk: 11, def: 4, spd: 7, crit: 4 }, ["slam", "charge", "creep", "heal"], { slam: "Cap Bonk", creep: "Spore Cloud", heal: "Root Rest", charge: "Puffing up", unleash: "Spore Burst" }),
    drops: [{ id: "spore", chance: 0.8 }, { id: "green-potion", chance: 0.25 }, { id: "red-potion", chance: 0.15 }, { id: "mushroom-helm", chance: 0.045 }],
    count: 8,
    speed: 30,
    respawn: 35,
  },
  {
    id: "bark",
    name: "Barkling",
    lv: 9,
    zone: "mosswood",
    about: "A sapling that learned to walk. Tough bark and a big branch swing after it winds up.",
    spec: spec("Barkling", 3, { hp: 205, atk: 12, def: 6, spd: 5, crit: 4 }, ["slam", "charge", "harden"], { slam: "Branch Swat", harden: "Thicken Bark", charge: "Winding up", unleash: "Timber!" }),
    drops: [{ id: "bark", chance: 0.8 }, { id: "red-potion", chance: 0.15 }, { id: "blue-potion", chance: 0.07 }, { id: "oak-club", chance: 0.06 }],
    count: 7,
    speed: 26,
    respawn: 35,
  },
  {
    id: "wolf",
    name: "Mosswolf",
    lv: 11,
    zone: "mosswood",
    about: "Hunts in the shade. Fast clawing, a howl that weakens you, and a big pounce. Guard when it crouches.",
    spec: spec("Mosswolf", 4, { hp: 195, atk: 14, def: 4, spd: 15, crit: 10 }, ["slam", "charge", "flurry", "creep"], { slam: "Bite", flurry: "Claw Frenzy", creep: "Howl", charge: "Crouching", unleash: "Pounce" }),
    drops: [{ id: "fang", chance: 0.6 }, { id: "red-potion", chance: 0.2 }, { id: "wolf-mask", chance: 0.045 }, { id: "fang-dagger", chance: 0.045 }],
    count: 6,
    speed: 80,
    aggressive: true,
    respawn: 40,
  },
  {
    id: "beetle",
    name: "Thornback Beetle",
    lv: 15,
    zone: "grove",
    about: "Armoured like a cart. Hardens its shell, then charges. Armour-breaking and magic skills shine here.",
    spec: spec("Thornback Beetle", 6, { hp: 300, atk: 18, def: 10, spd: 8, crit: 6 }, ["slam", "charge", "harden", "flurry"], { slam: "Horn Ram", harden: "Shell Up", flurry: "Thorn Volley", charge: "Digging in", unleash: "Stampede" }),
    drops: [{ id: "carapace", chance: 0.6 }, { id: "blue-potion", chance: 0.15 }, { id: "red-potion", chance: 0.25 }, { id: "thorn-spear", chance: 0.05 }, { id: "beetle-shell", chance: 0.03 }],
    count: 5,
    speed: 45,
    aggressive: true,
    respawn: 50,
  },
  {
    id: "treant",
    name: "Bramble Treant",
    lv: 17,
    zone: "grove",
    about: "An old tree with a grudge. Its roots drain you and it regrows its own wounds.",
    spec: spec("Bramble Treant", 7, { hp: 360, atk: 20, def: 8, spd: 6, crit: 6 }, ["slam", "charge", "drain", "heal"], { slam: "Root Lash", drain: "Thorn Grip", heal: "Regrow", charge: "Rooting down", unleash: "Earthsplitter" }),
    drops: [{ id: "bark", chance: 0.6 }, { id: "heartwood", chance: 0.3 }, { id: "red-potion", chance: 0.3 }, { id: "firefly", chance: 0.05 }, { id: "grove-blade", chance: 0.03 }],
    count: 4,
    speed: 22,
    respawn: 60,
    big: true,
  },
  {
    id: "king",
    name: "Grove King",
    lv: 22,
    zone: "grove",
    about: "The ancient stag who rules the Old Grove. Only one roams at a time. Bring your best gear and plenty of potions.",
    spec: spec("Grove King", 9, { hp: 520, atk: 24, def: 10, spd: 11, crit: 10 }, ["slam", "charge", "flurry", "heal", "creep"], { slam: "Antler Crash", flurry: "Hoof Storm", heal: "Spring Bloom", creep: "Ancient Bellow", charge: "Lowering its antlers", unleash: "Kingsfall" }),
    drops: [{ id: "crown-acorn", chance: 0.35 }, { id: "honey-jar", chance: 0.6 }, { id: "grove-blade", chance: 0.2 }, { id: "firefly", chance: 0.2 }, { id: "beetle-shell", chance: 0.15 }],
    count: 1,
    speed: 40,
    respawn: 600,
    big: true,
  },
];

/** What Wren hands you the first time you step out: a few potions to get going. */
export const STARTER_PACK = ["red-potion", "red-potion", "red-potion", "red-herb", "red-herb", "red-herb", "green-potion"];
export const STARTER_KEY = "wilds:starter";

export const monsterById = (id: string) => MONSTERS.find((m) => m.id === id);

/** What a beaten monster drops: each entry rolls on its own. */
export function rollDrops(m: Monster, rand: () => number = Math.random): string[] {
  return m.drops.filter((d) => rand() < d.chance).map((d) => d.id);
}

// ---------- the map ----------

export const WILDS_W = 100;
export const WILDS_H = 84;

export type TreeKind = "oak" | "pine" | "birch" | "bush" | "ancient" | "willow";
export interface WildTree {
  x: number;
  y: number;
  kind: TreeKind;
  s: number;
}

export interface WildsLayout {
  w: number;
  h: number;
  zones: Zone[];
  trees: WildTree[];
  /** Low decoration painted on the ground. */
  flowers: (Pt & { c: number })[];
  grass: Rect[];
  rocks: (Pt & { s: number })[];
  mushrooms: Pt[];
  stones: (Pt & { s: number })[];
  water: Rect[];
  bridges: Rect[];
  pond: { x: number; y: number; rx: number; ry: number };
  /** The dirt path from the gate to the Grove King's clearing, and a side trail. */
  path: Pt[];
  trail: Pt[];
  camp: { fire: Pt; tent: Rect; merchant: Pt; sign: Pt };
  /** Walk in here to go back to Dawnterra. */
  exit: Rect;
  spawn: Pt;
  altar: Rect;
  solids: Rect[];
  /** Where monsters are allowed to walk (open ground in their zone). */
  open: (zone: ZoneId) => Pt;
}

/** Distance from a point to a polyline. */
function distToPath(p: Pt, path: Pt[]): number {
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
  }
  return best;
}

const inside = (p: Pt, r: Rect, pad = 0) => p.x > r.x - pad && p.x < r.x + r.w + pad && p.y > r.y - pad && p.y < r.y + r.h + pad;

let cached: WildsLayout | null = null;

/** The whole biome. Always the same (seeded), so trees don't move between visits. */
export function layoutWilds(): WildsLayout {
  if (cached) return cached;
  const rand = rng(20261101);
  const w = WILDS_W * T;
  const h = WILDS_H * T;
  const zones: Zone[] = [
    { id: "grove", name: "The Old Grove", blurb: "Ancient trees. Something big walks here.", rect: { x: 0, y: 0, w, h: 26 * T }, danger: "Dangerous" },
    { id: "mosswood", name: "Mosswood", blurb: "Shady woods along the Glimmer River.", rect: { x: 0, y: 26 * T, w, h: 28 * T }, danger: "Tricky" },
    { id: "meadow", name: "Sunny Meadow", blurb: "Soft grass and easy monsters. A good place to start.", rect: { x: 0, y: 54 * T, w, h: h - 54 * T }, danger: "Easy" },
  ];
  const cx = w / 2;
  const path: Pt[] = [
    { x: cx, y: h },
    { x: cx, y: h - 6 * T },
    { x: cx - 8 * T, y: h - 14 * T },
    { x: cx - 4 * T, y: h - 24 * T },
    { x: cx + 10 * T, y: 62 * T },
    { x: cx + 12 * T, y: 54 * T },
    { x: cx + 6 * T, y: 46 * T },
    { x: cx - 14 * T, y: 40 * T },
    { x: cx - 18 * T, y: 32 * T },
    { x: cx - 6 * T, y: 24 * T },
    { x: cx + 8 * T, y: 16 * T },
    { x: cx, y: 8 * T },
  ];
  // A side trail east through Mosswood and back to the grove.
  const trail: Pt[] = [
    { x: cx + 6 * T, y: 46 * T },
    { x: cx + 26 * T, y: 40 * T },
    { x: cx + 34 * T, y: 30 * T },
    { x: cx + 22 * T, y: 20 * T },
    { x: cx + 8 * T, y: 16 * T },
  ];
  const camp = {
    fire: { x: cx + 4 * T, y: h - 6.5 * T },
    tent: { x: cx + 6.5 * T, y: h - 9.5 * T, w: 3.4 * T, h: 2.4 * T },
    merchant: { x: cx - 5 * T, y: h - 4.2 * T },
    sign: { x: cx + 2.2 * T, y: h - 3.4 * T },
  };
  const exit = { x: cx - 1.6 * T, y: h - 1.2 * T, w: 3.2 * T, h: 1.2 * T };
  const spawn = { x: cx, y: h - 2.6 * T };
  const altar = { x: cx - 3 * T, y: 4.5 * T, w: 6 * T, h: 3.5 * T };
  // The Glimmer River runs across Mosswood, with two bridges.
  const riverY = 50 * T;
  const bridges: Rect[] = [];
  const water: Rect[] = [];
  const bridgeXs = [cx + 9 * T, cx - 30 * T];
  const segs: number[] = [];
  for (let i = 0; i <= WILDS_W; i++) segs.push(Math.round(Math.sin(i / 7) * 1.4 * T));
  for (let i = 0; i < WILDS_W; i++) {
    const rx = i * T;
    const ry = riverY + segs[i];
    const onBridge = bridgeXs.find((bx) => rx + T > bx - 1.6 * T && rx < bx + 1.6 * T);
    water.push({ x: rx, y: ry, w: T + 1, h: 2.6 * T });
    if (onBridge != null && !bridges.some((b) => Math.abs(b.x + b.w / 2 - onBridge) < 1)) bridges.push({ x: onBridge - 1.6 * T, y: riverY - 1.6 * T, w: 3.2 * T, h: 5.8 * T });
  }
  const pond = { x: cx - 26 * T, y: h - 14 * T, rx: 6 * T, ry: 3.6 * T };

  const solids: Rect[] = [];
  // Water you can't wade, except where a bridge crosses.
  for (const r of water) {
    const covered = bridges.find((b) => r.x + r.w > b.x + 6 && r.x < b.x + b.w - 6);
    if (covered) {
      if (r.x < covered.x) solids.push({ ...r, w: covered.x - r.x + 6 });
      if (r.x + r.w > covered.x + covered.w) solids.push({ ...r, x: covered.x + covered.w - 6, w: r.x + r.w - covered.x - covered.w + 6 });
    } else solids.push({ x: r.x, y: r.y + 10, w: r.w, h: r.h - 20 });
  }
  // the pond
  for (let k = -3; k <= 3; k++) {
    const yy = pond.y + (k / 3.6) * pond.ry;
    const half = pond.rx * Math.sqrt(Math.max(0, 1 - (k / 3.6) ** 2)) * 0.92;
    solids.push({ x: pond.x - half, y: yy - T / 2, w: half * 2, h: T });
  }
  // camp
  solids.push({ x: camp.tent.x, y: camp.tent.y, w: camp.tent.w, h: camp.tent.h - 0.4 * T });
  solids.push({ x: camp.merchant.x - 54, y: camp.merchant.y - 22, w: 108, h: 34 });
  solids.push({ x: camp.sign.x - 6, y: camp.sign.y - 10, w: 12, h: 12 });
  solids.push({ x: camp.fire.x - 0.5 * T, y: camp.fire.y - 0.35 * T, w: T, h: 0.6 * T });
  solids.push({ x: altar.x + 0.6 * T, y: altar.y + 0.4 * T, w: altar.w - 1.2 * T, h: altar.h - 1.4 * T });

  const keepClear = (p: Pt, pad: number) =>
    distToPath(p, path) < 1.8 * T + pad ||
    distToPath(p, trail) < 1.4 * T + pad ||
    inside(p, { x: cx - 9 * T, y: h - 12 * T, w: 18 * T, h: 12 * T }, pad) ||
    inside(p, altar, 4 * T + pad) ||
    water.some((r) => inside(p, r, 0.6 * T + pad)) ||
    Math.hypot((p.x - pond.x) / (pond.rx + T + pad), (p.y - pond.y) / (pond.ry + T + pad)) < 1;

  const trees: WildTree[] = [];
  const addTree = (t: WildTree) => {
    trees.push(t);
    const tw = (t.kind === "ancient" ? 30 : t.kind === "bush" ? 26 : 20) * t.s;
    solids.push({ x: t.x - tw / 2, y: t.y - 14 * t.s, w: tw, h: 16 * t.s });
  };
  // Thick forest walls around the edge, with the gate gap at the bottom.
  for (let xx = T * 0.5; xx < w; xx += T * 1.25) {
    addTree({ x: xx + rand() * 10, y: T * 1.2, kind: rand() < 0.5 ? "pine" : "oak", s: 1.1 + rand() * 0.3 });
    addTree({ x: xx + T * 0.6, y: T * 2.6, kind: "pine", s: 1 + rand() * 0.3 });
    if (Math.abs(xx - cx) > 2.6 * T) addTree({ x: xx, y: h - T * 0.2, kind: rand() < 0.5 ? "oak" : "bush", s: 1 + rand() * 0.3 });
  }
  for (let yy = T * 3.5; yy < h - T; yy += T * 1.25) {
    addTree({ x: T * 0.6, y: yy, kind: "pine", s: 1.1 + rand() * 0.3 });
    addTree({ x: T * 1.9, y: yy + T * 0.6, kind: rand() < 0.5 ? "oak" : "pine", s: 1 + rand() * 0.2 });
    addTree({ x: w - T * 0.6, y: yy + T * 0.3, kind: "pine", s: 1.1 + rand() * 0.3 });
    addTree({ x: w - T * 1.9, y: yy + T * 0.9, kind: rand() < 0.5 ? "oak" : "pine", s: 1 + rand() * 0.2 });
  }
  // Inside: denser and older the further north you go.
  const density: Record<ZoneId, { n: number; kinds: TreeKind[] }> = {
    meadow: { n: 150, kinds: ["oak", "oak", "birch", "bush", "bush", "willow"] },
    mosswood: { n: 330, kinds: ["oak", "pine", "pine", "birch", "bush", "willow"] },
    grove: { n: 300, kinds: ["ancient", "ancient", "pine", "oak", "bush"] },
  };
  for (const z of zones) {
    const { n, kinds } = density[z.id];
    let placed = 0;
    for (let tries = 0; placed < n && tries < n * 12; tries++) {
      const p = { x: 3 * T + rand() * (w - 6 * T), y: Math.max(3.6 * T, z.rect.y + rand() * z.rect.h) };
      if (p.y > h - 1.5 * T) continue;
      if (keepClear(p, 0)) continue;
      const kind = kinds[Math.floor(rand() * kinds.length)];
      const s = (kind === "ancient" ? 1.25 : 0.9) + rand() * 0.35;
      const gap = (kind === "ancient" ? 1.9 : 1.15) * T * s;
      if (trees.some((t) => Math.abs(t.x - p.x) < gap && Math.abs(t.y - p.y) < gap * 0.8)) continue;
      addTree({ ...p, kind, s });
      placed++;
    }
  }

  // Ground details
  const flowers: WildsLayout["flowers"] = [];
  const grass: Rect[] = [];
  const rocks: WildsLayout["rocks"] = [];
  const mushrooms: Pt[] = [];
  const stones: WildsLayout["stones"] = [];
  const free = (p: Pt) => !keepClear(p, -T) && !trees.some((t) => Math.abs(t.x - p.x) < 0.9 * T && Math.abs(t.y - p.y) < 0.7 * T);
  for (let i = 0; i < 900; i++) {
    const p = { x: 2.5 * T + rand() * (w - 5 * T), y: 3.5 * T + rand() * (h - 5 * T) };
    if (!free(p)) continue;
    const meadow = p.y > 54 * T;
    flowers.push({ ...p, c: Math.floor(rand() * (meadow ? 5 : 3)) });
  }
  for (let i = 0; i < 70; i++) {
    const p = { x: 3 * T + rand() * (w - 8 * T), y: 4 * T + rand() * (h - 9 * T) };
    if (!free(p)) continue;
    grass.push({ x: p.x, y: p.y, w: (2 + Math.floor(rand() * 4)) * T, h: (1.5 + Math.floor(rand() * 3)) * T });
  }
  for (let i = 0; i < 110; i++) {
    const p = { x: 3 * T + rand() * (w - 6 * T), y: 4 * T + rand() * (h - 6 * T) };
    if (!free(p)) continue;
    const s = 0.7 + rand() * 0.8;
    rocks.push({ ...p, s });
    if (s > 1.1) solids.push({ x: p.x - 16 * s, y: p.y - 10 * s, w: 32 * s, h: 14 * s });
  }
  for (let i = 0; i < 160; i++) {
    const p = { x: 3 * T + rand() * (w - 6 * T), y: 4 * T + rand() * 50 * T };
    if (free(p)) mushrooms.push(p);
  }
  // Standing stones in a ring around the Grove King's altar.
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const p = { x: altar.x + altar.w / 2 + Math.cos(a) * 6 * T, y: altar.y + altar.h / 2 + Math.sin(a) * 3.6 * T };
    stones.push({ ...p, s: 1 + (k % 2) * 0.25 });
    solids.push({ x: p.x - 14, y: p.y - 10, w: 28, h: 14 });
  }

  // World edges
  solids.push({ x: -50, y: -50, w: w + 100, h: 50 + T * 0.3 }, { x: -50, y: h, w: w + 100, h: 50 }, { x: -50, y: 0, w: 50 + T * 0.3, h }, { x: w - T * 0.3, y: 0, w: 50, h });

  const hitsAny = (r: Rect) => solids.some((s) => r.x < s.x + s.w && r.x + r.w > s.x && r.y < s.y + s.h && r.y + r.h > s.y);
  const open = (zone: ZoneId) => {
    const z = zones.find((x) => x.id === zone)!.rect;
    for (let i = 0; i < 60; i++) {
      const p = { x: 4 * T + Math.random() * (w - 8 * T), y: Math.max(4.5 * T, z.y + T + Math.random() * (z.h - 2 * T)) };
      if (zone === "meadow" && p.y > h - 13 * T && Math.abs(p.x - cx) < 10 * T) continue; // never right on the camp
      if (!hitsAny({ x: p.x - 16, y: p.y - 10, w: 32, h: 14 })) return p;
    }
    return { x: cx, y: z.y + z.h / 2 };
  };
  cached = { w, h, zones, trees, flowers, grass, rocks, mushrooms, stones, water, bridges, pond, path, trail, camp, exit, spawn, altar, solids, open };
  return cached;
}

export const zoneAt = (L: WildsLayout, p: Pt): Zone => L.zones.find((z) => inside(p, z.rect)) ?? L.zones[L.zones.length - 1];
