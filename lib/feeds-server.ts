import "server-only";
import { sign as signData, createPrivateKey } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { groupOf } from "./adgroups";
import { clientsOf } from "./city";
import { businessDay } from "./cityJobs-server";
import { configureLocale } from "./finance";
import { graphGet } from "./meta";
import { campaignReport } from "./meta-server";
import { allMetaTokens, getAppleKey, getData, setTokenInfo, updateServerData, type AppleKey } from "./store";
import type { FunnelStats, ReportSnapshot, TokenInfo, TrackerData } from "./types";
import { funnelSnapshots, recordFunnelEvent } from "./feeds";
import { parseSalesTsv } from "./appstore";

// Data that doesn't expire. Meta: a Business Manager System User token never expires, and the
// app checks every token daily so you hear about one that will. App Store: an API key (.p8)
// never expires; the app signs a fresh 20-minute pass with it on every pull. Funnels push their
// events to a private inbox address, so there's no token at all. Everything pulled is stored as
// a report snapshot, which is what staff read in meetings and jobs.

/** Asks Meta what a token is and when it stops working. */
export async function checkMetaToken(token: string, source: TokenInfo["source"]): Promise<TokenInfo> {
  const checkedAt = new Date().toISOString();
  try {
    const { data: d } = await graphGet<{ data: { type?: string; is_valid?: boolean; expires_at?: number; data_access_expires_at?: number; error?: { message?: string } } }>(
      `debug_token?input_token=${encodeURIComponent(token)}`,
      token,
    );
    // A token can be endless but still lose data access after 90 days (user tokens); the earlier date is what counts.
    const ends = [d.expires_at, d.data_access_expires_at].filter((x): x is number => Boolean(x && x > 0));
    const expires = ends.length ? new Date(Math.min(...ends) * 1000).toISOString() : "never";
    return { expires, type: d.type, source, valid: d.is_valid !== false, checkedAt, error: d.is_valid === false ? d.error?.message : undefined };
  } catch (e) {
    // Some tokens can't look themselves up; if the token still works, it's valid with an unknown end date.
    try {
      await graphGet("me?fields=id", token);
      return { expires: "", source, valid: true, checkedAt };
    } catch {
      return { expires: "", source, valid: false, checkedAt, error: (e as Error).message };
    }
  }
}

/** Re-checks every saved Meta token. */
export async function recheckTokens(): Promise<Record<string, TokenInfo>> {
  const tokens = await allMetaTokens();
  const out: Record<string, TokenInfo> = {};
  for (const [k, t] of Object.entries(tokens)) out[k] = await checkMetaToken(t, k === "business" ? "business" : "account");
  if (Object.keys(out).length) await setTokenInfo(out);
  return out;
}

// ---------- App Store Connect ----------

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

/** A short-lived pass for the App Store Connect API, signed with your API key (ES256). */
export function appleJwt(key: AppleKey, now = Date.now()): string {
  const head = b64url(JSON.stringify({ alg: "ES256", kid: key.keyId.trim(), typ: "JWT" }));
  const body = b64url(JSON.stringify({ iss: key.issuerId.trim(), iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + 19 * 60, aud: "appstoreconnect-v1" }));
  const pk = createPrivateKey(key.privateKey.includes("BEGIN") ? key.privateKey : `-----BEGIN PRIVATE KEY-----\n${key.privateKey.trim()}\n-----END PRIVATE KEY-----`);
  const sig = signData("sha256", Buffer.from(`${head}.${body}`), { key: pk, dsaEncoding: "ieee-p1363" });
  return `${head}.${body}.${b64url(sig)}`;
}

async function apple(key: AppleKey, path: string, accept = "application/json"): Promise<Response> {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, { headers: { Authorization: `Bearer ${appleJwt(key)}`, Accept: accept }, cache: "no-store" });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { errors?: { detail?: string; title?: string }[] };
    throw new Error(j.errors?.[0]?.detail ?? j.errors?.[0]?.title ?? `App Store Connect error ${res.status}`);
  }
  return res;
}

/** Checks the key works and lists your apps. */
export async function appleApps(key: AppleKey): Promise<string[]> {
  const j = (await (await apple(key, "/v1/apps?fields[apps]=name&limit=50")).json()) as { data: { attributes: { name: string } }[] };
  return j.data.map((a) => a.attributes.name);
}

