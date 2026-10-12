"use client";

import { useEffect, useState, type ReactNode } from "react";

type Glow = "cyan" | "hero" | "gold" | "good";
const GLOW_CLASS: Record<Glow, string> = { cyan: "", hero: "hud-hero", gold: "hud-gold", good: "hud-good" };

export function Card({ title, icon, actions, children, className = "", glow = "cyan" }: { title?: ReactNode; icon?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; glow?: Glow }) {
  return (
    <section className={`hud ${GLOW_CLASS[glow]} p-4 sm:p-5 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          {title && (
            <h2 className="font-display text-[0.8rem] font-semibold uppercase text-ink flex items-center gap-2">
              {icon && <span className="text-accent text-base">{icon}</span>}
              {title}
            </h2>
          )}
          {actions && <div className="flex gap-2 flex-wrap items-center">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export type BarTone = "cyan" | "hero" | "gold" | "good" | "bad";

export function Bar({ pct, tone = "cyan", thin }: { pct: number; tone?: BarTone; thin?: boolean }) {
  return (
    <div className={`bar bar-${tone} ${thin ? "bar-thin" : ""}`} role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="fill" style={{ width: `${Math.max(Math.min(pct, 1), 0) * 100}%` }} />
    </div>
  );
}

export function Meter({ label, icon, value, target, sub, tone }: { label: string; icon?: ReactNode; value: number; target: number; sub?: ReactNode; tone: BarTone }) {
  const pct = target > 0 ? value / target : 0;
  const color = { cyan: "text-accent glow-text-cyan", hero: "text-hero glow-text-hero", gold: "text-gold glow-text-gold", good: "text-good", bad: "text-bad" }[pct >= 1 ? "gold" : tone];
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display text-[0.72rem] uppercase text-muted flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          {label}
        </span>
        <span className={`font-display text-2xl font-extrabold tabular-nums ${color}`}>{Math.round(pct * 100)}%</span>
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-display text-[1.7rem] font-extrabold tabular-nums leading-none">{peso(value)}</span>
        <span className="text-muted">/ {peso(target)}</span>
      </div>
      <Bar pct={pct} tone={pct >= 1 ? "gold" : tone} />
      {sub && <div className="text-sm text-muted">{sub}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "cyan" | "hero" | "gold" | "good" | "bad" }) {
  const color = tone ? { cyan: "text-accent", hero: "text-hero", gold: "text-gold", good: "text-good", bad: "text-bad" }[tone] : "";
  return (
    <div className="relative bg-card-2/70 border border-line rounded-[3px] p-3 overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-[3px] bg-accent/60" />
      <div className="text-[0.7rem] uppercase tracking-[0.12em] text-muted font-semibold">{label}</div>
      <div className={`font-display text-lg font-semibold tabular-nums mt-0.5 ${color}`}>{value}</div>
      {hint && <div className="text-xs text-muted mt-0.5">{hint}</div>}
    </div>
  );
}

type BtnKind = "primary" | "ghost" | "danger" | "soft" | "hero";
export function Btn({ kind = "ghost", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: BtnKind }) {
  const cls = { primary: "btn-primary", soft: "btn-ghost", ghost: "btn-ghost", danger: "btn-danger", hero: "btn-hero" }[kind];
  return <button {...p} className={`btn ${cls} ${className}`} />;
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

export function Badge({ tone = "muted", children }: { tone?: "good" | "warn" | "bad" | "muted" | "accent" | "gold" | "hero"; children: ReactNode }) {
  const t = {
    good: "text-good border-good/50 bg-good/10",
    warn: "text-warn border-warn/50 bg-warn/10",
    bad: "text-bad border-bad/50 bg-bad/10",
    muted: "text-muted border-line bg-white/[0.02]",
    accent: "text-accent border-accent/50 bg-accent/10",
    gold: "text-gold border-gold/60 bg-gold/10",
    hero: "text-hero border-hero/50 bg-hero/10",
  }[tone];
  return <span className={`inline-block text-[0.68rem] font-bold uppercase tracking-[0.1em] border rounded-[2px] px-1.5 py-0.5 ${t}`}>{children}</span>;
}

export function peso(n: number): string {
  return "₱" + Math.round(n).toLocaleString("en-PH");
}

// ---------- celebrations ----------

export interface CelebrateDetail {
  title: string;
  sub?: string;
  icon?: string;
  kicker?: string;
}

export function celebrate(detail: CelebrateDetail) {
  window.dispatchEvent(new CustomEvent<CelebrateDetail>("tracker:celebrate", { detail }));
}

/** Pop-up banner with a particle burst, triggered by celebrate(). */
export function Celebrations() {
  const [queue, setQueue] = useState<(CelebrateDetail & { key: number })[]>([]);
  useEffect(() => {
    const on = (e: Event) => setQueue((q) => [...q, { ...(e as CustomEvent<CelebrateDetail>).detail, key: Date.now() + Math.random() }]);
    window.addEventListener("tracker:celebrate", on);
    return () => window.removeEventListener("tracker:celebrate", on);
  }, []);
  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 3600);
    return () => clearTimeout(t);
  }, [current]);
  if (!current) return null;
  const particles = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2;
    const dist = 90 + (i % 3) * 30;
    return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, c: ["#2ee6ff", "#ff3ddb", "#ffc940"][i % 3] };
  });
  return (
    <div key={current.key} className="toast fixed left-1/2 bottom-8 z-50 pointer-events-none" role="status">
      <div className="relative">
        {particles.map((p, i) => (
          <span
            key={i}
            className="particle absolute left-1/2 top-1/2 w-2 h-2 rotate-45"
            style={{ background: p.c, boxShadow: `0 0 8px ${p.c}`, ["--dx" as string]: `${p.dx}px`, ["--dy" as string]: `${p.dy}px` }}
          />
        ))}
        <div className="hud hud-gold pulse-gold px-6 py-4 flex items-center gap-4 min-w-72">
          <span className="text-4xl">{current.icon ?? "🏆"}</span>
          <div>
            <div className="font-display text-[0.65rem] uppercase text-gold">{current.kicker ?? "Achievement unlocked"}</div>
            <div className="font-display text-lg font-extrabold glow-text-gold">{current.title}</div>
            {current.sub && <div className="text-sm text-muted">{current.sub}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
