// The virtual city: one building per client plus studios, each with a Progress Room,
// a Mission Room, extra rooms and AI staff. Pure helpers (layout, seeding, staff roles)
// so they're unit-tested; the game itself is components/city.

import { hashString, rng } from "./avatar";
import { randomHeroLook } from "./heroLook";
import { uid } from "./finance";
import type { BuildingKind, CityBuilding, CityStaff, CityState, Client, StaffRoleId, TrackerData } from "./types";

export const DEFAULT_CITY_NAME = "Dawnterra";

// ---------- staff roles ----------

export interface Need {
  key: string;
  label: string;
  placeholder?: string;
  /** Kept encrypted on the server, never in the data the browser sees. */
  secret?: boolean;
  /** Optional: the job works without it. */
  optional?: boolean;
}

export type PanelKind = "report" | "tasks" | "setup" | "work" | "videoAI" | "imageAI" | "writer" | "videoEdit" | "funnel" | "ads" | "webinar";

export interface StaffRole {
  id: StaffRoleId;
  title: string;
  /** #rrggbb used for the role tag and dialogue frame */
  color: string;
  icon: string;
  /** What they say they're doing while they work. {client} is the building's name. */
  jobs: string[];
  /** First line when you talk to them. */
  greet: string;
  /** What they need from you to do the job. */
  needs: Need[];
  /** The pop-up their main answer opens. */
  panel: PanelKind;
  /** Label of their main choice. */
  action: string;
}