/** One day's sales summary (downloads and proceeds per app). Apple publishes a day about a day later. */
export async function appleSales(key: AppleKey, day: string): Promise<ReportSnapshot[]> {
  if (!key.vendor?.trim()) return [];
  const q = `filter[frequency]=DAILY&filter[reportSubType]=SUMMARY&filter[reportType]=SALES&filter[vendorNumber]=${encodeURIComponent(key.vendor.trim())}&filter[reportDate]=${day}`;
  const res = await apple(key, `/v1/salesReports?${q}`, "application/a-gzip");
  const rows = parseSalesTsv(gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8"));
  const at = new Date().toISOString();
  return [...rows.entries()].map(([title, r]) => ({
    key: `apple:${title}`,
    source: "apple" as const,
    label: `${title} (App Store)`,
    period: day,
    metrics: { downloads: r.downloads, updates: r.updates, ...Object.fromEntries(Object.entries(r.proceeds).map(([c, v]) => [`proceeds ${c}`, Math.round(v * 100) / 100])) },
    summary: `${title} on ${day}: ${r.downloads} downloads/purchases, ${r.updates} updates${Object.keys(r.proceeds).length ? `, proceeds ${Object.entries(r.proceeds).map(([c, v]) => `${v.toFixed(2)} ${c}`).join(" + ")}` : ""}.`,
    at,
  }));
}

// ---------- the daily pull ----------

const daysAgo = (day: string, n: number) => new Date(Date.parse(day + "T00:00:00Z") - n * 86400000).toISOString().slice(0, 10);

/** Meta: last 7 days per tracked campaign, tagged with the client's building. */
async function metaSnapshots(data: TrackerData): Promise<{ snaps: ReportSnapshot[]; failed: string[] }> {
  const tokens = await allMetaTokens();
  const snaps: ReportSnapshot[] = [];
  const failed: string[] = [];
  for (const t of data.trackedCampaigns) {
    const token = tokens[t.adAccountRef] ?? tokens.business;
    if (!token) continue;
    try {
      const r = await campaignReport(t, data, token, "last_7d");
      const m = r.metrics;
      const cur = r.currency ?? "";
      const g = groupOf(data, t).key;
      const building = g.startsWith("client:") ? data.city?.buildings.find((b) => clientsOf(b).includes(g.slice(7))) : undefined;
      snaps.push({
        key: `meta:${t.id}`,
        source: "meta",
        label: `${t.name} (Meta ads)`,
        period: "last 7 days",
        buildingId: building?.id,
        metrics: { spend: m.spend, results: m.results, cpl: m.cpl ?? 0, ctr: m.ctr, cpm: m.cpm, linkClicks: m.linkClicks, purchases: m.purchases, revenue: m.revenue, roas: m.roas ?? 0 },
        summary: `${t.name}, last 7 days: spent ${m.spend.toFixed(2)} ${cur}, ${m.results} ${m.resultType || "results"}${m.cpl != null ? ` at ${m.cpl.toFixed(2)} ${cur} each` : ""}, link CTR ${m.ctr.toFixed(2)}%, CPM ${m.cpm.toFixed(2)}${m.purchases ? `, ${m.purchases} purchases worth ${m.revenue.toFixed(2)} (ROAS ${m.roas?.toFixed(2) ?? "n/a"})` : ""}.${r.suggestions.length ? ` Flags: ${r.suggestions.slice(0, 3).map((s) => s.title).join("; ")}.` : ""}`,
        at: new Date().toISOString(),
      });
    } catch (e) {
      failed.push(`${t.name}: ${(e as Error).message}`);
    }
  }
  return { snaps, failed };
}

/** Pulls every connected source into stored reports. Run daily by the cron, or from Settings. */
export async function syncReports(): Promise<{ saved: number; failed: string[] }> {
  const data = await getData();
  configureLocale(data.settings);
  const today = businessDay(data);
  await recheckTokens();
  const { snaps, failed } = await metaSnapshots(data);
  const key = await getAppleKey();
  if (key) {
    try {
      snaps.push(...(await appleSales(key, daysAgo(today, 2))));
    } catch (e) {
      failed.push(`App Store: ${(e as Error).message}`);
    }
  }
  const saved = await updateServerData((d) => {
    const fresh = [...snaps, ...funnelSnapshots(d, today)];
    const keys = new Set(fresh.map((s) => s.key));
    d.reports = [...fresh, ...(d.reports ?? []).filter((r) => !keys.has(r.key))].slice(0, 200);
    return fresh.length;
  });
  return { saved, failed };
}

/** Saves one event from the funnel inbox. */
export function saveFunnelEvent(body: Record<string, unknown>): Promise<FunnelStats> {
  return updateServerData((d) => {
    const today = businessDay(d);
    d.funnelStats = recordFunnelEvent(d.funnelStats, body, today);
    // Staff see funnel numbers as they come in, not just after the morning pull.
    const fresh = funnelSnapshots(d, today);
    const keys = new Set(fresh.map((r) => r.key));
    d.reports = [...fresh, ...(d.reports ?? []).filter((r) => !keys.has(r.key))].slice(0, 200);
    return d.funnelStats;
  });
}
