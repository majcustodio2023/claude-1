import type { Quadrant, Task, TrackerData } from "./types";

// Starting data, taken from Maj's numbers and the CEO Master Action Plan (Oct 11, 2026).

type TaskSeed = [title: string, due: string, owner: string, details?: string];

const plan: Record<Quadrant, TaskSeed[]> = {
  do: [
    ["Reconcile all cash and incoming payments", "Today", "You + VA",
      "Confirm ₱165k bank balance, ₱30k one-time collection, ₱38,766 AACIO collection, and payment status of the ₱25k, ₱50k and ₱18k retainers. Remove any duplicates."],
    ["Settle the ₱22,000 delayed salary", "Today", "VA"],
    ["Create a 13-week cash-flow forecast", "Within 48 hours", "VA"],
    ["Close the ₱230,000 interior design funnel project", "This week", "You"],
    ["Close the ₱80,000 webinar funnel prospect", "This week", "You"],
    ["Audit GHL subscription and additional usage", "Within 72 hours", "VA + You"],
    ["Protect the ₱20,000 debt payments", "This week", "VA"],
    ["Build the AACIO profitability report", "This week", "VA"],
    ["Set spending limits and payment reserves", "Today", "You"],
    ["Audit the ₱18k and ₱4k client costs", "This week", "VA"],
    ["Check upcoming client renewals and receivables", "This week", "VA"],
    ["Validate payroll transition and task ownership", "Within 72 hours", "You"],
  ],
  schedule: [
    ["Launch AI Lead-to-Appointment System", "Weeks 1–3", "You"],
    ["Launch Aesthetic Clinic Booking SaaS", "Weeks 1–4", "You"],
    ["Build booking upsell features", "Weeks 3–6", "You"],
    ["Implement the ₱10k customization package", "Week 2", "You + VA"],
    ["Acquire first 3–5 paying clinic pilots", "Weeks 2–4", "You"],
    ["Build a reusable demo and onboarding system", "Weeks 2–4", "You + VA"],
    ["Create premium AI sales funnel and ads", "Weeks 2–4", "You"],
    ["Measure marketing unit economics", "Weekly", "You + VA"],
    ["Audit all 76 AACIO accounts", "Weeks 1–2", "VA"],
    ["Investigate AACIO's four largest usage accounts", "Weeks 1–2", "You + VA"],
    ["Introduce AACIO usage limits and upgrades", "Weeks 3–5", "You"],
    ["Decide whether to retain or migrate AACIO", "By day 30", "You"],
    ["Build shared SaaS infrastructure", "Weeks 2–8", "You"],
    ["Set product pricing, terms and boundaries", "Before paid launch", "You + adviser"],
    ["Design clinic customer retention automation", "Weeks 4–7", "You"],
    ["Prepare hotel booking product discovery", "Weeks 5–8", "You"],
    ["Negotiate a safer investor structure", "Before accepting capital", "You + lawyer"],
    ["Create a three-month cash reserve plan", "Monthly", "You + VA"],
    ["Build weekly CEO dashboard", "Week 1", "VA"],
    ["Document founder workload and automation", "Weeks 2–6", "You"],
    ["Develop upsells for existing customers", "Weeks 3–6", "You"],
    ["Create sales scripts and objection handling", "Week 2", "You"],
  ],
  delegate: [
    ["Follow up outstanding invoices", "Daily", "VA"],
    ["Maintain customer support inbox", "Daily", "VA"],
    ["Update financial records and receipts", "Weekly", "VA"],
    ["Schedule demos and follow-ups", "Daily", "VA"],
    ["Prepare customer onboarding materials", "Weeks 2–4", "VA"],
    ["Compile weekly marketing reports", "Weekly", "VA"],
    ["Track the debt installment schedule", "Monthly", "VA"],
    ["Maintain the SaaS feature-request backlog", "Ongoing", "VA"],
  ],
  eliminate: [
    ["Avoid a complete AACIO rebuild before profitability audit", "Stop now", "You"],
    ["Avoid launching too many unrelated apps", "Stop now", "You"],
    ["Avoid unlimited free design and customization", "Stop now", "You"],
    ["Avoid untested large ad budgets", "Stop now", "You"],
    ["Avoid guaranteed 5% monthly investor payouts", "Stop now", "You"],
    ["Avoid rehiring permanent specialists prematurely", "Stop now", "You"],
    ["Avoid treating project deposits as profit", "Stop now", "You"],
    ["Avoid spending based on unclosed deals", "Stop now", "You"],
  ],
};

