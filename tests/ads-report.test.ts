import assert from "node:assert/strict";
import { test } from "node:test";
import { configureLocale } from "../lib/finance";
import { analyzeReport, buildReport, minorFactor, type CampaignRaw, type RawInsight } from "../lib/meta";

configureLocale({ currency: "PHP", locale: "en-PH" });

const acts = (o: Record<string, number>) => Object.entries(o).map(([action_type, v]) => ({ action_type, value: String(v) }));
const row = (spend: number, o: Record<string, number>, extra: Partial<RawInsight> = {}): RawInsight => ({
  spend: String(spend),
  impressions: "40000",
  inline_link_clicks: "800",
  inline_link_click_ctr: "2",
  frequency: "1.5",
  cpm: "125",
  actions: acts(o),
  ...extra,
});

const base = (over: Partial<CampaignRaw> = {}): CampaignRaw => ({
  campaign: row(10000, { landing_page_view: 600, "offsite_conversion.fb_pixel_view_content": 580, "offsite_conversion.fb_pixel_add_to_cart": 60, "offsite_conversion.fb_pixel_initiate_checkout": 6, "offsite_conversion.fb_pixel_purchase": 3, lead: 0 }),
  ads: [],
  adsetInsights: [],
  adsets: [],
  adList: [],
  daily: [],
  placements: [],
  demographics: [],
  info: { id: "c1", name: "Shop", status: "ACTIVE", effective_status: "ACTIVE", daily_budget: "100000" },
  currency: "PHP",
  ...over,
});

const targets = { cpl: 500, roas: 2 };

test("funnel follows the pixel events in buying order", () => {
  const r = buildReport(base(), "offsite_conversion.fb_pixel_purchase");
  assert.deepEqual(r.funnel.map((s) => s.id), ["impressions", "link_click", "landing_page_view", "view_content", "add_to_cart", "initiate_checkout", "purchase"]);
  assert.equal(r.funnel[5].rate, 10); // 6 of 60 carts start checkout
  assert.equal(r.dailyBudget, 1000);
});

test("the worst step is called out as the biggest leak", () => {
  const r = buildReport(base(), "offsite_conversion.fb_pixel_purchase");
  const s = analyzeReport(r, targets);
  assert.ok(s.some((x) => x.area === "funnel" && x.title.startsWith("Biggest leak: Added to cart → Started checkout")));
});

test("clicks with no page views flag a missing pixel", () => {
  const r = buildReport(base({ campaign: row(3000, { lead: 0 }) }));
  const s = analyzeReport(r, targets);
  assert.ok(s.some((x) => x.area === "pixel" && x.title === "No landing page views tracked"));
});

test("placements that spend without results are flagged", () => {
  const placements = [
    row(6000, { lead: 20 }, { publisher_platform: "facebook", platform_position: "feed" }),
    row(3000, { lead: 0 }, { publisher_platform: "audience_network", platform_position: "classic" }),
  ];
  const r = buildReport(base({ campaign: row(9000, { lead: 20, landing_page_view: 700 }), placements }));
  assert.equal(r.placements[0].label, "Facebook feed");
  const s = analyzeReport(r, targets);
  assert.ok(s.some((x) => x.title.startsWith("Audience Network classic") && x.title.includes("no results")));
});

test("losing ad sets get a pause action and CTR drops read as fatigue", () => {
  const adsets = [
    { id: "s1", name: "Broad", effective_status: "ACTIVE", daily_budget: "50000" },
    { id: "s2", name: "Interests", effective_status: "ACTIVE", daily_budget: "50000" },
  ];
  const adsetInsights = [row(6000, { lead: 20 }, { adset_id: "s1" }), row(3000, { lead: 0 }, { adset_id: "s2" })];
  const day = (d: number, ctr: string) => row(1000, { lead: 2 }, { date_start: `2026-10-0${d}`, inline_link_click_ctr: ctr, frequency: "1" });
  const daily = [day(1, "2"), day(2, "2"), day(3, "1.2"), day(4, "1.2")];
  const r = buildReport(base({ campaign: row(9000, { lead: 20, landing_page_view: 700 }, { frequency: "2.4" }), adsets, adsetInsights, daily, info: { id: "c1", name: "Leads", status: "ACTIVE", effective_status: "ACTIVE" } }));
  const s = analyzeReport(r, targets);
  const pause = s.find((x) => x.action?.level === "adset");
  assert.equal(pause?.action?.targetId, "s2");
  assert.equal(pause?.action?.type, "pause");
  assert.ok(s.some((x) => x.area === "trend" && x.title.startsWith("Ad fatigue")));
});

test("budgets convert with the currency's minor unit", () => {
  assert.equal(minorFactor("PHP"), 100);
  assert.equal(minorFactor("JPY"), 1);
  assert.equal(minorFactor(undefined), 100);
});
