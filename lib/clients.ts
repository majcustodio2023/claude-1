// Client work: who's doing what for which client. Pure helpers so they're unit-tested.

import { addMonths, dealBalance, dealPaid, expectedForStream, expenseAppliesTo, uid } from "./finance";
import type { Client, ClientTask, DealStage, StreamKind, TrackerData } from "./types";

/** Assignee id for the owner (Settings player name). Other assignees are team member ids. */
export const ME = "me";

/** Everyone a task can go to: the owner first, then active team members. */
export function people(data: TrackerData): { id: string; name: string }[] {
  return [{ id: ME, name: data.settings.playerName || "Me" }, ...data.team.filter((m) => m.active).map((m) => ({ id: m.id, name: m.name }))];
}

export function personName(data: TrackerData, id: string): string {
  if (id === ME) return data.settings.playerName || "Me";
  return data.team.find((m) => m.id === id)?.name ?? "Former member";
}

export const isOverdue = (t: ClientTask, today: string) => t.status !== "done" && Boolean(t.dueDate && t.dueDate < today);

export interface ClientStats {
  open: number;
  doing: number;
  done: number;
  overdue: number;
}

export function clientStats(data: TrackerData, clientId: string, today: string): ClientStats {
  const tasks = (data.clientTasks ?? []).filter((t) => t.clientId === clientId);
  return {
    open: tasks.filter((t) => t.status !== "done").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => isOverdue(t, today)).length,
  };
}

