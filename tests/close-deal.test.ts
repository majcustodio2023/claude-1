import { test } from "node:test";
import assert from "node:assert/strict";
import { closeDeal } from "../lib/clients";
import { setDealStage } from "../lib/fallen";
import { calendarItems } from "../lib/calendar";
import { sampleData } from "./fixture";

const today = "2026-10-16";

test("closing a monthly retainer lead makes a recurring client with monthly income", () => {
  const d = sampleData();
  d.deals.push({ id: "r1", name: "Gym Co", value: 30000, stage: "lead", payments: [], createdAt: today, recurring: { kind: "fixed", payDay: 5 }, contact: { phone: "0917" } });
  const streams = d.streams.length;
  setDealStage(d, "r1", "won", today);
  assert.equal(d.deals.some((x) => x.id === "r1"), false, "the deal is gone so the money isn't counted twice");
  assert.equal(d.streams.length, streams + 1);
  const stream = d.streams.at(-1)!;
  assert.deepEqual([stream.name, stream.kind, stream.amount, stream.payDay, stream.active], ["Gym Co", "fixed", 30000, 5, true]);
  const client = d.clients!.find((c) => c.streamId === stream.id)!;
  assert.equal(client.kind, "recurring");
  assert.equal(client.contact?.phone, "0917");
  assert.ok(calendarItems(d, "2026-11").some((i) => i.kind === "pay" && i.title === "Gym Co" && i.date === "2026-11-05"));
});

test("a client's own lead that turns out monthly becomes their retainer", () => {
  const d = sampleData();
  d.deals.push({ id: "r2", name: "Cafe", value: 20000, stage: "proposal", payments: [], createdAt: today, recurring: { kind: "variable" } });
  d.clients = [...(d.clients ?? []), { id: "c-cafe", name: "Cafe", kind: "project", dealId: "r2", createdAt: today }];
  const id = closeDeal(d, "r2", today);
  assert.equal(id, "c-cafe");
  const c = d.clients!.find((x) => x.id === "c-cafe")!;
  assert.equal(c.kind, "recurring");
  assert.equal(c.dealId, undefined);
  assert.equal(d.streams.find((s) => s.id === c.streamId)?.kind, "variable");
});

test("closing a one-time deal adds it to Clients as a project", () => {
  const d = sampleData();
  d.deals.push({ id: "o1", name: "Website", value: 50000, stage: "negotiating", payments: [], createdAt: today });
  setDealStage(d, "o1", "won", today);
  const deal = d.deals.find((x) => x.id === "o1")!;
  assert.equal(deal.stage, "won");
  const c = d.clients!.filter((x) => x.dealId === "o1");
  assert.equal(c.length, 1);
  assert.equal(c[0].kind, "project");
  closeDeal(d, "o1", today);
  assert.equal(d.clients!.filter((x) => x.dealId === "o1").length, 1, "never added twice");
});

test("a new retainer client can be added with its pay day", async () => {
  const { createClient } = await import("../lib/clients");
  const d = sampleData();
  const id = createClient(d, { name: "Spa", kind: "recurring", amount: 15000, payDay: 20 }, today);
  const stream = d.streams.find((s) => s.id === d.clients!.find((c) => c.id === id)!.streamId)!;
  assert.equal(stream.payDay, 20);
  assert.ok(calendarItems(d, "2026-10").some((i) => i.kind === "pay" && i.title === "Spa" && i.date === "2026-10-20"));
});
