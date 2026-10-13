import "server-only";
import { describeAction, planAutopilot } from "./autopilot";
import { configureLocale, uid } from "./finance";
import { analyze, fetchCampaignInsights, graphGet, graphPost, toMetrics, type SuggestedAction } from "./meta";
import { appendAutopilotLog, getData, getToken } from "./store";
import type { AdAccount, AutopilotEntry, TrackedCampaign, TrackerData } from "./types";

export async function resolveTracked(trackedId: string): Promise<{ data: TrackerData; tracked: TrackedCampaign; account: AdAccount; token: string }> {
  const data = await getData();
  const tracked = data.trackedCampaigns.find((t) => t.id === trackedId);
  if (!tracked) throw new Error("Campaign is not being tracked");
  const account = data.adAccounts.find((a) => a.id === tracked.adAccountRef);
  if (!account) throw new Error("Ad account not found");
  const token = await getToken(account.id);
  if (!token) throw new Error(`No access token saved for ${account.label}`);
  return { data, tracked, account, token };
}

/** Sends one change to Meta, after checking it belongs to the tracked campaign. */
export async function applyAction(tracked: TrackedCampaign, token: string, action: SuggestedAction): Promise<void> {
  if (action.level !== "campaign") {
    const obj = await graphGet<{ campaign_id?: string }>(`${action.targetId}?fields=campaign_id`, token);
    if (obj.campaign_id !== tracked.campaignId) throw new Error("That object isn't part of this campaign");
  } else if (action.targetId !== tracked.campaignId) {
    throw new Error("That campaign isn't the tracked one");
  }

  if (action.type === "pause") {
    await graphPost(action.targetId, { status: "PAUSED" }, token);
  } else if (action.type === "budget" && action.newDailyBudget && action.newDailyBudget > 0) {
    // Meta takes budgets in the currency's smallest unit (e.g. cents).
    await graphPost(action.targetId, { daily_budget: String(Math.round(action.newDailyBudget * 100)) }, token);
  } else {
    throw new Error("Unknown action");
  }
}

const LOG_LIMIT = 200;

/** Runs Autopilot on every campaign set to "autopilot" and records what happened. */
export async function runAutopilot(now = new Date()): Promise<AutopilotEntry[]> {
  const data = await getData();
  configureLocale(data.settings);
  const log = data.autopilotLog ?? [];
  const entries: AutopilotEntry[] = [];
  const at = now.toISOString();

  for (const tracked of data.trackedCampaigns.filter((t) => t.mode === "autopilot")) {
    const base = { at, trackedId: tracked.id, campaign: tracked.name };
    try {
      const { token } = await resolveTracked(tracked.id);
      const raw = await fetchCampaignInsights(tracked.campaignId, token, "last_7d");
      const metrics = toMetrics(raw.campaign, tracked.resultAction);
      const ads = raw.ads.map((a) => ({ id: a.ad_id!, name: a.ad_name ?? a.ad_id!, adsetId: a.adset_id, adsetName: a.adset_name, m: toMetrics(a, tracked.resultAction) }));
      const suggestions = analyze(metrics, ads, raw.adsets, raw.info, {
        cpl: tracked.targetCpl ?? data.settings.targetCpl,
        roas: tracked.targetRoas ?? data.settings.targetRoas,
      });
      const plan = planAutopilot(suggestions, ads, { maxDailyBudget: tracked.maxDailyBudget, log, now: now.getTime() });

      for (const action of plan.apply) {
        const entry: AutopilotEntry = { ...base, id: uid("ap"), type: action.type, targetId: action.targetId, action: describeAction(action), status: "done" };
        try {
          await applyAction(tracked, token, action);
        } catch (e) {
          entry.status = "error";
          entry.note = (e as Error).message;
        }
        entries.push(entry);
      }
      for (const { action, reason } of plan.skipped) {
        entries.push({ ...base, id: uid("ap"), type: action.type, targetId: action.targetId, action: describeAction(action), status: "skipped", note: reason });
      }
      if (!plan.apply.length && !plan.skipped.length) {
        entries.push({ ...base, id: uid("ap"), type: "run", action: "Checked the last 7 days", status: "skipped", note: "Nothing needed changing." });
      }
    } catch (e) {
      entries.push({ ...base, id: uid("ap"), type: "run", action: "Checked the last 7 days", status: "error", note: (e as Error).message });
    }
  }

  if (entries.length) await appendAutopilotLog(entries, LOG_LIMIT);
  return entries;
}
