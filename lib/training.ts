// The Training Hall: a room in town with three practice monsters and a weapon rack.
// Spar as often as you like with any weapon from the rack. Practice fights use the real
// battle engine (lib/battle.ts) but never cost or pay anything.

import { T, type Rect } from "./city";
import { heroLoadout, type BossSpec, type Loadout } from "./battle";
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
    level: "Easy",
    about: "Barely hits back and never charges up. Try every skill and see what it does.",
    spec: { name: "Straw Dummy", tier: 1, stats: { hp: 220, atk: 7, def: 2, spd: 3, crit: 0 }, moves: ["slam", "harden"], names: { slam: "Wobble", harden: "Extra Stuffing" } },
  },
  {
    id: "slime",
    name: "Bog Slime",
    level: "Medium",
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
    level: "Hard",
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
