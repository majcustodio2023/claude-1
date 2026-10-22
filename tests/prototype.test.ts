import assert from "node:assert/strict";
import { test } from "node:test";
import { guessName, linkKind, makeSlug, normalizeLink } from "../lib/prototype";

test("links: handles, bare domains and junk", () => {
  assert.equal(normalizeLink("@kape.ni.juan"), "https://www.instagram.com/kape.ni.juan/");
  assert.equal(normalizeLink("instagram.com/brand"), "https://instagram.com/brand");
  assert.equal(normalizeLink("  https://www.facebook.com/SomePage  "), "https://www.facebook.com/SomePage");
  assert.equal(normalizeLink("not a link"), null);
  assert.equal(normalizeLink(""), null);
});

test("link kinds", () => {
  assert.equal(linkKind("https://www.instagram.com/brand/"), "instagram");
  assert.equal(linkKind("https://m.facebook.com/brand"), "facebook");
  assert.equal(linkKind("https://www.tiktok.com/@brand"), "tiktok");
  assert.equal(linkKind("https://linktr.ee/brand"), "other");
  assert.equal(linkKind("https://brand.ph"), "website");
});

test("slug is readable with random letters on the end", () => {
  assert.equal(makeSlug("Kape ni Juan!", "a1b2c3d4"), "kape-ni-juan-a1b2c3d4");
  assert.equal(makeSlug("", "ff00ff00"), "prototype-ff00ff00");
  assert.match(makeSlug("Ñoño's Café & Grill", "12345678"), /^[a-z0-9-]+$/);
});

test("name guess before the builder reads anything", () => {
  assert.equal(guessName(["https://www.instagram.com/kapenijuan/"], ""), "kapenijuan");
  assert.equal(guessName(["https://www.brandname.com/about"], ""), "brandname");
  assert.equal(guessName([], "Small dental clinic in Cebu"), "Small dental clinic");
});
