import { addMonths, cashHealth, cashPosition, monthOf, summarize } from "./finance";
import type { TrackerData } from "./types";

// Fun money: how much is safe to spend on yourself this month, guilt-free.
// It's a share (default 20%) of what's actually spare: money made this month after
// this month's bills and other spending, and never more than the cash you hold above
// your safety buffer and this month's unpaid bills.

export const DEFAULT_FUN_PERCENT = 20;

export interface FunBudget {
  month: string;
  percent: number;
  /** Money made minus bills and other (non-fun) spending this month. */
  spare: number;
  /** Cash above the safety buffer and unpaid bills, when balances are set. */
  cashRoom: number | null;
  safe: number;
  spent: number;
  left: number;
  saved: boolean;
}

export const funSpent = (data: TrackerData, month: string) =>
  data.adHocExpenses.filter((e) => e.category === "fun" && monthOf(e.date) === month).reduce((a, e) => a + e.amount, 0);

/** Rounds down to a tidy amount (nearest 100, or 10 for small numbers). */
const tidy = (n: number) => (n >= 1000 ? Math.floor(n / 100) * 100 : Math.floor(n / 10) * 10);

export function funBudget(data: TrackerData, month: string, today: string): FunBudget {
  const percent = data.settings.funPercent ?? DEFAULT_FUN_PERCENT;
  const spent = funSpent(data, month);
  const saved = Boolean(data.funMonths?.[month]?.saved);
  const current = month === monthOf(today);
  // Past months keep the amount worked out back then; the numbers behind it have moved on.
  if (!current && data.funMonths?.[month]) {
    const safe = data.funMonths[month].safe;
    return { month, percent, spare: 0, cashRoom: null, safe, spent, left: Math.max(safe - spent, 0), saved };
  }
  const s = summarize(data, month);
  const otherSpend = s.totalSpent - s.expensesPaid - spent;
  const spare = s.moneyMade - s.fixedExpenses - otherSpend;
  let cashRoom: number | null = null;
  if (current) {
    const cash = cashPosition(data, today);
    if (cash.set) cashRoom = cash.now + spent - s.billsLeft - cashHealth(data, today).bufferTarget;
  }
  const room = Math.max(0, cashRoom == null ? spare : Math.min(spare, cashRoom));
  const safe = tidy((room * percent) / 100);
  return { month, percent, spare, cashRoom, safe, spent, left: Math.max(safe - spent, 0), saved };
}

export interface FunHistoryRow {
  month: string;
  safe: number;
  spent: number;
  verdict: "spent" | "saved" | "over" | "unused";
}

/** Past months: what was safe, what you spent, and whether you spent it or saved it. */
export function funHistory(data: TrackerData, today: string, months = 6): FunHistoryRow[] {
  const rows: FunHistoryRow[] = [];
  for (let i = 1; i <= months; i++) {
    const month = addMonths(monthOf(today), -i);
    const rec = data.funMonths?.[month];
    const spent = funSpent(data, month);
    if (!rec && !spent) continue;
    const safe = rec?.safe ?? 0;
    const verdict = spent > safe ? "over" : rec?.saved ? "saved" : spent > 0 ? "spent" : "unused";
    rows.push({ month, safe, spent, verdict });
  }
  return rows;
}
