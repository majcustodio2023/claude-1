// Client work: who's doing what for which client. Pure helpers so they're unit-tested.

import { dealBalance, dealPaid, expectedForStream, expenseAppliesTo } from "./finance";
import type { Client, ClientTask, TrackerData } from "./types";

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
