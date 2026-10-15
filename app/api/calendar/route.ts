import { NextResponse } from "next/server";
import { eventsBetween } from "@/lib/ical";
import { getCalendarUrl, setCalendarUrl } from "@/lib/store";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
// The feed is fetched at most once a minute per server instance.
let cache: { url: string; at: number; text: string } | null = null;

function normalize(raw: string): string | null {
  const url = raw.trim().replace(/^webcal:\/\//i, "https://");
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

async function fetchFeed(url: string, fresh = false): Promise<string> {
  if (!fresh && cache && cache.url === url && Date.now() - cache.at < 60_000) return cache.text;
  const res = await fetch(url, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`The calendar address answered with error ${res.status}.`);
  const text = await res.text();
  if (!text.includes("BEGIN:VCALENDAR")) throw new Error("That address isn't a calendar feed. Copy the one that ends in .ics.");
  cache = { url, at: Date.now(), text };
  return text;
}

// Events from the owner's linked calendar between two dates, in their time zone.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const from = q.get("from") ?? "";
  const to = q.get("to") ?? "";
  const tz = q.get("tz") || "UTC";
  if (!DATE.test(from) || !DATE.test(to)) return NextResponse.json({ error: "Bad dates" }, { status: 400 });
  const url = await getCalendarUrl();
  if (!url) return NextResponse.json({ connected: false, events: [] });
  try {
    return NextResponse.json({ connected: true, events: eventsBetween(await fetchFeed(url), from, to, tz) });
  } catch (e) {
    return NextResponse.json({ connected: true, events: [], error: e instanceof Error ? e.message : "Couldn't read the calendar." });
  }
}

// Saves (or clears) the calendar address after checking it really is a calendar feed.
export async function POST(req: Request) {
  const { url } = (await req.json()) as { url: string | null };
  if (!url) {
    await setCalendarUrl(null);
    cache = null;
    return NextResponse.json({ ok: true });
  }
  const clean = normalize(url);
  if (!clean) return NextResponse.json({ error: "Paste the full address, starting with https://" }, { status: 400 });
  try {
    await fetchFeed(clean, true);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't read that calendar." }, { status: 400 });
  }
  await setCalendarUrl(clean);
  return NextResponse.json({ ok: true });
}
