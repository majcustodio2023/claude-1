import { test } from "node:test";
import assert from "node:assert/strict";
import { ITEMS } from "../lib/items";
import { ITEM_POWER, SKILLS, autoPick, battleRank, bossTier, heroLoadout, makeBoss, playRound, skillBlocked, startBattle, type Battle } from "../lib/battle";

function seededRand(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function fight(equipped: string[], tier: number, seed: number): Battle {
  const rand = seededRand(seed);
  let b = startBattle(heroLoadout(equipped, 0, 1), makeBoss("Boss", `deal${seed}`, tier));
  while (!b.over && b.round < 80) b = playRound(b, autoPick(b), rand).battle;
  return b;
}

test("every wearable item has battle power, and item skills exist", () => {
  for (const i of ITEMS) {
    assert.ok(ITEM_POWER[i.id], `${i.id} has battle stats`);
    const skill = ITEM_POWER[i.id].skill;
    if (skill) assert.ok(SKILLS[skill]);
  }
});

test("gear adds stats and skills; achievement gear and level add stats", () => {
  const base = heroLoadout([]);
  const geared = heroLoadout(["katana", "red-cape"], 2, 4);
  assert.deepEqual(base.skills, ["strike", "guard", "smash"]);
  assert.ok(geared.skills.includes("iaido") && geared.skills.includes("resolve"));
  assert.equal(geared.stats.atk, base.stats.atk + 6 + 2 + 3);
  assert.equal(geared.stats.hp, base.stats.hp + 15 + 16 + 15);
});

test("skills need energy, and a round always moves the fight on", () => {
  const b = startBattle(heroLoadout(["galaxy"]), makeBoss("Boss", "x", 3));
  assert.match(skillBlocked(b, "supernova")!, /energy/);
  assert.equal(skillBlocked(b, "strike"), null);
  const { battle, events } = playRound(b, "strike", seededRand(1));
  assert.equal(battle.round, 2);
  assert.ok(battle.boss.hp < b.boss.hp);
  assert.ok(events.some((e) => e.kind === "act" && e.who === "boss"));
  // The original state is untouched.
  assert.equal(b.round, 1);
});

test("the boss warns before its big attack, and guarding halves it", () => {
  let b = startBattle(heroLoadout([]), makeBoss("Boss", "y", 5));
  const rand = seededRand(3);
  while (b.boss.intent !== "unleash" && !b.over) b = playRound(b, b.boss.intent === "charge" ? "guard" : "strike", rand).battle;
  assert.equal(b.boss.intent, "unleash");
  const guarded = playRound(b, "guard", seededRand(9)).events.find((e) => e.kind === "damage" && e.target === "hero");
  const open = playRound(b, "strike", seededRand(9)).events.find((e) => e.kind === "damage" && e.target === "hero");
  assert.ok(guarded && open && guarded.kind === "damage" && open.kind === "damage");
  assert.ok(guarded.amount < open.amount);
});

test("gear makes a real difference against big bosses", () => {
  let bare = 0;
  let geared = 0;
  for (let i = 1; i <= 40; i++) {
    if (fight([], 7, i).over === "win") bare++;
    if (fight(["katana", "red-cape", "halo", "slime"], 7, i).over === "win") geared++;
  }
  assert.ok(geared >= 36, `geared won ${geared}/40`);
  assert.ok(bare < geared);
  // Small bosses are beatable without any gear.
  let easy = 0;
  for (let i = 1; i <= 20; i++) if (fight([], 2, i).over === "win") easy++;
  assert.ok(easy >= 18);
});

test("ranks reward fast wins with HP left, and bigger deals make tougher bosses", () => {
  const b = fight(["scythe", "galaxy", "angel-wings"], 3, 5);
  assert.equal(b.over, "win");
  assert.equal(battleRank(b), "S");
  assert.equal(battleRank({ ...b, over: "lose" }), "C");
  assert.ok(bossTier(240000, 250000) > bossTier(50000, 250000));
  assert.ok(makeBoss("a", "s", 8).stats.hp > makeBoss("a", "s", 2).stats.hp);
});