export const ROLES: Record<StaffRoleId, StaffRole> = {
  reporter: {
    id: "reporter", title: "Progress Reporter", color: "#ffd23f", icon: "chart", panel: "report", action: "Show me the progress",
    greet: "Boss! I keep the scoreboard for {client}. Want the latest report?",
    jobs: ["Counting finished tasks", "Updating the scoreboard", "Writing today's report"],
    needs: [],
  },
  social: {
    id: "social", title: "Social Media Manager", color: "#ff5fae", icon: "megaphone", panel: "work", action: "Show me your work",
    greet: "I run {client}'s social pages. Hook me up to the pages and I'll keep them posting.",
    jobs: ["Scheduling posts", "Replying to comments", "Planning this week's content"],
    needs: [
      { key: "facebook", label: "Facebook page link", placeholder: "https://facebook.com/…" },
      { key: "instagram", label: "Instagram handle", placeholder: "@handle" },
      { key: "tiktok", label: "TikTok handle", placeholder: "@handle", optional: true },
      { key: "perWeek", label: "Posts per week", placeholder: "5" },
      { key: "voice", label: "Brand voice", placeholder: "Friendly, bold, no jargon…" },
      { key: "metaToken", label: "Meta Page access token (for posting, later)", placeholder: "Paste the page token", secret: true, optional: true },
    ],
  },
  content: {
    id: "content", title: "Content Creator", color: "#ff9f1c", icon: "pencil", panel: "work", action: "Show me your work",
    greet: "Captions, carousels, scripts: I write {client}'s posts. Tell me what they're about.",
    jobs: ["Drafting captions", "Writing a reel script", "Designing a carousel"],
    needs: [
      { key: "pillars", label: "Content pillars", placeholder: "Tips, behind the scenes, wins…" },
      { key: "offer", label: "What we're promoting", placeholder: "The main offer right now" },
      { key: "drive", label: "Assets folder link", placeholder: "Google Drive link", optional: true },
    ],
  },
  insights: {
    id: "insights", title: "Page Insights Analyst", color: "#3fd0ff", icon: "radar", panel: "work", action: "Show me your work",
    greet: "I watch {client}'s page numbers: reach, engagement and follower growth.",
    jobs: ["Checking yesterday's reach", "Finding the best post", "Tracking follower growth"],
    needs: [
      { key: "pageId", label: "Facebook page ID", placeholder: "1234567890", optional: true },
      { key: "igId", label: "Instagram business ID", placeholder: "1784…", optional: true },
      { key: "metaToken", label: "Meta access token (to read the page)", placeholder: "Paste the token", secret: true, optional: true },
    ],
  },
  ads: {
    id: "ads", title: "Ads Manager", color: "#5cf28b", icon: "target", panel: "ads", action: "Show the ads",
    greet: "I manage {client}'s ads. Campaigns in their Ad Command folder report to me.",
    jobs: ["Checking cost per lead", "Pausing a losing ad", "Testing a new hook"],
    needs: [
      { key: "goal", label: "What a result is", placeholder: "Leads, sales, booked calls…" },
      { key: "budget", label: "Daily budget", placeholder: "1500" },
    ],
  },
  email: {
    id: "email", title: "Inbox Reader", color: "#c4bfe6", icon: "mail", panel: "work", action: "Show me your work",
    greet: "I read {client}'s emails so you don't have to, and flag what needs you.",
    jobs: ["Reading new emails", "Flagging the urgent ones", "Drafting replies"],
    needs: [
      { key: "address", label: "Email address to watch", placeholder: "client@example.com" },
      { key: "watch", label: "Flag emails about", placeholder: "Invoices, approvals, complaints…" },
      { key: "appPassword", label: "Gmail app password (for when inbox reading is switched on)", placeholder: "16 letters from Google", secret: true, optional: true },
    ],
  },
  discord: {
    id: "discord", title: "Discord Community Manager", color: "#7c5cff", icon: "chat", panel: "work", action: "Show me your work",
    greet: "I keep {client}'s Discord alive: welcomes, answers, events and keeping it clean.",
    jobs: ["Welcoming new members", "Answering questions", "Planning a community event"],
    needs: [
      { key: "invite", label: "Server invite link", placeholder: "https://discord.gg/…" },
      { key: "rules", label: "Tone and rules", placeholder: "Hype but respectful, no spam…" },
      { key: "hours", label: "Hours I'm on duty", placeholder: "9am to 11pm" },
      { key: "botToken", label: "Discord bot token (to post for you)", placeholder: "From the Discord developer portal", secret: true, optional: true },
      { key: "channel", label: "Channel ID to post in", placeholder: "Right-click the channel, Copy Channel ID", optional: true },
    ],
  },
  webinar: {
    id: "webinar", title: "Webinar Producer", color: "#ff4d5e", icon: "mic", panel: "webinar", action: "Webinar countdown",
    greet: "Showtime! I run {client}'s webinar: sign-ups, reminders and the replay.",
    jobs: ["Sending reminders", "Checking sign-ups", "Testing the stream"],
    needs: [
      { key: "date", label: "Webinar date", placeholder: "YYYY-MM-DD" },
      { key: "time", label: "Start time", placeholder: "7:00 PM" },
      { key: "page", label: "Sign-up page link", placeholder: "https://…" },
      { key: "goal", label: "Sign-up goal", placeholder: "300" },
      { key: "signups", label: "Sign-ups so far", placeholder: "0" },
    ],
  },
  app: {
    id: "app", title: "App Growth Manager", color: "#2ec4b6", icon: "phone", panel: "work", action: "Show me your work",
    greet: "I look after {client}: store listing, reviews, releases and installs.",
    jobs: ["Reading new reviews", "Writing release notes", "Checking installs"],
    needs: [
      { key: "appStore", label: "App Store link", placeholder: "https://apps.apple.com/…", optional: true },
      { key: "playStore", label: "Play Store link", placeholder: "https://play.google.com/…", optional: true },
      { key: "release", label: "Next release", placeholder: "What's shipping and when" },
    ],
  },
  store: {
    id: "store", title: "Store Manager", color: "#f15bb5", icon: "shop", panel: "work", action: "Show me your work",
    greet: "I watch {client}'s store: orders, best sellers and abandoned carts.",
    jobs: ["Checking today's orders", "Spotting best sellers", "Chasing abandoned carts"],
    needs: [
      { key: "url", label: "Store link", placeholder: "https://…" },
      { key: "platform", label: "Platform", placeholder: "Shopify, WooCommerce…" },
    ],
  },
  videoAI: {
    id: "videoAI", title: "AI Video Director", color: "#3fd0ff", icon: "film", panel: "videoAI", action: "Make an AI video",
    greet: "Lights, camera, AI! Give me a prompt and I'll shoot it with Higgsfield.",
    jobs: ["Rendering a scene", "Picking the best take", "Animating a still"],
    needs: [],
  },
  videoEdit: {
    id: "videoEdit", title: "Video Editor", color: "#ff9f1c", icon: "image", panel: "videoEdit", action: "Edit my video",
    greet: "Got raw footage of you? Send it over, pick a style and tell me how you want it cut.",
    jobs: ["Cutting dead air", "Adding captions", "Colour grading"],
    needs: [],
  },
  funnel: {
    id: "funnel", title: "Funnel Manager", color: "#ffd23f", icon: "rocket", panel: "funnel", action: "Show the funnel",
    greet: "Leads in, clients out. I run the funnel and know every deal in it.",
    jobs: ["Moving leads along", "Following up a proposal", "Checking show-up rate"],
    needs: [
      { key: "funnel", label: "Funnel link", placeholder: "Landing page or booking page" },
      { key: "offer", label: "Offer", placeholder: "What new clients buy" },
    ],
  },
  adsTracker: {
    id: "adsTracker", title: "Ads Tracker", color: "#5cf28b", icon: "radar", panel: "ads", action: "Show the ads",
    greet: "Every ad that brings you clients goes past me. Here's how they're doing.",
    jobs: ["Tracking cost per lead", "Watching ad fatigue", "Comparing hooks"],
    needs: [],
  },
  imageAI: {
    id: "imageAI", title: "Ad Image Maker", color: "#ff5fae", icon: "image", panel: "imageAI", action: "Make an ad image",
    greet: "I paint ad images with AI. Paste the image copy from my writer friend and tell me the look.",
    jobs: ["Generating ad images", "Trying a new layout", "Upscaling the winner"],
    needs: [],
  },
  scriptWriter: {
    id: "scriptWriter", title: "Ad Script Writer", color: "#ffd23f", icon: "film", panel: "writer", action: "Write an ad script",
    greet: "Give me a landing page or sales page and I'll write a 90-second video ad script that opens with a killer hook.",
    jobs: ["Reading a sales page", "Picking the ad type", "Sharpening the hook"],
    needs: [],
  },
  copyWriter: {
    id: "copyWriter", title: "Ad Copy Writer", color: "#5cf28b", icon: "pencil", panel: "writer", action: "Write ad copy",
    greet: "Paste the landing page. I'll write 300 words of ad copy and three Meta headlines.",
    jobs: ["Writing the hook", "Breaking down the offer", "Counting headline characters"],
    needs: [],
  },
  imageCopy: {
    id: "imageCopy", title: "Ad Image Copy Writer", color: "#3fd0ff", icon: "scroll", panel: "writer", action: "Write image copy",
    greet: "I write the words that go on ad images: a bold headline, 3 to 4 outcomes and a line that sells it. Who's the target market?",
    jobs: ["Studying sample ads", "Picking the target market", "Writing the headline"],
    needs: [],
  },
  storyboard: {
    id: "storyboard", title: "Storyboard Artist", color: "#ff7a59", icon: "image", panel: "work", action: "Show me your work",
    greet: "Give me a script or an idea and I'll break it into shots: framing, what's on screen, the words and the cut.",
    jobs: ["Sketching the opening shot", "Pinning frames to the wall", "Planning the cuts"],
    needs: [],
  },
  videoScript: {
    id: "videoScript", title: "Video Script Specialist", color: "#ffd23f", icon: "scroll", panel: "work", action: "Show me your work",
    greet: "Reels, YouTube, talking-head videos: tell me what it's about and I'll write the script, hook first.",
    jobs: ["Writing a hook", "Timing the script", "Tightening the call to action"],
    needs: [],
  },
  custom: {
    id: "custom", title: "Assistant", color: "#c4bfe6", icon: "robot", panel: "work", action: "Show me your work",
    greet: "Reporting for duty at {client}. Tell me what my job is.",
    jobs: ["Working on it", "Taking notes", "Getting things done"],
    needs: [
      { key: "job", label: "My job", placeholder: "What should I do?" },
      { key: "tools", label: "Tools and links I need", placeholder: "Links, logins to ask for…", optional: true },
    ],
  },
};

