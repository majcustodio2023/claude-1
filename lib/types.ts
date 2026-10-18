import type { Appearance } from "./appearance";
// Shape of the single document that holds all tracker data.

export type StreamKind = "fixed" | "percent_floor" | "variable";

export interface IncomeStream {
  id: string;
  name: string;
  kind: StreamKind;
  /** fixed: monthly fee. variable: default monthly estimate. */
  amount: number;
  /** percent_floor: share of the client's revenue, e.g. 0.15 */
  percent?: number;
  /** percent_floor: guaranteed minimum payout */
  floor?: number;
  /** Cost of servicing this client each month (for margin only). */
  directCost?: number;
  notes?: string;
  active: boolean;
  /** Optional breakdown into smaller parts, each collected on its own. */
  subs?: SubItem[];
  /** Day of the month this client usually pays (1-31; past the month's end = its last day). */
  payDay?: number;
}

/** One named part of a bill or income (e.g. Household → maid). Ticked off on its own each month. */
export interface SubItem {
  id: string;
  name: string;
  amount: number;
}

/** What happened with one stream in one month. */
export interface StreamMonth {
  /** percent_floor: the client's revenue for the month */
  revenueBase?: number;
  /** variable: actual sales for the month */
  actual?: number;
  /** Amount actually received; set when marked collected. */
  collected?: number;
  collectedOn?: string;
  /** Cash account the money went into. Blank = the first account. */
  accountId?: string;
  /** Parts collected so far (subId -> amount and day). collected is their total. */
  subs?: Record<string, { amount: number; date: string }>;
}

export type DealStage = "lead" | "proposal" | "negotiating" | "won" | "lost";

export interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  note?: string;
  /** Cash account the money went into. Blank = the first account. */
  accountId?: string;
}

export interface Deal {
  id: string;
  name: string;
  client?: string;
  value: number;
  stage: DealStage;
  expectedClose?: string;
  payments: Payment[];
  notes?: string;
  /** The boss's look (lib/avatar.ts). */
  avatar?: string;
  createdAt: string;
  /** Set when marked as failed (stage is then "lost"): why, when, and the stage to go back to on revive. */
  failed?: DealFailure;
  /** Who to talk to about this deal. A deal linked to a client uses the client's contact. */
  contact?: Contact;
  /** Set when the lead would pay every month (a retainer); value is then the monthly fee. Closing it turns it into a recurring client. */
  recurring?: { kind: "fixed" | "variable"; payDay?: number };
}

export interface DealFailure {
  at: string;
  reason?: string;
  /** "unclosed" = never closed; "unpaid" = closed but the rest was never paid. */
  kind: "unclosed" | "unpaid";
  from: DealStage;
}

/** Money that came in by hand, outside clients and deals (a refund, a sale, a gift). */
export interface OneTimeIncome {
  id: string;
  date: string;
  label: string;
  amount: number;
  category?: "sales" | "refund" | "side" | "gift" | "other";
  /** Cash account it went into. Blank = the first account. */
  accountId?: string;
}

export interface ExpenseLine {
  id: string;
  name: string;
  amount: number;
  category: "household" | "payroll" | "client" | "software" | "debt" | "other";
  /** YYYY-MM inclusive bounds; omit for always */
  startMonth?: string;
  endMonth?: string;
  active: boolean;
  /** Pay to a team member for work on a client */
  clientId?: string;
  memberId?: string;
  /** Optional breakdown into smaller parts, each paid on its own. */
  subs?: SubItem[];
  /** Day of the month this bill is due (1-31; past the month's end = its last day). */
  dueDay?: number;
}

export interface AdHocExpense {
  id: string;
  date: string;
  label: string;
  amount: number;
  category: "ads" | "software" | "payroll" | "household" | "fun" | "other";
  /** Cash account it was paid from. Blank = the first account. */
  accountId?: string;
}

/** One payment toward a monthly bill. Bills can be paid in parts. */
export interface BillPayment {
  id: string;
  /** Day it was paid (YYYY-MM-DD) */
  date: string;
  /** When it was recorded in the app (ISO time) */
  at: string;
  amount: number;
  accountId?: string;
  /** The sub-item this pays, when the bill is broken down. */
  subId?: string;
}

/** Money moved between two of your own accounts (e.g. payment gateway to bank). */
export interface Transfer {
  id: string;
  date: string;
  from: string;
  to: string;
  amount: number;
  note?: string;
}

