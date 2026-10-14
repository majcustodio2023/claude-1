"use client";

import { REST_ID, newSub } from "@/lib/subs";
import type { SubItem } from "@/lib/types";
import { useState } from "react";
import { Btn, NumInput, TextInput, money } from "./ui";
import { Icon } from "./icons";

export interface SubRow {
  sub: SubItem;
  done: boolean;
  /** Small note beside the amount, e.g. "₱2,000 paid". */
  note?: string;
}

/**
 * The parts of a bill or income. "tick" shows checkboxes, "edit" lets you rename,
 * re-price, add and remove parts. "Everything else" is worked out, never edited.
 */
export function SubItems({
  rows,
  subs,
  onToggle,
  onEdit,
  addLabel = "+ Add a part",
  verb = "paid",
}: {
  rows: SubRow[];
  subs: SubItem[] | undefined;
  onToggle?: (sub: SubItem, done: boolean) => void;
  onEdit?: (subs: SubItem[]) => void;
  addLabel?: string;
  verb?: string;
}) {
  const [editingParts, setEditingParts] = useState(false);
  const canEdit = onEdit;
  // Parts read as plain text until you tap "Edit parts".
  onEdit = editingParts ? canEdit : undefined;
  const list = subs ?? [];
  const change = (id: string, patch: Partial<SubItem>) => onEdit?.(list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const doneCount = rows.filter((r) => r.done).length;

  if (!list.length) {
    return canEdit ? (
      <Btn
        kind="soft"
        className="text-base"
        onClick={() => {
          canEdit([newSub()]);
          setEditingParts(true);
        }}
      >
        {addLabel}
      </Btn>
    ) : null;
  }

  return (
    <div className="bg-card-2/70 border-2 border-line rounded-[8px] p-2.5 space-y-1.5">
      {onToggle && (
        <div className="text-sm font-extrabold uppercase text-muted px-1">
          Parts · {doneCount} of {rows.length} {verb}
        </div>
      )}
      <ul className="space-y-1.5">
        {rows.map(({ sub, done, note }) => {
          const rest = sub.id === REST_ID;
          return (
            <li key={sub.id} className={`flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-[6px] px-1 py-0.5 ${done && onToggle ? "bg-good/10" : ""}`}>
              {onToggle && (
                <input
                  type="checkbox"
                  className="w-6 h-6 accent-[var(--color-good)] cursor-pointer shrink-0"
                  checked={done}
                  disabled={!done && sub.amount <= 0}
                  onChange={() => onToggle(sub, done)}
                  aria-label={`${sub.name || "Part"} ${verb}`}
                  title={sub.amount <= 0 ? "Set an amount first" : undefined}
                />
              )}
              {onEdit && !rest ? (
                <TextInput className={`flex-1 min-w-0 basis-40 sm:basis-auto text-base ${done && onToggle ? "line-through opacity-70" : ""}`} value={sub.name} placeholder="e.g. Maid" onChange={(v) => change(sub.id, { name: v })} />
              ) : (
                <span className={`flex-1 min-w-0 text-base ${rest ? "text-muted italic" : "font-bold"} ${done && onToggle ? "line-through opacity-70" : ""}`}>{sub.name || "Unnamed part"}</span>
              )}
              {note && <span className="hidden sm:inline text-sm text-muted whitespace-nowrap">{note}</span>}
              {onEdit && !rest ? <NumInput className={`w-28 shrink-0 text-base ${onToggle ? "ml-8 sm:ml-0" : ""}`} value={sub.amount} onChange={(v) => change(sub.id, { amount: Math.max(v ?? 0, 0) })} /> : <span className="w-28 shrink-0 text-right tabular-nums font-bold">{money(sub.amount)}</span>}
              {onEdit &&
                (rest ? (
                  <span className="w-8 shrink-0" />
                ) : (
                  <button className="text-muted w-8 shrink-0 px-2" onClick={() => onEdit(list.filter((s) => s.id !== sub.id))} aria-label={`Remove ${sub.name || "part"}`}>
                    ✕
                  </button>
                ))}
            </li>
          );
        })}
      </ul>
      {onEdit ? (
        <div className="flex flex-wrap items-center gap-3 px-1">
          <button className="text-base underline text-muted" onClick={() => onEdit([...list, newSub()])}>
            + Add a part
          </button>
          <Btn type="button" kind="primary" className="ml-auto px-3 py-1.5" onClick={() => setEditingParts(false)}>
            <Icon name="check" size={18} /> Save parts
          </Btn>
        </div>
      ) : (
        canEdit && (
          <button className="text-sm text-muted underline px-1 inline-flex items-center gap-1" onClick={() => setEditingParts(true)}>
            <Icon name="pencil" size={16} /> Edit parts
          </button>
        )
      )}
    </div>
  );
}
