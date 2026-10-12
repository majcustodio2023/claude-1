"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Card({ title, actions, children, className = "" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-card border border-line rounded-2xl p-4 sm:p-5 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          {title && <h2 className="font-semibold">{title}</h2>}
          {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Meter({ label, value, target, sub }: { label: string; value: number; target: number; sub?: ReactNode }) {
  const pct = target > 0 ? value / target : 0;
  const color = pct >= 1 ? "bg-good" : pct >= 0.6 ? "bg-accent" : pct >= 0.3 ? "bg-warn" : "bg-bad";
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-medium">{Math.round(pct * 100)}%</span>
      </div>
      <div className="text-2xl font-semibold tabular-nums">
        {peso(value)} <span className="text-base font-normal text-muted">of {peso(target)}</span>
      </div>
      <div className="h-3 rounded-full bg-line overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 1) * 100}%` }} />
      </div>
      {sub && <div className="text-sm text-muted">{sub}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="bg-card border border-line rounded-xl p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}

type BtnKind = "primary" | "ghost" | "danger" | "soft";
export function Btn({ kind = "ghost", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: BtnKind }) {
  const styles: Record<BtnKind, string> = {
    primary: "bg-accent text-white dark:text-black border-accent",
    soft: "bg-accent-soft text-accent border-transparent",
    ghost: "bg-transparent border-line hover:bg-accent-soft",
    danger: "bg-transparent border-line text-bad hover:bg-bad/10",
  };
  return <button {...p} className={`text-sm rounded-lg border px-3 py-1.5 font-medium disabled:opacity-50 ${styles[kind]} ${className}`} />;
}

/** Number input that only commits on blur/enter so typing isn't interrupted. */
export function NumInput({ value, onChange, className = "", placeholder }: { value: number | undefined; onChange: (v: number | undefined) => void; className?: string; placeholder?: string }) {
  const [text, setText] = useState(value == null ? "" : String(value));
  useEffect(() => setText(value == null ? "" : String(value)), [value]);
  const commit = () => {
    const clean = text.replace(/[₱,\s]/g, "");
    if (clean === "") return onChange(undefined);
    const n = Number(clean);
    if (!Number.isNaN(n)) onChange(n);
    else setText(value == null ? "" : String(value));
  };
  return (
    <input
      inputMode="decimal"
      className={`tabular-nums ${className}`}
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

/** Text input that commits on blur. */
export function TextInput({ value, onChange, className = "", placeholder }: { value: string | undefined; onChange: (v: string) => void; className?: string; placeholder?: string }) {
  const [text, setText] = useState(value ?? "");
  useEffect(() => setText(value ?? ""), [value]);
  return (
    <input
      className={className}
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => text !== (value ?? "") && onChange(text)}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

export function Badge({ tone = "muted", children }: { tone?: "good" | "warn" | "bad" | "muted" | "accent"; children: ReactNode }) {
  const t = {
    good: "bg-good/15 text-good",
    warn: "bg-warn/15 text-warn",
    bad: "bg-bad/15 text-bad",
    muted: "bg-line text-muted",
    accent: "bg-accent-soft text-accent",
  }[tone];
  return <span className={`inline-block text-xs font-medium rounded-full px-2 py-0.5 ${t}`}>{children}</span>;
}

export function peso(n: number): string {
  return "₱" + Math.round(n).toLocaleString("en-PH");
}
