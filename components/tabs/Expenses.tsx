"use client";

import { useMemo, useState } from "react";
import { addMonths, billPaid, defaultAccountId, expenseAppliesTo, locale, moneyHistory, monthOf, parseAmount, summarize, uid } from "@/lib/finance";
import { ordinal } from "@/lib/calendar";
import type { BillPayment, ExpenseLine, SubItem } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Bar, Btn, Card, NumInput, TextInput, celebrate, money } from "../ui";
import { AccountSelect, accountName } from "../Money";
import { SubItems } from "../SubItems";
import ManualSpending from "../ManualSpending";
import { paySub, setSubs, subDone, subPaid, subRows, subsTotal, unpaySub } from "@/lib/subs";
import { Icon } from "../icons";
import { EditButton, SaveButton } from "../editable";
import { Avatar } from "../avatars";

const LINE_CATS: ExpenseLine["category"][] = ["household", "payroll", "client", "software", "debt", "other"];
const monthLabel = (m: string, style: "long" | "short" = "long") => new Date(m + "-01T00:00:00").toLocaleDateString(locale(), { month: style, year: "numeric" });

export default function Expenses() {
  const { data, update, month } = useTracker();
  const [justAdded, setJustAdded] = useState<string | null>(null);
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
            <li>To rename a bill, change its amount, or set when it starts and ends (like a loan), press <Icon name="pencil" size={20} /> Edit, then Save.</li>
            <li>Made a mistake? Press ✕ on a payment to remove it.</li>
            <li>A bill made of smaller costs (Household → maid, groceries, electricity)? Press &ldquo;Break into parts&rdquo; and add each one with its amount. Tick a part when you pay it and the bill fills up as you go. Whatever the parts don&apos;t cover shows as &ldquo;Everything else&rdquo;.</li>
          </ul>
        }
        actions={
          <Btn
            kind="soft"
            onClick={() => {
              const id = uid("exp");
              update((d) => void d.expenses.push({ id, name: "New bill", amount: 0, category: "other", active: true }));
              setJustAdded(id);
            }}
          >
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
            <BillRow key={`${month}-${e.id}`} bill={e} isNew={e.id === justAdded} />
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

      <ManualSpending />
      <History />
    </div>
  );
}

function Num({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="bg-card-2 border-[3px] border-outline rounded-[10px] p-2.5 sm:p-3 min-w-0">
      <div className="text-xs sm:text-sm font-extrabold uppercase text-muted">{label}</div>
      <div className={`font-display text-lg sm:text-3xl tracking-wide [overflow-wrap:anywhere] ${tone}`}>{money(value)}</div>
    </div>
  );
}