/** Where money sits: a bank, e-wallet, payment gateway, cash box… */
export interface CashAccount {
  id: string;
  name: string;
  /** Balance on cashAsOf */
  balance: number;
}

export interface DailyLog {
  date: string;
  leads?: number;
  bookedCalls?: number;
  showUps?: number;
  closes?: number;
  adSpend?: number;
  wins?: string;
  blockers?: string;
  notes?: string;
  energy?: number; // 1-5
}

/** How to reach someone. Every field is optional. */
export interface Contact {
  person?: string;
  company?: string;
  phone?: string;
  email?: string;
  /** Messenger, WhatsApp, Viber, Telegram, Slack… a link or a handle. */
  chat?: string;
  website?: string;
  address?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  monthlyCost: number;
  notes?: string;
  active: boolean;
  /** Avatar code (lib/avatar.ts); empty means an automatic one. */
  avatar?: string;
  contact?: Contact;
}

/** A client the agency works for. Can be linked to an income stream. */
export interface Client {
  id: string;
  name: string;
  /** How they pay: a monthly retainer (an income stream) or a one-time project (a deal). */
  kind?: "recurring" | "project";
  /** Income stream this client pays through, if any */
  streamId?: string;
  /** Deal for a one-time project */
  dealId?: string;
  notes?: string;
  archived?: boolean;
  avatar?: string;
  contact?: Contact;
  createdAt: string;
}

export type ClientTaskStatus = "todo" | "doing" | "done";

export interface ClientTask {
  id: string;
  clientId: string;
  title: string;
  details?: string;
  /** Who's doing it: "me" (the owner) and/or team member ids. Several = working on it together. */
  assignees: string[];
  status: ClientTaskStatus;
  dueDate?: string;
  createdAt: string;
  doneOn?: string;
}

export type Quadrant = "do" | "schedule" | "delegate" | "eliminate";

export interface Task {
  id: string;
  title: string;
  details?: string;
  quadrant: Quadrant;
  owner: string;
  due?: string; // free text ("Weeks 1-3") or date
  dueDate?: string; // YYYY-MM-DD when known
  /** Time of day it's scheduled for (HH:MM), set from the Calendar. */
  time?: string;
  done: boolean;
  doneOn?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  source?: "auto" | "manual";
}

export interface AdAccount {
  id: string;
  label: string;
  owner: string;
  /** Meta ad account id, with or without act_ prefix */
  accountId: string;
  /** true when a token is saved on the server (the token itself never leaves it) */
  hasToken?: boolean;
  /** Default group for this account's campaigns: "client:<id>", "group:<id>" or "none". */
  group?: string;
}

/** A folder for ad campaigns that aren't tied to one client, e.g. "Personal" or "Agency brand". */
export interface AdGroup {
  id: string;
  name: string;
  avatar?: string;
}

export interface TrackedCampaign {
  id: string;
  adAccountRef: string; // AdAccount.id
  campaignId: string;
  name: string;
  /** "client:<id>", "group:<id>" or "none". Blank = the account's group, else matched by name. */
  group?: string;
  /** view: suggestions only. manage: one-click changes. autopilot: changes applied daily on their own. */
  mode: "view" | "manage" | "autopilot";
  /** Action type counted as a result, e.g. "lead". Defaults to lead detection. */
  resultAction?: string;
  targetCpl?: number;
  targetRoas?: number;
  /** Autopilot never raises a daily budget above this (in the account currency). Without it, Autopilot only cuts. */
  maxDailyBudget?: number;
  /** % a budget is raised or cut by in suggestions and Autopilot (default 20). */
  scaleStep?: number;
  /** An ad is a pause candidate after spending this many times the target cost per result with no results (default 1.5). */
  killAt?: number;
  /** Secret for the read-only share page (/share/<token>). Set and cleared by the server only. */
  shareToken?: string;
}

export interface Creative {
  id: string;
  kind: "image" | "video";
  source: "higgsfield" | "link";
  status: "generating" | "ready" | "failed";
  url?: string;
  prompt?: string;
  /** Higgsfield request, while generating */
  requestId?: string;
  error?: string;
  createdAt: string;
  /** Media already uploaded to each ad account (keyed by AdAccount.id) */
  meta?: Record<string, { imageHash?: string; videoId?: string }>;
  /** Test ads made from this creative */
  ads?: { adId: string; trackedId: string; campaign: string; createdAt: string }[];
}

