import { test } from "node:test";
import assert from "node:assert/strict";
import { REWARD, STARTER_COINS, buyItem, claimRewards, ensureGame, finishBoss, hasChest, pendingRewards, questKey } from "../lib/loot";
import { ITEMS, RARITY, itemById, shopStock } from "../lib/items";
import { funBudget, funHistory } from "../lib/fun";
import { sampleData } from "./fixture";

const never = () => 0.99; // no surprise drops

function quest(id: string, done = true) {
  return { id, text: `Quest ${id}`, done };
}

test("the first run counts what's already done as rewarded and gives starter coins", () => {
  const d = sampleData();
  d.todos["2026-10-12"] = [quest("q-old")];
  d.tasks[0].done = true;
  const events = claimRewards(d, "2026-10-13", never);
  assert.equal(events.length, 0);
  assert.equal(d.game!.coins, STARTER_COINS);
  assert.equal(pendingRewards(d).length, 0);
});

test("finishing a quest pays once, even if it's undone and done again", () => {
  const d = sampleData();
  ensureGame(d, "2026-10-13");
  // Pick a quest id without a chest so the payout is plain coins.
  let id = "q1";
  for (let i = 0; hasChest(questKey("2026-10-13", id)); i++) id = `q${i}`;
  d.todos["2026-10-13"] = [quest(id)];
  const ev = claimRewards(d, "2026-10-13", never);
  assert.equal(ev.length, 1);
  assert.equal(d.game!.coins, STARTER_COINS + REWARD.quest);
  d.todos["2026-10-13"][0].done = false;
  d.todos["2026-10-13"][0].done = true;
  assert.equal(claimRewards(d, "2026-10-13", never).length, 0);
  assert.equal(d.game!.coins, STARTER_COINS + REWARD.quest);
});

test("a task with a loot chest drops an item you don't own", () => {
  const d = sampleData();
  ensureGame(d, "2026-10-13");
  let id = "c0";
  for (let i = 0; !hasChest(questKey("2026-10-13", id)); i++) id = `c${i}`;
  d.todos["2026-10-13"] = [quest(id)];
  const [ev] = claimRewards(d, "2026-10-13", () => 0);
  assert.ok(ev.chest && ev.item);
  assert.ok(d.game!.owned.includes(ev.item!.id));
  assert.notEqual(ev.item!.source, "shop");
});

test("paying a bill in full pays coins; a deal paid off queues a boss fight", () => {
  const d = sampleData();
  ensureGame(d, "2026-10-13");
  const bill = d.expenses[0];
  d.billPayments = { "2026-10": { [bill.id]: [{ id: "p1", date: "2026-10-13", at: "2026-10-13T01:00:00Z", amount: bill.amount }] } };
  const deal = d.deals[0];
  deal.stage = "won";
  deal.payments = [{ id: "dp", date: "2026-10-13", amount: deal.value }];
  const ev = claimRewards(d, "2026-10-13", never);
  assert.ok(ev.some((e) => e.text === `Paid ${bill.name}` && e.coins === REWARD.bill));
  assert.deepEqual(d.game!.bossQueue, [deal.id]);
  const before = d.game!.coins;
  const win = finishBoss(d, deal.id, "S", "2026-10-13", () => 0);
  assert.ok(win.coins > 0 && d.game!.coins === before + win.coins);
  assert.ok(win.item && ["epic", "legendary"].includes(win.item.rarity));
  assert.deepEqual(d.game!.bossQueue, []);
});

test("the shop sells 6 items, the same for 3 days, then restocks", () => {
  const a = shopStock("2026-10-13");
  assert.equal(a.items.length, 6);
  assert.equal(new Set(a.items.map((i) => i.id)).size, 6);
  assert.ok(a.items.every((i) => i.source !== "loot"));
  assert.ok(a.restockIn >= 1 && a.restockIn <= 3);
  const later = shopStock(`2026-10-${13 + a.restockIn}`);
  assert.equal(later.period, a.period + 1);
  const sameWindow = shopStock(`2026-10-${13 + a.restockIn - 1}`);
  assert.deepEqual(sameWindow.items.map((i) => i.id), a.items.map((i) => i.id));
});

test("buying checks coins and ownership, then equips the item", () => {
  const d = sampleData();
  ensureGame(d, "2026-10-13");
  const cheap = ITEMS.find((i) => i.source !== "loot" && i.price <= STARTER_COINS)!;
  const dear = ITEMS.find((i) => i.source !== "loot" && i.price > STARTER_COINS)!;
  assert.match(buyItem(d, dear.id, "2026-10-13")!, /more coins/);
  assert.equal(buyItem(d, cheap.id, "2026-10-13"), null);
  assert.equal(d.game!.equipped[cheap.slot], cheap.id);
  assert.equal(d.game!.coins, STARTER_COINS - cheap.price);
  assert.match(buyItem(d, cheap.id, "2026-10-13")!, /already/);
  assert.match(buyItem(d, ITEMS.find((i) => i.source === "loot")!.id, "2026-10-13")!, /isn't for sale/);
  assert.ok(itemById(cheap.id) && RARITY[cheap.rarity]);
});

test("fun money is a share of what's spare, capped by cash above the buffer; spending lowers what's left, not the budget", () => {
  const d = sampleData();
  const today = "2026-10-13";
  const f = funBudget(d, "2026-10", today);
  const room = Math.max(0, f.cashRoom == null ? f.spare : Math.min(f.spare, f.cashRoom));
  assert.ok(f.safe <= (room * 20) / 100 && f.safe > (room * 20) / 100 - 100);
  if (f.safe > 0) {
    d.adHocExpenses.push({ id: "fun1", date: today, label: "Shoes", amount: 1000, category: "fun" });
    const g = funBudget(d, "2026-10", today);
    assert.equal(g.safe, f.safe);
    assert.equal(g.spent, 1000);
    assert.equal(g.left, Math.max(f.safe - 1000, 0));
  }
  d.settings.funPercent = 0;
  assert.equal(funBudget(d, "2026-10", today).safe, 0);
});

test("past months keep their safe amount and say whether it was spent or saved", () => {
  const d = sampleData();
  d.funMonths = { "2026-09": { safe: 5000 }, "2026-08": { safe: 4000, saved: true } };
  d.adHocExpenses.push({ id: "f9", date: "2026-09-20", label: "Trip", amount: 6000, category: "fun" });
  assert.equal(funBudget(d, "2026-09", "2026-10-13").safe, 5000);
  const h = funHistory(d, "2026-10-13");
  assert.deepEqual(h.map((r) => [r.month, r.verdict]), [["2026-09", "over"], ["2026-08", "saved"]]);
});
