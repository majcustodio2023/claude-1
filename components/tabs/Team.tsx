"use client";

import { useState } from "react";
import { expenseAppliesTo, monthOf, uid } from "@/lib/finance";
import { basePayLine, isOverdue, openTasksFor } from "@/lib/clients";
import type { TeamMember } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Btn, Card, NumInput, TextInput, money } from "../ui";
import { HELP } from "../help";
import { Avatar } from "../avatars";
import { AvatarButton } from "../AvatarPicker";
import { EditButton, SaveButton } from "../editable";

/** Opens Expenses and scrolls to a bill, flashing it so it's easy to spot. */
export function showBill(goTo: (tab: "expenses") => void, billId: string) {
  goTo("expenses");
  let tries = 0;
  const find = () => {
    const el = document.getElementById(`bill-${billId}`);
    if (!el) return void (tries++ < 20 && setTimeout(find, 100));
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-4", "ring-gold");
    setTimeout(() => el.classList.remove("ring-4", "ring-gold"), 2500);
  };
  setTimeout(find, 50);
}

export default function Team({ goTo }: { goTo: (tab: "expenses") => void }) {
  const { data, update, today } = useTracker();
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [editSquad, setEditSquad] = useState(false);
  const month = monthOf(today);
  const memberPay = (id: string) => data.expenses.filter((e) => e.memberId === id && expenseAppliesTo(e, month)).reduce((a, e) => a + e.amount, 0);
  const total = data.team.reduce((a, m) => a + memberPay(m.id), 0);
  const squadName = data.settings.squadName || "Squad";
  const active = data.team.filter((m) => m.active);
  const inactive = data.team.filter((m) => !m.active);

  const add = () => {
    const id = uid("tm");
    update((d) => void d.team.push({ id, name: "New member", role: "", monthlyCost: 0, active: true }));
    setJustAdded(id);
  };

  return (
    <div className="space-y-4">
      <Card
        icon={<Avatar value={data.settings.squadAvatar} seed={squadName} kind="emblem" size={40} className="-my-2 mr-1" />}
        help={HELP.team}
        title={`${squadName} · ${active.length} ${active.length === 1 ? "member" : "members"}`}
        actions={
          <>
            {!editSquad && <EditButton label="Squad" title="Change the squad's name and emblem" onClick={() => setEditSquad(true)} />}
            <Btn kind="primary" onClick={add}>
              + Add member
            </Btn>
          </>
        }
      >
        {editSquad && (
          <div className="mb-4 bg-card-2 border-[3px] border-outline rounded-[12px] p-3 flex flex-wrap items-center gap-3">
            <AvatarButton value={data.settings.squadAvatar} seed={squadName} kind="emblem" size={72} name={squadName} onChange={(v) => update((d) => void (d.settings.squadAvatar = v))} />
            <label className="flex flex-col gap-1 text-sm font-extrabold uppercase text-muted flex-1 min-w-48">
              Squad name
              <TextInput className="text-lg normal-case font-bold" value={data.settings.squadName} placeholder="Squad" onChange={(v) => update((d) => void (d.settings.squadName = v.trim() || undefined))} />
            </label>
            <SaveButton onClick={() => setEditSquad(false)} />
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MiniStat label="Pay this month" value={money(total)} />
          <MiniStat label="Active" value={String(active.length)} />
          <MiniStat label="Open client tasks" value={String(active.reduce((a, m) => a + openTasksFor(data, m.id, today).length, 0))} />
        </div>
      </Card>

      {data.team.length === 0 && <p className="text-lg text-muted">No one in the squad yet. Press &ldquo;Add member&rdquo; to add your first teammate.</p>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {active.map((m) => (
          <MemberCard key={m.id} member={m} startEditing={m.id === justAdded} goTo={goTo} />
        ))}
      </div>
      {inactive.length > 0 && (
        <details>
          <summary className="cursor-pointer text-base font-extrabold text-muted">Inactive ({inactive.length})</summary>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-3 opacity-80">
            {inactive.map((m) => (
              <MemberCard key={m.id} member={m} startEditing={false} goTo={goTo} />
            ))}
          </div>
        </details>
      )}
      <p className="text-sm text-muted">Missions are matched to people by the &ldquo;Who&rdquo; field on the Missions tab. Tap anyone&apos;s picture to change their look.</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card-2 border-[3px] border-outline rounded-[10px] p-2.5 min-w-0">
      <div className="text-xs font-extrabold uppercase text-muted">{label}</div>
      <div className="font-display text-2xl tracking-wide [overflow-wrap:anywhere]">{value}</div>
    </div>
  );
}

function MemberCard({ member: m, startEditing, goTo }: { member: TeamMember; startEditing: boolean; goTo: (tab: "expenses") => void }) {
  const { data, update, today } = useTracker();
  const [editing, setEditing] = useState(startEditing);
  const month = monthOf(today);
  const clientName = (id: string) => data.clients?.find((c) => c.id === id)?.name ?? "";
  const set = (patch: Partial<TeamMember>) => update((d) => void Object.assign(d.team.find((x) => x.id === m.id)!, patch));
  // Base pay lives as a payroll bill in Expenses, so it's counted (and marked paid) in one place.
  const setBasePay = (v: number) =>
    update((d) => {
      const line = basePayLine(d, m.id);
      if (line) line.amount = v;
      else if (v > 0) d.expenses.push({ id: uid("exp"), name: `${m.name} pay`, amount: v, category: "payroll", active: true, memberId: m.id });
      d.team.find((x) => x.id === m.id)!.monthlyCost = v;
    });
  const setActive = (on: boolean) =>
    update((d) => {
      d.team.find((x) => x.id === m.id)!.active = on;
      const line = d.expenses.find((x) => x.memberId === m.id && !x.clientId);
      if (line) line.active = on;
    });
  const baseLine = basePayLine(data, m.id);
  const base = baseLine?.amount ?? 0;
  const pay = data.expenses.filter((e) => e.memberId === m.id && e.clientId && expenseAppliesTo(e, month));
  const clientPay = pay.reduce((a, e) => a + e.amount, 0);
  const clientWork = openTasksFor(data, m.id, today);
  const overdue = clientWork.filter((t) => isOverdue(t, today)).length;
  const first = m.name.split(/[ /]/)[0].toLowerCase();
  const open = data.tasks.filter((t) => !t.done && first && t.owner.toLowerCase().includes(first));

  return (
    <div className="bg-card-2/70 border-[3px] border-outline rounded-[14px] p-4 shadow-[4px_4px_0_var(--color-outline)] space-y-3 min-w-0">
      <div className="flex items-center gap-3">
        <AvatarButton value={m.avatar} seed={m.id} kind="person" size={80} name={m.name} onChange={(v) => set({ avatar: v })} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl tracking-wide leading-tight [overflow-wrap:anywhere]">{m.name}</div>
          <div className="text-base font-bold text-muted [overflow-wrap:anywhere]">{m.role || "No role yet"}</div>
          {!m.active && <Badge>Inactive</Badge>}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <label className="block text-sm font-extrabold uppercase text-muted">
            Name
            <TextInput className="w-full mt-1 text-lg normal-case font-bold" value={m.name} onChange={(v) => v.trim() && set({ name: v.trim() })} placeholder="Name" />
          </label>
          <label className="block text-sm font-extrabold uppercase text-muted">
            Role
            <TextInput className="w-full mt-1 text-lg normal-case font-bold" value={m.role} onChange={(v) => set({ role: v })} placeholder="e.g. Video editor" />
          </label>
          <label className="block text-sm font-extrabold uppercase text-muted">
            Base pay per month
            <NumInput className="w-full mt-1 text-lg" value={base || undefined} placeholder="0" onChange={(v) => setBasePay(v ?? 0)} />
            <span className="block normal-case font-bold text-xs mt-1">Saved as a bill in Expenses, so you can mark it paid there.</span>
          </label>
          <label className="block text-sm font-extrabold uppercase text-muted">
            Notes
            <TextInput className="w-full mt-1 text-base normal-case" value={m.notes} onChange={(v) => set({ notes: v || undefined })} placeholder="Schedule, contact, rate…" />
          </label>
          <label className="flex items-center gap-2 text-base font-bold">
            <input type="checkbox" className="w-5 h-5" checked={m.active} onChange={(e) => setActive(e.target.checked)} /> Active (their pay counts each month)
          </label>
          <div className="flex gap-2 flex-wrap">
            <SaveButton onClick={() => setEditing(false)} />
            <Btn kind="danger" onClick={() => confirm(`Remove ${m.name} from the squad?`) && update((d) => void (d.team = d.team.filter((x) => x.id !== m.id)))}>
              Remove
            </Btn>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Base pay / mo" value={base ? money(base) : "None"} />
            <MiniStat label="Client pay" value={clientPay ? money(clientPay) : "None"} />
          </div>
          {baseLine && (
            <button type="button" className="text-base font-bold underline text-accent text-left" onClick={() => showBill(goTo, baseLine.id)}>
              Base pay is the &ldquo;{baseLine.name}&rdquo; bill in Expenses →
            </button>
          )}
          {pay.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pay.map((e) => (
                <button type="button" key={e.id} onClick={() => showBill(goTo, e.id)} title="Show this bill in Expenses" className="px-2.5 py-1 rounded-full bg-accent/20 border-2 border-accent/60 text-sm font-bold hover:bg-accent/40">
                  {clientName(e.clientId ?? "") || e.name} · {money(e.amount)} →
                </button>
              ))}
            </div>
          )}
          {(clientWork.length > 0 || open.length > 0) && (
            <div className="text-base space-y-1">
              <div className="font-extrabold">
                {clientWork.length + open.length} open task{clientWork.length + open.length === 1 ? "" : "s"}
                {overdue > 0 && <span className="text-bad"> · {overdue} overdue</span>}
              </div>
              <ul className="text-sm text-muted space-y-0.5">
                {clientWork.slice(0, 3).map((t) => (
                  <li key={t.id} className={isOverdue(t, today) ? "text-bad font-bold" : ""}>
                    {clientName(t.clientId)}: {t.title}
                  </li>
                ))}
                {open.slice(0, Math.max(0, 3 - clientWork.length)).map((t) => (
                  <li key={t.id}>{t.title}</li>
                ))}
                {clientWork.length + open.length > 3 && <li>and {clientWork.length + open.length - 3} more</li>}
              </ul>
            </div>
          )}
          {m.notes && <p className="text-base text-muted whitespace-pre-wrap [overflow-wrap:anywhere]">{m.notes}</p>}
          <div className="flex justify-end">
            <EditButton onClick={() => setEditing(true)} />
          </div>
        </>
      )}
    </div>
  );
}
