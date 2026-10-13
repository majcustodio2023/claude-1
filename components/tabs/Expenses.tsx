"use client";

import { useMemo, useState } from "react";
import { expenseAppliesTo, monthOf, summarize, uid } from "@/lib/finance";
import type { AdHocExpense, ExpenseLine } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Btn, Card, NumInput, TextInput, money } from "../ui";

const LINE_CATS: ExpenseLine["category"][] = ["household", "payroll", "client", "software", "debt", "other"];
const ADHOC_CATS: AdHocExpense["category"][] = ["ads", "software", "payroll", "household", "other"];

export default function Expenses() {
  const { data, update, month, today } = useTracker();
  const s = useMemo(() => summarize(data, month), [data, month]);
  const [form, setForm] = useState({ label: "", amount: undefined as number | undefined, date: today, category: "ads" as AdHocExpense["category"] });
  const paid = data.expensePaid[month] ?? {};
  const setLine = (id: string, patch: Partial<ExpenseLine>) => update((d) => void Object.assign(d.expenses.find((x) => x.id === id)!, patch));
  const adHoc = data.adHocExpenses.filter((e) => monthOf(e.date) === month).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <Card
        icon="▼"
        title={`Monthly upkeep · ${month} · ${money(s.fixedExpenses)}`}
        actions={<Btn kind="soft" onClick={() => update((d) => void d.expenses.push({ id: uid("exp"), name: "New expense", amount: 0, category: "other", active: true }))}>Add expense</Btn>}
      >
        <div className="space-y-2">
          {data.expenses.map((e) => {
            const applies = expenseAppliesTo(e, month);
            return (
              <div key={e.id} className={`grid grid-cols-2 md:grid-cols-12 gap-2 items-center border-b border-line pb-2 ${applies ? "" : "opacity-50"}`}>
                <label className="flex items-center gap-2 md:col-span-1 text-sm">
                  <input
                    type="checkbox"
                    disabled={!applies}
                    checked={Boolean(paid[e.id])}
                    onChange={(ev) => update((d) => void ((d.expensePaid[month] ??= {})[e.id] = ev.target.checked))}
                  />
                  Paid
                </label>
                <TextInput className="md:col-span-4" value={e.name} onChange={(v) => setLine(e.id, { name: v })} />
                <NumInput className="md:col-span-2" value={e.amount} onChange={(v) => setLine(e.id, { amount: v ?? 0 })} />
                <select className="md:col-span-1" value={e.category} onChange={(ev) => setLine(e.id, { category: ev.target.value as ExpenseLine["category"] })}>
                  {LINE_CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
                <div className="md:col-span-3 flex items-center gap-1 text-sm text-muted col-span-2">
                  <input type="month" className="w-full" value={e.startMonth ?? ""} onChange={(ev) => setLine(e.id, { startMonth: ev.target.value || undefined })} title="Starts" />
                  to
                  <input type="month" className="w-full" value={e.endMonth ?? ""} onChange={(ev) => setLine(e.id, { endMonth: ev.target.value || undefined })} title="Ends" />
                </div>
                <div className="md:col-span-1 flex justify-end gap-2">
                  {!applies && <Badge>Not this month</Badge>}
                  <button className="text-muted text-sm" onClick={() => confirm(`Remove ${e.name}?`) && update((d) => void (d.expenses = d.expenses.filter((x) => x.id !== e.id)))}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-muted mt-3">
          The &ldquo;stay afloat&rdquo; target is the total of the expenses that apply this month ({money(s.fixedExpenses)}). Leave the start and end months blank for expenses that never stop.
        </p>
      </Card>

      <Card icon="▼" title={`Other spending · ${month} · ${money(s.adHocExpenses)}`}>
        <form
          className="flex flex-wrap gap-2 mb-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.label || !form.amount) return;
            update((d) => void d.adHocExpenses.push({ id: uid("adhoc"), label: form.label, amount: form.amount!, date: form.date, category: form.category }));
            setForm({ ...form, label: "", amount: undefined });
          }}
        >
          <input className="flex-1 min-w-40" placeholder="Ad spend, tools, one-off bills…" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <NumInput className="w-32" placeholder="Amount" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as AdHocExpense["category"] })}>
            {ADHOC_CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Btn kind="primary">Add</Btn>
        </form>
        {adHoc.length === 0 ? (
          <p className="text-sm text-muted">Nothing this month.</p>
        ) : (
          <ul className="divide-y divide-line">
            {adHoc.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="text-muted w-24">{e.date}</span>
                <span className="flex-1">{e.label}</span>
                <Badge>{e.category}</Badge>
                <span className="tabular-nums font-medium">{money(e.amount)}</span>
                <button className="text-muted text-sm" onClick={() => update((d) => void (d.adHocExpenses = d.adHocExpenses.filter((x) => x.id !== e.id)))}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
