import { test } from "node:test";
import assert from "node:assert/strict";
import { MONSTERS, STARTER_PACK, layoutWilds, rollDrops, zoneAt } from "../lib/wilds";
import { DAILY_SELL_CAP, BAG_ITEMS, addLoot, anyItem, bagCount, bagTabs, equipItem, sellItem, takeOne } from "../lib/bag";
import { ITEMS, shopStock } from "../lib/items";
import { buyItem, ensureGame, rollItem, takeShopItem } from "../lib/loot";
import { autoPick, failedFleeRound, fleeChance, heroLoadout, playRound, startBattle, useItemRound, ITEM_POWER, type BossSpec } from "../lib/battle";
import { hits } from "../lib/city";
import { sampleData } from "./fixture";

function seededRand(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function winRate(gear: string[], spec: BossSpec, n = 40): number {
  let wins = 0;
  for (let i = 1; i <= n; i++) {
    const rand = seededRand(i * 31 + 7);
    let b = startBattle(heroLoadout(gear, 0, 1), spec);
    while (!b.over && b.round < 80) b = playRound(b, autoPick(b), rand).battle;
    if (b.over === "win") wins++;
  }
  return wins / n;
}

const TODAY = "2026-11-01";

test("every monster drop is a real item and every wild gear piece drops somewhere", () => {
  for (const m of MONSTERS) for (const d of m.drops) assert.ok(anyItem(d.id), `${m.name} drops unknown ${d.id}`);
  const dropped = new Set(MONSTERS.flatMap((m) => m.drops.map((d) => d.id)));
  for (const i of ITEMS.filter((x) => x.source === "wild")) {
    assert.ok(dropped.has(i.id), `${i.name} drops from a monster`);
    assert.ok(ITEM_POWER[i.id], `${i.name} has battle stats`);
  }
  for (const id of STARTER_PACK) assert.ok(anyItem(id));
});

test("the meadow is easy, Mosswood needs some gear, and the Old Grove needs a lot", () => {
  const meadow = MONSTERS.filter((m) => m.zone === "meadow");
  const moss = MONSTERS.filter((m) => m.zone === "mosswood");
  const grove = MONSTERS.filter((m) => m.zone === "grove");
  // Bare-handed, every meadow monster goes down.
  for (const m of meadow) assert.ok(winRate([], m.spec) >= 0.95, `${m.name} is beatable with no gear`);
  // A sword and a cape handle Mosswood.
  for (const m of moss) assert.ok(winRate(["katana", "red-cape"], m.spec) >= 0.9, `${m.name} with light gear`);
  // The grove beats a bare hero, but a full kit wins.
  for (const m of grove) {
    assert.ok(winRate([], m.spec) <= 0.1, `${m.name} is too much bare-handed`);
    assert.ok(winRate(["scythe", "galaxy", "angel-wings", "kabuto", "shades", "mini-dragon"], m.spec) >= 0.95, `${m.name} falls to a full kit`);
  }
  // Tougher zones have higher levels.
  const maxLv = (l: typeof MONSTERS) => Math.max(...l.map((m) => m.lv));
  const minLv = (l: typeof MONSTERS) => Math.min(...l.map((m) => m.lv));
  assert.ok(maxLv(meadow) < minLv(moss) && maxLv(moss) < minLv(grove));
});

test("the map is big, the start and camp are clear, and every zone has room for monsters", () => {
  const L = layoutWilds();
  assert.ok(L.w >= 4000 && L.h >= 3200);
  assert.ok(L.trees.length > 600, `${L.trees.length} trees`);
  const foot = (p: { x: number; y: number }) => ({ x: p.x - 11, y: p.y - 8, w: 22, h: 10 });
  assert.ok(!L.solids.some((s) => hits(foot(L.spawn), s)), "spawn is free");
  assert.equal(zoneAt(L, L.spawn).id, "meadow");
  for (const z of L.zones)
    for (let i = 0; i < 10; i++) {
      const p = L.open(z.id);
      assert.equal(zoneAt(L, p).id, z.id);
      assert.ok(!L.solids.some((s) => hits({ x: p.x - 16, y: p.y - 10, w: 32, h: 14 }, s)));
    }
  // Every bridge actually crosses the river.
  for (const b of L.bridges) assert.ok(L.water.some((w) => hits(b, w)));
});

test("loot: new gear is yours and worn if the slot is empty, a second copy is a spare", () => {
  const d = sampleData();
  ensureGame(d, TODAY);
  const got = addLoot(d, ["fang-dagger", "fang-dagger", "jelly", "jelly", "red-potion", "nope"], TODAY);
  assert.deepEqual(got.map((g) => g.isNew), [true, false, false, false, false]);
  assert.ok(d.game!.owned.includes("fang-dagger"));
  assert.equal(d.game!.equipped.weapon ?? "fang-dagger", "fang-dagger");
  assert.equal(bagCount(d.game, "fang-dagger"), 1);
  assert.equal(bagCount(d.game, "jelly"), 2);
  const tabs = bagTabs(d.game);
  assert.deepEqual(tabs.items, ["red-potion"]);
  assert.deepEqual(tabs.etc, ["jelly"]);
  assert.ok(tabs.equip.includes("fang-dagger"));
  assert.ok(takeOne(d, "red-potion"));
  assert.equal(takeOne(d, "red-potion"), false);
});

test("swapping gear changes your stats", () => {
  const d = sampleData();
  ensureGame(d, TODAY);
  addLoot(d, ["oak-club", "grove-blade"], TODAY);
  assert.equal(equipItem(d, "oak-club", TODAY), null);
  const club = heroLoadout(Object.values(d.game!.equipped) as string[]);
  assert.equal(equipItem(d, "grove-blade", TODAY), null);
  const blade = heroLoadout(Object.values(d.game!.equipped) as string[]);
  assert.ok(blade.stats.atk > club.stats.atk);
  assert.ok(blade.skills.includes("verdant") && !club.skills.includes("verdant"));
  assert.match(equipItem(d, "beetle-shell", TODAY)!, /don't have/);
});

test("the merchant buys loot and spare gear, never your only copy, up to a daily cap", () => {
  const d = sampleData();
  ensureGame(d, TODAY);
  const coins = d.game!.coins;
  addLoot(d, ["wolf-mask"], TODAY);
  assert.ok("error" in sellItem(d, "wolf-mask", 1, TODAY), "can't sell the one you own");
  for (let i = 0; i < 100; i++) addLoot(d, ["crown-acorn"], TODAY);
  const r = sellItem(d, "crown-acorn", 100, TODAY);
  assert.ok("coins" in r && r.coins <= DAILY_SELL_CAP);
  assert.ok(d.game!.coins - coins <= DAILY_SELL_CAP);
  assert.ok("error" in sellItem(d, "crown-acorn", 1, TODAY), "cap reached");
  // a new day, a fresh cap
  assert.ok("coins" in sellItem(d, "crown-acorn", 1, "2026-11-02"));
});

test("wild gear is never sold in shops and never drops from task chests", () => {
  const d = sampleData();
  const game = ensureGame(d, TODAY);
  for (let w = 0; w < 30; w++) assert.ok(shopStock(`2026-${String(1 + (w % 12)).padStart(2, "0")}-0${1 + (w % 9)}`).items.every((i) => i.source !== "wild"));
  for (let i = 0; i < 200; i++) assert.notEqual(rollItem(game, seededRand(i + 1))?.source, "wild");
  assert.match(buyItem(d, "thorn-spear", TODAY)!, /isn't for sale/);
  assert.match(takeShopItem(d, "thorn-spear", TODAY)!, /beyond the gate/);
});

test("potions in a fight go first and heal; a failed escape gives the foe a free move", () => {
  const jelly = MONSTERS.find((m) => m.id === "jelly")!;
  const b = startBattle(heroLoadout([]), jelly.spec, 40);
  assert.equal(b.hero.hp, 40);
  const potion = BAG_ITEMS.find((x) => x.id === "red-potion")!.use!;
  const { battle, events } = useItemRound(b, potion, seededRand(3));
  assert.equal(events[0].kind, "act");
  assert.ok(events.some((e) => e.kind === "heal" && e.target === "hero"));
  assert.ok(events.some((e) => e.kind === "act" && e.who === "boss"));
  assert.equal(battle.round, 2);
  const fled = failedFleeRound(b, seededRand(5));
  assert.ok(fled.events.some((e) => e.kind === "act" && e.who === "boss"));
  assert.ok(!fled.events.some((e) => e.kind === "act" && e.who === "hero"));
  assert.ok(fleeChance(b) >= 0.35 && fleeChance(b, 5) <= 0.95);
});

test("drops roll each entry on its own", () => {
  const king = MONSTERS.find((m) => m.id === "king")!;
  assert.deepEqual(rollDrops(king, () => 0), king.drops.map((d) => d.id));
  assert.deepEqual(rollDrops(king, () => 0.999), []);
});
