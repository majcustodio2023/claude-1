// Kit's chat brain: a snapshot of where Maj stands, and the actions Kit may take.
// Pure, so it's unit-tested; the API call lives in app/api/kit/route.ts.

import { dailyAdvice } from "./advice";
import { cashForecast, cashHealth, cashPosition, dealBalance, monthOf, summarize, weekLogs } from "./finance";
import { achievements, levelFor, logStreak, rankFor } from "./game";
import type { TrackerData } from "./types";

const p = (n: number) => "₱" + Math.round(n).toLocaleString("en-PH");

/** Plain-text status report Kit reads before answering. */
export function kitContext(data: TrackerData, today: string): string {
  const month = monthOf(today);
  const s = summarize(data, month);
  const lvl = levelFor(s.moneyMade, s.goal);
  const cash = cashPosition(data, today);
  const health = cashHealth(data, today);
  const wk = weekLogs(data, today);
  const briefing = data.briefing?.date === today ? data.briefing : dailyAdvice(data, today);
  const lines = [
    `Today: ${today} (${new Date(today + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long" })}).`,
    `Level ${lvl.level}, rank ${rankFor(s).name}, check-in streak ${logStreak(data, today)} days.`,
    `This month: money made ${p(s.moneyMade)} of ${p(s.goal)} goal; expenses to cover ${p(s.expenseTarget)} (${Math.round(s.pctExpenses * 100)}% covered).`,
    `Retainers: ${s.streams.map((r) => `${r.stream.name} ${r.isCollected ? `collected ${p(r.collected)}` : `due ${p(r.expected)}`}`).join("; ")}.`,
    `Spending this month: fixed ${p(s.fixedExpenses)} (${p(s.expensesPaid)} paid), extra ${p(s.adHocExpenses)}, ad spend ${p(s.adSpend)}.`,
  ];
  if (cash.set) {
    lines.push(`Cash on hand ≈ ${p(cash.now)} (bank balance last entered ${cash.asOf}); projected month-end ${p(cash.monthEnd)}; runway ${health.runwayMonths?.toFixed(1) ?? "?"} months.`);
    lines.push(`Forecast: ${cashForecast(data, today, 4).map((f) => `${f.month} ends ${p(f.end)}`).join(", ")}.`);
  }
  const open = data.deals.filter((d) => d.stage !== "lost" && !(d.stage === "won" && dealBalance(d) <= 0));
  if (open.length) lines.push(`Deals: ${open.map((d) => `${d.name} ${p(d.value)} (${d.stage}${d.stage === "won" ? `, ${p(dealBalance(d))} unpaid` : ""})`).join("; ")}.`);
  lines.push(`This week: ${wk.leads} leads, ${wk.bookedCalls} booked calls, ${wk.showUps} show-ups, ${wk.closes} closes, ${p(wk.adSpend)} ad spend.`);
  const doFirst = data.tasks.filter((t) => t.quadrant === "do" && !t.done).slice(0, 8);
  if (doFirst.length) lines.push(`Open "do first" tasks: ${doFirst.map((t) => t.title).join("; ")}.`);
  const quests = data.todos[today] ?? [];
  if (quests.length) lines.push(`Today's quests: ${quests.map((q) => `${q.done ? "[x]" : "[ ]"} ${q.text}`).join("; ")}.`);
  if (data.trackedCampaigns.length) lines.push(`Tracked Meta campaigns: ${data.trackedCampaigns.map((t) => `${t.name} (${t.mode})`).join("; ")}.`);
  const locked = achievements(data, s, today).filter((a) => !a.unlocked).slice(0, 4);
  if (locked.length) lines.push(`Next achievements: ${locked.map((a) => `${a.name} (${a.desc})`).join("; ")}.`);
  lines.push(`Current briefing: "${briefing.headline}" — ${briefing.points.join(" | ")}`);
  return lines.join("\n");
}

export const KIT_SYSTEM = `You are Kit, a fox-spirit sidekick in Maj's gamified agency tracker (comic-book anime style). Maj runs a Filipino digital agency (AACIO SaaS, ad management, funnels) and is working to cover ₱140k monthly expenses and reach ₱250k monthly revenue.
Talk like an upbeat, sharp anime sidekick: warm, direct, a little playful, never cheesy. Maj is a Christian; an encouraging Bible reference is welcome when it fits, never preachy.
Keep replies short (2-5 sentences, or a few bullets) and lead with the most useful thing. Use the status report for real numbers; don't invent figures. Money is in pesos (₱).
You can act: use set_briefing to rewrite today's mission briefing when Maj asks or when the plan changes in the chat, and add_quest to add to today's quests. Say briefly what you changed.`;

export const KIT_TOOLS = [
  {
    name: "set_briefing",
    description: "Rewrite today's mission briefing card on the HQ screen.",
    input_schema: {
      type: "object",
      properties: {
        headline: { type: "string", description: "One punchy sentence." },
        points: { type: "array", items: { type: "string" }, description: "2-5 short action points." },
        inspiration: { type: "string", description: "Optional short motivational line." },
      },
      required: ["headline", "points"],
    },
  },
  {
    name: "add_quest",
    description: "Add an item to today's daily quests (to-do list).",
    input_schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
  },
] as const;

export type KitAction = { type: "set_briefing"; headline: string; points: string[]; inspiration?: string } | { type: "add_quest"; text: string };

/** Validates a tool call from the model into an action the app applies. */
export function toAction(name: string, input: Record<string, unknown>): KitAction | null {
  if (name === "set_briefing" && typeof input.headline === "string" && Array.isArray(input.points)) {
    const points = input.points.filter((x): x is string => typeof x === "string").slice(0, 6);
    return { type: "set_briefing", headline: input.headline.slice(0, 200), points, ...(typeof input.inspiration === "string" && { inspiration: input.inspiration.slice(0, 200) }) };
  }
  if (name === "add_quest" && typeof input.text === "string" && input.text.trim()) return { type: "add_quest", text: input.text.trim().slice(0, 200) };
  return null;
}
