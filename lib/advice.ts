import { daysLeftInMonth, dealBalance, monthOf, money, summarize, uid, weekLogs } from "./finance";
import type { TodoItem, TrackerData } from "./types";

// Public-domain King James Version text.
type Theme = "provision" | "diligence" | "stewardship" | "courage" | "rest" | "wisdom";

interface Verse {
  ref: string;
  text: string;
  themes: Theme[];
}

export const VERSES: Verse[] = [
  { ref: "Proverbs 16:3", text: "Commit thy works unto the LORD, and thy thoughts shall be established.", themes: ["wisdom", "diligence"] },
  { ref: "Proverbs 21:5", text: "The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.", themes: ["diligence", "stewardship"] },
  { ref: "Philippians 4:19", text: "But my God shall supply all your need according to his riches in glory by Christ Jesus.", themes: ["provision"] },
  { ref: "Philippians 4:6", text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", themes: ["provision", "rest"] },
  { ref: "Galatians 6:9", text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.", themes: ["diligence", "courage"] },
  { ref: "Colossians 3:23", text: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men;", themes: ["diligence"] },
  { ref: "Proverbs 27:23", text: "Be thou diligent to know the state of thy flocks, and look well to thy herds.", themes: ["stewardship"] },
  { ref: "Luke 14:28", text: "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?", themes: ["stewardship", "wisdom"] },
  { ref: "Proverbs 13:11", text: "Wealth gotten by vanity shall be diminished: but he that gathereth by labour shall increase.", themes: ["diligence", "stewardship"] },
  { ref: "Deuteronomy 8:18", text: "But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth, that he may establish his covenant which he sware unto thy fathers, as it is this day.", themes: ["provision"] },
  { ref: "Joshua 1:9", text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.", themes: ["courage"] },
  { ref: "Isaiah 40:31", text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", themes: ["rest", "courage"] },
  { ref: "Proverbs 3:5-6", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.", themes: ["wisdom", "provision"] },
  { ref: "Matthew 6:33", text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.", themes: ["provision", "rest"] },
  { ref: "James 1:5", text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.", themes: ["wisdom"] },
  { ref: "Proverbs 22:7", text: "The rich ruleth over the poor, and the borrower is servant to the lender.", themes: ["stewardship"] },
  { ref: "Proverbs 10:4", text: "He becometh poor that dealeth with a slack hand: but the hand of the diligent maketh rich.", themes: ["diligence"] },
  { ref: "Psalm 90:17", text: "And let the beauty of the LORD our God be upon us: and establish thou the work of our hands upon us; yea, the work of our hands establish thou it.", themes: ["diligence", "provision"] },
  { ref: "2 Timothy 1:7", text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.", themes: ["courage"] },
  { ref: "Proverbs 11:14", text: "Where no counsel is, the people fall: but in the multitude of counsellors there is safety.", themes: ["wisdom"] },
  { ref: "Habakkuk 2:2", text: "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it.", themes: ["wisdom", "diligence"] },
  { ref: "Proverbs 24:27", text: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house.", themes: ["stewardship", "wisdom"] },
  { ref: "Romans 12:11", text: "Not slothful in business; fervent in spirit; serving the Lord;", themes: ["diligence"] },
  { ref: "Psalm 37:5", text: "Commit thy way unto the LORD; trust also in him; and he shall bring it to pass.", themes: ["provision", "courage"] },
  { ref: "Lamentations 3:22-23", text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.", themes: ["rest", "provision"] },
  { ref: "Matthew 11:28", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", themes: ["rest"] },
];

function dayNumber(date: string): number {
  return Math.floor(Date.parse(date + "T00:00:00Z") / 86400000);
}

export function verseFor(date: string, theme: Theme): Verse {
  const pool = VERSES.filter((v) => v.themes.includes(theme));
  return pool[dayNumber(date) % pool.length];
}

export interface DailyAdvice {
  headline: string;
  points: string[];
  inspiration: string;
  verse: Verse;
}

const INSPIRATION = [
  "Cash first, then margin, then scale. You're building something that lasts.",
  "One closed deal changes this month. One good system changes this year.",
  "You don't need a perfect day, just the next right call, the next follow-up, the next ad test.",
  "Discipline with money now buys you freedom later.",
  "Your pipeline is full of real opportunities. Show up for them today.",
  "Protect your energy: it's the engine behind every closed deal.",
  "Small daily wins compound. Log them, celebrate them, repeat them.",
];

export function dailyAdvice(data: TrackerData, today: string): DailyAdvice {
  const month = monthOf(today);
  const s = summarize(data, month);
  const daysLeft = daysLeftInMonth(today);
  const wk = weekLogs(data, today);
  const points: string[] = [];
  let theme: Theme = "diligence";
  let headline: string;

  if (s.moneyMade >= s.goal) {
    headline = `You've hit the ${money(s.goal)} goal this month. Protect the cash and build reserves.`;
    theme = "stewardship";
  } else if (s.moneyMade >= s.expenseTarget) {
    headline = `Expenses are covered. ${money(s.gapToGoal)} to go to reach ${money(s.goal)}.`;
    theme = "diligence";
  } else if (s.projected >= s.expenseTarget) {
    headline = `Expenses will be covered once ${money(s.recurringPending)} in retainers lands. Chase collections today.`;
    theme = "stewardship";
  } else {
    const perDay = s.gapToExpenses / Math.max(daysLeft, 1);
    headline = `${money(s.gapToExpenses)} still needed to cover expenses, about ${money(perDay)} a day for ${daysLeft} days. Closing is the priority.`;
    theme = daysLeft < 10 ? "courage" : "provision";
  }

  const pending = s.streams.filter((r) => !r.isCollected);
  if (pending.length) {
    points.push(`Collect: ${pending.map((r) => `${r.stream.name} (${money(r.expected)})`).join(", ")} not marked collected yet.`);
  }

  const open = data.deals.filter((d) => d.stage !== "won" && d.stage !== "lost").sort((a, b) => b.value - a.value);
  if (open.length) {
    const top = open[0];
    points.push(`Biggest open deal: ${top.name} at ${money(top.value)}. Move it one step forward today (call, proposal, or deposit ask).`);
  }
  const wonUnpaid = data.deals.filter((d) => d.stage === "won" && dealBalance(d) > 0);
  if (wonUnpaid.length) {
    points.push(`Closed but not fully paid: ${wonUnpaid.map((d) => `${d.name} (${money(dealBalance(d))} left)`).join(", ")}. Invoice and follow up.`);
  }

  if (wk.days > 0) {
    if (wk.leads > 0 && wk.bookedCalls / wk.leads < 0.2) {
      points.push(`Only ${wk.bookedCalls} of ${wk.leads} leads booked this week. Speed up lead follow-up (call within 5 minutes) or tighten the booking step.`);
    }
    if (wk.bookedCalls > 0 && wk.showUps / wk.bookedCalls < 0.6) {
      points.push(`Show-up rate is ${Math.round((wk.showUps / wk.bookedCalls) * 100)}%. Add reminder texts and a confirmation call.`);
    }
    if (wk.adSpend > 0 && wk.leads > 0) {
      const cpl = wk.adSpend / wk.leads;
      if (cpl > data.settings.targetCpl * 1.3) {
        points.push(`This week's cost per lead is ${money(cpl)}, above your ${money(data.settings.targetCpl)} target. Check the Ads tab before adding budget.`);
      }
    }
  } else {
    points.push("No daily log yet this week. Log leads, calls and ad spend so the advice gets sharper.");
  }

  const doFirst = data.tasks.filter((t) => t.quadrant === "do" && !t.done);
  if (doFirst.length) points.push(`${doFirst.length} "Do first" tasks still open. Start with: ${doFirst[0].title}.`);

  if (s.adSpend > 0 && s.moneyMade < s.expenseTarget && s.adSpend > s.expenseTarget * 0.15) {
    points.push(`Ad spend this month is ${money(s.adSpend)} while expenses aren't covered yet. Keep budgets on proven campaigns only.`);
    theme = "stewardship";
  }

  const lastLog = data.logs[today];
  if (lastLog?.energy != null && lastLog.energy <= 2) {
    points.push("Energy is low today. Do the one most important call, then rest well.");
    theme = "rest";
  }

  return {
    headline,
    points,
    inspiration: INSPIRATION[dayNumber(today) % INSPIRATION.length],
    verse: verseFor(today, theme),
  };
}

/** Builds the day's auto to-do items from what's happening in the business. */
export function generateTodos(data: TrackerData, today: string): TodoItem[] {
  const s = summarize(data, monthOf(today));
  const items: string[] = [];
  const day = Number(today.slice(8, 10));

  for (const r of s.streams) {
    if (!r.isCollected && day >= 5) items.push(`Follow up payment: ${r.stream.name} (${money(r.expected)})`);
    if (r.stream.kind === "percent_floor" && r.month?.revenueBase == null) items.push(`Get ${r.stream.name}'s revenue figure for the month`);
  }

  data.deals
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .forEach((d) => items.push(`Advance ${d.name} (${money(d.value)}): next step with the client`));

  data.deals
    .filter((d) => d.stage === "won" && dealBalance(d) > 0)
    .forEach((d) => items.push(`Collect balance on ${d.name} (${money(dealBalance(d))})`));

  data.tasks
    .filter((t) => !t.done && (t.quadrant === "do" || (t.dueDate && t.dueDate <= today)))
    .slice(0, 4)
    .forEach((t) => items.push(t.owner.includes("VA") && !t.owner.includes("You") ? `Check with VA: ${t.title}` : t.title));

  if (data.trackedCampaigns.length) items.push("Review ad results in the Ads tab and act on the top suggestion");
  items.push("Log today's leads, booked calls and ad spend");

  return items.map((text) => ({ id: uid("todo"), text, done: false, source: "auto" as const }));
}