export const ROLE_LIST = Object.values(ROLES);

export const roleOf = (s: CityStaff) => ROLES[s.role] ?? ROLES.custom;
export const titleOf = (s: CityStaff) => s.title || roleOf(s).title;

/** The key a staff member's secret answer is saved under on the server. */
export const secretKey = (staffId: string, needKey: string) => `${staffId}:${needKey}`;

/** How much of what the staff member needs is filled in. */
export function setupProgress(s: CityStaff, savedKeys: string[] = []): { done: number; total: number; missing: Need[] } {
  const needs = roleOf(s).needs.filter((n) => !n.optional);
  const missing = needs.filter((n) => (n.secret ? !savedKeys.includes(secretKey(s.id, n.key)) : !s.setup?.[n.key]?.trim()));
  return { done: needs.length - missing.length, total: needs.length, missing };
}

/** Fills {client} in a role's line. */
export const say = (line: string, place: string) => line.replace(/\{client\}/g, place);

// ---------- seeding ----------

const NAMES = ["Aiko", "Ren", "Yuki", "Kaito", "Mika", "Sora", "Hana", "Riku", "Nami", "Taro", "Emi", "Jin", "Rei", "Kenji", "Saki", "Leo", "Mila", "Zed", "Nova", "Ivy", "Kai", "Luna", "Hiro", "Mei", "Ryo", "Aya", "Sho", "Rin", "Daichi", "Kiko", "Toma", "Yuna", "Max", "Lia", "Ken", "Noa", "Akira", "Chika", "Haru", "Iris", "Juno", "Kira", "Maya", "Nico", "Oto", "Pia", "Quinn", "Raiden", "Suki", "Tetsu", "Umi", "Vera", "Wren", "Yori", "Zara", "Asuka", "Botan", "Chiyo", "Dante", "Eiji", "Fumi", "Gin", "Hikari", "Isamu", "Jiro", "Koa", "Mako", "Nori", "Rika", "Shin", "Tama", "Yoshi", "Ayumi", "Benji", "Cleo", "Dex", "Elle", "Finn", "Hoshi", "Kana"];

/** Staff a client's department starts with: the basics, plus what the client's name hints at. */
export function suggestedRoles(c: Pick<Client, "name" | "notes">): StaffRoleId[] {
  const hay = `${c.name} ${c.notes ?? ""}`.toLowerCase();
  const roles: StaffRoleId[] = ["reporter", "social", "content", "insights", "ads", "email"];
  if (/verse|game|gaming|nft|web3|crypto|community|discord|token|dao|guild/.test(hay)) roles.push("discord");
  if (/coach|webinar|course|mentor|masterclass|academy|lms/.test(hay)) roles.push("webinar");
  if (/\bapp\b|app$|rasengan|saas|software|platform/.test(hay)) roles.push("app");
  if (/ecom|shop|store|retail|merch/.test(hay)) roles.push("store");
  return roles;
}

// The first district sits around the square: the Ad Creative Studio, the Video Production
// House and your home, then the rest of the studios and the shops.
const STUDIOS: { kind: BuildingKind; name: string; roles: StaffRoleId[]; color: string }[] = [
  { kind: "creative", name: "Ad Creative Studio", roles: ["reporter", "scriptWriter", "copyWriter", "imageCopy", "imageAI"], color: "#8e5cd9" },
  { kind: "video", name: "Video Production House", roles: ["reporter", "videoEdit", "videoAI", "storyboard", "videoScript"], color: "#d9443a" },
  { kind: "home", name: "Your Home", roles: [], color: "#c9774a" },
  { kind: "acquisition", name: "Client Acquisition", roles: ["reporter", "funnel", "adsTracker", "videoEdit"], color: "#ff4d5e" },
  { kind: "weapons", name: "Blade & Bolt", roles: [], color: "#e63946" },
  { kind: "armor", name: "Iron Threads", roles: [], color: "#2ec4b6" },
  { kind: "training", name: "Training Hall", roles: [], color: "#7d7574" },
];

/** Shops: walking in opens the shop counter instead of an interior. */
export const isShop = (b: Pick<CityBuilding, "kind">) => b.kind === "weapons" || b.kind === "armor";

/** In the order they're placed around the square. */
export const STUDIO_KINDS: BuildingKind[] = STUDIOS.map((s) => s.kind);

/** Older towns: the names and colours studios used to start with, swapped for the new ones once. */
const OLD_STUDIO: Partial<Record<BuildingKind, { name: string; color: string }>> = {
  creative: { name: "Ad Creatives", color: "#ff9f1c" },
  video: { name: "AI Video Maker", color: "#7c5cff" },
};

export function newStaff(city: CityState, buildingId: string, role: StaffRoleId, today: string): CityStaff {
  const id = uid("staff");
  const used = new Set(city.staff.map((s) => s.name));
  const r = rng(hashString(id));
  const start = Math.floor(r() * NAMES.length);
  let name = NAMES[start];
  for (let i = 0; i < NAMES.length && used.has(name); i++) name = NAMES[(start + i) % NAMES.length];
  if (used.has(name)) name = `${name} ${city.staff.length + 1}`;
  return { id, buildingId, role, name, look: randomHeroLook(r), createdAt: today };
}

