// Client work: who's doing what for which client. Pure helpers so they're unit-tested.

import type { ClientTask, TrackerData } from "./types";

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
