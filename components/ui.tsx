"use client";

import { useEffect, useState, type ReactNode } from "react";
import { money } from "@/lib/finance";
import { Hero, SfxBurst } from "./characters";

type Glow = "cyan" | "hero" | "gold" | "good";
const GLOW_CLASS: Record<Glow, string> = { cyan: "", hero: "hud-hero", gold: "hud-gold", good: "hud-good" };
const CAPTION_CLASS: Record<Glow, string> = { cyan: "caption-cyan", hero: "caption-hero", gold: "", good: "caption-good" };

export function Card({ title, icon, actions, children, className = "", glow = "cyan", help }: { title?: ReactNode; icon?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; glow?: Glow; help?: ReactNode }) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <section className={`hud ${GLOW_CLASS[glow]} p-4 sm:p-5 ${className}`}>
      {(title || actions || help) && (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            {title && (
              <h2 className={`caption ${CAPTION_CLASS[glow]}`}>
                {icon && <span aria-hidden>{icon}</span>}
                {title}
              </h2>
            )}
            {help && <HelpButton open={showHelp} onClick={() => setShowHelp((v) => !v)} />}
          </div>
          {actions && <div className="flex gap-2 flex-wrap items-center">{actions}</div>}
        </div>
      )}
      {help && showHelp && <HelpPanel onClose={() => setShowHelp(false)}>{help}</HelpPanel>}
      {children}
    </section>
  );
}

function HelpButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? "Hide help" : "How this works"}
      title="How this works"
      className={`shrink-0 w-9 h-9 rounded-full border-[3px] border-outline font-display text-xl leading-none shadow-[2px_2px_0_#0b0a14] ${open ? "bg-gold text-outline" : "bg-card-2 text-gold hover:bg-gold hover:text-outline"}`}
    >
      ?
    </button>
  );
}

/** "How this works" box opened by a section's ? button. Pass a list of short steps or tips. */
function HelpPanel({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="mb-4 p-4 relative bg-[#fff8ec] text-[#2a2748] border-[3px] border-outline rounded-[18px] shadow-[4px_4px_0_#0b0a14]" role="note">
      <button type="button" className="absolute top-2 right-3 text-xl font-bold text-[#6a3fb5]" onClick={onClose} aria-label="Close help">
        ✕
      </button>
      <div className="font-display text-xl tracking-wide text-[#15132b] mb-2">How this works</div>
      <div className="text-[1.02rem] leading-snug font-bold space-y-1.5 [&_li]:flex [&_li]:gap-2 [&_li]:before:content-['★'] [&_li]:before:text-[#e0306f] pr-6">{children}</div>
    </div>
  );
}

export type BarTone = "cyan" | "hero" | "gold" | "good" | "bad";
const TONE_TEXT: Record<BarTone, string> = { cyan: "text-accent", hero: "text-hero", gold: "text-gold", good: "text-good", bad: "text-bad" };

export function Bar({ pct, tone = "cyan", thin }: { pct: number; tone?: BarTone; thin?: boolean }) {
  return (
    <div className={`bar bar-${tone} ${thin ? "bar-thin" : ""}`} role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="fill" style={{ width: `${Math.max(Math.min(pct, 1), 0) * 100}%` }} />
    </div>
  );
}

export function Meter({ label, icon, value, target, sub, tone }: { label: string; icon?: ReactNode; value: number; target: number; sub?: ReactNode; tone: BarTone }) {
  const pct = target > 0 ? value / target : 0;
  const t = pct >= 1 ? "gold" : tone;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-2xl tracking-wide flex items-center gap-2">
          {icon && <span aria-hidden>{icon}</span>}
          {label}
        </span>
        <span className={`comic-num text-4xl ${TONE_TEXT[t]}`}>{Math.round(pct * 100)}%</span>
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="comic-num text-5xl leading-none">{money(value)}</span>
        <span className="text-lg text-muted font-bold">of {money(target)}</span>
      </div>
      <Bar pct={pct} tone={t} />
      {sub && <div className="text-base text-muted font-bold">{sub}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: BarTone }) {
  return (
    <div className="relative bg-card-2 border-[3px] border-outline rounded-[10px] p-3.5 shadow-[4px_4px_0_var(--color-outline)]">
      <div className="text-sm text-muted font-extrabold uppercase tracking-wide">{label}</div>
      <div className={`comic-num text-3xl mt-1 ${tone ? TONE_TEXT[tone] : "text-ink"}`}>{value}</div>
      {hint && <div className="text-sm text-muted mt-0.5">{hint}</div>}
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
    const clean = text.replace(/[^\d.-]/g, "");
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
    good: "bg-good text-outline",
    warn: "bg-warn text-outline",
    bad: "bg-bad text-outline",
    muted: "bg-line text-ink",
    accent: "bg-accent text-outline",
    gold: "bg-gold text-outline",
    hero: "bg-hero text-outline",
  }[tone];
  return <span className={`inline-block font-display text-[0.95rem] leading-none tracking-wide border-2 border-outline rounded-md px-2 pt-1 pb-0.5 shadow-[2px_2px_0_var(--color-outline)] ${t}`}>{children}</span>;
}

export { money };

// ---------- celebrations ----------

export interface CelebrateDetail {
  title: string;
  sub?: string;
  icon?: string;
  kicker?: string;
  /** Big comic sound effect, e.g. "KA-CHING!" */
  sfx?: string;
}

export function celebrate(detail: CelebrateDetail) {
  window.dispatchEvent(new CustomEvent<CelebrateDetail>("tracker:celebrate", { detail }));
}

/** Anime-style impact frame: flash, speed lines, SFX burst and the hero cheering. */
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
    document.body.classList.remove("shake");
    void document.body.offsetWidth;
    document.body.classList.add("shake");
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 3400);
    return () => clearTimeout(t);
  }, [current]);
  if (!current) return null;
  return (
    <div key={current.key} className="fixed inset-0 z-50 pointer-events-none overflow-hidden" role="status">
      <div className="impact-flash absolute inset-0 bg-white" />
      <div className="impact-lines absolute inset-[-20%]" />
      <div className="sfx-in absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,560px)]">
        <div className="relative flex items-end justify-center">
          <Hero mood="hype" size={150} className="bob -mr-6 relative z-10 drop-shadow-[6px_6px_0_#0b0a14]" />
          <SfxBurst text={current.sfx ?? "POW!"} className="w-56 sm:w-64 -mb-2" />
        </div>
        <div className="hud hud-gold -mt-3 mx-auto max-w-md px-5 py-4 text-center !animate-none">
          <div className="caption mb-2">{current.kicker ?? "Achievement unlocked"}</div>
          <div className="font-display text-3xl tracking-wide">
            <span className="mr-2">{current.icon ?? "🏆"}</span>
            {current.title}
          </div>
          {current.sub && <div className="text-base text-muted font-bold mt-1">{current.sub}</div>}
        </div>
      </div>
    </div>
  );
}