export function newBuilding(city: CityState, b: Omit<CityBuilding, "id" | "createdAt">, roles: StaffRoleId[], today: string): CityBuilding {
  const building: CityBuilding = { ...b, id: uid("bld"), createdAt: today };
  city.buildings.push(building);
  for (const role of roles) city.staff.push(newStaff(city, building.id, role, today));
  return building;
}

/**
 * Builds the city the first time, and adds a department for every client added since.
 * Changes the draft passed in. Returns true when anything changed.
 */
export function ensureCity(data: TrackerData, today: string): boolean {
  let changed = false;
  if (!data.city) {
    data.city = { name: DEFAULT_CITY_NAME, buildings: [], staff: [] };
    changed = true;
  }
  const city = data.city;
  // Once: the town becomes Dawnterra. Only names and colours still at their old defaults change,
  // and the Video Production House gets its storyboard and script staff.
  if (!city.dawnterra) {
    city.dawnterra = true;
    changed = true;
    if (city.name === "Nova City") city.name = DEFAULT_CITY_NAME;
    for (const s of STUDIOS) {
      const b = city.buildings.find((x) => x.kind === s.kind);
      const old = OLD_STUDIO[s.kind];
      if (!b || !old) continue;
      if (b.name === old.name) b.name = s.name;
      if (!b.color || b.color === old.color) b.color = s.color;
      if (s.kind === "video")
        for (const role of ["storyboard", "videoScript"] as StaffRoleId[])
          if (!city.staff.some((x) => x.buildingId === b.id && x.role === role)) city.staff.push(newStaff(city, b.id, role, today));
    }
  }
  // Studios are built once each (a newer version of the app can add one to an older city).
  for (const s of STUDIOS) {
    if (city.buildings.some((b) => b.kind === s.kind) || city.skipKinds?.includes(s.kind)) continue;
    newBuilding(city, { kind: s.kind, name: s.name, color: s.color }, s.roles, today);
    changed = true;
  }
  // Once: buildings of the same company (two income lines of one client) become one.
  if (!city.merged) {
    city.merged = true;
    changed = true;
    const names = new Map((data.clients ?? []).map((c) => [c.id, c.name]));
    const byKey = new Map<string, CityBuilding>();
    for (const b of [...city.buildings]) {
      if (b.kind !== "client" || !b.clientId || !names.has(b.clientId)) continue;
      const key = companyKey(names.get(b.clientId)!);
      const first = byKey.get(key);
      if (first) mergeBuildings(city, first.id, b.id, companyName([names.get(first.clientId!)!, ...(first.clientIds ?? []).map((id) => names.get(id) ?? ""), names.get(b.clientId)!]));
      else byKey.set(key, b);
    }
  }
  const skip = new Set(city.skipClients ?? []);
  for (const c of data.clients ?? []) {
    if (c.archived || skip.has(c.id) || city.buildings.some((b) => clientsOf(b).includes(c.id))) continue;
    // A new income line of a company that already has a building moves in there.
    const key = companyKey(c.name);
    const same = city.buildings.find((b) => b.kind === "client" && clientsOf(b).some((id) => companyKey(data.clients?.find((x) => x.id === id)?.name ?? "") === key));
    if (same) {
      const names = clientsOf(same).map((id) => data.clients?.find((x) => x.id === id)?.name ?? "");
      same.clientIds = [...(same.clientIds ?? []), c.id];
      same.name = companyName([...names, c.name]);
    } else newBuilding(city, { kind: "client", name: c.name, clientId: c.id }, suggestedRoles(c), today);
    changed = true;
  }
  return changed;
}

/** Every client a building covers: its own and any merged in. */
export const clientsOf = (b: Pick<CityBuilding, "clientId" | "clientIds">): string[] => (b.clientId ? [b.clientId, ...(b.clientIds ?? [])] : []);

const words = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter((w) => w && w !== "the");

/** Two client records with the same key are the same company: the first two words of the name. */
export function companyKey(name: string): string {
  return words(name).slice(0, 2).join(" ");
}

/** The words every name starts with ("Zeta Community Manager"), or the first name when they share none. */
export function companyName(names: string[]): string {
  const list = names.filter(Boolean);
  if (list.length < 2) return list[0] ?? "";
  const split = list.map((n) => n.replace(/[^A-Za-z0-9]+/g, " ").trim().split(" "));
  const out: string[] = [];
  for (let i = 0; i < split[0].length; i++) {
    const w = split[0][i];
    if (split.every((s) => s[i]?.toLowerCase() === w.toLowerCase())) out.push(w);
    else break;
  }
  return out.join(" ") || list[0];
}

/** Moves building `fromId`'s clients and staff into `intoId` and removes it. Staff in a role the target already has go. */
export function mergeBuildings(city: CityState, intoId: string, fromId: string, name?: string) {
  const into = city.buildings.find((b) => b.id === intoId);
  const from = city.buildings.find((b) => b.id === fromId);
  if (!into || !from || into === from) return;
  into.clientIds = Array.from(new Set([...(into.clientIds ?? []), ...clientsOf(from)])).filter((id) => id !== into.clientId);
  into.rooms = [...(into.rooms ?? []), ...(from.rooms ?? [])];
  into.todos = [...(into.todos ?? []), ...(from.todos ?? [])];
  if (name) into.name = name;
  const roles = new Set(city.staff.filter((s) => s.buildingId === intoId).map((s) => s.role));
  city.staff = city.staff.filter((s) => s.buildingId !== fromId || s.role === "custom" || !roles.has(s.role)).map((s) => (s.buildingId === fromId ? { ...s, buildingId: intoId } : s));
  city.buildings = city.buildings.filter((b) => b.id !== fromId);
  for (const r of city.videoRequests ?? []) if (r.buildingId === fromId) r.buildingId = intoId;
}

