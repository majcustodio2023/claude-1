"use client";

import type { Settings } from "@/lib/types";
import { useTracker } from "../App";
import { Btn, Card, NumInput } from "../ui";

export default function SettingsTab() {
  const { data, update } = useTracker();
  const set = (patch: Partial<Settings>) => update((d) => void Object.assign(d.settings, patch));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `agency-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <Card title="Targets">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs text-muted flex flex-col gap-1">
            Monthly revenue goal
            <NumInput value={data.settings.monthlyGoal} onChange={(v) => set({ monthlyGoal: v ?? 0 })} />
          </label>
          <label className="text-xs text-muted flex flex-col gap-1">
            Stay-afloat target (blank = sum of expenses)
            <NumInput value={data.settings.expenseTargetOverride} onChange={(v) => set({ expenseTargetOverride: v || undefined })} placeholder="Auto" />
          </label>
          <label className="text-xs text-muted flex flex-col gap-1">
            Default target cost per lead
            <NumInput value={data.settings.targetCpl} onChange={(v) => set({ targetCpl: v ?? 0 })} />
          </label>
          <label className="text-xs text-muted flex flex-col gap-1">
            Default target ROAS
            <NumInput value={data.settings.targetRoas} onChange={(v) => set({ targetRoas: v ?? 0 })} />
          </label>
        </div>
      </Card>
      <Card title="Data">
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
        <p className="text-xs text-muted mt-2">Backups leave out Meta access tokens.</p>
      </Card>
    </div>
  );
}
