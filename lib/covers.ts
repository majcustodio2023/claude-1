// Banner covers: the background behind the hero on the player card. A few are free,
// the rest are bought with coins. Drawn in components/covers.tsx (by id).

import type { Rarity } from "./items";
import { ensureGame } from "./loot";
import type { TrackerData } from "./types";

export interface Cover {
  id: string;
  name: string;
  /** 0 = free for everyone */
  price: number;
  rarity: Rarity;
}

export const COVERS: Cover[] = [
  { id: "classic", name: "Classic HUD", price: 0, rarity: "common" },
  { id: "speed", name: "Action burst", price: 0, rarity: "common" },
  { id: "dojo", name: "Sunset dojo", price: 0, rarity: "common" },
  { id: "manga", name: "Manga panel", price: 250, rarity: "common" },
  { id: "sakura", name: "Sakura storm", price: 300, rarity: "rare" },
  { id: "neon", name: "Neon Tokyo", price: 350, rarity: "rare" },
  { id: "ocean", name: "Great wave", price: 350, rarity: "rare" },
  { id: "thunder", name: "Thunder sky", price: 400, rarity: "rare" },
  { id: "synth", name: "Cyber grid", price: 500, rarity: "epic" },
  { id: "volcano", name: "Volcano lair", price: 550, rarity: "epic" },
  { id: "galaxy", name: "Galaxy", price: 700, rarity: "epic" },
  { id: "vault", name: "Gold vault", price: 900, rarity: "legendary" },
];

/** Your own uploaded picture. */
export const CUSTOM_COVER = "custom";

export const coverById = (id: string | undefined) => COVERS.find((c) => c.id === id);

export const ownsCover = (data: TrackerData, id: string) => {
  if (id === CUSTOM_COVER) return Boolean(data.game?.coverImage);
  const c = coverById(id);
  return Boolean(c && (c.price === 0 || data.game?.covers?.includes(id)));
};

/** The cover to draw: the chosen one if it's still yours, otherwise the classic look. */
export function activeCover(data: TrackerData): string {
  const id = data.game?.cover;
  return id && ownsCover(data, id) ? id : "classic";
}

/** Buys a cover and puts it on. Returns an error message, or null when it worked. */
export function buyCover(d: TrackerData, id: string, today: string): string | null {
  const cover = coverById(id);
  if (!cover) return "That cover doesn't exist.";
  const game = ensureGame(d, today);
  if (ownsCover(d, id)) {
    game.cover = id;
    return null;
  }
  if (game.coins < cover.price) return `You need ${cover.price - game.coins} more coins.`;
  game.coins -= cover.price;
  game.covers = [...(game.covers ?? []), id];
  game.cover = id;
  game.log = [{ at: today, text: `Bought the ${cover.name} cover`, coins: -cover.price }, ...game.log].slice(0, 40);
  return null;
}
