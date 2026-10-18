import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarItems, dayOf, monthGrid, ordinal } from "../lib/calendar";
import { eventsBetween } from "../lib/ical";
import { sampleData } from "./fixture";

test("day of month clamps to the month's last day", () => {
  assert.equal(dayOf("2026-02", 31), "2026-02-28");
  assert.equal(dayOf("2026-10", 5), "2026-10-05");
  assert.equal(ordinal(1), "1st");
  assert.equal(ordinal(12), "12th");
  assert.equal(ordinal(22), "22nd");
});

test("month grid starts on Monday", () => {
  const g = monthGrid("2026-10"); // Oct 1 2026 is a Thursday
  assert.deepEqual(g[0].slice(0, 4), [null, null, null, "2026-10-01"]);
  assert.ok(g.every((w) => w.length === 7));
});

test("pay days, bill due days, deals and missions land on their dates", () => {
  const d = sampleData();
  d.streams[1].payDay = 15;
  d.streams[3].payDay = 31;
  d.expenses[0].dueDay = 5;
  d.tasks.push({ id: "t-x", title: "Call bank", quadrant: "do", owner: "You", dueDate: "2026-10-20", time: "09:30", done: false });
  const items = calendarItems(d, "2026-10");
  const pay = items.find((i) => i.id === "pay:opsified")!;
  assert.equal(pay.date, "2026-10-15");
  assert.equal(pay.amount, 50000);
  assert.equal(pay.done, false);
  const saas = items.find((i) => i.id === "pay:aacio")!;
  assert.equal(saas.date, "2026-10-31");
  assert.equal(saas.done, true);
  assert.equal(items.find((i) => i.kind === "bill")!.date, "2026-10-05");
  const t = items.find((i) => i.id === "task:t-x")!;
  assert.equal(t.time, "09:30");
  assert.ok(items.some((i) => i.kind === "deal" && i.date === "2026-10-11"));
  // November: the SaaS pay day moves to the 30th.
  assert.equal(calendarItems(d, "2026-11").find((i) => i.id === "pay:aacio")!.date, "2026-11-30");
});

const ICS = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "UID:a1",
  "DTSTART:20261015T010000Z",
  "DTEND:20261015T020000Z",
  "SUMMARY:Client call",
  "LOCATION:Zoom",
  "BEGIN:VALARM",
  "ACTION:DISPLAY",
  "SUMMARY:Reminder",
  "END:VALARM",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:a2",
  "DTSTART;VALUE=DATE:20261020",
  "DTEND;VALUE=DATE:20261022",
  "SUMMARY:Trip\\, Cebu",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:a3",
  "DTSTART;TZID=Asia/Manila:20261005T090000",
  "DTEND;TZID=Asia/Manila:20261005T093000",
  "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261021T235959Z",
  "EXDATE;TZID=Asia/Manila:20261007T090000",
  "SUMMARY:Standup",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:a3",
  "RECURRENCE-ID;TZID=Asia/Manila:20261012T090000",
  "DTSTART;TZID=Asia/Manila:20261012T110000",
  "DTEND;TZID=Asia/Manila:20261012T113000",
  "SUMMARY:Standup (moved)",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:a4",
  "DTSTART;TZID=America/New_York:20261001T200000",
  "RRULE:FREQ=MONTHLY;BYDAY=-1FR;COUNT=3",
  "SUMMARY:Last Friday",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:a5",
  "DTSTART:20261016T000000Z",
  "STATUS:CANCELLED",
  "SUMMARY:Gone",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

test("reads events in the owner's time zone", () => {
  const ev = eventsBetween(ICS, "2026-10-01", "2026-10-31", "Asia/Manila");
  const call = ev.find((e) => e.title === "Client call")!;
  assert.deepEqual([call.date, call.time, call.endTime, call.location], ["2026-10-15", "09:00", "10:00", "Zoom"]);
  assert.deepEqual(ev.filter((e) => e.title === "Trip, Cebu").map((e) => e.date), ["2026-10-20", "2026-10-21"]);
  assert.deepEqual(ev.filter((e) => e.title === "Standup").map((e) => e.date), ["2026-10-05", "2026-10-14", "2026-10-19", "2026-10-21"]);
  const moved = ev.find((e) => e.title === "Standup (moved)")!;
  assert.deepEqual([moved.date, moved.time], ["2026-10-12", "11:00"]);
  // Last Friday of the month, 8pm New York = Saturday 8am Manila.
  const fri = ev.filter((e) => e.title === "Last Friday");
  assert.deepEqual(fri.map((e) => [e.date, e.time]), [["2026-10-31", "08:00"]]);
  assert.ok(!ev.some((e) => e.title === "Gone" || e.title === "Reminder"));
});

test("repeating events reach later months, counting from the start", () => {
  const nov = eventsBetween(ICS, "2026-11-01", "2026-12-31", "Asia/Manila").filter((e) => e.title === "Last Friday");
  assert.deepEqual(nov.map((e) => e.date), ["2026-11-28", "2026-12-26"]);
});

test("missions feed reads back as the same events", async () => {
  const { missionsFeed } = await import("../lib/icsWrite");
  const d = sampleData();
  d.tasks = [
    { id: "a", title: "Call bank, then pay; ok", quadrant: "do", owner: "You", dueDate: "2026-10-20", time: "14:30", done: false },
    { id: "b", title: "Send invoices", quadrant: "schedule", owner: "VA", dueDate: "2026-10-21", done: true },
    { id: "c", title: "No date", quadrant: "do", owner: "You", done: false },
    { id: "d", title: "Skip me", quadrant: "eliminate", owner: "You", dueDate: "2026-10-22", done: false },
    { id: "e", title: "A very long mission title that goes on and on so the line must be folded across several lines", quadrant: "do", owner: "You", dueDate: "2026-10-23", done: false },
  ];
  const ics = missionsFeed(d, "Asia/Manila", new Date("2026-10-15T00:00:00Z"));
  assert.ok(ics.split("\r\n").every((l) => Buffer.byteLength(l) <= 75));
  const ev = eventsBetween(ics, "2026-10-01", "2026-10-31", "Asia/Manila");
  assert.deepEqual(ev.map((e) => [e.date, e.time ?? "", e.title]), [
    ["2026-10-20", "14:30", "Call bank, then pay; ok"],
    ["2026-10-21", "", "Done: Send invoices"],
    ["2026-10-23", "", "A very long mission title that goes on and on so the line must be folded across several lines"],
  ]);
});

test("missions finished before today leave their column; done today stays", async () => {
  const { doneBefore } = await import("../lib/tasks");
  const base = { id: "t", title: "x", quadrant: "do" as const, owner: "You" };
  assert.equal(doneBefore({ ...base, done: true, doneOn: "2026-10-18" }, "2026-10-18"), false);
  assert.equal(doneBefore({ ...base, done: true, doneOn: "2026-10-17" }, "2026-10-18"), true);
  assert.equal(doneBefore({ ...base, done: true }, "2026-10-18"), true);
  assert.equal(doneBefore({ ...base, done: false }, "2026-10-18"), false);
});
