import assert from "node:assert/strict";
import { test } from "node:test";
import { dailyAdvice, generateTodos } from "../lib/advice";
import { cashForecast, cashHealth, cashPosition, expectedForStream, recordBalance, summarize } from "../lib/finance";
import { sampleData as seedData } from "./fixture";

test("Local Ecom Hero pays 15% or the ₱25k floor, whichever is higher", () => {
  const leh = seedData().streams.find((s) => s.id === "leh")!;
  assert.equal(expectedForStream(leh, undefined), 25000);
  assert.equal(expectedForStream(leh, { revenueBase: 100000 }), 25000);
  assert.equal(expectedForStream(leh, { revenueBase: 300000 }), 45000);
});

test("October seed: money made counts only collected cash", () => {
  const s = summarize(seedData(), "2026-10");
  // ₱38,766 AACIO; retainers not yet marked collected; the ₱30k one-off is closed but not collected.
  assert.equal(s.moneyMade, 38766);
  assert.equal(s.wonUnpaid, 30000);
  assert.equal(s.projected, 38766 + 93000 + 30000);
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
  assert.equal(s.moneyMade, 118766);
});

test("advice and to-dos are produced from the data", () => {
  const d = seedData();
  const a = dailyAdvice(d, "2026-10-12");
  assert.match(a.headline, /expenses|Expenses/);
  assert.ok(a.verse.text.length > 10);
  const todos = generateTodos(d, "2026-10-12");
  assert.ok(todos.some((t) => t.text.includes("Big funnel build")));
  assert.ok(todos.some((t) => t.text.includes("Retainer client A")));
});

test("cash on hand starts from the bank balance and follows money in and out", () => {
  const d = seedData();
  // Seed: ₱165,000 on Oct 11, plus ₱38,766 AACIO that day, minus ₱22,000 delayed salary.
  const c = cashPosition(d, "2026-10-13");
  assert.equal(c.now, 165000 + 38766 - 22000);
  // Paying the household line and collecting Opsified moves it.
  d.expensePaid["2026-10"] = { household: true };
  d.streamMonths["2026-10"].opsified = { collected: 50000, collectedOn: "2026-10-12" };
  const c2 = cashPosition(d, "2026-10-13");
  assert.equal(c2.now, c.now - 65500 + 50000);
  // Month-end: + LEH ₱25k floor + ads client ₱18k incoming, − unpaid salary, client costs, GHL.
  assert.equal(c2.monthEnd, c2.now + 25000 + 18000 - (27000 + 22000 + 26000));
  assert.equal(cashPosition({ ...d, settings: { ...d.settings, cashBalance: undefined } }, "2026-10-13").set, false);
});

test("a mid-month balance update doesn't subtract bills already paid", () => {
  const d = seedData();
  d.expensePaid["2026-10"] = { household: true };
  Object.assign(d.settings, recordBalance(d, [{ id: "main", name: "Bank", balance: 120000 }], "2026-10-20"));
  assert.equal(d.settings.cashHistory?.at(-1)?.balance, 120000);
  assert.ok(d.settings.cashHistory?.at(-1)?.predicted != null);
  assert.equal(cashPosition(d, "2026-10-20").now, 120000);
  // Paying the next bill after the update does count.
  d.expensePaid["2026-10"].salary = true;
  assert.equal(cashPosition(d, "2026-10-21").now, 120000 - 27000);
});

test("forecast rolls month-end cash forward with recurring income and bills", () => {
  const d = seedData();
  const f = cashForecast(d, "2026-10-13", 3);
  assert.equal(f.length, 3);
  assert.equal(f[0].end, cashPosition(d, "2026-10-13").monthEnd);
  assert.equal(f[1].month, "2026-11");
  assert.equal(f[1].start, f[0].end);
  assert.equal(f[1].bills, 160500);
  assert.equal(f[1].end, f[1].start + f[1].income - 160500);
  const h = cashHealth(d, "2026-10-13");
  assert.equal(h.bufferTarget, 140500 * 3);
  assert.equal(h.daysSinceUpdate, 2);
});

test("old one-time income becomes closed deals: paid ones keep the payment, the seeded ₱30k is to collect", async () => {
  const { foldOneTimeIntoDeals } = await import("../lib/finance");
  const d = seedData();
  d.oneTime = [
    { id: "ot-1", date: "2026-10-11", label: "One-time client payment", amount: 30000 },
    { id: "ot-x", date: "2026-10-05", label: "Consulting", amount: 5000 },
  ];
  d.deals = d.deals.filter((x) => x.id !== "deal-ot-1");
  const m = foldOneTimeIntoDeals(d);
  assert.equal(m.oneTime.length, 0);
  const s = summarize(m, "2026-10");
  assert.equal(s.wonUnpaid, 30000);
  assert.equal(s.dealCollected, 5000);
});

test("money follows the currency and locale in settings", async () => {
  const { configureLocale, money } = await import("../lib/finance");
  configureLocale({ currency: "USD", locale: "en-US" });
  assert.equal(money(1234.4), "$1,234");
  configureLocale({ currency: "PHP", locale: "en-PH" });
  assert.equal(money(30000), "₱30,000");
});

