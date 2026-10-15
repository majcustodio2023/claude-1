// Builds an iCalendar feed of the app's missions so a calendar app (Google, Outlook, Apple)
// can subscribe to it. Read-only on their side.
import type { TrackerData } from "./types";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines longer than 75 bytes continue on the next line after a space (RFC 5545). */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const compact = (date: string) => date.replace(/-/g, "");
const nextDay = (date: string) => {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const stampNow = (now: Date) => now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");

interface FeedEvent {
  uid: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
}

/** Missions and client tasks that have a date, as an .ics calendar in the owner's time zone. */
export function missionsFeed(data: TrackerData, tz: string, now = new Date()): string {
  const name = data.settings.businessName ? `${data.settings.businessName} missions` : "Tracker missions";
  const events: FeedEvent[] = [];
  for (const t of data.tasks) {
    if (!t.dueDate || t.quadrant === "eliminate") continue;
    events.push({ uid: `task-${t.id}`, title: t.done ? `Done: ${t.title}` : t.title, date: t.dueDate, time: t.time, description: [t.owner && `Who: ${t.owner}`, t.details].filter(Boolean).join("\n") });
  }
  for (const t of data.clientTasks ?? []) {
    if (!t.dueDate) continue;
    const client = data.clients?.find((c) => c.id === t.clientId)?.name;
    const title = client ? `${t.title} (${client})` : t.title;
    events.push({ uid: `ctask-${t.id}`, title: t.status === "done" ? `Done: ${title}` : title, date: t.dueDate, description: t.details });
  }
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Agency Tracker//Missions//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${esc(name)}`, `X-WR-TIMEZONE:${tz}`, "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  const stamp = stampNow(now);
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}@agency-tracker`, `DTSTAMP:${stamp}`);
    if (e.time && /^\d{2}:\d{2}$/.test(e.time)) {
      const start = `${compact(e.date)}T${e.time.replace(":", "")}00`;
      lines.push(`DTSTART;TZID=${tz}:${start}`, "DURATION:PT30M");
    } else {
      lines.push(`DTSTART;VALUE=DATE:${compact(e.date)}`, `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`);
    }
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
