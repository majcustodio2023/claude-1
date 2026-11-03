// Everything the city's staff have made, in one list for the Outputs cabinet:
// finished jobs (staffWork) plus writers' older saved outputs, newest first,
// with anything still being made at the top.

import type { TrackerData } from "./types";

export interface Output {
  id: string;
  staffId: string;
  staffName: string;
  buildingId: string;
  label: string;
  text: string;
  input?: string;
  day: string;
  at: string;
  queued: boolean;
}

export function allOutputs(data: TrackerData): Output[] {
  const staff = data.city?.staff ?? [];
  const name = (id: string) => staff.find((s) => s.id === id)?.name ?? "Staff";
  const out: Output[] = (data.staffWork ?? [])
    .filter((w) => w.status === "queued" || w.text?.trim())
    .map((w) => ({ id: w.id, staffId: w.staffId, staffName: name(w.staffId), buildingId: w.buildingId, label: w.label, text: w.text ?? "", input: w.input, day: w.day, at: w.at, queued: w.status === "queued" }));
  for (const s of staff)
    for (const o of s.outputs ?? [])
      out.push({ id: o.id, staffId: s.id, staffName: s.name, buildingId: s.buildingId, label: o.target ? `Copy for ${o.target}` : "Written copy", text: o.text, input: o.input, day: o.at.slice(0, 10), at: o.at, queued: false });
  return out.sort((a, b) => Number(b.queued) - Number(a.queued) || b.at.localeCompare(a.at));
}

/** Finished pieces you haven't opened the cabinet to see yet. */
export const newOutputs = (data: TrackerData): number => {
  const seen = data.city?.outputsSeen ?? "";
  return allOutputs(data).filter((o) => !o.queued && o.at > seen).length;
};
