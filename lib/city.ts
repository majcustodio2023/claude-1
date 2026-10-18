// The virtual city: one building per client plus studios, each with a Progress Room,
// a Mission Room, extra rooms and AI staff. Pure helpers (layout, seeding, staff roles)
// so they're unit-tested; the game itself is components/city.

import { hashString, rng } from "./avatar";
import { randomHeroLook } from "./heroLook";
import { uid } from "./finance";
import type { BuildingKind, CityBuilding, CityStaff, CityState, Client, StaffRoleId, TrackerData } from "./types";

export const DEFAULT_CITY_NAME = "Nova City";

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

export type PanelKind = "report" | "tasks" | "setup" | "videoAI" | "imageAI" | "writer" | "videoEdit" | "funnel" | "ads" | "webinar";

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
    id: "social", title: "Social Media Manager", color: "#ff5fae", icon: "megaphone", panel: "setup", action: "Here's what I need",
    greet: "I run {client}'s social pages. Hook me up to the pages and I'll keep them posting.",
    jobs: ["Scheduling posts", "Replying to comments", "Planning this week's content"],
    needs: [
      { key: "facebook", label: "Facebook page link", placeholder: "https://facebook.com/…" },
      { key: "instagram", label: "Instagram handle", placeholder: "@handle" },
      { key: "tiktok", label: "TikTok handle", placeholder: "@handle", optional: true },
      { key: "perWeek", label: "Posts per week", placeholder: "5" },
      { key: "voice", label: "Brand voice", placeholder: "Friendly, bold, no jargon…" },
      { key: "metaToken", label: "Meta Page access token", placeholder: "Paste the page token", secret: true },
    ],
  },
  content: {
    id: "content", title: "Content Creator", color: "#ff9f1c", icon: "pencil", panel: "setup", action: "Here's what I need",
    greet: "Captions, carousels, scripts: I write {client}'s posts. Tell me what they're about.",
    jobs: ["Drafting captions", "Writing a reel script", "Designing a carousel"],
    needs: [
      { key: "pillars", label: "Content pillars", placeholder: "Tips, behind the scenes, wins…" },
      { key: "offer", label: "What we're promoting", placeholder: "The main offer right now" },
      { key: "drive", label: "Assets folder link", placeholder: "Google Drive link", optional: true },
    ],
  },
  insights: {
    id: "insights", title: "Page Insights Analyst", color: "#3fd0ff", icon: "radar", panel: "setup", action: "Here's what I need",
    greet: "I watch {client}'s page numbers: reach, engagement and follower growth.",
    jobs: ["Checking yesterday's reach", "Finding the best post", "Tracking follower growth"],
    needs: [
      { key: "pageId", label: "Facebook page ID", placeholder: "1234567890" },
      { key: "igId", label: "Instagram business ID", placeholder: "1784…", optional: true },
      { key: "metaToken", label: "Meta access token (read insights)", placeholder: "Paste the token", secret: true },
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
    id: "email", title: "Inbox Reader", color: "#c4bfe6", icon: "mail", panel: "setup", action: "Here's what I need",
    greet: "I read {client}'s emails so you don't have to, and flag what needs you.",
    jobs: ["Reading new emails", "Flagging the urgent ones", "Drafting replies"],
    needs: [
      { key: "address", label: "Email address to watch", placeholder: "client@example.com" },
      { key: "watch", label: "Flag emails about", placeholder: "Invoices, approvals, complaints…" },
      { key: "appPassword", label: "Gmail app password", placeholder: "16 letters from Google", secret: true },
    ],
  },
  discord: {
    id: "discord", title: "Discord Community Manager", color: "#7c5cff", icon: "chat", panel: "setup", action: "Here's what I need",
    greet: "I keep {client}'s Discord alive: welcomes, answers, events and keeping it clean.",
    jobs: ["Welcoming new members", "Answering questions", "Planning a community event"],
    needs: [
      { key: "invite", label: "Server invite link", placeholder: "https://discord.gg/…" },
      { key: "rules", label: "Tone and rules", placeholder: "Hype but respectful, no spam…" },
      { key: "hours", label: "Hours I'm on duty", placeholder: "9am to 11pm" },
      { key: "botToken", label: "Discord bot token", placeholder: "From the Discord developer portal", secret: true },
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
    id: "app", title: "App Growth Manager", color: "#2ec4b6", icon: "phone", panel: "setup", action: "Here's what I need",
    greet: "I look after {client}: store listing, reviews, releases and installs.",
    jobs: ["Reading new reviews", "Writing release notes", "Checking installs"],
    needs: [
      { key: "appStore", label: "App Store link", placeholder: "https://apps.apple.com/…", optional: true },
      { key: "playStore", label: "Play Store link", placeholder: "https://play.google.com/…", optional: true },
      { key: "release", label: "Next release", placeholder: "What's shipping and when" },
    ],
  },
  store: {
    id: "store", title: "Store Manager", color: "#f15bb5", icon: "shop", panel: "setup", action: "Here's what I need",
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
  custom: {
    id: "custom", title: "Assistant", color: "#c4bfe6", icon: "robot", panel: "setup", action: "Here's what I need",
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

const STUDIOS: { kind: BuildingKind; name: string; roles: StaffRoleId[]; color: string }[] = [
  { kind: "video", name: "AI Video Maker", roles: ["reporter", "videoAI", "videoEdit"], color: "#7c5cff" },
  { kind: "acquisition", name: "Client Acquisition", roles: ["reporter", "funnel", "adsTracker", "videoEdit"], color: "#ff4d5e" },
  { kind: "creative", name: "Ad Creatives", roles: ["reporter", "scriptWriter", "copyWriter", "imageCopy", "imageAI"], color: "#ff9f1c" },
  { kind: "weapons", name: "Blade & Bolt", roles: [], color: "#e63946" },
  { kind: "armor", name: "Iron Threads", roles: [], color: "#2ec4b6" },
];

/** Shops: walking in opens the shop counter instead of an interior. */
export const isShop = (b: Pick<CityBuilding, "kind">) => b.kind === "weapons" || b.kind === "armor";

export const STUDIO_KINDS: BuildingKind[] = STUDIOS.map((s) => s.kind);

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
  // Studios are built once each (a newer version of the app can add one to an older city).
  for (const s of STUDIOS) {
    if (city.buildings.some((b) => b.kind === s.kind) || city.skipKinds?.includes(s.kind)) continue;
    newBuilding(city, { kind: s.kind, name: s.name, color: s.color }, s.roles, today);
    changed = true;
  }
  const skip = new Set(city.skipClients ?? []);
  for (const c of data.clients ?? []) {
    if (c.archived || skip.has(c.id) || city.buildings.some((b) => b.clientId === c.id)) continue;
    newBuilding(city, { kind: "client", name: c.name, clientId: c.id }, suggestedRoles(c), today);
    changed = true;
  }
  return changed;
}

/** Buildings that stand in the city now: studios and custom ones, and departments of clients still active. */
export function visibleBuildings(data: TrackerData): CityBuilding[] {
  const clients = new Map((data.clients ?? []).map((c) => [c.id, c]));
  return (data.city?.buildings ?? []).filter((b) => !b.clientId || (clients.has(b.clientId) && !clients.get(b.clientId)!.archived));
}

/** A client building shows the client's current name. */
export function buildingName(data: TrackerData, b: CityBuilding): string {
  return (b.clientId && data.clients?.find((c) => c.id === b.clientId)?.name) || b.name;
}

/** Knocks a building down with its staff. A client's department isn't rebuilt automatically. */
export function removeBuilding(city: CityState, id: string) {
  const b = city.buildings.find((x) => x.id === id);
  if (!b) return;
  city.buildings = city.buildings.filter((x) => x.id !== id);
  city.staff = city.staff.filter((s) => s.buildingId !== id);
  if (b.clientId) city.skipClients = Array.from(new Set([...(city.skipClients ?? []), b.clientId]));
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
  spots: Record<"gate" | "plaza-left" | "plaza-right" | "corner", Pt>;
}

export const COLS = 3;
const PLOT_W = 9 * T;
const PLOT_H = 8 * T;
const ROAD = 2 * T;
const MARGIN = 2 * T;

/**
 * Lays the city out on a grid: the plaza in the middle of the top row, the studios beside it,
 * then client buildings row by row. More buildings simply add rows, so the city grows.
 */
export function layoutCity(buildingIds: string[], studioIds: string[] = []): CityLayout {
  const slots: (string | "plaza")[] = [];
  const studios = buildingIds.filter((id) => studioIds.includes(id));
  const rest = buildingIds.filter((id) => !studioIds.includes(id));
  // Row 0: studio, plaza, studio.
  slots.push(studios[0] ?? rest.shift() ?? "", "plaza", studios[1] ?? rest.shift() ?? "");
  for (const id of studios.slice(2)) rest.unshift(id);
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
    const house = { x: area.x + T, y: area.y + T * 0.5, w: 7 * T, h: 4.6 * T };
    const door = { x: house.x + house.w / 2 - 0.6 * T, y: house.y + house.h - 0.4 * T, w: 1.2 * T, h: 0.7 * T };
    const yard = { x: area.x + 0.6 * T, y: house.y + house.h + 0.7 * T, w: area.w - 1.2 * T, h: area.h - house.h - 1.4 * T };
    plots.push({ buildingId: id, area, house, door, yard });
    solids.push({ x: house.x, y: house.y, w: house.w, h: house.h - 0.35 * T });
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
  };
  return { w, h, plots, roads, plaza, fountain, trees, lamps, solids, spawn: { x: fountain.x, y: plaza.y + plaza.h - T * 0.8 }, gate, spots };
}

export interface Station {
  staffId: string;
  /** Where they stand */
  x: number;
  y: number;
  desk: Rect;
}

export interface InteriorLayout {
  w: number;
  h: number;
  wall: number;
  progress: Rect;
  mission: Rect;
  board: Rect;
  screen: Rect;
  stations: Station[];
  reporter?: { staffId: string; x: number; y: number };
  rooms: { id: string; rect: Rect; sign: Rect }[];
  exit: Rect;
  solids: Rect[];
  spawn: { x: number; y: number };
}

/** Inside a building: Progress Room top left, Mission Room top right, staff desks across the middle, extra rooms below. */
export function layoutInterior(staffIds: string[], reporterId: string | undefined, roomIds: string[]): InteriorLayout {
  const perRow = Math.max(4, Math.min(7, staffIds.length));
  const deskRows = Math.max(1, Math.ceil(staffIds.length / perRow));
  const roomCols = Math.ceil(roomIds.length / 2);
  const wTiles = Math.max(20, perRow * 3.4 + 4, roomCols * 5.6 * 2 + 4);
  const w = wTiles * T;
  const wall = 2.6 * T;
  const deskTop = wall + 5.6 * T;
  const roomsTop = deskTop + deskRows * 2.6 * T + 0.6 * T;
  const h = roomsTop + (roomIds.length ? 4.2 * T : 0.4 * T) + 1.4 * T;
  const progress = { x: T * 0.6, y: wall + 0.3 * T, w: 7.5 * T, h: 4.6 * T };
  const mission = { x: w - 8.1 * T, y: wall + 0.3 * T, w: 7.5 * T, h: 4.6 * T };
  const screen = { x: progress.x + 1.2 * T, y: wall - 1.9 * T, w: 5 * T, h: 1.7 * T };
  const board = { x: mission.x + 1.2 * T, y: wall - 1.9 * T, w: 5 * T, h: 1.7 * T };
  const solids: Rect[] = [
    { x: -50, y: -50, w: w + 100, h: wall + 50 },
    { x: -50, y: 0, w: 50 + T * 0.25, h },
    { x: w - T * 0.25, y: 0, w: 50, h },
    { x: -50, y: h - T * 0.3, w: w / 2 - T + 50, h: 50 },
    { x: w / 2 + T, y: h - T * 0.3, w: w / 2 + 50, h: 50 },
  ];
  const stations: Station[] = [];
  staffIds.forEach((id, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, staffIds.length - row * perRow);
    const span = inRow * 3.4 * T;
    const x = w / 2 - span / 2 + (i % perRow) * 3.4 * T + 1.7 * T;
    const y = deskTop + row * 2.6 * T;
    const desk = { x: x - 1.2 * T, y: y + 0.15 * T, w: 2.4 * T, h: 0.9 * T };
    stations.push({ staffId: id, x, y, desk });
    solids.push(desk);
  });
  const rooms = roomIds.map((id, i) => {
    const left = i % 2 === 0;
    const k = Math.floor(i / 2);
    const rw = 5.2 * T;
    const x = left ? T * 0.6 + k * (rw + 0.4 * T) : w - T * 0.6 - rw - k * (rw + 0.4 * T);
    const rect = { x, y: roomsTop, w: rw, h: 3.6 * T };
    return { id, rect, sign: { x: x + rw / 2 - 1.5 * T, y: roomsTop + 0.3 * T, w: 3 * T, h: 0.9 * T } };
  });
  const exit = { x: w / 2 - T, y: h - 0.9 * T, w: 2 * T, h: 0.9 * T };
  const reporter = reporterId ? { staffId: reporterId, x: progress.x + progress.w / 2, y: progress.y + 2.2 * T } : undefined;
  if (reporter) solids.push({ x: reporter.x - 1.3 * T, y: reporter.y + 0.15 * T, w: 2.6 * T, h: 0.8 * T });
  return { w, h, wall, progress, mission, board, screen, stations, reporter, rooms, exit, solids, spawn: { x: w / 2, y: h - 1.6 * T } };
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