function BillRow({ bill: e, isNew = false }: { bill: ExpenseLine; isNew?: boolean }) {
  const { data, update, month, today } = useTracker();
  const applies = expenseAppliesTo(e, month);
  const pays = data.billPayments?.[month]?.[e.id] ?? [];
  const paid = billPaid(data, month, e);
  const left = Math.max(e.amount - paid, 0);
  const payDate = monthOf(today) === month ? today : `${month}-01`;
  const [text, setText] = useState("");
  const [date, setDate] = useState(payDate);
  const [accountId, setAccountId] = useState(defaultAccountId(data, "out"));
  const [settings, setSettings] = useState(isNew);
  const member = e.memberId ? data.team.find((m) => m.id === e.memberId) : undefined;
  const client = e.clientId ? data.clients?.find((c) => c.id === e.clientId) : undefined;
  const setLine = (patch: Partial<ExpenseLine>) => update((d) => void Object.assign(d.expenses.find((x) => x.id === e.id)!, patch));
  const listed = subsTotal(e.subs);
  const subList = subRows(e.amount, e.subs).map((sub) => {
    const part = subPaid(data, month, e, sub.id);
    const done = subDone(data, month, e, sub);
    return { sub, done, note: !done && part > 0 ? `${money(part)} paid` : undefined };
  });
  const subName = (id?: string) => (id ? subList.find((r) => r.sub.id === id)?.sub.name : undefined);
  const toggleSub = (sub: SubItem, done: boolean) => {
    if (done) {
      if (!pays.some((p) => p.subId === sub.id)) return alert(`${sub.name} was paid as part of a full payment for ${e.name}. Remove that payment below to undo it.`);
      update((d) => void unpaySub(d, month, e.id, sub.id));
      return;
    }
    const owed = sub.amount - subPaid(data, month, e, sub.id);
    update((d) => {
      paySub(d, month, e.id, sub.id, date, accountId);
      if (accountId) d.settings.lastPayAccountId = accountId;
    });
    if (paid + owed >= e.amount && e.amount > 0) celebrate({ kicker: "Bill cleared", title: e.name, sub: `${money(e.amount)} paid for ${monthLabel(month, "short")}`, icon: "🧾", sfx: "DONE!" });
  };

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
    <div id={`bill-${e.id}`} className={`border-[3px] rounded-[10px] p-3.5 space-y-3 transition-shadow ${left === 0 && paid > 0 ? "border-good/60 bg-good/5" : "border-outline bg-card-2/60"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {member && <Avatar value={member.avatar} seed={member.id} kind="person" size={52} title={member.name} />}
        <div className="flex-1 min-w-40">
          <div className="text-xl font-extrabold [overflow-wrap:anywhere]">{e.name}</div>
          {member && (
            <div className="text-base font-bold text-accent">
              {client ? `${member.name}'s pay for ${client.name}` : `${member.name}'s base pay`}
            </div>
          )}
          <div className="text-base text-muted font-bold">
            {money(e.amount)} a month · <span className="capitalize">{e.category}</span>
            {e.dueDay && ` · due on the ${ordinal(e.dueDay)}`}
            {e.startMonth && ` · from ${monthLabel(e.startMonth, "short")}`}
            {e.endMonth && ` · until ${monthLabel(e.endMonth, "short")}`}
          </div>
        </div>
        {applies ? status : <Badge>Not due this month</Badge>}
        {!settings && <EditButton title="Edit this bill" onClick={() => setSettings(true)} />}
      </div>

      {settings && (
        <div className="space-y-3 text-base bg-card-2 rounded-[8px] p-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-extrabold uppercase text-muted flex-1 min-w-48">
              Name
              <TextInput className="text-lg normal-case font-bold" value={e.name} onChange={(v) => v.trim() && setLine({ name: v.trim() })} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-extrabold uppercase text-muted">
              Monthly amount
              <NumInput className="w-36 text-lg" value={e.amount} onChange={(v) => setLine({ amount: Math.max(v ?? 0, listed) })} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-muted">
            <label className="flex items-center gap-2">
              Type
              <select value={e.category} onChange={(ev) => setLine({ category: ev.target.value as ExpenseLine["category"] })}>
                {LINE_CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              Due on
              <select value={e.dueDay ?? ""} onChange={(ev) => setLine({ dueDay: ev.target.value ? Number(ev.target.value) : undefined })}>
                <option value="">Not set</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d === 31 ? "31st / last day" : ordinal(d)}
                  </option>
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
          </div>
          <div className="flex flex-wrap gap-2">
            <SaveButton onClick={() => setSettings(false)} />
            <Btn kind="danger" onClick={() => confirm(`Remove ${e.name}? Payments already recorded stay in your history.`) && update((d) => void (d.expenses = d.expenses.filter((x) => x.id !== e.id)))}>
              Remove bill
            </Btn>
          </div>
        </div>
      )}

      {(applies || !!e.subs?.length) && (
        <SubItems
          rows={subList}
          subs={e.subs}
          onToggle={applies ? toggleSub : undefined}
          onEdit={(subs) => update((d) => setSubs(d.expenses.find((x) => x.id === e.id)!, subs))}
          addLabel="+ Break into parts (e.g. maid, groceries)"
        />
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
                  {subName(p.subId) && <Badge>{subName(p.subId)}</Badge>}
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
