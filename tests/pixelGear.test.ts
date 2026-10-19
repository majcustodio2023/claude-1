import test from "node:test";
import assert from "node:assert/strict";
import { drawPortrait, PH, PW } from "../lib/pixelGear";
import { ITEMS, isKitSlot } from "../lib/items";
import { GEAR } from "../lib/game";
import { resolveLook, STYLES, themeById } from "../lib/appearance";

const key = (px: (string | null)[][]) => px.map((r) => r.map((c) => c ?? ".").join(",")).join("\n");

test("the pixel hero portrait shows every shop item and every achievement gear", () => {
  const plain = drawPortrait(undefined);
  assert.equal(plain.length, PH);
  assert.equal(plain[0].length, PW);
  for (const it of ITEMS.filter((i) => !isKitSlot(i.slot))) assert.notEqual(key(drawPortrait(undefined, [it.id])), key(plain), `${it.name} should be visible`);
  for (const g of Object.keys(GEAR)) assert.notEqual(key(drawPortrait(undefined, [], [g])), key(plain), `${GEAR[g].name} should be visible`);
});

test("every saved look maps onto a pixel style and a pixel theme", () => {
  const old = resolveLook({ theme: "neon", style: "cyber" });
  assert.ok(STYLES.some((s) => s.id === old.style));
  assert.equal(old.theme, "royal");
  assert.equal(resolveLook({ theme: "daylight", style: "sleek" }).style, "pixel-clean");
  assert.equal(themeById("nope").id, "dawn");
});
