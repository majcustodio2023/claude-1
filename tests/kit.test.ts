import assert from "node:assert/strict";
import { test } from "node:test";
import { kitContext, toAction } from "../lib/kit";
import { sampleData as seedData } from "./fixture";

test("Kit's status report carries the real numbers", () => {
  const d = seedData();
  const ctx = kitContext(d, "2026-10-13");
  assert.match(ctx, /money made ₱38,766 of ₱250,000/);
  assert.match(ctx, /Cash on hand ≈ ₱181,766/);
  assert.match(ctx, /Big funnel build/);
  d.briefing = { date: "2026-10-13", headline: "Close the webinar deal", points: ["Call them"] };
  assert.match(kitContext(d, "2026-10-13"), /Current briefing: "Close the webinar deal"/);
});

test("tool calls are validated before the app applies them", () => {
  assert.deepEqual(toAction("add_quest", { text: "  Follow up LMS  " }), { type: "add_quest", text: "Follow up LMS" });
  assert.equal(toAction("add_quest", { text: "" }), null);
  assert.deepEqual(toAction("set_briefing", { headline: "H", points: ["a", 2, "b"] }), { type: "set_briefing", headline: "H", points: ["a", "b"] });
  assert.equal(toAction("set_briefing", { headline: "H" }), null);
  assert.equal(toAction("delete_everything", {}), null);
});
