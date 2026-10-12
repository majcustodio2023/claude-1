import assert from "node:assert/strict";
import { test } from "node:test";
import { analyze, toMetrics, type RawInsight } from "../lib/meta";

const raw = (spend: number, leads: number, extra: Partial<RawInsight> = {}): RawInsight => ({
  spend: String(spend),
  impressions: "20000",
  inline_link_clicks: "300",
  inline_link_click_ctr: "1.5",
  frequency: "1.4",
  cpm: "150",
  actions: [
    { action_type: "lead", value: String(leads) },
    { action_type: "video_view", value: "6000" },
  ],
  video_thruplay_watched_actions: [{ action_type: "video_view", value: "1200" }],
  ...extra,
});

test("metrics compute cost per lead, hook and hold rate", () => {
  const m = toMetrics(raw(5000, 10));
  assert.equal(m.cpl, 500);
  assert.equal(m.hookRate, 30);
  assert.equal(m.holdRate, 20);
});

test("cheap leads suggest scaling the campaign budget by 20%", () => {
  const m = toMetrics(raw(3000, 10));
  const s = analyze(m, [], [], { id: "c1", name: "Leads", daily_budget: "100000" }, { cpl: 500, roas: 2 });
  const scale = s.find((x) => x.action?.type === "budget");
  assert.equal(scale?.action?.newDailyBudget, 1200);
});

test("ads burning money with no leads become pause candidates", () => {
  const m = toMetrics(raw(9000, 6));
  const ads = [
    { id: "a1", name: "Winner", m: toMetrics(raw(3000, 6)) },
    { id: "a2", name: "Loser", m: toMetrics(raw(2000, 0)) },
  ];
  const s = analyze(m, ads, [], { id: "c1", name: "Leads" }, { cpl: 500, roas: 2 });
  assert.ok(s.some((x) => x.action?.type === "pause" && x.action.targetId === "a2"));
  assert.ok(!s.some((x) => x.action?.targetId === "a1"));
  assert.ok(s.some((x) => x.title.includes("Best ad: Winner")));
});
