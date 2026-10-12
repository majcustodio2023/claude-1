import assert from "node:assert/strict";
import { test } from "node:test";
import { dailyAdvice, generateTodos } from "../lib/advice";
import { expectedForStream, summarize } from "../lib/finance";
import { seedData } from "../lib/seed";

test("Local Ecom Hero pays 15% or the ₱25k floor, whichever is higher", () => {
  const leh = seedData().streams.find((s) => s.id === "leh")!;
  assert.equal(expectedForStream(leh, undefined), 25000);
  assert.equal(expectedForStream(leh, { revenueBase: 100000 }), 25000);
  assert.equal(expectedForStream(leh, { revenueBase: 300000 }), 45000);
});

test("October seed: money made counts only collected cash", () => {
  const s = summarize(seedData(), "2026-10");
  // ₱38,766 AACIO + ₱30,000 one-time; retainers not yet marked collected; deals not closed.
  assert.equal(s.moneyMade, 68766);
  assert.equal(s.fixedExpenses, 140500); // debt starts November
  assert.equal(s.recurringPending, 25000 + 50000 + 18000);
  assert.equal(s.openPipeline, 135000 + 80000 + 230000);
});

test("debt line applies November through April only", () => {
  const d = seedData();
  assert.equal(summarize(d, "2026-11").fixedExpenses, 160500);
  assert.equal(summarize(d, "2027-04").fixedExpenses, 160500);
  assert.equal(summarize(d, "2027-05").fixedExpenses, 140500);
});

test("collecting a deal adds to money made in the payment month", () => {
  const d = seedData();
  const deal = d.deals.find((x) => x.id === "webinar")!;
  deal.stage = "won";
  deal.payments.push({ id: "p1", date: "2026-10-15", amount: 80000 });
  const s = summarize(d, "2026-10");
  assert.equal(s.dealCollected, 80000);
  assert.equal(s.moneyMade, 148766);
  assert.ok(s.moneyMade >= s.expenseTarget);
});

test("advice and to-dos are produced from the data", () => {
  const d = seedData();
  const a = dailyAdvice(d, "2026-10-12");
  assert.match(a.headline, /expenses|Expenses/);
  assert.ok(a.verse.text.length > 10);
  const todos = generateTodos(d, "2026-10-12");
  assert.ok(todos.some((t) => t.text.includes("Interior design funnel")));
  assert.ok(todos.some((t) => t.text.includes("Opsified")));
});
