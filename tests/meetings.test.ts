import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleData } from "./fixture";
import { ensureCity } from "../lib/city";
import { addReplies, attendees, meetingBrief, parseReplies } from "../lib/meetings";
import { addService, staffOnFloor } from "../lib/services";
import { funnelSnapshots, recordFunnelEvent, daysLeft, reportsFor } from "../lib/feeds";
import { parseSalesTsv } from "../lib/appstore";
import type { Meeting } from "../lib/types";

const town = () => {
  const d = sampleData();
  d.clients = [{ id: "c1", name: "Bright Bakery", notes: "Local bakery", createdAt: "2026-10-01" }];
  ensureCity(d, "2026-10-20");
  return d;
};

test("a town hall calls in every staff member who works a floor; a building meeting only that team", () => {
  const d = town();
  const all = attendees(d, "townhall");
  assert.ok(all.length > 5);
  const bakery = d.city!.buildings.find((b) => b.clientId === "c1")!;
  const team = attendees(d, "building", bakery.id);
  assert.ok(team.length > 0 && team.every((s) => s.buildingId === bakery.id));
  assert.equal(attendees(d, "building", d.city!.buildings.find((b) => b.kind === "home")!.id).length, 0, "nobody meets in your home");
});

test("the meeting brief carries the real data, the people and the latest message, and asks for JSON", () => {
  const d = town();
  const bakery = d.city!.buildings.find((b) => b.clientId === "c1")!;
  const team = attendees(d, "building", bakery.id);
  const m: Meeting = { id: "m1", kind: "building", buildingId: bakery.id, title: "x", staffIds: team.map((s) => s.id), messages: [{ id: "a", from: "you", name: "Alex", text: "How are the ads doing?", at: "2026-10-20T01:00:00Z" }], status: "waiting", startedAt: "2026-10-20T01:00:00Z" };
  const b = meetingBrief(d, m, "2026-10-20");
  assert.match(b.system, /Bright Bakery/);
  for (const s of team) assert.ok(b.system.includes(`id ${s.id}`));
  assert.match(b.system, /Never invent/);
  assert.match(b.user, /How are the ads doing\?/);
  assert.match(b.user, /JSON array/);
  const th = meetingBrief(d, { ...m, kind: "townhall", staffIds: attendees(d, "townhall").map((s) => s.id) }, "2026-10-20");
  assert.match(th.system, /Business status/);
});

test("replies only count from people in the room, and a reply to an older question keeps the newer one waiting", () => {
  const d = town();
  const team = attendees(d, "townhall");
  const m: Meeting = { id: "m1", kind: "townhall", title: "x", staffIds: team.map((s) => s.id), messages: [], status: "waiting", prompt: { system: "", user: "", askedAt: "B" }, startedAt: "" };
  const raw = `Sure:\n[{"staffId":"${team[0].id}","text":"Ads are flat."},{"staffId":"stranger","text":"hi"},{"staffId":"${team[1].id}","text":"  "}]`;
  const r = parseReplies(raw, m);
  assert.deepEqual(r, [{ staffId: team[0].id, text: "Ads are flat." }]);
  assert.deepEqual(parseReplies("no json here", m), []);
  const older = addReplies(d, m, r, "A");
  assert.equal(older.status, "waiting");
  assert.equal(older.messages[0].name, team[0].name);
  const current = addReplies(d, m, r, "B");
  assert.equal(current.status, "open");
  assert.equal(current.prompt, undefined);
});

test("services decide who's on a client's floor, reuse staff and never delete anyone", () => {
  const d = town();
  const city = d.city!;
  const bakery = city.buildings.find((b) => b.clientId === "c1")!;
  const here = () => city.staff.filter((s) => s.buildingId === bakery.id);
  const before = here().length;
  assert.equal(staffOnFloor(bakery, here()).length, before, "no services: everyone works");
  const ads = here().find((s) => s.role === "ads")!;
  const svc = addService(city, bakery.id, "Facebook ads", ["ads", "videoEdit"], "2026-10-20", "2 campaigns");
  assert.ok(svc.staffIds.includes(ads.id), "existing ads staff reused");
  assert.equal(here().length, before + 1, "the missing video editor is hired");
  const floor = staffOnFloor(bakery, here());
  assert.deepEqual(floor.map((s) => s.role).sort(), ["ads", "reporter", "videoEdit"]);
  assert.equal(here().length, before + 1, "others stay on the books");
  assert.equal(attendees(d, "building", bakery.id).length, 3);
});

test("the funnel inbox counts events per funnel and day, and sums values", () => {
  let st = recordFunnelEvent(undefined, { funnel: "Webinar", event: "optin" }, "2026-10-20");
  st = recordFunnelEvent(st, { funnel_name: "Webinar", type: "OptIn" }, "2026-10-20");
  st = recordFunnelEvent(st, { funnel: "Webinar", event: "purchase", amount: "₱997.00" }, "2026-10-19");
  st = recordFunnelEvent(st, {}, "2026-10-01");
  assert.deepEqual(st.days.Webinar["2026-10-20"], { events: { optin: 2 }, value: 0 });
  assert.equal(st.days.Webinar["2026-10-19"].value, 997);
  assert.equal(st.days.Funnel["2026-10-01"].events.lead, 1);
  const snaps = funnelSnapshots({ funnelStats: st }, "2026-10-20");
  const w = snaps.find((s) => s.key === "funnel:Webinar")!;
  assert.equal(w.metrics.optin, 2);
  assert.equal(w.metrics.purchase, 1);
  assert.match(w.summary, /2 optin/);
  assert.equal(snaps.find((s) => s.key === "funnel:Funnel")!.metrics.lead, undefined, "older than a week drops out");
  assert.equal(reportsFor({ reports: snaps }, { id: "x", kind: "acquisition" }).length, 2);
  assert.equal(reportsFor({ reports: snaps }, { id: "x", kind: "client" }, "social").length, 0);
});

test("token end dates read as days left, never for System User tokens", () => {
  assert.equal(daysLeft("never"), null);
  assert.equal(daysLeft("2026-10-30T00:00:00Z", Date.parse("2026-10-20T00:00:00Z")), 10);
});

test("App Store sales are summed per app with updates apart", () => {
  const tsv = ["Title\tProduct Type Identifier\tUnits\tDeveloper Proceeds\tCurrency of Proceeds", "Habit\t1\t5\t0\tUSD", "Habit\t7\t40\t0\tUSD", "Habit\tIA1\t2\t2.99\tUSD"].join("\n");
  const r = parseSalesTsv(tsv).get("Habit")!;
  assert.equal(r.downloads, 7);
  assert.equal(r.updates, 40);
  assert.equal(Math.round(r.proceeds.USD * 100), 598);
});
