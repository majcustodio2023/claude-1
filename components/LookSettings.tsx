"use client";

import type { ReactNode } from "react";
import { DENSITIES, LAYOUTS, PRESETS, STYLES, THEMES, resolveLook, type Appearance, type LayoutId, type StyleId } from "@/lib/appearance";
import { useTracker } from "./App";
import { Card } from "./ui";
import { Icon } from "./icons";
import { HELP } from "./help";

/** Settings → Look: ready-made looks, color themes, design style, layout, size and header. */
export default function LookSettings() {
  const { data, update } = useTracker();
  const look = resolveLook(data.settings.appearance);
  const set = (patch: Appearance) => update((d) => void (d.settings.appearance = { ...d.settings.appearance, ...patch }));
  const presetOn = (p: Appearance) => Object.entries(p).every(([k, v]) => look[k as keyof typeof look] === v);

  return (
    <Card icon="palette" title="Look & layout" glow="hero" help={HELP.look}>
      <Section title="Ready-made looks" note="One tap sets the theme, style, layout and size together. Fine-tune below.">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESETS.map((p) => {
            const t = THEMES.find((x) => x.id === p.look.theme)!;
            return (
              <Choice key={p.id} on={presetOn(p.look)} onClick={() => set({ calm: false, ...p.look })}>
                <div className="h-14 rounded-[8px] mb-2 flex items-end gap-1.5 p-2" style={{ background: t.bg, border: `2px solid ${t.line}` }}>
                  <span className="h-full flex-1 rounded-[4px]" style={{ background: t.card }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: t.accent }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: t.hero }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: t.gold }} />
                </div>
                <div className="font-extrabold text-base">{p.name}</div>
                <div className="text-sm text-muted leading-snug">{p.about}</div>
              </Choice>
            );
          })}
        </div>
      </Section>

      <Section title="Color theme" note="Pixel palettes from around Dawnterra, light and dark.">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {THEMES.map((t) => (
            <Choice key={t.id} on={look.theme === t.id} onClick={() => set({ theme: t.id })}>
              <div className="rounded-[8px] p-2 mb-2" style={{ background: t.bg, border: `2px solid ${t.line}` }}>
                <div className="rounded-[5px] p-1.5 space-y-1" style={{ background: t.card }}>
                  <div className="h-1.5 w-3/4 rounded-full" style={{ background: t.ink, opacity: 0.85 }} />
                  <div className="h-1.5 w-1/2 rounded-full" style={{ background: t.muted, opacity: 0.7 }} />
                  <div className="flex gap-1 pt-0.5">
                    {[t.accent, t.hero, t.gold, t.good].map((c) => (
                      <span key={c} className="w-3.5 h-3.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="font-extrabold text-base">{t.name}</div>
              <div className="text-sm text-muted">{t.light ? "Light" : "Dark"}</div>
            </Choice>
          ))}
        </div>
      </Section>

      <Section title="Frame style" note="Every style is pixel art like the city; this changes the borders and shadows.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STYLES.map((st) => (
            <Choice key={st.id} on={look.style === st.id} onClick={() => set({ style: st.id })}>
              <StyleSample id={st.id} />
              <div className="font-extrabold text-base mt-2">{st.name}</div>
              <div className="text-sm text-muted leading-snug">{st.about}</div>
            </Choice>
          ))}
        </div>
      </Section>

      <Section title="Layout" note="Where the menu sits and how the page is arranged.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LAYOUTS.map((l) => (
            <Choice key={l.id} on={look.layout === l.id} onClick={() => set({ layout: l.id })}>
              <LayoutSample id={l.id} />
              <div className="font-extrabold text-base mt-2">{l.name}</div>
              <div className="text-sm text-muted leading-snug">{l.about}</div>
            </Choice>
          ))}
        </div>
      </Section>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Toggle label="Text size" value={look.density} options={DENSITIES.map((d) => [d.id, d.name])} onChange={(v) => set({ density: v as Appearance["density"] })} />
        <Toggle
          label="Header"
          value={look.header}
          options={[
            ["hero", "Big hero card"],
            ["slim", "Slim bar"],
          ]}
          onChange={(v) => set({ header: v as Appearance["header"] })}
        />
        <Toggle
          label="Page width"
          value={look.width}
          options={[
            ["normal", "Normal"],
            ["wide", "Wide"],
          ]}
          onChange={(v) => set({ width: v as Appearance["width"] })}
        />
        <Toggle
          label="Motion"
          value={look.calm ? "calm" : "lively"}
          options={[
            ["lively", "Animated"],
            ["calm", "Still"],
          ]}
          onChange={(v) => set({ calm: v === "calm" })}
        />
      </div>
    </Card>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="font-display text-xl tracking-wide">{title}</div>
      {note && <p className="text-base text-muted mb-2">{note}</p>}
      <div className={note ? "" : "mt-2"}>{children}</div>
    </div>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`relative text-left rounded-[12px] p-3 border-[3px] transition ${on ? "border-gold bg-gold/10" : "border-line bg-card-2/60 hover:border-muted"}`}
    >
      {on && (
        <span className="absolute -top-2.5 -right-2.5 bg-gold text-outline rounded-full p-0.5 border-2 border-outline">
          <Icon name="check" size={18} />
        </span>
      )}
      {children}
    </button>
  );
}

