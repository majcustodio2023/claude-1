import { test } from "node:test";
import assert from "node:assert/strict";
import { ME, clientStats, nextStatus, openTasksFor, people, personName } from "../lib/clients";
import { kitContext } from "../lib/kit";
import { sampleData } from "./fixture";

function withClients() {
  const d = sampleData();
  d.team = [{ id: "va", name: "Sam", role: "VA", monthlyCost: 0, active: true }, { id: "old", name: "Lee", role: "", monthlyCost: 0, active: false }];
  d.clients = [
    { id: "c1", name: "Acme", createdAt: "2026-10-01" },
    { id: "c2", name: "Gone Co", archived: true, createdAt: "2026-10-01" },
  ];
  d.clientTasks = [
    { id: "t1", clientId: "c1", title: "Launch ads", assignees: [ME, "va"], status: "doing", dueDate: "2026-10-10", createdAt: "2026-10-01" },
    { id: "t2", clientId: "c1", title: "Report", assignees: ["va"], status: "todo", dueDate: "2026-10-20", createdAt: "2026-10-01" },
    { id: "t3", clientId: "c1", title: "Kickoff", assignees: [ME], status: "done", createdAt: "2026-10-01", doneOn: "2026-10-02" },
    { id: "t4", clientId: "c2", title: "Old work", assignees: ["va"], status: "todo", createdAt: "2026-10-01" },
  ];
  return d;
}

test("a task can be shared by several people and shows on each one's plate", () => {
  const d = withClients();
  assert.deepEqual(openTasksFor(d, ME, "2026-10-13").map((t) => t.id), ["t1"]);
  // Overdue first; archived clients' tasks are left out.
  assert.deepEqual(openTasksFor(d, "va", "2026-10-13").map((t) => t.id), ["t1", "t2"]);
});

test("client stats count open, in progress, done and overdue", () => {
  assert.deepEqual(clientStats(withClients(), "c1", "2026-10-13"), { open: 2, doing: 1, done: 1, overdue: 1 });
});

test("people are the owner plus active members; names fall back sensibly", () => {
  const d = withClients();
  assert.deepEqual(people(d).map((p) => p.name), ["Alex", "Sam"]);
  assert.equal(personName(d, "gone"), "Former member");
  assert.equal(nextStatus("todo"), "doing");
  assert.equal(nextStatus("done"), "todo");
});

test("Kit sees open client tasks and who has them", () => {
  const ctx = kitContext(withClients(), "2026-10-13");
  assert.match(ctx, /Acme: Launch ads \(Alex \+ Sam, OVERDUE\)/);
  assert.doesNotMatch(ctx, /Old work/);
});
