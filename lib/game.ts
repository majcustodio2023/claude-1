import { dealPaid, monthOf, type MonthSummary } from "./finance";
import type { TrackerData } from "./types";

// Game layer: turns the month's money into levels, ranks, streaks and achievements.

/** Each level is one tenth of the monthly goal, so the goal is Level 10. */
export function levelFor(moneyMade: number, goal: number) {
  const step = goal > 0 ? goal / 10 : 25000;
  const level = Math.floor(moneyMade / step) + 1;
  const into = moneyMade - (level - 1) * step;
  return { level, step, into, toNext: step - into, pct: step ? into / step : 0 };
}

export interface Rank {
  name: string;
  tagline: string;
  tone: "bad" | "warn" | "accent" | "good" | "gold";
}

export function rankFor(s: MonthSummary): Rank {
  if (s.moneyMade >= s.goal * 1.2) return { name: "Legend", tagline: "Beyond the goal. Build the war chest.", tone: "gold" };
  if (s.moneyMade >= s.goal) return { name: "Champion", tagline: "Monthly goal conquered.", tone: "gold" };
  if (s.moneyMade >= s.expenseTarget) return { name: "Guardian", tagline: "Shields full. Push for the goal.", tone: "good" };
  if (s.moneyMade >= s.expenseTarget * 0.5) return { name: "Challenger", tagline: "Halfway to full shields.", tone: "accent" };
  return { name: "Rising Hero", tagline: "Every collection powers you up.", tone: "warn" };
}

/** Consecutive days with a daily log, counting back from today (or yesterday if today isn't logged yet). */
export function logStreak(data: TrackerData, today: string): number {
  const has = (d: string) => Boolean(data.logs[d]);
  const day = new Date(today + "T00:00:00Z");
  if (!has(today)) day.setUTCDate(day.getUTCDate() - 1);
  let n = 0;
  while (has(day.toISOString().slice(0, 10))) {
    n++;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return n;
}

export const QUEST_XP = 50;

export function questStats(data: TrackerData, today: string) {
  const list = data.todos[today] ?? [];
  const done = list.filter((t) => t.done).length;
  const total = Object.values(data.todos).flat().filter((t) => t.done).length;
  return { done, count: list.length, xp: done * QUEST_XP, lifetime: total };
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
}

export function achievements(data: TrackerData, s: MonthSummary, today: string): Achievement[] {
  const won = data.deals.filter((d) => d.stage === "won");
  const bigWin = won.some((d) => d.value >= 200000 && dealPaid(d) > 0);
  const quests = questStats(data, today);
  const streak = logStreak(data, today);
  const tasksDone = data.tasks.filter((t) => t.done).length;
  const doFirstOpen = data.tasks.filter((t) => t.quadrant === "do" && !t.done).length;
  const allRetainers = s.streams.length > 0 && s.streams.every((r) => r.isCollected);
  const thisMonthPaid = won.some((d) => d.payments.some((p) => monthOf(p.date) === s.month));
  return [
    { id: "first-blood", name: "First Blood", desc: "Collect payment on a closed deal", icon: "⚔", unlocked: won.some((d) => dealPaid(d) > 0) },
    { id: "giant-slayer", name: "Giant Slayer", desc: "Collect on a ₱200k+ deal", icon: "🐉", unlocked: bigWin },
    { id: "shields-up", name: "Shields Up", desc: "Cover the month's expenses", icon: "🛡", unlocked: s.moneyMade >= s.expenseTarget },
    { id: "goal-crusher", name: "Goal Crusher", desc: `Hit the monthly goal`, icon: "🏆", unlocked: s.moneyMade >= s.goal },
    { id: "full-house", name: "Full House", desc: "Every retainer collected this month", icon: "💎", unlocked: allRetainers },
    { id: "closer", name: "Closer", desc: "Collect a deal payment this month", icon: "🤝", unlocked: thisMonthPaid },
    { id: "on-fire", name: "On Fire", desc: "3-day check-in streak", icon: "🔥", unlocked: streak >= 3 },
    { id: "unstoppable", name: "Unstoppable", desc: "7-day check-in streak", icon: "⚡", unlocked: streak >= 7 },
    { id: "quest-master", name: "Quest Master", desc: "Finish 25 daily quests", icon: "📜", unlocked: quests.lifetime >= 25 },
    { id: "first-strike", name: "First Strike", desc: `Clear every "Do first" task`, icon: "🎯", unlocked: doFirstOpen === 0 },
    { id: "strategist", name: "Strategist", desc: "Complete 10 plan tasks", icon: "🧠", unlocked: tasksDone >= 10 },
    { id: "ad-commander", name: "Ad Commander", desc: "Track a Meta campaign", icon: "📡", unlocked: data.trackedCampaigns.length > 0 },
  ];
}
