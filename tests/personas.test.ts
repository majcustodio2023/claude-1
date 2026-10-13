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

test("Kit's replies lose *actions* and narration but keep **bold**", async () => {
  const { stripActions } = await import("../lib/kit");
  assert.equal(stripActions("*The shadows part. A fox emerges.*\n\nYou owe ₱25,000. **Collect it today.**"), "You owe ₱25,000. **Collect it today.**");
  assert.equal(stripActions("Fine. *sighs* Pay the VA."), "Fine. Pay the VA.");
  assert.doesNotMatch(kitSystem(sampleData().settings), /Bible reference is welcome/);
});
