"use client";

import { useState } from "react";
import { uid } from "@/lib/finance";
import type { Quadrant, Task } from "@/lib/types";
import { useTracker } from "../App";
import { hasChest, taskKey } from "@/lib/loot";
import { Btn, Card } from "../ui";
import { HELP } from "../help";

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
                  <li key={t.id} className="flex items-start gap-2 group">
                    <input type="checkbox" className="mt-1" checked={t.done} onChange={() => set(t.id, { done: !t.done, doneOn: !t.done ? today : undefined })} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${t.done ? "line-through text-muted" : ""}`}>
                        {t.title}
                        {!t.done && hasChest(taskKey(t.id)) && <span className="ml-1.5" title="Loot chest: finish this for a random item">🎁</span>}
                      </div>
                      <div className="text-sm text-muted flex gap-2 flex-wrap items-center">
                        <span>{t.owner}</span>
                        {t.due && <span>· {t.due}</span>}
                        <input
                          type="date"
                          className="!py-0 !px-1 text-sm"
                          value={t.dueDate ?? ""}
                          onChange={(e) => set(t.id, { dueDate: e.target.value || undefined })}
                          title="Due date"
                        />
                        {t.dueDate && !t.done && t.dueDate < today && <span className="text-bad">overdue</span>}
                      </div>
                      {t.details && <div className="text-sm text-muted mt-1">{t.details}</div>}
                    </div>
                    <select className="text-sm !py-0 opacity-0 group-hover:opacity-100" value={t.quadrant} onChange={(e) => set(t.id, { quadrant: e.target.value as Quadrant })} aria-label="Move">
                      {QUADS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <button className="text-muted text-sm opacity-0 group-hover:opacity-100" onClick={() => update((d) => void (d.tasks = d.tasks.filter((x) => x.id !== t.id)))}>✕</button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