/** Open tasks for one person across all clients, overdue and soonest-due first. */
export function openTasksFor(data: TrackerData, personId: string, today: string): ClientTask[] {
  const archived = new Set((data.clients ?? []).filter((c) => c.archived).map((c) => c.id));
  return (data.clientTasks ?? [])
    .filter((t) => t.status !== "done" && t.assignees.includes(personId) && !archived.has(t.clientId))
    .sort((a, b) => Number(isOverdue(b, today)) - Number(isOverdue(a, today)) || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
}

/** Next status when the status button is tapped: To do → Doing → Done → To do. */
export const nextStatus = (s: ClientTask["status"]): ClientTask["status"] => (s === "todo" ? "doing" : s === "doing" ? "done" : "todo");

export const clientKind = (c: Client) => c.kind ?? (c.dealId ? "project" : c.streamId ? "recurring" : undefined);

/** Team pay lines (bills) tied to a client. */
export const teamPay = (data: TrackerData, clientId: string) => data.expenses.filter((e) => e.clientId === clientId);

export interface ClientMoney {
  kind?: "recurring" | "project";
  /** Monthly fee due this month, or the project price */
  income: number;
  /** Collected: this month for a retainer, all payments so far for a project */
  collected: number;
  /** Project only: still to collect */
  toCollect: number;
  /** Team pay for this client: this month's for a retainer, the whole project's for a project */
  teamCost: number;
  profit: number;
}

/** Team pay for the client behind an income stream, in a month. 0 when the stream isn't a client's. */
export function streamCost(data: TrackerData, streamId: string, month: string): number {
  const c = (data.clients ?? []).find((x) => x.streamId === streamId);
  return c ? teamPay(data, c.id).filter((e) => expenseAppliesTo(e, month)).reduce((a, e) => a + e.amount, 0) : 0;
}

/** Team pay for the whole project behind a deal. */
export function dealCost(data: TrackerData, dealId: string): number {
  const c = (data.clients ?? []).find((x) => x.dealId === dealId);
  return c ? teamPay(data, c.id).filter((e) => e.active).reduce((a, e) => a + e.amount, 0) : 0;
}

/** The part of a payment you keep: the payment minus its share of the team pay. */
export function keepOf(paid: number, total: number, cost: number): number {
  if (!cost || !total) return paid;
  return paid - cost * Math.min(paid / total, 1);
}

/** What a client brings in versus what you pay the team for them. */
export function clientMoney(data: TrackerData, c: Client, month: string): ClientMoney {
  const kind = clientKind(c);
  const lines = teamPay(data, c.id);
  if (kind === "project") {
    const deal = data.deals.find((d) => d.id === c.dealId);
    const income = deal?.value ?? 0;
    const teamCost = lines.filter((e) => e.active).reduce((a, e) => a + e.amount, 0);
    return { kind, income, collected: deal ? dealPaid(deal) : 0, toCollect: deal ? dealBalance(deal) : 0, teamCost, profit: income - teamCost };
  }
  const stream = data.streams.find((s) => s.id === c.streamId);
  const sm = stream ? data.streamMonths[month]?.[stream.id] : undefined;
  const income = stream?.active ? expectedForStream(stream, sm) : 0;
  const teamCost = lines.filter((e) => expenseAppliesTo(e, month)).reduce((a, e) => a + e.amount, 0);
  return { kind, income, collected: sm?.collected ?? 0, toCollect: 0, teamCost, profit: income - teamCost };
}

// ---- One client, one record ----
// A client owns its money records: a retainer client has one income stream,
// a project client has one deal. These helpers keep them in step. They change
// the draft passed in (the app's update() callback).

const hasCollections = (d: TrackerData, streamId: string) => Object.values(d.streamMonths).some((m) => m[streamId]?.collected != null);
const hasBillPayments = (d: TrackerData, expenseId: string) => Object.values(d.billPayments ?? {}).some((m) => m[expenseId]?.length);

export interface NewClient {
  name: string;
  kind?: "recurring" | "project";
  /** Monthly fee (retainer) or price (project) */
  amount?: number;
  streamKind?: StreamKind;
  percent?: number;
  stage?: DealStage;
}

/** Adds a client with its income stream (retainer) or deal (project). Returns the client id. */
export function createClient(d: TrackerData, c: NewClient, today: string): string {
  const id = uid("client");
  const client: Client = { id, name: c.name, createdAt: today, ...(c.kind && { kind: c.kind }) };
  if (c.kind === "recurring") {
    const streamId = uid("stream");
    const kind = c.streamKind ?? "fixed";
    d.streams.push({ id: streamId, name: c.name, kind, amount: c.amount ?? 0, active: true, ...(kind === "percent_floor" && { percent: c.percent ?? 0, floor: c.amount ?? 0 }) });
    client.streamId = streamId;
  }
  if (c.kind === "project") {
    const dealId = uid("deal");
    d.deals.push({ id: dealId, name: c.name, value: c.amount ?? 0, stage: c.stage ?? "won", payments: [], createdAt: today });
    client.dealId = dealId;
  }
  d.clients = [...(d.clients ?? []), client];
  return id;
}

/** Renames a client and its linked income stream and deal, so they never drift apart. */
export function renameClient(d: TrackerData, clientId: string, name: string) {
  const c = d.clients?.find((x) => x.id === clientId);
  if (!c) return;
  c.name = name;
  const s = d.streams.find((x) => x.id === c.streamId);
  if (s) s.name = name;
  const deal = d.deals.find((x) => x.id === c.dealId);
  if (deal) deal.name = name;
}

/** The client a stream or deal belongs to, if any. */
export const clientForStream = (data: TrackerData, streamId: string) => data.clients?.find((c) => c.streamId === streamId);
export const clientForDeal = (data: TrackerData, dealId: string) => data.clients?.find((c) => c.dealId === dealId);

/** Turns an income stream into a client (the stream becomes that client's retainer). */
export function makeClientFromStream(d: TrackerData, streamId: string, today: string) {
  const s = d.streams.find((x) => x.id === streamId);
  if (!s) return;
  const existing = clientForStream(d, streamId);
  if (existing) return existing.id;
  const id = uid("client");
  d.clients = [...(d.clients ?? []), { id, name: s.name, kind: "recurring", streamId, createdAt: today }];
  return id;
}

/** Turns a deal into a project client, for tracking its tasks and team pay. */
export function makeClientFromDeal(d: TrackerData, dealId: string, today: string) {
  const deal = d.deals.find((x) => x.id === dealId);
  if (!deal || clientForDeal(d, dealId)) return;
  d.clients = [...(d.clients ?? []), { id: uid("client"), name: deal.name, kind: "project", dealId, createdAt: today }];
}

/**
 * Archiving a client stops its retainer (no longer expected each month) and
 * ends its monthly team pay. Past payments stay in history. Unarchiving
 * restarts the retainer.
 */
export function archiveClient(d: TrackerData, clientId: string, archived: boolean, month: string) {
  const c = d.clients?.find((x) => x.id === clientId);
  if (!c) return;
  c.archived = archived || undefined;
  const s = d.streams.find((x) => x.id === c.streamId);
  if (s) s.active = !archived;
  if (archived) {
    for (const e of d.expenses.filter((x) => x.clientId === clientId && expenseAppliesTo(x, month) && !x.endMonth)) {
      const prev = addMonths(month, -1);
      if (!e.startMonth || e.startMonth <= prev) e.endMonth = prev;
      else e.active = false;
    }
  }
}

/**
 * Deleting a client removes it with its tasks. Money records with nothing
 * paid are removed too; ones with payments are kept (archived) so past
 * months don't change.
 */
export function deleteClient(d: TrackerData, clientId: string) {
  const c = d.clients?.find((x) => x.id === clientId);
  if (!c) return;
  d.clientTasks = (d.clientTasks ?? []).filter((t) => t.clientId !== clientId);
  for (const e of d.expenses.filter((x) => x.clientId === clientId)) {
    if (hasBillPayments(d, e.id)) {
      e.active = false;
      delete e.clientId;
    }
  }
  d.expenses = d.expenses.filter((x) => x.clientId !== clientId);
  if (c.streamId) {
    if (hasCollections(d, c.streamId)) d.streams.find((s) => s.id === c.streamId)!.active = false;
    else d.streams = d.streams.filter((s) => s.id !== c.streamId);
  }
  if (c.dealId) {
    const deal = d.deals.find((x) => x.id === c.dealId);
    if (deal && !deal.payments.length) d.deals = d.deals.filter((x) => x.id !== c.dealId);
  }
  d.clients = d.clients!.filter((x) => x.id !== clientId);
}

/** What deleting a client would keep, in plain words, for the confirm box. */
export function deleteClientSummary(data: TrackerData, clientId: string): string {
  const c = data.clients?.find((x) => x.id === clientId);
  if (!c) return "";
  const tasks = (data.clientTasks ?? []).filter((t) => t.clientId === clientId).length;
  const kept: string[] = [];
  if (c.streamId && hasCollections(data, c.streamId)) kept.push("retainer payments already collected");
  const deal = data.deals.find((x) => x.id === c.dealId);
  if (deal?.payments.length) kept.push("project payments already collected");
  if (data.expenses.some((e) => e.clientId === clientId && hasBillPayments(data, e.id))) kept.push("team pay already paid");
  return `Delete ${c.name}${tasks ? ` and its ${tasks} task${tasks > 1 ? "s" : ""}` : ""}?${kept.length ? ` Your history keeps the ${kept.join(", ")}.` : ""} To just stop working with them, use Archive instead.`;
}

// ---- Team pay ----

/** A member's regular pay (a bill not tied to a client). */
export const basePayLine = (data: TrackerData, memberId: string) => data.expenses.find((e) => e.memberId === memberId && !e.clientId && e.active);

/**
 * Older data kept team pay as a number on the member, often also typed as a
 * bill. Links each member to the matching payroll bill (same amount), or
 * creates one, so pay is counted once.
 */
export function upgradeTeamPay(data: TrackerData): TrackerData {
  const team = data.team.filter((m) => m.monthlyCost > 0 && !data.expenses.some((e) => e.memberId === m.id));
  if (!team.length) return data;
  const expenses = data.expenses.map((e) => ({ ...e }));
  for (const m of team) {
    const match = expenses.find((e) => !e.memberId && !e.clientId && e.category === "payroll" && e.amount === m.monthlyCost && e.active);
    if (match) match.memberId = m.id;
    else expenses.push({ id: uid("exp"), name: `${m.name} pay`, amount: m.monthlyCost, category: "payroll", active: m.active, memberId: m.id });
  }
  return { ...data, expenses };
}
