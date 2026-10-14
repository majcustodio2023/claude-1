"use client";

import { useEffect, useState } from "react";
import { defaultAccountId, monthOf, parseAmount, uid } from "@/lib/finance";
import { DEFAULT_FUN_PERCENT, funBudget, funHistory } from "@/lib/fun";
import { useTracker } from "./App";
import { AccountSelect } from "./Money";
import { Badge, Bar, Btn, Card, money } from "./ui";
import { EditableNumber } from "./editable";
import { HELP } from "./help";

const VERDICT = {
  spent: ["Spent it", "good"],
  saved: ["Saved it", "accent"],
  over: ["Went over", "bad"],
  unused: ["Didn't spend", "muted"],
} as const;

/** How much is safe to spend on fun this month, what you spent, and past months. */
export default function FunMoney() {
  const { data, update, month, today } = useTracker();
  const f = funBudget(data, month, today);
  const current = month === monthOf(today);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "", amount: "", accountId: defaultAccountId(data, "out") });
  const history = funHistory(data, today);
  const spends = data.adHocExpenses.filter((e) => e.category === "fun" && monthOf(e.date) === month);

  // Keep this month's safe amount on record, so past months show what it was.
  useEffect(() => {
    if (!current || data.funMonths?.[month]?.safe === f.safe) return;
    update((d) => void (d.funMonths = { ...d.funMonths, [month]: { ...d.funMonths?.[month], safe: f.safe } }));
  }, [current, month, f.safe, data.funMonths, update]);

  const setSaved = (saved: boolean) => update((d) => void (d.funMonths = { ...d.funMonths, [month]: { safe: f.safe, ...d.funMonths?.[month], saved } }));

  return (
    <Card title="Fun money" icon="🎮" glow="good" help={HELP.fun}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-base font-extrabold uppercase text-muted">Safe to spend on fun {current ? "this month" : `in ${month}`}</div>
          <div className="comic-num text-5xl text-good mt-1">{money(f.left)}</div>
          <div className="text-base text-muted font-bold">
            of {money(f.safe)} · spent {money(f.spent)}
            {f.spent > f.safe && <span className="text-bad"> · {money(f.spent - f.safe)} over</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn kind="primary" onClick={() => setAdding(!adding)}>+ I spent on fun</Btn>
          {f.spent === 0 && (
            <Btn kind={f.saved ? "soft" : "ghost"} onClick={() => setSaved(!f.saved)}>
              {f.saved ? "✓ Saving it this month" : "I'm saving it instead"}
            </Btn>
          )}
        </div>
      </div>
      <div className="mt-3">
        <Bar pct={f.safe ? Math.min(f.spent / f.safe, 1) : 0} tone={f.spent > f.safe ? "bad" : "good"} thin />
      </div>
      {current && (
        <p className="text-base text-muted mt-2">
          {f.spare <= 0
            ? "Nothing spare yet this month: money made hasn't covered bills and spending. It opens up as you collect."
            : f.cashRoom != null && f.cashRoom < f.spare
              ? `${f.percent}% of the cash you have above your safety buffer and unpaid bills (${money(Math.max(f.cashRoom, 0))}).`
              : `${f.percent}% of what's spare this month (${money(f.spare)} made after bills and spending).`}
        </p>
      )}

      {adding && (
        <form
          className="flex flex-wrap gap-2 items-end mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            const amount = parseAmount(form.amount);
            if (!amount || amount <= 0) return;
            update((d) => {
              d.adHocExpenses.push({ id: uid("adhoc"), date: today, label: form.label.trim() || "Fun", amount, category: "fun", ...(form.accountId && { accountId: form.accountId }) });
              if (form.accountId) d.settings.lastPayAccountId = form.accountId;
              if (d.funMonths?.[monthOf(today)]) delete d.funMonths[monthOf(today)].saved;
            });
            setForm({ ...form, label: "", amount: "" });
            setAdding(false);
          }}
        >
          <input className="flex-1 min-w-40" placeholder="What was it? (e.g. new shoes)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <input className="w-32" inputMode="decimal" placeholder="Amount" aria-label="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <AccountSelect value={form.accountId} onChange={(accountId) => setForm({ ...form, accountId })} label="Paid from" />
          <Btn kind="primary">Save</Btn>
        </form>
      )}

      {spends.length > 0 && (
        <ul className="mt-3 space-y-1 text-base">
          {spends.map((e) => (
            <li key={e.id} className="flex justify-between gap-2">
              <span>
                {e.date.slice(5)} · {e.label}
              </span>
              <span className="flex gap-3 items-center">
                <span className="font-bold">{money(e.amount)}</span>
                <button className="text-sm text-muted" aria-label="Remove" onClick={() => update((d) => void (d.adHocExpenses = d.adHocExpenses.filter((x) => x.id !== e.id)))}>
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-4 text-base text-muted">
        Safe share of spare money
        <EditableNumber label="safe share" inputClass="w-20" format={(n) => `${n}%`} value={data.settings.funPercent ?? DEFAULT_FUN_PERCENT} onChange={(v) => update((d) => void (d.settings.funPercent = Math.min(Math.max(v ?? DEFAULT_FUN_PERCENT, 0), 100)))} />
      </div>

      {history.length > 0 && (
        <div className="mt-4">
          <div className="text-base font-extrabold uppercase text-muted mb-1.5">Past months</div>
          <ul className="space-y-1.5 text-base">
            {history.map((h) => (
              <li key={h.month} className="flex justify-between gap-2 items-center">
                <span className="font-bold">{h.month}</span>
                <span className="text-muted">
                  safe {money(h.safe)} · spent {money(h.spent)}
                </span>
                <Badge tone={VERDICT[h.verdict][1]}>{VERDICT[h.verdict][0]}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