test("money lands in the account it was collected into, bills come out of theirs, transfers move it", () => {
  const d = seedData();
  Object.assign(d.settings, recordBalance(d, [{ id: "bank", name: "Bank", balance: 100000 }, { id: "wallet", name: "Wallet", balance: 20000 }], "2026-10-13"));
  d.streamMonths["2026-10"].opsified = { collected: 50000, collectedOn: "2026-10-14", accountId: "wallet" };
  d.expensePaid["2026-10"] = { household: true };
  d.expensePaidFrom = { "2026-10": { household: { date: "2026-10-14", accountId: "bank" } } };
  d.transfers = [{ id: "t1", date: "2026-10-15", from: "wallet", to: "bank", amount: 30000 }];
  const c = cashPosition(d, "2026-10-15");
  const by = Object.fromEntries(c.accounts.map((a) => [a.id, a.now]));
  assert.equal(by.wallet, 20000 + 50000 - 30000);
  assert.equal(by.bank, 100000 - 65500 + 30000);
  assert.equal(c.now, 120000 + 50000 - 65500);
  // A transfer isn't income or spending.
  assert.equal(c.inflow, 50000);
  assert.equal(c.outflow, 65500);
  // Money with no account goes to the first one.
  d.deals[0].payments.push({ id: "p-x", date: "2026-10-15", amount: 1000 });
  assert.equal(cashPosition(d, "2026-10-15").accounts[0].now, by.bank + 1000);
});

test("a balance check-in already includes money recorded that day", () => {
  const d = seedData();
  d.streamMonths["2026-10"].opsified = { collected: 50000, collectedOn: "2026-10-13" };
  Object.assign(d.settings, recordBalance(d, [{ id: "main", name: "Bank", balance: 90000 }], "2026-10-13"));
  assert.equal(cashPosition(d, "2026-10-13").now, 90000);
  // Collected after the check-in, same day: counts.
  d.streamMonths["2026-10"]["ads-client"] = { collected: 18000, collectedOn: "2026-10-13" };
  assert.equal(cashPosition(d, "2026-10-13").now, 108000);
});

test("ad spend from check-ins isn't counted again once it's entered as an expense", () => {
  const d = seedData();
  d.logs["2026-10-12"] = { date: "2026-10-12", adSpend: 5000 };
  const before = cashPosition(d, "2026-10-13").now;
  assert.equal(summarize(d, "2026-10").adSpend, 5000);
  d.adHocExpenses.push({ id: "meta-1", date: "2026-10-12", label: "Meta ads", amount: 5200, category: "ads" });
  const s = summarize(d, "2026-10");
  assert.equal(s.adSpend, 5200);
  assert.equal(cashPosition(d, "2026-10-13").now, before + 5000 - 5200);
});

test("an archived stream still counts in months it paid", () => {
  const d = seedData();
  d.streamMonths["2026-10"].opsified = { collected: 50000, collectedOn: "2026-10-12" };
  const before = summarize(d, "2026-10").recurringCollected;
  d.streams.find((x) => x.id === "opsified")!.active = false;
  assert.equal(summarize(d, "2026-10").recurringCollected, before);
  assert.ok(!summarize(d, "2026-11").streams.some((r) => r.stream.id === "opsified"));
});

test("bills can be paid in parts; each payment comes out of its account on its day", () => {
  const d = seedData();
  const household = d.expenses.find((e) => e.id === "household")!;
  d.billPayments = { "2026-10": { household: [{ id: "b1", date: "2026-10-12", at: "2026-10-12T03:00:00Z", amount: 30000 }] } };
  const s = summarize(d, "2026-10");
  assert.equal(s.expensesPaid, 30000);
  assert.equal(s.billsLeft, s.fixedExpenses - 30000);
  const c = cashPosition(d, "2026-10-13");
  assert.equal(c.unpaidThisMonth, s.fixedExpenses - 30000);
  assert.equal(c.now, 165000 + 38766 - 22000 - 30000);
  assert.ok(household.amount > 30000);
});

test("older ticked-as-paid bills become dated payments with the same cash result", async () => {
  const { upgradeBillPayments } = await import("../lib/finance");
  const d = seedData();
  d.expensePaid["2026-10"] = { household: true };
  Object.assign(d.settings, recordBalance(d, [{ id: "main", name: "Bank", balance: 120000 }], "2026-10-20"));
  d.expensePaid["2026-10"].salary = true;
  const before = cashPosition(d, "2026-10-21").now;
  const up = upgradeBillPayments(d);
  assert.deepEqual(up.expensePaid, {});
  assert.equal(up.billPayments!["2026-10"].household[0].amount, 65500);
  assert.equal(cashPosition(up, "2026-10-21").now, before);
  assert.equal(summarize(up, "2026-10").expensesPaid, 65500 + 27000);
});

test("history lists money in and out per month", async () => {
  const { moneyHistory } = await import("../lib/finance");
  const d = seedData();
  const h = moneyHistory(d, "2026-10", 3);
  assert.deepEqual(h.map((x) => x.month), ["2026-08", "2026-09", "2026-10"]);
  const oct = h[2];
  assert.equal(oct.net, oct.collected - oct.billsPaid - oct.otherSpending);
});
