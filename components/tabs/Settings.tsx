"use client";

import type { Settings } from "@/lib/types";
import { useTracker } from "../App";
import { Btn, Card, NumInput, TextInput } from "../ui";
import { HELP } from "../help";

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
      <Card icon="⚙" title="Data">
        <div className="flex gap-2 flex-wrap">
          <Btn onClick={exportJson}>Download backup (JSON)</Btn>
          <Btn
            onClick={async () => {
              await fetch("/api/login", { method: "DELETE" });
              window.location.href = "/login";
            }}
          >
            Sign out
          </Btn>
        </div>
        <p className="text-sm text-muted mt-2">Backups leave out Meta access tokens.</p>
      </Card>
    </div>
  );
}
