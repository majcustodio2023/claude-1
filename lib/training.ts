// The Training Hall: a room in town with three practice monsters and a weapon rack.
// Spar as often as you like with any weapon from the rack. Practice fights use the real
// battle engine (lib/battle.ts) but never cost or pay anything.

import { T, type Rect } from "./city";
import { BASE_STATS, autoPick, heroLoadout, playRound, startBattle, type BossSpec, type Loadout } from "./battle";
import type { TrackerData } from "./types";

export interface PracticeFoe {
  id: "dummy" | "slime" | "wolf";
  name: string;
  /** How it fights, in a line. */
  about: string;
  level: string;
  spec: BossSpec;
}

export const FOES: PracticeFoe[] = [
  {
    id: "dummy",
    name: "Straw Dummy",
    level: "Warm-up",
    about: "Never charges up, but it soaks up hits and keeps swinging. Good for learning your skills.",
    spec: { name: "Straw Dummy", tier: 1, stats: { hp: 220, atk: 7, def: 2, spd: 3, crit: 0 }, moves: ["slam", "harden"], names: { slam: "Wobble", harden: "Extra Stuffing" } },
  },
  {
    id: "slime",
    name: "Bog Slime",
    level: "Tough",
    about: "Poisons you and heals itself when it's hurt. Hit hard and finish it fast.",
    spec: {
      name: "Bog Slime",
      tier: 3,
      stats: { hp: 200, atk: 12, def: 4, spd: 8, crit: 5 },
      moves: ["slam", "charge", "drain", "heal"],
      names: { slam: "Splat", drain: "Sticky Goo", heal: "Re-form", charge: "Swelling up", unleash: "Belly Flop" },
    },
  },
  {
    id: "wolf",
    name: "Ember Wolf",
    level: "Toughest",
    about: "Fast clawing, a howl that weakens you, and a huge bite after it crouches. Guard when it crouches.",
    spec: {
      name: "Ember Wolf",
      tier: 5,
      stats: { hp: 250, atk: 17, def: 6, spd: 15, crit: 12 },
      moves: ["slam", "charge", "flurry", "creep"],
      names: { slam: "Bite", flurry: "Claw Frenzy", creep: "Howl", charge: "Crouching to pounce", unleash: "Ember Fang" },
    },
  },
];

export const foeById = (id: string) => FOES.find((f) => f.id === id);

// ---------- difficulty ----------
// Practice monsters are tuned to YOU every time you spar. Before the fight, the game plays a few
// hundred quick simulated fights with your exact loadout (stats, skills, passives, pets) against
// the monster, using a sensible player (lib/battle autoPick), and makes the monster just strong
// enough to hit the win rate of the difficulty you picked. New gear or levels never turn it into
// a pushover. You can still beat the odds by playing better than the simulated player.

export type PracticeLevel = "normal" | "hard" | "brutal" | "nightmare";
export const PRACTICE_LEVELS: { id: PracticeLevel; label: string; about: string }[] = [
  { id: "normal", label: "Normal", about: "A real fight. You'll usually win if you guard the big hits." },
  { id: "hard", label: "Hard", about: "Mistakes get punished. The Ember Wolf wins most fights." },
  { id: "brutal", label: "Brutal", about: "You need the right weapon and near-perfect timing." },
  { id: "nightmare", label: "Nightmare", about: "Almost unwinnable. Bragging rights only." },
];
export const DEFAULT_PRACTICE_LEVEL: PracticeLevel = "hard";

/** How often a sensible player should win, per monster and difficulty. */
export const TARGET_WIN: Record<PracticeFoe["id"], Record<PracticeLevel, number>> = {
  dummy: { normal: 0.95, hard: 0.8, brutal: 0.55, nightmare: 0.3 },
  slime: { normal: 0.8, hard: 0.55, brutal: 0.3, nightmare: 0.12 },
  wolf: { normal: 0.6, hard: 0.35, brutal: 0.15, nightmare: 0.05 },
};

export const practiceLevelOf = (v?: string): PracticeLevel => (PRACTICE_LEVELS.some((l) => l.id === v) ? (v as PracticeLevel) : DEFAULT_PRACTICE_LEVEL);

/** The monster matched to your stats, then made m times tougher (HP grows a little slower than its hits). */
export function foeAt(foe: PracticeFoe, you: Loadout, m: number, label?: string): BossSpec {
  const h = you.stats;
  const s = foe.spec.stats;
  return {
    ...foe.spec,
    name: label ? `${foe.spec.name} (${label})` : foe.spec.name,
    stats: {
      hp: Math.max(40, Math.round(s.hp * (h.atk / BASE_STATS.atk) * (1 + (m - 1) * 0.6))),
      atk: Math.max(1, Math.round(s.atk * (h.hp / BASE_STATS.hp) * ((40 + h.def) / (40 + BASE_STATS.def)) * m)),
      def: s.def,
      // Never much slower than you, so speed gear alone can't make it a punching bag.
      spd: Math.max(s.spd, Math.round(h.spd * 0.9)),
      crit: s.crit,
    },
  };
}