/** Gives one of a merged building's clients its own building again. */
export function splitClient(data: TrackerData, buildingId: string, clientId: string, today: string) {
  const city = data.city!;
  const b = city.buildings.find((x) => x.id === buildingId);
  const c = data.clients?.find((x) => x.id === clientId);
  if (!b || !c || !b.clientIds?.includes(clientId)) return;
  b.clientIds = b.clientIds.filter((id) => id !== clientId);
  newBuilding(city, { kind: "client", name: c.name, clientId: c.id }, suggestedRoles(c), today);
}

/** Buildings that stand in the city now: studios and custom ones, and departments of clients still active. */
export function visibleBuildings(data: TrackerData): CityBuilding[] {
  const clients = new Map((data.clients ?? []).map((c) => [c.id, c]));
  return (data.city?.buildings ?? []).filter((b) => !b.clientId || clientsOf(b).some((id) => clients.has(id) && !clients.get(id)!.archived));
}

/** A client building shows the client's current name. */
export function buildingName(data: TrackerData, b: CityBuilding): string {
  if (b.clientIds?.length) return b.name;
  return (b.clientId && data.clients?.find((c) => c.id === b.clientId)?.name) || b.name;
}

/** Knocks a building down with its staff. A client's department isn't rebuilt automatically. */
export function removeBuilding(city: CityState, id: string) {
  const b = city.buildings.find((x) => x.id === id);
  if (!b) return;
  city.buildings = city.buildings.filter((x) => x.id !== id);
  city.staff = city.staff.filter((s) => s.buildingId !== id);
  if (b.clientId) city.skipClients = Array.from(new Set([...(city.skipClients ?? []), ...clientsOf(b)]));
  if (STUDIO_KINDS.includes(b.kind)) city.skipKinds = Array.from(new Set([...(city.skipKinds ?? []), b.kind]));
}

const ROOF = ["#ff5f7a", "#3fd0ff", "#ffd23f", "#5cf28b", "#ff9f1c", "#f15bb5", "#2ec4b6", "#7c5cff", "#e63946", "#00bbf9"];
export const roofColor = (b: CityBuilding) => b.color || ROOF[hashString(b.id) % ROOF.length];

// ---------- map layout ----------

/** World units per tile. */
export const T = 40;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Plot {
  buildingId: string;
  /** The whole plot */
  area: Rect;
  /** The building as drawn (walls and roof); solid */
  house: Rect;
  /** Walk in here to go inside */
  door: Rect;
  /** Where its staff hang out outside */
  yard: Rect;
}

export interface CityLayout {
  w: number;
  h: number;
  plots: Plot[];
  roads: Rect[];
  plaza: Rect;
  fountain: { x: number; y: number; r: number };
  trees: { x: number; y: number; s: number }[];
  lamps: { x: number; y: number }[];
  solids: Rect[];
  spawn: { x: number; y: number };
  /** The sealed gate to the Hollow Wilds, in the north wall */
  gate: Rect;
  /** Where townspeople hang out */
  spots: Record<"gate" | "plaza-left" | "plaza-right" | "corner" | "home", Pt>;
}

export const COLS = 3;
const PLOT_W = 9 * T;
const PLOT_H = 8 * T;
const ROAD = 2 * T;
const MARGIN = 2 * T;

/**
 * Lays the city out on a grid: the plaza in the middle of the top row, the first two studios
 * beside it and the third (your home) just below it, then the other studios and the client
 * buildings row by row. More buildings simply add rows, so the city grows.
 * `smallIds` are cottages (your home): a smaller house on the same size of plot.
 */
