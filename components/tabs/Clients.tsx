"use client";

import { useState } from "react";
import { ME, clientStats, isOverdue, nextStatus, openTasksFor, people, personName } from "@/lib/clients";
import { uid } from "@/lib/finance";
import type { Client, ClientTask } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Bar, Btn, Card, TextInput, celebrate } from "../ui";
import { HELP } from "../help";

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
  const clients = data.clients ?? [];
  const active = clients.filter((c) => !c.archived);
  const archived = clients.filter((c) => c.archived);
  const fromIncome = data.streams.filter((s) => s.active && !clients.some((c) => c.streamId === s.id));

  const addClient = (c: Partial<Client> & { name: string }) =>
    update((d) => void (d.clients = [...(d.clients ?? []), { id: uid("client"), createdAt: today, ...c }]));

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
            addClient({ name: name.trim() });
            setName("");
          }}
        >
          <input className="flex-1 min-w-48 text-lg" placeholder="New client name" value={name} onChange={(e) => setName(e.target.value)} />
          <Btn kind="primary">+ Add client</Btn>
        </form>
        {fromIncome.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-base">
            <span className="text-muted">From your income:</span>
            {fromIncome.map((s) => (
              <Btn key={s.id} kind="soft" onClick={() => addClient({ name: s.name, streamId: s.id })}>
                + {s.name}
              </Btn>
            ))}
            {fromIncome.length > 1 && (
              <button className="underline text-muted" onClick={() => update((d) => void (d.clients = [...(d.clients ?? []), ...fromIncome.map((s) => ({ id: uid("client"), name: s.name, streamId: s.id, createdAt: today }))]))}>
                Add all
              </button>
            )}
          </div>
        )}
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
  const { data, update, today } = useTracker();
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
            <TextInput className="flex-1" value={c.name} onChange={(v) => set({ name: v })} />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted w-20">Paid via</span>
            <select value={c.streamId ?? ""} onChange={(e) => set({ streamId: e.target.value || undefined })}>
              <option value="">Not linked to income</option>
              {data.streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted w-20">Notes</span>
            <TextInput className="flex-1" value={c.notes} onChange={(v) => set({ notes: v })} placeholder="Contacts, links, scope…" />
          </label>
          <div className="flex gap-2">
            <Btn onClick={() => set({ archived: !c.archived })}>{c.archived ? "Unarchive" : "Archive client"}</Btn>
            <Btn
              kind="danger"
              onClick={() =>
                confirm(`Delete ${c.name} and all ${all.length} of its tasks?`) &&
                update((d) => {
                  d.clients = d.clients!.filter((x) => x.id !== c.id);
                  d.clientTasks = (d.clientTasks ?? []).filter((t) => t.clientId !== c.id);
                })
              }
            >
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
            <div className={`text-[1.05rem] font-bold leading-snug ${t.status === "done" ? "line-through text-muted" : ""}`}>{t.title}</div>
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
