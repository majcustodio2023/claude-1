"use client";

import { useMemo, useState } from "react";
import { cashAccounts, cashForecast, cashHealth, cashPosition, locale, money, parseAmount, recordBalance, uid, type CashFlow } from "@/lib/finance";
import type { TrackerData } from "@/lib/types";
import { AccountSelect } from "./Money";
import { useTracker } from "./App";
import { Badge, Bar, Btn, Card, Stat } from "./ui";
import { HELP } from "./help";
import { Glyph, Icon } from "./icons";

const monthName = (m: string) => new Date(m + "-01T00:00:00").toLocaleDateString(locale(), { month: "short", year: "numeric" });

export default function WarChest() {
  const { data, update, today } = useTracker();
  const cash = useMemo(() => cashPosition(data, today), [data, today]);
  const health = useMemo(() => cashHealth(data, today), [data, today]);
  const forecast = useMemo(() => cashForecast(data, today, 4), [data, today]);
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState(false);
  const history = data.settings.cashHistory ?? [];
  const stale = health.daysSinceUpdate != null && health.daysSinceUpdate >= 7;

  return (
    <Card
      title="War chest"
      help={HELP.warChest}
      icon="💰"
      glow="gold"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {stale && <Badge tone="warn">Updated {health.daysSinceUpdate} days ago</Badge>}
          {cash.accounts.length > 1 && (
            <Btn onClick={() => (setMoving((v) => !v), setEditing(false))}>{moving ? "Close" : "⇄ Move money"}</Btn>
          )}
          <Btn kind="primary" onClick={() => (setEditing((v) => !v), setMoving(false))}>
            {editing ? "Close" : <><Icon name="bank" size={20} className="mr-1.5" />Update balances</>}
          </Btn>
        </div>
      }
    >
      {editing && <BalanceForm onDone={() => setEditing(false)} />}
      {moving && <TransferForm onDone={() => setMoving(false)} />}

      {!cash.set ? (
        !editing && <p className="text-lg text-muted">Press &quot;Update balance&quot; and enter what&apos;s in your bank and e-wallets today.</p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cash.accounts.map((a) => (
              <div key={a.id} className={`bg-card-2 border-[3px] rounded-[10px] p-3 shadow-[3px_3px_0_var(--color-outline)] ${a.now < 0 ? "border-bad" : "border-outline"}`}>
                <div className="text-sm font-extrabold uppercase text-muted truncate"><Icon name="bank" size={20} /> {a.name}</div>
                <div className={`font-display text-3xl tracking-wide ${a.now < 0 ? "text-bad" : "text-gold"}`}>{money(a.now)}</div>
                <div className="text-base text-muted">
                  {a.inflow || a.outflow ? `+${money(a.inflow)} in · −${money(a.outflow)} out since ${cash.asOf}` : `As of ${cash.asOf}`}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Cash on hand now" value={money(cash.now)} hint={`All accounts: ${money(cash.start)} on ${cash.asOf} + ${money(cash.inflow)} in − ${money(cash.outflow)} out`} tone={cash.now >= 0 ? "gold" : "bad"} />
            <Stat
              label="Runway"
              value={health.runwayMonths == null ? "–" : `${health.runwayMonths.toFixed(1)} mo`}
              hint={`If income stopped today (bills ${money(health.burn)}/mo)`}
              tone={health.runwayMonths == null ? undefined : health.runwayMonths >= health.bufferMonths ? "good" : health.runwayMonths >= 1 ? "gold" : "bad"}
            />
            <Stat label="Projected month-end" value={money(cash.monthEnd)} hint="Now + retainers due − bills left" tone={cash.monthEnd >= 0 ? "good" : "bad"} />
            <Stat label="Bills left this month" value={money(cash.unpaidThisMonth)} hint={`${money(cash.incomingThisMonth)} retainers still coming`} tone={cash.unpaidThisMonth ? "bad" : undefined} />
          </div>

          <div>
            <div className="flex justify-between flex-wrap gap-2 text-lg font-bold mb-1.5">
              <span><Icon name="shield" size={20} /> Safety buffer: {health.bufferMonths} months of bills</span>
              <span className={cash.now >= health.bufferTarget ? "text-good" : "text-gold"}>
                {money(Math.max(cash.now, 0))} / {money(health.bufferTarget)}
              </span>
            </div>
            <Bar pct={health.bufferTarget ? Math.max(cash.now, 0) / health.bufferTarget : 0} tone={cash.now >= health.bufferTarget ? "good" : "gold"} />
            <p className="text-base text-muted mt-1">
              {cash.now >= health.bufferTarget ? "Buffer full. Extra cash can go to growth." : `${money(health.bufferTarget - Math.max(cash.now, 0))} more to a full buffer.`}{" "}
              <BufferPicker />
            </p>
          </div>

          <div>
            <div className="font-display text-xl tracking-wide mb-2">Next {forecast.length} months</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {forecast.map((f, i) => (
                <div key={f.month} className={`bg-card-2 border-[3px] rounded-[10px] p-3 shadow-[3px_3px_0_var(--color-outline)] ${f.end < 0 ? "border-bad" : "border-outline"}`}>
                  <div className="text-sm font-extrabold uppercase text-muted">{monthName(f.month)}{i === 0 && " (now)"}</div>
                  <div className={`font-display text-2xl tracking-wide ${f.end < 0 ? "text-bad" : f.end < health.burn ? "text-gold" : "text-good"}`}>{money(f.end)}</div>
                  <div className="text-base text-muted">+{money(f.income)} in · −{money(f.bills)} bills</div>
                </div>
              ))}
            </div>
            <p className="text-base text-muted mt-2">Month-end cash if retainers land and only regular bills go out. Closed deals add on top.</p>
          </div>

          {cash.moves.length > 0 && <Moves moves={cash.moves} asOf={cash.asOf!} />}

          {history.length > 0 && <History />}
        </div>
      )}
    </Card>
  );
}

function BufferPicker() {
  const { data, update } = useTracker();
  return (
    <select
      className="ml-1 text-base"
      value={data.settings.cashBufferMonths ?? 3}
      onChange={(e) => update((d) => void (d.settings.cashBufferMonths = Number(e.target.value)))}
      aria-label="Buffer months"
    >
      {[1, 2, 3, 6, 12].map((n) => (
        <option key={n} value={n}>
          Target {n} month{n > 1 ? "s" : ""}
        </option>
      ))}
    </select>
  );
}

function BalanceForm({ onDone }: { onDone: () => void }) {
  const { data, update, today } = useTracker();
  const now = cashPosition(data, today);
  // Prefill with what the app thinks each account holds today, so only the ones that differ need typing.
  const initial = now.set ? now.accounts.map((a) => ({ id: a.id, name: a.name, balance: Math.round(a.now) })) : cashAccounts(data).length ? cashAccounts(data) : [{ id: uid("cash"), name: "Bank", balance: 0 }];
  const [rows, setRows] = useState(initial.map((a) => ({ ...a, text: a.balance ? String(a.balance) : "" })));
  const [date, setDate] = useState(today);
  const num = (t: string) => parseAmount(t) || 0;
  const total = rows.reduce((a, r) => a + num(r.text), 0);

  const save = () => {
    const accounts = rows.filter((r) => r.name.trim()).map((r) => ({ id: r.id, name: r.name.trim(), balance: num(r.text) }));
    update((d) => {
      Object.assign(d.settings, recordBalance(d, accounts, date));
    });
    onDone();
  };

  return (
    <form
      className="mb-5 bg-card-2 border-[3px] border-outline rounded-[10px] p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <p className="text-lg">Check each account and fix any number that&apos;s off. Do this about once a week; in between, the app moves money in and out as you collect and pay.</p>
      {rows.map((r, i) => (
        <div key={r.id} className="flex gap-2 items-center">
          <input className="w-40" value={r.name} placeholder="Bank, e-wallet…" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Account name" />
          <input
            inputMode="decimal"
            className="flex-1 min-w-0 text-xl tabular-nums"
            value={r.text}
            placeholder="Amount"
            autoFocus={i === 0}
            onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
            aria-label={`${r.name} balance`}
          />
          {rows.length > 1 && (
            <button type="button" className="text-muted text-xl px-2" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Remove account">
              ✕
            </button>
          )}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Btn type="button" onClick={() => setRows([...rows, { id: uid("cash"), name: "", balance: 0, text: "" }])}>
          + Add account
        </Btn>
        <label className="flex items-center gap-2 text-base text-muted">
          As of
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="font-display text-2xl tracking-wide">Total {money(total)}</div>
        <Btn kind="primary">Save balance</Btn>
      </div>
    </form>
  );
}

function History() {
  const { data } = useTracker();
  const history = data.settings.cashHistory ?? [];
  const recent = [...history].reverse().slice(0, 6);
  const pts = history.slice(-12);
  const max = Math.max(...pts.map((h) => h.balance), 1);
  const min = Math.min(...pts.map((h) => h.balance), 0);
  const W = 300;
  const H = 70;
  const path = pts.map((h, i) => `${i ? "L" : "M"}${pts.length > 1 ? (i / (pts.length - 1)) * W : W / 2},${H - ((h.balance - min) / (max - min || 1)) * H}`).join(" ");

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <div className="font-display text-xl tracking-wide mb-2">Balance trend</div>
        {pts.length > 1 ? (
          <svg viewBox={`-6 -6 ${W + 12} ${H + 12}`} className="w-full h-24" aria-label="Balance over time">
            <path d={path} fill="none" stroke="var(--color-gold)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((h, i) => (
              <circle key={h.date} cx={pts.length > 1 ? (i / (pts.length - 1)) * W : W / 2} cy={H - ((h.balance - min) / (max - min || 1)) * H} r="5" fill="var(--color-gold)" stroke="#0b0a14" strokeWidth="2" />
            ))}
          </svg>
        ) : (
          <p className="text-base text-muted">The trend line appears after your next balance update.</p>
        )}
      </div>
      <div>
        <div className="font-display text-xl tracking-wide mb-2">Check-ins</div>
        <ul className="space-y-1.5 text-base">
          {recent.map((h) => {
            const gap = h.predicted != null ? h.balance - h.predicted : null;
            return (
              <li key={h.date} className="flex justify-between gap-2 flex-wrap">
                <span className="text-muted">{h.date}</span>
                <span className="font-bold tabular-nums">{money(h.balance)}</span>
                {gap != null && Math.abs(gap) >= 500 && (
                  <span className={gap < 0 ? "text-bad" : "text-good"} title="Difference from what the app expected">
                    {gap < 0 ? `${money(-gap)} untracked spending` : `${money(gap)} untracked income`}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function TransferForm({ onDone }: { onDone: () => void }) {
  const { data, update, today } = useTracker();
  const accts = cashAccounts(data);
  const [from, setFrom] = useState(accts[1]?.id ?? accts[0]?.id);
  const [to, setTo] = useState(accts[0]?.id);
  const [text, setText] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const amount = parseAmount(text) || 0;
  const ok = amount > 0 && from !== to;
  return (
    <form
      className="mb-5 bg-card-2 border-[3px] border-outline rounded-[10px] p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        update((d) => void (d.transfers = [...(d.transfers ?? []), { id: uid("xfer"), date, from: from!, to: to!, amount, ...(note.trim() && { note: note.trim() }) }]));
        onDone();
      }}
    >
      <p className="text-lg">Moved money between your own accounts (e.g. a payout from a payment gateway to the bank)? It doesn&apos;t change your total.</p>
      <div className="flex flex-wrap items-center gap-2 text-base font-bold">
        From <AccountSelect value={from} onChange={setFrom} label="From account" />
        to <AccountSelect value={to} onChange={setTo} label="To account" />
        <input inputMode="decimal" className="w-36 text-lg tabular-nums" value={text} placeholder="Amount" onChange={(e) => setText(e.target.value)} aria-label="Amount" />
        <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} aria-label="Date" />
        <input className="flex-1 min-w-32 font-normal" value={note} placeholder="Note (optional)" onChange={(e) => setNote(e.target.value)} />
      </div>
      {from === to && <p className="text-base text-bad font-bold">Pick two different accounts.</p>}
      <Btn kind="primary" disabled={!ok}>Move {amount > 0 ? money(amount) : "money"}</Btn>
    </form>
  );
}

const KIND_ICON: Record<CashFlow["kind"], string> = { stream: "💰", deal: "🐉", bill: "🧾", spend: "🧾", ads: "📣", transfer: "⇄" };

/** Points a money move at a different account. */
function moveTo(d: TrackerData, key: string, accountId: string, date: string) {
  const [kind, a, b] = key.split(":");
  if (kind === "stream") d.streamMonths[a][b].accountId = accountId;
  if (kind === "pay") for (const deal of d.deals) for (const p of deal.payments) if (p.id === a) p.accountId = accountId;
  if (kind === "spend") d.adHocExpenses.find((e) => e.id === a)!.accountId = accountId;
  if (kind === "spend" || kind === "bill" || kind === "billpay") d.settings.lastPayAccountId = accountId;
  if (kind === "billpay") for (const byBill of Object.values(d.billPayments ?? {})) for (const pays of Object.values(byBill)) for (const p of pays) if (p.id === a) p.accountId = accountId;
  if (kind === "bill") {
    const from = ((d.expensePaidFrom ??= {})[a] ??= {});
    from[b] = { date: from[b]?.date ?? date, accountId };
  }
}

function Moves({ moves, asOf }: { moves: (CashFlow & { account: string })[]; asOf: string }) {
  const { update } = useTracker();
  const [all, setAll] = useState(false);
  const shown = all ? moves : moves.slice(0, 8);
  const movable = (key: string) => /^(stream|pay|spend|bill|billpay):/.test(key);
  return (
    <div>
      <div className="font-display text-xl tracking-wide mb-2">Money moves since {asOf}</div>
      <ul className="divide-y divide-line text-base">
        {shown.map((f) => (
          <li key={f.key} className="flex items-center gap-2 py-1.5 flex-wrap">
            <span className="text-muted w-24 shrink-0">{f.date}</span>
            <Glyph value={KIND_ICON[f.kind]} size={20} />
            <span className="flex-1 min-w-32 font-semibold">{f.label}</span>
            {movable(f.key) ? (
              <AccountSelect className="text-sm py-0.5" value={f.account} label={f.amount > 0 ? "Went into" : "Paid from"} onChange={(id) => update((d) => moveTo(d, f.key, id, f.date))} />
            ) : (
              <AccountName id={f.account} />
            )}
            <span className={`tabular-nums font-bold w-28 text-right ${f.amount > 0 ? "text-good" : "text-bad"}`}>
              {f.amount > 0 ? "+" : "−"}
              {money(Math.abs(f.amount))}
            </span>
          </li>
        ))}
      </ul>
      {moves.length > 8 && (
        <button className="text-base text-muted underline mt-1" onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `Show all ${moves.length}`}
        </button>
      )}
    </div>
  );
}

function AccountName({ id }: { id: string }) {
  const { data } = useTracker();
  return <span className="text-sm text-muted">{cashAccounts(data).find((a) => a.id === id)?.name}</span>;
}
