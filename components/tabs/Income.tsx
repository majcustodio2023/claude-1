"use client";

import { useMemo, useState } from "react";
import { expectedForStream, monthOf, summarize, uid } from "@/lib/finance";
import type { IncomeStream, StreamKind, StreamMonth } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Btn, Card, NumInput, TextInput, celebrate, peso } from "../ui";

const KIND_LABEL: Record<StreamKind, string> = {
  fixed: "Fixed monthly fee",
  percent_floor: "% of revenue with a minimum",
  variable: "Variable sales",
};

export default function Income() {
  const { data, update, month, today } = useTracker();
  const s = useMemo(() => summarize(data, month), [data, month]);
  const [editing, setEditing] = useState(false);
  const [ot, setOt] = useState({ label: "", amount: undefined as number | undefined, date: today });

  const setSM = (streamId: string, patch: Partial<StreamMonth>) =>
    update((d) => {
      d.streamMonths[month] ??= {};
      const cur = { ...(d.streamMonths[month][streamId] ?? {}), ...patch };
      for (const k of Object.keys(cur) as (keyof StreamMonth)[]) if (cur[k] === undefined) delete cur[k];
      d.streamMonths[month][streamId] = cur;
    });

  const setStream = (id: string, patch: Partial<IncomeStream>) =>
    update((d) => void Object.assign(d.streams.find((x) => x.id === id)!, patch));

  const collectDate = monthOf(today) === month ? today : `${month}-01`;
  const oneTime = data.oneTime.filter((o) => monthOf(o.date) === month).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <Card
        icon="◆"
        title={`Recurring income · ${month}`}
        actions={<Btn onClick={() => setEditing(!editing)}>{editing ? "Done editing" : "Edit streams"}</Btn>}
      >
        <div className="space-y-3">
          {s.streams.map((r) => {
            const st = r.stream;
            const margin = st.directCost ? r.expected - st.directCost : null;
            return (
              <div key={st.id} className={`border rounded-[3px] p-3.5 flex ${r.isCollected ? "border-good/40 bg-good/5" : "border-line bg-card-2/50"} flex-col md:flex-row md:items-center gap-3`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{st.name}</span>
                    {r.isCollected ? <Badge tone="good">Collected {peso(r.collected)}</Badge> : <Badge tone="warn">Expected</Badge>}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {st.kind === "percent_floor"
                      ? `${Math.round((st.percent ?? 0) * 100)}% of revenue, minimum ${peso(st.floor ?? 0)}`
                      : st.kind === "fixed"
                        ? `${peso(st.amount)} per month`
                        : `Estimate ${peso(st.amount)} per month`}
                    {margin != null && ` · ${peso(margin)} after ${peso(st.directCost!)} servicing cost`}
                  </div>
                </div>
                {st.kind === "percent_floor" && (
                  <label className="text-xs text-muted flex flex-col gap-1">
                    Their revenue this month
                    <NumInput className="w-36" value={r.month?.revenueBase} onChange={(v) => setSM(st.id, { revenueBase: v })} placeholder="₱0" />
                  </label>
                )}
                {st.kind === "variable" && (
                  <label className="text-xs text-muted flex flex-col gap-1">
                    Actual sales this month
                    <NumInput className="w-36" value={r.month?.actual} onChange={(v) => setSM(st.id, { actual: v })} placeholder={String(st.amount)} />
                  </label>
                )}
                <div className="text-right md:w-32">
                  <div className="text-xs text-muted">Due this month</div>
                  <div className="font-semibold tabular-nums">{peso(r.expected)}</div>
                </div>
                <div className="flex gap-2 items-center">
                  {r.isCollected ? (
                    <>
                      <NumInput className="w-28" value={r.collected} onChange={(v) => setSM(st.id, { collected: v ?? 0 })} />
                      <Btn onClick={() => setSM(st.id, { collected: undefined, collectedOn: undefined })}>Undo</Btn>
                    </>
                  ) : (
                    <Btn
                      kind="primary"
                      onClick={() => {
                        const amt = expectedForStream(st, r.month);
                        setSM(st.id, { collected: amt, collectedOn: collectDate });
                        celebrate({ kicker: "Loot collected", title: `+${peso(amt)}`, sub: st.name, icon: "💰" });
                      }}
                    >
                      Mark collected
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-sm mt-4 pt-3 border-t border-line">
          <span>Collected {peso(s.recurringCollected)}</span>
          <span className="text-muted">Still expected {peso(s.recurringPending)}</span>
        </div>
      </Card>

      {editing && (
        <Card icon="⚙" title="Edit income streams" actions={<Btn kind="soft" onClick={() => update((d) => void d.streams.push({ id: uid("stream"), name: "New client", kind: "fixed", amount: 0, active: true }))}>Add stream</Btn>}>
          <div className="space-y-3">
            {data.streams.map((st) => (
              <div key={st.id} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end border-b border-line pb-3">
                <label className="text-xs text-muted flex flex-col gap-1 col-span-2">
                  Name
                  <TextInput value={st.name} onChange={(v) => setStream(st.id, { name: v })} />
                </label>
                <label className="text-xs text-muted flex flex-col gap-1">
                  Type
                  <select value={st.kind} onChange={(e) => setStream(st.id, { kind: e.target.value as StreamKind })}>
                    {Object.entries(KIND_LABEL).map(([k, l]) => (
                      <option key={k} value={k}>{l}</option>
                    ))}
                  </select>
                </label>
                {st.kind === "percent_floor" ? (
                  <>
                    <label className="text-xs text-muted flex flex-col gap-1">
                      Percent
                      <NumInput value={st.percent != null ? Math.round(st.percent * 1000) / 10 : undefined} onChange={(v) => setStream(st.id, { percent: (v ?? 0) / 100 })} />
                    </label>
                    <label className="text-xs text-muted flex flex-col gap-1">
                      Minimum
                      <NumInput value={st.floor} onChange={(v) => setStream(st.id, { floor: v ?? 0, amount: v ?? 0 })} />
                    </label>
                  </>
                ) : (
                  <label className="text-xs text-muted flex flex-col gap-1 col-span-2">
                    {st.kind === "fixed" ? "Monthly fee" : "Monthly estimate"}
                    <NumInput value={st.amount} onChange={(v) => setStream(st.id, { amount: v ?? 0 })} />
                  </label>
                )}
                <label className="text-xs text-muted flex flex-col gap-1">
                  Servicing cost
                  <NumInput value={st.directCost} onChange={(v) => setStream(st.id, { directCost: v })} />
                </label>
                <div className="flex gap-2 col-span-2 md:col-span-7">
                  <label className="text-xs flex items-center gap-1">
                    <input type="checkbox" checked={st.active} onChange={(e) => setStream(st.id, { active: e.target.checked })} /> Active
                  </label>
                  <TextInput className="flex-1 text-xs" value={st.notes} onChange={(v) => setStream(st.id, { notes: v })} placeholder="Notes" />
                  <Btn kind="danger" onClick={() => confirm(`Remove ${st.name}?`) && update((d) => void (d.streams = d.streams.filter((x) => x.id !== st.id)))}>
                    Remove
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card icon="◆" title={`One-time income · ${month}`}>
        <form
          className="flex flex-wrap gap-2 mb-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ot.label || !ot.amount) return;
            update((d) => void d.oneTime.push({ id: uid("ot"), label: ot.label, amount: ot.amount!, date: ot.date }));
            setOt({ label: "", amount: undefined, date: today });
          }}
        >
          <input className="flex-1 min-w-40" placeholder="What was it?" value={ot.label} onChange={(e) => setOt({ ...ot, label: e.target.value })} />
          <NumInput className="w-32" placeholder="Amount" value={ot.amount} onChange={(v) => setOt({ ...ot, amount: v })} />
          <input type="date" value={ot.date} onChange={(e) => setOt({ ...ot, date: e.target.value })} />
          <Btn kind="primary">Add income</Btn>
        </form>
        {oneTime.length === 0 ? (
          <p className="text-sm text-muted">Nothing this month.</p>
        ) : (
          <ul className="divide-y divide-line">
            {oneTime.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="text-muted w-24">{o.date}</span>
                <span className="flex-1">{o.label}</span>
                <span className="tabular-nums font-medium">{peso(o.amount)}</span>
                <button className="text-muted text-xs" onClick={() => update((d) => void (d.oneTime = d.oneTime.filter((x) => x.id !== o.id)))}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
