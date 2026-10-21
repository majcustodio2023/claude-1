import { NextResponse } from "next/server";
import { runAutopilot } from "@/lib/meta-server";
import { runDailyWork } from "@/lib/cityJobs-server";
import { syncReports } from "@/lib/feeds-server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Daily run from Vercel Cron (see vercel.json): Autopilot on the ads, the stored reports
// (Meta, App Store, funnels), then the city staff's daily jobs. Vercel sends CRON_SECRET as a bearer token; without that variable set, the
// route stays closed.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const out: Record<string, unknown> = { ok: true };
  try {
    out.entries = (await runAutopilot()).length;
  } catch (e) {
    out.ok = false;
    out.autopilot = (e as Error).message;
  }
  // Fresh stored reports first, so the staff's daily jobs read today's numbers.
  try {
    out.reports = await syncReports();
  } catch (e) {
    out.reportsError = (e as Error).message;
  }
  try {
    out.staff = await runDailyWork();
  } catch (e) {
    out.ok = false;
    out.staffError = (e as Error).message;
  }
  return NextResponse.json(out, { status: out.ok ? 200 : 500 });
}
