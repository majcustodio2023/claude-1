"use client";

import { useState } from "react";
import { cashAccounts, defaultAccountId, money, parseAmount } from "@/lib/finance";
import type { TrackerData } from "@/lib/types";
import { useTracker } from "./App";
import { Btn } from "./ui";

/** Picks one of the cash accounts set up in the War chest. Shows nothing until there are accounts. */
export function AccountSelect({ value, onChange, className = "", label }: { value?: string; onChange: (id: string) => void; className?: string; label: string }) {
  const { data } = useTracker();
  const accts = cashAccounts(data);
  if (!accts.length) return null;
  const current = accts.find((a) => a.id === value)?.id ?? accts[0].id;
  return (
    <select className={className} value={current} onChange={(e) => onChange(e.target.value)} aria-label={label} title={label}>
      {accts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}

export const accountName = (data: TrackerData, id?: string) => {
  const accts = cashAccounts(data);
  return (accts.find((a) => a.id === id) ?? accts[0])?.name;
};

export interface Collection {
  amount: number;
  date: string;
  accountId?: string;
  note?: string;
  /** The balance entered on this same day already includes this money. */
  alreadyCounted: boolean;
}

/**
 * "Where did the money land?" form used when collecting a retainer or a deal
 * payment: amount, date and the account it goes into.
 */
export function CollectForm({ amount, date, withNote, cta, onCollect, onCancel }: { amount?: number; date: string; withNote?: boolean; cta: string; onCollect: (c: Collection) => void; onCancel: () => void }) {
  const { data } = useTracker();
  const [text, setText] = useState(amount ? String(amount) : "");
  const [day, setDay] = useState(date);
  const [accountId, setAccountId] = useState(defaultAccountId(data));
  const [note, setNote] = useState("");
  const [counted, setCounted] = useState(false);
  const hasAccounts = cashAccounts(data).length > 0;
  const asOf = data.settings.cashAsOf;
  const value = parseAmount(text) || 0;
  const name = accountName(data, accountId);

  return (
    <form
      className="w-full bg-card-2 border-[3px] border-outline rounded-[10px] p-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value <= 0) return;
        onCollect({ amount: value, date: day, accountId: hasAccounts ? accountId : undefined, note: note.trim() || undefined, alreadyCounted: counted && day === asOf });
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <input inputMode="decimal" className="w-36 text-lg tabular-nums" value={text} placeholder="Amount" autoFocus onChange={(e) => setText(e.target.value)} aria-label="Amount" />
        <input type="date" value={day} onChange={(e) => setDay(e.target.value || date)} aria-label="Date received" />
        {hasAccounts && (
          <label className="flex items-center gap-2 text-base font-bold">
            into
            <AccountSelect value={accountId} onChange={setAccountId} label="Account it went into" />
          </label>
        )}
        {withNote && <input className="flex-1 min-w-28" placeholder="Note (deposit, balance…)" value={note} onChange={(e) => setNote(e.target.value)} />}
      </div>
      {hasAccounts && asOf && day === asOf && (
        <label className="flex items-center gap-2 text-base text-muted">
          <input type="checkbox" checked={counted} onChange={(e) => setCounted(e.target.checked)} />
          Already in the {name} balance I entered on {asOf}
        </label>
      )}
      {hasAccounts && asOf && day < asOf && <p className="text-base text-muted">Dated before your last balance update ({asOf}), so it&apos;s already in that balance and won&apos;t be added twice.</p>}
      {!hasAccounts && <p className="text-base text-muted">Tip: add your bank and e-wallets in the War chest on HQ to track which account the money lands in.</p>}
      <div className="flex gap-2">
        <Btn kind="primary" disabled={value <= 0}>
          {cta} {value > 0 ? money(value) : ""}
          {hasAccounts && name ? ` → ${name}` : ""}
        </Btn>
        <Btn type="button" onClick={onCancel}>
          Cancel
        </Btn>
      </div>
    </form>
  );
}

/** Marks a money move as already included in the balance entered on its day. */
export function settle(d: TrackerData, key: string) {
  d.settings.cashSettled = [...(d.settings.cashSettled ?? []).filter((k) => k !== key), key];
}
