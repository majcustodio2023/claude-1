import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanContact, hasContact, webLink } from "../lib/contact";

test("contacts drop empty fields and trim the rest", () => {
  assert.deepEqual(cleanContact({ person: "  Ana Cruz ", email: " ", phone: "+63 917 123 4567" }), { person: "Ana Cruz", phone: "+63 917 123 4567" });
  assert.equal(cleanContact({ email: "  " }), undefined);
  assert.equal(hasContact(undefined), false);
  assert.equal(hasContact({ chat: "@ana" }), true);
});

test("only real web addresses become links", () => {
  assert.equal(webLink("company.com"), "https://company.com");
  assert.equal(webLink("m.me/anacruz"), "https://m.me/anacruz");
  assert.equal(webLink("https://wa.me/639171234567"), "https://wa.me/639171234567");
  assert.equal(webLink("@ana"), null);
  assert.equal(webLink("javascript:alert(1)"), null);
});
