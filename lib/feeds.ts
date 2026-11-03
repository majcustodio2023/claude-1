// The funnel inbox: funnel tools (GoHighLevel, ClickFunnels, Systeme, Zapier, Make…) send each
// opt-in, booking or sale to the tracker's private address. Nothing to log into and nothing that
// expires. Pure, so it's unit-tested.

import type { CityBuilding, FunnelStats, ReportSnapshot, StaffRoleId, TrackerData } from "./types";

const pick = (body: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) {
    const v = body[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
};

const clean = (s: string, max = 60) => s.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/** Adds one event. Understands common field names: funnel/funnel_name/source, event/type/stage, value/amount/revenue. */
export function recordFunnelEvent(stats: FunnelStats | undefined, body: Record<string, unknown>, day: string, at = new Date().toISOString()): FunnelStats {
  const funnel = clean(pick(body, ["funnel", "funnel_name", "funnelName", "source", "page", "campaign"]) || "Funnel");
  const event = clean(pick(body, ["event", "type", "stage", "status", "action"]) || "lead", 40).toLowerCase();
  const value = Number(pick(body, ["value", "amount", "revenue", "price", "total"]).replace(/[^0-9.-]/g, "")) || 0;
  const detail = clean(pick(body, ["name", "email", "product", "offer"]), 80) || undefined;
  const next: FunnelStats = { days: { ...(stats?.days ?? {}) }, recent: [...(stats?.recent ?? [])] };
  const days = { ...(next.days[funnel] ?? {}) };
  const d = days[day] ? { events: { ...days[day].events }, value: days[day].value } : { events: {}, value: 0 };
  d.events[event] = (d.events[event] ?? 0) + 1;
  d.value = Math.round((d.value + value) * 100) / 100;
  days[day] = d;
  // Keep about four months per funnel.
  next.days[funnel] = Object.fromEntries(Object.entries(days).sort(([a], [b]) => b.localeCompare(a)).slice(0, 120));
  next.recent = [{ funnel, event, value: value || undefined, at, detail }, ...next.recent].slice(0, 30);
  return next;
}

/** Last 7 days per funnel, as stored reports. */
export function funnelSnapshots(data: Pick<TrackerData, "funnelStats">, today: string): ReportSnapshot[] {
  const from = new Date(Date.parse(today + "T00:00:00Z") - 6 * 86400000).toISOString().slice(0, 10);
  const out: ReportSnapshot[] = [];
  for (const [funnel, days] of Object.entries(data.funnelStats?.days ?? {})) {
    const totals: Record<string, number> = {};
    let value = 0;
    for (const [day, d] of Object.entries(days)) {
      if (day < from || day > today) continue;
      for (const [e, n] of Object.entries(d.events)) totals[e] = (totals[e] ?? 0) + n;
      value += d.value;
    }
    const parts = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([e, n]) => `${n} ${e}`);
    out.push({
      key: `funnel:${funnel}`,
      source: "funnel",
      label: `${funnel} (funnel)`,
      period: "last 7 days",
      metrics: { ...totals, value: Math.round(value * 100) / 100 },
      summary: `${funnel}, last 7 days: ${parts.join(", ") || "no events"}${value ? `, value ${value.toFixed(2)}` : ""}.`,
      at: new Date().toISOString(),
    });
  }
  return out;
}

/** What a stored report is worth to staff: the summary, and how old it is. */
export function reportLines(reports: ReportSnapshot[], today: string): string[] {
  return reports.map((r) => `- ${r.summary} (stored ${r.at.slice(0, 10) === today ? "today" : r.at.slice(0, 10)})`);
}

/** Days until a token stops working (negative = already stopped), or null for never. */
export function daysLeft(expires: string, now = Date.now()): number | null {
  if (!expires || expires === "never") return null;
  return Math.floor((Date.parse(expires) - now) / 86400000);
}

/** Stored reports a staff member should know: their building's, plus funnels for funnel and
 *  acquisition staff, App Store for app staff, and everything for ads staff and reporters. */
export function reportsFor(data: Pick<TrackerData, "reports">, b: Pick<CityBuilding, "id" | "kind"> | undefined, role?: StaffRoleId): ReportSnapshot[] {
  return (data.reports ?? []).filter(
    (r) =>
      (b && r.buildingId === b.id) ||
      (r.source === "funnel" && (role === "funnel" || role === "adsTracker" || b?.kind === "acquisition")) ||
      (r.source === "apple" && (role === "app" || role === "store")) ||
      (r.source === "meta" && !r.buildingId && (role === "ads" || role === "adsTracker")),
  );
}
