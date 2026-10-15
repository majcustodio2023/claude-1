import { test } from "node:test";
import assert from "node:assert/strict";
import { failDeal, fallenList, recordBattleLoss, rematchBoss, reviveDeal, setDealStage } from "../lib/fallen";
import { bossCoins, ensureGame } from "../lib/loot";
import { summarize } from "../lib/finance";
import { sampleData } from "./fixture";

const today = "2026-10-15";

function withDeals() {
  const d = sampleData();
  d.deals.push(
    { id: "open1", name: "Webinar funnel", value: 80000, stage: "proposal", payments: [], createdAt: "2026-10-01" },
    { id: "won1", name: "Interior funnel", value: 100000, stage: "won", payments: [{ id: "p1", date: "2026-10-05", amount: 40000 }], createdAt: "2026-10-01" },
  );
  return d;
}

test("a deal that never closed fails whole, and revives to its old stage", () => {
  const d = withDeals();
  failDeal(d, "open1", today, "  Went with a cheaper agency ");
  const deal = d.deals.find((x) => x.id === "open1")!;
  assert.equal(deal.stage, "lost");
  assert.deepEqual(deal.failed, { at: today, reason: "Went with a cheaper agency", kind: "unclosed", from: "proposal" });
  const f = fallenList(d).find((x) => x.deal.id === "open1")!;
  assert.equal(f.kind, "unclosed");
  assert.equal(f.lost, 80000);
  reviveDeal(d, "open1");
  assert.equal(deal.stage, "proposal");
  assert.equal(deal.failed, undefined);
});

test("a closed deal that won't be paid loses only the rest; collected money still counts", () => {
  const d = withDeals();
  const before = summarize(d, "2026-10");
  failDeal(d, "won1", today);
  const after = summarize(d, "2026-10");
  const f = fallenList(d).find((x) => x.deal.id === "won1")!;
  assert.equal(f.kind, "unpaid");
  assert.equal(f.lost, 60000);
  assert.equal(f.collected, 40000);
  assert.equal(after.moneyMade, before.moneyMade);
  assert.equal(before.wonUnpaid - after.wonUnpaid, 60000);
});

test("changing the status to and from failed keeps the Fallen right", () => {
  const d = withDeals();
  setDealStage(d, "open1", "lost", today);
  assert.equal(d.deals.find((x) => x.id === "open1")!.failed?.from, "proposal");
  setDealStage(d, "open1", "negotiating", today);
  const deal = d.deals.find((x) => x.id === "open1")!;
  assert.equal(deal.stage, "negotiating");
  assert.equal(deal.failed, undefined);
});

test("a battle you gave up on can be won in a rematch for the rest of the coins", () => {
  const d = withDeals();
  ensureGame(d, today);
  recordBattleLoss(d, "won1", today, 9);
  assert.equal(fallenList(d).filter((f) => f.kind === "battle").length, 1);
  const coins = d.game!.coins;
  const ev = rematchBoss(d, "won1", "A", today, () => 0.99);
  const expected = bossCoins(100000, d.settings.monthlyGoal, "A") - bossCoins(100000, d.settings.monthlyGoal, "C");
  assert.equal(ev.coins, expected);
  assert.equal(d.game!.coins, coins + expected);
  assert.equal(fallenList(d).filter((f) => f.kind === "battle").length, 0);
});
