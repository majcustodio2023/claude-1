// The bag, like an RPG inventory: potions you can drink, materials monsters drop, and spare
// copies of gear. Gear itself lives in game.owned (one kept copy each) and game.equipped (what
// you wear, one per slot); everything stackable is counted in game.bag. Pure functions over the
// tracker data, so the UI, the Wilds and the tests share the same rules.

import { ITEMS, RARITY, itemById, type Item, type Rarity } from "./items";
import type { ItemUse } from "./battle";
import { ensureGame } from "./loot";
import type { GameState, ItemSlot, TrackerData } from "./types";

export type BagKind = "potion" | "material";

export interface BagItem {
  id: string;
  name: string;
  kind: BagKind;
  rarity: Rarity;
  /** Coins the merchant pays for one. */
  sell: number;
  about: string;
  /** What drinking it does (potions only). */
  use?: ItemUse;
}

export const BAG_ITEMS: BagItem[] = [
  { id: "red-herb", name: "Red herb", kind: "potion", rarity: "common", sell: 2, about: "Chew it. Bitter, but it closes cuts. Heals 25% of your HP.", use: { name: "Red herb", heal: 0.25 } },
  { id: "red-potion", name: "Red potion", kind: "potion", rarity: "common", sell: 5, about: "The classic. Heals 45% of your HP.", use: { name: "Red potion", heal: 0.45 } },
  { id: "blue-potion", name: "Blue potion", kind: "potion", rarity: "rare", sell: 8, about: "Fizzy and cold. Gives 50 energy for skills.", use: { name: "Blue potion", energy: 50 } },
  { id: "green-potion", name: "Green potion", kind: "potion", rarity: "common", sell: 4, about: "Cures poison and weakness, and heals 10%.", use: { name: "Green potion", heal: 0.1, cure: true } },
  { id: "honey-jar", name: "Golden honey", kind: "potion", rarity: "epic", sell: 20, about: "Royal bee honey. Heals all your HP and gives 30 energy.", use: { name: "Golden honey", heal: 1, energy: 30 } },
  { id: "jelly", name: "Sticky jelly", kind: "material", rarity: "common", sell: 1, about: "What's left of a slime. Wobbles when you're not looking." },
  { id: "fluff", name: "Puff fluff", kind: "material", rarity: "common", sell: 1, about: "Soft as a cloud. Sneeze-inducing." },
  { id: "stinger", name: "Bee stinger", kind: "material", rarity: "common", sell: 2, about: "Careful, it's still sharp." },
  { id: "spore", name: "Glow spore", kind: "material", rarity: "common", sell: 2, about: "Gives off a soft green light in the dark." },
  { id: "bark", name: "Mossy bark", kind: "material", rarity: "common", sell: 2, about: "Damp, green and weirdly heavy." },
  { id: "fang", name: "Wolf fang", kind: "material", rarity: "rare", sell: 4, about: "Long as your finger. Still warm." },
  { id: "carapace", name: "Beetle plate", kind: "material", rarity: "rare", sell: 5, about: "A shard of thornback shell, hard as iron." },
  { id: "heartwood", name: "Heartwood", kind: "material", rarity: "epic", sell: 12, about: "The living core of an old treant. It pulses." },
  { id: "crown-acorn", name: "Golden acorn", kind: "material", rarity: "legendary", sell: 40, about: "Only the Grove King grows these. Collectors would kill for one." },
];

export const bagItemById = (id: string) => BAG_ITEMS.find((b) => b.id === id);

/** Anything that can sit in the bag or the gear list: a name, a rarity and a sell price. */
export interface AnyItem {
  id: string;
  name: string;
  rarity: Rarity;
  kind: BagKind | "gear";
  sell: number;
  about: string;
  slot?: ItemSlot;
}

/** Spare gear sells for a bit, by rarity. */
const GEAR_SELL: Record<Rarity, number> = { common: 6, rare: 15, epic: 35, legendary: 80 };

export function anyItem(id: string): AnyItem | undefined {
  const b = bagItemById(id);
  if (b) return b;
  const g = itemById(id);
  return g ? { id: g.id, name: g.name, rarity: g.rarity, kind: "gear", sell: GEAR_SELL[g.rarity], about: g.about ?? "", slot: g.slot } : undefined;
}

