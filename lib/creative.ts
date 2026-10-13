// Pure helpers for turning a creative into a Meta test ad. No network here, so
// these are unit-tested.

/** Turns common share links into direct file links Meta and Higgsfield can download. */
export function directMediaUrl(input: string): string {
  const url = input.trim();
  const drive = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  if (/dropbox\.com\//.test(url)) return url.replace(/([?&])dl=0/, "$1dl=1").replace(/^(?!.*[?&]dl=1)(.*)$/, (m) => (m.includes("?") ? `${m}&dl=1` : `${m}?dl=1`));
  return url;
}

export function guessKind(url: string): "image" | "video" {
  return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url) ? "video" : "image";
}

// Subset of Meta's object_story_spec we copy from the template ad.
interface CallToAction {
  type: string;
  value?: { link?: string; [k: string]: unknown };
}
export interface StorySpec {
  page_id: string;
  instagram_actor_id?: string;
  instagram_user_id?: string;
  link_data?: {
    link?: string;
    message?: string;
    name?: string;
    description?: string;
    caption?: string;
    call_to_action?: CallToAction;
    image_hash?: string;
    picture?: string;
    [k: string]: unknown;
  };
  video_data?: {
    video_id?: string;
    message?: string;
    title?: string;
    link_description?: string;
    call_to_action?: CallToAction;
    image_url?: string;
    image_hash?: string;
    [k: string]: unknown;
  };
}

export type NewMedia = { kind: "image"; imageHash: string } | { kind: "video"; videoId: string; thumbnailUrl: string };

/**
 * Copies the template ad's page, copy, link and button onto new media. Works for
 * single image and single video ads; carousels and dynamic creatives aren't copied.
 */
export function swapMedia(spec: StorySpec, media: NewMedia): StorySpec {
  const base: StorySpec = { page_id: spec.page_id };
  if (spec.instagram_user_id) base.instagram_user_id = spec.instagram_user_id;
  else if (spec.instagram_actor_id) base.instagram_actor_id = spec.instagram_actor_id;

  const ld = spec.link_data;
  const vd = spec.video_data;
  if (ld && (ld as { child_attachments?: unknown }).child_attachments) throw new Error("The template ad is a carousel, which I can't copy yet.");
  if (!ld && !vd) throw new Error("The template ad's format can't be copied (it isn't a single image or video ad).");

  const message = ld?.message ?? vd?.message;
  const headline = ld?.name ?? vd?.title;
  const description = ld?.description ?? vd?.link_description;
  const cta = ld?.call_to_action ?? vd?.call_to_action;
  const link = ld?.link ?? vd?.call_to_action?.value?.link;
  if (!link) throw new Error("The template ad has no destination link to copy.");

  if (media.kind === "image") {
    base.link_data = {
      link,
      ...(message && { message }),
      ...(headline && { name: headline }),
      ...(description && { description }),
      ...(cta && { call_to_action: { ...cta, value: { ...cta.value, link: cta.value?.link ?? link } } }),
      image_hash: media.imageHash,
    };
  } else {
    base.video_data = {
      video_id: media.videoId,
      image_url: media.thumbnailUrl,
      ...(message && { message }),
      ...(headline && { title: headline }),
      ...(description && { link_description: description }),
      call_to_action: { type: cta?.type ?? "LEARN_MORE", value: { ...cta?.value, link: cta?.value?.link ?? link } },
    };
  }
  return base;
}

export interface TemplateAd {
  id: string;
  name: string;
  adset_id: string;
  effective_status: string;
  creative?: { object_story_spec?: StorySpec };
}

/**
 * Picks the ad whose text and link the new creative copies: the copyable ad with
 * the lowest cost per result, else the copyable ad that spent most, else any
 * active copyable ad.
 */
export function pickTemplate(ads: TemplateAd[], stats: Record<string, { spend: number; cpl: number | null }>): TemplateAd | null {
  const copyable = ads.filter((a) => {
    const s = a.creative?.object_story_spec;
    return s && (s.video_data || (s.link_data && !(s.link_data as { child_attachments?: unknown }).child_attachments));
  });
  const withCpl = copyable.filter((a) => stats[a.id]?.cpl != null).sort((a, b) => stats[a.id].cpl! - stats[b.id].cpl!);
  if (withCpl.length) return withCpl[0];
  const bySpend = copyable.filter((a) => (stats[a.id]?.spend ?? 0) > 0).sort((a, b) => stats[b.id].spend - stats[a.id].spend);
  if (bySpend.length) return bySpend[0];
  return copyable.find((a) => a.effective_status === "ACTIVE") ?? copyable[0] ?? null;
}