export function layoutCity(buildingIds: string[], studioIds: string[] = [], smallIds: string[] = []): CityLayout {
  const slots: (string | "plaza")[] = [];
  const studios = studioIds.filter((id) => buildingIds.includes(id));
  const rest = buildingIds.filter((id) => !studioIds.includes(id));
  const next = (id?: string) => id ?? rest.shift() ?? "";
  // Row 0: studio, plaza, studio. Row 1: studio, the third studio under the plaza, studio.
  slots.push(next(studios[0]), "plaza", next(studios[1]));
  if (studios.length > 2) slots.push(next(studios[3]), studios[2], next(studios[4]));
  rest.unshift(...studios.slice(5));
  slots.push(...rest);
  const rows = Math.max(2, Math.ceil(slots.length / COLS));
  const w = MARGIN * 2 + ROAD + COLS * (PLOT_W + ROAD);
  const h = MARGIN * 2 + ROAD + rows * (PLOT_H + ROAD);
  const roads: Rect[] = [];
  for (let c = 0; c <= COLS; c++) roads.push({ x: MARGIN + c * (PLOT_W + ROAD), y: MARGIN, w: ROAD, h: h - MARGIN * 2 });
  for (let r = 0; r <= rows; r++) roads.push({ x: MARGIN, y: MARGIN + r * (PLOT_H + ROAD), w: w - MARGIN * 2, h: ROAD });
  const plots: Plot[] = [];
  let plaza: Rect = { x: 0, y: 0, w: 0, h: 0 };
  const solids: Rect[] = [];
  const trees: CityLayout["trees"] = [];
  const lamps: CityLayout["lamps"] = [];
  const rand = rng(buildingIds.length * 7919 + 17);
  slots.forEach((id, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const area = { x: MARGIN + ROAD + col * (PLOT_W + ROAD), y: MARGIN + ROAD + row * (PLOT_H + ROAD), w: PLOT_W, h: PLOT_H };
    if (id === "plaza") {
      plaza = area;
      return;
    }
    if (!id) {
      // Empty lot: a little park.
      for (let k = 0; k < 5; k++) trees.push({ x: area.x + T + rand() * (area.w - 2 * T), y: area.y + T * 1.5 + rand() * (area.h - 2.5 * T), s: 0.8 + rand() * 0.5 });
      return;
    }
    const small = smallIds.includes(id);
    const house = small ? { x: area.x + 2.2 * T, y: area.y + T * 1.1, w: 4.6 * T, h: 3.8 * T } : { x: area.x + T, y: area.y + T * 0.5, w: 7 * T, h: 4.6 * T };
    const door = { x: house.x + house.w / 2 - 0.6 * T, y: house.y + house.h - 0.4 * T, w: 1.2 * T, h: 0.7 * T };
    const yardY = house.y + house.h + 0.7 * T;
    const yard = { x: area.x + 0.6 * T, y: yardY, w: area.w - 1.2 * T, h: area.y + area.h - 0.2 * T - yardY };
    plots.push({ buildingId: id, area, house, door, yard });
    solids.push({ x: house.x, y: house.y, w: house.w, h: house.h - 0.35 * T });
    // The cottage's picket fence, with a gap for the path (drawn in components/city/art.tsx).
    if (small) {
      const fy = area.y + area.h - 28;
      solids.push({ x: area.x + 12, y: fy, w: door.x - 22 - area.x - 12, h: 14 }, { x: door.x + door.w + 22, y: fy, w: area.x + area.w - 12 - door.x - door.w - 22, h: 14 });
    }
    // Corner trees
    trees.push({ x: area.x + 0.35 * T, y: area.y + 0.9 * T, s: 0.85 }, { x: area.x + area.w - 0.35 * T, y: area.y + 0.9 * T, s: 0.85 });
  });
  for (let c = 0; c <= COLS; c++) for (let r = 0; r <= rows; r++) lamps.push({ x: MARGIN + c * (PLOT_W + ROAD) - 6, y: MARGIN + r * (PLOT_H + ROAD) - 6 });
  // Forest border, with the gate in the north wall above the plaza
  const gate = { x: plaza.x + plaza.w / 2 - 1.6 * T, y: 0, w: 3.2 * T, h: MARGIN };
  for (let x = T * 0.6; x < w; x += T * 1.15) {
    if (x < gate.x - 0.6 * T || x > gate.x + gate.w + 0.6 * T) trees.push({ x, y: T * 0.9, s: 1 + rand() * 0.3 });
    trees.push({ x: x + T * 0.4, y: h - T * 0.5, s: 1 + rand() * 0.3 });
  }
  solids.push({ x: gate.x - 0.4 * T, y: 0, w: gate.w + 0.8 * T, h: MARGIN - 0.15 * T });
  for (let y = T * 2; y < h - T; y += T * 1.15) trees.push({ x: T * 0.7, y, s: 1 + rand() * 0.3 }, { x: w - T * 0.7, y: y + T * 0.4, s: 1 + rand() * 0.3 });
  for (const t of trees) solids.push({ x: t.x - 12 * t.s, y: t.y - 14 * t.s, w: 24 * t.s, h: 16 * t.s });
  const fountain = { x: plaza.x + plaza.w / 2, y: plaza.y + plaza.h * 0.45, r: 1.3 * T };
  solids.push({ x: fountain.x - fountain.r, y: fountain.y - fountain.r * 0.7, w: fountain.r * 2, h: fountain.r * 1.3 });
  // Walls around the world
  solids.push({ x: -50, y: -50, w: w + 100, h: 50 + T * 0.3 }, { x: -50, y: h - T * 0.2, w: w + 100, h: 50 }, { x: -50, y: 0, w: 50 + T * 0.3, h }, { x: w - T * 0.3, y: 0, w: 50, h });
  const spots = {
    gate: { x: gate.x + gate.w + 1.2 * T, y: MARGIN + ROAD * 0.75 },
    "plaza-left": { x: fountain.x - fountain.r * 2.4, y: fountain.y + 26 },
    "plaza-right": { x: fountain.x + fountain.r * 2.1, y: fountain.y + fountain.r * 1.3 },
    corner: { x: w - MARGIN - ROAD / 2, y: h - MARGIN - ROAD / 2 - 1.5 * T },
    home: (() => {
      const p = plots.find((x) => smallIds.includes(x.buildingId));
      return p ? { x: p.yard.x + 1.4 * T, y: p.yard.y + p.yard.h * 0.5 } : { x: MARGIN + ROAD / 2, y: h - MARGIN - ROAD / 2 - 1.5 * T };
    })(),
  };
  return { w, h, plots, roads, plaza, fountain, trees, lamps, solids, spawn: { x: fountain.x, y: plaza.y + plaza.h - T * 0.8 }, gate, spots };
}

export interface Station {
  staffId: string;
  /** Where they stand, behind their desk */
  x: number;
  y: number;
  desk: Rect;
  /** Their own office: walls all round, with a doorway in the bottom wall onto the hall below. */
  office: Rect;
  door: Rect;
  /** Where their nameplate sits on the office floor (centre x, top y). */
  plate: { x: number; y: number };
  /** The hall in front of their door. */
  hall: number;
}

/** Office size and wall thickness, in world units. Big enough for a desk, visitor chairs, shelves and a rug. */
export const OFFICE_W = 8 * T;
export const OFFICE_H = 6.4 * T;
export const OFFICE_WALL = 12;
const OFFICE_GAP = 0.4 * T;
const OFFICE_DOOR = 1.8 * T;
/** The walkways: a hall along the front of each row of offices, and an aisle down each side joining them. */
const HALL = 1.9 * T;
const AISLE = 2 * T;
const ROOM_DOOR = 3 * T;

