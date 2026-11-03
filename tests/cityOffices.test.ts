import test from "node:test";
import assert from "node:assert/strict";
import { hits, interiorRoute, layoutInterior, OFFICE_WALL, type Pt } from "../lib/city";
import { FOES, layoutTraining } from "../lib/training";
import { playRound, startBattle, heroLoadout } from "../lib/battle";

test("every worker gets their own big walled office with a doorway onto the hall", () => {
  const ids = ["a", "b", "c", "d", "e", "f", "g"];
  const L = layoutInterior(ids, "rep", []);
  assert.equal(L.stations.length, ids.length);
  for (const st of L.stations) {
    // the desk and the person are inside their office
    assert.ok(st.desk.x > st.office.x && st.desk.x + st.desk.w < st.office.x + st.office.w);
    assert.ok(st.y > st.office.y && st.y < st.office.y + st.office.h);
    // the doorway is open (nothing solid), the walls beside it are solid
    const door = { x: st.door.x + 4, y: st.door.y, w: st.door.w - 8, h: OFFICE_WALL };
    assert.ok(!L.solids.some((s) => hits(door, s)), "doorway is clear");
    assert.ok(L.solids.some((s) => hits({ x: st.office.x + 2, y: st.office.y + 2, w: 2, h: 2 }, s)), "corner wall is solid");
  }
  for (let i = 0; i < L.stations.length; i++)
    for (let j = i + 1; j < L.stations.length; j++) assert.ok(!hits(L.stations[i].office, L.stations[j].office), "offices don't overlap");
  // offices sit below the Progress and Mission Rooms, and are roomy (a desk, chairs, shelves and a rug fit)
  for (const st of L.stations) {
    assert.ok(st.office.y >= L.progress.y + L.progress.h);
    assert.ok(st.office.w >= 7 * 40 && st.office.h >= 6 * 40);
    // the nameplate is inside the office, below the desk
    assert.ok(st.plate.y > st.desk.y + st.desk.h && st.plate.y < st.office.y + st.office.h);
  }
});

test("staff walk out through doors and along the halls, never through a wall", () => {
  const L = layoutInterior(["a", "b", "c", "d", "e"], "rep", []);
  const walls = L.solids.filter((s) => !L.stations.some((st) => st.desk === s));
  const clear = (path: Pt[], from: Pt) => {
    let prev = from;
    for (const p of path) {
      for (let t = 0; t <= 1; t += 0.02) {
        const q = { x: prev.x + (p.x - prev.x) * t - 1, y: prev.y + (p.y - prev.y) * t - 1, w: 2, h: 2 };
        assert.ok(!walls.some((s) => hits(q, s)), `walked into a wall at ${Math.round(q.x)},${Math.round(q.y)}`);
      }
      prev = p;
    }
  };
  for (const a of L.stations)
    for (const b of L.stations) if (a !== b) clear(interiorRoute(L, a, { x: b.x + 28, y: b.y + 60 }), a);
  const inMission = { x: L.missionDoor.x + 20, y: L.mission.y + L.mission.h - 40 };
  for (const a of L.stations) clear(interiorRoute(L, a, inMission), a);
  clear(interiorRoute(L, L.reporter!, L.stations[4]), L.reporter!);
});

test("the Training Hall has a ring per practice monster and they fight with their own move names", () => {
  const L = layoutTraining();
  assert.equal(L.rings.length, FOES.length);
  const b = startBattle(heroLoadout([]), FOES[2].spec);
  const { events } = playRound(b, "strike", () => 0.5);
  const act = events.find((e) => e.kind === "act" && e.who === "boss");
  assert.ok(act && act.kind === "act" && Object.values(FOES[2].spec.names!).includes(act.name));
  // the dummy never charges up a big attack
  let d = startBattle(heroLoadout([]), FOES[0].spec);
  for (let i = 0; i < 12 && !d.over; i++) {
    d = playRound(d, "guard", () => 0.5).battle;
    assert.notEqual(d.boss.intent, "charge");
  }
});
