import { test } from "node:test";
import assert from "node:assert/strict";
import { configureLocale, moneyIn } from "../lib/finance";
import { analyze, type Metrics } from "../lib/meta";

test("moneyIn uses the given currency, else the business's", () => {
  configureLocale({ currency: "USD", locale: "en-US" });
  assert.equal(moneyIn(3722, "PHP"), "₱3,722");
  assert.equal(moneyIn(10), "$10");
});

test("ad suggestions use the ad account's currency", () => {
  configureLocale({ currency: "USD", locale: "en-US" });
  const m = { spend: 500, results: 0, cpl: null } as unknown as Metrics;
  const out = analyze(m, [], [], { id: "c", name: "C", daily_budget: "50000" }, { cpl: 100, roas: 2 }, "PHP");
  assert.match(out.map((s) => s.title).join(" "), /₱500/);
});
