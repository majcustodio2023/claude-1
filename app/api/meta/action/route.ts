import { NextResponse } from "next/server";
import type { SuggestedAction } from "@/lib/meta";
import { applyAction, resolveTracked } from "@/lib/meta-server";

// Applies one suggested change. Only allowed for campaigns switched to Manage or
// Autopilot, and only on objects inside that campaign.
export async function POST(req: Request) {
  const { tracked: trackedId, action } = (await req.json()) as { tracked: string; action: SuggestedAction };
  try {
    const { tracked, token } = await resolveTracked(trackedId);
    if (tracked.mode === "view") {
      return NextResponse.json({ error: "This campaign is view-only. Switch it to Manage to apply changes." }, { status: 403 });
    }
    await applyAction(tracked, token, action);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
