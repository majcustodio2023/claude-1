"use client";

import { useState } from "react";
import { defaultAccountId, monthOf, uid } from "@/lib/finance";
import type { OneTimeIncome } from "@/lib/types";
import { useTracker } from "./App";
import { Badge, Btn, Card, NumInput, money, toast } from "./ui";
import { AccountSelect, accountName } from "./Money";
import { HELP } from "./help";

type Kind = NonNullable<OneTimeIncome["category"]>;

export const INCOME_KINDS: Record<Kind, string> = {
  sales: "Sale",
  side: "Side job",
  refund: "Refund",
  gift: "Gift / help",
  other: "Other",
};

/**
 * Money that came in by hand: what it was, how much, and the account it went into.
 * The mirror of Manual spending. On HQ it shows the latest few; the Income tab shows the whole month.
 */
export default function ManualIncome({ compact = false, goTo }: { compact?: boolean; goTo?: () => void }) {
  const { data, update, month, today } = useTracker();
  const blank = { label: "", amount: undefined as number | undefined, date: monthOf(today) === month ? today : `${month}-01`, category: "other" as Kind, accountId: defaultAccountId(data, "in") };
  const [form, setForm] = useState(blank);
  const got = (data.oneTime ?? []).filter((e) => monthOf(e.date) === month).sort((a, b) => b.date.localeCompare(a.date));
  const total = got.reduce((a, e) => a + e.amount, 0);
  const shown = compact ? got.slice(0, 4) : got;

  const save = () => {
    if (!form.label.trim() || !form.amount || form.amount <= 0) return;
    const entry: OneTimeIncome = { id: uid("in"), label: form.label.trim(), amount: form.amount, date: form.date, category: form.category, ...(form.accountId && { accountId: form.accountId }) };
    update((d) => {
      d.oneTime = [...(d.oneTime ?? []), entry];
      if (form.accountId) d.settings.lastAccountId = form.accountId;
    });
    const into = accountName(data, form.accountId);
    toast(`Added ${money(entry.amount)} from ${entry.label}${into ? ` into ${into}` : ""}`);
    setForm({ ...blank, accountId: form.accountId, date: form.date });
  };

  return (
    <Card
      icon="💰"
      title={`Manual income · ${money(total)}`}
      help={HELP.manualIncome}
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
          What came in?
          <input placeholder="Refund, sold a laptop, side gig…" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          How much
          <NumInput className="sm:w-32" placeholder="Amount" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          Went into
          <AccountSelect value={form.accountId} onChange={(id) => setForm({ ...form, accountId: id })} label="Went into" />
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          Type
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Kind })}>
            {Object.entries(INCOME_KINDS).map(([k, l]) => (
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
          Add income
        </Btn>
      </form>

      {got.length === 0 ? (
        <p className="text-base text-muted">Nothing added by hand this month.</p>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((e) => (
            <li key={e.id} className="flex items-center gap-x-3 gap-y-1 py-2 text-base flex-wrap">
              <span className="text-muted w-24">{e.date}</span>
              <span className="flex-1 min-w-32 font-bold">{e.label}</span>
              <Badge tone="good">{INCOME_KINDS[e.category ?? "other"]}</Badge>
              {compact ? (
                accountName(data, e.accountId) && <span className="text-muted">into {accountName(data, e.accountId)}</span>
              ) : (
                <AccountSelect className="text-sm py-0.5" value={e.accountId} label="Went into" onChange={(id) => update((d) => void (d.oneTime.find((x) => x.id === e.id)!.accountId = id))} />
              )}
              <span className="tabular-nums font-bold text-good">+{money(e.amount)}</span>
              <button className="text-muted text-sm px-1" onClick={() => confirm(`Remove ${e.label} (${money(e.amount)})? It comes back out of the account.`) && update((d) => void (d.oneTime = d.oneTime.filter((x) => x.id !== e.id)))} aria-label={`Remove ${e.label}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      {compact && got.length > shown.length && <p className="text-base text-muted mt-2">+{got.length - shown.length} more this month in Income.</p>}
    </Card>
  );
}
