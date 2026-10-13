import type { Deal, ExpenseLine, IncomeStream, StreamMonth, TrackerData } from "./types";

export const monthOf = (date: string) => date.slice(0, 7);

export function todayISO(now = new Date()): string {
  // Manila time, so "today" matches Maj's day rather than UTC.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(now);
}

export function peso(n: number): string {
  return "₱" + Math.round(n).toLocaleString("en-PH");
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** What a stream should pay this month, given what's been entered so far. */
export function expectedForStream(s: IncomeStream, m: StreamMonth | undefined): number {
  switch (s.kind) {
    case "fixed":
      return s.amount;
    case "percent_floor": {
      const floor = s.floor ?? 0;
      if (m?.revenueBase == null) return floor;
      return Math.max((s.percent ?? 0) * m.revenueBase, floor);
    }
    case "variable":
      return m?.actual ?? s.amount;
  }
}

export function expenseAppliesTo(e: ExpenseLine, month: string): boolean {
  if (!e.active) return false;
  if (e.startMonth && month < e.startMonth) return false;
  if (e.endMonth && month > e.endMonth) return false;
  return true;
}

export const dealPaid = (d: Deal) => d.payments.reduce((a, p) => a + p.amount, 0);
export const dealBalance = (d: Deal) => Math.max(d.value - dealPaid(d), 0);

export interface StreamRow {
  stream: IncomeStream;
  expected: number;
  collected: number;
  isCollected: boolean;
  month: StreamMonth | undefined;
}

export interface MonthSummary {
  month: string;
  streams: StreamRow[];
  recurringCollected: number;
  recurringPending: number;
  dealCollected: number;
  oneTimeCollected: number;
  moneyMade: number;
  projected: number;
  fixedExpenses: number;
  expenseTarget: number;
  adHocExpenses: number;
  adSpend: number;
  totalSpent: number;
  expensesPaid: number;
  goal: number;
  pctExpenses: number;
  pctGoal: number;
  gapToExpenses: number;
  gapToGoal: number;
  openPipeline: number;
  wonUnpaid: number;
}

export function summarize(data: TrackerData, month: string): MonthSummary {
  const sm = data.streamMonths[month] ?? {};
  const streams: StreamRow[] = data.streams
    .filter((s) => s.active)
    .map((s) => {
      const m = sm[s.id];
      const isCollected = m?.collected != null;
      return { stream: s, month: m, expected: expectedForStream(s, m), collected: m?.collected ?? 0, isCollected };
    });

  const recurringCollected = streams.reduce((a, r) => a + r.collected, 0);
  const recurringPending = streams.filter((r) => !r.isCollected).reduce((a, r) => a + r.expected, 0);

  const dealCollected = data.deals
    .flatMap((d) => d.payments)
    .filter((p) => monthOf(p.date) === month)
    .reduce((a, p) => a + p.amount, 0);
  const oneTimeCollected = data.oneTime.filter((o) => monthOf(o.date) === month).reduce((a, o) => a + o.amount, 0);

  const moneyMade = recurringCollected + dealCollected + oneTimeCollected;

  const lines = data.expenses.filter((e) => expenseAppliesTo(e, month));
  const fixedExpenses = lines.reduce((a, e) => a + e.amount, 0);
  const expenseTarget = data.settings.expenseTargetOverride || fixedExpenses;
  const paidMap = data.expensePaid[month] ?? {};
  const expensesPaid = lines.filter((e) => paidMap[e.id]).reduce((a, e) => a + e.amount, 0);

  const adHoc = data.adHocExpenses.filter((e) => monthOf(e.date) === month);
  const adHocExpenses = adHoc.reduce((a, e) => a + e.amount, 0);
  const logAdSpend = Object.values(data.logs)
    .filter((l) => monthOf(l.date) === month)
    .reduce((a, l) => a + (l.adSpend ?? 0), 0);
  const adSpend = logAdSpend + adHoc.filter((e) => e.category === "ads").reduce((a, e) => a + e.amount, 0);

  const goal = data.settings.monthlyGoal;
  const open = data.deals.filter((d) => d.stage !== "won" && d.stage !== "lost");

  return {
    month,
    streams,
    recurringCollected,
    recurringPending,
    dealCollected,
    oneTimeCollected,
    moneyMade,
    projected: moneyMade + recurringPending,
    fixedExpenses,
    expenseTarget,
    adHocExpenses,
    adSpend,
    totalSpent: expensesPaid + adHocExpenses + logAdSpend,
    expensesPaid,
    goal,
    pctExpenses: expenseTarget ? moneyMade / expenseTarget : 0,
    pctGoal: goal ? moneyMade / goal : 0,
    gapToExpenses: Math.max(expenseTarget - moneyMade, 0),
    gapToGoal: Math.max(goal - moneyMade, 0),
    openPipeline: open.reduce((a, d) => a + d.value, 0),
    wonUnpaid: data.deals.filter((d) => d.stage === "won").reduce((a, d) => a + dealBalance(d), 0),
  };
}

export function daysLeftInMonth(today: string): number {
  const [y, m, d] = today.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return last - d + 1;
}

/** Sum of daily logs from Monday of the given date's week through that date. */
export function weekLogs(data: TrackerData, today: string) {
  const d = new Date(today + "T00:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - dow);
  const startISO = start.toISOString().slice(0, 10);
  const logs = Object.values(data.logs).filter((l) => l.date >= startISO && l.date <= today);
  const sum = (k: "leads" | "bookedCalls" | "showUps" | "closes" | "adSpend") => logs.reduce((a, l) => a + (l[k] ?? 0), 0);
  return {
    from: startISO,
    days: logs.length,
    leads: sum("leads"),
    bookedCalls: sum("bookedCalls"),
    showUps: sum("showUps"),
    closes: sum("closes"),
    adSpend: sum("adSpend"),
  };
}

export interface CashPosition {
  set: boolean;
  asOf?: string;
  start: number;
  inflow: number;
  outflow: number;
  now: number;
  incomingThisMonth: number;
  unpaidThisMonth: number;
  monthEnd: number;
}

/**
 * Cash on hand: the bank balance entered on cashAsOf, plus everything collected
 * since, minus everything paid since. Month-end adds retainers still incoming
 * and subtracts fixed expenses not yet marked paid.
 */
export function cashPosition(data: TrackerData, today: string): CashPosition {
  const start = data.settings.cashBalance;
  const asOf = data.settings.cashAsOf;
  if (start == null || !asOf) {
    return { set: false, start: 0, inflow: 0, outflow: 0, now: 0, incomingThisMonth: 0, unpaidThisMonth: 0, monthEnd: 0 };
  }
  const inRange = (d?: string) => Boolean(d && d >= asOf && d <= today);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

  const streamIn = sum(
    Object.entries(data.streamMonths).flatMap(([m, byStream]) =>
      Object.values(byStream)
        .filter((x) => x.collected != null && inRange(x.collectedOn ?? `${m}-01`))
        .map((x) => x.collected!),
    ),
  );
  const dealIn = sum(data.deals.flatMap((d) => d.payments).filter((p) => inRange(p.date)).map((p) => p.amount));
  const oneTimeIn = sum(data.oneTime.filter((o) => inRange(o.date)).map((o) => o.amount));
  const inflow = streamIn + dealIn + oneTimeIn;

  const adHocOut = sum(data.adHocExpenses.filter((e) => inRange(e.date)).map((e) => e.amount));
  const logAdOut = sum(Object.values(data.logs).filter((l) => inRange(l.date)).map((l) => l.adSpend ?? 0));
  const thisMonth = monthOf(today);
  let fixedOut = 0;
  for (const [m, paid] of Object.entries(data.expensePaid)) {
    if (m < monthOf(asOf) || m > thisMonth) continue;
    fixedOut += sum(data.expenses.filter((e) => paid[e.id] && expenseAppliesTo(e, m)).map((e) => e.amount));
  }
  const outflow = adHocOut + logAdOut + fixedOut;
  const now = start + inflow - outflow;

  const s = summarize(data, thisMonth);
  const paidNow = data.expensePaid[thisMonth] ?? {};
  const unpaidThisMonth = sum(data.expenses.filter((e) => expenseAppliesTo(e, thisMonth) && !paidNow[e.id]).map((e) => e.amount));
  return { set: true, asOf, start, inflow, outflow, now, incomingThisMonth: s.recurringPending, unpaidThisMonth, monthEnd: now + s.recurringPending - unpaidThisMonth };
}
