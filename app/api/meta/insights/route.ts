import { NextResponse } from "next/server";
import { configureLocale } from "@/lib/finance";
import { DATE_PRESETS, type DatePreset } from "@/lib/meta";
import { campaignReport, resolveTracked } from "@/lib/meta-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const preset = (params.get("preset") ?? "last_7d") as DatePreset;
  if (!DATE_PRESETS.includes(preset)) return NextResponse.json({ error: "Bad date range" }, { status: 400 });
  try {
    const { data, tracked, token } = await resolveTracked(params.get("tracked") ?? "");
    configureLocale(data.settings);
    const report = await campaignReport(tracked, data, token, preset);
    return NextResponse.json({ ...report, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
