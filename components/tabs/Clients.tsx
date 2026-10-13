"use client";

import { useState } from "react";
import { ME, archiveClient, clientKind, clientMoney, clientStats, createClient, deleteClient, deleteClientSummary, isOverdue, nextStatus, openTasksFor, people, personName, renameClient, teamPay } from "@/lib/clients";
import { addMonths, billPaid, expenseAppliesTo, locale, money, monthOf, parseAmount, uid } from "@/lib/finance";
import type { Client, ClientTask } from "@/lib/types";
import { useTracker } from "../App";
import { clientTaskKey, hasChest } from "@/lib/loot";
import { Badge, Bar, Btn, Card, NumInput, TextInput, celebrate } from "../ui";
import { HELP } from "../help";
import { StreamTerms } from "../StreamSettings";
import { incomePartlyCollected } from "@/lib/subs";

const STATUS: Record<ClientTask["status"], { label: string; cls: string }> = {
  todo: { label: "To do", cls: "btn-ghost" },
  doing: { label: "Doing", cls: "btn-hero" },
  done: { label: "Done ✓", cls: "btn-primary" },
};

export default function Clients() {
  const { data, update, today } = useTracker();
  const [who, setWho] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"recurring" | "project" | "">("recurring");
  const [amount, setAmount] = useState("");
  const clients = data.clients ?? [];
  const active = clients.filter((c) => !c.archived);
  const archived = clients.filter((c) => c.archived);

  return (
    <div className="space-y-4">
      <Card
        icon="🗂️"
        glow="hero"
        title={`Clients · ${active.length}`}
        help={HELP.clients}
        actions={
          <label className="flex items-center gap-2 text-base font-bold">
            Show tasks for
            <select value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="all">Everyone</option>
              {people(data).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        }
      >
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            update((d) => void createClient(d, { name: name.trim(), kind: kind || undefined, amount: parseAmount(amount) || 0 }, today));
            setName("");
            setAmount("");
          }}
        >
          <input className="flex-1 min-w-48 text-lg" placeholder="New client name" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="How they pay">
            <option value="recurring">Monthly retainer</option>
            <option value="project">One-time project</option>
            <option value="">Decide later</option>
          </select>
          {kind && <input inputMode="decimal" className="w-36" placeholder={kind === "recurring" ? "Monthly fee" : "Project price"} value={amount} onChange={(e) => setAmount(e.target.value)} />}
          <Btn kind="primary">+ Add client</Btn>
        </form>
        {who !== "all" && <MyPlate personId={who} />}
      </Card>

      {active.length === 0 ? (
        <p className="text-lg text-muted">No clients yet. Add one above to start tracking their tasks.</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {active.map((c) => (
            <ClientCard key={c.id} client={c} who={who} />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div>
          <button className="text-base text-muted underline" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? "Hide" : "Show"} {archived.length} archived client{archived.length > 1 ? "s" : ""}
          </button>
          {showArchived && (
            <div className="grid lg:grid-cols-2 gap-4 mt-3 opacity-80">
              {archived.map((c) => (
                <ClientCard key={c.id} client={c} who={who} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** One person's open tasks across every client. */
function MyPlate({ personId }: { personId: string }) {
  const { data, today } = useTracker();
  const tasks = openTasksFor(data, personId, today);
  const clientName = (id: string) => data.clients?.find((c) => c.id === id)?.name ?? "";
  return (
    <div className="mt-4 bg-card-2 border-[3px] border-outline rounded-[10px] p-3">
      <div className="font-display text-xl tracking-wide mb-2">
        {personName(data, personId)}&apos;s open tasks · {tasks.length}
      </div>
      {tasks.length === 0 ? (
        <p className="text-base text-muted">Nothing open. 🎉</p>
      ) : (
        <ul className="space-y-1 text-base">
          {tasks.map((t) => (
            <li key={t.id} className="flex flex-wrap gap-2">
              <span className="font-bold">{clientName(t.clientId)}:</span>
              <span>{t.title}</span>
              {t.status === "doing" && <Badge tone="hero">Doing</Badge>}
              {t.dueDate && <span className={isOverdue(t, today) ? "text-bad font-bold" : "text-muted"}>{isOverdue(t, today) ? `overdue (${t.dueDate})` : `due ${t.dueDate}`}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClientCard({ client: c, who }: { client: Client; who: string }) {
  const { data, update, today, month } = useTracker();
  const [showDone, setShowDone] = useState(false);
  const [settings, setSettings] = useState(false);
  const all = (data.clientTasks ?? []).filter((t) => t.clientId === c.id);
  const mine = who === "all" ? all : all.filter((t) => t.assignees.includes(who));
  const open = mine.filter((t) => t.status !== "done").sort((a, b) => Number(isOverdue(b, today)) - Number(isOverdue(a, today)) || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  const done = mine.filter((t) => t.status === "done").sort((a, b) => (b.doneOn ?? "").localeCompare(a.doneOn ?? ""));
  const st = clientStats(data, c.id, today);
  const total = st.open + st.done;
  const set = (patch: Partial<Client>) => update((d) => void Object.assign(d.clients!.find((x) => x.id === c.id)!, patch));
  const stream = data.streams.find((s) => s.id === c.streamId && s.name !== c.name);

  return (
    <Card
      icon="💼"
      title={c.name}
      glow={st.overdue ? "hero" : "cyan"}
      actions={
        <>
          {st.overdue > 0 && <Badge tone="bad">{st.overdue} overdue</Badge>}
          <Badge tone={st.open ? "warn" : "good"}>{st.open ? `${st.open} open` : "All clear"}</Badge>
          <button className="btn btn-ghost px-3" onClick={() => setSettings(!settings)} aria-expanded={settings} title="Client settings">
            ⚙
          </button>
        </>
      }
    >
      {settings && (
        <div className="mb-4 bg-card-2 rounded-[8px] p-3 space-y-2 text-base">
          <label className="flex items-center gap-2">
            <span className="text-muted w-20">Name</span>
            <TextInput className="flex-1" value={c.name} onChange={(v) => v.trim() && update((d) => renameClient(d, c.id, v.trim()))} />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted w-20">Pays by</span>
            <select value={clientKind(c) ?? ""} onChange={(e) => set({ kind: (e.target.value || undefined) as Client["kind"] })}>
              <option value="">Not set</option>
              <option value="recurring">Monthly retainer</option>
              <option value="project">One-time project</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted w-20">Notes</span>
            <TextInput className="flex-1" value={c.notes} onChange={(v) => set({ notes: v })} placeholder="Contacts, links, scope…" />
          </label>
          <div className="flex gap-2">
            <Btn onClick={() => (c.archived || confirm(`Archive ${c.name}? Their retainer and monthly team pay stop from this month. Everything already paid stays in your history.`)) && update((d) => archiveClient(d, c.id, !c.archived, month))}>
              {c.archived ? "Unarchive" : "Archive client"}
            </Btn>
            <Btn kind="danger" onClick={() => confirm(deleteClientSummary(data, c.id)) && update((d) => deleteClient(d, c.id))}>
              Delete
            </Btn>
          </div>
        </div>
      )}
      {(c.notes || stream) && !settings && (
        <p className="text-base text-muted -mt-2 mb-3">
          {stream && <>Pays through {stream.name}. </>}
          {c.notes}
        </p>
      )}
      <ClientMoneyPanel client={c} />

      {total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-base font-bold mb-1">
            <span>
              {st.done} of {total} tasks done
            </span>
            {st.doing > 0 && <span className="text-hero">{st.doing} in progress</span>}
          </div>
          <Bar pct={st.done / total} tone="good" thin />
        </div>
      )}

      <AddTask clientId={c.id} defaultWho={who === "all" ? ME : who} />

      <ul className="space-y-2 mt-3">
        {open.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
      </ul>
      {open.length === 0 && total > 0 && <p className="text-base text-muted mt-2">{who === "all" ? "Nothing open for this client." : `Nothing open for ${personName(data, who)} here.`}</p>}
      {done.length > 0 && (
        <div className="mt-3">
          <button className="text-base text-muted underline" onClick={() => setShowDone(!showDone)}>
            {showDone ? "Hide" : "Show"} {done.length} done
          </button>
          {showDone && (
            <ul className="space-y-2 mt-2 opacity-75">
              {done.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

/** Tap a name to add or remove them. Several selected = they work on it together. */
function WhoPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const { data } = useTracker();
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Who's doing it">
      {people(data).map((p) => {
        const on = value.includes(p.id);
        return (
          <button
            type="button"
            key={p.id}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== p.id) : [...value, p.id])}
            className={`px-2.5 py-1 rounded-full border-2 border-outline text-sm font-extrabold ${on ? "bg-accent text-outline" : "bg-card-2 text-muted"}`}
          >
            {on ? "✓ " : ""}
            {p.name}
          </button>
        );
      })}
    </div>
  );
}

function AddTask({ clientId, defaultWho }: { clientId: string; defaultWho: string }) {
  const { update, today } = useTracker();
  const [title, setTitle] = useState("");
  const [who, setWho] = useState<string[]>([defaultWho]);
  const [due, setDue] = useState("");
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        const task: ClientTask = { id: uid("ctask"), clientId, title: title.trim(), assignees: who, status: "todo", createdAt: today, ...(due && { dueDate: due }) };
        update((d) => void (d.clientTasks = [...(d.clientTasks ?? []), task]));
        setTitle("");
        setDue("");
      }}
    >
      <div className="flex flex-wrap gap-2">
        <input className="flex-1 min-w-40" placeholder="New task for this client" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" title="Due date (optional)" />
        <Btn kind="primary" disabled={!title.trim()}>
          Add
        </Btn>
      </div>
      {title.trim() && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted font-bold">Who:</span>
          <WhoPicker value={who} onChange={setWho} />
        </div>
      )}
    </form>
  );
}

function TaskRow({ task: t }: { task: ClientTask }) {
  const { data, update, today } = useTracker();
  const [editing, setEditing] = useState(false);
  const set = (patch: Partial<ClientTask>) => update((d) => void Object.assign(d.clientTasks!.find((x) => x.id === t.id)!, patch));
  const overdue = isOverdue(t, today);
  const cycle = () => {
    const status = nextStatus(t.status);
    set({ status, doneOn: status === "done" ? today : undefined });
    if (status === "done") celebrate({ kicker: "Task done", title: t.title, sub: data.clients?.find((c) => c.id === t.clientId)?.name, icon: "✅", sfx: "NICE!" });
  };

  return (
    <li className={`border-2 rounded-[8px] p-2.5 ${overdue ? "border-bad" : "border-line"} bg-card-2/60`}>
      <div className="flex items-start gap-2">
        <button className={`btn ${STATUS[t.status].cls} px-2.5 py-1 text-sm shrink-0`} onClick={cycle} title="Tap to change: To do → Doing → Done">
          {STATUS[t.status].label}
        </button>
        <div className="flex-1 min-w-0">
          {editing ? (
            <TextInput className="w-full" value={t.title} onChange={(v) => set({ title: v })} />
          ) : (
            <div className={`text-[1.05rem] font-bold leading-snug ${t.status === "done" ? "line-through text-muted" : ""}`}>
              {t.title}
              {t.status !== "done" && hasChest(clientTaskKey(t.id)) && <span className="ml-1.5" title="Loot chest: finish this for a random item">🎁</span>}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-sm">
            {t.assignees.length === 0 && <span className="text-muted">Unassigned</span>}
            {t.assignees.map((id) => (
              <span key={id} className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/60 font-bold">
                {personName(data, id)}
              </span>
            ))}
            {t.dueDate && <span className={overdue ? "text-bad font-bold" : "text-muted"}>{overdue ? `Overdue · ${t.dueDate}` : `Due ${t.dueDate}`}</span>}
            {t.status === "done" && t.doneOn && <span className="text-muted">Done {t.doneOn}</span>}
          </div>
          {t.details && !editing && <p className="text-sm text-muted mt-1 whitespace-pre-wrap">{t.details}</p>}
          {editing && (
            <div className="mt-2 space-y-2">
              <WhoPicker value={t.assignees} onChange={(ids) => set({ assignees: ids })} />
              <div className="flex flex-wrap gap-2 items-center text-sm">
                <label className="flex items-center gap-1 text-muted">
                  Due <input type="date" value={t.dueDate ?? ""} onChange={(e) => set({ dueDate: e.target.value || undefined })} />
                </label>
              </div>
              <TextInput className="w-full text-sm" value={t.details} onChange={(v) => set({ details: v || undefined })} placeholder="Details, links, notes" />
              <div className="flex gap-2">
                <Btn onClick={() => setEditing(false)}>Done editing</Btn>
                <Btn kind="danger" onClick={() => confirm(`Delete "${t.title}"?`) && update((d) => void (d.clientTasks = d.clientTasks!.filter((x) => x.id !== t.id)))}>
                  Delete
                </Btn>
              </div>
            </div>
          )}
        </div>
        {!editing && (
          <button className="text-muted px-1.5 text-lg" onClick={() => setEditing(true)} aria-label="Edit task" title="Edit: who, due date, details">
            ✎
          </button>
        )}
      </div>
    </li>
  );
}

const monthName = (m: string) => new Date(m + "-01T00:00:00").toLocaleDateString(locale(), { month: "short", year: "numeric" });

/** How the client pays, what the team is paid for them, and what's left. */
function ClientMoneyPanel({ client: c }: { client: Client }) {
  const { data, update, month, today } = useTracker();
  const kind = clientKind(c);
  const m = clientMoney(data, c, month);
  const stream = data.streams.find((s) => s.id === c.streamId);
  const deal = data.deals.find((d) => d.id === c.dealId);
  const setClient = (patch: Partial<Client>) => update((d) => void Object.assign(d.clients!.find((x) => x.id === c.id)!, patch));

  const choose = (k: "recurring" | "project") => setClient({ kind: k });
  // Typing the fee or price creates the income stream or deal if there isn't one yet, so it shows in Income / Boss Deals.
  const setFee = (v?: number) =>
    update((d) => {
      const cl = d.clients!.find((x) => x.id === c.id)!;
      const st = d.streams.find((x) => x.id === cl.streamId);
      if (st) st.amount = v ?? 0;
      else if (v) {
        const id = uid("stream");
        d.streams.push({ id, name: cl.name, kind: "fixed", amount: v, active: true });
        cl.streamId = id;
      }
    });
  const setPrice = (v?: number) =>
    update((d) => {
      const cl = d.clients!.find((x) => x.id === c.id)!;
      const dl = d.deals.find((x) => x.id === cl.dealId);
      if (dl) dl.value = v ?? 0;
      else if (v) {
        const id = uid("deal");
        d.deals.push({ id, name: cl.name, value: v, stage: "won", payments: [], createdAt: today });
        cl.dealId = id;
      }
    });

  if (!kind) {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-2 text-base">
        <span className="font-bold">How does this client pay?</span>
        <Btn kind="soft" onClick={() => choose("recurring")}>💰 Monthly retainer</Btn>
        <Btn kind="soft" onClick={() => choose("project")}>🐉 One-time project</Btn>
      </div>
    );
  }

  return (
    <div className="mb-4 bg-card-2 border-[3px] border-outline rounded-[10px] p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={kind === "recurring" ? "accent" : "hero"}>{kind === "recurring" ? "Monthly retainer" : "One-time project"}</Badge>
        {kind === "recurring" ? (
          stream ? (
            <span className="text-base">
              Due {monthName(month)}: <b>{money(m.income)}</b>
            </span>
          ) : (
            <label className="flex items-center gap-2 text-base font-bold">
              Monthly fee
              <NumInput className="w-32" value={undefined} onChange={setFee} placeholder="0" />
            </label>
          )
        ) : (
          <>
            <label className="flex items-center gap-2 text-base font-bold">
              Project price
              <NumInput className="w-32" value={deal?.value} onChange={setPrice} placeholder="0" />
            </label>
            {deal && (
              <select
                value={deal.stage === "won" ? "won" : deal.stage === "lost" ? "lost" : "lead"}
                onChange={(e) => update((d) => void (d.deals.find((x) => x.id === deal.id)!.stage = e.target.value as typeof deal.stage))}
                aria-label="Project status"
              >
                <option value="lead">Not closed yet</option>
                <option value="won">Closed</option>
                <option value="lost">Lost</option>
              </select>
            )}
          </>
        )}
        <span className="text-base ml-auto">
          {kind === "recurring" ? (
            m.collected && stream && incomePartlyCollected(data, month, stream) ? (
              <span className="text-gold font-bold">{money(m.collected)} of its parts collected · tick the rest in Income</span>
            ) : m.collected ? (
              <span className="text-good font-bold">Collected {money(m.collected)} ✓</span>
            ) : stream ? <span className="text-muted">Not collected for {monthName(month)} yet · mark it in Income</span> : null
          ) : deal ? (
            <span>
              <span className="text-good font-bold">{money(m.collected)} collected</span>
              {m.toCollect > 0 && <span className="text-muted"> · {money(m.toCollect)} to collect in Income</span>}
            </span>
          ) : null}
        </span>
      </div>

      {kind === "recurring" && stream && <StreamTerms stream={stream} />}

      <TeamPay client={c} kind={kind} />

      {(m.income > 0 || m.teamCost > 0) && (
        <div className="flex flex-wrap justify-between gap-2 text-lg font-bold border-t-2 border-line pt-2">
          <span>
            {kind === "recurring" ? "Per month" : "Whole project"}: {money(m.income)} − {money(m.teamCost)} team
          </span>
          <span className={m.profit >= 0 ? "text-good" : "text-bad"}>
            = {m.profit >= 0 ? "" : "−"}
            {money(Math.abs(m.profit))} {m.profit >= 0 ? "profit" : "loss"}
            {m.income > 0 && ` (${Math.round((m.profit / m.income) * 100)}%)`}
          </span>
        </div>
      )}
    </div>
  );
}

/** Pay to team members for this client. Each one is a bill in Expenses, so paying it comes out of an account. */
function TeamPay({ client: c, kind }: { client: Client; kind: "recurring" | "project" }) {
  const { data, update, month, today } = useTracker();
  const members = data.team.filter((t) => t.active);
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [text, setText] = useState("");
  const amount = parseAmount(text) || 0;
  const [payMonth, setPayMonth] = useState(month);
  const lines = teamPay(data, c.id).filter((e) => (kind === "recurring" ? expenseAppliesTo(e, month) || (e.startMonth ?? "") > month : e.active));
  const memberName = (id?: string) => data.team.find((t) => t.id === id)?.name ?? "Team member";

  const add = () => {
    if (!memberId || amount <= 0) return;
    const name = `${memberName(memberId)} · ${c.name}`;
    update((d) =>
      void d.expenses.push({
        id: uid("exp"),
        name,
        amount,
        category: "payroll",
        active: true,
        clientId: c.id,
        memberId,
        // A retainer's team pay repeats from this month on; a project's is paid once, in the month picked.
        ...(kind === "recurring" ? { startMonth: month } : { startMonth: payMonth, endMonth: payMonth }),
      }),
    );
    setText("");
  };
  // Pay that's already been paid is ended instead of deleted, so history stays.
  const stop = (id: string) =>
    update((d) => {
      const e = d.expenses.find((x) => x.id === id)!;
      const paidBefore = Object.keys(d.billPayments ?? {}).some((m) => d.billPayments![m][id]?.length);
      if (!paidBefore) d.expenses = d.expenses.filter((x) => x.id !== id);
      else if (kind === "recurring") e.endMonth = addMonths(month, -1) < (e.startMonth ?? "") ? e.startMonth : addMonths(month, -1);
      else e.active = false;
    });

  return (
    <div className="space-y-2">
      <div className="text-base font-bold">Team pay for this client</div>
      {lines.length === 0 && <p className="text-base text-muted">Nobody yet. Add what you pay a team member for this {kind === "recurring" ? "client each month" : "project"}.</p>}
      {lines.map((e) => {
        const payM = kind === "recurring" ? month : e.startMonth ?? month;
        const paid = billPaid(data, payM, e);
        return (
          <div key={e.id} className="flex flex-wrap items-center gap-2 text-base">
            <span className="font-bold">{memberName(e.memberId)}</span>
            <NumInput className="w-28" value={e.amount} onChange={(v) => update((d) => void (d.expenses.find((x) => x.id === e.id)!.amount = v ?? 0))} />
            <span className="text-muted">{kind === "recurring" ? "/ month" : `once, ${monthName(payM)}`}</span>
            {paid >= e.amount && e.amount > 0 ? <Badge tone="good">Paid ✓</Badge> : paid > 0 ? <Badge tone="gold">{money(paid)} paid</Badge> : <Badge tone="warn">Not paid{kind === "recurring" ? " this month" : ""}</Badge>}
            <button className="text-muted ml-auto px-2" title={kind === "recurring" ? "Stop this monthly pay" : "Remove"} onClick={() => confirm(`Stop paying ${memberName(e.memberId)} for ${c.name}?`) && stop(e.id)}>
              ✕
            </button>
          </div>
        );
      })}
      {members.length === 0 ? (
        <p className="text-base text-muted">Add your team members in the Squad tab first.</p>
      ) : (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(ev) => {
            ev.preventDefault();
            add();
          }}
        >
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)} aria-label="Team member">
            {members.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input inputMode="decimal" className="w-32 tabular-nums" value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === "recurring" ? "Per month" : "Amount"} aria-label="Amount" />
          {kind === "project" && (
            <select value={payMonth} onChange={(e) => setPayMonth(e.target.value)} aria-label="Month you pay it">
              {Array.from({ length: 9 }, (_, i) => addMonths(monthOf(today), i - 2)).map((mm) => (
                <option key={mm} value={mm}>
                  Pay in {monthName(mm)}
                </option>
              ))}
            </select>
          )}
          <Btn kind="soft">+ Add pay</Btn>
        </form>
      )}
    </div>
  );
}
