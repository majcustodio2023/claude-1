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
  createdAt: string;
}

export interface OneTimeIncome {
  id: string;
  date: string;
  label: string;
  amount: number;
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

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  monthlyCost: number;
  notes?: string;
  active: boolean;
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
}

export interface TrackedCampaign {
  id: string;
  adAccountRef: string; // AdAccount.id
  campaignId: string;
  name: string;
  /** view: suggestions only. manage: one-click changes. autopilot: changes applied daily on their own. */
  mode: "view" | "manage" | "autopilot";
  /** Action type counted as a result, e.g. "lead". Defaults to lead detection. */
  resultAction?: string;
  targetCpl?: number;
  targetRoas?: number;
  /** Autopilot never raises a daily budget above this (in the account currency). Without it, Autopilot only cuts. */
  maxDailyBudget?: number;
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
  type: "pause" | "budget" | "run";
  targetId?: string;
  /** What Autopilot did or wanted to do, in plain words */
  action: string;
  status: "done" | "skipped" | "error";
  note?: string;
}

export interface Settings {
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
}

/** How the hero looks. Every field has a default, so older data needs nothing. */
export interface HeroLook {
  skin?: string;
  hair?: "spiky" | "long" | "mohawk" | "bob";
  hairColor?: string;
  eyes?: string;
  outfit?: string;
  accent?: string;
  scarf?: string;
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
  /** Bosses (deals) beaten but not fought yet: the mini game plays for these. */
  bossQueue?: string[];
  /** Recent coins and loot, newest first. */
  log: { at: string; text: string; coins?: number; item?: string }[];
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
  autopilotLog?: AutopilotEntry[];
  /** Ad creatives: AI-generated (Higgsfield) or added by link. Owned by the server. */
  creatives?: Creative[];
  /** Set by the server: which integrations have a saved key (keys never reach the browser). */
  integrations?: { higgsfield?: boolean; kit?: boolean; voice?: boolean };
  updatedAt?: string;
}

export interface KitMessage {
  role: "user" | "assistant";
  text: string;
  at: string;
}
