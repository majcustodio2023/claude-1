"use client";

import { useState } from "react";
import type { DailyLog } from "@/lib/types";
import { useTracker } from "../App";
import { Card, NumInput, money } from "../ui";
import { HELP } from "../help";
import { EditButton, Field, SaveButton } from "../editable";

const NUM_FIELDS: [keyof DailyLog, string][] = [
  ["leads", "Leads"],
  ["bookedCalls", "Booked calls"],
  ["showUps", "Show-ups"],
  ["closes", "Closes"],
  ["adSpend", "Ad spend"],
];

export default function Log() {
  const { data, update, today } = useTracker();
  const [date, setDate] = useState(today);
  const log: DailyLog = data.logs[date] ?? { date };
  const [editing, setEditing] = useState(false);
  // Typing keeps the form open until Save, even on a day that was empty.
  const set = (patch: Partial<DailyLog>) => {
    setEditing(true);
    update((d) => void (d.logs[date] = { ...(d.logs[date] ?? { date }), ...patch }));
  };
  const filled = NUM_FIELDS.some(([k]) => log[k] != null) || log.energy != null || !!(log.wins || log.blockers || log.notes);
  const showForm = editing || !filled;
  const recent = Object.values(data.logs).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 21);

  return (
    <div className="space-y-4">
      <Card icon="✦" glow="hero" title="Daily check-in" help={HELP.checkin} actions={<input type="date" value={date} onChange={(e) => {
            if (!e.target.value) return;
            setDate(e.target.value);
            setEditing(false);
          }} />}>
        {!showForm ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {NUM_FIELDS.map(([k, label]) => (
                <Field key={k} label={label} className="bg-card-2 border-[3px] border-outline rounded-[10px] p-2.5">
                  {log[k] == null ? <span className="text-muted">–</span> : k === "adSpend" ? money(log[k] as number) : String(log[k])}
                </Field>
              ))}
              <Field label="Energy" className="bg-card-2 border-[3px] border-outline rounded-[10px] p-2.5">
                {log.energy ? `${log.energy} / 5` : <span className="text-muted">–</span>}
              </Field>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {(["wins", "blockers", "notes"] as const).map((k) =>
                log[k] ? (
                  <Field key={k} label={k}>
                    <span className="font-normal text-base whitespace-pre-wrap">{log[k]}</span>
                  </Field>
                ) : null,
              )}
            </div>
            <EditButton title="Change this day's check-in" onClick={() => setEditing(true)} />
          </div>
        ) : (
        <>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-3">
          {NUM_FIELDS.map(([k, label]) => (
            <label key={k} className="text-sm text-muted flex flex-col gap-1">
              {label}
              <NumInput value={log[k] as number | undefined} onChange={(v) => set({ [k]: v })} />
            </label>
          ))}
          <label className="text-sm text-muted flex flex-col gap-1">
            Energy (1–5)
            <select value={log.energy ?? ""} onChange={(e) => set({ energy: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">–</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {(["wins", "blockers", "notes"] as const).map((k) => (
            <label key={k} className="text-sm text-muted flex flex-col gap-1 capitalize">
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
        <div className="mt-3">
          <SaveButton label="Save check-in" onClick={() => setEditing(false)} />
        </div>
        </>
        )}
      </Card>

      <Card icon="◆" title="Recent days">
        {recent.length === 0 ? (
          <p className="text-sm text-muted">No entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-sm text-muted text-left">
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
                  <tr key={l.date} className="cursor-pointer hover:bg-white/[0.03]" onClick={() => {
                    setDate(l.date);
                    setEditing(false);
                  }}>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{l.date}</td>
                    <td className="pr-3 tabular-nums">{l.leads ?? "–"}</td>
                    <td className="pr-3 tabular-nums">{l.bookedCalls ?? "–"}</td>
                    <td className="pr-3 tabular-nums">{l.showUps ?? "–"}</td>
                    <td className="pr-3 tabular-nums">{l.closes ?? "–"}</td>
                    <td className="pr-3 tabular-nums">{l.adSpend != null ? money(l.adSpend) : "–"}</td>
                    <td className="pr-3 tabular-nums">{l.adSpend && l.leads ? money(l.adSpend / l.leads) : "–"}</td>
                    <td className="text-sm text-muted truncate max-w-64">{[l.wins, l.blockers].filter(Boolean).join(" · ")}</td>
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
