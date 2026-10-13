"use client";

import { useMemo, useState } from "react";
import { addMonths, billPaid, defaultAccountId, expenseAppliesTo, locale, moneyHistory, monthOf, parseAmount, summarize, uid } from "@/lib/finance";
import type { AdHocExpense, BillPayment, ExpenseLine } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Bar, Btn, Card, NumInput, TextInput, celebrate, money } from "../ui";
import { AccountSelect, accountName } from "../Money";

const LINE_CATS: ExpenseLine["category"][] = ["household", "payroll", "client", "software", "debt", "other"];
const ADHOC_CATS: AdHocExpense["category"][] = ["ads", "software", "payroll", "household", "other"];
const monthLabel = (m: string, style: "long" | "short" = "long") => new Date(m + "-01T00:00:00").toLocaleDateString(locale(), { month: style, year: "numeric" });

export default function Expenses() {
  const { data, update, month } = useTracker();
  const s = useMemo(() => summarize(data, month), [data, month]);
  const [showOff, setShowOff] = useState(false);
  const applies = data.expenses.filter((e) => expenseAppliesTo(e, month));
  const others = data.expenses.filter((e) => !expenseAppliesTo(e, month));

  return (
    <div className="space-y-4">
      <Card
        icon="🧾"
        title={`Monthly bills · ${monthLabel(month)}`}
        help={
          <ul>
            <li>Each bill has a monthly amount: what you expect to pay every month (rent, salaries, software…). Together they are your &ldquo;stay afloat&rdquo; number on HQ.</li>
            <li>When you pay, type what you paid and press Pay. Paid part of it? Enter that part; the rest stays as &ldquo;left to pay&rdquo;.</li>
            <li>Each payment is saved with the day you paid, the time you recorded it, and the account it came out of. It&apos;s taken off that account in the War chest.</li>
            <li>A bill that only runs for some months (like a loan)? Open ⚙ and set when it starts and ends.</li>
            <li>Made a mistake? Press ✕ on a payment to remove it.</li>
          </ul>
        }
        actions={
          <Btn kind="soft" onClick={() => update((d) => void d.expenses.push({ id: uid("exp"), name: "New bill", amount: 0, category: "other", active: true }))}>
            + Add bill
          </Btn>
        }
      >
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Num label="Monthly bills" value={s.fixedExpenses} />
          <Num label="Paid so far" value={s.expensesPaid} tone="text-good" />
          <Num label="Left to pay" value={s.billsLeft} tone={s.billsLeft ? "text-bad" : "text-good"} />
        </div>
        <Bar pct={s.fixedExpenses ? Math.min(s.expensesPaid, s.fixedExpenses) / s.fixedExpenses : 0} tone="good" />
        <div className="space-y-3 mt-4">
          {applies.length === 0 && <p className="text-lg text-muted">No bills yet. Press &ldquo;Add bill&rdquo; to add your regular monthly costs.</p>}
          {applies.map((e) => (
            <BillRow key={`${month}-${e.id}`} bill={e} />
          ))}
        </div>
        {others.length > 0 && (
          <div className="mt-4">
            <button className="text-base text-muted underline" onClick={() => setShowOff(!showOff)}>
              {showOff ? "Hide" : "Show"} {others.length} bill{others.length > 1 ? "s" : ""} not due in {monthLabel(month, "short")}
            </button>
            {showOff && (
              <div className="space-y-3 mt-3 opacity-80">
                {others.map((e) => (
                  <BillRow key={`${month}-${e.id}`} bill={e} />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <OtherSpending />
      <History />
    </div>
  );
}

function Num({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="bg-card-2 border-[3px] border-outline rounded-[10px] p-2.5 sm:p-3 min-w-0">
      <div className="text-xs sm:text-sm font-extrabold uppercase text-muted">{label}</div>
      <div className={`font-display text-xl sm:text-3xl tracking-wide break-all ${tone}`}>{money(value)}</div>
    </div>
  );
}

function BillRow({ bill: e }: { bill: ExpenseLine }) {
  const { data, update, month, today } = useTracker();
  const applies = expenseAppliesTo(e, month);
  const pays = data.billPayments?.[month]?.[e.id] ?? [];
  const paid = billPaid(data, month, e);
  const left = Math.max(e.amount - paid, 0);
  const payDate = monthOf(today) === month ? today : `${month}-01`;
  const [text, setText] = useState("");
  const [date, setDate] = useState(payDate);
  const [accountId, setAccountId] = useState(defaultAccountId(data, "out"));
  const [settings, setSettings] = useState(false);
  const setLine = (patch: Partial<ExpenseLine>) => update((d) => void Object.assign(d.expenses.find((x) => x.id === e.id)!, patch));

  const pay = (amount: number) => {
    if (amount <= 0) return;
    const p: BillPayment = { id: uid("bill"), date, at: new Date().toISOString(), amount, ...(accountId && { accountId }) };
    update((d) => {
      const byBill = ((d.billPayments ??= {})[month] ??= {});
      byBill[e.id] = [...(byBill[e.id] ?? []), p];
      if (accountId) d.settings.lastPayAccountId = accountId;
    });
    setText("");
    if (paid + amount >= e.amount && e.amount > 0) celebrate({ kicker: "Bill cleared", title: e.name, sub: `${money(e.amount)} paid for ${monthLabel(month, "short")}`, icon: "🧾", sfx: "DONE!" });
  };
  const removePay = (id: string) =>
    update((d) => {
      const byBill = d.billPayments?.[month];
      if (byBill?.[e.id]) byBill[e.id] = byBill[e.id].filter((p) => p.id !== id);
    });

  const status = paid <= 0 ? <Badge tone="warn">Not paid</Badge> : paid < e.amount ? <Badge tone="gold">Partly paid</Badge> : paid > e.amount ? <Badge tone="bad">Paid {money(paid - e.amount)} over</Badge> : <Badge tone="good">Paid ✓</Badge>;
  const typed = parseAmount(text) || 0;

  return (
    <div className={`border-[3px] rounded-[10px] p-3.5 space-y-3 ${left === 0 && paid > 0 ? "border-good/60 bg-good/5" : "border-outline bg-card-2/60"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <TextInput className="flex-1 min-w-40 text-lg font-bold" value={e.name} onChange={(v) => setLine({ name: v })} />
        <label className="flex items-center gap-2 text-base text-muted">
          Monthly amount
          <NumInput className="w-32" value={e.amount} onChange={(v) => setLine({ amount: v ?? 0 })} />
        </label>
        {applies ? status : <Badge>Not due this month</Badge>}
        <button className="btn btn-ghost px-3" onClick={() => setSettings(!settings)} aria-expanded={settings} title="Bill settings">
          ⚙
        </button>
      </div>

      {settings && (
        <div className="flex flex-wrap items-center gap-3 text-base text-muted bg-card-2 rounded-[8px] p-3">
          <label className="flex items-center gap-2">
            Type
            <select value={e.category} onChange={(ev) => setLine({ category: ev.target.value as ExpenseLine["category"] })}>
              {LINE_CATS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Starts
            <OptionalMonth value={e.startMonth} empty="Always" onChange={(v) => setLine({ startMonth: v })} />
          </label>
          <label className="flex items-center gap-2">
            Ends
            <OptionalMonth value={e.endMonth} empty="Never" onChange={(v) => setLine({ endMonth: v })} />
          </label>
          <Btn kind="danger" onClick={() => confirm(`Remove ${e.name}? Payments already recorded stay in your history.`) && update((d) => void (d.expenses = d.expenses.filter((x) => x.id !== e.id)))}>
            Remove bill
          </Btn>
        </div>
      )}

      {(applies || pays.length > 0) && (
        <>
          <div>
            <div className="flex justify-between flex-wrap gap-2 text-base font-bold mb-1">
              <span>
                Paid {money(paid)} of {money(e.amount)}
              </span>
              <span className={left ? "text-bad" : "text-good"}>{left ? `${money(left)} left` : "Nothing left"}</span>
            </div>
            <Bar pct={e.amount ? paid / e.amount : 0} tone={left ? "gold" : "good"} thin />
          </div>

          {pays.length > 0 && (
            <ul className="text-base space-y-1">
              {pays.map((p) => (
                <li key={p.id} className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold tabular-nums w-28">−{money(p.amount)}</span>
                  <span className="text-muted">
                    paid {p.date}
                    {accountName(data, p.accountId) ? ` from ${accountName(data, p.accountId)}` : ""}
                    {" · "}
                    <span title="When it was recorded">logged {new Date(p.at).toLocaleString(locale(), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  </span>
                  <button className="text-muted ml-auto px-2" onClick={() => confirm(`Remove this ${money(p.amount)} payment?`) && removePay(p.id)} aria-label="Remove payment">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {left > 0 && (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(ev) => {
                ev.preventDefault();
                pay(typed);
              }}
            >
              <input inputMode="decimal" className="w-40 text-lg tabular-nums" placeholder="Amount paid" value={text} onChange={(ev) => setText(ev.target.value)} aria-label={`Amount paid for ${e.name}`} />
              <input type="date" value={date} onChange={(ev) => setDate(ev.target.value || payDate)} aria-label="Date paid" />
              <AccountSelect value={accountId} onChange={setAccountId} label="Paid from" />
              <Btn kind="primary" disabled={typed <= 0}>
                Pay {typed > 0 ? money(typed) : ""}
              </Btn>
              <Btn type="button" kind="soft" onClick={() => pay(left)}>
                Paid in full · {money(left)}
              </Btn>
            </form>
          )}
        </>
      )}
    </div>
  );
}

/** Month dropdown with an "always" option (avoids type="month", which some browsers show as plain text). */
function OptionalMonth({ value, onChange, empty }: { value?: string; onChange: (v: string | undefined) => void; empty: string }) {
  const { today } = useTracker();
  const now = monthOf(today);
  const options = Array.from({ length: 61 }, (_, i) => addMonths(now, i - 24));
  if (value && !options.includes(value)) options.push(value);
  options.sort();
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)}>
      <option value="">{empty}</option>
      {options.map((m) => (
        <option key={m} value={m}>
          {monthLabel(m, "short")}
        </option>
      ))}
    </select>
  );
}

function OtherSpending() {
  const { data, update, month, today } = useTracker();
  const s = useMemo(() => summarize(data, month), [data, month]);
  const [form, setForm] = useState({ label: "", amount: undefined as number | undefined, date: today, category: "ads" as AdHocExpense["category"], accountId: defaultAccountId(data, "out") });
  const adHoc = data.adHocExpenses.filter((e) => monthOf(e.date) === month).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card
      icon="💸"
      title={`Other spending · ${money(s.adHocExpenses)}`}
      help={
        <ul>
          <li>For money out that isn&apos;t a regular monthly bill: ad spend, a one-off purchase, a late salary.</li>
          <li>Pick the account it came out of. It&apos;s taken off that account in the War chest.</li>
          <li>Meta ad spend can be added here automatically with &ldquo;Sync spend to expenses&rdquo; in Ad Command.</li>
        </ul>
      }
    >
      <form
        className="flex flex-wrap gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.label || !form.amount) return;
          update((d) => {
            d.adHocExpenses.push({ id: uid("adhoc"), label: form.label, amount: form.amount!, date: form.date, category: form.category, ...(form.accountId && { accountId: form.accountId }) });
            if (form.accountId) d.settings.lastPayAccountId = form.accountId;
          });
          setForm({ ...form, label: "", amount: undefined });
        }}
      >
        <input className="flex-1 min-w-40" placeholder="Ad spend, tools, one-off bills…" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <NumInput className="w-32" placeholder="Amount" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as AdHocExpense["category"] })}>
          {ADHOC_CATS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <AccountSelect value={form.accountId} onChange={(id) => setForm({ ...form, accountId: id })} label="Paid from" />
        <Btn kind="primary">Add</Btn>
      </form>
      {adHoc.length === 0 ? (
        <p className="text-base text-muted">Nothing this month.</p>
      ) : (
        <ul className="divide-y divide-line">
          {adHoc.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2 text-base flex-wrap">
              <span className="text-muted w-24">{e.date}</span>
              <span className="flex-1 min-w-32">{e.label}</span>
              <Badge>{e.category}</Badge>
              <AccountSelect className="text-sm py-0.5" value={e.accountId} label="Paid from" onChange={(id) => update((d) => void (d.adHocExpenses.find((x) => x.id === e.id)!.accountId = id))} />
              <span className="tabular-nums font-bold">{money(e.amount)}</span>
              <button className="text-muted text-sm" onClick={() => update((d) => void (d.adHocExpenses = d.adHocExpenses.filter((x) => x.id !== e.id)))} aria-label="Remove">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** How the last six months went: money in, bills, other spending, what was left. */
function History() {
  const { data, month } = useTracker();
  const rows = useMemo(() => moneyHistory(data, month, 6), [data, month]);
  const active = rows.filter((r) => r.collected || r.billsPaid || r.otherSpending);
  const max = Math.max(...rows.map((r) => Math.max(r.collected, r.billsPaid + r.otherSpending)), 1);
  const avg = (k: "collected" | "billsPaid" | "otherSpending" | "net") => (active.length ? active.reduce((a, r) => a + r[k], 0) / active.length : 0);

  // Where this month's money went, by type.
  const byCat = new Map<string, number>();
  for (const e of data.expenses) {
    const p = billPaid(data, month, e);
    if (p) byCat.set(e.category, (byCat.get(e.category) ?? 0) + p);
  }
  for (const e of data.adHocExpenses) if (monthOf(e.date) === month) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
  const catTotal = cats.reduce((a, [, v]) => a + v, 0);

  return (
    <Card
      icon="📊"
      title="How you've been doing"
      glow="gold"
      help={
        <ul>
          <li>Built from what you record: collected income, bill payments and other spending.</li>
          <li>Green bar = money collected. Red bar = money paid out (bills + other spending). Left over = collected − paid out.</li>
          <li>Averages only count months where something was recorded.</li>
        </ul>
      }
    >
      <div className="space-y-2.5">
        {rows.map((r) => {
          const out = r.billsPaid + r.otherSpending;
          return (
            <div key={r.month} className="grid grid-cols-[5.5rem_1fr_7.5rem] items-center gap-3">
              <span className={`font-display text-lg tracking-wide ${r.month === month ? "text-gold" : ""}`}>{monthLabel(r.month, "short")}</span>
              <div className="space-y-1">
                <div className="h-3.5 rounded-full bg-good border-2 border-outline" style={{ width: `${Math.max((r.collected / max) * 100, r.collected ? 2 : 0)}%` }} title={`Collected ${money(r.collected)}`} />
                <div className="h-3.5 rounded-full bg-bad border-2 border-outline" style={{ width: `${Math.max((out / max) * 100, out ? 2 : 0)}%` }} title={`Paid out ${money(out)}`} />
              </div>
              <div className="text-right leading-tight">
                <div className={`font-bold tabular-nums ${r.net >= 0 ? "text-good" : "text-bad"}`}>
                  {r.net >= 0 ? "+" : "−"}
                  {money(Math.abs(r.net))}
                </div>
                <div className="text-sm text-muted">left over</div>
              </div>
            </div>
          );
        })}
      </div>
      {active.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Num label="Avg collected" value={avg("collected")} tone="text-good" />
          <Num label="Avg bills paid" value={avg("billsPaid")} />
          <Num label="Avg other spending" value={avg("otherSpending")} />
          <Num label="Avg left over" value={avg("net")} tone={avg("net") >= 0 ? "text-good" : "text-bad"} />
        </div>
      )}
      {cats.length > 0 && (
        <div className="mt-5">
          <div className="font-display text-xl tracking-wide mb-2">Where {monthLabel(month, "short")}&apos;s money went</div>
          <ul className="space-y-1.5">
            {cats.map(([c, v]) => (
              <li key={c} className="grid grid-cols-[7rem_1fr_7rem] items-center gap-3 text-base">
                <span className="capitalize font-bold">{c}</span>
                <Bar pct={catTotal ? v / catTotal : 0} tone="hero" thin />
                <span className="text-right tabular-nums">
                  {money(v)} <span className="text-muted">({Math.round((v / catTotal) * 100)}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