function Toggle({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-base font-extrabold text-muted mb-1.5">{label}</div>
      <div className="flex rounded-[10px] border-2 border-line overflow-hidden">
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v} className={`flex-1 px-2 py-2 text-sm font-extrabold ${value === v ? "bg-gold text-outline" : "bg-card-2/60 text-muted hover:text-ink"}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

/** A tiny panel drawn the way each pixel style draws it. */
function StyleSample({ id }: { id: StyleId }) {
  const panel: Record<StyleId, React.CSSProperties> = {
    pixel: { border: "3px solid var(--color-outline)", background: "var(--color-card)", boxShadow: "inset 0 0 0 2px var(--pix-hi), 3px 3px 0 var(--pix-shadow)" },
    "pixel-clean": { border: "2px solid var(--color-line)", background: "var(--color-card)" },
    "pixel-chunky": { border: "4px solid var(--color-outline)", background: "var(--color-card)", boxShadow: "5px 5px 0 var(--pix-shadow)" },
  };
  return (
    <div className="h-20 bg-bg p-2.5 flex flex-col justify-between overflow-hidden">
      <div className="px-2 py-1.5" style={panel[id]}>
        <div style={{ fontFamily: '"Pixel Digits", "Pixelify Sans", sans-serif', fontSize: 15 }} className="text-ink leading-tight font-semibold">
          Power up
        </div>
        <div className="mt-1.5 w-full bg-field" style={{ border: id === "pixel-clean" ? "1px solid var(--color-line)" : "2px solid var(--color-outline)" }}>
          <div style={{ background: "repeating-linear-gradient(90deg, var(--color-hero) 0 8px, color-mix(in srgb, var(--color-hero) 75%, black) 8px 10px)", height: 8, width: "65%" }} />
        </div>
      </div>
    </div>
  );
}

/** A tiny wireframe of each layout. */
function LayoutSample({ id }: { id: LayoutId }) {
  const block = "bg-line rounded-[3px]";
  return (
    <div className="h-20 rounded-[8px] bg-bg p-2 flex gap-1.5 border-2 border-line">
      {id === "sidebar" && (
        <div className="w-1/4 flex flex-col gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-2 ${i === 0 ? "bg-gold" : "bg-line"} rounded-[2px]`} />
          ))}
        </div>
      )}
      <div className="flex-1 flex flex-col gap-1">
        {id === "tabs" && (
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-2 flex-1 ${i === 0 ? "bg-gold" : "bg-line"} rounded-[2px]`} />
            ))}
          </div>
        )}
        <div className={`flex-1 ${block} opacity-70`} />
        <div className="flex gap-1 flex-1">
          <div className={`flex-1 ${block} opacity-50`} />
          <div className={`flex-1 ${block} opacity-50`} />
        </div>
        {id === "dock" && (
          <div className="flex gap-1 justify-center">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-2.5 w-2.5 ${i === 0 ? "bg-gold" : "bg-line"} rounded-full`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
