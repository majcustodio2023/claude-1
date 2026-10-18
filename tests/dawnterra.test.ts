import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleData } from "./fixture";
import { T, ensureCity, hits, layoutCity, newBuilding } from "../lib/city";
import { DEFAULT_FURNITURE, DOOR_ZONE, FURNITURE, HOME_COLS, addedFurniture, cantPlace, freeSpot, layoutHome } from "../lib/home";
import { questById } from "../lib/cityLore";
import { JOBS, dueJob } from "../lib/cityJobs";
import type { CityState } from "../lib/types";

test("an older town moves to Dawnterra once, keeping anything renamed by hand", () => {
  const d = sampleData();
  const city: CityState = { name: "Nova City", buildings: [], staff: [], merged: true };
  newBuilding(city, { kind: "video", name: "AI Video Maker", color: "#7c5cff" }, ["reporter", "videoAI", "videoEdit"], "2026-10-01");
  newBuilding(city, { kind: "creative", name: "My Ad Lab", color: "#123456" }, ["reporter", "scriptWriter"], "2026-10-01");
  d.city = city;
  assert.equal(ensureCity(d, "2026-10-18"), true);
  assert.equal(city.name, "Dawnterra");
  const video = city.buildings.find((b) => b.kind === "video")!;
  const creative = city.buildings.find((b) => b.kind === "creative")!;
  assert.equal(video.name, "Video Production House");
  assert.equal(video.color, "#d9443a");
  assert.equal(creative.name, "My Ad Lab", "a name you chose stays");
  assert.equal(creative.color, "#123456");
  const roles = city.staff.filter((s) => s.buildingId === video.id).map((s) => s.role);
  assert.ok(roles.includes("storyboard") && roles.includes("videoScript"));
  assert.ok(city.buildings.some((b) => b.kind === "home"), "your home is built");
  // Only once: renaming the town back sticks, and no extra staff appear.
  city.name = "Nova City";
  const n = city.staff.length;
  ensureCity(d, "2026-10-19");
  assert.equal(city.name, "Nova City");
  assert.equal(city.staff.length, n);
});

test("the new video staff do real jobs, only when asked", () => {
  for (const role of ["storyboard", "videoScript"] as const) {
    const jobs = JOBS[role]!;
    assert.ok(jobs.length >= 2);
    assert.ok(jobs.every((j) => j.input?.required && !j.every), "they need a brief, so they never run on their own");
  }
  const d = sampleData();
  ensureCity(d, "2026-10-18");
  const sb = d.city!.staff.find((s) => s.role === "storyboard")!;
  assert.equal(dueJob(d, sb, "2026-10-18"), null);
});

test("the first district: creative and video beside the square, your home just below it", () => {
  const ids = ["creative", "video", "home", "acq", "w", "a", "c1", "c2"];
  const L = layoutCity(ids, ids.slice(0, 6), ["home"]);
  const plot = (id: string) => L.plots.find((p) => p.buildingId === id)!;
  assert.ok(plot("creative").area.x < L.plaza.x && plot("video").area.x > L.plaza.x);
  assert.equal(plot("creative").area.y, L.plaza.y);
  assert.equal(plot("home").area.x, L.plaza.x, "home sits under the square");
  assert.ok(plot("home").house.w < plot("acq").house.w, "home is a cottage");
  // The fence leaves the path to the door open.
  const h = plot("home");
  const path = { x: h.door.x, y: h.door.y + h.door.h, w: h.door.w, h: h.area.y + h.area.h - h.door.y - h.door.h };
  assert.equal(L.solids.some((s) => hits(s, path)), false);
  assert.ok(L.solids.some((s) => hits(s, { x: h.area.x + 20, y: h.area.y + h.area.h - 22, w: 10, h: 10 })), "the fence is solid");
});

test("home furniture: the starting room is valid and placement rules hold", () => {
  for (const f of DEFAULT_FURNITURE) assert.equal(cantPlace(DEFAULT_FURNITURE, f), null, f.id);
  const bed = DEFAULT_FURNITURE.find((f) => f.kind === "bed")!;
  assert.match(cantPlace(DEFAULT_FURNITURE, { ...bed, x: -1 })!, /outside/);
  assert.match(cantPlace(DEFAULT_FURNITURE, { ...bed, x: HOME_COLS - 1 })!, /outside/);
  assert.match(cantPlace(DEFAULT_FURNITURE, { id: "t", kind: "table", x: DOOR_ZONE.x, y: DOOR_ZONE.y })!, /doorway/);
  assert.match(cantPlace(DEFAULT_FURNITURE, { id: "f", kind: "fireplace", x: 3, y: 4 })!, /back wall/);
  assert.match(cantPlace(DEFAULT_FURNITURE, { id: "c", kind: "chest", x: bed.x, y: bed.y + 1 })!, /bed/);
  // A rug can go under furniture and in front of the door, but not on another rug.
  assert.equal(cantPlace(DEFAULT_FURNITURE, { id: "r", kind: "roundRug", x: bed.x, y: bed.y }), null);
  assert.equal(cantPlace(DEFAULT_FURNITURE, { id: "r", kind: "roundRug", x: DOOR_ZONE.x, y: DOOR_ZONE.y }), null);
  assert.match(cantPlace(DEFAULT_FURNITURE, { id: "r", kind: "roundRug", x: 5, y: 3 })!, /rug/);
  // A new piece finds a free spot that follows the rules.
  for (const kind of Object.keys(FURNITURE)) {
    const at = freeSpot(DEFAULT_FURNITURE, kind)!;
    assert.ok(at, kind);
    assert.equal(cantPlace(DEFAULT_FURNITURE, { id: "n", kind, ...at }), null, kind);
  }
});

test("inside your home you spawn free and can't walk through furniture", () => {
  const L = layoutHome(DEFAULT_FURNITURE);
  const foot = { x: L.spawn.x - 11, y: L.spawn.y - 8, w: 22, h: 10 };
  assert.equal(L.solids.some((s) => hits(foot, s)), false);
  assert.ok(hits(foot, { ...L.exit, y: L.exit.y - T }) || L.spawn.y < L.exit.y, "spawn is by the door");
  const bed = L.items.find((f) => f.kind === "bed")!;
  assert.ok(L.solids.some((s) => hits(s, { x: bed.rect.x + bed.rect.w / 2, y: bed.rect.y + bed.rect.h - 10, w: 2, h: 2 })));
  const rug = L.items.find((f) => f.kind === "rug")!;
  assert.equal(L.solids.some((s) => hits(s, { x: rug.rect.x + rug.rect.w / 2, y: rug.rect.y + rug.rect.h / 2, w: 2, h: 2 })), false, "rugs are walkable");
});

test("A House to Call Home counts only pieces you added", () => {
  const d = sampleData();
  ensureCity(d, "2026-10-18");
  const q = questById("house-home")!;
  const home = d.city!.buildings.find((b) => b.kind === "home")!;
  assert.equal(q.progress(d), 0);
  home.furniture = [...DEFAULT_FURNITURE.map((f) => ({ ...f, x: f.x })), { id: "furn-1", kind: "sofa", x: 2, y: 5 }];
  assert.equal(addedFurniture(home), 1);
  assert.equal(q.progress(d), 1);
});
