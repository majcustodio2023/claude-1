// Your home in Dawnterra: one room on a tile grid with furniture you can move, add and put away.
// Pure helpers (catalogue, room layout, placement rules) so they're unit-tested; the room is
// drawn by components/city/homeArt.tsx and decorated with components/city/Decorate.tsx.

import { T, type Rect } from "./city";
import type { CityBuilding, PlacedFurniture } from "./types";

export interface FurnitureKind {
  label: string;
  /** Size in tiles */
  w: number;
  h: number;
  /** Rugs: you walk over them, and furniture can stand on them. */
  walk?: boolean;
  /** Fireplaces, shelves, stoves: only against the back wall. */
  wall?: boolean;
}

export const FURNITURE: Record<string, FurnitureKind> = {
  bed: { label: "Bed", w: 2, h: 3 },
  desk: { label: "Desk", w: 2, h: 1 },
  chair: { label: "Chair", w: 1, h: 1 },
  fireplace: { label: "Fireplace", w: 2, h: 1, wall: true },
  chest: { label: "Chest", w: 1, h: 1 },
  rug: { label: "Rug", w: 3, h: 2, walk: true },
  roundRug: { label: "Round rug", w: 2, h: 2, walk: true },
  bookshelf: { label: "Bookshelf", w: 2, h: 1, wall: true },
  wardrobe: { label: "Wardrobe", w: 2, h: 1, wall: true },
  stove: { label: "Stove", w: 2, h: 1, wall: true },
  table: { label: "Table", w: 2, h: 2 },
  sofa: { label: "Sofa", w: 3, h: 1 },
  plant: { label: "Plant", w: 1, h: 1 },
  lamp: { label: "Floor lamp", w: 1, h: 1 },
};

/** The floor, in tiles. */
export const HOME_COLS = 14;
export const HOME_ROWS = 9;
const WALL = 2.6 * T;

/** Tiles in front of the door that must stay free so you can always get in and out. */
export const DOOR_ZONE = { x: HOME_COLS / 2 - 1, y: HOME_ROWS - 2, w: 2, h: 2 };

/** A new home's furniture. Ids start with "def-" so the house quest can tell your own additions apart. */
export const DEFAULT_FURNITURE: PlacedFurniture[] = [
  { id: "def-lamp", kind: "lamp", x: 0, y: 0 },
  { id: "def-bed", kind: "bed", x: 1, y: 0 },
  { id: "def-shelf", kind: "bookshelf", x: 4, y: 0 },
  { id: "def-fire", kind: "fireplace", x: 6, y: 0 },
  { id: "def-desk", kind: "desk", x: 10, y: 0 },
  { id: "def-chair", kind: "chair", x: 10, y: 1 },
  { id: "def-chest", kind: "chest", x: 12, y: 0 },
  { id: "def-plant", kind: "plant", x: 13, y: 0 },
  { id: "def-rug", kind: "rug", x: 5, y: 3 },
  { id: "def-plant2", kind: "plant", x: 0, y: 8 },
];

export const furnitureOf = (b: Pick<CityBuilding, "furniture">): PlacedFurniture[] => b.furniture ?? DEFAULT_FURNITURE;

/** Pieces you added yourself (not the ones the house came with). */
export const addedFurniture = (b: Pick<CityBuilding, "furniture">) => furnitureOf(b).filter((f) => !f.id.startsWith("def-")).length;

const tileRect = (f: Pick<PlacedFurniture, "kind" | "x" | "y">) => {
  const k = FURNITURE[f.kind];
  return { x: f.x, y: f.y, w: k?.w ?? 1, h: k?.h ?? 1 };
};
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Why a piece can't go there, or null when it can. `items` is everything else in the room. */
export function cantPlace(items: PlacedFurniture[], f: PlacedFurniture): string | null {
  const k = FURNITURE[f.kind];
  if (!k) return "That isn't furniture.";
  const r = tileRect(f);
  if (r.x < 0 || r.y < 0 || r.x + r.w > HOME_COLS || r.y + r.h > HOME_ROWS) return "That's outside the room.";
  if (k.wall && r.y !== 0) return `The ${k.label.toLowerCase()} has to stand against the back wall.`;
  if (!k.walk && overlap(r, DOOR_ZONE)) return "Keep the doorway clear.";
  for (const o of items) {
    if (o.id === f.id) continue;
    const ok = FURNITURE[o.kind];
    if (!ok) continue;
    // A rug can lie under furniture, but two rugs or two pieces can't share a spot.
    if (Boolean(ok.walk) === Boolean(k.walk) && overlap(r, tileRect(o))) return `It bumps into the ${ok.label.toLowerCase()}.`;
  }
  return null;
}

/** The first free spot for a new piece, scanning from the middle of the room outwards. */
export function freeSpot(items: PlacedFurniture[], kind: string): { x: number; y: number } | null {
  const spots: { x: number; y: number; d: number }[] = [];
  for (let y = 0; y < HOME_ROWS; y++) for (let x = 0; x < HOME_COLS; x++) spots.push({ x, y, d: Math.abs(x - HOME_COLS / 2) + Math.abs(y - HOME_ROWS / 2) });
  spots.sort((a, b) => a.d - b.d);
  return spots.find((p) => !cantPlace(items, { id: "_new", kind, ...p })) ?? null;
}

export interface HomeLayout {
  w: number;
  h: number;
  wall: number;
  exit: Rect;
  solids: Rect[];
  spawn: { x: number; y: number };
  /** Each piece and where it is in the room, in world units */
  items: (PlacedFurniture & { rect: Rect })[];
}

/** Tile to world units. */
export const homeRect = (f: Pick<PlacedFurniture, "kind" | "x" | "y">): Rect => {
  const r = tileRect(f);
  return { x: r.x * T, y: WALL + r.y * T, w: r.w * T, h: r.h * T };
};

export function layoutHome(items: PlacedFurniture[]): HomeLayout {
  const w = HOME_COLS * T;
  const h = WALL + HOME_ROWS * T;
  const solids: Rect[] = [
    { x: -50, y: -50, w: w + 100, h: WALL + 50 },
    { x: -50, y: 0, w: 50 + T * 0.25, h },
    { x: w - T * 0.25, y: 0, w: 50, h },
    { x: -50, y: h - T * 0.3, w: w / 2 - T + 50, h: 50 },
    { x: w / 2 + T, y: h - T * 0.3, w: w / 2 + 50, h: 50 },
  ];
  const placed = items.filter((f) => FURNITURE[f.kind]).map((f) => ({ ...f, rect: homeRect(f) }));
  // You can walk up to the top edge of tall pieces so they look stood in front of, not on.
  for (const f of placed) if (!FURNITURE[f.kind].walk) solids.push({ x: f.rect.x + 4, y: f.rect.y + (f.rect.h > T ? 0.35 * T : 0), w: f.rect.w - 8, h: f.rect.h - (f.rect.h > T ? 0.35 * T : 0) - 4 });
  return { w, h, wall: WALL, exit: { x: w / 2 - T, y: h - 0.9 * T, w: 2 * T, h: 0.9 * T }, solids, spawn: { x: w / 2, y: h - 1.4 * T }, items: placed };
}
