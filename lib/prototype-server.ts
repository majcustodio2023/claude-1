import "server-only";
import { randomBytes } from "node:crypto";
import { getStaffSecret, keyedRpc } from "./store";
import { buildBrief } from "./prototypeBrief";
import {
  DEFAULT_PROTOTYPE_MODEL,
  PROTOTYPE_MODELS,
  guessName,
  linkKind,
  makeSlug,
  normalizeLink,
  type PrototypeJob,
  type PulledPicture,
  type Scraped,
  type ScrapedSource,
} from "./prototype";
import type { PrototypeSettings } from "./types";

// Reads what's public on the client's links, keeps copies of their pictures, saves the job and
// wakes the builder (Claude in the project) through the scheduled task's fire address.

export const FIRE_TOKEN_KEY = "prototype:fireToken";

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
// Link-preview bots get the share tags (og:) even where a browser would hit a login wall.
const PREVIEW_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const MAX_PICTURES = 14;
const MAX_PICTURE_BYTES = 3 * 1024 * 1024;

async function get(url: string, headers: Record<string, string>, ms = 9000): Promise<Response> {
  return fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(ms), cache: "no-store" });
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));

function meta(html: string, key: string): string | undefined {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decode(content).trim() || undefined : undefined;
}

function visibleText(html: string): string {
  return decode(
    html
      .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  )
    .trim()
    .slice(0, 2500);
}

