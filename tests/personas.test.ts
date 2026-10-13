import { test } from "node:test";
import assert from "node:assert/strict";
import { kitSystem } from "../lib/kit";
import { CUSTOM_PERSONA, PERSONAS, personaStyle } from "../lib/personas";
import { sampleData } from "./fixture";

test("Kit's instructions use the picked personality and keep the real-numbers rule", () => {
  const s = sampleData().settings;
  assert.match(kitSystem(s), /upbeat, sharp anime sidekick/);
  const dark = kitSystem({ ...s, kitPersona: "shadow" });
  assert.match(dark, /Shadow Kit/);
  assert.doesNotMatch(dark, /upbeat, sharp anime sidekick/);
  assert.match(dark, /don't invent figures/);
});

test("a custom personality is used when written, otherwise the default", () => {
  assert.match(personaStyle(CUSTOM_PERSONA, "a sarcastic pirate"), /sarcastic pirate/);
  assert.equal(personaStyle(CUSTOM_PERSONA, "  "), PERSONAS[0].style);
  assert.equal(personaStyle("gone", undefined), PERSONAS[0].style);
});
