"use client";

import { expenseAppliesTo, monthOf, uid } from "@/lib/finance";
import { isOverdue, openTasksFor } from "@/lib/clients";
import type { TeamMember } from "@/lib/types";
import { useTracker } from "../App";
import { Btn, Card, NumInput, TextInput, money } from "../ui";
import { HELP } from "../help";

export default function Team() {
  const { data, update, today } = useTracker();
  const clientName = (id: string) => data.clients?.find((c) => c.id === id)?.name ?? "";
  const set = (id: string, patch: Partial<TeamMember>) => update((d) => void Object.assign(d.team.find((x) => x.id === id)!, patch));
  const total = data.team.filter((m) => m.active).reduce((a, m) => a + m.monthlyCost, 0);

  return (
    <Card
      icon="⬢"
      help={HELP.team}
      title={`Squad · ${money(total)} per month`}
      actions={<Btn kind="soft" onClick={() => update((d) => void d.team.push({ id: uid("tm"), name: "New member", role: "", monthlyCost: 0, active: true }))}>Add member</Btn>}
    >
      <div className="space-y-4">
        {data.team.map((m) => {
          const clientWork = openTasksFor(data, m.id, today);
          const pay = data.expenses.filter((e) => e.memberId === m.id && expenseAppliesTo(e, monthOf(today)));
          const open = data.tasks.filter((t) => !t.done && t.owner.toLowerCase().includes(m.name.split(/[ /]/)[0].toLowerCase()));
          return (
            <div key={m.id} className="border border-line bg-card-2/50 rounded-[3px] p-3 space-y-2">
              <div className="grid md:grid-cols-6 gap-2 items-center">
                <TextInput className="md:col-span-2 font-medium" value={m.name} onChange={(v) => set(m.id, { name: v })} placeholder="Name" />
                <TextInput className="md:col-span-2" value={m.role} onChange={(v) => set(m.id, { role: v })} placeholder="Role" />
                <NumInput value={m.monthlyCost} onChange={(v) => set(m.id, { monthlyCost: v ?? 0 })} />
                <div className="flex items-center justify-end gap-3">
                  <label className="text-sm flex items-center gap-1">
                    <input type="checkbox" checked={m.active} onChange={(e) => set(m.id, { active: e.target.checked })} /> Active
                  </label>
                  <button className="text-muted text-sm" onClick={() => confirm(`Remove ${m.name}?`) && update((d) => void (d.team = d.team.filter((x) => x.id !== m.id)))}>✕</button>
                </div>
              </div>
              <TextInput className="w-full text-sm" value={m.notes} onChange={(v) => set(m.id, { notes: v })} placeholder="Notes" />
              {pay.length > 0 && (
                <div className="text-base">
                  <span className="font-bold">Client pay this month {money(pay.reduce((a, e) => a + e.amount, 0))}</span>
                  <span className="text-muted">: {pay.map((e) => `${clientName(e.clientId ?? "") || e.name} ${money(e.amount)}`).join(" · ")}</span>
                </div>
              )}
              {clientWork.length > 0 && (
                <div className="text-base">
                  <span className="font-bold">{clientWork.length} open client task{clientWork.length > 1 ? "s" : ""}</span>
                  {clientWork.some((t) => isOverdue(t, today)) && <span className="text-bad font-bold"> · {clientWork.filter((t) => isOverdue(t, today)).length} overdue</span>}
                  <span className="text-muted">: {clientWork.slice(0, 4).map((t) => `${clientName(t.clientId)}: ${t.title}`).join(" · ")}{clientWork.length > 4 && " …"}</span>
                </div>
              )}
              {open.length > 0 && (
                <div className="text-sm text-muted">
                  {open.length} open tasks: {open.slice(0, 4).map((t) => t.title).join(" · ")}
                  {open.length > 4 && " …"}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted mt-3">Tasks are matched to people by the owner field on the Tasks tab (for example &ldquo;VA&rdquo;).</p>
    </Card>
  );
}
