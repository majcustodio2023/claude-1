// What each building's Progress Room reports, built from the app's real data.

import { clientMoney, clientStats } from "./clients";
import { money, weekLogs } from "./finance";
import type { CityBuilding, TrackerData } from "./types";
import { buildingName } from "./city";

export interface BuildingReport {
  title: string;
  stats: [string, string][];
  /** 0..1 for the progress bar */
  pct: number;
  /** Recent results, newest first */
  feed: string[];
  /** What the reporter says */
  say: string;
}

export interface Mission {
  id: string;
  title: string;
  done: boolean;
  status?: "todo" | "doing" | "done";
  dueDate?: string;
}

/** The Mission Room list: the client's tasks for a client building, its own list otherwise. */
export function missions(data: TrackerData, b: CityBuilding): Mission[] {
  if (b.clientId) {
    return (data.clientTasks ?? [])
      .filter((t) => t.clientId === b.clientId)
      .map((t) => ({ id: t.id, title: t.title, done: t.status === "done", status: t.status, dueDate: t.dueDate }))
      .sort((a, b2) => Number(a.done) - Number(b2.done));
  }
  return (b.todos ?? []).map((t) => ({ id: t.id, title: t.title, done: t.done })).sort((a, b2) => Number(a.done) - Number(b2.done));
}

export function buildingReport(data: TrackerData, b: CityBuilding, month: string, today: string): BuildingReport {
  const place = buildingName(data, b);
  const note = b.progressNote?.trim();
  if (b.kind === "client" && b.clientId) {
    const client = data.clients?.find((c) => c.id === b.clientId);
    const st = clientStats(data, b.clientId, today);
    const feed = (data.clientTasks ?? [])
      .filter((t) => t.clientId === b.clientId && t.status === "done")
      .sort((x, y) => (y.doneOn ?? "").localeCompare(x.doneOn ?? ""))
      .slice(0, 4)
      .map((t) => `Done: ${t.title}`);
    let moneyLine = "";
    if (client) {
      const m = clientMoney(data, client, month);
      if (m.kind === "project") moneyLine = m.income ? `Project ${money(m.income)}: ${money(m.collected)} collected, ${money(m.toCollect)} to go.` : "";
      else if (m.income) moneyLine = m.collected ? `${money(m.collected)} of ${money(m.income)} collected this month.` : `${money(m.income)} due this month, not collected yet.`;
    }
    const total = st.done + st.open;
    const said = total
      ? `${place}: ${st.done} mission${st.done === 1 ? "" : "s"} done, ${st.open} still open${st.overdue ? `, and ${st.overdue} overdue` : ""}.`
      : `${place} has no missions yet. Add some in the Mission Room so I can track them.`;
    return {
      title: `${place} progress`,
      stats: [["Done", String(st.done)], ["Open", String(st.open)], ["Overdue", String(st.overdue)]],
      pct: total ? st.done / total : 0,
      feed,
      say: [said, moneyLine, note].filter(Boolean).join(" "),
    };
  }
  if (b.kind === "video") {
    const cr = data.creatives ?? [];
    const imgs = cr.filter((c) => c.kind === "image" && c.status === "ready").length;
    const vids = cr.filter((c) => c.kind === "video" && c.status === "ready").length;
    const making = cr.filter((c) => c.status === "generating").length;
    const reqs = (data.city?.videoRequests ?? []).filter((r) => r.buildingId === b.id);
    const waiting = reqs.filter((r) => r.status !== "done").length;
    return {
      title: "Studio output",
      stats: [["AI videos", String(vids)], ["AI images", String(imgs)], ["Edits waiting", String(waiting)]],
      pct: reqs.length ? reqs.filter((r) => r.status === "done").length / reqs.length : vids ? 1 : 0,
      feed: [...(making ? [`Rendering ${making} now`] : []), ...reqs.slice(0, 3).map((r) => `${r.style} edit: ${r.status}`)],
      say: [`The studio has made ${vids} AI video${vids === 1 ? "" : "s"} and ${imgs} image${imgs === 1 ? "" : "s"}${making ? `, with ${making} rendering right now` : ""}. ${waiting} edit request${waiting === 1 ? " is" : "s are"} waiting.`, note].filter(Boolean).join(" "),
    };
  }
  if (b.kind === "acquisition") {
    const w = weekLogs(data, today);
    const open = data.deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const pipeline = open.reduce((a, d) => a + d.value, 0);
    const wonThisMonth = data.deals.filter((d) => d.stage === "won" && (d.expectedClose ?? d.createdAt).startsWith(month)).length;
    return {
      title: "Client hunt",
      stats: [["Leads this week", String(w.leads)], ["Calls booked", String(w.bookedCalls)], ["Open deals", String(open.length)]],
      pct: w.leads ? Math.min(1, w.closes / Math.max(1, w.leads)) : 0,
      feed: open.slice(0, 4).map((d) => `${d.stage}: ${d.name} ${money(d.value)}`),
      say: [`This week: ${w.leads} leads, ${w.bookedCalls} calls booked and ${w.closes} closed. ${open.length} deal${open.length === 1 ? "" : "s"} worth ${money(pipeline)} in the pipeline, ${wonThisMonth} won this month.`, note].filter(Boolean).join(" "),
    };
  }
  const list = missions(data, b);
  const done = list.filter((m) => m.done).length;
  return {
    title: `${place} progress`,
    stats: [["Done", String(done)], ["Open", String(list.length - done)], ["Staff", String((data.city?.staff ?? []).filter((s) => s.buildingId === b.id).length)]],
    pct: list.length ? done / list.length : 0,
    feed: list.filter((m) => m.done).slice(0, 4).map((m) => `Done: ${m.title}`),
    say: [list.length ? `${done} of ${list.length} missions done at ${place}.` : `No missions at ${place} yet.`, note].filter(Boolean).join(" "),
  };
}
