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
  assert.equal(ownsCover(d, "custom"), false);
  assert.equal(activeCover(d), "classic");
  g.coverImage = "data:image/jpeg;base64,AAAA";
  assert.equal(activeCover(d), "custom");
});
