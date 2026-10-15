"use client";

import { useState } from "react";
import { FALLEN_LABEL, fallenList, reviveDeal, type Fallen, type FallenKind } from "@/lib/fallen";
import { useTracker } from "./App";
import { Avatar } from "./avatars";
import BossFight from "./BossFight";
import { EditButton, EditableText, Field, SaveButton } from "./editable";
import { ContactChips, ContactFields } from "./Contact";
import { clientForDeal } from "@/lib/clients";
import type { Contact } from "@/lib/types";
import { Badge, Btn, Card, money } from "./ui";
import { Icon } from "./icons";

// The Fallen: failed deals and boss battles you gave up on, as a comic graveyard.
// Each one can be revived (deals) or re-fought (battles).

const FILTERS: [FallenKind | "all", string][] = [
  ["all", "All"],
  ["unclosed", FALLEN_LABEL.unclosed],
  ["unpaid", FALLEN_LABEL.unpaid],
  ["battle", FALLEN_LABEL.battle],
];

export default function FallenCard() {
  const { data } = useTracker();
  const all = fallenList(data);
  const [filter, setFilter] = useState<FallenKind | "all">("all");
  const [rematch, setRematch] = useState<string | null>(null);
  if (!all.length) return null;
  const list = filter === "all" ? all : all.filter((f) => f.kind === filter);
  const lost = all.reduce((a, f) => a + f.lost, 0);
  const count = (k: FallenKind) => all.filter((f) => f.kind === k).length;

  return (
    <Card title={`The Fallen · ${all.length}`} icon={<Icon name="moon" size={24} />} glow="hero">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <Stat label="Money that slipped away" value={money(lost)} />
        <Stat label={FALLEN_LABEL.unclosed} value={String(count("unclosed"))} />
        <Stat label={FALLEN_LABEL.unpaid} value={String(count("unpaid"))} />
        <Stat label={FALLEN_LABEL.battle} value={String(count("battle"))} />
      </div>
      <div className="flex gap-1.5 flex-wrap mb-3" role="tablist" aria-label="Show">
        {FILTERS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={`btn px-3 py-1.5 ${filter === k ? "btn-primary" : "btn-ghost"}`}>
            {l}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="text-lg text-muted">Nothing here.</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((f) => (
            <Grave key={f.key} f={f} onRematch={() => setRematch(f.deal.id)} />
          ))}
        </div>
      )}
      <p className="text-sm text-muted mt-3">Failed money never counts as made. Money already collected from a deal still does. Revive a deal if it comes back to life.</p>
      {rematch && <BossFight key={rematch} dealId={rematch} rematch onClose={() => setRematch(null)} />}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card-2 border-[3px] border-outline rounded-[10px] p-2.5 min-w-0">
      <div className="text-xs font-extrabold uppercase text-muted">{label}</div>
      <div className="font-display text-2xl tracking-wide [overflow-wrap:anywhere]">{value}</div>
    </div>
  );
}

/** One fallen boss, on a tombstone. */
function Grave({ f, onRematch }: { f: Fallen; onRematch: () => void }) {
  const { data, update } = useTracker();
  const [editContact, setEditContact] = useState(false);
  const client = clientForDeal(data, f.deal.id);
  const contact = client ? client.contact : f.deal.contact;
  const setContact = (c: Contact | undefined) =>
    update((d) => {
      if (client) d.clients!.find((x) => x.id === client.id)!.contact = c;
      else d.deals.find((x) => x.id === f.deal.id)!.contact = c;
    });
  const setReason = (reason: string) =>
    update((d) => {
      const deal = d.deals.find((x) => x.id === f.deal.id);
      if (deal?.failed) deal.failed.reason = reason.trim() || undefined;
    });
  return (
    <div className="relative bg-card-2/70 border-[3px] border-outline rounded-t-[48px] rounded-b-[12px] px-4 pt-5 pb-4 shadow-[4px_4px_0_var(--color-outline)] space-y-3 min-w-0">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0 grayscale opacity-75">
          <Avatar value={f.deal.avatar} seed={f.deal.id} kind="monster" size={72} title={f.deal.name} />
          <span className="absolute inset-0 grid place-content-center font-display text-3xl text-bad pointer-events-none" style={{ WebkitTextStroke: "2px #0b0a14" }} aria-hidden>
            ✕
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl tracking-wide leading-tight [overflow-wrap:anywhere]">{f.deal.name}</div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge tone={f.kind === "battle" ? "hero" : "bad"}>{FALLEN_LABEL[f.kind]}</Badge>
            <Badge>{f.at}</Badge>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {f.kind === "battle" ? (
          <>
            <Field label="Deal value">{money(f.deal.value)}</Field>
            <Field label="Fell in round">{f.round ?? "?"}</Field>
          </>
        ) : (
          <>
            <Field label="Slipped away">{money(f.lost)}</Field>
            <Field label="Collected">{f.collected ? money(f.collected) : "None"}</Field>
          </>
        )}
      </div>
      {f.kind !== "battle" && (
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wide text-muted">What happened</div>
          <EditableText value={f.reason} onChange={setReason} placeholder="Add a reason (optional)" label="reason" className="text-lg" />
        </div>
      )}
      {editContact ? (
        <div className="space-y-2">
          <ContactFields value={contact} onChange={setContact} />
          <SaveButton onClick={() => setEditContact(false)} />
        </div>
      ) : (
        <ContactChips value={contact} />
      )}
      <div className="flex gap-2 flex-wrap">
        {!editContact && <EditButton label="Contact" title="Add or change how to reach them" onClick={() => setEditContact(true)} />}
        {f.kind === "battle" ? (
          <Btn kind="hero" onClick={onRematch}>
            <Icon name="swords" size={20} /> Rematch
          </Btn>
        ) : (
          <Btn kind="primary" onClick={() => update((d) => reviveDeal(d, f.deal.id))} title="Put it back where it was">
            <Icon name="sparkles" size={20} /> Revive
          </Btn>
        )}
      </div>
    </div>
  );
}
