// Prototype maker: paste a client's social links (or describe the business) and Claude in the
// project builds a full multi-page website prototype for it. Shared by the page and the server.

export const PROTOTYPE_MODELS = [
  { id: "claude-opus-5-5", label: "Opus 5.5", note: "Best design and copy" },
  { id: "claude-fable-5-1", label: "Fable 5.1", note: "Most capable, takes longer" },
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5", note: "Fastest" },
] as const;

export const DEFAULT_PROTOTYPE_MODEL = "claude-opus-5-5";

/** The Agent tool's short model names, used by the builder to hand the work to the picked model. */
export const AGENT_MODEL: Record<string, string> = { "claude-opus-5-5": "opus", "claude-fable-5-1": "fable", "claude-sonnet-5-5": "sonnet" };

/** Minutes a prototype should take, start to finish. */
export const PROTOTYPE_DEADLINE_MIN = 18;

export const modelLabel = (id: string) => PROTOTYPE_MODELS.find((m) => m.id === id)?.label ?? id;

export type PrototypeStatus = "preparing" | "queued" | "building" | "ready" | "failed";

export interface ScrapedSource {
  url: string;
  kind: "instagram" | "facebook" | "tiktok" | "website" | "other";
  ok: boolean;
  /** Why nothing came back, when ok is false. */
  note?: string;
  title?: string;
  description?: string;
  siteName?: string;
  themeColor?: string;
  /** Instagram only. */
  username?: string;
  fullName?: string;
  bio?: string;
  category?: string;
  followers?: number;
  externalUrl?: string;
  /** Visible text from a website, trimmed. */
  text?: string;
}

export interface PulledPicture {
  /** File name under the prototype's img/ folder. */
  name: string;
  from: string;
  /** "logo" for a profile picture, "post" for a post, "cover" for a page's share picture, "photo" for a site image. */
  role: "logo" | "post" | "cover" | "photo";
  caption?: string;
}

export interface Scraped {
  sources: ScrapedSource[];
  pictures: PulledPicture[];
  /** The corner credit shown on the finished site (from settings at the time). */
  badge?: string;
}

export interface PrototypeJob {
  id: string;
  slug: string;
  status: PrototypeStatus;
  model: string;
  links: string[];
  description: string;
  businessName?: string | null;
  businessType?: string | null;
  summary?: string | null;
  error?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  progress: { at: string; text: string }[];
  pictures: number;
  /** Pages in the builder's site plan (set once the plan is made). */
  planned?: number | null;
  /** The shared stylesheet is saved (the design system is done). */
  styles?: boolean;
  pages: { path: string; title?: string | null }[];
  scraped?: Scraped;
}

/** Turns what was typed into a full link: "@handle" means Instagram, a bare domain gets https. */
export function normalizeLink(raw: string): string | null {
  const t = raw.trim().replace(/^<|>$/g, "");
  if (!t) return null;
  if (/^@[\w.]{1,30}$/.test(t)) return `https://www.instagram.com/${t.slice(1)}/`;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function linkKind(url: string): ScrapedSource["kind"] {
  const h = new URL(url).hostname.replace(/^www\.|^m\./, "");
  if (h === "instagram.com" || h === "instagr.am") return "instagram";
  if (h === "facebook.com" || h === "fb.com" || h === "fb.me") return "facebook";
  if (h === "tiktok.com") return "tiktok";
  if (/(^|\.)(linktr\.ee|x\.com|twitter\.com|youtube\.com|shopee\.ph|lazada\.com\.ph)$/.test(h)) return "other";
  return "website";
}

/** A short readable slug plus random letters, so a prototype's address can't be guessed. */
export function makeSlug(name: string, random: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 32)
    .replace(/^-|-$/g, "");
  return `${base || "prototype"}-${random}`;
}

/** Best guess at a name before the builder has read anything: Instagram handle, page name or domain. */
export function guessName(links: string[], description: string): string {
  for (const l of links) {
    try {
      const u = new URL(l);
      const kind = linkKind(l);
      const first = u.pathname.split("/").filter(Boolean)[0];
      if ((kind === "instagram" || kind === "facebook" || kind === "tiktok") && first) return first.replace(/^@/, "");
      if (kind === "website") return u.hostname.replace(/^www\./, "").split(".")[0];
    } catch {}
  }
  return description.split(/\s+/).slice(0, 3).join(" ");
}

export function minutesBetween(a: string, b: string | number = Date.now()): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

/** How far along a build is, 0 to 100, from the stage it's at and the pages saved so far. */
export function buildPercent(j: Pick<PrototypeJob, "status" | "planned" | "styles" | "pages">): number {
  if (j.status === "ready") return 100;
  if (j.status === "preparing") return 4;
  if (j.status === "queued") return 8;
  if (j.status !== "building") return 0;
  if (!j.styles) return j.planned ? 22 : 14;
  const planned = Math.max(j.planned ?? 5, j.pages.length);
  return Math.min(96, Math.round(30 + (j.pages.length / planned) * 62));
}

/** The stage in words, for under the progress bar. */
export function buildStage(j: Pick<PrototypeJob, "status" | "planned" | "styles" | "pages">): string {
  if (j.status === "preparing") return "Reading their links and saving their pictures";
  if (j.status === "queued") return "Waiting for the builder to start";
  if (j.status === "ready") return "Done";
  if (j.status === "failed") return "Stopped";
  if (!j.planned && !j.styles) return "Studying the business and planning the site";
  if (!j.styles) return "Designing the look: colours, fonts, layout";
  const planned = Math.max(j.planned ?? 0, j.pages.length);
  return planned ? `Building pages: ${j.pages.length} of ${planned} saved` : `Building pages: ${j.pages.length} saved`;
}
