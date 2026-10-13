import { NextResponse } from "next/server";
import { runAutopilot } from "@/lib/meta-server";

export const dynamic = "force-dynamic";

// Daily run from Vercel Cron (see vercel.json). Vercel sends CRON_SECRET as a
// bearer token; without that variable set, the route stays closed.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const entries = await runAutopilot();
    return NextResponse.json({ ok: true, entries: entries.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
