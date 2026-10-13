"use client";

import type { IncomeStream, StreamKind } from "@/lib/types";
import { useTracker } from "./App";
import { NumInput } from "./ui";
import { SubItems } from "./SubItems";
import { setSubs, subRows, subsTotal } from "@/lib/subs";

export const KIND_LABEL: Record<StreamKind, string> = {
  fixed: "Same amount every month",
  percent_floor: "% of their revenue (with a minimum)",
  variable: "Changes every month (e.g. product or SaaS sales)",
};

/** How a monthly income works out its amount: fixed fee, a share of revenue, or whatever actually came in. */
export function StreamTerms({ stream: st }: { stream: IncomeStream }) {
  const { update } = useTracker();
  const set = (patch: Partial<IncomeStream>) => update((d) => void Object.assign(d.streams.find((x) => x.id === st.id)!, patch));
  const listed = subsTotal(st.subs);
  const base = st.kind === "percent_floor" ? (st.floor ?? 0) : st.amount;
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
      </div>
      <SubItems rows={subRows(base, st.subs).map((sub) => ({ sub, done: false }))} subs={st.subs} onEdit={(subs) => update((d) => setSubs(d.streams.find((x) => x.id === st.id)!, subs))} addLabel="+ Break into parts (each collected on its own)" />
    </div>
  );
}

/** One line describing the terms, e.g. "15% of their revenue, at least ₱25,000". */
export function termsText(st: IncomeStream, money: (n: number) => string) {
  if (st.kind === "percent_floor") return `${Math.round((st.percent ?? 0) * 1000) / 10}% of their revenue, at least ${money(st.floor ?? 0)}`;
  if (st.kind === "fixed") return `${money(st.amount)} every month`;
  return `Changes monthly · usually about ${money(st.amount)}`;
}
