"use client";

import { useState } from "react";
import { dealBalance, dealPaid, uid } from "@/lib/finance";
import type { Deal, DealStage } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Btn, Card, NumInput, TextInput, peso } from "../ui";

const STAGES: [DealStage, string][] = [
  ["lead", "Lead"],
  ["proposal", "Proposal sent"],
  ["negotiating", "Negotiating"],
  ["won", "Closed / won"],
  ["lost", "Lost"],
];

export default function Pipeline() {
  const { data, update, today } = useTracker();
  const [form, setForm] = useState({ name: "", value: undefined as number | undefined });

  const open = data.deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const won = data.deals.filter((d) => d.stage === "won");
  const lost = data.deals.filter((d) => d.stage === "lost");

  return (
    <div className="space-y-4">
      <Card title="Add an upcoming deal or receivable">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name || !form.value) return;
            update((d) => void d.deals.push({ id: uid("deal"), name: form.name, value: form.value!, stage: "lead", payments: [], createdAt: today }));
            setForm({ name: "", value: undefined });
          }}
        >
          <input className="flex-1 min-w-48" placeholder="Project or client" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <NumInput className="w-36" placeholder="Deal value" value={form.value} onChange={(v) => setForm({ ...form, value: v })} />
          <Btn kind="primary">Add deal</Btn>
        </form>
      </Card>

      <Section title={`Open pipeline · ${peso(open.reduce((a, d) => a + d.value, 0))}`} deals={open} />
      <Section title={`Closed · ${peso(won.reduce((a, d) => a + dealPaid(d), 0))} collected, ${peso(won.reduce((a, d) => a + dealBalance(d), 0))} to collect`} deals={won} />
      {lost.length > 0 && <Section title="Lost" deals={lost} />}
    </div>
  );
}

function Section({ title, deals }: { title: string; deals: Deal[] }) {
  if (!deals.length) return null;
  return (
    <Card title={title}>
      <div className="grid md:grid-cols-2 gap-3">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
    </Card>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const { update, today } = useTracker();
  const [pay, setPay] = useState({ amount: undefined as number | undefined, date: today, note: "" });
  const [showPay, setShowPay] = useState(false);
  const paid = dealPaid(deal);
  const balance = dealBalance(deal);
  const set = (patch: Partial<Deal>) => update((d) => void Object.assign(d.deals.find((x) => x.id === deal.id)!, patch));
  const addPayment = (amount: number, date: string, note?: string) =>
    update((d) => {
      const x = d.deals.find((y) => y.id === deal.id)!;
      x.payments.push({ id: uid("pay"), amount, date, note });
      if (x.stage !== "won") x.stage = "won";
    });

  return (
    <div className="border border-line rounded-xl p-3 space-y-3">
      <div className="flex items-start gap-2">
        <TextInput className="flex-1 font-medium" value={deal.name} onChange={(v) => set({ name: v })} />
        <select value={deal.stage} onChange={(e) => set({ stage: e.target.value as DealStage })}>
          {STAGES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3 flex-wrap text-sm">
        <label className="flex items-center gap-1 text-muted">
          Value <NumInput className="w-32" value={deal.value} onChange={(v) => set({ value: v ?? 0 })} />
        </label>
        <label className="flex items-center gap-1 text-muted">
          Expected close <input type="date" value={deal.expectedClose ?? ""} onChange={(e) => set({ expectedClose: e.target.value || undefined })} />
        </label>
      </div>
      {deal.stage === "won" && (
        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>Collected {peso(paid)}</span>
            <span>{balance > 0 ? `${peso(balance)} left` : <Badge tone="good">Fully paid</Badge>}</span>
          </div>
          <div className="h-2 rounded-full bg-line overflow-hidden">
            <div className="h-full bg-good" style={{ width: `${deal.value ? Math.min(paid / deal.value, 1) * 100 : 0}%` }} />
          </div>
        </div>
      )}
      {deal.payments.length > 0 && (
        <ul className="text-xs space-y-1">
          {deal.payments.map((p) => (
            <li key={p.id} className="flex gap-2">
              <span className="text-muted w-20">{p.date}</span>
              <span className="flex-1">{p.note || "Payment"}</span>
              <span className="tabular-nums">{peso(p.amount)}</span>
              <button className="text-muted" onClick={() => update((d) => void (d.deals.find((x) => x.id === deal.id)!.payments = deal.payments.filter((y) => y.id !== p.id)))}>✕</button>
            </li>
          ))}
        </ul>
      )}
      <TextInput className="w-full text-xs" value={deal.notes} onChange={(v) => set({ notes: v })} placeholder="Notes" />
      <div className="flex gap-2 flex-wrap">
        {balance > 0 && deal.stage !== "lost" && (
          <Btn kind="primary" onClick={() => addPayment(balance, today, paid ? "Balance" : "Full payment")}>
            {paid ? `Collect balance ${peso(balance)}` : `Closed & collected ${peso(balance)}`}
          </Btn>
        )}
        {deal.stage !== "lost" && <Btn onClick={() => setShowPay(!showPay)}>Record deposit / payment</Btn>}
        <Btn kind="danger" onClick={() => confirm(`Delete ${deal.name}?`) && update((d) => void (d.deals = d.deals.filter((x) => x.id !== deal.id)))}>
          Delete
        </Btn>
      </div>
      {showPay && (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!pay.amount) return;
            addPayment(pay.amount, pay.date, pay.note || "Deposit");
            setPay({ amount: undefined, date: today, note: "" });
            setShowPay(false);
          }}
        >
          <NumInput className="w-28" placeholder="Amount" value={pay.amount} onChange={(v) => setPay({ ...pay, amount: v })} />
          <input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} />
          <input className="flex-1 min-w-24" placeholder="Note" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} />
          <Btn kind="primary">Save</Btn>
        </form>
      )}
    </div>
  );
}
