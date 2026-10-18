import type { TrackerData } from "./types";

// What a brand-new install starts with: empty, with sensible defaults. The HQ
// setup card asks for the owner's name, business, currency and goal.

export function seedData(): TrackerData {
  return {
    version: 7,
    settings: { monthlyGoal: 10000, targetCpl: 20, targetRoas: 2, currency: "USD", cashBufferMonths: 3 },
    streams: [],
    streamMonths: {},
    deals: [],
    oneTime: [],
    expenses: [],
    expensePaid: {},
    billPayments: {},
    adHocExpenses: [],
    logs: {},
    team: [],
    tasks: [],
    clients: [],
    clientTasks: [],
    todos: {},
    adAccounts: [],
    trackedCampaigns: [],
  };
}
