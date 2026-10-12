"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { monthOf, todayISO } from "@/lib/finance";
import type { TrackerData } from "@/lib/types";
import Today from "./tabs/Today";
import Income from "./tabs/Income";
import Pipeline from "./tabs/Pipeline";
import Expenses from "./tabs/Expenses";
import Log from "./tabs/Log";
import Tasks from "./tabs/Tasks";
import Team from "./tabs/Team";
import Ads from "./tabs/Ads";
import SettingsTab from "./tabs/Settings";

type Updater = (draft: TrackerData) => void;

interface Ctx {
  data: TrackerData;
  update: (fn: Updater) => void;
  reload: () => Promise<void>;
  month: string;
  setMonth: (m: string) => void;
  today: string;
}

const TrackerCtx = createContext<Ctx | null>(null);
export const useTracker = () => {
  const c = useContext(TrackerCtx);
  if (!c) throw new Error("useTracker outside provider");
  return c;
};

const TABS = [
  ["today", "Today"],
  ["income", "Income"],
  ["pipeline", "Pipeline"],
  ["expenses", "Expenses"],
  ["log", "Daily log"],
  ["tasks", "Tasks"],
  ["team", "Team"],
  ["ads", "Meta Ads"],
  ["settings", "Settings"],
] as const;
type TabId = (typeof TABS)[number][0];

export default function App() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [persistent, setPersistent] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [tab, setTab] = useState<TabId>("today");
  const today = todayISO();
  const [month, setMonth] = useState(monthOf(today));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<TrackerData | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (res.status === 401) return void (window.location.href = "/login");
    const json = await res.json();
    if (!res.ok) return setError(json.error ?? "Could not load data");
    latest.current = json.data;
    setData(json.data);
    setPersistent(json.persistent);
  }, []);

  useEffect(() => {
    reload();
    const saved = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (TABS.some(([id]) => id === saved)) setTab(saved as TabId);
  }, [reload]);

  const flush = useCallback(async () => {
    if (!latest.current) return;
    setSaving("saving");
    const res = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: latest.current }) });
    setSaving(res.ok ? "saved" : "error");
  }, []);

  const update = useCallback(
    (fn: Updater) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        fn(next);
        latest.current = next;
        return next;
      });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 600);
    },
    [flush],
  );

  if (error) return <div className="p-6 text-bad">{error}</div>;
  if (!data) return <div className="p-6 text-muted">Loading…</div>;

  const go = (id: TabId) => {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <TrackerCtx.Provider value={{ data, update, reload, month, setMonth, today }}>
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <header className="flex items-center justify-between gap-3 py-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold">Agency Tracker</h1>
            <p className="text-xs text-muted">
              {new Date(today + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">{saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : saving === "error" ? "Save failed" : ""}</span>
            <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
          </div>
        </header>
        {!persistent && (
          <div className="mb-4 rounded-xl border border-warn/40 bg-warn/10 text-sm p-3">
            No database is connected, so changes won&apos;t survive a redeploy. Set the Supabase variables described in the README.
          </div>
        )}
        <nav className="flex gap-1 overflow-x-auto pb-2 mb-4 border-b border-line -mx-4 px-4">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-lg ${tab === id ? "bg-accent text-white dark:text-black" : "hover:bg-accent-soft"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        {tab === "today" && <Today goTo={go} />}
        {tab === "income" && <Income />}
        {tab === "pipeline" && <Pipeline />}
        {tab === "expenses" && <Expenses />}
        {tab === "log" && <Log />}
        {tab === "tasks" && <Tasks />}
        {tab === "team" && <Team />}
        {tab === "ads" && <Ads />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </TrackerCtx.Provider>
  );
}
