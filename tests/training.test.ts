import { test } from "node:test";
import assert from "node:assert/strict";
import { autoPick, heroLoadout, playRound, startBattle, type Loadout } from "../lib/battle";
import { FOES, PRACTICE_LEVELS, scaledFoe, type PracticeFoe, type PracticeLevel } from "../lib/training";

function seededRand(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function winRate(you: Loadout, foe: PracticeFoe, level: PracticeLevel, n = 300): number {
  const rand = seededRand(4242);
  let wins = 0;
  for (let i = 0; i < n; i++) {
    let b = startBattle(you, scaledFoe(foe, you, level));
    while (!b.over && b.round < 80) b = playRound(b, autoPick(b), rand).battle;
    if (b.over === "win") wins++;
  }
  return wins / n;
}

const geared = heroLoadout(["devil-horns", "ghost", "demon-wings", "eyepatch", "staff", "kit-shades", "kit-ninja", "kit-bell"], 8, 6);
const maxed = heroLoadout(["flame-crown", "mini-dragon", "angel-wings", "oni-mask", "scythe", "kit-crown", "kit-ninetails", "kit-chain"], 20, 13);
const bare = heroLoadout([], 0, 1);

test("practice monsters grow with your gear: strong gear doesn't make the wolf easy", () => {
  for (const you of [bare, geared, maxed]) {
    const wolf = winRate(you, FOES.find((f) => f.id === "wolf")!, "hard");
    assert.ok(wolf < 0.6, `Ember Wolf on Hard should win most fights (player won ${Math.round(wolf * 100)}%)`);
  }
});

test("each difficulty is harder than the one before, and Hard is a real fight", () => {
  for (const foe of FOES) {
    const rates = PRACTICE_LEVELS.map((l) => winRate(geared, foe, l.id));
    for (let i = 1; i < rates.length; i++) assert.ok(rates[i] <= rates[i - 1] + 0.12, `${foe.id}: ${rates.map((r) => Math.round(r * 100)).join("/")}`);
    assert.ok(rates[1] < 0.9, `${foe.id} on Hard isn't a walkover (${Math.round(rates[1] * 100)}%)`);
    assert.ok(rates[0] > 0.3, `${foe.id} on Normal is winnable (${Math.round(rates[0] * 100)}%)`);
  }
});
