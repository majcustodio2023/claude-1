// Reads an iCalendar (.ics) feed, such as Google Calendar's "secret address in iCal format",
// and lists its events between two dates in the owner's time zone. Read-only.

export interface CalEvent {
  date: string; // YYYY-MM-DD in the target time zone
  time?: string; // HH:MM; blank for all-day events
  endTime?: string;
  title: string;
  location?: string;
  allDay: boolean;
}

interface Prop {
  params: Record<string, string>;
  value: string;
}

interface Stamp {
  y: number;
  m: number; // 1-12
  d: number;
  h: number;
  mi: number;
  s: number;
  dateOnly: boolean;
  utc: boolean;
  tz?: string;
}

interface VEvent {
  uid: string;
  start: Stamp;
  end?: Stamp;
  durationMs?: number;
  title: string;
  location?: string;
  rrule?: Record<string, string>;
  exdates: Stamp[];
  recurrenceId?: Stamp;
  cancelled: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

function unfold(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

function parseLine(line: string): [string, Prop] | null {
  // NAME;PARAM=a;PARAM2="b:c":VALUE (a colon inside quotes isn't the separator)
  let i = 0;
  let quoted = false;
  for (; i < line.length; i++) {
    if (line[i] === '"') quoted = !quoted;
    else if (line[i] === ":" && !quoted) break;
  }
  if (i >= line.length) return null;
  const [name, ...rawParams] = line.slice(0, i).split(";");
  const params: Record<string, string> = {};
  for (const p of rawParams) {
    const eq = p.indexOf("=");
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return [name.toUpperCase(), { params, value: line.slice(i + 1) }];
}

const unescape = (v: string) => v.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim();

function parseStamp(value: string, params: Record<string, string>): Stamp | null {
  const m = value.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const dateOnly = !m[4];
  return {
    y: +m[1], m: +m[2], d: +m[3],
    h: dateOnly ? 0 : +m[4], mi: dateOnly ? 0 : +m[5], s: dateOnly ? 0 : +(m[6] ?? 0),
    dateOnly, utc: Boolean(m[7]), tz: params.TZID,
  };
}

function parseDuration(v: string): number | undefined {
  const m = v.match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return undefined;
  const ms = ((+(m[2] ?? 0) * 7 + +(m[3] ?? 0)) * 86400 + +(m[4] ?? 0) * 3600 + +(m[5] ?? 0) * 60 + +(m[6] ?? 0)) * 1000;
  return m[1] === "-" ? -ms : ms;
}

/** Splits a feed into its events. */
export function parseICS(text: string): VEvent[] {
  const events: VEvent[] = [];
  let cur: (Partial<VEvent> & { exdates: Stamp[] }) | null = null;
  let nested = 0;
  for (const line of unfold(text)) {
    if (line === "BEGIN:VEVENT") {
      cur = { exdates: [], cancelled: false, title: "" };
      continue;
    }
    if (!cur) continue;
    // Skip nested blocks such as VALARM (their SUMMARY isn't the event's).
    if (line.startsWith("BEGIN:")) {
      nested++;
      continue;
    }
    if (nested) {
      if (line.startsWith("END:")) nested--;
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur.start) events.push({ uid: cur.uid ?? "", title: cur.title || "(No title)", ...cur } as VEvent);
      cur = null;
      continue;
    }
    const parsed = parseLine(line);
    if (!parsed) continue;
    const [name, { params, value }] = parsed;
    if (name === "UID") cur.uid = value.trim();
    else if (name === "SUMMARY") cur.title = unescape(value);
    else if (name === "LOCATION") cur.location = unescape(value) || undefined;
    else if (name === "DTSTART") cur.start = parseStamp(value, params) ?? undefined;
    else if (name === "DTEND") cur.end = parseStamp(value, params) ?? undefined;
    else if (name === "DURATION") cur.durationMs = parseDuration(value.trim());
    else if (name === "STATUS") cur.cancelled = value.trim().toUpperCase() === "CANCELLED";
    else if (name === "RECURRENCE-ID") cur.recurrenceId = parseStamp(value, params) ?? undefined;
    else if (name === "EXDATE") for (const v of value.split(",")) {
      const s = parseStamp(v, params);
      if (s) cur.exdates.push(s);
    }
    else if (name === "RRULE") cur.rrule = Object.fromEntries(value.split(";").map((kv) => kv.split("=")).filter((kv) => kv.length === 2).map(([k, v]) => [k.toUpperCase(), v.toUpperCase()]));
  }
  return events;
}

// ---- time zones ----

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function zoneFmt(tz: string): Intl.DateTimeFormat | null {
  if (!fmtCache.has(tz)) {
    try {
      fmtCache.set(tz, new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      return null;
    }
  }
  return fmtCache.get(tz)!;
}

/** Wall-clock parts of an instant in a time zone. */
function partsIn(ms: number, tz: string) {
  const f = zoneFmt(tz);
  if (!f) {
    const d = new Date(ms);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds() };
  }
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second };
}

/** The instant a wall-clock time in a zone happens. Unknown zones are read as UTC. */
function zonedToMs(y: number, m: number, d: number, h: number, mi: number, s: number, tz: string): number {
  const guess = Date.UTC(y, m - 1, d, h, mi, s);
  if (!zoneFmt(tz)) return guess;
  const off = (ms: number) => {
    const p = partsIn(ms, tz);
    return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - ms;
  };
  let ms = guess - off(guess);
  ms = guess - off(ms);
  return ms;
}

// ---- recurrence ----

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const MAX_STEPS = 5000;

type YMD = { y: number; m: number; d: number };
const ymdNum = (a: YMD) => a.y * 10000 + a.m * 100 + a.d;
const dim = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const addDays = (a: YMD, n: number): YMD => {
  const t = new Date(Date.UTC(a.y, a.m - 1, a.d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
};
const weekday = (a: YMD) => new Date(Date.UTC(a.y, a.m - 1, a.d)).getUTCDay();

/** Days in a month matching BYDAY entries like "MO", "2TU", "-1FR". */
function byDayInMonth(y: number, m: number, codes: string[]): number[] {
  const out: number[] = [];
  const n = dim(y, m);
  for (const code of codes) {
    const mm = code.match(/^([+-]?\d+)?([A-Z]{2})$/);
    if (!mm) continue;
    const wd = DAY_CODES.indexOf(mm[2]);
    const days = [];
    for (let d = 1; d <= n; d++) if (weekday({ y, m, d }) === wd) days.push(d);
    if (!mm[1]) out.push(...days);
    else {
      const k = +mm[1];
      const pick = k > 0 ? days[k - 1] : days[days.length + k];
      if (pick) out.push(pick);
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

/** Start dates (in the event's own calendar) of every occurrence up to `lastDay`. */
function occurrenceDates(ev: VEvent, lastDay: YMD, untilMs: (day: YMD) => boolean): YMD[] {
  const s = ev.start;
  const first: YMD = { y: s.y, m: s.m, d: s.d };
  const r = ev.rrule;
  if (!r) return [first];
  const interval = Math.max(+(r.INTERVAL ?? 1) || 1, 1);
  const count = r.COUNT ? +r.COUNT : Infinity;
  const byDay = r.BYDAY ? r.BYDAY.split(",") : [];
  const byMonthDay = r.BYMONTHDAY ? r.BYMONTHDAY.split(",").map(Number) : [];
  const out: YMD[] = [];
  let made = 0;
  const take = (day: YMD) => {
    if (ymdNum(day) < ymdNum(first)) return true;
    if (made >= count || untilMs(day)) return false;
    made++;
    out.push(day);
    return true;
  };
  const end = ymdNum(lastDay);
  for (let step = 0; step < MAX_STEPS; step++) {
    let batch: YMD[] = [];
    if (r.FREQ === "DAILY") batch = [addDays(first, step * interval)];
    else if (r.FREQ === "WEEKLY") {
      const monday = addDays(first, -((weekday(first) + 6) % 7) + step * 7 * interval);
      const wds = byDay.length ? byDay.map((c) => DAY_CODES.indexOf(c.slice(-2))) : [weekday(first)];
      batch = [...new Set(wds)].map((wd) => addDays(monday, (wd + 6) % 7)).sort((a, b) => ymdNum(a) - ymdNum(b));
    } else if (r.FREQ === "MONTHLY") {
      const mi = first.m - 1 + step * interval;
      const y = first.y + Math.floor(mi / 12);
      const m = (mi % 12) + 1;
      const n = dim(y, m);
      const days = byDay.length ? byDayInMonth(y, m, byDay) : byMonthDay.length ? byMonthDay.map((d) => (d < 0 ? n + d + 1 : d)).filter((d) => d >= 1 && d <= n) : first.d <= n ? [first.d] : [];
      batch = days.sort((a, b) => a - b).map((d) => ({ y, m, d }));
    } else if (r.FREQ === "YEARLY") {
      const y = first.y + step * interval;
      if (first.d <= dim(y, first.m)) batch = [{ y, m: first.m, d: first.d }];
    } else return [first];
    if (!batch.length) continue;
    if (ymdNum(batch[0]) > end) break;
    for (const day of batch) {
      if (ymdNum(day) > end) break;
      if (!take(day)) return out;
    }
  }
  return out;
}

const stampKey = (s: Stamp) => `${s.y}${pad(s.m)}${pad(s.d)}${s.dateOnly ? "" : `T${pad(s.h)}${pad(s.mi)}`}`;

/** Events between two dates (inclusive, YYYY-MM-DD) shown in time zone `tz`. */
export function eventsBetween(text: string, from: string, to: string, tz: string): CalEvent[] {
  const events = parseICS(text).filter((e) => !e.cancelled || e.recurrenceId);
  // Moved or cancelled single occurrences of a repeating event replace the original.
  const overridden = new Set(events.filter((e) => e.recurrenceId).map((e) => `${e.uid}|${stampKey(e.recurrenceId!)}`));
  const [ty, tm, td] = to.split("-").map(Number);
  // Look a little past the range on both sides so time zone shifts don't drop events.
  const lastDay = addDays({ y: ty, m: tm, d: td }, 2);
  const out: CalEvent[] = [];
  const toLocal = (ms: number) => {
    const p = partsIn(ms, tz);
    return { date: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.mi)}` };
  };
  for (const ev of events) {
    if (ev.cancelled) continue;
    const s = ev.start;
    const srcTz = s.utc ? "UTC" : (s.tz ?? tz);
    const startMs = (day: YMD) => zonedToMs(day.y, day.m, day.d, s.h, s.mi, s.s, srcTz);
    const until = ev.rrule?.UNTIL ? parseStamp(ev.rrule.UNTIL, {}) : null;
    const untilMs = until ? (until.utc ? Date.UTC(until.y, until.m - 1, until.d, until.h, until.mi, until.s) : zonedToMs(until.y, until.m, until.d, until.dateOnly ? 23 : until.h, until.dateOnly ? 59 : until.mi, until.dateOnly ? 59 : until.s, srcTz)) : Infinity;
    const excluded = new Set(ev.exdates.map((x) => `${x.y}${pad(x.m)}${pad(x.d)}`));
    const durMs = ev.end
      ? (ev.end.dateOnly ? Date.UTC(ev.end.y, ev.end.m - 1, ev.end.d) - Date.UTC(s.y, s.m - 1, s.d) : zonedToMs(ev.end.y, ev.end.m, ev.end.d, ev.end.h, ev.end.mi, ev.end.s, ev.end.utc ? "UTC" : (ev.end.tz ?? srcTz)) - startMs(s))
      : (ev.durationMs ?? (s.dateOnly ? 86400000 : 0));
    const days = occurrenceDates(ev, lastDay, (day) => (s.dateOnly ? Date.UTC(day.y, day.m - 1, day.d) : startMs(day)) > untilMs);
    for (const day of days) {
      const key = `${day.y}${pad(day.m)}${pad(day.d)}`;
      if (excluded.has(key)) continue;
      if (!ev.recurrenceId && ev.rrule && overridden.has(`${ev.uid}|${s.dateOnly ? key : `${key}T${pad(s.h)}${pad(s.mi)}`}`)) continue;
      if (s.dateOnly) {
        // All-day: one entry per day it covers (DTEND is the day after).
        const span = Math.max(Math.round(durMs / 86400000), 1);
        for (let i = 0; i < span; i++) {
          const dd = addDays(day, i);
          const date = `${dd.y}-${pad(dd.m)}-${pad(dd.d)}`;
          if (date >= from && date <= to) out.push({ date, title: ev.title, location: ev.location, allDay: true });
        }
      } else {
        const ms = startMs(day);
        const a = toLocal(ms);
        if (a.date < from || a.date > to) continue;
        const b = durMs > 0 ? toLocal(ms + durMs) : null;
        out.push({ date: a.date, time: a.time, endTime: b && b.date === a.date ? b.time : undefined, title: ev.title, location: ev.location, allDay: false });
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""));
}
