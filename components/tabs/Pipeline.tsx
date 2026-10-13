"use client";

import { useState } from "react";
import { dealBalance, dealPaid, defaultAccountId, uid } from "@/lib/finance";
import type { Deal, DealStage } from "@/lib/types";
import { useTracker } from "../App";
import { clientForDeal, makeClientFromDeal, renameClient } from "@/lib/clients";
import { Bar, Btn, Card, NumInput, TextInput, celebrate, money } from "../ui";
import { AccountSelect, CollectForm, accountName, settle, type Collection } from "../Money";
import { HELP } from "../help";

const STAGES: [DealStage, string][] = [
  ["lead", "Lead"],
  ["proposal", "Proposal sent"],
  ["negotiating", "Negotiating"],
  ["won", "Closed / won"],
  ["lost", "Lost"],
];

export default function Pipeline() {
  const { data, update, today } = useTracker();
  const [form, setForm] = useState({ name: "", value: undefined as number | undefined, kind: "lead" as "lead" | "due" | "paid" });

  const open = data.deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const won = data.deals.filter((d) => d.stage === "won");
  const lost = data.deals.filter((d) => d.stage === "lost");

  return (
    <div className="space-y-4">
      <Card help={HELP.newDeal} title="Spawn a new boss (deal or receivable)" icon="⚔" glow="hero">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name || !form.value) return;
            update((d) =>
              void d.deals.push({
                id: uid("deal"),
                name: form.name,
                value: form.value!,
                stage: form.kind === "lead" ? "lead" : "won",
                payments: form.kind === "paid" ? [{ id: uid("pay"), date: today, amount: form.value!, accountId: defaultAccountId(d) }] : [],
                createdAt: today,
              }),
            );
            setForm({ name: "", value: undefined, kind: form.kind });
          }}
        >
          <input className="flex-1 min-w-48" placeholder="Project or client" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <NumInput className="w-36" placeholder="Amount" value={form.value} onChange={(v) => setForm({ ...form, value: v })} />
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })} aria-label="Status">
            <option value="lead">Still a lead</option>
            <option value="due">Closed, to collect</option>
            <option value="paid">Already collected</option>
          </select>
          <Btn kind="primary">Add</Btn>
        </form>
      </Card>

      <Section title={`Bosses in the field · ${money(open.reduce((a, d) => a + d.value, 0))}`} deals={open} />
      <Section title={`Closed · ${money(won.reduce((a, d) => a + dealPaid(d), 0))} collected, ${money(won.reduce((a, d) => a + dealBalance(d), 0))} to collect`} deals={won} />
      {lost.length > 0 && <Section title="Lost" deals={lost} />}
    </div>
  );
}

function Section({ title, deals }: { title: string; deals: Deal[] }) {
  if (!deals.length) return null;
  return (
    <Card title={title} icon="◆" help={HELP.deals}>
      <div className="grid md:grid-cols-2 gap-3">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
    </Card>
  );
}

