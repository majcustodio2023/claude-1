"use client";

// The app's form pattern: once something is filled in it shows as plain text, and the
// fields only come back when you tap Edit. Typing still saves as you go; Save just
// closes the fields so the card reads cleanly again.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { money } from "@/lib/finance";
import { Btn } from "./ui";
import { Icon } from "./icons";

export function EditButton({ onClick, label = "Edit", title }: { onClick: () => void; label?: string; title?: string }) {
  return (
    <Btn type="button" kind="soft" className="px-3 py-1.5" onClick={onClick} title={title ?? label} aria-label={title ?? label}>
      <Icon name="pencil" size={18} /> {label}
    </Btn>
  );
}

/** Save closes the fields; anything typed is already kept. */
export function SaveButton({ onClick, label = "Save" }: { onClick: () => void; label?: string }) {
  return (
    <Btn type="button" kind="primary" onClick={onClick}>
      <Icon name="check" size={20} /> {label}
    </Btn>
  );
}

/** A read-only label and value. */
export function Field({ label, children, className = "" }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="text-xs font-extrabold uppercase tracking-wide text-muted">{label}</div>
      <div className="text-lg font-bold leading-snug [overflow-wrap:anywhere]">{children}</div>
    </div>
  );
}

/**
 * A number that reads as text once it's set. Empty shows a field to fill in; after saving,
 * the field goes away and a pencil brings it back.
 */
export function EditableNumber({
  value,
  onChange,
  format = money,
  placeholder,
  label,
  className = "",
  inputClass = "w-32",
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  format?: (n: number) => ReactNode;
  placeholder?: string;
  label?: string;
  className?: string;
  inputClass?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const open = editing || value == null;
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);
  useEffect(() => setText(value == null ? "" : String(value)), [value, editing]);

  const commit = () => {
    const clean = text.replace(/[^\d.-]/g, "");
    if (clean === "") {
      if (value != null) onChange(undefined);
    } else {
      const n = Number(clean);
      if (!Number.isNaN(n) && n !== value) onChange(n);
    }
    setEditing(false);
  };

  if (!open) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="font-bold tabular-nums">{format(value!)}</span>
        <button type="button" className="text-muted hover:text-ink p-1" onClick={() => setEditing(true)} aria-label={`Edit ${label ?? "amount"}`} title={`Edit ${label ?? "amount"}`}>
          <Icon name="pencil" size={16} />
        </button>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <input
        ref={ref}
        inputMode="decimal"
        className={`tabular-nums ${inputClass}`}
        value={text}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <button type="button" className="btn btn-primary px-2.5 py-1" onMouseDown={(e) => e.preventDefault()} onClick={commit} aria-label={`Save ${label ?? "amount"}`} title="Save">
        <Icon name="check" size={18} />
      </button>
    </span>
  );
}

/** Text that reads plainly once set, with a pencil to change it. */
export function EditableText({ value, onChange, placeholder, label, className = "", inputClass = "flex-1 min-w-40" }: { value: string | undefined; onChange: (v: string) => void; placeholder?: string; label?: string; className?: string; inputClass?: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? "");
  const ref = useRef<HTMLInputElement>(null);
  const open = editing || !value;
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);
  useEffect(() => setText(value ?? ""), [value, editing]);
  const commit = () => {
    if (text !== (value ?? "")) onChange(text);
    setEditing(false);
  };
  if (!open) {
    return (
      <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
        <span className="font-bold [overflow-wrap:anywhere]">{value}</span>
        <button type="button" className="text-muted hover:text-ink p-1 shrink-0" onClick={() => setEditing(true)} aria-label={`Edit ${label ?? "name"}`} title={`Edit ${label ?? "name"}`}>
          <Icon name="pencil" size={16} />
        </button>
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-1.5 min-w-0 ${className}`}>
      <input
        ref={ref}
        className={inputClass}
        value={text}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <button type="button" className="btn btn-primary px-2.5 py-1 shrink-0" onMouseDown={(e) => e.preventDefault()} onClick={commit} aria-label={`Save ${label ?? "name"}`} title="Save">
        <Icon name="check" size={18} />
      </button>
    </span>
  );
}