function seedTasks(): Task[] {
  const out: Task[] = [];
  for (const [quadrant, rows] of Object.entries(plan) as [Quadrant, TaskSeed[]][]) {
    rows.forEach(([title, due, owner, details], i) => {
      out.push({ id: `${quadrant}-${i + 1}`, title, due, owner, details, quadrant, done: false });
    });
  }
  return out;
}

export function seedData(): TrackerData {
  const created = "2026-10-12";
  return {
    version: 2,
    settings: { monthlyGoal: 250000, targetCpl: 500, targetRoas: 2, currency: "PHP", cashBalance: 165000, cashAsOf: "2026-10-11" },
    streams: [
      {
        id: "leh", name: "Local Ecom Hero", kind: "percent_floor", amount: 25000,
        percent: 0.15, floor: 25000, active: true,
        notes: "15% of Local Ecom Hero's revenue, or a flat ₱25,000 if 15% comes in lower.",
      },
      {
        id: "opsified", name: "Opsified (ads management)", kind: "fixed", amount: 50000,
        directCost: 18000, active: true,
        notes: "₱50k fee, ₱18k servicing cost (already in the ₱22k client servicing expense line).",
      },
      { id: "ads-client", name: "Ads client retainer", kind: "fixed", amount: 18000, active: true },
      {
        id: "aacio", name: "AACIO SaaS sales", kind: "variable", amount: 40000, active: true,
        notes: "Averages ₱40k–₱60k/month. Estimate uses the conservative ₱40k; enter actual sales each month.",
      },
    ],
    streamMonths: {
      "2026-10": { aacio: { actual: 38766, collected: 38766, collectedOn: "2026-10-11" } },
    },
    deals: [
      { id: "lms", name: "LMS project", value: 135000, stage: "negotiating", payments: [], createdAt: created },
      { id: "webinar", name: "Webinar funnel project", value: 80000, stage: "negotiating", payments: [], createdAt: created },
      {
        id: "interior", name: "Interior design funnel", value: 230000, stage: "negotiating", payments: [], createdAt: created,
        notes: "The Oct 11 plan listed this as ₱240,000; using ₱230,000 per Maj. Edit if it changes.",
      },
    ],
    oneTime: [{ id: "ot-1", date: "2026-10-11", label: "One-time client payment", amount: 30000 }],
    expenses: [
      { id: "household", name: "Household expenses", amount: 65500, category: "household", active: true },
      { id: "salary", name: "Employee salary", amount: 27000, category: "payroll", active: true },
      { id: "client-costs", name: "Client servicing costs (₱18k + ₱4k)", amount: 22000, category: "client", active: true },
      { id: "ghl", name: "GHL incl. additional usage", amount: 26000, category: "software", active: true },
      { id: "debt", name: "Debt repayment", amount: 20000, category: "debt", startMonth: "2026-11", endMonth: "2027-04", active: true },
    ],
    expensePaid: {},
    adHocExpenses: [{ id: "adhoc-1", date: "2026-10-11", label: "Delayed salary (one-time)", amount: 22000, category: "payroll" }],
    logs: {},
    team: [
      { id: "va", name: "VA / accountant", role: "Collections, bookkeeping, support, scheduling, reports", monthlyCost: 27000, active: true },
    ],
    tasks: seedTasks(),
    todos: {},
    adAccounts: [],
    trackedCampaigns: [],
  };
}
