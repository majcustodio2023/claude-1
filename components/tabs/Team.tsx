"use client";

import { uid } from "@/lib/finance";
import type { TeamMember } from "@/lib/types";
import { useTracker } from "../App";
import { Btn, Card, NumInput, TextInput, peso } from "../ui";

export default function Team() {
  const { data, update } = useTracker();
  const set = (id: string, patch: Partial<TeamMember>) => update((d) => void Object.assign(d.team.find((x) => x.id === id)!, patch));
  const total = data.team.filter((m) => m.active).reduce((a, m) => a + m.monthlyCost, 0);

  return (
    <Card
      title={`Team · ${peso(total)} per month`}
      actions={<Btn kind="soft" onClick={() => update((d) => void d.team.push({ id: uid("tm"), name: "New member", role: "", monthlyCost: 0, active: true }))}>Add member</Btn>}
    >
      <div className="space-y-4">
        {data.team.map((m) => {
          const open = data.tasks.filter((t) => !t.done && t.owner.toLowerCase().includes(m.name.split(/[ /]/)[0].toLowerCase()));
          return (
            <div key={m.id} className="border border-line rounded-xl p-3 space-y-2">
              <div className="grid md:grid-cols-6 gap-2 items-center">
                <TextInput className="md:col-span-2 font-medium" value={m.name} onChange={(v) => set(m.id, { name: v })} placeholder="Name" />
                <TextInput className="md:col-span-2" value={m.role} onChange={(v) => set(m.id, { role: v })} placeholder="Role" />
                <NumInput value={m.monthlyCost} onChange={(v) => set(m.id, { monthlyCost: v ?? 0 })} />
                <div className="flex items-center justify-end gap-3">
                  <label className="text-xs flex items-center gap-1">
                    <input type="checkbox" checked={m.active} onChange={(e) => set(m.id, { active: e.target.checked })} /> Active
                  </label>
                  <button className="text-muted text-xs" onClick={() => confirm(`Remove ${m.name}?`) && update((d) => void (d.team = d.team.filter((x) => x.id !== m.id)))}>✕</button>
                </div>
              </div>
              <TextInput className="w-full text-xs" value={m.notes} onChange={(v) => set(m.id, { notes: v })} placeholder="Notes" />
              {open.length > 0 && (
                <div className="text-xs text-muted">
                  {open.length} open tasks: {open.slice(0, 4).map((t) => t.title).join(" · ")}
                  {open.length > 4 && " …"}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted mt-3">Tasks are matched to people by the owner field on the Tasks tab (for example &ldquo;VA&rdquo;).</p>
    </Card>
  );
}
