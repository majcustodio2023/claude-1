"use client";

import type { Settings } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { useTracker } from "../App";
import { Btn, Card, NumInput, TextInput } from "../ui";
import { HELP } from "../help";
import LookSettings from "../LookSettings";
import DataSources from "../DataSources";
import { Glyph, Icon } from "../icons";
import { PERSONAS } from "@/lib/personas";
import { DEFAULT_FUN_PERCENT } from "@/lib/fun";
import { DEFAULT_CUSTOM_COVER_PRICE } from "@/lib/covers";
import { sfx, startMusic, stopMusic } from "@/lib/sound";

function Volume({ label, value, onChange, onTest }: { label: string; value: number; onChange: (v: number) => void; onTest: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-base font-extrabold mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{value === 0 ? "Off" : `${Math.round(value * 100)}%`}</span>
      </div>
      <div className="flex items-center gap-2">
        <input type="range" min={0} max={100} step={5} value={Math.round(value * 100)} onChange={(e) => onChange(Number(e.target.value) / 100)} className="flex-1 accent-[var(--color-gold)] h-8" aria-label={`${label} volume`} />
        <Btn type="button" onClick={onTest} disabled={value === 0}>
          Test
        </Btn>
      </div>
    </div>
  );
}

export const CURRENCIES = ["USD", "PHP", "EUR", "GBP", "AUD", "CAD", "SGD", "NZD", "INR", "AED", "MYR", "IDR", "THB", "VND", "JPY", "HKD", "ZAR", "MXN", "BRL"];
const LOCALES: [string, string][] = [["", "Device default"], ["en-US", "English (US)"], ["en-GB", "English (UK)"], ["en-PH", "English (Philippines)"], ["en-AU", "English (Australia)"], ["en-CA", "English (Canada)"], ["en-IN", "English (India)"], ["en-SG", "English (Singapore)"], ["es-ES", "Español"], ["fr-FR", "Français"], ["de-DE", "Deutsch"], ["pt-BR", "Português (Brasil)"]];

