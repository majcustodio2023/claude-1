import { locale, moneyIn } from "./finance";
import type { AdRow, SuggestedAction, Suggestion } from "./meta";
import type { AutopilotEntry } from "./types";

// Decides which suggested changes Autopilot may apply on its own. Pure, so the
// limits below are easy to test:
// - at most 3 ads paused per run, and the best ad with spend is never paused
// - budget raises only up to the campaign's max daily budget (none set = cuts only)
// - one budget change per run, and none on the same target within 3 days
// - nothing is repeated that the log says was already done

export const MAX_PAUSES_PER_RUN = 3;
export const BUDGET_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

export interface Plan {
  apply: SuggestedAction[];
  skipped: { action: SuggestedAction; reason: string }[];
}

const LEVEL = { ad: "ad", adset: "ad set", campaign: "campaign" } as const;

export function describeAction(a: SuggestedAction): string {
  if (a.type === "pause") return `Pause ${LEVEL[a.level]} "${a.targetName}"`;
  if (a.type === "resume") return `Turn on ${LEVEL[a.level]} "${a.targetName}"`;
  return `Set daily budget of "${a.targetName}" to ${moneyIn(a.newDailyBudget ?? 0, a.currency)}`;
}

export function planAutopilot(
  suggestions: Suggestion[],
  ads: AdRow[],
  opts: { maxDailyBudget?: number; log: AutopilotEntry[]; now: number },
): Plan {
  const plan: Plan = { apply: [], skipped: [] };
  const done = opts.log.filter((e) => e.status === "done");
  const actions = suggestions.map((s) => s.action).filter((a): a is SuggestedAction => Boolean(a));

  // Pauses
  const withSpend = ads.filter((a) => a.m.spend > 0);
  const keep = [...withSpend].sort((a, b) => b.m.results - a.m.results || (a.m.cpl ?? Infinity) - (b.m.cpl ?? Infinity))[0];
  let pauses = 0;
  // Autopilot only pauses single ads. Ad sets and campaigns wait for you.
  for (const a of actions.filter((x) => x.type === "pause" && x.level === "ad")) {
    if (done.some((e) => e.type === "pause" && e.targetId === a.targetId)) continue; // already paused earlier
    if (keep && a.targetId === keep.id) {
      plan.skipped.push({ action: a, reason: "It's the best ad left with spend, so it stays on." });
    } else if (pauses >= MAX_PAUSES_PER_RUN) {
      plan.skipped.push({ action: a, reason: `Limit of ${MAX_PAUSES_PER_RUN} pauses per run reached.` });
    } else {
      plan.apply.push(a);
      pauses++;
    }
  }

  // Budget: first suggestion only
  const budget = actions.find((x) => x.type === "budget" && x.newDailyBudget && x.newDailyBudget > 0);
  if (budget) {
    const recent = done.some((e) => e.type === "budget" && e.targetId === budget.targetId && opts.now - Date.parse(e.at) < BUDGET_COOLDOWN_MS);
    const raising = suggestions.some((s) => s.action === budget && s.severity === "good");
    if (recent) {
      plan.skipped.push({ action: budget, reason: "Budget was changed in the last 3 days. Letting it settle." });
    } else if (raising && !opts.maxDailyBudget) {
      plan.skipped.push({ action: budget, reason: "Set a max daily budget to let Autopilot scale up." });
    } else if (raising && budget.newDailyBudget! > opts.maxDailyBudget!) {
      plan.skipped.push({ action: budget, reason: `Would go above your max daily budget of ${moneyIn(opts.maxDailyBudget!, budget.currency)}.` });
    } else {
      plan.apply.push(budget);
    }
  }

  return plan;
}