export interface AutopilotEntry {
  id: string;
  at: string; // ISO time
  trackedId: string;
  campaign: string;
  type: "pause" | "resume" | "budget" | "run";
  targetId?: string;
  /** who made the change: Autopilot (default) or you, from the Manage panel */
  by?: "autopilot" | "you";
  /** What Autopilot did or wanted to do, in plain words */
  action: string;
  status: "done" | "skipped" | "error";
  note?: string;
}

export interface Settings {
  /** Coins it costs to unlock uploading your own banner picture. Blank = 1500. */
  customCoverPrice?: number;
  /** Shown on the hero card and used by Kit. */
  playerName?: string;
  businessName?: string;
  /** A sentence or two about the business, so Kit's advice fits it. */
  businessDescription?: string;
  /** Number and date format, e.g. "en-US", "en-PH", "en-GB". Blank = the device's. */
  locale?: string;
  /** IANA time zone, e.g. "Asia/Manila". Blank = the device's. */
  timeZone?: string;
  /** Show a daily Bible verse on HQ and let Kit use scripture (default off). */
  dailyVerse?: boolean;
  /** Quick prompts in the Creatives tab: [label, prompt]. */
  creativePrompts?: [string, string][];
  monthlyGoal: number;
  /** When set, overrides the sum of expense lines as the "stay afloat" number */
  expenseTargetOverride?: number;
  targetCpl: number;
  targetRoas: number;
  currency: string;
  /** Bank balance on cashAsOf; cash on hand is worked out from there. */
  cashBalance?: number;
  cashAsOf?: string; // YYYY-MM-DD
  /** Expense lines already marked paid in cashAsOf's month when the balance was entered (already out of the bank). */
  cashPaidAtAsOf?: string[];
  /** Every bank balance check-in, newest last. predicted = what the app expected that day. */
  cashHistory?: { date: string; balance: number; predicted?: number }[];
  /** Where the money sits (bank, GCash, Maya…), as of cashAsOf. cashBalance is their total. */
  cashAccounts?: CashAccount[];
  /** Money moves dated on cashAsOf that the balance entered that day already includes. */
  cashSettled?: string[];
  /** Account picked last time money came in or went out, used as the next default. */
  lastAccountId?: string;
  /** Account picked last time a bill or expense was paid. */
  lastPayAccountId?: string;
  /** Months of expenses to keep as a safety buffer (default 3). */
  cashBufferMonths?: number;
  /** Kit's personality (see lib/personas.ts), and the owner's own description when it's "custom". */
  kitPersona?: string;
  kitPersonaCustom?: string;
  /** Share of the month's spare money that's safe to spend on fun (percent, default 20). */
  funPercent?: number;
  /** Income tab: show what you keep after team pay ("profit", default) or the full amount clients pay ("gross"). */
  incomeView?: "profit" | "gross";
  /** The team's name and emblem on the Squad tab. */
  squadName?: string;
  squadAvatar?: string;
  /** Theme, design style, layout and text size (see lib/appearance.ts). */
  appearance?: Appearance;
  /** Music and sound effect volumes, 0 to 1 (0 = off). last* remember the level before muting. */
  sound?: { music?: number; sfx?: number; lastMusic?: number; lastSfx?: number };
}

/** How the hero looks. Every field has a default, so older data needs nothing. */
export interface HeroLook {
  skin?: string;
  /** Hair style id (see lib/heroLook.ts). */
  hair?: string;
  hairColor?: string;
  /** Eye colour. */
  eyes?: string;
  eyeStyle?: string;
  mouth?: string;
  /** Face marks: blush, freckles, scar… */
  marks?: string;
  eyewear?: string;
  headwear?: string;
  earrings?: string;
  /** Top style and its colours (outfit = main colour, accent = trim/chest panel). */
  top?: string;
  outfit?: string;
  accent?: string;
  emblem?: string;
  /** Neckwear style; scarf is its colour. */
  neck?: string;
  scarf?: string;
  back?: string;
  backColor?: string;
  bottoms?: string;
  bottomsColor?: string;
  shoes?: string;
  gloves?: string;
  /** Show the gear earned from achievements (default on). */
  achievementGear?: boolean;
}

export type ItemSlot = "hat" | "face" | "weapon" | "back" | "aura" | "pet" | "kit-head" | "kit-face" | "kit-neck" | "kit-tail";

