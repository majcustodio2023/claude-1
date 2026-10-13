import { locale, money } from "./finance";
// Meta Marketing API helpers and the rules that turn ad metrics into suggestions.

export const GRAPH = `https://graph.facebook.com/${process.env.META_API_VERSION ?? "v23.0"}`;

export const DATE_PRESETS = ["today", "yesterday", "last_3d", "last_7d", "last_14d", "last_30d", "this_month", "last_month"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

const INSIGHT_FIELDS = [
  "spend", "impressions", "reach", "frequency", "clicks", "inline_link_clicks", "inline_link_click_ctr",
  "ctr", "cpc", "cpm", "actions", "action_values", "purchase_roas", "video_thruplay_watched_actions",
  "video_p25_watched_actions", "video_p50_watched_actions", "video_p75_watched_actions", "video_p100_watched_actions",
].join(",");

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
  daily_budget?: string;
  effective_status: string;
}

export async function fetchCampaignInsights(campaignId: string, token: string, preset: DatePreset) {
  const q = `fields=${INSIGHT_FIELDS}&date_preset=${preset}`;
  const [campaign, ads, adsets, info] = await Promise.all([
    graphGet<{ data: RawInsight[] }>(`${campaignId}/insights?${q}`, token),
    graphGet<{ data: RawInsight[] }>(`${campaignId}/insights?${q},ad_id,ad_name,adset_id,adset_name&level=ad&limit=200`, token),
    graphGet<{ data: AdSetInfo[] }>(`${campaignId}/adsets?fields=id,name,daily_budget,effective_status&limit=100`, token),
    graphGet<CampaignInfo>(`${campaignId}?fields=id,name,status,effective_status,objective,daily_budget`, token),
  ]);
  return { campaign: campaign.data[0] ?? {}, ads: ads.data, adsets: adsets.data, info };
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

export interface Metrics {
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  linkClicks: number;
  ctr: number; // link CTR, %
  cpc: number;
  cpm: number;
  results: number;
  resultType: string;
  cpl: number | null;
  revenue: number;
  roas: number | null;
  videoViews3s: number;
  thruplays: number;
  hookRate: number | null; // 3s views / impressions, %
  holdRate: number | null; // thruplays / 3s views, %
}

export function toMetrics(r: RawInsight, resultAction?: string): Metrics {
  const n = (v?: string) => Number(v ?? 0);
  const spend = n(r.spend);
  const impressions = n(r.impressions);
  const linkClicks = n(r.inline_link_clicks);
  const resultType = resultAction || LEAD_TYPES.find((t) => actionValue(r.actions, t) > 0) || "lead";
  const results = actionValue(r.actions, resultType);
  const roasEntry = r.purchase_roas?.[0];
  const revenue = actionValue(r.action_values, "purchase") || actionValue(r.action_values, "offsite_conversion.fb_pixel_purchase");
  const videoViews3s = actionValue(r.actions, "video_view");
  const thruplays = Number(r.video_thruplay_watched_actions?.[0]?.value ?? 0);
  return {
    spend,
    impressions,
    reach: n(r.reach),
    frequency: n(r.frequency),
    clicks: n(r.clicks),
    linkClicks,
    ctr: r.inline_link_click_ctr ? n(r.inline_link_click_ctr) : impressions ? (linkClicks / impressions) * 100 : 0,
    cpc: linkClicks ? spend / linkClicks : 0,
    cpm: n(r.cpm),
    results,
    resultType,
    cpl: results ? spend / results : null,
    revenue,
    roas: roasEntry ? Number(roasEntry.value) : revenue && spend ? revenue / spend : null,
    videoViews3s,
    thruplays,
    hookRate: videoViews3s && impressions ? (videoViews3s / impressions) * 100 : null,
    holdRate: videoViews3s ? (thruplays / videoViews3s) * 100 : null,
  };
}

// ---------- suggestions ----------

export interface SuggestedAction {
  type: "pause" | "budget";
  targetId: string;
  targetName: string;
  level: "ad" | "adset" | "campaign";
  /** budget actions: new daily budget in major currency units (e.g. pesos) */
  newDailyBudget?: number;
}

export interface Suggestion {
  severity: "good" | "info" | "warn" | "bad";
  title: string;
  detail: string;
  action?: SuggestedAction;
}

export interface AdRow {
  id: string;
  name: string;
  adsetId?: string;
  adsetName?: string;
  m: Metrics;
}

const fmt = money;

export function analyze(
  m: Metrics,
  ads: AdRow[],
  adsets: AdSetInfo[],
  campaign: { id: string; name: string; daily_budget?: string },
  targets: { cpl: number; roas: number },
): Suggestion[] {
  const out: Suggestion[] = [];
  const { cpl: targetCpl, roas: targetRoas } = targets;

  if (m.spend === 0) {
    return [{ severity: "info", title: "No spend in this period", detail: "Nothing to analyze yet. Check that the campaign is active and has budget." }];
  }

  // Budget lives on the campaign (CBO) or on each ad set.
  const budgetTarget = (factor: number): SuggestedAction | undefined => {
    if (campaign.daily_budget) {
      return { type: "budget", level: "campaign", targetId: campaign.id, targetName: campaign.name, newDailyBudget: Math.round((Number(campaign.daily_budget) / 100) * factor) };
    }
    const active = adsets.filter((a) => a.daily_budget && a.effective_status === "ACTIVE");
    if (active.length === 1) {
      const a = active[0];
      return { type: "budget", level: "adset", targetId: a.id, targetName: a.name, newDailyBudget: Math.round((Number(a.daily_budget) / 100) * factor) };
    }
    return undefined;
  };

  // Cost per result
  if (m.results === 0 && m.spend >= targetCpl * 2) {
    out.push({
      severity: "bad",
      title: `${fmt(m.spend)} spent with no results`,
      detail: `No ${m.resultType} events recorded. Check the form or pixel is firing, then refresh the creative or offer before spending more.`,
    });
  } else if (m.cpl != null) {
    if (m.cpl > targetCpl * 1.3) {
      out.push({
        severity: "bad",
        title: `Cost per result ${fmt(m.cpl)} is above target (${fmt(targetCpl)})`,
        detail: "Cut the weakest ads (below), test new hooks, and hold budget until it comes back under target.",
        action: m.cpl > targetCpl * 1.6 ? budgetTarget(0.8) : undefined,
      });
    } else if (m.cpl <= targetCpl * 0.8 && m.results >= 5) {
      out.push({
        severity: "good",
        title: `Cost per result ${fmt(m.cpl)} beats target (${fmt(targetCpl)})`,
        detail: "This is working. Scale budget about 20% every 2–3 days while cost per result stays under target.",
        action: budgetTarget(1.2),
      });
    } else {
      out.push({ severity: "info", title: `Cost per result ${fmt(m.cpl)} is near target`, detail: "Hold budget steady and keep testing new creatives against the current winner." });
    }
  }

  if (m.roas != null && m.roas > 0) {
    out.push(
      m.roas < targetRoas
        ? { severity: "warn", title: `ROAS ${m.roas.toFixed(2)}x is below ${targetRoas}x`, detail: "Revenue tracked from ads is not covering the target. Review offer, landing page and audience quality." }
        : { severity: "good", title: `ROAS ${m.roas.toFixed(2)}x meets target`, detail: "Profitable on tracked revenue. Safe to scale gradually." },
    );
  }

  if (m.impressions > 1000 && m.ctr < 0.8) {
    out.push({ severity: "warn", title: `Link CTR is low (${m.ctr.toFixed(2)}%)`, detail: "People see the ad but don't click. Test a stronger first line, a clearer offer, and a direct call to action." });
  } else if (m.ctr >= 1.5) {
    out.push({ severity: "good", title: `Strong link CTR (${m.ctr.toFixed(2)}%)`, detail: "The creative earns clicks. If results are weak, look at the landing page or form next." });
  }

  if (m.hookRate != null) {
    if (m.hookRate < 25) {
      out.push({ severity: "warn", title: `Hook rate ${m.hookRate.toFixed(0)}% (3-second views ÷ impressions)`, detail: "The first 3 seconds aren't stopping the scroll. Open with a bold claim, a question, or movement on screen." });
    } else if (m.hookRate >= 35) {
      out.push({ severity: "good", title: `Good hook rate (${m.hookRate.toFixed(0)}%)`, detail: "The opening works. Reuse it with new bodies and offers." });
    }
  }
  if (m.holdRate != null && m.videoViews3s > 200 && m.holdRate < 15) {
    out.push({ severity: "warn", title: `Hold rate ${m.holdRate.toFixed(0)}% (ThruPlays ÷ 3-second views)`, detail: "People stop watching after the hook. Tighten the middle, show proof sooner, and keep it shorter." });
  }

  if (m.frequency > 3) {
    out.push({ severity: "warn", title: `Frequency is ${m.frequency.toFixed(1)}`, detail: "The same people are seeing the ad too often. Add fresh creatives or widen the audience." });
  }

  // Ad level: losers to pause, winners to learn from.
  const withSpend = ads.filter((a) => a.m.spend > 0);
  const losers = withSpend.filter((a) => (a.m.results === 0 && a.m.spend >= targetCpl * 1.5) || (a.m.cpl != null && a.m.cpl > targetCpl * 2 && a.m.spend >= targetCpl));
  for (const a of losers.slice(0, 5)) {
    out.push({
      severity: "bad",
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
      title: `Best ad: ${w.name}`,
      detail: `${w.m.results} results at ${fmt(w.m.cpl!)} each. Make 2–3 variations of this angle (new hook, same offer).`,
    });
  }

  return out;
}
