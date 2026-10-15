// The Fallen: deals that failed (never closed, or closed but never fully paid) and boss
// battles you gave up on. Failed money never counts as made; payments already collected
// still do. Anything here can be revived (deals) or re-fought (battles).

import { dealBalance, dealPaid } from "./finance";
import type { Rarity } from "./items";
import { bossCoins, ensureGame, rollItem, type FightRank, type RewardEvent } from "./loot";
import type { Deal, DealStage, TrackerData } from "./types";

export type FallenKind = "unclosed" | "unpaid" | "battle";
export const FALLEN_LABEL: Record<FallenKind, string> = { unclosed: "Didn't close", unpaid: "Didn't pay", battle: "Lost the battle" };

export interface Fallen {
  key: string;
  kind: FallenKind;
  deal: Deal;
  at: string;
  reason?: string;
  /** Money that slipped away: the whole value if it never closed, the unpaid rest otherwise. Zero for battles. */
  lost: number;
  collected: number;
  round?: number;
}

/** Marks a deal as failed. Closed deals become "didn't pay" (only the unpaid rest is lost). */
export function failDeal(d: TrackerData, dealId: string, today: string, reason?: string) {
  const deal = d.deals.find((x) => x.id === dealId);
  if (!deal || deal.stage === "lost") return;
  deal.failed = { at: today, reason: reason?.trim() || undefined, kind: deal.stage === "won" ? "unpaid" : "unclosed", from: deal.stage };
  deal.stage = "lost";
}

/** Brings a failed deal back to the stage it was in. */
export function reviveDeal(d: TrackerData, dealId: string) {
  const deal = d.deals.find((x) => x.id === dealId);
  if (!deal || deal.stage !== "lost") return;
  deal.stage = deal.failed?.from ?? "lead";
  delete deal.failed;
}

/** Changing the status by hand goes through fail/revive so the Fallen list stays right. */
export function setDealStage(d: TrackerData, dealId: string, stage: DealStage, today: string) {
  const deal = d.deals.find((x) => x.id === dealId);
  if (!deal || deal.stage === stage) return;
  if (stage === "lost") return failDeal(d, dealId, today);
  if (deal.stage === "lost") reviveDeal(d, dealId);
  deal.stage = stage;
}

export function recordBattleLoss(d: TrackerData, dealId: string, today: string, round: number) {
  const game = ensureGame(d, today);
  game.battleLosses = [{ dealId, at: today, round }, ...(game.battleLosses ?? []).filter((x) => x.dealId !== dealId)];
}

/** Everything that fell, newest first. */
export function fallenList(data: TrackerData): Fallen[] {
  const out: Fallen[] = [];
  for (const deal of data.deals) {
    if (deal.stage !== "lost") continue;
    const kind = deal.failed?.kind ?? "unclosed";
    const collected = dealPaid(deal);
    out.push({
      key: `deal:${deal.id}`,
      kind,
      deal,
      at: deal.failed?.at ?? deal.createdAt,
      reason: deal.failed?.reason,
      lost: kind === "unpaid" ? dealBalance(deal) : Math.max(deal.value - collected, 0),
      collected,
    });
  }
  for (const b of data.game?.battleLosses ?? []) {
    const deal = data.deals.find((x) => x.id === b.dealId);
    if (deal) out.push({ key: `battle:${b.dealId}`, kind: "battle", deal, at: b.at, lost: 0, collected: dealPaid(deal), round: b.round });
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/**
 * Winning a rematch of a battle you gave up on (which paid rank C) pays the difference
 * up to the new rank, plus loot for a good win, and clears it from the Fallen.
 */
export function rematchBoss(d: TrackerData, dealId: string, rank: FightRank, today: string, rand: () => number = Math.random): RewardEvent {
  const game = ensureGame(d, today);
  const deal = d.deals.find((x) => x.id === dealId);
  game.battleLosses = (game.battleLosses ?? []).filter((x) => x.dealId !== dealId);
  const goal = d.settings.monthlyGoal;
  const coins = Math.max(0, bossCoins(deal?.value ?? 0, goal, rank) - bossCoins(deal?.value ?? 0, goal, "C"));
  const min: Rarity | undefined = rank === "S" ? "epic" : rank === "A" ? "common" : undefined;
  const item = min ? rollItem(game, rand, min) : undefined;
  const ev: RewardEvent = { text: `Rematch won: ${deal?.name ?? "a boss"} (rank ${rank})`, coins, item };
  game.coins += coins;
  if (item) {
    game.owned.push(item.id);
    game.equipped[item.slot] ??= item.id;
  }
  game.log = [{ at: today, text: ev.text, coins: coins || undefined, item: item?.id }, ...game.log].slice(0, 40);
  return ev;
}
