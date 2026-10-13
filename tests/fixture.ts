import type { TrackerData } from "../lib/types";

/** Sample business used by the tests (fictional names; numbers chosen to exercise the money rules). */
export function sampleData(): TrackerData {
  const created = "2026-10-12";
  return {
    version: 4,
    settings: { playerName: "Alex", monthlyGoal: 250000, targetCpl: 500, targetRoas: 2, currency: "PHP", locale: "en-PH", timeZone: "Asia/Manila", dailyVerse: true, cashBalance: 165000, cashAsOf: "2026-10-11" },
    streams: [
      {
        id: "leh", name: "Partner store (revenue share)", kind: "percent_floor", amount: 25000,
        percent: 0.15, floor: 25000, active: true,
        notes: "15% of their revenue, or a flat 25,000 if 15% comes in lower.",
      },
      {
        id: "opsified", name: "Retainer client A (ads management)", kind: "fixed", amount: 50000,
        directCost: 18000, active: true,
        
      },
      { id: "ads-client", name: "Retainer client B", kind: "fixed", amount: 18000, active: true },
      {
        id: "aacio", name: "SaaS sales", kind: "variable", amount: 40000, active: true,
        
      },
    ],
    streamMonths: {
      "2026-10": { aacio: { actual: 38766, collected: 38766, collectedOn: "2026-10-11" } },
    },
    deals: [
      { id: "deal-ot-1", name: "One-off project payment", value: 30000, stage: "won", expectedClose: "2026-10-11", payments: [], createdAt: created },
      { id: "lms", name: "Course platform project", value: 135000, stage: "negotiating", payments: [], createdAt: created },
      { id: "webinar", name: "Webinar funnel project", value: 80000, stage: "negotiating", payments: [], createdAt: created },
      {
        id: "interior", name: "Big funnel build", value: 230000, stage: "negotiating", payments: [], createdAt: created,
        
      },
    ],
    oneTime: [],
    expenses: [
      { id: "household", name: "Household expenses", amount: 65500, category: "household", active: true },
      { id: "salary", name: "Employee salary", amount: 27000, category: "payroll", active: true },
      { id: "client-costs", name: "Client servicing costs", amount: 22000, category: "client", active: true },
      { id: "ghl", name: "Software subscriptions", amount: 26000, category: "software", active: true },
      { id: "debt", name: "Debt repayment", amount: 20000, category: "debt", startMonth: "2026-11", endMonth: "2027-04", active: true },
    ],
    expensePaid: {},
    adHocExpenses: [{ id: "adhoc-1", date: "2026-10-11", label: "Delayed salary (one-time)", amount: 22000, category: "payroll" }],
    logs: {},
    team: [
      { id: "va", name: "VA / accountant", role: "Collections, bookkeeping, support, scheduling, reports", monthlyCost: 27000, active: true },
    ],
    tasks: [
      { id: "do-1", title: "Reconcile cash and incoming payments", due: "Today", owner: "You", quadrant: "do", done: false },
      { id: "do-2", title: "Send invoices for closed work", due: "This week", owner: "VA", quadrant: "do", done: false },
      { id: "schedule-1", title: "Build a 13-week cash-flow forecast", due: "Week 2", owner: "You", quadrant: "schedule", done: false },
    ],
    todos: {},
    adAccounts: [],
    trackedCampaigns: [],
  };
}
