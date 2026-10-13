import { NextResponse } from "next/server";
import { describeAction } from "@/lib/autopilot";
import { configureLocale, uid } from "@/lib/finance";
import type { SuggestedAction } from "@/lib/meta";
import { applyAction, resolveTracked } from "@/lib/meta-server";
import { appendAutopilotLog } from "@/lib/store";

// Applies one change (pause, turn on, budget). Only allowed for campaigns switched to
// Manage or Autopilot, and only on objects inside that campaign. Logged as yours.
export async function POST(req: Request) {
  const { tracked: trackedId, action } = (await req.json()) as { tracked: string; action: SuggestedAction };
  try {
    const { data, tracked, account, token } = await resolveTracked(trackedId);
    if (tracked.mode === "view") {
      return NextResponse.json({ error: "This campaign is view-only. Switch it to Manage to apply changes." }, { status: 403 });
    }
    configureLocale(data.settings);
    await applyAction(tracked, account, token, action);
    await appendAutopilotLog([{ id: uid("ap"), at: new Date().toISOString(), trackedId: tracked.id, campaign: tracked.name, type: action.type, targetId: action.targetId, action: describeAction(action), status: "done", by: "you" }]).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
