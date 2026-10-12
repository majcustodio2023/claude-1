"use client";

import { useState } from "react";
import type { DailyLog } from "@/lib/types";
import { useTracker } from "../App";
import { Card, NumInput, peso } from "../ui";

const NUM_FIELDS: [keyof DailyLog, string][] = [
  ["leads", "Leads"],
  ["bookedCalls", "Booked calls"],
  ["showUps", "Show-ups"],
  ["closes", "Closes"],
  ["adSpend", "Ad spend (₱)"],
];

export default function Log() {
  const { data, update, today } = useTracker();
  const [date, setDate] = useState(today);
  const log: DailyLog = data.logs[date] ?? { date };
  const set = (patch: Partial<DailyLog>) =>
    update((d) => void (d.logs[date] = { ...(d.logs[date] ?? { date }), ...patch }));
  const recent = Object.values(data.logs).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 21);

  return (
    <div className="space-y-4">
      <Card title="Daily check-in" actions={<input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-3">
          {NUM_FIELDS.map(([k, label]) => (
            <label key={k} className="text-xs text-muted flex flex-col gap-1">
              {label}
              <NumInput value={log[k] as number | undefined} onChange={(v) => set({ [k]: v })} />
            </label>
          ))}
          <label className="text-xs text-muted flex flex-col gap-1">
            Energy (1–5)
            <select value={log.energy ?? ""} onChange={(e) => set({ energy: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">–</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {(["wins", "blockers", "notes"] as const).map((k) => (
            <label key={k} className="text-xs text-muted flex flex-col gap-1 capitalize">
              {k}
              <textarea
                rows={3}
                defaultValue={log[k] ?? ""}
                key={`${date}-${k}`}
                onBlur={(e) => e.target.value !== (log[k] ?? "") && set({ [k]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </Card>

      <Card title="Recent days">
        {recent.length === 0 ? (
          <p className="text-sm text-muted">No entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted text-left">
                <tr>
                  <th className="py-1 pr-3">Date</th>
                  <th className="pr-3">Leads</th>
                  <th className="pr-3">Booked</th>
                  <th className="pr-3">Showed</th>
                  <th className="pr-3">Closed</th>
                  <th className="pr-3">Ad spend</th>
                  <th className="pr-3">CPL</th>
                  <th>Wins / blockers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((l) => (
                  <tr key={l.date} className="cursor-pointer hover:bg-accent-soft" onClick={() => setDate(l.date)}>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{l.date}</td>
                    <td className="pr-3 tabular-nums">{l.leads ?? "–"}</td>
                    <td className="pr-3 tabular-nums">{l.bookedCalls ?? "–"}</td>
                    <td className="pr-3 tabular-nums">{l.showUps ?? "–"}</td>
                    <td className="pr-3 tabular-nums">{l.closes ?? "–"}</td>
                    <td className="pr-3 tabular-nums">{l.adSpend != null ? peso(l.adSpend) : "–"}</td>
                    <td className="pr-3 tabular-nums">{l.adSpend && l.leads ? peso(l.adSpend / l.leads) : "–"}</td>
                    <td className="text-xs text-muted truncate max-w-64">{[l.wins, l.blockers].filter(Boolean).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
