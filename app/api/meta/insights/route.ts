import { NextResponse } from "next/server";
import { DATE_PRESETS, analyze, fetchCampaignInsights, toMetrics, type DatePreset } from "@/lib/meta";
import { resolveTracked } from "@/lib/meta-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const preset = (params.get("preset") ?? "last_7d") as DatePreset;
  if (!DATE_PRESETS.includes(preset)) return NextResponse.json({ error: "Bad date range" }, { status: 400 });
  try {
    const { data, tracked, token } = await resolveTracked(params.get("tracked") ?? "");
    const raw = await fetchCampaignInsights(tracked.campaignId, token, preset);
    const metrics = toMetrics(raw.campaign, tracked.resultAction);
    const ads = raw.ads.map((a) => ({
      id: a.ad_id!,
      name: a.ad_name ?? a.ad_id!,
      adsetId: a.adset_id,
      adsetName: a.adset_name,
      m: toMetrics(a, tracked.resultAction),
    }));
    const suggestions = analyze(metrics, ads, raw.adsets, raw.info, {
      cpl: tracked.targetCpl ?? data.settings.targetCpl,
      roas: tracked.targetRoas ?? data.settings.targetRoas,
    });
    return NextResponse.json({ campaign: raw.info, metrics, ads, suggestions, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