/** Coins, loot and the hero's wardrobe. */
export interface GameState {
  coins: number;
  /** Reward keys already paid out (e.g. "quest:2026-10-13:id"), so undoing and redoing never pays twice. */
  claimed: Record<string, string>;
  owned: string[];
  equipped: Partial<Record<ItemSlot, string>>;
  look?: HeroLook;
  /** Kit's colours. Blank = the colours of the chosen personality. */
  kitLook?: { fur?: string; eyes?: string };
  /** Bosses (deals) beaten but not fought yet: the battle plays for these. */
  bossQueue?: string[];
  /** Boss battles you gave up on, newest first. A rematch can still win them. */
  battleLosses?: { dealId: string; at: string; round: number }[];
  /** Recent coins and loot, newest first. */
  log: { at: string; text: string; coins?: number; item?: string }[];
  /** Banner covers bought in the shop (free ones aren't listed). */
  covers?: string[];
  /** The banner cover in use: a cover id, or "custom" for your own picture. */
  cover?: string;
  /** Your own banner picture, shrunk to a small JPEG data URL. */
  coverImage?: string;
}

/** One month of fun money: what was safe to spend, and whether it was saved instead. */
export interface FunMonth {
  /** Safe amount last worked out for the month (kept so past months stay as they were). */
  safe: number;
  /** Chose to save it rather than spend it. */
  saved?: boolean;
}

export interface TrackerData {
  version: number;
  settings: Settings;
  streams: IncomeStream[];
  streamMonths: Record<string, Record<string, StreamMonth>>; // month -> streamId -> data
  deals: Deal[];
  oneTime: OneTimeIncome[];
  expenses: ExpenseLine[];
  /** Older data: month -> expenseId -> ticked as paid in full. New payments go in billPayments. */
  expensePaid: Record<string, Record<string, boolean>>;
  /** Payments toward each monthly bill: month -> expenseId -> payments. Replaces expensePaid. */
  billPayments?: Record<string, Record<string, BillPayment[]>>;
  /** Older data: when and from which account a bill ticked as paid was paid. */
  expensePaidFrom?: Record<string, Record<string, { date: string; accountId?: string }>>;
  /** Moves between your own accounts */
  transfers?: Transfer[];
  adHocExpenses: AdHocExpense[];
  logs: Record<string, DailyLog>; // date -> log
  team: TeamMember[];
  tasks: Task[];
  clients?: Client[];
  clientTasks?: ClientTask[];
  todos: Record<string, TodoItem[]>; // date -> items
  /** Hero gear earned from achievements: achievement id -> date first unlocked. Gear is kept for good. */
  heroGear?: Record<string, string>;
  game?: GameState;
  /** Fun money per month (YYYY-MM). Spending itself is in adHocExpenses with category "fun". */
  funMonths?: Record<string, FunMonth>;
  /** Kit's briefing as rewritten in chat, for one day. Falls back to the automatic one. */
  briefing?: { date: string; headline: string; points: string[]; inspiration?: string };
  /** Recent chat with Kit (kept short). */
  kitChat?: KitMessage[];
  adAccounts: AdAccount[];
  trackedCampaigns: TrackedCampaign[];
  /** Custom folders for campaigns, next to the client folders. */
  adGroups?: AdGroup[];
  autopilotLog?: AutopilotEntry[];
  /** Ad creatives: AI-generated (Higgsfield) or added by link. Owned by the server. */
  creatives?: Creative[];
  /** What city staff made, newest first. Owned by the server (like creatives). */
  staffWork?: StaffWork[];
  /** The virtual city: buildings (one per client plus studios), their rooms and AI staff. */
  city?: CityState;
  /** Set by the server: which integrations have a saved key (keys never reach the browser). */
  integrations?: { higgsfield?: boolean; kit?: boolean; voice?: boolean; calendar?: boolean; staffKeys?: string[] };
  updatedAt?: string;
}

export interface KitMessage {
  role: "user" | "assistant";
  text: string;
  at: string;
}

// ---- The city ----

export type StaffRoleId =
  | "reporter" | "social" | "content" | "insights" | "ads" | "email" | "discord" | "webinar" | "app" | "store"
  | "videoAI" | "videoEdit" | "funnel" | "adsTracker" | "imageAI" | "scriptWriter" | "copyWriter" | "imageCopy" | "storyboard" | "videoScript" | "custom";

