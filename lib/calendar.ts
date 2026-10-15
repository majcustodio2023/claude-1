import { billPaid, dealBalance, expectedForStream, expenseAppliesTo, streamDone } from "./finance";
import type { TrackerData } from "./types";

/** One thing on the calendar. Money items carry an amount; tasks link back to their mission. */
export interface CalItem {
  id: string;
  date: string; // YYYY-MM-DD
  kind: "pay" | "bill" | "deal" | "task" | "clientTask" | "google";
  title: string;
  amount?: number;
  time?: string; // HH:MM
  /** Paid, collected, finished. */
  done?: boolean;
  /** Mission or client task id, for ticking it off from the calendar. */
  ref?: string;
  /** Google event details */
  location?: string;
  allDay?: boolean;
}

export const daysInMonth = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

/** The date a "day of the month" falls on in a month; day 31 in a 30-day month is the 30th. */
export function dayOf(month: string, day: number): string {
  const d = Math.min(Math.max(Math.round(day), 1), daysInMonth(month));
  return `${month}-${String(d).padStart(2, "0")}`;
}

/** "1st", "2nd", "15th"… */
export function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${s}`;
}

/** Pay days, bill due days, deal close dates and scheduled missions for one month. */
export function calendarItems(data: TrackerData, month: string): CalItem[] {
  const items: CalItem[] = [];
  const sm = data.streamMonths[month] ?? {};
  for (const s of data.streams) {
    if (!s.active || !s.payDay) continue;
    const m = sm[s.id];
    items.push({ id: `pay:${s.id}`, date: dayOf(month, s.payDay), kind: "pay", title: s.name, amount: expectedForStream(s, m), done: streamDone(s, m) });
  }
  for (const e of data.expenses) {
    if (!e.dueDay || !expenseAppliesTo(e, month)) continue;
    items.push({ id: `bill:${e.id}`, date: dayOf(month, e.dueDay), kind: "bill", title: e.name, amount: e.amount, done: e.amount > 0 && billPaid(data, month, e) >= e.amount });
  }
  for (const d of data.deals) {
    if (!d.expectedClose?.startsWith(month) || d.failed) continue;
    const left = dealBalance(d);
    items.push({ id: `deal:${d.id}`, date: d.expectedClose, kind: "deal", title: d.name, amount: left || d.value, done: d.stage === "won" && left === 0 });
  }
  for (const t of data.tasks) {
    if (!t.dueDate?.startsWith(month) || t.quadrant === "eliminate") continue;
    items.push({ id: `task:${t.id}`, date: t.dueDate, kind: "task", title: t.title, time: t.time, done: t.done, ref: t.id });
  }
  for (const t of data.clientTasks ?? []) {
    if (!t.dueDate?.startsWith(month)) continue;
    const client = data.clients?.find((c) => c.id === t.clientId)?.name;
    items.push({ id: `ctask:${t.id}`, date: t.dueDate, kind: "clientTask", title: client ? `${t.title} (${client})` : t.title, done: t.status === "done", ref: t.id });
  }
  return sortItems(items);
}

const ORDER: Record<CalItem["kind"], number> = { pay: 0, bill: 1, deal: 2, task: 3, clientTask: 4, google: 5 };

export function sortItems(items: CalItem[]): CalItem[] {
  return items.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "") || ORDER[a.kind] - ORDER[b.kind]);
}

/** Weeks of the month view, Monday first; null pads the days outside the month. */
export function monthGrid(month: string): (string | null)[][] {
  const [y, m] = month.split("-").map(Number);
  const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array(first).fill(null);
  for (let d = 1; d <= daysInMonth(month); d++) cells.push(dayOf(month, d));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
