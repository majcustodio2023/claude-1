import assert from "node:assert/strict";
import { test } from "node:test";
import { planAutopilot } from "../lib/autopilot";
import { analyze, toMetrics, type AdRow, type RawInsight, type Suggestion } from "../lib/meta";
import type { AutopilotEntry } from "../lib/types";

const raw = (spend: number, leads: number): RawInsight => ({
  spend: String(spend),
  impressions: "20000",
  inline_link_clicks: "300",
  inline_link_click_ctr: "1.5",
  frequency: "1.4",
  cpm: "150",
  actions: [{ action_type: "lead", value: String(leads) }],
});
const ad = (id: string, spend: number, leads: number): AdRow => ({ id, name: id, m: toMetrics(raw(spend, leads)) });
const now = Date.parse("2026-10-13T01:00:00Z");
const targets = { cpl: 500, roas: 2 };

test("pauses losing ads but never the best one, max 3 per run", () => {
  const ads = [ad("best", 5000, 20), ad("l1", 2000, 0), ad("l2", 2000, 0), ad("l3", 2000, 0), ad("l4", 2000, 0)];
  const s = analyze(toMetrics(raw(13000, 20)), ads, [], { id: "c1", name: "C" }, targets);
  const plan = planAutopilot(s, ads, { log: [], now });
  const paused = plan.apply.filter((a) => a.type === "pause").map((a) => a.targetId);
  assert.equal(paused.length, 3);
  assert.ok(!paused.includes("best"));
  assert.ok(plan.skipped.some((x) => x.reason.includes("Limit")));
});

test("the only ad with spend is never paused", () => {
  const ads = [ad("only", 3000, 0)];
  const s: Suggestion[] = [{ severity: "bad", title: "x", detail: "", action: { type: "pause", level: "ad", targetId: "only", targetName: "only" } }];
  const plan = planAutopilot(s, ads, { log: [], now });
  assert.equal(plan.apply.length, 0);
  assert.equal(plan.skipped.length, 1);
});

test("budget raises need a max and respect it; cuts don't", () => {
  const ads = [ad("a", 2000, 10)];
  const winning = analyze(toMetrics(raw(2000, 10)), ads, [], { id: "c1", name: "C", daily_budget: "100000" }, targets); // ₱200 per lead, ₱1000/day
  assert.equal(planAutopilot(winning, ads, { log: [], now }).apply.length, 0);
  assert.equal(planAutopilot(winning, ads, { maxDailyBudget: 1100, log: [], now }).apply.length, 0);
  const ok = planAutopilot(winning, ads, { maxDailyBudget: 1500, log: [], now }).apply;
  assert.equal(ok.length, 1);
  assert.equal(ok[0].newDailyBudget, 1200);

  const losing = analyze(toMetrics(raw(9000, 10)), [ad("b", 9000, 10)], [], { id: "c1", name: "C", daily_budget: "100000" }, targets); // ₱900 per lead
  const cut = planAutopilot(losing, [ad("b", 9000, 10)], { log: [], now }).apply.find((a) => a.type === "budget");
  assert.equal(cut?.newDailyBudget, 800);
});

test("no budget change within 3 days of the last one, and no repeat pauses", () => {
  const ads = [ad("a", 2000, 10), ad("x", 2000, 0)];
  const s = analyze(toMetrics(raw(4000, 10)), ads, [], { id: "c1", name: "C", daily_budget: "100000" }, targets);
  const log: AutopilotEntry[] = [
    { id: "1", at: "2026-10-11T01:00:00Z", trackedId: "t", campaign: "C", type: "budget", targetId: "c1", action: "", status: "done" },
    { id: "2", at: "2026-10-12T01:00:00Z", trackedId: "t", campaign: "C", type: "pause", targetId: "x", action: "", status: "done" },
  ];
  const plan = planAutopilot(s, ads, { maxDailyBudget: 5000, log, now });
  assert.equal(plan.apply.length, 0);
  assert.ok(plan.skipped.some((x) => x.reason.includes("3 days")));
});