export function DealCard({ deal }: { deal: Deal }) {
  const { data, update, today } = useTracker();
  const [collecting, setCollecting] = useState<"full" | "deposit" | null>(null);
  const paid = dealPaid(deal);
  const balance = dealBalance(deal);
  const set = (patch: Partial<Deal>) => update((d) => void Object.assign(d.deals.find((x) => x.id === deal.id)!, patch));
  const addPayment = ({ amount, date, note, accountId, alreadyCounted }: Collection) => {
    const id = uid("pay");
    update((d) => {
      const x = d.deals.find((y) => y.id === deal.id)!;
      x.payments.push({ id, amount, date, note, ...(accountId && { accountId }) });
      if (x.stage !== "won") x.stage = "won";
      if (accountId) d.settings.lastAccountId = accountId;
      if (alreadyCounted) settle(d, `pay:${id}`);
    });
    setCollecting(null);
    const where = accountId ? ` → ${accountName(data, accountId)}` : "";
    const defeated = amount >= balance;
    celebrate({
      kicker: defeated ? "Boss defeated" : "Critical hit",
      title: `+${money(amount)} collected`,
      sub: (defeated ? `${deal.name} is fully paid.` : `${deal.name}: ${money(balance - amount)} HP left`) + where,
      icon: defeated ? "🐉" : "💥",
      sfx: defeated ? "BOSS DOWN!" : "WHAM!",
    });
  };
  const hp = deal.stage === "lost" ? 0 : deal.value ? balance / deal.value : 0;
  const client = clientForDeal(data, deal.id);

  return (
    <div className={`border rounded-[3px] p-3.5 space-y-3 ${deal.stage === "won" && balance === 0 ? "border-gold/50 bg-gold/5" : "border-line bg-card-2/50"}`}>
      <div>
        <div className="flex justify-between text-sm uppercase tracking-[0.12em] mb-1">
          <span className="text-muted">{deal.stage === "won" && balance === 0 ? "Defeated" : deal.stage === "lost" ? "Escaped" : "Boss HP"}</span>
          <span className={`font-display ${balance === 0 ? "text-gold" : "text-bad"}`}>{money(balance)} / {money(deal.value)}</span>
        </div>
        <Bar pct={hp} tone={balance === 0 ? "gold" : "bad"} thin />
      </div>
      <div className="flex items-start gap-2">
        <TextInput className="flex-1 font-medium" value={deal.name} onChange={(v) => (client ? update((d) => renameClient(d, client.id, v)) : set({ name: v }))} />
        <select value={deal.stage} onChange={(e) => set({ stage: e.target.value as DealStage })}>
          {STAGES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      {client ? (
        <div className="text-sm text-muted">🗂️ Client project: tasks and team pay are in the Clients tab.</div>
      ) : (
        deal.stage === "won" && (
          <button className="text-sm underline text-muted" onClick={() => update((d) => makeClientFromDeal(d, deal.id, today))}>
            + Track as a client (tasks, team pay)
          </button>
        )
      )}
      <div className="flex items-center gap-3 flex-wrap text-sm">
        <label className="flex items-center gap-1 text-muted">
          Value <NumInput className="w-32" value={deal.value} onChange={(v) => set({ value: v ?? 0 })} />
        </label>
        <label className="flex items-center gap-1 text-muted">
          Expected close <input type="date" value={deal.expectedClose ?? ""} onChange={(e) => set({ expectedClose: e.target.value || undefined })} />
        </label>
      </div>
      {deal.payments.length > 0 && (
        <ul className="text-sm space-y-1">
          {deal.payments.map((p) => (
            <li key={p.id} className="flex gap-2">
              <span className="text-muted w-20">{p.date}</span>
              <span className="flex-1">{p.note || "Payment"}</span>
              <AccountSelect className="text-sm py-0.5" value={p.accountId} label="Account it went into" onChange={(id) => update((d) => void (d.deals.find((x) => x.id === deal.id)!.payments.find((y) => y.id === p.id)!.accountId = id))} />
              <span className="tabular-nums">{money(p.amount)}</span>
              <button className="text-muted" onClick={() => update((d) => void (d.deals.find((x) => x.id === deal.id)!.payments = deal.payments.filter((y) => y.id !== p.id)))}>✕</button>
            </li>
          ))}
        </ul>
      )}
      <TextInput className="w-full text-sm" value={deal.notes} onChange={(v) => set({ notes: v })} placeholder="Notes" />
      {collecting ? (
        <CollectForm
          amount={collecting === "full" ? balance : undefined}
          date={today}
          withNote={collecting === "deposit"}
          cta={collecting === "full" ? "Collect" : "Record"}
          onCancel={() => setCollecting(null)}
          onCollect={(c) => addPayment({ ...c, note: c.note ?? (collecting === "full" ? (paid ? "Balance" : "Full payment") : "Deposit") })}
        />
      ) : (
        <div className="flex gap-2 flex-wrap">
          {balance > 0 && deal.stage !== "lost" && (
            <Btn kind="hero" onClick={() => setCollecting("full")}>
              {paid ? `Finish it · collect ${money(balance)}` : `Closed & collected ${money(balance)}`}
            </Btn>
          )}
          {deal.stage !== "lost" && balance > 0 && <Btn onClick={() => setCollecting("deposit")}>Record deposit</Btn>}
          <Btn kind="danger" onClick={() => confirm(client ? `Delete this project deal? ${client.name} stays in Clients (delete it there to remove everything).` : `Delete ${deal.name}?`) &&
              update((d) => {
                d.deals = d.deals.filter((x) => x.id !== deal.id);
                const c = d.clients?.find((x) => x.dealId === deal.id);
                if (c) delete c.dealId;
              })}>
            Delete
          </Btn>
        </div>
      )}
    </div>
  );
}
