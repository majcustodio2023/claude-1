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
  const wonUnpaid = data.deals.filter((d) => d.stage === "won").reduce((a, d) => a + dealBalance(d), 0);

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
    projected: moneyMade + recurringPending + wonUnpaid,
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
    wonUnpaid,
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
    const before = m === monthOf(asOf) ? new Set(data.settings.cashPaidAtAsOf ?? []) : null;
    fixedOut += sum(data.expenses.filter((e) => paid[e.id] && !before?.has(e.id) && expenseAppliesTo(e, m)).map((e) => e.amount));
  }
  const outflow = adHocOut + logAdOut + fixedOut;
  const now = start + inflow - outflow;

  const s = summarize(data, thisMonth);
  const paidNow = data.expensePaid[thisMonth] ?? {};
  const unpaidThisMonth = sum(data.expenses.filter((e) => expenseAppliesTo(e, thisMonth) && !paidNow[e.id]).map((e) => e.amount));
  return { set: true, asOf, start, inflow, outflow, now, incomingThisMonth: s.recurringPending, unpaidThisMonth, monthEnd: now + s.recurringPending - unpaidThisMonth };
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface ForecastMonth {
  month: string;
  start: number;
  income: number;
  bills: number;
  end: number;
}

/**
 * Cash month by month: this month from today's position, later months from the
 * recurring income expected and the expense lines that apply. Open deals and
 * one-off spending aren't guessed.
 */
export function cashForecast(data: TrackerData, today: string, months = 4): ForecastMonth[] {
  const cash = cashPosition(data, today);
  if (!cash.set) return [];
  const first = monthOf(today);
  const out: ForecastMonth[] = [{ month: first, start: cash.now, income: cash.incomingThisMonth, bills: cash.unpaidThisMonth, end: cash.monthEnd }];
  for (let i = 1; i < months; i++) {
    const month = addMonths(first, i);
    const s = summarize(data, month);
    const start = out[i - 1].end;
    const income = s.recurringCollected + s.recurringPending;
    const bills = s.fixedExpenses;
    out.push({ month, start, income, bills, end: start + income - bills });
  }
  return out;
}

/** How long cash on hand lasts with no new income, and the safety buffer target. */
export function cashHealth(data: TrackerData, today: string) {
  const cash = cashPosition(data, today);
  const burn = summarize(data, monthOf(today)).fixedExpenses;
  const bufferMonths = data.settings.cashBufferMonths ?? 3;
  const daysSinceUpdate = cash.set ? Math.round((Date.parse(today) - Date.parse(cash.asOf!)) / 86400000) : null;
  return {
    burn,
    runwayMonths: burn > 0 ? Math.max(cash.now, 0) / burn : null,
    bufferTarget: burn * bufferMonths,
    bufferMonths,
    daysSinceUpdate,
  };
}

/** Settings changes for a new bank balance check-in. */
export function recordBalance(data: TrackerData, balance: number, date: string): Partial<TrackerData["settings"]> {
  const before = cashPosition(data, date);
  const entry = { date, balance, ...(before.set && { predicted: Math.round(before.now) }) };
  const history = (data.settings.cashHistory ?? []).filter((h) => h.date !== date);
  return {
    cashBalance: balance,
    cashAsOf: date,
    cashPaidAtAsOf: Object.entries(data.expensePaid[monthOf(date)] ?? {}).filter(([, v]) => v).map(([k]) => k),
    cashHistory: [...history, entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-60),
  };
}

/** Turns one-time income entries into closed deals: paid ones keep their payment, the seeded ₱30k becomes "to collect". */
export function foldOneTimeIntoDeals(data: TrackerData): TrackerData {
  if (!data.oneTime?.length) return data;
  const deals = data.oneTime.map((o) => ({
    id: `deal-${o.id}`,
    name: o.label,
    value: o.amount,
    stage: "won" as const,
    expectedClose: o.date,
    payments: o.id === "ot-1" ? [] : [{ id: `pay-${o.id}`, date: o.date, amount: o.amount }],
    createdAt: o.date,
  }));
  return { ...data, deals: [...data.deals, ...deals], oneTime: [] };
}
