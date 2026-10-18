import { test } from "node:test";
import assert from "node:assert/strict";
import { activeCover, buyCover, ownsCover } from "../lib/covers";
import { ensureGame } from "../lib/loot";
import { sampleData } from "./fixture";

const today = "2026-10-18";

test("free covers can be used without coins; paid ones cost coins once", () => {
  const d = sampleData();
  const g = ensureGame(d, today);
  g.coins = 400;
  assert.equal(buyCover(d, "dojo", today), null);
  assert.equal(activeCover(d), "dojo");
  assert.equal(g.coins, 400);
  assert.match(buyCover(d, "vault", today)!, /more coins/);
  assert.equal(activeCover(d), "dojo");
  assert.equal(buyCover(d, "neon", today), null);
  assert.equal(g.coins, 50);
  assert.equal(activeCover(d), "neon");
  buyCover(d, "dojo", today);
  assert.equal(buyCover(d, "neon", today), null, "switching back costs nothing");
  assert.equal(g.coins, 50);
});

test("a custom cover needs a picture; a missing one falls back to classic", () => {
  const d = sampleData();
  const g = ensureGame(d, today);
  g.cover = "custom";
  g.covers = ["custom"];
  assert.equal(ownsCover(d, "custom"), false);
  assert.equal(activeCover(d), "classic");
  g.coverImage = "data:image/jpeg;base64,AAAA";
  assert.equal(activeCover(d), "custom");
});

test("your own picture must be unlocked with coins first", async () => {
  const { unlockCustomCover, customCoverUnlocked } = await import("../lib/covers");
  const d = sampleData();
  const g = ensureGame(d, today);
  g.coins = 1499;
  assert.match(unlockCustomCover(d, today)!, /1 more coins/);
  g.coverImage = "data:image/jpeg;base64,AAAA";
  g.cover = "custom";
  assert.equal(activeCover(d), "classic", "not used until unlocked");
  g.coins = 1600;
  assert.equal(unlockCustomCover(d, today), null);
  assert.equal(g.coins, 100);
  assert.ok(customCoverUnlocked(d));
  assert.equal(activeCover(d), "custom");
  assert.equal(unlockCustomCover(d, today), null, "never charged twice");
  assert.equal(g.coins, 100);
  d.settings.customCoverPrice = 50;
  const d2 = sampleData();
  d2.settings.customCoverPrice = 50;
  ensureGame(d2, today).coins = 60;
  assert.equal(unlockCustomCover(d2, today), null);
});