function absolute(src: string, base: string): string | null {
  try {
    const u = new URL(decode(src), base);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

interface Found {
  source: ScrapedSource;
  pictures: { url: string; role: PulledPicture["role"]; caption?: string }[];
}

/** Instagram's own web profile endpoint gives the bio and the latest posts when it lets us in. */
async function instagram(url: string): Promise<Found> {
  const username = new URL(url).pathname.split("/").filter(Boolean)[0]?.replace(/^@/, "") ?? "";
  const source: ScrapedSource = { url, kind: "instagram", ok: false, username };
  const pictures: Found["pictures"] = [];
  try {
    const res = await get(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`, {
      "User-Agent": "Instagram 219.0.0.12.117 Android",
      "x-ig-app-id": "936619743392459",
      Accept: "application/json",
    });
    if (res.ok) {
      type Edge = { node: { display_url?: string; is_video?: boolean; accessibility_caption?: string; edge_media_to_caption?: { edges: { node: { text: string } }[] } } };
      const u = ((await res.json()) as { data?: { user?: Record<string, unknown> } }).data?.user as
        | { full_name?: string; biography?: string; category_name?: string; external_url?: string; profile_pic_url_hd?: string; edge_followed_by?: { count: number }; edge_owner_to_timeline_media?: { edges: Edge[] } }
        | undefined;
      if (u) {
        Object.assign(source, {
          ok: true,
          fullName: u.full_name || undefined,
          bio: u.biography || undefined,
          category: u.category_name || undefined,
          externalUrl: u.external_url || undefined,
          followers: u.edge_followed_by?.count,
        });
        if (u.profile_pic_url_hd) pictures.push({ url: u.profile_pic_url_hd, role: "logo", caption: `${u.full_name || username} profile picture` });
        for (const e of u.edge_owner_to_timeline_media?.edges ?? []) {
          if (!e.node.display_url) continue;
          const caption = [e.node.edge_media_to_caption?.edges[0]?.node.text?.slice(0, 220), e.node.accessibility_caption].filter(Boolean).join(" | ");
          pictures.push({ url: e.node.display_url, role: "post", caption: (e.node.is_video ? "(video cover) " : "") + caption });
        }
        return { source, pictures };
      }
    }
  } catch {}
  // Fall back to the share tags on the profile page.
  try {
    const res = await get(url, { "User-Agent": PREVIEW_UA });
    const html = await res.text();
    const title = meta(html, "og:title");
    const description = meta(html, "og:description") ?? meta(html, "description");
    const image = meta(html, "og:image");
    if (title || description) Object.assign(source, { ok: true, title, description });
    if (image) pictures.push({ url: image, role: "logo", caption: title });
    if (!source.ok) source.note = `Instagram didn't share this profile without a login (HTTP ${res.status}).`;
  } catch (e) {
    source.note = `Couldn't reach Instagram: ${(e as Error).message}`;
  }
  return { source, pictures };
}

/** Facebook pages, TikTok and websites: share tags, plus text and pictures for real websites. */
async function page(url: string, kind: ScrapedSource["kind"]): Promise<Found> {
  const source: ScrapedSource = { url, kind, ok: false };
  const pictures: Found["pictures"] = [];
  try {
    const res = await get(url, { "User-Agent": kind === "website" ? BROWSER_UA : PREVIEW_UA, "Accept-Language": "en-PH,en;q=0.9" });
    const html = (await res.text()).slice(0, 1_500_000);
    const base = res.url || url;
    Object.assign(source, {
      title: meta(html, "og:title") ?? (decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "").trim() || undefined),
      description: meta(html, "og:description") ?? meta(html, "description"),
      siteName: meta(html, "og:site_name"),
      themeColor: meta(html, "theme-color"),
    });
    source.ok = Boolean(res.ok && (source.title || source.description));
    if (!source.ok) source.note = `The page didn't share anything readable (HTTP ${res.status}).`;
    const og = meta(html, "og:image");
    const ogAbs = og && absolute(og, base);
    if (ogAbs) pictures.push({ url: ogAbs, role: "cover", caption: source.title });
    if (kind === "website" && res.ok) {
      source.text = visibleText(html);
      const icon = html.match(/<link[^>]+rel=["'](?:apple-touch-icon|icon)["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)["']/i)?.[1];
      const iconAbs = icon && absolute(icon, base);
      if (iconAbs && !/\.ico(\?|$)/i.test(iconAbs)) pictures.push({ url: iconAbs, role: "logo", caption: "site icon" });
      const seen = new Set<string>();
      for (const m of html.matchAll(/<img[^>]+>/gi)) {
        const tag = m[0];
        const src = tag.match(/\s(?:data-src|src)=["']([^"']+)["']/i)?.[1];
        const abs = src && absolute(src, base);
        if (!abs || seen.has(abs) || /\.(svg|gif)(\?|$)|sprite|pixel|tracking|1x1|icon/i.test(abs)) continue;
        seen.add(abs);
        const alt = tag.match(/alt=["']([^"']*)["']/i)?.[1];
        pictures.push({ url: abs, role: /logo/i.test(abs + (alt ?? "")) ? "logo" : "photo", caption: alt ? decode(alt) : undefined });
        if (seen.size >= 10) break;
      }
    }
  } catch (e) {
    source.note = `Couldn't open it: ${(e as Error).message}`;
  }
  return { source, pictures };
}

async function readLink(url: string): Promise<Found> {
  const kind = linkKind(url);
  return kind === "instagram" ? instagram(url) : page(url, kind);
}

/** Downloads a picture; returns it as base64 with its type, or null when it isn't a usable image. */
async function download(url: string): Promise<{ type: string; data: string } | null> {
  try {
    const res = await get(url, { "User-Agent": BROWSER_UA, Accept: "image/avif,image/webp,image/*;q=0.8" }, 10000);
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok || !/^image\/(jpeg|png|webp|avif|gif)$/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 3000 || buf.length > MAX_PICTURE_BYTES) return null;
    return { type, data: buf.toString("base64") };
  } catch {
    return null;
  }
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" };

/** Reads every link (and a website the Instagram bio points to), then keeps copies of the best pictures. */
export async function scrape(jobId: string, links: string[]): Promise<Scraped> {
  const found = await Promise.all(links.map(readLink));
  const extra = found
    .map((f) => f.source.externalUrl)
    .filter((u): u is string => Boolean(u && normalizeLink(u)))
    .map((u) => normalizeLink(u)!)
    .filter((u) => !links.includes(u) && linkKind(u) === "website")
    .slice(0, 1);
  if (extra.length) found.push(...(await Promise.all(extra.map(readLink))));

  // Logos first, then posts and covers, then site photos; no repeats.
  const order = { logo: 0, post: 1, cover: 2, photo: 3 } as const;
  const wanted = found
    .flatMap((f) => f.pictures.map((p) => ({ ...p, from: f.source.url })))
    .filter((p, i, all) => all.findIndex((q) => q.url === p.url) === i)
    .sort((a, b) => order[a.role] - order[b.role])
    .slice(0, MAX_PICTURES + 6);

  const files = await Promise.all(wanted.map((p) => download(p.url)));
  const pictures: PulledPicture[] = [];
  let n = 0;
  for (let i = 0; i < wanted.length && pictures.length < MAX_PICTURES; i++) {
    const f = files[i];
    if (!f) continue;
    const p = wanted[i];
    const name = `${p.role}-${++n}.${EXT[f.type] ?? "jpg"}`;
    await keyedRpc("prototype_add_asset", { p_job_id: jobId, p_name: name, p_type: f.type, p_data: f.data });
    pictures.push({ name, from: p.from, role: p.role, caption: p.caption?.slice(0, 300) });
  }
  return { sources: found.map((f) => f.source), pictures };
}

/** Starts the builder now, through the scheduled task's API trigger. Returns why it couldn't, if it couldn't. */
export async function fireBuilder(settings: PrototypeSettings | undefined): Promise<string | null> {
  const url = settings?.fireUrl?.trim();
  const token = await getStaffSecret(FIRE_TOKEN_KEY);
  if (!url || !token) return "not set up";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "anthropic-beta": "experimental-cc-routine-2026-04-01",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      // No text: the builder reads the queue itself (jobId is only used in messages here).
      body: "{}",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return null;
    return `the builder's start button said ${res.status}: ${(await res.text()).slice(0, 200)}`;
  } catch (e) {
    return `couldn't reach the builder: ${(e as Error).message}`;
  }
}

export async function listJobs(): Promise<PrototypeJob[]> {
  return ((await keyedRpc("prototype_list")) as PrototypeJob[] | null) ?? [];
}

export interface NewPrototype {
  links: string[];
  description: string;
  model?: string;
}

/** Saves a new request with everything the builder needs, then wakes the builder. */
export async function createJob(input: NewPrototype, settings: PrototypeSettings | undefined, origin: string): Promise<{ job: PrototypeJob; fire: string | null }> {
  const links = Array.from(new Set(input.links.map(normalizeLink).filter((l): l is string => Boolean(l)))).slice(0, 6);
  const description = input.description.trim().slice(0, 4000);
  if (!links.length && description.length < 15) throw new Error("Paste at least one social link, or describe the business in a sentence or two.");
  const model = PROTOTYPE_MODELS.some((m) => m.id === input.model) ? input.model! : settings?.defaultModel || DEFAULT_PROTOTYPE_MODEL;
  const id = `proto-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
  const slug = makeSlug(guessName(links, description), randomBytes(4).toString("hex"));

  // The job row has to exist before its pictures can be saved; the brief is filled in after.
  await keyedRpc("prototype_create", { p_job: { id, slug, model, links, description, scraped: {}, brief: "(reading the links…)" } });
  let scraped: Scraped = { sources: [], pictures: [] };
  try {
    scraped = await scrape(id, links);
  } catch (e) {
    scraped.sources = links.map((url) => ({ url, kind: linkKind(url), ok: false, note: (e as Error).message }));
  }
  if (settings?.badge?.trim()) scraped.badge = settings.badge.trim().slice(0, 80);
  const brief = buildBrief({ id, slug, model, links, description, scraped, settings, siteBase: `${origin}/p/${slug}/` });
  await keyedRpc("prototype_set_brief", { p_id: id, p_brief: brief, p_scraped: scraped });
  const fire = await fireBuilder(settings);
  const job = (await listJobs()).find((j) => j.id === id)!;
  return { job, fire };
}
