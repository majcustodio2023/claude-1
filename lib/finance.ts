import type { BillPayment, CashAccount, Deal, ExpenseLine, IncomeStream, StreamMonth, SubItem, TrackerData } from "./types";

export const monthOf = (date: string) => date.slice(0, 7);

// Currency, number format and time zone come from Settings. The app calls
// configureLocale() with the saved settings before rendering or reporting.
let fmt: { currency: string; locale?: string; timeZone?: string } = { currency: "USD" };
let moneyFormat: Intl.NumberFormat | null = null;

export function configureLocale(s: { currency?: string; locale?: string; timeZone?: string }) {
  const next = { currency: s.currency || "USD", locale: s.locale || undefined, timeZone: s.timeZone || undefined };
  if (next.currency === fmt.currency && next.locale === fmt.locale && next.timeZone === fmt.timeZone && moneyFormat) return;
  fmt = next;
  try {
    moneyFormat = new Intl.NumberFormat(fmt.locale, { style: "currency", currency: fmt.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  } catch {
    moneyFormat = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}

export const locale = () => fmt.locale;

/** "Today" in the business's time zone (or the device's), as YYYY-MM-DD. */
export function todayISO(now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: fmt.timeZone }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA").format(now);
  }
}

/** Formats an amount in the business's currency, rounded to whole units. */
export function money(n: number): string {
  if (!moneyFormat) configureLocale(fmt);
  return moneyFormat!.format(Math.round(n));
}

const otherFormats = new Map<string, Intl.NumberFormat>();

/** Formats an amount in a given currency (e.g. an ad account's), falling back to the business's. */
export function moneyIn(n: number, currency?: string): string {
  if (!currency || currency === fmt.currency) return money(n);
  let f = otherFormats.get(currency);
  if (!f) {
    try {
      f = new Intl.NumberFormat(fmt.locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } catch {
      return money(n);
    }
    otherFormats.set(currency, f);
  }
  return f.format(Math.round(n));
}

/** Reads a typed amount, ignoring currency symbols, commas and spaces. */
export const parseAmount = (t: string) => Number(t.replace(/[^\d.-]/g, ""));

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

export const REST_ID = "rest";

/** The parts of a bill or income to tick off: the named ones, plus "Everything else" when the total is bigger. */
export function subRows(total: number, subs: SubItem[] | undefined): SubItem[] {
  if (!subs?.length) return [];
  const listed = subs.reduce((a, s) => a + s.amount, 0);
  return total > listed ? [...subs, { id: REST_ID, name: "Everything else", amount: total - listed }] : subs;
}

/** Collected so far counts, but an income broken into parts is only done when every part is in. */
function streamDone(s: IncomeStream, m: StreamMonth | undefined): boolean {
  if (m?.collected == null) return false;
  if (!m.subs || !s.subs?.length) return true;
  return subRows(expectedForStream(s, m), s.subs).every((sub) => m.subs![sub.id] != null);
}

export function expenseAppliesTo(e: ExpenseLine, month: string): boolean {
  if (!e.active) return false;
  if (e.startMonth && month < e.startMonth) return false;
  if (e.endMonth && month > e.endMonth) return false;
  return true;
}

/** Payments toward a bill in a month (older "ticked as paid" data counts as paid in full). */
export function billPaid(data: TrackerData, month: string, e: ExpenseLine): number {
  const pays = data.billPayments?.[month]?.[e.id];
  if (pays?.length) return pays.reduce((a, p) => a + p.amount, 0);
  return data.expensePaid[month]?.[e.id] ? e.amount : 0;
}

/** What's still owed on a bill this month. */
export const billLeft = (data: TrackerData, month: string, e: ExpenseLine) => Math.max(e.amount - billPaid(data, month, e), 0);

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
  /** Still owed on this month's bills */
  billsLeft: number;
  goal: number;
  pctExpenses: number;
  pctGoal: number;
  gapToExpenses: number;
  gapToGoal: number;
  openPipeline: number;
  wonUnpaid: number;
}

/**
 * Ad spend typed into daily check-ins. It only counts as money out for months
 * with no "ads" expenses: once spend is entered as an expense (or synced from
 * Meta), the check-in numbers are the same money and would double count.
 */
export function logAdSpend(data: TrackerData, month: string): number {
  if (data.adHocExpenses.some((e) => e.category === "ads" && monthOf(e.date) === month)) return 0;
  return Object.values(data.logs)
    .filter((l) => monthOf(l.date) === month)
    .reduce((a, l) => a + (l.adSpend ?? 0), 0);
}

export function summarize(data: TrackerData, month: string): MonthSummary {
  const sm = data.streamMonths[month] ?? {};
  // Archived streams still show in months where they paid, so history doesn't change.
  const streams: StreamRow[] = data.streams
    .filter((s) => s.active || sm[s.id]?.collected != null)
    .map((s) => {
      const m = sm[s.id];
      const isCollected = streamDone(s, m);
      return { stream: s, month: m, expected: expectedForStream(s, m), collected: m?.collected ?? 0, isCollected };
    });

  const recurringCollected = streams.reduce((a, r) => a + r.collected, 0);
  const recurringPending = streams.filter((r) => !r.isCollected).reduce((a, r) => a + Math.max(r.expected - r.collected, 0), 0);

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
  // Paid counts every payment made toward this month's bills, including bills that no longer apply.
  const expensesPaid = data.expenses.reduce((a, e) => a + billPaid(data, month, e), 0);
  const billsLeft = lines.reduce((a, e) => a + billLeft(data, month, e), 0);

  const adHoc = data.adHocExpenses.filter((e) => monthOf(e.date) === month);
  const adHocExpenses = adHoc.reduce((a, e) => a + e.amount, 0);
  const adSpend = adHoc.some((e) => e.category === "ads") ? adHoc.filter((e) => e.category === "ads").reduce((a, e) => a + e.amount, 0) : logAdSpend(data, month);
  const extraAdSpend = adSpend - adHoc.filter((e) => e.category === "ads").reduce((a, e) => a + e.amount, 0);

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
    totalSpent: expensesPaid + adHocExpenses + extraAdSpend,
    expensesPaid,
    billsLeft,
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

/** The accounts money sits in. Older data with only a total gets one account. */
export function cashAccounts(data: TrackerData): CashAccount[] {
  const accts = data.settings.cashAccounts ?? [];
  if (accts.length) return accts;
  return data.settings.cashBalance != null ? [{ id: "main", name: "Bank", balance: data.settings.cashBalance }] : [];
}

/** The account to suggest next: the last one money went into (or was paid from), else the first. */
export function defaultAccountId(data: TrackerData, dir: "in" | "out" = "in"): string | undefined {
  const accts = cashAccounts(data);
  const last = dir === "in" ? data.settings.lastAccountId : data.settings.lastPayAccountId;
  return accts.find((a) => a.id === last)?.id ?? accts[0]?.id;
}

export type FlowKind = "stream" | "deal" | "bill" | "spend" | "ads" | "transfer";

/** One movement of money in or out of an account. amount > 0 is money in. */
export interface CashFlow {
  key: string;
  date: string;
  amount: number;
  /** Raw account id as saved (may be blank or point at a removed account). */
  accountId?: string;
  label: string;
  kind: FlowKind;
}

/** Every recorded money movement, oldest first. Transfers show as an out and an in. */
export function cashFlows(data: TrackerData): CashFlow[] {
  const flows: CashFlow[] = [];
  const asOf = data.settings.cashAsOf;
  for (const [m, byStream] of Object.entries(data.streamMonths)) {
    for (const [id, x] of Object.entries(byStream)) {
      if (x.collected == null || !x.collected) continue;
      const name = data.streams.find((st) => st.id === id)?.name ?? "Retainer";
      flows.push({ key: `stream:${m}:${id}`, date: x.collectedOn ?? `${m}-01`, amount: x.collected, accountId: x.accountId, label: name, kind: "stream" });
    }
  }
  for (const d of data.deals) for (const p of d.payments) flows.push({ key: `pay:${p.id}`, date: p.date, amount: p.amount, accountId: p.accountId, label: `${d.name}${p.note ? ` · ${p.note}` : ""}`, kind: "deal" });
  for (const o of data.oneTime ?? []) flows.push({ key: `ot:${o.id}`, date: o.date, amount: o.amount, label: o.label, kind: "deal" });
  for (const e of data.adHocExpenses) flows.push({ key: `spend:${e.id}`, date: e.date, amount: -e.amount, accountId: e.accountId, label: e.label, kind: e.category === "ads" ? "ads" : "spend" });
  const logMonths = new Set(Object.values(data.logs).filter((l) => l.adSpend).map((l) => monthOf(l.date)));
  for (const m of logMonths) {
    if (!logAdSpend(data, m)) continue;
    for (const l of Object.values(data.logs)) if (l.adSpend && monthOf(l.date) === m) flows.push({ key: `log:${l.date}`, date: l.date, amount: -l.adSpend, label: "Ad spend (daily check-in)", kind: "ads" });
  }
  for (const [m, byBill] of Object.entries(data.billPayments ?? {})) {
    for (const [id, pays] of Object.entries(byBill)) {
      const name = data.expenses.find((e) => e.id === id)?.name ?? "Bill";
      for (const p of pays) flows.push({ key: `billpay:${p.id}`, date: p.date, amount: -p.amount, accountId: p.accountId, label: name, kind: "bill" });
    }
  }
  for (const [m, paid] of Object.entries(data.expensePaid)) {
    for (const e of data.expenses) {
      if (!paid[e.id] || !expenseAppliesTo(e, m) || data.billPayments?.[m]?.[e.id]?.length) continue;
      const rec = data.expensePaidFrom?.[m]?.[e.id];
      // Bills ticked before payment dates were saved: count them on the check-in day of their month, else the 1st.
      const date = rec?.date ?? (asOf && monthOf(asOf) === m ? asOf : `${m}-01`);
      flows.push({ key: `bill:${m}:${e.id}`, date, amount: -e.amount, accountId: rec?.accountId, label: e.name, kind: "bill" });
    }
  }
  const acctName = (id: string) => cashAccounts(data).find((a) => a.id === id)?.name ?? "another account";
  for (const t of data.transfers ?? []) {
    const note = t.note ? ` · ${t.note}` : "";
    flows.push({ key: `xfer-out:${t.id}`, date: t.date, amount: -t.amount, accountId: t.from, label: `Moved to ${acctName(t.to)}${note}`, kind: "transfer" });
    flows.push({ key: `xfer-in:${t.id}`, date: t.date, amount: t.amount, accountId: t.to, label: `Moved from ${acctName(t.from)}${note}`, kind: "transfer" });
  }
  return flows.sort((a, b) => a.date.localeCompare(b.date));
}

/** Keys of flows the balance entered on cashAsOf already includes. */
function settledKeys(data: TrackerData): Set<string> {
  const asOf = data.settings.cashAsOf;
  const keys = new Set(data.settings.cashSettled ?? []);
  if (asOf) for (const id of data.settings.cashPaidAtAsOf ?? []) keys.add(`bill:${monthOf(asOf)}:${id}`);
  return keys;
}

export interface AccountPosition extends CashAccount {
  inflow: number;
  outflow: number;
  now: number;
}

export interface CashPosition {
  set: boolean;
  asOf?: string;
  start: number;
  inflow: number;
  outflow: number;
  now: number;
  accounts: AccountPosition[];
  /** Money moves since the last balance check-in, newest first */
  moves: (CashFlow & { account: string })[];
  incomingThisMonth: number;
  unpaidThisMonth: number;
  monthEnd: number;
}

/**
 * Cash on hand per account: each balance entered on cashAsOf, plus money
 * collected into it since, minus money paid from it since. Money with no
 * account (or a removed one) counts in the first account. Month-end adds
 * retainers still incoming and subtracts fixed expenses not yet marked paid.
 */
export function cashPosition(data: TrackerData, today: string): CashPosition {
  const asOf = data.settings.cashAsOf;
  const accts = cashAccounts(data);
  if (!accts.length || !asOf) {
    return { set: false, start: 0, inflow: 0, outflow: 0, now: 0, accounts: [], moves: [], incomingThisMonth: 0, unpaidThisMonth: 0, monthEnd: 0 };
  }
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const settled = settledKeys(data);
  const resolve = (id?: string) => accts.find((a) => a.id === id) ?? accts[0];
  const moves = cashFlows(data)
    .filter((f) => f.date >= asOf && f.date <= today && !(f.date === asOf && settled.has(f.key)))
    .map((f) => ({ ...f, account: resolve(f.accountId).id }));
  const accounts = accts.map((a) => {
    const mine = moves.filter((f) => f.account === a.id);
    const inflow = sum(mine.filter((f) => f.amount > 0).map((f) => f.amount));
    const outflow = -sum(mine.filter((f) => f.amount < 0).map((f) => f.amount)) || 0;
    return { ...a, inflow, outflow, now: a.balance + inflow - outflow };
  });
  // Transfers move money between accounts; they aren't income or spending.
  const real = moves.filter((f) => f.kind !== "transfer");
  const inflow = sum(real.filter((f) => f.amount > 0).map((f) => f.amount));
  const outflow = -sum(real.filter((f) => f.amount < 0).map((f) => f.amount)) || 0;
  const start = sum(accts.map((a) => a.balance));
  const now = sum(accounts.map((a) => a.now));

  const thisMonth = monthOf(today);
  const s = summarize(data, thisMonth);
  const unpaidThisMonth = s.billsLeft;
  return {
    set: true,
    asOf,
    start,
    inflow,
    outflow,
    now,
    accounts,
    moves: moves.reverse(),
    incomingThisMonth: s.recurringPending,
    unpaidThisMonth,
    monthEnd: now + s.recurringPending - unpaidThisMonth,
  };
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

/** Settings changes for a balance check-in: what each account holds on that date. */
export function recordBalance(data: TrackerData, accounts: CashAccount[], date: string): Partial<TrackerData["settings"]> {
  const before = cashPosition(data, date);
  const balance = accounts.reduce((a, x) => a + x.balance, 0);
  const entry = { date, balance, ...(before.set && { predicted: Math.round(before.now) }) };
  const history = (data.settings.cashHistory ?? []).filter((h) => h.date !== date);
  return {
    cashAccounts: accounts,
    cashBalance: balance,
    cashAsOf: date,
    // Anything already recorded for that day is in the balance just entered.
    cashSettled: cashFlows({ ...data, settings: { ...data.settings, cashAsOf: date } }).filter((f) => f.date === date).map((f) => f.key),
    cashPaidAtAsOf: [],
    cashHistory: [...history, entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-60),
  };
}

/** Turns one-time income entries into closed deals with their payment. The original starter entry (ot-1) was never actually collected, so it stays "to collect". */
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

/**
 * Turns older "ticked as paid" bills into payments with a date, so every bill
 * works the same way. The balance check-in keeps treating them the same.
 */
export function upgradeBillPayments(data: TrackerData): TrackerData {
  const ticked = Object.entries(data.expensePaid ?? {}).filter(([, m]) => Object.values(m).some(Boolean));
  if (!ticked.length) return data;
  const asOf = data.settings.cashAsOf;
  const billPayments: Record<string, Record<string, BillPayment[]>> = structuredClone(data.billPayments ?? {});
  const settled = new Set(data.settings.cashSettled ?? []);
  const before = new Set(data.settings.cashPaidAtAsOf ?? []);
  for (const [m, paid] of ticked) {
    for (const [id, isPaid] of Object.entries(paid)) {
      const e = data.expenses.find((x) => x.id === id);
      if (!isPaid || !e || billPayments[m]?.[id]?.length) continue;
      const rec = data.expensePaidFrom?.[m]?.[id];
      const date = rec?.date ?? (asOf && monthOf(asOf) === m ? asOf : `${m}-01`);
      const pid = `legacy-${m}-${id}`;
      (billPayments[m] ??= {})[id] = [{ id: pid, date, at: `${date}T00:00:00.000Z`, amount: e.amount, ...(rec?.accountId && { accountId: rec.accountId }) }];
      if (settled.has(`bill:${m}:${id}`) || (asOf && monthOf(asOf) === m && before.has(id))) settled.add(`billpay:${pid}`);
    }
  }
  return {
    ...data,
    billPayments,
    expensePaid: {},
    expensePaidFrom: {},
    settings: { ...data.settings, cashSettled: [...settled].filter((k) => !k.startsWith("bill:")), cashPaidAtAsOf: [] },
  };
}

export interface HistoryMonth {
  month: string;
  collected: number;
  billsBudget: number;
  billsPaid: number;
  otherSpending: number;
  /** Collected minus everything paid out */
  net: number;
}

/** Month-by-month money in and out, oldest first, ending with `last`. */
export function moneyHistory(data: TrackerData, last: string, months = 6): HistoryMonth[] {
  const out: HistoryMonth[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const month = addMonths(last, -i);
    const s = summarize(data, month);
    const otherSpending = s.totalSpent - s.expensesPaid;
    out.push({ month, collected: s.moneyMade, billsBudget: s.fixedExpenses, billsPaid: s.expensesPaid, otherSpending, net: s.moneyMade - s.totalSpent });
  }
  return out;
}
