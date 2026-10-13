import { billLeft, billPaid, expectedForStream, subRows, uid } from "./finance";
import type { BillPayment, ExpenseLine, IncomeStream, SubItem, TrackerData } from "./types";

// Sub-items: a bill or income broken into named parts (Household → maid, groceries…),
// each ticked off on its own. The parent's amount stays the total; whatever the named
// parts don't cover shows as an "Everything else" part (subRows in finance.ts).

export { REST_ID, subRows } from "./finance";

export const subsTotal = (subs: SubItem[] | undefined) => (subs ?? []).reduce((a, s) => a + s.amount, 0);

/** Replaces a bill's or income's parts. The total grows if the parts add up to more. */
export function setSubs<T extends { amount: number; subs?: SubItem[] }>(line: T, subs: SubItem[]) {
  if (subs.length) line.subs = subs;
  else delete line.subs;
  line.amount = Math.max(line.amount, subsTotal(subs));
}

export const newSub = (name = "", amount = 0): SubItem => ({
  id: uid("sub"),
  name,
  amount,
});

// ---- Bills ----

const billPays = (d: TrackerData, month: string, id: string) => d.billPayments?.[month]?.[id] ?? [];

/** Paid toward one part of a bill this month. */
export const subPaid = (d: TrackerData, month: string, e: ExpenseLine, subId: string) =>
  billPays(d, month, e.id)
    .filter((p) => p.subId === subId)
    .reduce((a, p) => a + p.amount, 0);

/** A part is done when its own payments cover it, or the whole bill is paid. */
export function subDone(d: TrackerData, month: string, e: ExpenseLine, sub: SubItem): boolean {
  if (billPaid(d, month, e) > 0 && billLeft(d, month, e) === 0) return true;
  return sub.amount > 0 && subPaid(d, month, e, sub.id) >= sub.amount;
}

/** Ticks a part as paid: records a payment for what's left of it. */
export function paySub(d: TrackerData, month: string, expenseId: string, subId: string, date: string, accountId?: string): BillPayment | null {
  const e = d.expenses.find((x) => x.id === expenseId);
  const sub = e && subRows(e.amount, e.subs).find((s) => s.id === subId);
  if (!e || !sub) return null;
  const amount = sub.amount - subPaid(d, month, e, subId);
  if (amount <= 0) return null;
  const p: BillPayment = {
    id: uid("bill"),
    date,
    at: new Date().toISOString(),
    amount,
    subId,
    ...(accountId && { accountId }),
  };
  const byBill = ((d.billPayments ??= {})[month] ??= {});
  byBill[e.id] = [...(byBill[e.id] ?? []), p];
  return p;
}

/** Unticks a part: removes its payments. Returns false when it was only covered by a whole-bill payment. */
export function unpaySub(d: TrackerData, month: string, expenseId: string, subId: string): boolean {
  const byBill = d.billPayments?.[month];
  const pays = byBill?.[expenseId] ?? [];
  if (!pays.some((p) => p.subId === subId)) return false;
  byBill![expenseId] = pays.filter((p) => p.subId !== subId);
  return true;
}

// ---- Income ----

/** The parts of an income for a month, with what's been collected on each. */
export function incomeSubRows(d: TrackerData, month: string, st: IncomeStream) {
  const sm = d.streamMonths[month]?.[st.id];
  // Collected all at once (before parts, or with "Mark collected"): every part counts as in.
  const wholeCollected = sm?.collected != null && !sm.subs;
  return subRows(expectedForStream(st, sm), st.subs).map((sub) => ({
    sub,
    done: wholeCollected || sm?.subs?.[sub.id] != null,
  }));
}

/** True while some parts of an income are still to collect this month. */
export function incomePartlyCollected(d: TrackerData, month: string, st: IncomeStream): boolean {
  const sm = d.streamMonths[month]?.[st.id];
  if (!sm?.subs || !st.subs?.length) return false;
  return incomeSubRows(d, month, st).some((r) => !r.done);
}

function syncCollected(d: TrackerData, month: string, streamId: string) {
  const sm = d.streamMonths[month]?.[streamId];
  if (!sm?.subs) return;
  const parts = Object.values(sm.subs);
  if (!parts.length) {
    delete sm.subs;
    delete sm.collected;
    delete sm.collectedOn;
    delete sm.accountId;
    return;
  }
  sm.collected = parts.reduce((a, p) => a + p.amount, 0);
  sm.collectedOn = parts
    .map((p) => p.date)
    .sort()
    .pop();
}

/** Ticks one part of an income as collected. */
export function collectSub(d: TrackerData, month: string, streamId: string, subId: string, date: string, accountId?: string) {
  const st = d.streams.find((x) => x.id === streamId);
  const row = st && incomeSubRows(d, month, st).find((r) => r.sub.id === subId);
  if (!st || !row || row.done) return;
  const sm = ((d.streamMonths[month] ??= {})[streamId] ??= {});
  (sm.subs ??= {})[subId] = { amount: row.sub.amount, date };
  if (accountId && !sm.accountId) sm.accountId = accountId;
  syncCollected(d, month, streamId);
}

/** Unticks one part. Returns false when the income was collected all at once (use Undo instead). */
export function uncollectSub(d: TrackerData, month: string, streamId: string, subId: string): boolean {
  const sm = d.streamMonths[month]?.[streamId];
  if (!sm?.subs?.[subId]) return false;
  delete sm.subs[subId];
  syncCollected(d, month, streamId);
  return true;
}
