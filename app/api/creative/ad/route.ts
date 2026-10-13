import { NextResponse } from "next/server";
import { makeTestAd } from "@/lib/creative-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Makes a paused test ad from a creative inside a tracked campaign.
export async function POST(req: Request) {
  const { creativeId, trackedId } = (await req.json()) as { creativeId: string; trackedId: string };
  try {
    return NextResponse.json(await makeTestAd(creativeId, trackedId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