export interface InteriorLayout {
  w: number;
  h: number;
  wall: number;
  progress: Rect;
  mission: Rect;
  /** The doorways into the Progress Room and the Mission Room (bottom walls). */
  progressDoor: Rect;
  missionDoor: Rect;
  board: Rect;
  screen: Rect;
  stations: Station[];
  reporter?: { staffId: string; x: number; y: number };
  rooms: { id: string; rect: Rect; sign: Rect }[];
  /** The lobby between the Progress Room and the Mission Room (a studio's set piece goes here) */
  middle: Rect;
  /** The y of every hall, top to bottom, and the x of the two side aisles. */
  halls: number[];
  /** Office furniture against the side walls (copier, water cooler…), each solid. */
  decor: { kind: "copier" | "cooler" | "vending" | "cabinet" | "plant" | "notice"; x: number; y: number }[];
  aisles: [number, number];
  exit: Rect;
  solids: Rect[];
  spawn: { x: number; y: number };
}

/** The walls of a room with one doorway in its bottom wall (the top is the building's back wall or another wall). */
function roomWalls(r: Rect, door: Rect, k: number, top = true): Rect[] {
  return [
    ...(top ? [{ x: r.x, y: r.y, w: r.w, h: k }] : []),
    { x: r.x, y: r.y, w: k, h: r.h },
    { x: r.x + r.w - k, y: r.y, w: k, h: r.h },
    { x: r.x, y: r.y + r.h - k, w: door.x - r.x, h: k },
    { x: door.x + door.w, y: r.y + r.h - k, w: r.x + r.w - door.x - door.w, h: k },
  ];
}

/**
 * Inside a building, laid out like an office floor: the Progress Room and the Mission Room
 * along the back wall with a lobby between, then rows of private offices (one per worker),
 * each with its door onto a hall, and aisles down both sides joining the halls. Extra rooms
 * go at the bottom, by the exit.
 */
export function layoutInterior(staffIds: string[], reporterId: string | undefined, roomIds: string[]): InteriorLayout {
  const n = staffIds.length;
  const perRow = n <= 2 ? Math.max(1, n) : Math.min(4, Math.ceil(n / 2));
  const rows = Math.max(1, Math.ceil(n / perRow));
  const roomCols = Math.ceil(roomIds.length / 2);
  const span = perRow * OFFICE_W + (perRow - 1) * OFFICE_GAP;
  const wTiles = Math.max(26, Math.ceil((span + 2 * AISLE + 0.6 * T) / T), roomCols * 5.6 * 2 + 4);
  const w = wTiles * T;
  const wall = 2.6 * T;
  const k = OFFICE_WALL;
  const progress = { x: T * 0.3, y: wall, w: 9 * T, h: 5.4 * T };
  const mission = { x: w - 9.3 * T, y: wall, w: 9 * T, h: 5.4 * T };
  const progressDoor = { x: progress.x + progress.w / 2 - ROOM_DOOR / 2, y: progress.y + progress.h - k, w: ROOM_DOOR, h: k };
  const missionDoor = { x: mission.x + mission.w / 2 - ROOM_DOOR / 2, y: mission.y + mission.h - k, w: ROOM_DOOR, h: k };
  const screen = { x: progress.x + 2 * T, y: wall - 1.9 * T, w: 5 * T, h: 1.7 * T };
  const board = { x: mission.x + 2 * T, y: wall - 1.9 * T, w: 5 * T, h: 1.7 * T };
  const firstRow = progress.y + progress.h + HALL;
  const rowY = (r: number) => firstRow + r * (OFFICE_H + HALL);
  const halls = [firstRow - HALL / 2, ...Array.from({ length: rows }, (_, r) => rowY(r) + OFFICE_H + HALL / 2)];
  const roomsTop = rowY(rows) + 0.2 * T;
  const h = roomsTop + (roomIds.length ? 4.2 * T : 0) + 2.2 * T;
  const solids: Rect[] = [
    { x: -50, y: -50, w: w + 100, h: wall + 50 },
    { x: -50, y: 0, w: 50 + T * 0.25, h },
    { x: w - T * 0.25, y: 0, w: 50, h },
    { x: -50, y: h - T * 0.3, w: w / 2 - T + 50, h: 50 },
    { x: w / 2 + T, y: h - T * 0.3, w: w / 2 + 50, h: 50 },
    ...roomWalls(progress, progressDoor, k, false),
    ...roomWalls(mission, missionDoor, k, false),
  ];
  const stations: Station[] = [];
  staffIds.forEach((id, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const rowSpan = inRow * OFFICE_W + (inRow - 1) * OFFICE_GAP;
    const office = { x: w / 2 - rowSpan / 2 + (i % perRow) * (OFFICE_W + OFFICE_GAP), y: rowY(row), w: OFFICE_W, h: OFFICE_H };
    // Desk in the back half facing the door; the door sits right of centre so the nameplate fits on the left.
    const x = office.x + office.w * 0.42;
    const y = office.y + k + 1.3 * T;
    const desk = { x: x - 1.2 * T, y: y + 0.15 * T, w: 2.4 * T, h: 0.9 * T };
    const dc = office.x + office.w * 0.74;
    const door = { x: dc - OFFICE_DOOR / 2, y: office.y + office.h - k, w: OFFICE_DOOR, h: k };
    stations.push({ staffId: id, x, y, desk, office, door, plate: { x: office.x + office.w * 0.3, y: office.y + office.h - k - 66 }, hall: halls[row + 1] });
    solids.push(desk, ...roomWalls(office, door, k));
  });
  const rooms = roomIds.map((id, i) => {
    const left = i % 2 === 0;
    const c = Math.floor(i / 2);
    const rw = 5.2 * T;
    const x = left ? T * 0.6 + c * (rw + 0.4 * T) : w - T * 0.6 - rw - c * (rw + 0.4 * T);
    const rect = { x, y: roomsTop, w: rw, h: 3.6 * T };
    return { id, rect, sign: { x: x + rw / 2 - 1.5 * T, y: roomsTop + 0.3 * T, w: 3 * T, h: 0.9 * T } };
  });
  const exit = { x: w / 2 - T, y: h - 0.9 * T, w: 2 * T, h: 0.9 * T };
  const reporter = reporterId ? { staffId: reporterId, x: progress.x + progress.w * 0.66, y: progress.y + 2.2 * T } : undefined;
  if (reporter) solids.push({ x: reporter.x - 1.3 * T, y: reporter.y + 0.15 * T, w: 2.6 * T, h: 0.8 * T });
  const middle = { x: progress.x + progress.w + 0.3 * T, y: wall + 0.2 * T, w: mission.x - progress.x - progress.w - 0.6 * T, h: progress.h - 0.6 * T };
  const aisles: [number, number] = [Math.max(T, (w / 2 - span / 2) / 2), Math.min(w - T, w - (w / 2 - span / 2) / 2)];
  // Along both side walls, beside the offices: the things every office floor has.
  const decor: InteriorLayout["decor"] = [];
  const kinds = ["copier", "cooler", "cabinet", "plant", "vending", "notice", "cabinet", "plant"] as const;
  if (aisles[0] - 0.7 * T > 1.4 * T)
    for (let r = 0; r < rows; r++)
      [0.3 * T, w - 1.5 * T].forEach((x, side) => {
        for (let j = 0; j < 3; j++) {
          const y = rowY(r) + 0.4 * T + j * 2 * T;
          decor.push({ kind: kinds[(r * 6 + side * 3 + j) % kinds.length], x, y });
          solids.push({ x, y: y + 0.6 * T, w: 1.2 * T, h: 0.8 * T });
        }
      });
  return { w, h, wall, progress, mission, progressDoor, missionDoor, board, screen, stations, reporter, rooms, middle, halls, aisles, decor, exit, solids, spawn: { x: w / 2, y: h - 1.6 * T } };
}