export type BuildingKind = "client" | "video" | "acquisition" | "creative" | "weapons" | "armor" | "home" | "custom";

/** A piece of furniture in the player's home, on the room's tile grid. */
export interface PlacedFurniture {
  id: string;
  /** lib/home.ts FURNITURE key */
  kind: string;
  x: number;
  y: number;
}

export interface CityRoom {
  id: string;
  name: string;
  notes?: string;
}

export interface CityTodo {
  id: string;
  title: string;
  done: boolean;
  doneOn?: string;
}

export interface CityBuilding {
  id: string;
  kind: BuildingKind;
  name: string;
  /** Client buildings: the client this is the department for. */
  clientId?: string;
  /** More clients this building also covers: income lines of the same company, e.g. a commission and a second-half payment. */
  clientIds?: string[];
  /** Roof colour (#rrggbb). Blank = picked from the id. */
  color?: string;
  /** Extra rooms beside the built-in Progress Room and Mission Room. */
  rooms?: CityRoom[];
  /** What the reporter says on top of the automatic numbers. */
  progressNote?: string;
  /** Mission Room list for buildings with no client (client buildings use the client's tasks). */
  todos?: CityTodo[];
  /** The player's home: furniture as placed. */
  furniture?: PlacedFurniture[];
  createdAt: string;
}

export interface CityStaff {
  id: string;
  buildingId: string;
  role: StaffRoleId;
  name: string;
  /** Job title shown instead of the role's (custom staff). */
  title?: string;
  look?: HeroLook;
  /** Answers to what the role needs (links, handles, schedule). Keys and passwords go to the server, not here. */
  setup?: Record<string, string>;
  /** Writers: how they write (their system prompt). Blank = the role's starting instructions. */
  instructions?: string;
  /** Writers: examples to copy the style of (pasted text or links to sample ads). */
  samples?: { id: string; text: string }[];
  /** Writers: what they wrote, newest first (kept short). */
  outputs?: { id: string; input: string; target?: string; text: string; at: string }[];
  /** false = don't do the daily job on their own (they still work when asked). */
  autoWork?: boolean;
  createdAt: string;
}

/** Something a city staff member made (posts, a calendar, reply drafts…). Kept by the server. */
export interface StaffWork {
  id: string;
  staffId: string;
  buildingId: string;
  /** lib/cityJobs.ts job id */
  jobId: string;
  /** e.g. "This week's posts" */
  label: string;
  text: string;
  /** What you gave them for this job (a pasted email, reviews…), shortened. */
  input?: string;
  /** Done on their own (daily job) rather than asked. */
  auto?: boolean;
  /** Day it was done (business time zone), YYYY-MM-DD */
  day: string;
  at: string;
  /** Set when it was posted somewhere for real (e.g. "Posted to Discord"). */
  sent?: string;
  /** queued = waiting for Claude in the project to do it (no API key); text is blank until then. */
  status?: "queued";
  /** The brief, kept only while queued. */
  prompt?: { system: string; user: string };
}

export interface VideoRequest {
  id: string;
  buildingId: string;
  /** Link to the raw video (Drive, Dropbox…). Blank when uploaded or prompt-only. */
  videoUrl: string;
  /** Uploaded raw video: its path in the tracker's file storage, and the file name. */
  /** parts: stored in that many pieces (path.part0…) when it was too big for one upload. */
  file?: { path: string; name: string; size: number; parts?: number };
  style: string;
  prompt: string;
  status: "requested" | "editing" | "done";
  resultUrl?: string;
  createdAt: string;
}

export interface CityState {
  name: string;
  buildings: CityBuilding[];
  staff: CityStaff[];
  /** Clients whose building was knocked down on purpose, so it isn't rebuilt. */
  skipClients?: string[];
  /** Studios (video, acquisition, creative) knocked down on purpose. */
  skipKinds?: BuildingKind[];
  videoRequests?: VideoRequest[];
  /** Quests taken from townspeople: when, and the count their goal is measured from. */
  quests?: Record<string, { at: string; base: number }>;
  /** Shops give gear away while this is on (default). Off = items cost coins. */
  freeShops?: boolean;
  /** Set once client buildings of the same company have been merged automatically. */
  merged?: boolean;
  /** Set once the town was moved to Dawnterra (renamed studios, new video staff). */
  dawnterra?: boolean;
}
