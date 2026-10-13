"use client";

import { useMemo, useState } from "react";
import { cashForecast, cashHealth, cashPosition, recordBalance, uid } from "@/lib/finance";
import { useTracker } from "./App";
import { Badge, Bar, Btn, Card, Stat, peso } from "./ui";

const monthName = (m: string) => new Date(m + "-01T00:00:00").toLocaleDateString("en-PH", { month: "short", year: "numeric" });

export default function WarChest() {
  const { data, update, today } = useTracker();
  const cash = useMemo(() => cashPosition(data, today), [data, today]);
  const health = useMemo(() => cashHealth(data, today), [data, today]);
  const forecast = useMemo(() => cashForecast(data, today, 4), [data, today]);
  const [editing, setEditing] = useState(false);
  const history = data.settings.cashHistory ?? [];
  const stale = health.daysSinceUpdate != null && health.daysSinceUpdate >= 7;

  return (
    <Card
      title="War chest"
      icon="💰"
      glow="gold"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {stale && <Badge tone="warn">Updated {health.daysSinceUpdate} days ago</Badge>}
          <Btn kind="primary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close" : "🏦 Update balance"}
          </Btn>
        </div>
      }
    >
      {editing && <BalanceForm onDone={() => setEditing(false)} />}

      {!cash.set ? (
        !editing && <p className="text-lg text-muted">Press &quot;Update balance&quot; and enter what&apos;s in your bank and e-wallets today.</p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Cash on hand now" value={peso(cash.now)} hint={`${peso(cash.start)} on ${cash.asOf} + ${peso(cash.inflow)} in − ${peso(cash.outflow)} out`} tone={cash.now >= 0 ? "gold" : "bad"} />
            <Stat
              label="Runway"
              value={health.runwayMonths == null ? "–" : `${health.runwayMonths.toFixed(1)} mo`}
              hint={`If income stopped today (bills ${peso(health.burn)}/mo)`}
              tone={health.runwayMonths == null ? undefined : health.runwayMonths >= health.bufferMonths ? "good" : health.runwayMonths >= 1 ? "gold" : "bad"}
            />
            <Stat label="Projected month-end" value={peso(cash.monthEnd)} hint="Now + retainers due − bills left" tone={cash.monthEnd >= 0 ? "good" : "bad"} />
            <Stat label="Bills left this month" value={peso(cash.unpaidThisMonth)} hint={`${peso(cash.incomingThisMonth)} retainers still coming`} tone={cash.unpaidThisMonth ? "bad" : undefined} />
          </div>

          <div>
            <div className="flex justify-between flex-wrap gap-2 text-lg font-bold mb-1.5">
              <span>🛡️ Safety buffer: {health.bufferMonths} months of bills</span>
              <span className={cash.now >= health.bufferTarget ? "text-good" : "text-gold"}>
                {peso(Math.max(cash.now, 0))} / {peso(health.bufferTarget)}
              </span>
            </div>
            <Bar pct={health.bufferTarget ? Math.max(cash.now, 0) / health.bufferTarget : 0} tone={cash.now >= health.bufferTarget ? "good" : "gold"} />
            <p className="text-base text-muted mt-1">
              {cash.now >= health.bufferTarget ? "Buffer full. Extra cash can go to growth." : `${peso(health.bufferTarget - Math.max(cash.now, 0))} more to a full buffer.`}{" "}
              <BufferPicker />
            </p>
          </div>

          <div>
            <div className="font-display text-xl tracking-wide mb-2">Next {forecast.length} months</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {forecast.map((f, i) => (
                <div key={f.month} className={`bg-card-2 border-[3px] rounded-[10px] p-3 shadow-[3px_3px_0_#0b0a14] ${f.end < 0 ? "border-bad" : "border-outline"}`}>
                  <div className="text-sm font-extrabold uppercase text-muted">{monthName(f.month)}{i === 0 && " (now)"}</div>
                  <div className={`font-display text-2xl tracking-wide ${f.end < 0 ? "text-bad" : f.end < health.burn ? "text-gold" : "text-good"}`}>{peso(f.end)}</div>
                  <div className="text-base text-muted">+{peso(f.income)} in · −{peso(f.bills)} bills</div>
                </div>
              ))}
            </div>
            <p className="text-base text-muted mt-2">Month-end cash if retainers land and only regular bills go out. Closed deals add on top.</p>
          </div>

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
  const initial = data.settings.cashAccounts?.length
    ? data.settings.cashAccounts
    : [{ id: uid("cash"), name: "Bank", balance: data.settings.cashBalance ?? 0 }];
  const [rows, setRows] = useState(initial.map((a) => ({ ...a, text: a.balance ? String(a.balance) : "" })));
  const [date, setDate] = useState(today);
  const num = (t: string) => Number(t.replace(/[₱,\s]/g, "")) || 0;
  const total = rows.reduce((a, r) => a + num(r.text), 0);

  const save = () => {
    const accounts = rows.filter((r) => r.name.trim()).map((r) => ({ id: r.id, name: r.name.trim(), balance: num(r.text) }));
    update((d) => {
      Object.assign(d.settings, recordBalance(d, total, date), { cashAccounts: accounts });
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
      <p className="text-lg">Enter what&apos;s in each account right now. Do this about once a week; the app tracks everything in between.</p>
      {rows.map((r, i) => (
        <div key={r.id} className="flex gap-2 items-center">
          <input className="w-40" value={r.name} placeholder="Bank, GCash…" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Account name" />
          <input
            inputMode="decimal"
            className="flex-1 min-w-0 text-xl tabular-nums"
            value={r.text}
            placeholder="₱ amount"
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
        <div className="font-display text-2xl tracking-wide">Total {peso(total)}</div>
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
                <span className="font-bold tabular-nums">{peso(h.balance)}</span>
                {gap != null && Math.abs(gap) >= 500 && (
                  <span className={gap < 0 ? "text-bad" : "text-good"} title="Difference from what the app expected">
                    {gap < 0 ? `${peso(-gap)} untracked spending` : `${peso(gap)} untracked income`}
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
