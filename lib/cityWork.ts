// What each AI staff member is actually doing right now, from the app's real data. The city
// only shows people moving when there's work behind it: no open missions, no movement.

import { clientsOf, roleOf, setupProgress } from "./city";
import { groupOf } from "./adgroups";
import type { CityBuilding, CityStaff, TrackerData } from "./types";

export interface Work {
  state: "busy" | "idle" | "setup";
  /** What they say they're doing, e.g. "Working on: Launch post" */
  line: string;
}

const done = (today: string, at?: string) => Boolean(at && at.slice(0, 10) === today);

/** Every staff member of one building and what they're up to. Open missions are shared out in turn. */
export function buildingWork(data: TrackerData, b: CityBuilding, staff: CityStaff[], today: string): Map<string, Work> {
  const out = new Map<string, Work>();
  const keys = data.integrations?.staffKeys ?? [];
  const ids = clientsOf(b);
  const open = b.clientId
    ? (data.clientTasks ?? []).filter((t) => ids.includes(t.clientId) && t.status !== "done").sort((x, y) => Number(y.status === "doing") - Number(x.status === "doing"))
    : (b.todos ?? []).filter((t) => !t.done);
  const titles = open.map((t) => t.title);
  const campaigns = data.trackedCampaigns.filter((t) => ids.some((id) => groupOf(data, t).key === `client:${id}`));
  const requests = (data.city?.videoRequests ?? []).filter((r) => r.buildingId === b.id && r.status !== "done");
  const rendering = (data.creatives ?? []).filter((c) => c.status === "generating");
  const deals = data.deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  let turn = 0;
  const general = staff.filter((s) => s.role !== "reporter");
  for (const s of staff) {
    const prog = setupProgress(s, keys);
    if (prog.missing.length) {
      out.set(s.id, { state: "setup", line: `Waiting on you: ${prog.missing[0].label}` });
      continue;
    }
    let w: Work | null = null;
    switch (s.role) {
      case "reporter":
        w = open.length || (data.clientTasks ?? []).some((t) => ids.includes(t.clientId) && t.doneOn === today) ? { state: "busy", line: "Updating the scoreboard" } : null;
        break;
      case "ads":
        w = campaigns.length ? { state: "busy", line: `Watching ${campaigns.length === 1 ? campaigns[0].name : `${campaigns.length} campaigns`}` } : null;
        break;
      case "adsTracker":
        w = data.trackedCampaigns.length ? { state: "busy", line: `Tracking ${data.trackedCampaigns.length} campaign${data.trackedCampaigns.length === 1 ? "" : "s"}` } : null;
        break;
      case "videoEdit":
        w = requests.length ? { state: "busy", line: `Editing: ${requests[0].prompt.slice(0, 40) || requests[0].style}` } : null;
        break;
      case "videoAI":
      case "imageAI":
        w = rendering.length ? { state: "busy", line: `Rendering ${rendering.length} creative${rendering.length === 1 ? "" : "s"}` } : null;
        break;
      case "funnel":
        w = deals.length ? { state: "busy", line: `Following up: ${deals[0].name}` } : null;
        break;
      case "scriptWriter":
      case "copyWriter":
      case "imageCopy":
        w = (s.outputs ?? []).some((o) => done(today, o.at)) ? { state: "busy", line: "Polishing today's drafts" } : null;
        break;
    }
    // Everyone else takes the building's open missions in turn.
    if (!w && s.role !== "reporter" && titles.length && turn < titles.length) {
      w = { state: "busy", line: `Working on: ${titles[turn % titles.length]}` };
      turn++;
    }
    out.set(s.id, w ?? { state: "idle", line: idleLine(s, general.length) });
  }
  return out;
}

function idleLine(s: CityStaff, team: number): string {
  if (s.role === "reporter") return "Nothing new to report yet";
  const job = roleOf(s).jobs[0]?.toLowerCase();
  return team > 1 ? `No missions yet. Ready for ${job ?? "work"}` : "No missions yet";
}

/** Everyone in the city at once. */
export function cityWork(data: TrackerData, buildings: CityBuilding[], today: string): Map<string, Work> {
  const all = new Map<string, Work>();
  const staff = data.city?.staff ?? [];
  for (const b of buildings) for (const [k, v] of buildingWork(data, b, staff.filter((s) => s.buildingId === b.id), today)) all.set(k, v);
  return all;
}
