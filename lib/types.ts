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
}

export type DealStage = "lead" | "proposal" | "negotiating" | "won" | "lost";

export interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  note?: string;
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
}

export interface AdHocExpense {
  id: string;
  date: string;
  label: string;
  amount: number;
  category: "ads" | "software" | "payroll" | "household" | "other";
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
  /** Autopilot never raises a daily budget above this (pesos). Without it, Autopilot only cuts. */
  maxDailyBudget?: number;
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
  monthlyGoal: number;
  /** When set, overrides the sum of expense lines as the "stay afloat" number */
  expenseTargetOverride?: number;
  targetCpl: number;
  targetRoas: number;
  currency: string;
  /** Bank balance on cashAsOf; cash on hand is worked out from there. */
  cashBalance?: number;
  cashAsOf?: string; // YYYY-MM-DD
}

export interface TrackerData {
  version: number;
  settings: Settings;
  streams: IncomeStream[];
  streamMonths: Record<string, Record<string, StreamMonth>>; // month -> streamId -> data
  deals: Deal[];
  oneTime: OneTimeIncome[];
  expenses: ExpenseLine[];
  expensePaid: Record<string, Record<string, boolean>>; // month -> expenseId -> paid
  adHocExpenses: AdHocExpense[];
  logs: Record<string, DailyLog>; // date -> log
  team: TeamMember[];
  tasks: Task[];
  todos: Record<string, TodoItem[]>; // date -> items
  adAccounts: AdAccount[];
  trackedCampaigns: TrackedCampaign[];
  autopilotLog?: AutopilotEntry[];
  updatedAt?: string;
}