/** A walk inside a building that goes out through doors, along the halls and aisles, and in through doors (never through walls). */
export function interiorRoute(I: InteriorLayout, from: Pt, to: Pt): Pt[] {
  const inside = (p: Pt, r: Rect) => p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
  const where = (p: Pt): { door: Rect; hall: number } | null => {
    const st = I.stations.find((s) => inside(p, s.office));
    if (st) return { door: st.door, hall: st.hall };
    if (inside(p, I.progress)) return { door: I.progressDoor, hall: I.halls[0] };
    if (inside(p, I.mission)) return { door: I.missionDoor, hall: I.halls[0] };
    return null;
  };
  const nearestHall = (y: number) => I.halls.reduce((a, v) => (Math.abs(v - y) < Math.abs(a - y) ? v : a), I.halls[0]);
  const a = where(from);
  const b = where(to);
  const hallA = a ? a.hall : nearestHall(from.y);
  const hallB = b ? b.hall : nearestHall(to.y);
  const path: Pt[] = [];
  if (a) {
    const dx = a.door.x + a.door.w / 2;
    // across the room first (behind any desk), then straight out of the door
    path.push({ x: dx, y: from.y }, { x: dx, y: a.door.y - 0.6 * T }, { x: dx, y: hallA });
  } else path.push({ x: from.x, y: hallA });
  if (hallA !== hallB) {
    const mid = (from.x + to.x) / 2;
    const ax = Math.abs(I.aisles[0] - mid) <= Math.abs(I.aisles[1] - mid) ? I.aisles[0] : I.aisles[1];
    path.push({ x: ax, y: hallA }, { x: ax, y: hallB });
  }
  if (b) {
    const dx = b.door.x + b.door.w / 2;
    path.push({ x: dx, y: hallB }, { x: dx, y: b.door.y - 0.6 * T }, { x: dx, y: to.y });
  } else path.push({ x: to.x, y: hallB });
  path.push(to);
  return path;
}

/** True when two rectangles overlap. */
export const hits = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Moves a box by (dx, dy), sliding along anything solid. Returns the new top-left. */
export function moveBox(box: Rect, dx: number, dy: number, solids: Rect[]): { x: number; y: number } {
  let { x, y } = box;
  const tryX = { ...box, x: x + dx };
  if (!solids.some((s) => hits(tryX, s))) x += dx;
  const tryY = { ...box, x, y: y + dy };
  if (!solids.some((s) => hits(tryY, s))) y += dy;
  return { x, y };
}

export interface Pt {
  x: number;
  y: number;
}

/** A walk along the streets from one spot to another: down to the road, along it, round the corner, then up. */
export function roadRoute(from: Pt, to: Pt, layout: Pick<CityLayout, "w" | "h">): Pt[] {
  const rows = Math.round((layout.h - 2 * MARGIN - ROAD) / (PLOT_H + ROAD));
  const hy = Array.from({ length: rows + 1 }, (_, r) => MARGIN + r * (PLOT_H + ROAD) + ROAD / 2);
  const vx = Array.from({ length: COLS + 1 }, (_, c) => MARGIN + c * (PLOT_W + ROAD) + ROAD / 2);
  const below = (y: number) => hy.find((v) => v > y) ?? hy[hy.length - 1];
  const ya = below(from.y);
  const yb = below(to.y - 1);
  const path: Pt[] = [{ x: from.x, y: ya }];
  if (ya !== yb) {
    const mid = (from.x + to.x) / 2;
    const x = vx.reduce((a, v) => (Math.abs(v - mid) < Math.abs(a - mid) ? v : a), vx[0]);
    path.push({ x, y: ya }, { x, y: yb });
  }
  path.push({ x: to.x, y: yb }, to);
  return path;
}
