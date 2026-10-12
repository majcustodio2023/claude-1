import { NextResponse } from "next/server";
import { graphGet, graphPost, type SuggestedAction } from "@/lib/meta";
import { resolveTracked } from "@/lib/meta-server";

// Applies one suggested change. Only allowed for campaigns switched to "manage",
// and only on objects inside that campaign.
export async function POST(req: Request) {
  const { tracked: trackedId, action } = (await req.json()) as { tracked: string; action: SuggestedAction };
  try {
    const { tracked, token } = await resolveTracked(trackedId);
    if (tracked.mode !== "manage") {
      return NextResponse.json({ error: "This campaign is view-only. Switch it to Manage to apply changes." }, { status: 403 });
    }
    if (action.level !== "campaign") {
      const obj = await graphGet<{ campaign_id?: string }>(`${action.targetId}?fields=campaign_id`, token);
      if (obj.campaign_id !== tracked.campaignId) throw new Error("That object isn't part of this campaign");
    } else if (action.targetId !== tracked.campaignId) {
      throw new Error("That campaign isn't the tracked one");
    }

    if (action.type === "pause") {
      await graphPost(action.targetId, { status: "PAUSED" }, token);
    } else if (action.type === "budget" && action.newDailyBudget && action.newDailyBudget > 0) {
      // Meta takes budgets in the currency's smallest unit (centavos for PHP).
      await graphPost(action.targetId, { daily_budget: String(Math.round(action.newDailyBudget * 100)) }, token);
    } else {
      throw new Error("Unknown action");
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
