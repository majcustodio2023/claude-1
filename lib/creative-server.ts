import "server-only";
import { pickTemplate, swapMedia, type NewMedia, type TemplateAd } from "./creative";
import { uid } from "./finance";
import { jobStatus } from "./higgsfield";
import { actId, graphGet, graphPost, toMetrics, type RawInsight } from "./meta";
import { resolveTracked } from "./meta-server";
import { getData, getHiggsfieldKey, updateCreatives } from "./store";
import type { Creative } from "./types";

/** Checks every generating creative with Higgsfield and saves the ones that finished. */
export async function refreshCreatives(): Promise<Creative[]> {
  const key = await getHiggsfieldKey();
  const list = (await getData()).creatives ?? [];
  const pending = list.filter((c) => c.status === "generating" && c.requestId);
  if (!pending.length || !key) return list;

  const results = await Promise.all(
    pending.map(async (c) => {
      try {
        return { id: c.id, s: await jobStatus(key, c.requestId!) };
      } catch (e) {
        return { id: c.id, err: (e as Error).message };
      }
    }),
  );
  return updateCreatives((l) =>
    l.map((c) => {
      const r = results.find((x) => x.id === c.id);
      if (!r || c.status !== "generating") return c;
      if ("err" in r) return c; // network hiccup: try again on the next refresh
      if (r.s.status === "completed" && r.s.url) return { ...c, status: "ready", url: r.s.url };
      if (["failed", "nsfw", "canceled"].includes(r.s.status)) {
        return { ...c, status: "failed", error: r.s.status === "nsfw" ? "Higgsfield blocked it as unsafe content." : `Higgsfield: ${r.s.status}` };
      }
      return c;
    }),
  );
}

async function uploadMedia(creative: Creative, account: string, token: string): Promise<NewMedia> {
  const cached = creative.meta?.[account];
  if (creative.kind === "image") {
    if (cached?.imageHash) return { kind: "image", imageHash: cached.imageHash };
    const res = await fetch(creative.url!, { cache: "no-store" });
    if (!res.ok) throw new Error(`Couldn't download the image (HTTP ${res.status}). Check the link is public.`);
    const bytes = Buffer.from(await res.arrayBuffer()).toString("base64");
    const r = (await graphPost(`${account}/adimages`, { bytes }, token)) as { images: Record<string, { hash: string }> };
    const hash = Object.values(r.images)[0]?.hash;
    if (!hash) throw new Error("Meta didn't return an image hash");
    return { kind: "image", imageHash: hash };
  }
  const videoId = cached?.videoId ?? ((await graphPost(`${account}/advideos`, { file_url: creative.url!, name: `Tracker ${creative.id}` }, token)) as { id: string }).id;
  return { kind: "video", videoId, thumbnailUrl: "" };
}

/**
 * Makes a PAUSED ad in the tracked campaign: same ad set, text, link and button as
 * the campaign's best ad, with this creative's image or video.
 */
export async function makeTestAd(creativeId: string, trackedId: string): Promise<{ adId: string; template: string; processing?: boolean }> {
  const { data, tracked, account, token } = await resolveTracked(trackedId);
  if (tracked.mode === "view") throw new Error("This campaign is view-only. Switch it to Manage in Ad Command first.");
  const creative = data.creatives?.find((c) => c.id === creativeId);
  if (!creative?.url || creative.status !== "ready") throw new Error("That creative isn't ready yet.");
  const act = actId(account.accountId);

  const [adsRes, insights] = await Promise.all([
    graphGet<{ data: TemplateAd[] }>(`${tracked.campaignId}/ads?fields=id,name,adset_id,effective_status,creative{object_story_spec}&limit=100`, token),
    graphGet<{ data: RawInsight[] }>(`${tracked.campaignId}/insights?fields=ad_id,spend,actions&level=ad&date_preset=last_7d&limit=200`, token),
  ]);
  const stats: Record<string, { spend: number; cpl: number | null }> = {};
  for (const r of insights.data) {
    const m = toMetrics(r, tracked.resultAction);
    stats[r.ad_id!] = { spend: m.spend, cpl: m.cpl };
  }
  const template = pickTemplate(adsRes.data, stats);
  if (!template) throw new Error("No single image or video ad in this campaign to copy the text and link from.");

  let media = await uploadMedia(creative, act, token);
  const cache = media.kind === "image" ? { imageHash: media.imageHash } : { videoId: media.videoId };
  await updateCreatives((l) => l.map((c) => (c.id === creative.id ? { ...c, meta: { ...c.meta, [account.id]: cache } } : c)));

  if (media.kind === "video") {
    const v = await graphGet<{ status?: { video_status?: string }; picture?: string }>(`${media.videoId}?fields=status,picture`, token);
    if (v.status?.video_status !== "ready" || !v.picture) return { adId: "", template: template.name, processing: true };
    media = { ...media, thumbnailUrl: v.picture };
  }

  const spec = swapMedia(template.creative!.object_story_spec!, media);
  const name = `Tracker test · ${creative.kind} · ${new Date().toISOString().slice(0, 10)}`;
  const cr = (await graphPost(`${act}/adcreatives`, { name, object_story_spec: JSON.stringify(spec) }, token)) as { id: string };
  const ad = (await graphPost(`${act}/ads`, { name, adset_id: template.adset_id, creative: JSON.stringify({ creative_id: cr.id }), status: "PAUSED" }, token)) as { id: string };

  await updateCreatives((l) =>
    l.map((c) => (c.id === creative.id ? { ...c, ads: [...(c.ads ?? []), { adId: ad.id, trackedId, campaign: tracked.name, createdAt: new Date().toISOString() }] } : c)),
  );
  return { adId: ad.id, template: template.name };
}

export const newCreative = (c: Omit<Creative, "id" | "createdAt">): Creative => ({ ...c, id: uid("cr"), createdAt: new Date().toISOString() });
