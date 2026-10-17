"use client";

import { useState } from "react";
import type { IncomeStream, StreamKind } from "@/lib/types";
import { useTracker } from "./App";
import { Btn, NumInput, money } from "./ui";
import { Icon } from "./icons";
import { EditButton, SaveButton } from "./editable";
import { SubItems } from "./SubItems";
import { setSubs, subRows, subsTotal } from "@/lib/subs";
import { ordinal } from "@/lib/calendar";

export const KIND_LABEL: Record<StreamKind, string> = {
  fixed: "Same amount every month",
  percent_floor: "% of their revenue (with a minimum)",
  variable: "Changes every month (e.g. product or SaaS sales)",
};

/** How a monthly income works out its amount: fixed fee, a share of revenue, or whatever actually came in. */
export function StreamTerms({ stream: st, alwaysEdit = false }: { stream: IncomeStream; alwaysEdit?: boolean }) {
  const { update } = useTracker();
  const [editing, setEditing] = useState(false);
  const set = (patch: Partial<IncomeStream>) => update((d) => void Object.assign(d.streams.find((x) => x.id === st.id)!, patch));
  const listed = subsTotal(st.subs);
  const base = st.kind === "percent_floor" ? (st.floor ?? 0) : st.amount;
  if (!alwaysEdit && !editing) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold flex-1 min-w-40">{termsText(st, money)}</span>
          {!st.payDay && (
            <Btn kind="hero" onClick={() => setEditing(true)} title="Pick the day of the month they pay, so it shows on the Calendar">
              <Icon name="calendar" size={18} /> Set pay day
            </Btn>
          )}
          <EditButton title="Change how this is paid" onClick={() => setEditing(true)} />
        </div>
        <SubItems rows={subRows(base, st.subs).map((sub) => ({ sub, done: false }))} subs={st.subs} onEdit={(subs) => update((d) => setSubs(d.streams.find((x) => x.id === st.id)!, subs))} addLabel="+ Break into parts (each collected on its own)" />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 text-base">
        <label className="flex flex-col gap-1 text-muted">
          How it&apos;s paid
          <select value={st.kind} onChange={(e) => set({ kind: e.target.value as StreamKind })}>
            {Object.entries(KIND_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {st.kind === "percent_floor" ? (
          <>
            <label className="flex flex-col gap-1 text-muted">
              Their revenue %
              <NumInput className="w-24" value={st.percent != null ? Math.round(st.percent * 1000) / 10 : undefined} onChange={(v) => set({ percent: (v ?? 0) / 100 })} />
            </label>
            <label className="flex flex-col gap-1 text-muted">
              Minimum per month
              <NumInput className="w-32" value={st.floor} onChange={(v) => set({ floor: v ?? 0, amount: v ?? 0 })} />
            </label>
          </>
        ) : (
          <label className="flex flex-col gap-1 text-muted">
            {st.kind === "fixed" ? "Monthly fee" : "Usual month (estimate)"}
            <NumInput className="w-32" value={st.amount} onChange={(v) => set({ amount: Math.max(v ?? 0, listed) })} />
          </label>
        )}
        <DayField label="Pays on day" value={st.payDay} onChange={(payDay) => set({ payDay })} />
      </div>
      <SubItems rows={subRows(base, st.subs).map((sub) => ({ sub, done: false }))} subs={st.subs} onEdit={(subs) => update((d) => setSubs(d.streams.find((x) => x.id === st.id)!, subs))} addLabel="+ Break into parts (each collected on its own)" />
      {!alwaysEdit && <SaveButton onClick={() => setEditing(false)} />}
    </div>
  );
}

/** One line describing the terms, e.g. "15% of their revenue, at least ₱25,000 · pays on the 15th". */
export function termsText(st: IncomeStream, money: (n: number) => string) {
  const day = st.payDay ? ` · pays on the ${ordinal(st.payDay)}` : "";
  if (st.kind === "percent_floor") return `${Math.round((st.percent ?? 0) * 1000) / 10}% of their revenue, at least ${money(st.floor ?? 0)}${day}`;
  if (st.kind === "fixed") return `${money(st.amount)} every month${day}`;
  return `Changes monthly · usually about ${money(st.amount)}${day}`;
}

/** Day of the month (1-31) picker; blank = not set. Shows on the Calendar. */
export function DayField({ label, value, onChange }: { label: string; value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <label className="flex flex-col gap-1 text-muted">
      {label}
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}>
        <option value="">Not set</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d === 31 ? "31st / last day" : ordinal(d)}
          </option>
        ))}
      </select>
    </label>
  );
}
