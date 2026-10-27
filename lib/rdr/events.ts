// Events with Boss RDR. The page never shows an expired date: it picks the next
// event whose end (or start) is still ahead of "now" in Manila time.

export interface RdrEvent {
  title: string;
  /** ISO date or datetime, e.g. "2026-11-22" or "2026-11-22T13:00:00+08:00". */
  start: string;
  /** Optional end; when absent the event is treated as a one-day event. */
  end?: string;
  city: string;
  venue?: string;
  /** Where to register or learn more. */
  url: string;
  note?: string;
}

/**
 * Keep this list current. Past events are ignored automatically, so nothing needs
 * to be deleted; the page simply shows the next one, or a "no event announced yet"
 * state when the list runs out.
 */
export const events: RdrEvent[] = [];

const MANILA = "Asia/Manila";

function endOf(e: RdrEvent): number {
  const raw = e.end ?? e.start;
  // A bare date lasts the whole day in Manila (UTC+8, no DST).
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return Date.parse(`${raw}T23:59:59+08:00`);
  return Date.parse(raw);
}

export function nextEvent(list: RdrEvent[] = events, now: number = Date.now()): RdrEvent | null {
  const upcoming = list
    .filter((e) => Number.isFinite(endOf(e)) && endOf(e) >= now)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  return upcoming[0] ?? null;
}

export function formatEventDate(e: RdrEvent): string {
  const start = new Date(/^\d{4}-\d{2}-\d{2}$/.test(e.start) ? `${e.start}T12:00:00+08:00` : e.start);
  const opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: MANILA };
  let out = new Intl.DateTimeFormat("en-PH", opts).format(start);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.start)) {
    out += `, ${new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: MANILA }).format(start)}`;
  }
  return out;
}
