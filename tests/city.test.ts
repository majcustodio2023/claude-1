import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleData } from "./fixture";
import { T, ensureCity, hits, layoutCity, layoutInterior, removeBuilding, roadRoute, secretKey, setupProgress, suggestedRoles, visibleBuildings } from "../lib/city";
import { buildingReport, missions } from "../lib/cityReport";

const withClients = () => {
  const d = sampleData();
  d.clients = [
    { id: "z", name: "Zetaverse", notes: "web3 gaming community", createdAt: "2026-10-01" },
    { id: "s", name: "Suyum", notes: "coach with a webinar", createdAt: "2026-10-01" },
  ];
  return d;
};

test("the city is built with the studios and a department per client, once", () => {
  const d = withClients();
  assert.equal(ensureCity(d, "2026-10-18"), true);
  const kinds = d.city!.buildings.map((b) => b.kind);
  assert.deepEqual(kinds.filter((k) => k !== "client"), ["video", "acquisition", "creative", "weapons", "armor"]);
  assert.equal(kinds.filter((k) => k === "client").length, 2);
  assert.equal(ensureCity(d, "2026-10-18"), false);
  const names = d.city!.staff.map((s) => s.name);
  assert.equal(new Set(names).size, names.length, "staff names are unique");
  // A new client gets a building; a knocked-down one isn't rebuilt.
  d.clients!.push({ id: "c", name: "Creatopia", createdAt: "2026-10-02" });
  assert.equal(ensureCity(d, "2026-10-18"), true);
  const z = d.city!.buildings.find((b) => b.clientId === "z")!;
  removeBuilding(d.city!, z.id);
  assert.equal(ensureCity(d, "2026-10-18"), false);
  assert.equal(d.city!.staff.some((s) => s.buildingId === z.id), false);
  // Archived clients' buildings are hidden.
  d.clients!.find((c) => c.id === "s")!.archived = true;
  assert.equal(visibleBuildings(d).some((b) => b.clientId === "s"), false);
});

test("staff fit the client", () => {
  assert.ok(suggestedRoles({ name: "Zetaverse", notes: "gaming community" }).includes("discord"));
  assert.ok(suggestedRoles({ name: "Suyum", notes: "coach webinar" }).includes("webinar"));
  assert.ok(suggestedRoles({ name: "Rasengan App" }).includes("app"));
  assert.ok(!suggestedRoles({ name: "Sarah" }).includes("discord"));
});

test("setup progress counts what's filled in and which keys are saved", () => {
  const d = withClients();
  ensureCity(d, "2026-10-18");
  const discord = d.city!.staff.find((s) => s.role === "discord")!;
  assert.equal(setupProgress(discord).missing.length, 4);
  discord.setup = { invite: "https://discord.gg/x", rules: "be nice", hours: "9-5" };
  assert.deepEqual(setupProgress(discord).missing.map((n) => n.key), ["botToken"]);
  assert.equal(setupProgress(discord, [secretKey(discord.id, "botToken")]).missing.length, 0);
});

test("the map grows with buildings and nothing overlaps the streets", () => {
  const ids = Array.from({ length: 11 }, (_, i) => `b${i}`);
  const small = layoutCity(ids.slice(0, 4), ["b0", "b1"]);
  const big = layoutCity(ids, ["b0", "b1"]);
  assert.ok(big.h > small.h);
  assert.equal(big.plots.length, 11);
  for (const p of big.plots) for (const r of big.roads) assert.equal(hits(p.house, r), false);
  for (const p of big.plots) assert.equal(big.solids.some((s) => hits(s, { x: p.door.x, y: p.door.y + p.door.h, w: p.door.w, h: T })), false, "path in front of each door is clear");
  const route = roadRoute({ x: big.plots[0].yard.x + 10, y: big.plots[0].yard.y + 10 }, { x: big.plots[10].door.x, y: big.plots[10].door.y }, big);
  assert.ok(route.length >= 3);
  assert.deepEqual(route[route.length - 1], { x: big.plots[10].door.x, y: big.plots[10].door.y });
});

test("inside: a desk per staff member and the spawn point is free", () => {
  const I = layoutInterior(["a", "b", "c", "d", "e", "f", "g", "h", "i"], "r", ["room1", "room2", "room3"]);
  assert.equal(I.stations.length, 9);
  assert.equal(I.rooms.length, 3);
  const foot = { x: I.spawn.x - 11, y: I.spawn.y - 8, w: 22, h: 10 };
  assert.equal(I.solids.some((s) => hits(foot, s)), false);
});

test("the Progress Room reports the client's real tasks", () => {
  const d = withClients();
  ensureCity(d, "2026-10-18");
  d.clientTasks = [
    { id: "1", clientId: "z", title: "Discord event", assignees: ["me"], status: "done", doneOn: "2026-10-15", createdAt: "2026-10-01" },
    { id: "2", clientId: "z", title: "Hooks", assignees: ["me"], status: "todo", dueDate: "2026-10-10", createdAt: "2026-10-01" },
  ];
  const b = d.city!.buildings.find((x) => x.clientId === "z")!;
  const r = buildingReport(d, b, "2026-10", "2026-10-18");
  assert.deepEqual(r.stats, [["Done", "1"], ["Open", "1"], ["Overdue", "1"]]);
  assert.match(r.say, /1 mission done, 1 still open, and 1 overdue/);
  assert.equal(missions(d, b)[0].title, "Hooks");
});

test("townspeople quests count from when you take them and pay once", async () => {
  const { questState } = await import("../lib/cityLore");
  const { pendingRewards } = await import("../lib/loot");
  const d = withClients();
  ensureCity(d, "2026-10-18");
  d.clientTasks = [{ id: "old", clientId: "z", title: "Old", assignees: ["me"], status: "done", createdAt: "2026-10-01" }];
  d.game = { coins: 0, claimed: { "ctask:old": "x" }, owned: [], equipped: {}, log: [] };
  assert.equal(questState(d, "three-missions"), "new");
  d.city!.quests = { "three-missions": { at: "2026-10-18", base: 1 } };
  assert.equal(questState(d, "three-missions"), "active");
  for (const id of ["a", "b", "c"]) d.clientTasks.push({ id, clientId: "z", title: id, assignees: ["me"], status: "done", createdAt: "2026-10-18" });
  assert.equal(questState(d, "three-missions"), "done");
  const keys = pendingRewards(d).map((p) => p.key);
  assert.ok(keys.includes("cquest:three-missions"));
  d.game.claimed["cquest:three-missions"] = "2026-10-18";
  assert.ok(!pendingRewards(d).some((p) => p.key === "cquest:three-missions"));
});

test("shops hand gear out free unless turned off", async () => {
  const { takeShopItem } = await import("../lib/loot");
  const d = withClients();
  ensureCity(d, "2026-10-18");
  assert.ok(d.city!.buildings.some((b) => b.kind === "weapons") && d.city!.buildings.some((b) => b.kind === "armor"));
  d.game = { coins: 0, claimed: {}, owned: [], equipped: {}, log: [] };
  assert.equal(takeShopItem(d, "katana", "2026-10-18"), null);
  assert.equal(d.game.equipped.weapon, "katana");
  assert.match(takeShopItem(d, "scythe", "2026-10-18")!, /beyond the gate/);
  d.city!.freeShops = false;
  assert.match(takeShopItem(d, "hammer", "2026-10-18")!, /more coins/);
});
