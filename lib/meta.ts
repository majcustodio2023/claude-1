import { locale, moneyIn } from "./finance";
// Meta Marketing API helpers and the rules that turn ad metrics into suggestions.

export const GRAPH = `https://graph.facebook.com/${process.env.META_API_VERSION ?? "v23.0"}`;

export const DATE_PRESETS = ["today", "yesterday", "last_3d", "last_7d", "last_14d", "last_30d", "this_month", "last_month"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

const INSIGHT_FIELDS = [
  "spend", "impressions", "reach", "frequency", "clicks", "inline_link_clicks", "inline_link_click_ctr", "outbound_clicks",
  "account_currency", "ctr", "cpc", "cpm", "actions", "action_values", "purchase_roas", "video_thruplay_watched_actions",
  "video_p25_watched_actions", "video_p50_watched_actions", "video_p75_watched_actions", "video_p100_watched_actions",
].join(",");
// Lighter field list for daily and breakdown rows.
const SLIM_FIELDS = "spend,impressions,reach,frequency,inline_link_clicks,cpm,actions,action_values";

export const actId = (id: string) => (id.startsWith("act_") ? id : `act_${id.trim()}`);

export async function graphGet<T>(pathAndQuery: string, token: string): Promise<T> {
  const sep = pathAndQuery.includes("?") ? "&" : "?";
  const res = await fetch(`${GRAPH}/${pathAndQuery}${sep}access_token=${encodeURIComponent(token)}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error?.message ?? `Meta API error ${res.status}`);
  return json as T;
}

export async function graphPost(id: string, params: Record<string, string>, token: string) {
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`${GRAPH}/${id}`, { method: "POST", body, cache: "no-store" });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error?.message ?? `Meta API error ${res.status}`);
  return json;
}

export interface CampaignInfo {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

export async function listCampaigns(accountId: string, token: string): Promise<CampaignInfo[]> {
  const r = await graphGet<{ data: CampaignInfo[] }>(
    `${actId(accountId)}/campaigns?fields=id,name,status,effective_status,objective,daily_budget&limit=200`,
    token,
  );
  return r.data;
}

type ActionList = { action_type: string; value: string }[] | undefined;

export interface RawInsight {
  account_currency?: string;
  date_start?: string;
  publisher_platform?: string;
  platform_position?: string;
  age?: string;
  gender?: string;
  outbound_clicks?: ActionList;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  frequency?: string;
  clicks?: string;
  inline_link_clicks?: string;
  inline_link_click_ctr?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: ActionList;
  action_values?: ActionList;
  purchase_roas?: ActionList;
  video_thruplay_watched_actions?: ActionList;
  video_p25_watched_actions?: ActionList;
  video_p50_watched_actions?: ActionList;
  video_p75_watched_actions?: ActionList;
  video_p100_watched_actions?: ActionList;
}

export interface AdSetInfo {
  id: string;
  name: string;
  status?: string;
  effective_status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal?: string;
}

export interface AdInfo {
  id: string;
  name: string;
  adset_id?: string;
  status?: string;
  effective_status: string;
}

/** Everything Meta tells us about one campaign for a date range. Optional parts are empty if Meta refuses them. */
export interface CampaignRaw {
  campaign: RawInsight;
  ads: RawInsight[];
  adsetInsights: RawInsight[];
  adsets: AdSetInfo[];
  adList: AdInfo[];
  daily: RawInsight[];
  placements: RawInsight[];
  demographics: RawInsight[];
  info: CampaignInfo;
  currency?: string;
}

export async function fetchCampaignInsights(campaignId: string, token: string, preset: DatePreset): Promise<CampaignRaw> {
  const range = `date_preset=${preset}`;
  const optional = <T,>(p: Promise<{ data: T[] }>) => p.then((r) => r.data).catch(() => [] as T[]);
  const [campaign, ads, adsets, info, adsetInsights, adList, daily, placements, demographics] = await Promise.all([
    graphGet<{ data: RawInsight[] }>(`${campaignId}/insights?fields=${INSIGHT_FIELDS}&${range}`, token),
    graphGet<{ data: RawInsight[] }>(`${campaignId}/insights?fields=${INSIGHT_FIELDS},ad_id,ad_name,adset_id,adset_name&${range}&level=ad&limit=200`, token),
    graphGet<{ data: AdSetInfo[] }>(`${campaignId}/adsets?fields=id,name,status,effective_status,daily_budget,lifetime_budget,optimization_goal&limit=100`, token),
    graphGet<CampaignInfo>(`${campaignId}?fields=id,name,status,effective_status,objective,daily_budget,lifetime_budget`, token),
    optional(graphGet<{ data: RawInsight[] }>(`${campaignId}/insights?fields=${INSIGHT_FIELDS},adset_id,adset_name&${range}&level=adset&limit=100`, token)),
    optional(graphGet<{ data: AdInfo[] }>(`${campaignId}/ads?fields=id,name,adset_id,status,effective_status&limit=200`, token)),
    optional(graphGet<{ data: RawInsight[] }>(`${campaignId}/insights?fields=${SLIM_FIELDS}&${range}&time_increment=1&limit=100`, token)),
    optional(graphGet<{ data: RawInsight[] }>(`${campaignId}/insights?fields=${SLIM_FIELDS}&${range}&breakdowns=publisher_platform,platform_position&limit=100`, token)),
    optional(graphGet<{ data: RawInsight[] }>(`${campaignId}/insights?fields=${SLIM_FIELDS}&${range}&breakdowns=age,gender&limit=100`, token)),
  ]);
  // Money from Meta is in the ad account's own currency, not the business's.
  const currency = campaign.data[0]?.account_currency ?? ads.data[0]?.account_currency;
  return { campaign: campaign.data[0] ?? {}, ads: ads.data, adsets: adsets.data, info, currency, adsetInsights, adList, daily, placements, demographics };
}

/** Meta stores budgets in the currency's smallest unit: 100 per peso or dollar, 1 per yen. */
export function minorFactor(currency?: string): number {
  if (!currency) return 100;
  try {
    return 10 ** (new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2);
  } catch {
    return 100;
  }
}

/** Campaign spend between two dates (inclusive), in the account's currency. */
export async function fetchSpend(campaignId: string, token: string, since: string, until: string): Promise<number> {
  const range = encodeURIComponent(JSON.stringify({ since, until }));
  const res = await graphGet<{ data: { spend?: string }[] }>(`${campaignId}/insights?fields=spend&time_range=${range}`, token);
  return Number(res.data[0]?.spend ?? 0);
}

// ---------- metrics ----------

const LEAD_TYPES = ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead", "onsite_web_lead"];

function actionValue(list: ActionList, type: string): number {
  return Number(list?.find((a) => a.action_type === type)?.value ?? 0);
}

/** Standard events. Each counts the first matching action type Meta reports, so pixel and app copies aren't added twice. */
export const EVENTS = [
  { id: "landing_page_view", label: "Landing page views", types: ["landing_page_view", "omni_landing_page_view"] },
  { id: "view_content", label: "Viewed content", types: ["omni_view_content", "view_content", "offsite_conversion.fb_pixel_view_content"] },
  { id: "search", label: "Searched", types: ["omni_search", "search", "offsite_conversion.fb_pixel_search"] },
  { id: "add_to_cart", label: "Added to cart", types: ["omni_add_to_cart", "add_to_cart", "offsite_conversion.fb_pixel_add_to_cart"] },
  { id: "initiate_checkout", label: "Started checkout", types: ["omni_initiated_checkout", "initiate_checkout", "offsite_conversion.fb_pixel_initiate_checkout"] },
  { id: "add_payment_info", label: "Added payment info", types: ["omni_add_payment_info", "add_payment_info", "offsite_conversion.fb_pixel_add_payment_info"] },
  { id: "purchase", label: "Purchases", types: ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"] },
  { id: "lead", label: "Leads", types: LEAD_TYPES },
  { id: "complete_registration", label: "Registrations", types: ["omni_complete_registration", "complete_registration", "offsite_conversion.fb_pixel_complete_registration"] },
  { id: "schedule", label: "Booked calls", types: ["schedule_total", "schedule_website", "schedule"] },
  { id: "submit_application", label: "Applications", types: ["submit_application_total", "submit_application_website", "submit_application"] },
  { id: "contact", label: "Contacts", types: ["contact_total", "contact_website", "contact"] },
  { id: "messages", label: "Chats started", types: ["onsite_conversion.messaging_conversation_started_7d"] },
] as const;
export type EventId = (typeof EVENTS)[number]["id"];

/** Events that only a website pixel can report. */
const PIXEL_EVENTS: EventId[] = ["view_content", "search", "add_to_cart", "initiate_checkout", "add_payment_info", "purchase", "complete_registration", "schedule", "submit_application", "contact"];

const firstOf = (list: ActionList, types: readonly string[]) => {
  for (const t of types) {
    const v = actionValue(list, t);
    if (v > 0) return v;
  }
  return 0;
};

export interface Metrics {
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  linkClicks: number;
  outboundClicks: number;
  ctr: number; // link CTR, %
  ctrAll: number; // all clicks ÷ impressions, %
  cpc: number;
  cpm: number;
  lpv: number; // landing page views
  lpvRate: number | null; // landing page views ÷ link clicks, %
  costPerLpv: number | null;
  results: number;
  resultType: string;
  cpl: number | null;
  /** results ÷ landing page views (or link clicks when there are none), % */
  cvr: number | null;
  revenue: number;
  roas: number | null;
  purchases: number;
  aov: number | null;
  videoViews3s: number;
  thruplays: number;
  hookRate: number | null; // 3s views / impressions, %
  holdRate: number | null; // thruplays / 3s views, %
  /** Video watched to 25/50/75/100%, as % of 3-second views */
  watched: [number, number, number, number] | null;
  events: Partial<Record<EventId, number>>;
  /** Every action Meta reported, raw */
  actions: { type: string; value: number }[];
}

export function toMetrics(r: RawInsight, resultAction?: string): Metrics {
  const n = (v?: string) => Number(v ?? 0);
  const spend = n(r.spend);
  const impressions = n(r.impressions);
  const linkClicks = n(r.inline_link_clicks);
  const resultType = resultAction || LEAD_TYPES.find((t) => actionValue(r.actions, t) > 0) || "lead";
  const results = actionValue(r.actions, resultType);
  const roasEntry = r.purchase_roas?.[0];
  const revenue = firstOf(r.action_values, EVENTS.find((e) => e.id === "purchase")!.types);
  const videoViews3s = actionValue(r.actions, "video_view");
  const thruplays = Number(r.video_thruplay_watched_actions?.[0]?.value ?? 0);
  const events: Partial<Record<EventId, number>> = {};
  for (const e of EVENTS) {
    const v = firstOf(r.actions, e.types);
    if (v) events[e.id] = v;
  }
  const lpv = events.landing_page_view ?? 0;
  const purchases = events.purchase ?? 0;
  const p = (l?: ActionList) => Number(l?.[0]?.value ?? 0);
  const quartiles = [p(r.video_p25_watched_actions), p(r.video_p50_watched_actions), p(r.video_p75_watched_actions), p(r.video_p100_watched_actions)];
  const base = lpv || linkClicks;
  return {
    spend,
    impressions,
    reach: n(r.reach),
    frequency: n(r.frequency),
    clicks: n(r.clicks),
    linkClicks,
    outboundClicks: p(r.outbound_clicks),
    ctr: r.inline_link_click_ctr ? n(r.inline_link_click_ctr) : impressions ? (linkClicks / impressions) * 100 : 0,
    ctrAll: r.ctr ? n(r.ctr) : impressions ? (n(r.clicks) / impressions) * 100 : 0,
    cpc: linkClicks ? spend / linkClicks : 0,
    cpm: r.cpm ? n(r.cpm) : impressions ? (spend / impressions) * 1000 : 0,
    lpv,
    lpvRate: linkClicks && lpv ? (lpv / linkClicks) * 100 : null,
    costPerLpv: lpv ? spend / lpv : null,
    results,
    resultType,
    cpl: results ? spend / results : null,
    cvr: results && base ? (results / base) * 100 : null,
    revenue,
    roas: roasEntry ? Number(roasEntry.value) : revenue && spend ? revenue / spend : null,
    purchases,
    aov: purchases && revenue ? revenue / purchases : null,
    videoViews3s,
    thruplays,
    hookRate: videoViews3s && impressions ? (videoViews3s / impressions) * 100 : null,
    holdRate: videoViews3s ? (thruplays / videoViews3s) * 100 : null,
    watched: videoViews3s && quartiles[0] ? (quartiles.map((q) => (q / videoViews3s) * 100) as Metrics["watched"]) : null,
    events,
    actions: (r.actions ?? []).map((a) => ({ type: a.action_type, value: Number(a.value) })).filter((a) => a.value > 0),
  };
}

// ---------- funnel, breakdowns, trend ----------

export interface FunnelStep {
  id: string;
  label: string;
  count: number;
  /** % of the step before it */
  rate: number | null;
  cost: number | null;
  /** below `low` is a leak, at or above `good` is healthy */
  bench?: { low: number; good: number };
}

const STEP_BENCH: Record<string, { low: number; good: number }> = {
  link_click: { low: 0.8, good: 1.5 },
  landing_page_view: { low: 60, good: 80 },
  add_to_cart: { low: 5, good: 12 },
  initiate_checkout: { low: 30, good: 50 },
  purchase: { low: 30, good: 50 },
  lead: { low: 5, good: 12 },
  complete_registration: { low: 5, good: 12 },
};

/** Impressions → clicks → page views → each pixel event that fired, in buying order. */
export function buildFunnel(m: Metrics): FunnelStep[] {
  const raw: { id: string; label: string; count: number }[] = [
    { id: "impressions", label: "Impressions", count: m.impressions },
    { id: "link_click", label: "Link clicks", count: m.linkClicks },
  ];
  for (const e of EVENTS) {
    const count = m.events[e.id] ?? 0;
    if (count > 0 && e.id !== "search") raw.push({ id: e.id, label: e.label, count });
  }
  if (m.results > 0 && !EVENTS.some((e) => (e.types as readonly string[]).includes(m.resultType))) raw.push({ id: m.resultType, label: `Results (${m.resultType})`, count: m.results });
  return raw.map((s, i) => ({
    ...s,
    rate: i === 0 || !raw[i - 1].count ? null : (s.count / raw[i - 1].count) * 100,
    cost: i === 0 || !s.count ? null : m.spend / s.count,
    bench: STEP_BENCH[s.id],
  }));
}

export interface SliceRow {
  key: string;
  label: string;
  spend: number;
  share: number; // % of total spend
  impressions: number;
  linkClicks: number;
  ctr: number;
  cpm: number;
  results: number;
  cpl: number | null;
}

const PLACEMENT_NAMES: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", messenger: "Messenger", audience_network: "Audience Network", threads: "Threads" };

function slices(rows: RawInsight[], key: (r: RawInsight) => string, label: (r: RawInsight) => string, resultType: string): SliceRow[] {
  const total = rows.reduce((a, r) => a + Number(r.spend ?? 0), 0);
  return rows
    .map((r) => {
      const m = toMetrics(r, resultType);
      return { key: key(r), label: label(r), spend: m.spend, share: total ? (m.spend / total) * 100 : 0, impressions: m.impressions, linkClicks: m.linkClicks, ctr: m.ctr, cpm: m.cpm, results: m.results, cpl: m.cpl };
    })
    .filter((r) => r.spend > 0 || r.results > 0)
    .sort((a, b) => b.spend - a.spend);
}

export interface DayPoint {
  date: string;
  spend: number;
  impressions: number;
  ctr: number;
  cpm: number;
  results: number;
  cpl: number | null;
}

export interface AdSetRow {
  id: string;
  name: string;
  status: string;
  /** daily budget in major units (pesos), when the ad set has one */
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  goal?: string;
  m: Metrics;
}

export interface AdRow {
  id: string;
  name: string;
  adsetId?: string;
  adsetName?: string;
  status?: string;
  m: Metrics;
}

export interface CampaignReport {
  campaign: CampaignInfo;
  currency?: string;
  /** campaign daily budget in major units, when the campaign holds the budget */
  dailyBudget: number | null;
  metrics: Metrics;
  ads: AdRow[];
  adsets: AdSetRow[];
  funnel: FunnelStep[];
  placements: SliceRow[];
  demographics: SliceRow[];
  trend: DayPoint[];
}

const titleCase = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Turns Meta's raw rows into one report. Pure, so it's testable. */
export function buildReport(raw: CampaignRaw, resultAction?: string): CampaignReport {
  const metrics = toMetrics(raw.campaign, resultAction);
  const rt = metrics.resultType;
  const factor = minorFactor(raw.currency);
  const budget = (v?: string) => (v && Number(v) > 0 ? Number(v) / factor : null);
  const statusOf = new Map(raw.adList.map((a) => [a.id, a.effective_status]));

  const ads: AdRow[] = raw.ads.map((a) => ({ id: a.ad_id!, name: a.ad_name ?? a.ad_id!, adsetId: a.adset_id, adsetName: a.adset_name, status: statusOf.get(a.ad_id!), m: toMetrics(a, rt) }));
  // Ads with no delivery in the range still belong in the list, so they can be managed.
  const adsetName = new Map(raw.adsets.map((s) => [s.id, s.name]));
  for (const a of raw.adList) {
    if (!ads.some((x) => x.id === a.id)) ads.push({ id: a.id, name: a.name, adsetId: a.adset_id, adsetName: a.adset_id ? adsetName.get(a.adset_id) : undefined, status: a.effective_status, m: toMetrics({}, rt) });
  }

  const adsetInsight = new Map(raw.adsetInsights.map((r) => [r.adset_id, r]));
  const adsets: AdSetRow[] = raw.adsets.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.effective_status,
    dailyBudget: budget(s.daily_budget),
    lifetimeBudget: budget(s.lifetime_budget),
    goal: s.optimization_goal,
    m: toMetrics(adsetInsight.get(s.id) ?? {}, rt),
  }));

  const trend = raw.daily
    .map((d) => {
      const m = toMetrics(d, rt);
      return { date: d.date_start ?? "", spend: m.spend, impressions: m.impressions, ctr: m.ctr, cpm: m.cpm, results: m.results, cpl: m.cpl };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    campaign: raw.info,
    currency: raw.currency,
    dailyBudget: budget(raw.info.daily_budget),
    metrics,
    ads,
    adsets,
    funnel: buildFunnel(metrics),
    placements: slices(
      raw.placements,
      (r) => `${r.publisher_platform}:${r.platform_position}`,
      (r) => `${PLACEMENT_NAMES[r.publisher_platform ?? ""] ?? titleCase(r.publisher_platform ?? "Other")} ${(r.platform_position ?? "").replace(/^(facebook|instagram)_/, "").replace(/_/g, " ")}`.trim(),
      rt,
    ),
    demographics: slices(
      raw.demographics,
      (r) => `${r.gender}:${r.age}`,
      (r) => `${r.gender === "male" ? "Men" : r.gender === "female" ? "Women" : "Unknown"} ${r.age}`,
      rt,
    ),
    trend,
  };
}

// ---------- suggestions ----------

export interface SuggestedAction {
  type: "pause" | "resume" | "budget";
  targetId: string;
  targetName: string;
  level: "ad" | "adset" | "campaign";
  /** budget actions: new daily budget in major currency units (e.g. pesos) */
  newDailyBudget?: number;
  /** the ad account's currency code, for showing the budget */
  currency?: string;
}

export interface Suggestion {
  severity: "good" | "info" | "warn" | "bad";
  /** what part of the account it's about, for grouping */
  area?: "results" | "creative" | "funnel" | "pixel" | "audience" | "trend" | "structure";
  title: string;
  detail: string;
  action?: SuggestedAction;
}

export interface Targets {
  cpl: number;
  roas: number;
  /** % to raise or cut a budget by (default 20) */
  scaleStep?: number;
  /** pause an ad once it spends this many times the target cost per result with no results (default 1.5) */
  killAt?: number;
}

export function analyze(
  m: Metrics,
  ads: AdRow[],
  adsets: AdSetInfo[],
  campaign: { id: string; name: string; daily_budget?: string },
  targets: Targets,
  currency?: string,
): Suggestion[] {
  const fmt = (n: number) => moneyIn(n, currency);
  const out: Suggestion[] = [];
  const { cpl: targetCpl, roas: targetRoas } = targets;
  const step = (targets.scaleStep ?? 20) / 100;
  const killAt = targets.killAt ?? 1.5;
  const factor = minorFactor(currency);

  if (m.spend === 0) {
    return [{ severity: "info", area: "results", title: "No spend in this period", detail: "Nothing to analyze yet. Check that the campaign is active and has budget." }];
  }

  // Budget lives on the campaign (CBO) or on each ad set.
  const budgetTarget = (mult: number): SuggestedAction | undefined => {
    if (campaign.daily_budget) {
      return { type: "budget", level: "campaign", targetId: campaign.id, targetName: campaign.name, newDailyBudget: Math.round((Number(campaign.daily_budget) / factor) * mult) };
    }
    const active = adsets.filter((a) => a.daily_budget && a.effective_status === "ACTIVE");
    if (active.length === 1) {
      const a = active[0];
      return { type: "budget", level: "adset", targetId: a.id, targetName: a.name, newDailyBudget: Math.round((Number(a.daily_budget) / factor) * mult) };
    }
    return undefined;
  };

  // Cost per result
  if (m.results === 0 && m.spend >= targetCpl * 2) {
    out.push({
      severity: "bad",
      area: "results",
      title: `${fmt(m.spend)} spent with no results`,
      detail: `No ${m.resultType} events recorded. Check the form or pixel is firing, then refresh the creative or offer before spending more.`,
    });
  } else if (m.cpl != null) {
    if (m.cpl > targetCpl * 1.3) {
      out.push({
        severity: "bad",
        area: "results",
        title: `Cost per result ${fmt(m.cpl)} is above target (${fmt(targetCpl)})`,
        detail: "Cut the weakest ads (below), test new hooks, and hold budget until it comes back under target.",
        action: m.cpl > targetCpl * 1.6 ? budgetTarget(1 - step) : undefined,
      });
    } else if (m.cpl <= targetCpl * 0.8 && m.results >= 5) {
      out.push({
        severity: "good",
        area: "results",
        title: `Cost per result ${fmt(m.cpl)} beats target (${fmt(targetCpl)})`,
        detail: `This is working. Scale budget about ${Math.round(step * 100)}% every 2–3 days while cost per result stays under target.`,
        action: budgetTarget(1 + step),
      });
    } else {
      out.push({ severity: "info", area: "results", title: `Cost per result ${fmt(m.cpl)} is near target`, detail: "Hold budget steady and keep testing new creatives against the current winner." });
    }
  }

  if (m.roas != null && m.roas > 0) {
    out.push(
      m.roas < targetRoas
        ? { severity: "warn", area: "results", title: `ROAS ${m.roas.toFixed(2)}x is below ${targetRoas}x`, detail: "Revenue tracked from ads is not covering the target. Review offer, landing page and audience quality." }
        : { severity: "good", area: "results", title: `ROAS ${m.roas.toFixed(2)}x meets target`, detail: "Profitable on tracked revenue. Safe to scale gradually." },
    );
  }

  if (m.impressions > 1000 && m.ctr < 0.8) {
    out.push({ severity: "warn", area: "creative", title: `Link CTR is low (${m.ctr.toFixed(2)}%)`, detail: "People see the ad but don't click. Test a stronger first line, a clearer offer, and a direct call to action." });
  } else if (m.ctr >= 1.5) {
    out.push({ severity: "good", area: "creative", title: `Strong link CTR (${m.ctr.toFixed(2)}%)`, detail: "The creative earns clicks. If results are weak, look at the landing page or form next." });
  }
  if (m.impressions > 1000 && m.ctrAll >= m.ctr * 3 && m.ctrAll > 2) {
    out.push({ severity: "info", area: "creative", title: `Lots of clicks that aren't link clicks (${m.ctrAll.toFixed(1)}% all vs ${m.ctr.toFixed(2)}% link)`, detail: "People tap the photo, profile or 'see more' but not the button. Make the next step obvious in the copy and the creative." });
  }

  if (m.hookRate != null) {
    if (m.hookRate < 25) {
      out.push({ severity: "warn", area: "creative", title: `Hook rate ${m.hookRate.toFixed(0)}% (3-second views ÷ impressions)`, detail: "The first 3 seconds aren't stopping the scroll. Open with a bold claim, a question, or movement on screen." });
    } else if (m.hookRate >= 35) {
      out.push({ severity: "good", area: "creative", title: `Good hook rate (${m.hookRate.toFixed(0)}%)`, detail: "The opening works. Reuse it with new bodies and offers." });
    }
  }
  if (m.holdRate != null && m.videoViews3s > 200 && m.holdRate < 15) {
    out.push({ severity: "warn", area: "creative", title: `Hold rate ${m.holdRate.toFixed(0)}% (ThruPlays ÷ 3-second views)`, detail: "People stop watching after the hook. Tighten the middle, show proof sooner, and keep it shorter." });
  }
  if (m.watched && m.videoViews3s > 200) {
    const [q25, q50] = m.watched;
    if (q25 < 40) out.push({ severity: "info", area: "creative", title: `Only ${q25.toFixed(0)}% of viewers reach a quarter of the video`, detail: "Most drop right after the hook. Put the offer or the proof in the first 5 seconds." });
    else if (q50 && q25 - q50 > 30) out.push({ severity: "info", area: "creative", title: `Big drop between 25% and 50% of the video (${q25.toFixed(0)}% → ${q50.toFixed(0)}%)`, detail: "The middle loses people. Cut filler and get to the payoff faster." });
  }

  if (m.frequency > 3) {
    out.push({ severity: "warn", area: "audience", title: `Frequency is ${m.frequency.toFixed(1)}`, detail: "The same people are seeing the ad too often. Add fresh creatives or widen the audience." });
  }

  // Ad level: losers to pause, winners to learn from.
  const withSpend = ads.filter((a) => a.m.spend > 0);
  const losers = withSpend.filter((a) => (a.m.results === 0 && a.m.spend >= targetCpl * killAt) || (a.m.cpl != null && a.m.cpl > targetCpl * 2 && a.m.spend >= targetCpl));
  for (const a of losers.slice(0, 5)) {
    out.push({
      severity: "bad",
      area: "creative",
      title: `Pause candidate: ${a.name}`,
      detail: a.m.results ? `${fmt(a.m.spend)} spent, cost per result ${fmt(a.m.cpl!)}.` : `${fmt(a.m.spend)} spent with no results.`,
      action: { type: "pause", level: "ad", targetId: a.id, targetName: a.name },
    });
  }
  const winners = withSpend.filter((a) => a.m.cpl != null && a.m.results >= 3).sort((a, b) => a.m.cpl! - b.m.cpl!);
  if (winners.length && winners.length < withSpend.length) {
    const w = winners[0];
    out.push({
      severity: "good",
      area: "creative",
      title: `Best ad: ${w.name}`,
      detail: `${w.m.results} results at ${fmt(w.m.cpl!)} each. Make 2–3 variations of this angle (new hook, same offer).`,
    });
  }

  if (currency) for (const s of out) if (s.action) s.action.currency = currency;
  return out;
}

const pct = (n: number) => `${n >= 10 ? n.toFixed(0) : n.toFixed(1)}%`;

const LEAK_ADVICE: Record<string, string> = {
  add_to_cart: "People look but don't add to cart. Check the price and offer, the product photos, and that the page matches what the ad promised.",
  initiate_checkout: "Carts get abandoned. Show shipping costs early, remove forced sign-up, add trust signals, and retarget people who added to cart.",
  purchase: "Checkout loses people. Shorten the checkout, offer more ways to pay, and test it on a phone for errors.",
  lead: "Visitors don't convert. Make the headline match the ad, shorten the form, and put proof (results, testimonials) near the top.",
  complete_registration: "Visitors don't sign up. Make the headline match the ad, cut form fields, and say clearly what they get.",
};

/** Funnel, pixel, trend, placement, audience and ad set checks on top of analyze(). */
export function analyzeReport(r: CampaignReport, targets: Targets): Suggestion[] {
  const m = r.metrics;
  const out = analyze(m, r.ads, r.adsets.map((s) => ({ id: s.id, name: s.name, effective_status: s.status, daily_budget: s.dailyBudget != null ? String(Math.round(s.dailyBudget * minorFactor(r.currency))) : undefined })), r.campaign, targets, r.currency);
  if (m.spend === 0) return out;
  const fmt = (n: number) => moneyIn(n, r.currency);
  const targetCpl = targets.cpl;
  const step = (targets.scaleStep ?? 20) / 100;
  const add = (s: Suggestion) => out.push(s.action && r.currency ? { ...s, action: { ...s.action, currency: r.currency } } : s);

  // Pixel and tracking
  const onsite = m.resultType.startsWith("onsite_") || (m.events.messages ?? 0) > 0 || m.actions.some((a) => a.type === "onsite_conversion.lead_grouped");
  if (m.linkClicks >= 30 && m.lpv === 0 && !onsite) {
    add({ severity: "warn", area: "pixel", title: "No landing page views tracked", detail: `${m.linkClicks} link clicks but zero page views. The Meta pixel is probably missing on the landing page, or it loads too slowly to fire. Install the pixel (or check it in Events Manager) so Meta can optimize.` });
  } else if (m.lpvRate != null && m.linkClicks >= 30 && m.lpvRate < 60) {
    add({ severity: "warn", area: "pixel", title: `Only ${pct(m.lpvRate)} of clicks reach the page`, detail: "Many people leave before the page loads. Speed up the page (compress images, fewer scripts) and check the link works on mobile." });
  } else if (m.lpvRate != null && m.lpvRate >= 80) {
    add({ severity: "good", area: "pixel", title: `${pct(m.lpvRate)} of clicks reach the page`, detail: "The page loads fast enough and the pixel is firing." });
  }
  const pixelFires = PIXEL_EVENTS.some((e) => (m.events[e] ?? 0) > 0) || m.actions.some((a) => a.type.startsWith("offsite_conversion."));
  if (m.lpv >= 50 && !pixelFires && m.results === 0) {
    add({ severity: "bad", area: "pixel", title: "Pixel events aren't firing", detail: `${m.lpv} people reached the page but no pixel event (lead, purchase, add to cart…) came back. Check Events Manager and add the event to the thank-you page or button.` });
  }
  if (m.purchases > 0 && m.revenue === 0) {
    add({ severity: "warn", area: "pixel", title: "Purchases tracked without a value", detail: "Send value and currency with the Purchase event so Meta can report ROAS and optimize for revenue." });
  }

  // Biggest funnel leak (after the page view)
  const leaks = r.funnel
    .map((s, i) => ({ s, prev: r.funnel[i - 1] }))
    .filter(({ s, prev }) => s.bench && s.rate != null && prev && prev.count >= 30 && LEAK_ADVICE[s.id])
    .map((x) => ({ ...x, score: x.s.rate! / x.s.bench!.low }))
    .sort((a, b) => a.score - b.score);
  if (leaks[0] && leaks[0].score < 1) {
    const { s, prev } = leaks[0];
    add({ severity: "warn", area: "funnel", title: `Biggest leak: ${prev.label} → ${s.label} (${pct(s.rate!)})`, detail: `${LEAK_ADVICE[s.id]} A healthy rate is ${s.bench!.good}% or more.` });
  } else if (leaks.length && leaks.every((l) => l.s.rate! >= l.s.bench!.good)) {
    add({ severity: "good", area: "funnel", title: "Funnel converts well at every step", detail: "The page and checkout are doing their job. More reach (budget, new audiences) is the lever now." });
  }
  if (m.ctr >= 1.5 && m.cvr != null && m.cvr < 3 && m.lpv + m.linkClicks >= 100) {
    add({ severity: "warn", area: "funnel", title: `Good clicks, weak conversion (${pct(m.cvr)})`, detail: "The ad does its job; the page doesn't. Test the landing page: headline, offer, form length and load speed." });
  }

  // Trend: second half of the range vs the first
  const days = r.trend.filter((d) => d.spend > 0);
  if (days.length >= 4) {
    const half = Math.floor(days.length / 2);
    const sum = (list: DayPoint[]) => {
      const spend = list.reduce((a, d) => a + d.spend, 0);
      const imp = list.reduce((a, d) => a + d.impressions, 0);
      const clicks = list.reduce((a, d) => a + (d.ctr * d.impressions) / 100, 0);
      const res = list.reduce((a, d) => a + d.results, 0);
      return { ctr: imp ? (clicks / imp) * 100 : 0, cpm: imp ? (spend / imp) * 1000 : 0, cpl: res ? spend / res : null, res };
    };
    const a = sum(days.slice(0, half));
    const b = sum(days.slice(-half));
    const change = (x: number, y: number) => (x ? ((y - x) / x) * 100 : 0);
    const ctrMove = change(a.ctr, b.ctr);
    if (ctrMove <= -20) {
      add({
        severity: "warn",
        area: "trend",
        title: m.frequency >= 2 ? `Ad fatigue: CTR down ${pct(-ctrMove)} with frequency ${m.frequency.toFixed(1)}` : `CTR is sliding (down ${pct(-ctrMove)})`,
        detail: "The audience is tiring of these ads. Launch fresh creatives now, before cost per result climbs.",
      });
    }
    const cpmMove = change(a.cpm, b.cpm);
    if (cpmMove >= 30) add({ severity: "info", area: "trend", title: `CPM up ${pct(cpmMove)} lately`, detail: "Reaching people got pricier: more competition or a narrow audience. Broaden targeting or try new placements." });
    if (a.cpl && b.cpl && a.res >= 3 && b.res >= 3) {
      const cplMove = change(a.cpl, b.cpl);
      if (cplMove >= 30) add({ severity: "warn", area: "trend", title: `Cost per result rising (${fmt(a.cpl)} → ${fmt(b.cpl)})`, detail: "Results are getting more expensive. Check which ads slipped and refresh them." });
      else if (cplMove <= -20) add({ severity: "good", area: "trend", title: `Cost per result improving (${fmt(a.cpl)} → ${fmt(b.cpl)})`, detail: "The campaign is settling in. Leave it alone and let it keep learning." });
    }
  }

  // Placements
  if (r.placements.length > 1 && m.results > 0 && m.cpl != null) {
    for (const p of r.placements.filter((x) => x.share >= 15).slice(0, 3)) {
      if (p.results === 0 && p.spend >= targetCpl) add({ severity: "warn", area: "audience", title: `${p.label}: ${fmt(p.spend)} spent, no results`, detail: `${pct(p.share)} of spend went here for nothing. Exclude this placement, or test it in its own ad set.` });
      else if (p.cpl != null && p.cpl > m.cpl * 2) add({ severity: "info", area: "audience", title: `${p.label} costs ${fmt(p.cpl)} per result`, detail: `More than double the campaign's ${fmt(m.cpl)}. Consider excluding it.` });
    }
    const best = r.placements.filter((p) => p.results >= 3 && p.cpl != null).sort((a, b) => a.cpl! - b.cpl!)[0];
    if (best && best.cpl! <= m.cpl * 0.8) add({ severity: "good", area: "audience", title: `${best.label} brings the cheapest results (${fmt(best.cpl!)})`, detail: "Make creatives in this placement's format (size and length) to get more of it." });
  }

  // Age and gender
  if (r.demographics.length > 1 && m.results > 0) {
    const best = r.demographics.filter((d) => d.results >= 3 && d.cpl != null).sort((a, b) => a.cpl! - b.cpl!)[0];
    if (best && m.cpl && best.cpl! <= m.cpl * 0.8) add({ severity: "good", area: "audience", title: `Best audience: ${best.label} (${fmt(best.cpl!)} per result)`, detail: "Speak to this group directly in the next creatives, or give them their own ad set." });
    const waste = r.demographics.filter((d) => d.results === 0 && d.spend >= targetCpl * 1.5).slice(0, 2);
    for (const d of waste) add({ severity: "info", area: "audience", title: `${d.label}: ${fmt(d.spend)} spent, no results`, detail: "If this keeps up, narrow the age range or exclude this group." });
  }

  // Ad sets
  const spending = r.adsets.filter((s) => s.m.spend > 0);
  if (spending.length > 1) {
    const active = r.adsets.filter((s) => s.status === "ACTIVE");
    for (const s of spending) {
      const loser = (s.m.results === 0 && s.m.spend >= targetCpl * 2) || (s.m.cpl != null && s.m.cpl > targetCpl * 2 && s.m.spend >= targetCpl * 2);
      if (loser && s.status === "ACTIVE" && active.length > 1) {
        add({
          severity: "bad",
          area: "structure",
          title: `Ad set to pause: ${s.name}`,
          detail: s.m.results ? `${fmt(s.m.spend)} spent at ${fmt(s.m.cpl!)} per result.` : `${fmt(s.m.spend)} spent with no results.`,
          action: { type: "pause", level: "adset", targetId: s.id, targetName: s.name },
        });
      } else if (!r.dailyBudget && s.dailyBudget && s.status === "ACTIVE" && s.m.cpl != null && s.m.cpl <= targetCpl * 0.8 && s.m.results >= 5) {
        add({
          severity: "good",
          area: "structure",
          title: `Scale ad set: ${s.name}`,
          detail: `${s.m.results} results at ${fmt(s.m.cpl)}. Raise its budget ${Math.round(step * 100)}%.`,
          action: { type: "budget", level: "adset", targetId: s.id, targetName: s.name, newDailyBudget: Math.round(s.dailyBudget * (1 + step)) },
        });
      }
    }
  }
  const idle = r.ads.filter((a) => a.status === "ACTIVE" && a.m.impressions === 0);
  if (idle.length && r.ads.length >= 3) {
    add({ severity: "info", area: "structure", title: `${idle.length} active ad${idle.length === 1 ? " gets" : "s get"} no delivery`, detail: "Meta is favoring the other ads. Turn the idle ones off, or move them to their own ad set to give them a fair test." });
  }

  // Don't suggest the same budget change twice (campaign rule + ad set rule).
  const seen = new Set<string>();
  const unique = out.filter((s) => {
    if (!s.action) return true;
    const k = `${s.action.type}:${s.action.targetId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const order = { bad: 0, warn: 1, good: 2, info: 3 };
  return unique.sort((a, b) => order[a.severity] - order[b.severity]);
}
