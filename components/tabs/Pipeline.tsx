"use client";

import { useState } from "react";
import { dealBalance, dealPaid, defaultAccountId, monthOf, uid } from "@/lib/finance";
import type { Contact, Deal, DealStage } from "@/lib/types";
import { ContactChips, ContactFields } from "../Contact";
import { useTracker } from "../App";
import { clientForDeal, closeDeal, makeClientFromDeal, renameClient } from "@/lib/clients";
import { DayField } from "../StreamSettings";
import { ordinal } from "@/lib/calendar";
import { Badge, Bar, Btn, Card, NumInput, TextInput, celebrate, money } from "../ui";
import { AvatarButton } from "../AvatarPicker";
import { EditButton, SaveButton } from "../editable";
import { AccountSelect, CollectForm, accountName, settle, type Collection } from "../Money";
import { HELP } from "../help";
import { Icon } from "../icons";
import FallenCard from "../Fallen";
import { failDeal, setDealStage } from "@/lib/fallen";

const STAGES: [DealStage, string][] = [
  ["lead", "Lead"],
  ["proposal", "Proposal sent"],
  ["negotiating", "Negotiating"],
  ["won", "Closed / won"],
  ["lost", "Failed"],
];

export default function Pipeline() {
  const { data, update, today } = useTracker();
  const [form, setForm] = useState({ name: "", value: undefined as number | undefined, kind: "lead" as "lead" | "due" | "paid", monthly: false, payDay: undefined as number | undefined });

  const open = data.deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const won = data.deals.filter((d) => d.stage === "won");
  const openOnce = open.filter((d) => !d.recurring).reduce((a, d) => a + d.value, 0);
  const openMonthly = open.filter((d) => d.recurring).reduce((a, d) => a + d.value, 0);
  const openTotal = [openOnce || !openMonthly ? money(openOnce) : "", openMonthly ? `${money(openMonthly)}/mo` : ""].filter(Boolean).join(" + ");

  return (
    <div className="space-y-4">
      <Card help={HELP.newDeal} title="Spawn a new boss (deal or receivable)" icon="⚔" glow="hero">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name || !form.value) return;
            const monthly = form.monthly;
            update((d) => {
              const id = uid("deal");
              d.deals.push({
                id,
                name: form.name,
                value: form.value!,
                stage: form.kind === "lead" ? "lead" : "won",
                payments: form.kind === "paid" && !monthly ? [{ id: uid("pay"), date: today, amount: form.value!, accountId: defaultAccountId(d) }] : [],
                createdAt: today,
                ...(monthly && { recurring: { kind: "fixed" as const, ...(form.payDay && { payDay: form.payDay }) } }),
              });
              if (form.kind === "lead") return;
              // Closed already: it goes straight to Clients (and to Income as monthly money for a retainer).
              const clientId = closeDeal(d, id, today);
              const streamId = d.clients?.find((c) => c.id === clientId)?.streamId;
              if (form.kind === "paid" && streamId) {
                const m = monthOf(today);
                d.streamMonths[m] = { ...(d.streamMonths[m] ?? {}), [streamId]: { collected: form.value!, collectedOn: today, accountId: defaultAccountId(d) } };
              }
            });
            setForm({ ...form, name: "", value: undefined, payDay: undefined });
          }}
        >
          <input className="flex-1 min-w-48" placeholder="Project or client" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.monthly ? "monthly" : "once"} onChange={(e) => setForm({ ...form, monthly: e.target.value === "monthly" })} aria-label="Type">
            <option value="once">One-time project</option>
            <option value="monthly">Monthly retainer</option>
          </select>
          <NumInput className="w-36" placeholder={form.monthly ? "Fee per month" : "Amount"} value={form.value} onChange={(v) => setForm({ ...form, value: v })} />
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })} aria-label="Status">
            <option value="lead">Still a lead</option>
            <option value="due">{form.monthly ? "Signed, not paid yet" : "Closed, to collect"}</option>
            <option value="paid">{form.monthly ? "Signed, paid this month" : "Already collected"}</option>
          </select>
          {form.monthly && (
            <select value={form.payDay ?? ""} onChange={(e) => setForm({ ...form, payDay: e.target.value ? Number(e.target.value) : undefined })} aria-label="Pays on day">
              <option value="">Pays on: not set</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>Pays on the {n === 31 ? "last day" : ordinal(n)}</option>
              ))}
            </select>
          )}
          <Btn kind="primary">Add</Btn>
        </form>
      </Card>

      <Section title={`Bosses in the field · ${openTotal}`} deals={open} />
      <Section title={`Closed · ${money(won.reduce((a, d) => a + dealPaid(d), 0))} collected, ${money(won.reduce((a, d) => a + dealBalance(d), 0))} to collect`} deals={won} />
      <FallenCard />
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
  const [editing, setEditing] = useState(false);
  const [failing, setFailing] = useState(false);
  const [reason, setReason] = useState("");
  const paid = dealPaid(deal);
  const balance = dealBalance(deal);
  const set = (patch: Partial<Deal>) => update((d) => void Object.assign(d.deals.find((x) => x.id === deal.id)!, patch));
  const addPayment = ({ amount, date, note, accountId, alreadyCounted }: Collection) => {
    const id = uid("pay");
    update((d) => {
      const x = d.deals.find((y) => y.id === deal.id)!;
      x.payments.push({ id, amount, date, note, ...(accountId && { accountId }) });
      if (x.stage !== "won") {
        x.stage = "won";
        closeDeal(d, deal.id, today);
      }
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
  // A client's project shares the client's contact, so it's kept in one place.
  const contact = client ? client.contact : deal.contact;
  const setContact = (c: Contact | undefined) =>
    update((d) => {
      if (client) d.clients!.find((x) => x.id === client.id)!.contact = c;
      else d.deals.find((x) => x.id === deal.id)!.contact = c;
    });

  const stageLabel = STAGES.find(([v]) => v === deal.stage)?.[1] ?? deal.stage;
  const defeated = deal.stage === "won" && balance === 0;
  const retainer = deal.recurring;
  const signUp = () => {
    update((d) => setDealStage(d, deal.id, "won", today));
    celebrate({ kicker: "Boss recruited", title: `${deal.name} is a client`, sub: `+${money(deal.value)} a month, now in Income and Clients.`, icon: "🐉", sfx: "SIGNED!" });
  };
  const setRecurring = (r: Deal["recurring"]) =>
    update((d) => {
      const x = d.deals.find((y) => y.id === deal.id)!;
      if (r) x.recurring = r;
      else delete x.recurring;
    });

  return (
    <div className={`border-[3px] rounded-[14px] p-4 space-y-3 shadow-[4px_4px_0_var(--color-outline)] ${defeated ? "border-gold bg-gold/5" : "border-outline bg-card-2/60"}`}>
      <div className="flex items-center gap-3">
        <AvatarButton value={deal.avatar} seed={deal.id} kind="monster" size={76} name={deal.name} onChange={(v) => set({ avatar: v })} />
        <div className="flex-1 min-w-0">
          <div className="font-display text-2xl tracking-wide leading-tight [overflow-wrap:anywhere]">{deal.name}</div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge tone={deal.stage === "won" ? (defeated ? "gold" : "good") : deal.stage === "lost" ? "muted" : "hero"}>{defeated ? "Defeated" : stageLabel}</Badge>
            {retainer && <Badge tone="good">Monthly retainer{retainer.payDay ? ` · pays on the ${retainer.payDay === 31 ? "last day" : ordinal(retainer.payDay)}` : ""}</Badge>}
            {deal.expectedClose && deal.stage !== "won" && <Badge>Close by {deal.expectedClose}</Badge>}
          </div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm uppercase tracking-[0.12em] mb-1">
          <span className="text-muted font-bold">{defeated ? "Defeated" : deal.stage === "lost" ? "Escaped" : retainer ? "Worth every month" : "Boss HP"}</span>
          <span className={`font-display ${balance === 0 ? "text-gold" : "text-bad"}`}>{retainer ? `${money(deal.value)}/mo` : `${money(balance)} / ${money(deal.value)}`}</span>
        </div>
        <Bar pct={hp} tone={balance === 0 ? "gold" : "bad"} thin />
      </div>
      {editing ? (
        <div className="space-y-3 bg-card-2 rounded-[10px] p-3">
          <label className="block text-sm font-extrabold uppercase text-muted">
            Name
            <TextInput className="w-full mt-1 text-lg normal-case font-bold" value={deal.name} onChange={(v) => v.trim() && (client ? update((d) => renameClient(d, client.id, v.trim())) : set({ name: v.trim() }))} />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-sm font-extrabold uppercase text-muted">
              Status
              <select value={deal.stage} onChange={(e) => update((d) => setDealStage(d, deal.id, e.target.value as DealStage, today))}>
                {STAGES.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            {deal.stage !== "won" && deal.stage !== "lost" && !deal.payments.length && (
              <label className="flex flex-col gap-1 text-sm font-extrabold uppercase text-muted">
                Type
                <select value={retainer ? "monthly" : "once"} onChange={(e) => setRecurring(e.target.value === "monthly" ? { kind: "fixed" } : undefined)}>
                  <option value="once">One-time project</option>
                  <option value="monthly">Monthly retainer</option>
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm font-extrabold uppercase text-muted">
              {retainer ? "Fee per month" : "Value"}
              <NumInput className="w-36 text-lg" value={deal.value} onChange={(v) => set({ value: v ?? 0 })} />
            </label>
            {retainer && (
              <>
                <label className="flex flex-col gap-1 text-sm font-extrabold uppercase text-muted">
                  Fee
                  <select value={retainer.kind} onChange={(e) => setRecurring({ ...retainer, kind: e.target.value as "fixed" | "variable" })}>
                    <option value="fixed">Same every month</option>
                    <option value="variable">Changes monthly (estimate)</option>
                  </select>
                </label>
                <div className="text-sm font-extrabold uppercase">
                  <DayField label="Pays on" value={retainer.payDay} onChange={(v) => setRecurring({ kind: retainer.kind, ...(v && { payDay: v }) })} />
                </div>
              </>
            )}
            <label className="flex flex-col gap-1 text-sm font-extrabold uppercase text-muted">
              Expected close
              <input type="date" value={deal.expectedClose ?? ""} onChange={(e) => set({ expectedClose: e.target.value || undefined })} />
            </label>
          </div>
          <label className="block text-sm font-extrabold uppercase text-muted">
            Notes
            <TextInput className="w-full mt-1 text-base normal-case" value={deal.notes} onChange={(v) => set({ notes: v || undefined })} placeholder="Scope, next step…" />
          </label>
          <div>
            <div className="text-sm font-extrabold uppercase text-muted mb-1">Contact{client ? ` (shared with the client ${client.name})` : ""}</div>
            <ContactFields value={contact} onChange={setContact} />
          </div>
          {deal.payments.length > 0 && (
            <ul className="text-sm space-y-1">
              {deal.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-2">
                  <span className="text-muted w-24">{p.date}</span>
                  <span className="tabular-nums font-bold">{money(p.amount)}</span>
                  <AccountSelect className="text-sm py-0.5" value={p.accountId} label="Account it went into" onChange={(id) => update((d) => void (d.deals.find((x) => x.id === deal.id)!.payments.find((y) => y.id === p.id)!.accountId = id))} />
                  <button className="text-muted ml-auto px-2" aria-label="Remove payment" onClick={() => confirm(`Remove this ${money(p.amount)} payment?`) && update((d) => void (d.deals.find((x) => x.id === deal.id)!.payments = deal.payments.filter((y) => y.id !== p.id)))}>✕</button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 flex-wrap">
            <SaveButton onClick={() => setEditing(false)} />
            <Btn kind="danger" onClick={() => confirm(client ? `Delete this project deal? ${client.name} stays in Clients (delete it there to remove everything).` : `Delete ${deal.name}?`) &&
                update((d) => {
                  d.deals = d.deals.filter((x) => x.id !== deal.id);
                  const c = d.clients?.find((x) => x.dealId === deal.id);
                  if (c) delete c.dealId;
                })}>
              Delete
            </Btn>
          </div>
        </div>
      ) : (
        <>
          {deal.payments.length > 0 && (
            <ul className="text-base space-y-1">
              {deal.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap gap-x-2">
                  <span className="font-bold tabular-nums text-good">+{money(p.amount)}</span>
                  <span>{p.note || "Payment"}</span>
                  <span className="text-muted">
                    {p.date}
                    {accountName(data, p.accountId) ? ` · into ${accountName(data, p.accountId)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {deal.notes && <p className="text-base text-muted whitespace-pre-wrap [overflow-wrap:anywhere]">{deal.notes}</p>}
          <ContactChips value={contact} />
        </>
      )}
      {client ? (
        <div className="text-sm text-muted"><Icon name="clients" size={20} /> Client project: tasks and team pay are in the Clients tab.</div>
      ) : (
        deal.stage === "won" && (
          <button className="text-sm underline text-muted" onClick={() => update((d) => makeClientFromDeal(d, deal.id, today))}>
            + Track as a client (tasks, team pay)
          </button>
        )
      )}
      {failing ? (
        <div className="bg-card-2 border-[3px] border-bad rounded-[10px] p-3 space-y-2">
          <div className="font-display text-xl tracking-wide text-bad">{deal.stage === "won" ? "The rest won't be paid?" : "Didn't close?"}</div>
          <p className="text-sm text-muted font-bold">
            {deal.stage === "won"
              ? `The ${money(balance)} still owed stops counting as money to collect.${paid ? ` The ${money(paid)} already paid still counts.` : ""}`
              : "It stops counting in your pipeline."}{" "}
            It moves to the Fallen below, and you can revive it any time.
          </p>
          <label className="block text-sm font-extrabold uppercase text-muted">
            What happened? (optional)
            <TextInput className="w-full mt-1 text-base normal-case" value={reason} onChange={setReason} placeholder={deal.stage === "won" ? "e.g. Client stopped replying" : "e.g. Went with a cheaper agency"} />
          </label>
          <div className="flex gap-2 flex-wrap">
            <Btn
              kind="danger"
              onClick={() => {
                update((d) => failDeal(d, deal.id, today, reason));
                setFailing(false);
                setReason("");
              }}
            >
              Mark as failed
            </Btn>
            <Btn onClick={() => setFailing(false)}>Cancel</Btn>
          </div>
        </div>
      ) : collecting ? (
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
          {retainer && deal.stage !== "lost" && (
            <Btn kind="hero" onClick={signUp}>
              Signed! Make them a client
            </Btn>
          )}
          {!retainer && balance > 0 && deal.stage !== "lost" && (
            <Btn kind="hero" onClick={() => setCollecting("full")}>
              {paid ? `Finish it · collect ${money(balance)}` : `Closed & collected ${money(balance)}`}
            </Btn>
          )}
          {!retainer && deal.stage !== "lost" && balance > 0 && <Btn onClick={() => setCollecting("deposit")}>Record deposit</Btn>}
          {!editing && <EditButton onClick={() => setEditing(true)} />}
          {deal.stage !== "lost" && (deal.stage !== "won" || balance > 0) && (
            <Btn kind="ghost" onClick={() => setFailing(true)} title="Didn't close, or won't be paid">
              Mark as failed
            </Btn>
          )}
        </div>
      )}
    </div>
  );
}
