import { test } from "node:test";
import assert from "node:assert/strict";
import { billLeft, billPaid, cashFlows, summarize } from "../lib/finance";
import { REST_ID, collectSub, incomePartlyCollected, incomeSubRows, newSub, paySub, setSubs, subDone, subRows, uncollectSub, unpaySub } from "../lib/subs";
import { pendingRewards } from "../lib/loot";
import { sampleData } from "./fixture";

const M = "2026-10";

function household() {
  const d = sampleData();
  const e = d.expenses.find((x) => x.id === "household")!;
  setSubs(e, [newSub("Maid", 8000), newSub("Groceries", 20000)]);
  return { d, e };
}

test("parts that don't cover the bill leave an 'Everything else' part", () => {
  const { e } = household();
  const rows = subRows(e.amount, e.subs);
  assert.deepEqual(
    rows.map((r) => [r.name, r.amount]),
    [
      ["Maid", 8000],
      ["Groceries", 20000],
      ["Everything else", 37500],
    ],
  );
  assert.equal(rows[2].id, REST_ID);
  assert.equal(e.amount, 65500, "the bill total doesn't change");
});

test("parts adding up to more than the bill raise the bill", () => {
  const d = sampleData();
  const e = d.expenses.find((x) => x.id === "client-costs")!;
  setSubs(e, [newSub("Agency A cost", 18000), newSub("Agency B cost", 6000)]);
  assert.equal(e.amount, 24000);
  assert.equal(subRows(e.amount, e.subs).length, 2, "nothing left over");
  setSubs(e, []);
  assert.equal(e.subs, undefined);
});

test("ticking a part pays it, and the bill fills up as parts are ticked", () => {
  const { d, e } = household();
  const [maid, groceries, rest] = subRows(e.amount, e.subs);
  paySub(d, M, e.id, maid.id, "2026-10-05", "bank");
  assert.equal(billPaid(d, M, e), 8000);
  assert.ok(subDone(d, M, e, maid));
  assert.ok(!subDone(d, M, e, groceries));
  assert.equal(d.billPayments![M][e.id][0].subId, maid.id);
  assert.equal(d.billPayments![M][e.id][0].accountId, "bank");
  // Paying it again does nothing: it's already covered.
  assert.equal(paySub(d, M, e.id, maid.id, "2026-10-06"), null);
  paySub(d, M, e.id, groceries.id, "2026-10-06");
  paySub(d, M, e.id, rest.id, "2026-10-07");
  assert.equal(billLeft(d, M, e), 0);
  assert.ok(pendingRewards(d).some((p) => p.key === `bill:${M}:${e.id}`), "a fully paid bill still earns its coins");
  assert.equal(cashFlows(d).filter((f) => f.kind === "bill").length, 3, "each part is its own payment in the ledger");
});

test("a part paid partly only pays what's left of it", () => {
  const { d, e } = household();
  const maid = e.subs![0];
  d.billPayments = { [M]: { [e.id]: [{ id: "p1", date: "2026-10-01", at: "x", amount: 3000, subId: maid.id }] } };
  paySub(d, M, e.id, maid.id, "2026-10-02");
  assert.equal(d.billPayments[M][e.id][1].amount, 5000);
});

test("unticking a part removes its payments; a whole-bill payment ticks every part", () => {
  const { d, e } = household();
  const maid = e.subs![0];
  paySub(d, M, e.id, maid.id, "2026-10-05");
  assert.ok(unpaySub(d, M, e.id, maid.id));
  assert.equal(billPaid(d, M, e), 0);
  d.billPayments![M][e.id] = [{ id: "all", date: "2026-10-01", at: "x", amount: 65500 }];
  assert.ok(subRows(e.amount, e.subs).every((s) => subDone(d, M, e, s)));
  assert.equal(unpaySub(d, M, e.id, maid.id), false, "nothing to remove: it was paid with the whole bill");
});

test("income parts: collected one by one, the income is done when every part is in", () => {
  const d = sampleData();
  const st = d.streams.find((x) => x.id === "opsified")!;
  setSubs(st, [newSub("Ads management", 35000), newSub("Reporting", 10000)]);
  const [ads, reporting, rest] = incomeSubRows(d, M, st).map((r) => r.sub);
  assert.equal(rest.amount, 5000);

  collectSub(d, M, st.id, ads.id, "2026-10-03", "bank");
  let row = summarize(d, M).streams.find((r) => r.stream.id === st.id)!;
  assert.equal(row.collected, 35000);
  assert.equal(row.isCollected, false);
  assert.ok(incomePartlyCollected(d, M, st));
  assert.equal(d.streamMonths[M][st.id].accountId, "bank");
  const pendingBefore = summarize(d, M).recurringPending;

  collectSub(d, M, st.id, reporting.id, "2026-10-08");
  assert.equal(summarize(d, M).recurringPending, pendingBefore - 10000, "still due drops by what came in");
  collectSub(d, M, st.id, rest.id, "2026-10-09");
  row = summarize(d, M).streams.find((r) => r.stream.id === st.id)!;
  assert.equal(row.collected, 50000);
  assert.ok(row.isCollected);
  assert.equal(d.streamMonths[M][st.id].collectedOn, "2026-10-09");
  assert.equal(cashFlows(d).find((f) => f.key === `stream:${M}:${st.id}`)!.amount, 50000);

  assert.ok(uncollectSub(d, M, st.id, ads.id));
  assert.equal(d.streamMonths[M][st.id].collected, 15000);
  uncollectSub(d, M, st.id, reporting.id);
  uncollectSub(d, M, st.id, rest.id);
  assert.equal(d.streamMonths[M][st.id].collected, undefined, "nothing collected once every part is unticked");
});

test("income collected all at once shows every part as in", () => {
  const d = sampleData();
  const st = d.streams.find((x) => x.id === "aacio")!;
  setSubs(st, [newSub("Plan A", 20000)]);
  assert.ok(incomeSubRows(d, M, st).every((r) => r.done));
  assert.ok(summarize(d, M).streams.find((r) => r.stream.id === st.id)!.isCollected);
  assert.equal(uncollectSub(d, M, st.id, st.subs![0].id), false);
});
