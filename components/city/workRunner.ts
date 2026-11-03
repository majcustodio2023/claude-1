"use client";

// Which staff are working on a job right now (shared by the city map and the pop-ups),
// and the one call that gets a job done.

import type { StaffWork } from "@/lib/types";

const running = new Map<string, string>();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const runningJobs = () => running;
export function onRunning(f: () => void) {
  subs.add(f);
  return () => void subs.delete(f);
}

/** Runs a job (or, with auto, whatever is due today) and returns the new work list. */
export async function runJob(staffId: string, doing: string, body: { jobId?: string; input?: string; auto?: boolean }): Promise<{ work: StaffWork[]; skipped?: boolean }> {
  if (running.has(staffId)) throw new Error("Already on it.");
  running.set(staffId, doing);
  emit();
  try {
    const r = await fetch("/api/city/work", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staffId, ...body }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? "Something went wrong");
    return j;
  } finally {
    running.delete(staffId);
    emit();
  }
}
