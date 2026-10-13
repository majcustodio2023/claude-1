import { test } from "node:test";
import assert from "node:assert/strict";
import { archiveClient, basePayLine, clientForStream, createClient, deleteClient, makeClientFromStream, renameClient, upgradeTeamPay } from "../lib/clients";
import { sampleData } from "./fixture";

test("a retainer client is one record: its income line is created with it and renamed with it", () => {
  const d = sampleData();
  const id = createClient(d, { name: "Acme", kind: "recurring", amount: 30000 }, "2026-10-13");
  const c = d.clients!.find((x) => x.id === id)!;
  const s = d.streams.find((x) => x.id === c.streamId)!;
  assert.equal(s.amount, 30000);
  assert.equal(s.kind, "fixed");
  assert.equal(clientForStream(d, s.id)?.id, id);
  renameClient(d, id, "Acme Inc");
  assert.equal(s.name, "Acme Inc");
});

test("a project client creates a closed deal with its price", () => {
  const d = sampleData();
  const id = createClient(d, { name: "Funnel", kind: "project", amount: 230000 }, "2026-10-13");
  const deal = d.deals.find((x) => x.id === d.clients!.find((c) => c.id === id)!.dealId)!;
  assert.equal(deal.value, 230000);
  assert.equal(deal.stage, "won");
});

test("archiving stops the retainer and ends monthly team pay from this month", () => {
  const d = sampleData();
  const id = createClient(d, { name: "Acme", kind: "recurring", amount: 30000 }, "2026-08-01");
  d.expenses.push({ id: "tp", name: "Acme pay", amount: 5000, category: "payroll", active: true, clientId: id, memberId: "va", startMonth: "2026-08" });
  archiveClient(d, id, true, "2026-10");
  const c = d.clients!.find((x) => x.id === id)!;
  assert.equal(c.archived, true);
  assert.equal(d.streams.find((s) => s.id === c.streamId)!.active, false);
  assert.equal(d.expenses.find((e) => e.id === "tp")!.endMonth, "2026-09");
});

test("deleting a client keeps money already collected or paid, removes the rest", () => {
  const d = sampleData();
  const fresh = createClient(d, { name: "Typo", kind: "recurring", amount: 1000 }, "2026-10-13");
  const freshStream = d.clients!.find((x) => x.id === fresh)!.streamId!;
  deleteClient(d, fresh);
  assert.ok(!d.streams.some((s) => s.id === freshStream));
  assert.ok(!d.clients!.some((x) => x.id === fresh));

  // An existing stream with collected history stays (inactive) so history isn't lost.
  const withHistory = d.streams.find((s) => Object.values(d.streamMonths).some((m) => m[s.id]?.collected != null))!;
  const cid = makeClientFromStream(d, withHistory.id, "2026-10-13")!;
  deleteClient(d, cid);
  const kept = d.streams.find((s) => s.id === withHistory.id)!;
  assert.equal(kept.active, false);
});

test("team base pay becomes one payroll bill, reusing a matching bill", () => {
  const d = sampleData();
  const before = d.expenses.length;
  const up = upgradeTeamPay(d);
  assert.equal(up.expenses.length, before);
  assert.equal(basePayLine(up, "va")?.id, "salary");
  // Running it again changes nothing.
  assert.equal(upgradeTeamPay(up), up);

  const d2 = sampleData();
  d2.expenses = d2.expenses.filter((e) => e.id !== "salary");
  const up2 = upgradeTeamPay(d2);
  assert.equal(basePayLine(up2, "va")?.amount, 27000);
  assert.equal(basePayLine(up2, "va")?.category, "payroll");
});
