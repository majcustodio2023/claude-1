import { test } from "node:test";
import assert from "node:assert/strict";
import { nextEvent, formatEventDate, type RdrEvent } from "../lib/rdr/events";
import { parseApplication } from "../lib/rdr/validate";
import { offers, which, stepForward, numbers, stats } from "../lib/rdr/content";

const now = Date.parse("2026-10-27T12:00:00+08:00");

test("nextEvent never returns an expired event and picks the soonest upcoming one", () => {
  const list: RdrEvent[] = [
    { title: "Past", start: "2026-10-01", city: "Manila", url: "#" },
    { title: "Later", start: "2026-12-05", city: "Cebu", url: "#" },
    { title: "Soon", start: "2026-11-14", city: "Quezon City", url: "#" },
    { title: "Today, still on", start: "2026-10-27", city: "Makati", url: "#" },
  ];
  assert.equal(nextEvent(list, now)?.title, "Today, still on");
  assert.equal(nextEvent(list.filter((e) => e.title !== "Today, still on"), now)?.title, "Soon");
  assert.equal(nextEvent([list[0]], now), null);
  assert.equal(nextEvent([], now), null);
});

test("a multi-day event stays listed until its end", () => {
  const e: RdrEvent = { title: "Summit", start: "2026-10-25", end: "2026-10-28", city: "Pasay", url: "#" };
  assert.equal(nextEvent([e], now)?.title, "Summit");
  assert.equal(nextEvent([e], Date.parse("2026-10-29T00:00:00+08:00")), null);
});

test("event dates read in Manila time", () => {
  const e: RdrEvent = { title: "Talk", start: "2026-11-14T13:00:00+08:00", city: "Manila", url: "#" };
  assert.match(formatEventDate(e), /Saturday, November 14, 2026, 1:00/);
});

test("applications need a name, a business and a real email; the honeypot rejects bots", () => {
  assert.equal(parseApplication(null).ok, false);
  assert.equal(parseApplication({ name: "A", business: "Co", email: "a@b.c" }).ok, false);
  assert.equal(parseApplication({ name: "Ana", business: "Co", email: "not-an-email" }).ok, false);
  assert.equal(parseApplication({ name: "Ana", business: "Co", email: "a@b.co", website: "spam" }).ok, false);
  const ok = parseApplication({ name: "  Ana Cruz ", business: "Cruz Foods", email: "ana@cruz.ph", goals: ["authority", "", 42], challenge: "x".repeat(5000) });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.value.name, "Ana Cruz");
    assert.deepEqual(ok.value.goals, ["authority"]);
    assert.equal(ok.value.challenge?.length, 2000);
  }
});

test("every offer the copy points at exists on the page", () => {
  const keys = new Set(offers.map((o) => o.key));
  for (const m of which.map) assert.ok(keys.has(m.key), m.offer);
  for (const c of stepForward.ctas) assert.ok(c.key === "general" || keys.has(c.key), c.label);
});

test("the proof tiles add up: platform views sum to the combined figure", () => {
  const sum = stats.facebookViews + stats.tiktokViews + stats.youtubeViews;
  assert.ok(Math.abs(sum - stats.combinedViews) / stats.combinedViews < 0.01);
  assert.equal(numbers.tiles.length, 8);
});