function seeded(seed: number) {
  let x = seed;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
}

/** Share of quick simulated fights a sensible player wins. Same seed every time, so it's stable. */
export function simWinRate(you: Loadout, spec: BossSpec, fights = 50): number {
  const rand = seeded(20261101);
  let wins = 0;
  for (let i = 0; i < fights; i++) {
    let b = startBattle(you, spec);
    while (!b.over && b.round < 60) b = playRound(b, autoPick(b), rand).battle;
    if (b.over === "win") wins++;
  }
  return wins / fights;
}

const cache = new Map<string, BossSpec>();

/** The monster as it fights you at this difficulty, tuned to your exact loadout. */
export function scaledFoe(foe: PracticeFoe, you: Loadout, level: PracticeLevel = DEFAULT_PRACTICE_LEVEL): BossSpec {
  const label = PRACTICE_LEVELS.find((l) => l.id === level)!.label;
  const key = JSON.stringify([foe.id, level, you.stats, you.skills, you.passives, you.pets.map((p) => p.name), you.kitGear]);
  const hit = cache.get(key);
  if (hit) return hit;
  const target = TARGET_WIN[foe.id][level];
  let lo = 0.2;
  let hi = 8;
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2;
    if (simWinRate(you, foeAt(foe, you, mid)) > target) lo = mid;
    else hi = mid;
  }
  const spec = foeAt(foe, you, (lo + hi) / 2, label);
  cache.set(key, spec);
  return spec;
}

/** Weapons on the rack. "" means your own gear. */
export const PRACTICE_WEAPONS = ["", "katana", "hammer", "staff", "laser", "scythe"];

/** Your loadout for a practice fight: what you're wearing, with the rack weapon in your hand. */
export function practiceLoadout(data: TrackerData, level: number, weapon: string): Loadout {
  const eq = { ...(data.game?.equipped ?? {}) } as Record<string, string | undefined>;
  if (weapon) eq.weapon = weapon;
  return heroLoadout(Object.values(eq).filter(Boolean) as string[], Object.keys(data.heroGear ?? {}).length, level);
}

/** The items to draw on the hero for a practice fight. */
export function practiceItems(data: TrackerData, weapon: string): string[] {
  const eq = { ...(data.game?.equipped ?? {}) } as Record<string, string | undefined>;
  if (weapon) eq.weapon = weapon;
  return Object.values(eq).filter(Boolean) as string[];
}

export interface TrainingLayout {
  w: number;
  h: number;
  wall: number;
  exit: Rect;
  solids: Rect[];
  spawn: { x: number; y: number };
  rack: Rect;
  /** Each sparring ring and where its monster stands. */
  rings: { id: PracticeFoe["id"]; ring: Rect; x: number; y: number }[];
}

export function layoutTraining(): TrainingLayout {
  const w = 20 * T;
  const wall = 2.6 * T;
  const h = wall + 10 * T;
  const solids: Rect[] = [
    { x: -50, y: -50, w: w + 100, h: wall + 50 },
    { x: -50, y: 0, w: 50 + T * 0.25, h },
    { x: w - T * 0.25, y: 0, w: 50, h },
    { x: -50, y: h - T * 0.3, w: w / 2 - T + 50, h: 50 },
    { x: w / 2 + T, y: h - T * 0.3, w: w / 2 + 50, h: 50 },
  ];
  // The weapon rack stands against the back wall on the left.
  const rack = { x: 1 * T, y: wall - 0.6 * T, w: 5 * T, h: 1.5 * T };
  solids.push({ x: rack.x, y: rack.y, w: rack.w, h: rack.h - 0.3 * T });
  const rings = FOES.map((f, i) => {
    const ring = { x: 1 * T + i * 6.2 * T, y: wall + 2.6 * T, w: 5.6 * T, h: 4.6 * T };
    const x = ring.x + ring.w / 2;
    const y = ring.y + ring.h / 2 + 0.3 * T;
    solids.push({ x: x - 0.7 * T, y: y - 0.5 * T, w: 1.4 * T, h: 0.7 * T });
    return { id: f.id, ring, x, y };
  });
  return { w, h, wall, exit: { x: w / 2 - T, y: h - 0.9 * T, w: 2 * T, h: 0.9 * T }, solids, spawn: { x: w / 2, y: h - 1.4 * T }, rack, rings };
}
