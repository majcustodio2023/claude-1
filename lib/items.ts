import type { ItemSlot } from "./types";

// Everything the hero can wear. Drawn in components/characters.tsx (by id).
// "shop" items rotate through the shop; "loot" items only drop from tasks and bosses.

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Item {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  price: number;
  source: "shop" | "loot" | "both";
}

export const RARITY: Record<Rarity, { label: string; color: string; weight: number }> = {
  common: { label: "Common", color: "#c9d2ff", weight: 60 },
  rare: { label: "Rare", color: "#4fd2ff", weight: 28 },
  epic: { label: "Epic", color: "#c77dff", weight: 10 },
  legendary: { label: "Legendary", color: "#ffd23f", weight: 2 },
};

export const SLOT_LABEL: Record<ItemSlot, string> = {
  hat: "Head",
  face: "Face",
  weapon: "Weapon",
  back: "Back",
  aura: "Aura",
  pet: "Pet",
  "kit-head": "Kit's head",
  "kit-face": "Kit's face",
  "kit-neck": "Kit's neck",
  "kit-tail": "Kit's tails",
};

/** Slots worn by Kit rather than the hero. */
export const isKitSlot = (slot: ItemSlot) => slot.startsWith("kit-");

export const ITEMS: Item[] = [
  { id: "cat-ears", name: "Cat ears", slot: "hat", rarity: "common", price: 120, source: "both" },
  { id: "devil-horns", name: "Devil horns", slot: "hat", rarity: "rare", price: 260, source: "both" },
  { id: "halo", name: "Halo", slot: "hat", rarity: "rare", price: 260, source: "both" },
  { id: "wizard-hat", name: "Wizard hat", slot: "hat", rarity: "rare", price: 300, source: "shop" },
  { id: "kabuto", name: "Samurai kabuto", slot: "hat", rarity: "epic", price: 600, source: "both" },
  { id: "flame-crown", name: "Crown of flames", slot: "hat", rarity: "legendary", price: 0, source: "loot" },
  { id: "shades", name: "Deal-closer shades", slot: "face", rarity: "common", price: 100, source: "both" },
  { id: "eyepatch", name: "Pirate eyepatch", slot: "face", rarity: "common", price: 100, source: "both" },
  { id: "scar", name: "Battle scar", slot: "face", rarity: "rare", price: 220, source: "both" },
  { id: "oni-mask", name: "Oni half-mask", slot: "face", rarity: "epic", price: 550, source: "both" },
  { id: "katana", name: "Katana", slot: "weapon", rarity: "rare", price: 320, source: "both" },
  { id: "laser", name: "Laser blaster", slot: "weapon", rarity: "rare", price: 300, source: "shop" },
  { id: "staff", name: "Energy staff", slot: "weapon", rarity: "rare", price: 300, source: "both" },
  { id: "hammer", name: "Giant hammer", slot: "weapon", rarity: "epic", price: 650, source: "both" },
  { id: "scythe", name: "Void scythe", slot: "weapon", rarity: "legendary", price: 0, source: "loot" },
  { id: "red-cape", name: "Hero cape", slot: "back", rarity: "common", price: 150, source: "both" },
  { id: "jetpack", name: "Jetpack", slot: "back", rarity: "rare", price: 350, source: "shop" },
  { id: "demon-wings", name: "Demon wings", slot: "back", rarity: "epic", price: 700, source: "both" },
  { id: "angel-wings", name: "Angel wings", slot: "back", rarity: "legendary", price: 0, source: "loot" },
  { id: "sakura", name: "Sakura storm", slot: "aura", rarity: "rare", price: 340, source: "both" },
  { id: "electric", name: "Thunder aura", slot: "aura", rarity: "rare", price: 340, source: "shop" },
  { id: "shadow", name: "Shadow aura", slot: "aura", rarity: "epic", price: 750, source: "both" },
  { id: "galaxy", name: "Galaxy aura", slot: "aura", rarity: "legendary", price: 0, source: "loot" },
  { id: "slime", name: "Pet slime", slot: "pet", rarity: "common", price: 180, source: "both" },
  { id: "ghost", name: "Pet ghost", slot: "pet", rarity: "rare", price: 380, source: "both" },
  { id: "mini-dragon", name: "Mini dragon", slot: "pet", rarity: "epic", price: 800, source: "both" },
  { id: "kit-bow", name: "Kit: big bow", slot: "kit-head", rarity: "common", price: 100, source: "both" },
  { id: "kit-ninja", name: "Kit: ninja headband", slot: "kit-head", rarity: "common", price: 120, source: "both" },
  { id: "kit-headphones", name: "Kit: DJ headphones", slot: "kit-head", rarity: "rare", price: 260, source: "both" },
  { id: "kit-wizard", name: "Kit: wizard hat", slot: "kit-head", rarity: "rare", price: 280, source: "shop" },
  { id: "kit-crown", name: "Kit: royal crown", slot: "kit-head", rarity: "epic", price: 550, source: "both" },
  { id: "kit-shades", name: "Kit: cool shades", slot: "kit-face", rarity: "common", price: 100, source: "both" },
  { id: "kit-monocle", name: "Kit: gentleman monocle", slot: "kit-face", rarity: "rare", price: 240, source: "both" },
  { id: "kit-bell", name: "Kit: bell collar", slot: "kit-neck", rarity: "common", price: 110, source: "both" },
  { id: "kit-bandana", name: "Kit: bandana", slot: "kit-neck", rarity: "common", price: 110, source: "shop" },
  { id: "kit-chain", name: "Kit: gold chain", slot: "kit-neck", rarity: "epic", price: 600, source: "both" },
  { id: "kit-ninetails", name: "Kit: nine-tailed form", slot: "kit-tail", rarity: "legendary", price: 0, source: "loot" },
];

export const itemById = (id: string | undefined) => ITEMS.find((i) => i.id === id);

/** Day number since 1970 for a YYYY-MM-DD date. */
const dayNumber = (date: string) => Math.floor(Date.parse(date + "T00:00:00Z") / 86400000);

export const SHOP_DAYS = 7;
export const SHOP_SIZE = 8;
/** Of the eight, how many are for Kit. */
const KIT_IN_SHOP = 2;

/** Small seeded random generator, so the shop is the same for everyone on the same days. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** This week's items (new stock every Monday) and how many days until the next restock. */
export function shopStock(today: string): { items: Item[]; restockIn: number; period: number } {
  // Day 0 (1970-01-01) was a Thursday, so +3 makes weeks start on Monday.
  const day = dayNumber(today) + 3;
  const period = Math.floor(day / SHOP_DAYS);
  const rand = seeded(period * 7919 + 13);
  const pick = (pool: Item[], n: number) => {
    const out: Item[] = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    return out;
  };
  const forSale = ITEMS.filter((i) => i.source !== "loot");
  const items = [...pick(forSale.filter((i) => !isKitSlot(i.slot)), SHOP_SIZE - KIT_IN_SHOP), ...pick(forSale.filter((i) => isKitSlot(i.slot)), KIT_IN_SHOP)];
  return { items, restockIn: SHOP_DAYS - (day - period * SHOP_DAYS), period };
}
