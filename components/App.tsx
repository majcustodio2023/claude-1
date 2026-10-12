"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { monthOf, summarize, todayISO } from "@/lib/finance";
import { achievements, levelFor, logStreak, questStats, rankFor } from "@/lib/game";
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
import { Bar, Celebrations, celebrate, peso } from "./ui";

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
  ["today", "HQ", "◈"],
  ["income", "Income", "◆"],
  ["pipeline", "Boss Deals", "⚔"],
  ["expenses", "Expenses", "▼"],
  ["log", "Check-in", "✦"],
  ["tasks", "Missions", "◎"],
  ["team", "Squad", "⬢"],
  ["ads", "Ad Command", "◉"],
  ["settings", "Settings", "⚙"],
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
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <PlayerCard data={data} month={month} today={today} saving={saving} />
        <div className="flex items-center justify-end gap-3 mb-3">
          <span className="text-xs uppercase tracking-[0.12em] text-muted">Viewing month</span>
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
        </div>
        {!persistent && (
          <div className="mb-4 hud hud-gold text-sm p-3">
            No database is connected, so changes won&apos;t survive a redeploy. Set the Supabase variables described in the README.
          </div>
        )}
        <nav className="flex gap-1.5 overflow-x-auto pb-3 mb-5 -mx-4 px-4">
          {TABS.map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`btn whitespace-nowrap ${tab === id ? "btn-primary" : "btn-ghost"}`}
            >
              <span className="mr-1.5 opacity-80">{icon}</span>
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
      <Celebrations />
      <AchievementWatcher data={data} month={month} today={today} />
    </TrackerCtx.Provider>
  );
}

function PlayerCard({ data, month, today, saving }: { data: TrackerData; month: string; today: string; saving: string }) {
  const s = summarize(data, month);
  const lvl = levelFor(s.moneyMade, s.goal);
  const rank = rankFor(s);
  const streak = logStreak(data, today);
  const q = questStats(data, today);
  const rankColor = { bad: "text-bad", warn: "text-warn", accent: "text-accent", good: "text-good", gold: "text-gold glow-text-gold" }[rank.tone];
  return (
    <header className="hud hud-hero mt-4 mb-3 p-4 sm:p-5">
      <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="absolute inset-0 spin-slow" aria-hidden>
            <defs>
              <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#2ee6ff" />
                <stop offset="1" stopColor="#ff3ddb" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#ring)" strokeWidth="2" strokeDasharray="6 5" />
          </svg>
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2a4d" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="40" fill="none" stroke="#ffc940" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${Math.min(lvl.pct, 1) * 251.3} 251.3`}
              style={{ filter: "drop-shadow(0 0 4px #ffc940)", transition: "stroke-dasharray 900ms" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <div className="font-display text-[0.55rem] text-muted">LVL</div>
            <div className="font-display text-2xl sm:text-3xl font-extrabold leading-none glow-text-gold text-gold">{lvl.level}</div>
          </div>
        </div>
        <div className="flex-1 min-w-52">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-[0.12em]">MAJ</h1>
            <span className={`font-display text-xs font-semibold uppercase ${rankColor}`}>{rank.name}</span>
          </div>
          <p className="text-sm text-muted">{rank.tagline}</p>
          <div className="mt-2.5 space-y-1">
            <Bar pct={lvl.pct} tone="hero" thin />
            <div className="flex justify-between text-xs text-muted">
              <span>{peso(lvl.into)} / {peso(lvl.step)} XP</span>
              <span>{lvl.level >= 11 ? "Goal smashed" : `${peso(lvl.toNext)} to LVL ${lvl.level + 1}`}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
          <HeaderChip label="Streak" value={`${streak}🔥`} />
          <HeaderChip label="Quests" value={`${q.done}/${q.count}`} />
          <HeaderChip label="Quest XP" value={`+${q.xp}`} />
        </div>
      </div>
      <div className="flex justify-between text-[0.7rem] uppercase tracking-[0.14em] text-muted mt-3">
        <span>{new Date(today + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
        <span>{saving === "saving" ? "Syncing…" : saving === "saved" ? "Synced ✓" : saving === "error" ? "Sync failed" : "Online"}</span>
      </div>
    </header>
  );
}

function HeaderChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card-2/80 border border-line rounded-[3px] px-3 py-2 text-center min-w-20">
      <div className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="font-display font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/** Fires a celebration the first time each achievement unlocks on this device. */
function AchievementWatcher({ data, month, today }: { data: TrackerData; month: string; today: string }) {
  const unlocked = achievements(data, summarize(data, month), today).filter((a) => a.unlocked);
  const key = unlocked.map((a) => a.id).join(",");
  useEffect(() => {
    let seen: string[] | null = null;
    try {
      seen = JSON.parse(localStorage.getItem("tracker:achievements") ?? "null");
    } catch {}
    const ids = key ? key.split(",") : [];
    if (seen) {
      for (const a of unlocked.filter((x) => !seen!.includes(x.id))) celebrate({ title: a.name, sub: a.desc, icon: a.icon });
    }
    try {
      localStorage.setItem("tracker:achievements", JSON.stringify(Array.from(new Set([...(seen ?? []), ...ids]))));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
