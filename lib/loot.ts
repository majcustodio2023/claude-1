import { billLeft, billPaid, dealBalance, dealPaid } from "./finance";
import { ITEMS, RARITY, itemById, type Item, type Rarity } from "./items";
import type { GameState, TrackerData } from "./types";

// Coins and loot. Finishing quests, missions and client tasks, and paying bills,
// earns coins; some tasks carry a loot chest. Beating a boss (a deal fully paid)
// starts a turn-based battle (lib/battle.ts), which pays out by how well you fight.

export const REWARD = { quest: 10, task: 20, clientTask: 20, bill: 15 } as const;
export const STARTER_COINS = 100;
/** Share of tasks that carry a visible loot chest, and the surprise drop chance on the rest. */
const CHEST_PCT = 25;
const SURPRISE = 0.08;

export interface Pending {
  key: string;
  kind: "quest" | "task" | "clientTask" | "bill" | "boss";
  label: string;
  coins: number;
  /** Boss rewards wait for the battle. */
  dealId?: string;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** True when this task shows a 🎁 and drops loot when done. Stable for a given task. */
export const hasChest = (key: string) => hash(key) % 100 < CHEST_PCT;

export const questKey = (date: string, id: string) => `quest:${date}:${id}`;
export const taskKey = (id: string) => `task:${id}`;
export const clientTaskKey = (id: string) => `ctask:${id}`;

/** Everything finished but not yet rewarded. */
export function pendingRewards(data: TrackerData): Pending[] {
  const claimed = data.game?.claimed ?? {};
  const out: Pending[] = [];
  const add = (p: Pending) => !claimed[p.key] && out.push(p);
  for (const [date, list] of Object.entries(data.todos)) for (const t of list) if (t.done) add({ key: questKey(date, t.id), kind: "quest", label: t.text, coins: REWARD.quest });
  for (const t of data.tasks) if (t.done) add({ key: taskKey(t.id), kind: "task", label: t.title, coins: REWARD.task });
  for (const t of data.clientTasks ?? []) if (t.status === "done") add({ key: clientTaskKey(t.id), kind: "clientTask", label: t.title, coins: REWARD.clientTask });
  for (const month of Object.keys(data.billPayments ?? {})) {
    for (const e of data.expenses) {
      if (billPaid(data, month, e) > 0 && billLeft(data, month, e) === 0) add({ key: `bill:${month}:${e.id}`, kind: "bill", label: `Paid ${e.name}`, coins: REWARD.bill });
    }
  }
  for (const d of data.deals) {
    if (d.stage === "won" && d.value > 0 && dealPaid(d) > 0 && dealBalance(d) === 0) add({ key: `boss:${d.id}`, kind: "boss", label: d.name, coins: 0, dealId: d.id });
  }
  return out;
}

/** Sets up coins the first time, counting everything already finished as rewarded. */
export function ensureGame(d: TrackerData, today: string): GameState {
  if (d.game) return d.game;
  const claimed: Record<string, string> = {};
  d.game = { coins: 0, claimed, owned: [], equipped: {}, log: [] };
  for (const p of pendingRewards(d)) claimed[p.key] = today;
  d.game.coins = STARTER_COINS;
  d.game.log = [{ at: today, text: "Starter coin pouch", coins: STARTER_COINS }];
  return d.game;
}

/** Picks a random item you don't own yet, weighted by rarity. */
export function rollItem(game: GameState, rand: () => number, minRarity: Rarity = "common"): Item | undefined {
  const order: Rarity[] = ["common", "rare", "epic", "legendary"];
  const pool = ITEMS.filter((i) => i.source !== "shop" && !game.owned.includes(i.id) && order.indexOf(i.rarity) >= order.indexOf(minRarity));
  const total = pool.reduce((a, i) => a + RARITY[i.rarity].weight, 0);
  let r = rand() * total;
  for (const i of pool) if ((r -= RARITY[i.rarity].weight) < 0) return i;
  return pool[pool.length - 1];
}

export interface RewardEvent {
  text: string;
  coins: number;
  item?: Item;
  chest?: boolean;
}

function grant(game: GameState, today: string, ev: RewardEvent) {
  game.coins += ev.coins;
  if (ev.item) {
    game.owned.push(ev.item.id);
    // Wear new loot straight away when that slot is empty.
    game.equipped[ev.item.slot] ??= ev.item.id;
  }
  game.log = [{ at: today, text: ev.text, coins: ev.coins || undefined, item: ev.item?.id }, ...game.log].slice(0, 40);
}

/** Loot from a chest: an item if any are left to find, otherwise a coin pile. */
function loot(game: GameState, rand: () => number, minRarity?: Rarity): { item?: Item; coins: number } {
  const item = rollItem(game, rand, minRarity);
  return item ? { item, coins: 0 } : { coins: 50 + Math.floor(rand() * 51) };
}

/** Pays out everything pending (bosses go to the fight queue). Returns what happened, for the UI. */
export function claimRewards(d: TrackerData, today: string, rand: () => number = Math.random): RewardEvent[] {
  const game = ensureGame(d, today);
  const events: RewardEvent[] = [];
  for (const p of pendingRewards(d)) {
    game.claimed[p.key] = today;
    if (p.kind === "boss") {
      game.bossQueue = [...(game.bossQueue ?? []), p.dealId!];
      continue;
    }
    const chest = p.kind !== "bill" && hasChest(p.key);
    const drop = chest || rand() < SURPRISE ? loot(game, rand) : { coins: 0 };
    const ev: RewardEvent = { text: p.label, coins: p.coins + drop.coins, item: drop.item, chest };
    grant(game, today, ev);
    events.push(ev);
  }
  return events;
}

export type FightRank = "S" | "A" | "B" | "C";

/** Coins for beating a boss: bigger deals pay more, better fights multiply it. */
export function bossCoins(dealValue: number, goal: number, rank: FightRank): number {
  const base = 60 + Math.round(Math.min(1, goal > 0 ? dealValue / goal : 0.3) * 140);
  return Math.round(base * { S: 2, A: 1.5, B: 1.2, C: 1 }[rank]);
}

/** Ends a boss fight: coins, plus loot for a good fight (S: epic or better). */
export function finishBoss(d: TrackerData, dealId: string, rank: FightRank, today: string, rand: () => number = Math.random): RewardEvent {
  const game = ensureGame(d, today);
  game.bossQueue = (game.bossQueue ?? []).filter((x) => x !== dealId);
  const deal = d.deals.find((x) => x.id === dealId);
  const coins = bossCoins(deal?.value ?? 0, d.settings.monthlyGoal, rank);
  const drop = rank === "S" ? loot(game, rand, "epic") : rank === "A" || (rank === "B" && rand() < 0.5) ? loot(game, rand) : { coins: 0 };
  const ev: RewardEvent = { text: `Defeated ${deal?.name ?? "a boss"} (rank ${rank})`, coins: coins + drop.coins, item: drop.item };
  grant(game, today, ev);
  return ev;
}

export function buyItem(d: TrackerData, itemId: string, today: string): string | null {
  const game = ensureGame(d, today);
  const item = itemById(itemId);
  if (!item || item.source === "loot") return "That item isn't for sale.";
  if (game.owned.includes(itemId)) return "You already own it.";
  if (game.coins < item.price) return `You need ${item.price - game.coins} more coins.`;
  game.coins -= item.price;
  game.owned.push(itemId);
  game.equipped[item.slot] = itemId;
  game.log = [{ at: today, text: `Bought ${item.name}`, coins: -item.price, item: itemId }, ...game.log].slice(0, 40);
  return null;
}
