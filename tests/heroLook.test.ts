import { test } from "node:test";
import assert from "node:assert/strict";
import { HERO_DEFAULTS, HERO_GROUPS, HERO_HAIR, HERO_OPTIONS, heroChoiceLabel, heroLookCount, randomHeroLook } from "../lib/heroLook";

test("every option's default is one of its choices", () => {
  for (const o of HERO_OPTIONS) {
    assert.ok(HERO_GROUPS.includes(o.group), o.key);
    const def = HERO_DEFAULTS[o.key];
    if (o.choices) assert.ok(o.choices.some((c) => c[0] === def), `${o.key} default ${def}`);
    else assert.ok(o.colors?.length, `${o.key} has colours`);
  }
});

test("each option key appears once and hair choices match the drawing list", () => {
  const keys = HERO_OPTIONS.map((o) => o.key);
  assert.equal(new Set(keys).size, keys.length);
  const hair = HERO_OPTIONS.find((o) => o.key === "hair")!;
  assert.deepEqual(hair.choices!.map((c) => c[0]), HERO_HAIR.map((h) => h[0]));
  assert.ok(hair.choices!.length >= 15);
});

test("random looks only use valid values", () => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let n = 0; n < 200; n++) {
    const look = randomHeroLook(rand) as Record<string, string>;
    for (const o of HERO_OPTIONS) {
      const valid = o.choices ? o.choices.map((c) => c[0]) : o.colors!;
      assert.ok(valid.includes(look[o.key]), `${o.key}=${look[o.key]}`);
    }
  }
});

test("there are far more hero looks than before, with readable labels", () => {
  assert.ok(heroLookCount() > 1e12);
  const top = HERO_OPTIONS.find((o) => o.key === "top")!;
  assert.equal(heroChoiceLabel(top, "hoodie"), "Hoodie");
});
