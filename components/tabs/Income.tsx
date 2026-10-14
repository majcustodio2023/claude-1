"use client";

import { useMemo, useState } from "react";
import { clientForDeal, clientForStream, dealCost, keepOf, makeClientFromStream, streamCost } from "@/lib/clients";
import { dealBalance, dealPaid, defaultAccountId, expectedForStream, monthOf, parseAmount, summarize, uid, type StreamRow } from "@/lib/finance";
import type { Deal, IncomeStream, StreamMonth, SubItem } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Btn, Card, Stat, celebrate, money } from "../ui";
import { EditButton, EditableNumber, SaveButton } from "../editable";
import { AccountSelect, CollectForm, accountName, settle } from "../Money";
import { StreamTerms, termsText } from "../StreamSettings";
import { HELP } from "../help";
import { SubItems } from "../SubItems";
import { collectSub, incomeSubRows, uncollectSub } from "@/lib/subs";
import { Icon } from "../icons";

type Go = (tab: "clients" | "pipeline") => void;

export default function Income({ goTo }: { goTo: Go }) {
  const { data, month, update } = useTracker();
  const s = useMemo(() => summarize(data, month), [data, month]);
  const retainers = s.streams.filter((r) => clientForStream(data, r.stream.id));
  const other = s.streams.filter((r) => !clientForStream(data, r.stream.id));
  // Projects: every project client's deal, plus any closed deal still owed or paid this month.
  const projectIds = new Set((data.clients ?? []).filter((c) => !c.archived && c.dealId).map((c) => c.dealId!));
  const projects = data.deals.filter(
    (d) => d.stage !== "lost" && (projectIds.has(d.id) || (d.stage === "won" && (dealBalance(d) > 0 || d.payments.some((p) => monthOf(p.date) === month)))),
  );
  const profit = (data.settings.incomeView ?? "profit") === "profit";
  // In profit view every amount is what you keep after the team pay tied to that client.
  const amount = (paid: number, total: number, cost: number) => (profit ? keepOf(paid, total, cost) : paid);
  const due = (r: StreamRow) => (r.isCollected ? 0 : Math.max(r.expected - r.collected, 0));
  const sum = (rows: StreamRow[], k: "collected" | "pending") => rows.reduce((a, r) => a + amount(k === "collected" ? r.collected : due(r), r.expected, streamCost(data, r.stream.id, month)), 0);
  const kept =
    s.streams.reduce((a, r) => a + keepOf(r.collected, r.expected, streamCost(data, r.stream.id, month)), 0) +
    data.deals.reduce((a, d) => a + d.payments.filter((p) => monthOf(p.date) === month).reduce((b, p) => b + keepOf(p.amount, d.value, dealCost(data, d.id)), 0), 0);
  const teamPaid = Math.max(s.moneyMade - kept, 0);
  const setView = (v: "profit" | "gross") => update((d) => void (d.settings.incomeView = v));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-base font-extrabold text-muted">Show amounts as</span>
        <div className="flex rounded-[10px] border-2 border-line overflow-hidden">
          {(
            [
              ["profit", "Profit (after team pay)"],
              ["gross", "Gross (what clients pay)"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={(profit ? "profit" : "gross") === v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm font-extrabold ${(profit ? "profit" : "gross") === v ? "bg-gold text-outline" : "bg-card-2/60 text-muted hover:text-ink"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {profit ? (
          <Stat label="Profit collected" value={money(kept)} hint={teamPaid ? `${money(s.moneyMade)} in − ${money(teamPaid)} team pay` : "Everything below that's been paid"} tone="good" />
        ) : (
          <Stat label="Collected this month" value={money(s.moneyMade)} hint={teamPaid ? `${money(kept)} profit after team pay` : "Everything below that's been paid"} tone="good" />
        )}
        <Stat label={profit ? "Retainer profit still due" : "Retainers still due"} value={money(sum(retainers, "pending"))} hint={`${money(sum(retainers, "collected"))} collected`} tone="cyan" />
        <Stat
          label={profit ? "Project profit to collect" : "Projects to collect"}
          value={money(projects.filter((d) => d.stage === "won").reduce((a, d) => a + amount(dealBalance(d), d.value, dealCost(data, d.id)), 0))}
          hint="Closed, not fully paid"
          tone="gold"
        />
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
  const cost = streamCost(data, st.id, month);
  const profit = (data.settings.incomeView ?? "profit") === "profit";
  const collectDate = monthOf(today) === month ? today : `${month}-01`;

  const setSM = (patch: Partial<StreamMonth>) =>
    update((d) => {
      d.streamMonths[month] ??= {};
      const cur = { ...(d.streamMonths[month][st.id] ?? {}), ...patch };
      for (const k of Object.keys(cur) as (keyof StreamMonth)[]) if (cur[k] === undefined) delete cur[k];
      d.streamMonths[month][st.id] = cur;
    });
  const setStream = (patch: Partial<IncomeStream>) => update((d) => void Object.assign(d.streams.find((x) => x.id === st.id)!, patch));
  const parts = incomeSubRows(data, month, st);
  const partly = parts.length > 0 && !r.isCollected && r.collected > 0;
  const toggleSub = (sub: SubItem, done: boolean) => {
    if (done) {
      if (!r.month?.subs?.[sub.id]) return alert(`${st.name} was collected all at once. Press Undo to change it.`);
      update((d) => void uncollectSub(d, month, st.id, sub.id));
      return;
    }
    const accountId = r.month?.accountId ?? defaultAccountId(data, "in");
    update((d) => {
      collectSub(d, month, st.id, sub.id, collectDate, accountId);
      if (accountId) d.settings.lastAccountId = accountId;
    });
    if (parts.filter((p) => !p.done).length === 1) celebrate({ kicker: "Loot collected", title: `+${money(r.expected)}`, sub: `${st.name} · every part in`, icon: "💰", sfx: "KA-CHING!" });
  };

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
            {partly ? (
              <Badge tone="gold">
                {money(r.collected)} of {money(r.expected)} in
              </Badge>
            ) : r.isCollected ? (
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
          <div className="text-base text-muted flex flex-col gap-1">
            Their revenue this month
            <EditableNumber label="their revenue this month" className="text-ink text-lg" inputClass="w-36" value={r.month?.revenueBase} onChange={(v) => setSM({ revenueBase: v })} placeholder="0" />
          </div>
        )}
        {st.kind === "variable" && (
          <div className="text-base text-muted flex flex-col gap-1">
            Actual this month
            <EditableNumber label="actual this month" className="text-ink text-lg" inputClass="w-36" value={r.month?.actual} onChange={(v) => setSM({ actual: v })} placeholder={String(st.amount)} />
          </div>
        )}
        <div className="md:text-right md:w-40">
          {profit && cost > 0 ? (
            <>
              <div className="text-sm text-muted">You keep this month</div>
              <div className="font-display text-2xl tracking-wide text-good">{money(r.expected - cost)}</div>
              <div className="text-sm text-muted">
                {money(r.expected)} − {money(cost)} team
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-muted">Due this month</div>
              <div className="font-display text-2xl tracking-wide">{money(r.expected)}</div>
              {cost > 0 && <div className="text-sm text-muted">{money(r.expected - cost)} after team pay</div>}
            </>
          )}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {r.isCollected || partly ? (
            <>
              {!r.month?.subs && <EditableNumber label="amount collected" inputClass="w-28" value={r.collected} onChange={(v) => setSM({ collected: v ?? 0 })} />}
              <AccountSelect value={r.month?.accountId} onChange={(id) => setSM({ accountId: id })} label="Account it went into" />
              <Btn onClick={() => setSM({ collected: undefined, collectedOn: undefined, accountId: undefined, subs: undefined })}>Undo</Btn>
            </>
          ) : (
            !collecting && (
              <Btn kind="primary" onClick={() => setCollecting(true)}>
                {parts.length ? "Collect all" : "Mark collected"}
              </Btn>
            )
          )}
          {client ? (
            <button className="text-base underline text-muted" onClick={() => goTo("clients")}>
              Edit in Clients
            </button>
          ) : (
            !settings && <EditButton title="Change the name, amount or how it's paid" onClick={() => setSettings(true)} />
          )}
        </div>
      </div>

      {parts.length > 0 && <SubItems rows={parts} subs={st.subs} onToggle={toggleSub} verb="collected" />}

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
          <StreamTerms stream={st} alwaysEdit />
          <div className="flex flex-wrap gap-2 items-center">
            <SaveButton onClick={() => setSettings(false)} />
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
  const cost = dealCost(data, deal.id);
  const profit = (data.settings.incomeView ?? "profit") === "profit" && cost > 0;
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
            {cost > 0 && ` · ${money(cost)} team pay · ${money(deal.value - cost)} profit`}
          </div>
        </div>
        <div className="md:text-right md:w-40">
          <div className="text-sm text-muted">{profit ? "You keep, still to collect" : "To collect"}</div>
          <div className={`font-display text-2xl tracking-wide ${profit ? "text-good" : ""}`}>{money(closed ? (profit ? keepOf(balance, deal.value, cost) : balance) : 0)}</div>
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
