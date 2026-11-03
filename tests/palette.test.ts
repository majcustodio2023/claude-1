import { test } from "node:test";
import assert from "node:assert/strict";
import { PALETTE, snap, snapHex, snapPixels } from "../lib/palette";
import { DIRS, FRAMES, drawSheet } from "../lib/pixelChar";

const inPalette = (c: [number, number, number]) => PALETTE.some((p) => p[0] === c[0] && p[1] === c[1] && p[2] === c[2]);

test("every colour snaps onto the Dawnterra palette", () => {
  for (const hex of ["#ff5fae", "#3fd0ff", "#9cc764", "#000000", "#ffffff", "#e7b85a"]) {
    const n = parseInt(hex.slice(1), 16);
    assert.ok(inPalette(snap((n >> 16) & 255, (n >> 8) & 255, n & 255)), hex);
  }
  assert.equal(snapHex("#2f8f83"), "#2f8f83", "palette colours stay as they are");
});

test("snapPixels makes alpha on/off and colours palette-only", () => {
  const d = new Uint8ClampedArray([255, 0, 0, 200, 10, 200, 30, 40]);
  snapPixels(d);
  assert.equal(d[3], 255);
  assert.equal(d[7], 0);
  assert.ok(inPalette([d[0], d[1], d[2]]));
});

test("pixel characters have a full sheet: 3 directions x 4 walk frames of 16x24", () => {
  const sheet = drawSheet(undefined);
  assert.equal(sheet.length, DIRS.length);
  for (const row of sheet) {
    assert.equal(row.length, FRAMES);
    for (const f of row) {
      assert.equal(f.length, 24);
      assert.equal(f[0].length, 16);
      assert.ok(f.flat().some(Boolean), "frame is not empty");
    }
  }
});