export default function SettingsTab() {
  const { data, update } = useTracker();
  const set = (patch: Partial<Settings>) => update((d) => void Object.assign(d.settings, patch));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <nav className="hud p-3 flex gap-2 flex-wrap" aria-label="Settings sections">
        {[
          ["look", "palette", "Look & layout"],
          ["profile", "user", "Profile"],
          ["targets", "target", "Targets"],
          ["money", "income", "Money"],
          ["kit", "fox", "Kit"],
          ["sound", "speaker", "Sound"],
          ["connections", "link", "Connections"],
          ["sources", "chart", "Data sources"],
          ["data", "gear", "Data"],
        ].map(([id, icon, label]) => (
          <a key={id} href={`#set-${id}`} onClick={(e) => (e.preventDefault(), document.getElementById(`set-${id}`)?.scrollIntoView({ behavior: "smooth" }))} className="btn btn-ghost flex items-center gap-2">
            <Icon name={icon} size={20} />
            {label}
          </a>
        ))}
      </nav>
      <div id="set-look" className="scroll-mt-4">
        <LookSettings />
      </div>
      <div id="set-profile" className="scroll-mt-4" />
      <Card icon="🦸" title="Profile & business" help={HELP.settings}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="text-sm text-muted flex flex-col gap-1">
            Your name (hero name)
            <TextInput value={data.settings.playerName} onChange={(v) => set({ playerName: v.trim() || undefined })} placeholder="Hero" />
          </label>
          <label className="text-sm text-muted flex flex-col gap-1">
            Business name
            <TextInput value={data.settings.businessName} onChange={(v) => set({ businessName: v.trim() || undefined })} />
          </label>
          <label className="text-sm text-muted flex flex-col gap-1">
            Currency
            <select value={data.settings.currency || "USD"} onChange={(e) => set({ currency: e.target.value })}>
              {Array.from(new Set([data.settings.currency || "USD", ...CURRENCIES])).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted flex flex-col gap-1">
            Number &amp; date format
            <select value={data.settings.locale ?? ""} onChange={(e) => set({ locale: e.target.value || undefined })}>
              {LOCALES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted flex flex-col gap-1">
            Time zone (blank = this device&apos;s)
            <TextInput value={data.settings.timeZone} onChange={(v) => set({ timeZone: v.trim() || undefined })} placeholder={typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"} />
          </label>
          <label className="text-sm text-muted flex items-center gap-2 mt-6">
            <input type="checkbox" checked={Boolean(data.settings.dailyVerse)} onChange={(e) => set({ dailyVerse: e.target.checked })} />
            Show a daily Bible verse
          </label>
          <label className="text-sm text-muted flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            What your business does (Kit uses this to tailor advice)
            <TextInput value={data.settings.businessDescription} onChange={(v) => set({ businessDescription: v.trim() || undefined })} placeholder="e.g. We run Facebook ads and funnels for local clinics, plus a small SaaS." />
          </label>
        </div>
      </Card>
      <div id="set-targets" className="scroll-mt-4" />
      <Card icon="🎯" title="Targets">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-sm text-muted flex flex-col gap-1">
            Monthly revenue goal
            <NumInput value={data.settings.monthlyGoal} onChange={(v) => set({ monthlyGoal: v ?? 0 })} />
          </label>
          <label className="text-sm text-muted flex flex-col gap-1">
            Stay-afloat target (blank = sum of expenses)
            <NumInput value={data.settings.expenseTargetOverride} onChange={(v) => set({ expenseTargetOverride: v || undefined })} placeholder="Auto" />
          </label>
          <label className="text-sm text-muted flex flex-col gap-1">
            Default target cost per lead
            <NumInput value={data.settings.targetCpl} onChange={(v) => set({ targetCpl: v ?? 0 })} />
          </label>
          <label className="text-sm text-muted flex flex-col gap-1">
            Default target ROAS
            <NumInput value={data.settings.targetRoas} onChange={(v) => set({ targetRoas: v ?? 0 })} />
          </label>
        </div>
      </Card>
      <div id="set-money" className="scroll-mt-4" />
      <Card icon="💰" title="Money">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="text-sm text-muted flex flex-col gap-1">
            Fun money: share of what&apos;s spare each month (%)
            <NumInput value={data.settings.funPercent ?? DEFAULT_FUN_PERCENT} onChange={(v) => set({ funPercent: Math.min(Math.max(v ?? DEFAULT_FUN_PERCENT, 0), 100) })} />
          </label>
          <label className="text-sm text-muted flex flex-col gap-1">
            Safety buffer (months of bills to keep)
            <select value={data.settings.cashBufferMonths ?? 3} onChange={(e) => set({ cashBufferMonths: Number(e.target.value) })}>
              {[0, 1, 2, 3, 4, 5, 6, 9, 12].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "No buffer" : `${n} month${n > 1 ? "s" : ""}`}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted flex flex-col gap-1">
            Income tab shows
            <select value={data.settings.incomeView ?? "profit"} onChange={(e) => set({ incomeView: e.target.value as "profit" | "gross" })}>
              <option value="profit">Profit (after team pay for each client)</option>
              <option value="gross">Gross (what clients pay)</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-muted mt-2">Your accounts (bank, e-wallets) and their balances are managed in the War chest on HQ.</p>
      </Card>

      <div id="set-kit" className="scroll-mt-4" />
      <Card icon="🦊" title="Kit, your sidekick">
        <div className="text-base text-muted mb-2">Personality (changes how Kit talks, sounds and looks)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {[...PERSONAS, { id: "custom", name: "Your own", emoji: "✎", tagline: "Describe it yourself in Kit's chat on HQ" }].map((p) => {
            const on = (data.settings.kitPersona ?? "kit") === p.id;
            return (
              <button key={p.id} type="button" aria-pressed={on} onClick={() => set({ kitPersona: p.id })} className={`text-left rounded-[10px] p-2.5 border-[3px] flex gap-2.5 items-start ${on ? "border-gold bg-gold/10" : "border-line bg-card-2/60"}`}>
                <Glyph value={p.emoji} size={26} className="text-accent mt-0.5" />
                <span>
                  <span className="block font-extrabold">{p.name}</span>
                  <span className="block text-sm text-muted leading-snug">{p.tagline}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div id="set-sound" className="scroll-mt-4" />
      <Card icon={<Icon name="speaker" size={24} />} title="Music & sound">
        <div className="grid sm:grid-cols-2 gap-4">
          <Volume label="Battle music" value={data.settings.sound?.music ?? 0.5} onChange={(music) => set({ sound: { ...data.settings.sound, music } })} onTest={() => (startMusic(), setTimeout(stopMusic, 4000))} />
          <Volume label="Sound effects" value={data.settings.sound?.sfx ?? 0.7} onChange={(sfxVol) => set({ sound: { ...data.settings.sound, sfx: sfxVol } })} onTest={() => (sfx("crit"), setTimeout(() => sfx("heal"), 450), setTimeout(() => sfx("coin"), 900))} />
        </div>
        <p className="text-sm text-muted mt-2">Plays in boss battles and when you get coins or loot. Slide to 0 to turn it off. All sounds are made by the app itself.</p>
      </Card>

      <Card icon={<Icon name="coin" size={24} />} title="Shop prices">
        <label className="text-sm text-muted flex flex-col gap-1 max-w-xs">
          Unlock your own banner picture (coins)
          <NumInput value={data.settings.customCoverPrice ?? DEFAULT_CUSTOM_COVER_PRICE} onChange={(v) => set({ customCoverPrice: v == null ? undefined : Math.max(0, Math.round(v)) })} />
        </label>
      </Card>

      <div id="set-connections" className="scroll-mt-4" />
      <Card icon="🔗" title="Connections">
        <ul className="space-y-2 text-base">
          {[
            ["Kit chat (Claude)", data.integrations?.kit, "Paste the key in Kit's chat on HQ."],
            ["Kit's real voice (OpenAI)", data.integrations?.voice, "Open \"Make the voice real\" in Kit's chat on HQ."],
            ["Creatives (Higgsfield)", data.integrations?.higgsfield, "Add the key in the Creatives tab."],
            [`Meta ad accounts (${data.adAccounts.length})`, data.adAccounts.some((a) => a.hasToken), "Connect them in Ad Command."],
          ].map(([name, on, how]) => (
            <li key={name as string} className="flex items-center gap-3 flex-wrap">
              <span className={`w-3 h-3 rounded-full ${on ? "bg-good" : "bg-line"}`} />
              <span className="font-bold">{name}</span>
              <span className={on ? "text-good" : "text-muted"}>{on ? "Connected" : `Not set up · ${how}`}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted mt-2">Keys are typed straight into the app and kept encrypted on the server; they never show again.</p>
      </Card>

      <div id="set-sources" className="scroll-mt-4" />
      <DataSources />

      <div id="set-data" className="scroll-mt-4" />
      <Card icon="⚙" title="Data">
        <div className="flex gap-2 flex-wrap">
          <Btn onClick={exportJson}>Download backup (JSON)</Btn>
          <RestoreFile />
          <Btn
            onClick={async () => {
              await fetch("/api/login", { method: "DELETE" });
              window.location.href = "/login";
            }}
          >
            Sign out
          </Btn>
        </div>
        <p className="text-sm text-muted mt-2">Backups leave out Meta access tokens and API keys.</p>
        <DailySnapshots />
      </Card>
    </div>
  );
}

/** Loads a downloaded backup file back in, replacing what's there now. */
function RestoreFile() {
  const { reload } = useTracker();
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const onFile = async (file: File) => {
    setMsg("");
    try {
      const parsed = JSON.parse(await file.text());
      const data = parsed?.data && parsed?.settings === undefined ? parsed.data : parsed;
      if (!data || typeof data !== "object" || !data.settings || !Array.isArray(data.streams) || !Array.isArray(data.deals)) throw new Error("That file isn't a tracker backup.");
      if (!window.confirm(`Replace everything in the tracker with the backup "${file.name}"?`)) return;
      const res = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Restore failed");
      await reload();
      setMsg("Backup restored.");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  return (
    <>
      <Btn onClick={() => input.current?.click()}>Restore from backup file</Btn>
      <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={(e) => (e.target.files?.[0] && onFile(e.target.files[0]), (e.target.value = ""))} />
      {msg && <p className="w-full text-base font-bold" role="status">{msg}</p>}
    </>
  );
}

/** The database keeps one snapshot a day; any of them can be put back. */
function DailySnapshots() {
  const { reload } = useTracker();
  const [list, setList] = useState<{ day: string; savedAt: string }[] | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/backups", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setList(j.backups ?? []))
      .catch(() => setList([]));
  }, []);
  if (!list?.length) return null;
  const restore = async (day: string) => {
    if (!window.confirm(`Put the tracker back to how it was at the end of ${day}? Anything changed since then is replaced.`)) return;
    setBusy(day);
    setMsg("");
    try {
      const res = await fetch("/api/backups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Restore failed");
      await reload();
      setMsg(`Restored ${day}.`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="mt-4">
      <div className="text-lg font-extrabold">Daily snapshots</div>
      <p className="text-sm text-muted mb-2">Saved automatically, one per day, so a bad edit can be undone.</p>
      <ul className="space-y-1.5">
        {list.map((b) => (
          <li key={b.day} className="flex items-center gap-3 flex-wrap">
            <span className="text-base font-bold tabular-nums">{b.day}</span>
            <span className="text-sm text-muted">last saved {new Date(b.savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
            <Btn onClick={() => restore(b.day)} disabled={Boolean(busy)}>
              {busy === b.day ? "Restoring…" : "Restore"}
            </Btn>
          </li>
        ))}
      </ul>
      {msg && <p className="text-base font-bold mt-2" role="status">{msg}</p>}
    </div>
  );
}
