import { test } from "node:test";
import assert from "node:assert/strict";
import { AVATAR_KINDS, AVATAR_TRAITS, avatarCount, avatarPage, encodeAvatar, parseAvatar, randomAvatar, resolveAvatar } from "../lib/avatar";

test("avatar codes round-trip", () => {
  for (const { kind } of AVATAR_KINDS) {
    const a = randomAvatar(kind, "seed");
    assert.deepEqual(parseAvatar(encodeAvatar(a)), a);
    assert.equal(a.t.length, AVATAR_TRAITS[kind].length);
  }
});

test("bad or old codes don't break", () => {
  assert.equal(parseAvatar(undefined), null);
  assert.equal(parseAvatar("🙂"), null);
  assert.equal(parseAvatar("alien:1.2"), null);
  // Out-of-range or missing traits wrap round instead of failing.
  const a = parseAvatar("robot:999")!;
  assert.equal(a.kind, "robot");
  assert.equal(a.t.length, AVATAR_TRAITS.robot.length);
  a.t.forEach((v, i) => assert.ok(v >= 0 && v < AVATAR_TRAITS.robot[i].count));
});

test("automatic avatars are stable per seed and differ between people", () => {
  assert.deepEqual(resolveAvatar(undefined, "tm_1", "person"), resolveAvatar(undefined, "tm_1", "person"));
  assert.notDeepEqual(resolveAvatar(undefined, "tm_1", "person"), resolveAvatar(undefined, "tm_2", "person"));
  assert.deepEqual(resolveAvatar("monster:1.2.3", "x", "person").kind, "monster");
});

test("there are tons of options", () => {
  for (const { kind } of AVATAR_KINDS) assert.ok(avatarCount(kind) > 100_000, kind);
  const page = avatarPage("person", 0, 40).map(encodeAvatar);
  assert.ok(new Set(page).size >= 39);
});
