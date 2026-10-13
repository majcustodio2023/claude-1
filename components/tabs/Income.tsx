"use client";

import { useMemo, useState } from "react";
import { clientForDeal, clientForStream, makeClientFromStream } from "@/lib/clients";
import { dealBalance, dealPaid, expectedForStream, monthOf, parseAmount, summarize, uid, type StreamRow } from "@/lib/finance";
import type { Deal, IncomeStream, StreamMonth } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Btn, Card, NumInput, Stat, celebrate, money } from "../ui";
import { AccountSelect, CollectForm, accountName, settle } from "../Money";
import { StreamTerms, termsText } from "../StreamSettings";
import { HELP } from "../help";

type Go = (tab: "clients" | "pipeline") => void;

export default function Income({ goTo }: { goTo: Go }) {
  const { data, month } = useTracker();
  const s = useMemo(() => summarize(data, month), [data, month]);
  const retainers = s.streams.filter((r) => clientForStream(data, r.stream.id));
  const other = s.streams.filter((r) => !clientForStream(data, r.stream.id));
  // Projects: every project client's deal, plus any closed deal still owed or paid this month.
  const projectIds = new Set((data.clients ?? []).filter((c) => !c.archived && c.dealId).map((c) => c.dealId!));
  const projects = data.deals.filter(
    (d) => d.stage !== "lost" && (projectIds.has(d.id) || (d.stage === "won" && (dealBalance(d) > 0 || d.payments.some((p) => monthOf(p.date) === month)))),
  );
  const sum = (rows: StreamRow[], k: "collected" | "pending") => rows.reduce((a, r) => a + (k === "collected" ? r.collected : r.isCollected ? 0 : r.expected), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Collected this month" value={money(s.moneyMade)} hint="Everything below that's been paid" tone="good" />
        <Stat label="Retainers still due" value={money(sum(retainers, "pending"))} hint={`${money(sum(retainers, "collected"))} collected`} tone="cyan" />
        <Stat label="Projects to collect" value={money(projects.filter((d) => d.stage === "won").reduce((a, d) => a + dealBalance(d), 0))} hint="Closed, not fully paid" tone="gold" />
        <Stat label="Other income" value={money(sum(other, "collected"))} hint={`${money(sum(other, "pending"))} still expected`} />
      </div>

      <Card icon="🗂️" title="From your clients · retainers" help={HELP.income} actions={<Btn kind="soft" onClick={() => goTo("clients")}>Manage clients →</Btn>}>
        {retainers.length === 0 ? (
          <p className="text-lg text-muted">No retainer clients yet. Add them in the Clients tab and their monthly fee shows up here.</p>
        ) : (
          <div className="space-y-3">
            {retainers.map((r) => (
              <IncomeRow key={r.stream.id} row={r} goTo={goTo} />
            ))}
          </div>
        )}
      </Card>

      <Card icon="🐉" title="From your clients · projects" help={HELP.projects} actions={<Btn kind="soft" onClick={() => goTo("clients")}>Manage clients →</Btn>}>
        {projects.length === 0 ? (
          <p className="text-lg text-muted">No projects right now. Add a one-time project client in the Clients tab.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((d) => (
              <ProjectRow key={d.id} deal={d} goTo={goTo} />
            ))}
          </div>
        )}
      </Card>

      <Card icon="📦" title="Other income" help={HELP.otherIncome} actions={<AddOther />}>
        {other.length === 0 ? (
          <p className="text-lg text-muted">Money that isn&apos;t from a client, like product or SaaS sales, goes here.</p>
        ) : (
          <div className="space-y-3">
            {other.map((r) => (
              <IncomeRow key={r.stream.id} row={r} goTo={goTo} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function IncomeRow({ row: r, goTo }: { row: StreamRow; goTo: Go }) {
  const { data, update, month, today } = useTracker();
  const [collecting, setCollecting] = useState(false);
  const [settings, setSettings] = useState(false);
  const st = r.stream;
  const client = clientForStream(data, st.id);
  const collectDate = monthOf(today) === month ? today : `${month}-01`;

  const setSM = (patch: Partial<StreamMonth>) =>
    update((d) => {
      d.streamMonths[month] ??= {};
      const cur = { ...(d.streamMonths[month][st.id] ?? {}), ...patch };
      for (const k of Object.keys(cur) as (keyof StreamMonth)[]) if (cur[k] === undefined) delete cur[k];
      d.streamMonths[month][st.id] = cur;
    });
  const setStream = (patch: Partial<IncomeStream>) => update((d) => void Object.assign(d.streams.find((x) => x.id === st.id)!, patch));

  // Income that has paid before is archived instead of deleted, so past months keep their numbers.
  const remove = () => {
    const paidBefore = Object.values(data.streamMonths).some((m) => m[st.id]?.collected != null);
    if (paidBefore) {
      if (confirm(`${st.name} has payment history. Stop it? It's no longer expected each month, and past months keep what it paid.`)) setStream({ active: false });
    } else if (confirm(`Remove ${st.name}?`)) update((d) => void (d.streams = d.streams.filter((x) => x.id !== st.id)));
  };

  return (
    <div className={`border-[3px] rounded-[10px] p-3.5 space-y-3 ${r.isCollected ? "border-good/60 bg-good/5" : "border-outline bg-card-2/60"}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold">{client?.name ?? st.name}</span>
            {r.isCollected ? (
              <Badge tone="good">
                Collected {money(r.collected)}
                {accountName(data, r.month?.accountId) ? ` · in ${accountName(data, r.month?.accountId)}` : ""}
              </Badge>
            ) : (
              <Badge tone="warn">Not collected yet</Badge>
            )}
            {client && <Badge tone="accent">From Clients</Badge>}
            {!st.active && <Badge>Stopped</Badge>}
          </div>
          <div className="text-base text-muted mt-0.5">{termsText(st, money)}</div>
        </div>
        {st.kind === "percent_floor" && (
          <label className="text-base text-muted flex flex-col gap-1">
            Their revenue this month
            <NumInput className="w-36" value={r.month?.revenueBase} onChange={(v) => setSM({ revenueBase: v })} placeholder="0" />
          </label>
        )}
        {st.kind === "variable" && (
          <label className="text-base text-muted flex flex-col gap-1">
            Actual this month
            <NumInput className="w-36" value={r.month?.actual} onChange={(v) => setSM({ actual: v })} placeholder={String(st.amount)} />
          </label>
        )}
        <div className="md:text-right md:w-32">
          <div className="text-sm text-muted">Due this month</div>
          <div className="font-display text-2xl tracking-wide">{money(r.expected)}</div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {r.isCollected ? (
            <>
              <NumInput className="w-28" value={r.collected} onChange={(v) => setSM({ collected: v ?? 0 })} />
              <AccountSelect value={r.month?.accountId} onChange={(id) => setSM({ accountId: id })} label="Account it went into" />
              <Btn onClick={() => setSM({ collected: undefined, collectedOn: undefined, accountId: undefined })}>Undo</Btn>
            </>
          ) : (
            !collecting && (
              <Btn kind="primary" onClick={() => setCollecting(true)}>
                Mark collected
              </Btn>
            )
          )}
          {client ? (
            <button className="text-base underline text-muted" onClick={() => goTo("clients")}>
              Edit in Clients
            </button>
          ) : (
            <button className="btn btn-ghost px-3" onClick={() => setSettings(!settings)} aria-expanded={settings} title="Change the amount or how it's paid">
              ⚙
            </button>
          )}
        </div>
      </div>

      {collecting && !r.isCollected && (
        <CollectForm
          amount={expectedForStream(st, r.month)}
          date={collectDate}
          cta="Collect"
          onCancel={() => setCollecting(false)}
          onCollect={(c) => {
            update((d) => {
              d.streamMonths[month] ??= {};
              d.streamMonths[month][st.id] = { ...(d.streamMonths[month][st.id] ?? {}), collected: c.amount, collectedOn: c.date, ...(c.accountId && { accountId: c.accountId }) };
              if (c.accountId) d.settings.lastAccountId = c.accountId;
              if (c.alreadyCounted) settle(d, `stream:${month}:${st.id}`);
            });
            setCollecting(false);
            const where = c.accountId ? accountName(data, c.accountId) : undefined;
            celebrate({ kicker: "Loot collected", title: `+${money(c.amount)}`, sub: where ? `${st.name} → ${where}` : st.name, icon: "💰", sfx: "KA-CHING!" });
          }}
        />
      )}

      {settings && !client && (
        <div className="bg-card-2 rounded-[8px] p-3 space-y-3">
          <label className="flex items-center gap-2 text-base">
            <span className="text-muted">Name</span>
            <input className="flex-1" defaultValue={st.name} onBlur={(e) => e.target.value.trim() && setStream({ name: e.target.value.trim() })} />
          </label>
          <StreamTerms stream={st} />
          <div className="flex flex-wrap gap-2 items-center">
            <Btn kind="soft" onClick={() => update((d) => makeClientFromStream(d, st.id, today))}>
              This is a client → move to Clients
            </Btn>
            {st.active ? (
              <Btn kind="danger" onClick={remove}>
                Remove
              </Btn>
            ) : (
              <Btn onClick={() => setStream({ active: true })}>Restart</Btn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** A project's money, read-only except collecting. The project itself is edited in Clients (or Boss Deals). */
function ProjectRow({ deal, goTo }: { deal: Deal; goTo: Go }) {
  const { data, update, today } = useTracker();
  const [collecting, setCollecting] = useState<"full" | "deposit" | null>(null);
  const client = clientForDeal(data, deal.id);
  const paid = dealPaid(deal);
  const balance = dealBalance(deal);
  const closed = deal.stage === "won";
  const collect = (c: { amount: number; date: string; accountId?: string; note?: string; alreadyCounted: boolean }) => {
    const id = uid("pay");
    update((d) => {
      const x = d.deals.find((y) => y.id === deal.id)!;
      x.payments.push({ id, amount: c.amount, date: c.date, ...(c.note && { note: c.note }), ...(c.accountId && { accountId: c.accountId }) });
      x.stage = "won";
      if (c.accountId) d.settings.lastAccountId = c.accountId;
      if (c.alreadyCounted) settle(d, `pay:${id}`);
    });
    setCollecting(null);
    celebrate({ kicker: c.amount >= balance ? "Boss defeated" : "Critical hit", title: `+${money(c.amount)} collected`, sub: `${deal.name}${c.accountId ? ` → ${accountName(data, c.accountId)}` : ""}`, icon: "🐉", sfx: c.amount >= balance ? "BOSS DOWN!" : "WHAM!" });
  };

  return (
    <div className={`border-[3px] rounded-[10px] p-3.5 space-y-3 ${closed && balance === 0 ? "border-good/60 bg-good/5" : "border-outline bg-card-2/60"}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold">{client?.name ?? deal.name}</span>
            <Badge tone="accent">{client ? "From Clients" : "From Boss Deals"}</Badge>
            {!closed ? <Badge>Not closed yet</Badge> : balance === 0 ? <Badge tone="good">Fully paid</Badge> : paid > 0 ? <Badge tone="gold">Partly paid</Badge> : <Badge tone="warn">Not collected yet</Badge>}
          </div>
          <div className="text-base text-muted mt-0.5">
            Price {money(deal.value)} · {money(paid)} collected
          </div>
        </div>
        <div className="md:text-right md:w-32">
          <div className="text-sm text-muted">To collect</div>
          <div className="font-display text-2xl tracking-wide">{money(closed ? balance : 0)}</div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {closed && balance > 0 && !collecting && (
            <>
              <Btn kind="primary" onClick={() => setCollecting("full")}>Collect {money(balance)}</Btn>
              <Btn onClick={() => setCollecting("deposit")}>Part payment</Btn>
            </>
          )}
          <button className="text-base underline text-muted" onClick={() => goTo(client ? "clients" : "pipeline")}>
            Edit in {client ? "Clients" : "Boss Deals"}
          </button>
        </div>
      </div>
      {collecting && (
        <CollectForm
          amount={collecting === "full" ? balance : undefined}
          date={today}
          withNote={collecting === "deposit"}
          cta={collecting === "full" ? "Collect" : "Record"}
          onCancel={() => setCollecting(null)}
          onCollect={(c) => collect({ ...c, note: c.note ?? (collecting === "full" ? (paid ? "Balance" : "Full payment") : "Deposit") })}
        />
      )}
    </div>
  );
}

function AddOther() {
  const { update } = useTracker();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  if (!open) return <Btn kind="soft" onClick={() => setOpen(true)}>+ Other income</Btn>;
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        update((d) => void d.streams.push({ id: uid("stream"), name: name.trim(), kind: "variable", amount: parseAmount(amount) || 0, active: true }));
        setName("");
        setAmount("");
        setOpen(false);
      }}
    >
      <input className="w-48" placeholder="e.g. SaaS sales" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <input inputMode="decimal" className="w-36" placeholder="Usual month" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Btn kind="primary">Add</Btn>
      <Btn type="button" onClick={() => setOpen(false)}>Cancel</Btn>
    </form>
  );
}
