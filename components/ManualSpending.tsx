"use client";

import { useState } from "react";
import { defaultAccountId, monthOf, uid } from "@/lib/finance";
import type { AdHocExpense } from "@/lib/types";
import { useTracker } from "./App";
import { Badge, Btn, Card, NumInput, money, toast } from "./ui";
import { AccountSelect, accountName } from "./Money";
import { HELP } from "./help";

export const SPEND_KINDS: Record<AdHocExpense["category"], string> = {
  ads: "Ads",
  software: "Software / tools",
  payroll: "Team / salary",
  household: "Household",
  fun: "Fun",
  other: "Other",
};

/**
 * Money you spent by hand: what it was for, how much, and the account it came out of.
 * On HQ it shows the latest few; the Expenses tab shows the whole month.
 */
export default function ManualSpending({ compact = false, goTo }: { compact?: boolean; goTo?: () => void }) {
  const { data, update, month, today } = useTracker();
  const blank = { label: "", amount: undefined as number | undefined, date: monthOf(today) === month ? today : `${month}-01`, category: "other" as AdHocExpense["category"], accountId: defaultAccountId(data, "out") };
  const [form, setForm] = useState(blank);
  const spent = data.adHocExpenses.filter((e) => monthOf(e.date) === month).sort((a, b) => b.date.localeCompare(a.date));
  const total = spent.reduce((a, e) => a + e.amount, 0);
  const shown = compact ? spent.slice(0, 4) : spent;

  const save = () => {
    if (!form.label.trim() || !form.amount || form.amount <= 0) return;
    const entry: AdHocExpense = { id: uid("adhoc"), label: form.label.trim(), amount: form.amount, date: form.date, category: form.category, ...(form.accountId && { accountId: form.accountId }) };
    update((d) => {
      d.adHocExpenses.push(entry);
      if (form.accountId) d.settings.lastPayAccountId = form.accountId;
    });
    const from = accountName(data, form.accountId);
    toast(`Logged ${money(entry.amount)} for ${entry.label}${from ? ` from ${from}` : ""}`);
    setForm({ ...blank, accountId: form.accountId, date: form.date });
  };

  return (
    <Card
      icon="💸"
      title={`Manual spending · ${money(total)}`}
      help={HELP.manualSpending}
      actions={compact && goTo ? <Btn kind="soft" onClick={goTo}>See all →</Btn> : undefined}
    >
      <form
        className="grid gap-2 sm:flex sm:flex-wrap sm:items-end mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="flex flex-col gap-1 text-base text-muted sm:flex-1 sm:min-w-48">
          What did you spend on?
          <input placeholder="Groceries, Canva, gas…" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          How much
          <NumInput className="sm:w-32" placeholder="Amount" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          Paid from
          <AccountSelect value={form.accountId} onChange={(id) => setForm({ ...form, accountId: id })} label="Paid from" />
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          Type
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as AdHocExpense["category"] })}>
            {Object.entries(SPEND_KINDS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          Day
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value || blank.date })} />
        </label>
        <Btn kind="primary" disabled={!form.label.trim() || !form.amount}>
          Log spending
        </Btn>
      </form>

      {spent.length === 0 ? (
        <p className="text-base text-muted">Nothing spent by hand this month.</p>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((e) => (
            <li key={e.id} className="flex items-center gap-x-3 gap-y-1 py-2 text-base flex-wrap">
              <span className="text-muted w-24">{e.date}</span>
              <span className="flex-1 min-w-32 font-bold">{e.label}</span>
              <Badge>{SPEND_KINDS[e.category] ?? e.category}</Badge>
              {compact ? (
                accountName(data, e.accountId) && <span className="text-muted">from {accountName(data, e.accountId)}</span>
              ) : (
                <AccountSelect className="text-sm py-0.5" value={e.accountId} label="Paid from" onChange={(id) => update((d) => void (d.adHocExpenses.find((x) => x.id === e.id)!.accountId = id))} />
              )}
              <span className="tabular-nums font-bold">−{money(e.amount)}</span>
              <button className="text-muted text-sm px-1" onClick={() => confirm(`Remove ${e.label} (${money(e.amount)})? It goes back into the account.`) && update((d) => void (d.adHocExpenses = d.adHocExpenses.filter((x) => x.id !== e.id)))} aria-label={`Remove ${e.label}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      {compact && spent.length > shown.length && <p className="text-base text-muted mt-2">+{spent.length - shown.length} more this month in Expenses.</p>}
    </Card>
  );
}
