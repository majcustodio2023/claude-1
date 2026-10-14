"use client";

import { useState } from "react";
import { uid } from "@/lib/finance";
import type { Quadrant, Task } from "@/lib/types";
import { useTracker } from "../App";
import { hasChest, taskKey } from "@/lib/loot";
import { Btn, Card, TextInput } from "../ui";
import { Avatar } from "../avatars";
import { SaveButton } from "../editable";
import { HELP } from "../help";
import { Icon } from "../icons";

const QUADS: [Quadrant, string, string][] = [
  ["do", "Do first", "Urgent + important. Handle personally or supervise now."],
  ["schedule", "Schedule & build", "Important, not urgent. Highest-leverage scaling work."],
  ["delegate", "Delegate", "Assign to the VA / team."],
  ["eliminate", "Eliminate or defer", "Distractions and financial risks to avoid."],
];

export default function Tasks() {
  const { data, update, today } = useTracker();
  const [owner, setOwner] = useState("all");
  const [hideDone, setHideDone] = useState(false);
  const [form, setForm] = useState({ title: "", quadrant: "do" as Quadrant, owner: "You", dueDate: "" });
  const owners = Array.from(new Set(data.tasks.map((t) => t.owner))).sort();
  const done = data.tasks.filter((t) => t.done).length;
  const set = (id: string, patch: Partial<Task>) => update((d) => void Object.assign(d.tasks.find((x) => x.id === id)!, patch));

  return (
    <div className="space-y-4">
      <Card
        help={HELP.tasks}
        icon="◎"
        glow="hero"
        title={`Mission plan · ${done} of ${data.tasks.length} done (${data.tasks.length ? Math.round((done / data.tasks.length) * 100) : 0}%)`}
        actions={
          <>
            <select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="all">All owners</option>
              {owners.map((o) => <option key={o}>{o}</option>)}
            </select>
            <label className="text-sm flex items-center gap-1">
              <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> Hide done
            </label>
          </>
        }
      >
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title) return;
            update((d) => void d.tasks.unshift({ id: uid("task"), title: form.title, quadrant: form.quadrant, owner: form.owner || "You", dueDate: form.dueDate || undefined, done: false }));
            setForm({ ...form, title: "", dueDate: "" });
          }}
        >
          <input className="flex-1 min-w-48" placeholder="New task" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select value={form.quadrant} onChange={(e) => setForm({ ...form, quadrant: e.target.value as Quadrant })}>
            {QUADS.map(([q, l]) => <option key={q} value={q}>{l}</option>)}
          </select>
          <input className="w-36" placeholder="Who" list="task-owners" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <datalist id="task-owners">
            {Array.from(new Set(["You", ...data.team.filter((m) => m.active).map((m) => m.name), ...owners])).map((o) => <option key={o} value={o} />)}
          </datalist>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Btn kind="primary">Add task</Btn>
        </form>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {QUADS.map(([q, label, desc]) => {
          const all = data.tasks.filter((t) => t.quadrant === q);
          const list = all.filter((t) => (owner === "all" || t.owner === owner) && !(hideDone && t.done));
          return (
            <Card key={q} glow={q === "do" ? "hero" : q === "schedule" ? "cyan" : q === "delegate" ? "good" : "gold"} title={`${label} · ${all.filter((t) => t.done).length}/${all.length}`}>
              <p className="text-sm text-muted -mt-2 mb-3">{desc}</p>
              <ul className="space-y-2">
                {list.map((t) => (
                  <TaskItem key={t.id} task={t} />
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TaskItem({ task: t }: { task: Task }) {
  const { data, update, today } = useTracker();
  const [editing, setEditing] = useState(false);
  const set = (patch: Partial<Task>) => update((d) => void Object.assign(d.tasks.find((x) => x.id === t.id)!, patch));
  const member = data.team.find((m) => m.name && t.owner.toLowerCase().includes(m.name.split(/[ /]/)[0].toLowerCase()));
  return (
    <li className="flex items-start gap-2">
      <input type="checkbox" className="mt-1 w-5 h-5" checked={t.done} onChange={() => set({ done: !t.done, doneOn: !t.done ? today : undefined })} aria-label={t.title} />
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <TextInput className="w-full" value={t.title} onChange={(v) => v.trim() && set({ title: v.trim() })} />
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <TextInput className="w-32" value={t.owner} placeholder="Who" onChange={(v) => set({ owner: v.trim() || "You" })} />
              <label className="flex items-center gap-1 text-muted">
                Due <input type="date" value={t.dueDate ?? ""} onChange={(e) => set({ dueDate: e.target.value || undefined })} />
              </label>
              <select value={t.quadrant} onChange={(e) => set({ quadrant: e.target.value as Quadrant })} aria-label="Move to">
                {QUADS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <SaveButton onClick={() => setEditing(false)} />
              <Btn kind="danger" onClick={() => confirm(`Delete "${t.title}"?`) && update((d) => void (d.tasks = d.tasks.filter((x) => x.id !== t.id)))}>Delete</Btn>
            </div>
          </div>
        ) : (
          <>
            <div className={`text-base font-bold leading-snug ${t.done ? "line-through text-muted" : ""}`}>
              {t.title}
              {!t.done && hasChest(taskKey(t.id)) && <span className="ml-1.5" title="Loot chest: finish this for a random item"><Icon name="gift" size={20} /></span>}
            </div>
            <div className="text-sm text-muted flex gap-2 flex-wrap items-center mt-0.5">
              <span className="inline-flex items-center gap-1">
                {member && <Avatar value={member.avatar} seed={member.id} kind="person" size={22} />}
                {t.owner}
              </span>
              {t.due && <span>· {t.due}</span>}
              {t.dueDate && <span>· due {t.dueDate}</span>}
              {t.dueDate && !t.done && t.dueDate < today && <span className="text-bad font-bold">overdue</span>}
            </div>
            {t.details && <div className="text-sm text-muted mt-1">{t.details}</div>}
          </>
        )}
      </div>
      {!editing && (
        <button className="text-muted px-1" onClick={() => setEditing(true)} aria-label="Edit mission" title="Edit: name, who, due date, column">
          <Icon name="pencil" size={18} />
        </button>
      )}
    </li>
  );
}