/** Rarity colours in the Dawnterra palette: a frame colour, and a darker one for text on parchment. */
const RARITY_FRAME: Record<Rarity, string> = { common: "#a3998f", rare: "#4fb0a0", epic: "#7f67b8", legendary: "#e8a33d" };
const RARITY_INK: Record<Rarity, string> = { common: "#5a5458", rare: "#2a6a6e", epic: "#5a4290", legendary: "#9a6a1c" };
export const rarityColor = (r: Rarity) => RARITY_FRAME[r];
export const rarityInk = (r: Rarity) => RARITY_INK[r];
export const rarityLabel = (r: Rarity) => RARITY[r].label;

/** The merchant at the camp buys at most this many coins of loot a day, so the Wilds don't replace real work as the way to earn. */
export const DAILY_SELL_CAP = 150;

export const bagCount = (g: GameState | undefined, id: string) => g?.bag?.[id] ?? 0;

/**
 * Puts loot in the bag. Gear you don't own yet becomes yours (and is worn straight away when
 * that slot is empty); a second copy of gear goes in the bag as a spare.
 */
export function addLoot(d: TrackerData, ids: string[], today: string): { id: string; isNew: boolean }[] {
  const game = ensureGame(d, today);
  const out: { id: string; isNew: boolean }[] = [];
  for (const id of ids) {
    const gear = itemById(id);
    if (gear && !game.owned.includes(id)) {
      game.owned.push(id);
      game.equipped[gear.slot] ??= id;
      out.push({ id, isNew: true });
      continue;
    }
    if (!gear && !bagItemById(id)) continue;
    game.bag = { ...(game.bag ?? {}), [id]: bagCount(game, id) + 1 };
    out.push({ id, isNew: false });
  }
  return out;
}

/** Takes one of something out of the bag. Returns false when there isn't one. */
export function takeOne(d: TrackerData, id: string): boolean {
  const g = d.game;
  const n = bagCount(g, id);
  if (!g || n <= 0) return false;
  const bag = { ...(g.bag ?? {}) };
  if (n === 1) delete bag[id];
  else bag[id] = n - 1;
  g.bag = bag;
  return true;
}

/** Wears an item you own (swapping out whatever was in that slot), or takes it off. */
export function equipItem(d: TrackerData, id: string, today: string): string | null {
  const game = ensureGame(d, today);
  const item = itemById(id);
  if (!item) return "You can't wear that.";
  if (!game.owned.includes(id)) return "You don't have that yet.";
  game.equipped[item.slot] = id;
  return null;
}

export function unequipSlot(d: TrackerData, slot: ItemSlot, today: string) {
  const game = ensureGame(d, today);
  delete game.equipped[slot];
}

/** How much the merchant will still buy today. */
export function sellRoom(g: GameState | undefined, today: string): number {
  const used = g?.soldToday?.day === today ? g.soldToday.coins : 0;
  return Math.max(0, DAILY_SELL_CAP - used);
}

/** Sells some of a stack (or spare gear). Returns the coins made, or an error. */
export function sellItem(d: TrackerData, id: string, count: number, today: string): { coins: number } | { error: string } {
  const game = ensureGame(d, today);
  const it = anyItem(id);
  if (!it) return { error: "The merchant doesn't want that." };
  const have = bagCount(game, id);
  if (have <= 0) return { error: it.kind === "gear" ? "You'd be selling the one you own. Only spare copies can be sold." : "You don't have any." };
  const room = sellRoom(game, today);
  if (room < it.sell) return { error: `The merchant has spent all ${DAILY_SELL_CAP} coins for today. Come back tomorrow.` };
  const n = Math.max(1, Math.min(count, have, Math.floor(room / it.sell)));
  for (let i = 0; i < n; i++) takeOne(d, id);
  const coins = n * it.sell;
  game.coins += coins;
  game.soldToday = { day: today, coins: (game.soldToday?.day === today ? game.soldToday.coins : 0) + coins };
  game.log = [{ at: today, text: `Sold ${n} ${it.name}`, coins }, ...game.log].slice(0, 40);
  return { coins };
}

/** Everything in the bag tab by tab, the way the inventory shows it. */
export function bagTabs(g: GameState | undefined): { items: string[]; equip: string[]; etc: string[] } {
  const bag = g?.bag ?? {};
  const has = (id: string) => (bag[id] ?? 0) > 0;
  return {
    items: BAG_ITEMS.filter((b) => b.kind === "potion" && has(b.id)).map((b) => b.id),
    // Gear you own, plus spare copies (shown again with their count).
    equip: ITEMS.filter((i: Item) => g?.owned.includes(i.id) || has(i.id)).map((i) => i.id),
    etc: BAG_ITEMS.filter((b) => b.kind === "material" && has(b.id)).map((b) => b.id),
  };
}
