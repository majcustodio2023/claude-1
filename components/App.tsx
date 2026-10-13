"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { configureLocale, locale, monthOf, summarize, todayISO } from "@/lib/finance";
import { GEAR, achievements, levelFor, logStreak, questStats, rankFor } from "@/lib/game";
import type { TrackerData } from "@/lib/types";
import Today from "./tabs/Today";
import Income from "./tabs/Income";
import Pipeline from "./tabs/Pipeline";
import Expenses from "./tabs/Expenses";
import Log from "./tabs/Log";
import Tasks from "./tabs/Tasks";
import Team from "./tabs/Team";
import Ads from "./tabs/Ads";
import Creatives from "./tabs/Creatives";
import SettingsTab from "./tabs/Settings";
import { Bar, Celebrations, celebrate, money } from "./ui";
import { Hero } from "./characters";
import MonthPicker from "./MonthPicker";

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
  ["today", "HQ", "🏠"],
  ["income", "Income", "💰"],
  ["pipeline", "Boss Deals", "⚔️"],
  ["expenses", "Expenses", "🧾"],
  ["log", "Check-in", "📝"],
  ["tasks", "Missions", "🎯"],
  ["team", "Squad", "🦸"],
  ["ads", "Ad Command", "📡"],
  ["creatives", "Creatives", "🎨"],
  ["settings", "Settings", "⚙️"],
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
    configureLocale(json.data.settings);
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

  if (data) configureLocale(data.settings);
  if (error) return <div className="p-6 text-bad">{error}</div>;
  if (!data) return <div className="min-h-screen grid place-content-center font-display text-3xl tracking-wide">Loading…</div>;

  const go = (id: TabId) => {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <TrackerCtx.Provider value={{ data, update, reload, month, setMonth, today }}>
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <PlayerCard data={data} month={month} today={today} saving={saving} />
        <div className="flex items-center justify-end gap-3 mb-4">
          <span className="text-base font-extrabold text-muted">Viewing month</span>
          <MonthPicker value={month} onChange={setMonth} current={monthOf(today)} />
        </div>
        {!persistent && (
          <div className="mb-5 hud hud-gold text-base p-4">
            No database is connected, so changes won&apos;t survive a redeploy. Set the Supabase variables described in the README.
          </div>
        )}
        <nav className="flex gap-2.5 overflow-x-auto pt-1 pb-4 mb-5 -mx-4 px-4">
          {TABS.map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`btn whitespace-nowrap ${tab === id ? "btn-primary -rotate-2" : "btn-ghost"}`}
            >
              <span className="mr-1.5">{icon}</span>
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
        {tab === "creatives" && <Creatives />}
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
  const mood = s.moneyMade >= s.expenseTarget ? "hype" : s.pctExpenses < 0.5 ? "focus" : "ready";
  const rankBg = { bad: "bg-bad", warn: "bg-warn", accent: "bg-accent", good: "bg-good", gold: "bg-gold" }[rank.tone];
  return (
    <header className="hud hud-hero mt-5 mb-4 overflow-hidden">
      <div className="speed-lines" />
      <span className="sparkle" style={{ left: "8%", top: "16%" }} />
      <span className="sparkle" style={{ left: "30%", top: "70%", animationDelay: "0.6s" }} />
      <span className="sparkle" style={{ right: "6%", top: "12%", animationDelay: "1.1s" }} />
      <div className="relative flex items-end gap-3 sm:gap-6 flex-wrap px-4 sm:px-6 pt-4">
        <div className="relative shrink-0 -mb-1">
          <Hero mood={mood} size={196} gear={Object.keys(data.heroGear ?? {})} className="bob drop-shadow-[5px_5px_0_#0b0a14] max-sm:w-[136px] max-sm:h-auto" />
          <div className="absolute top-1 -left-3 rotate-[-10deg]">
            <div className="bg-gold text-outline border-[3px] border-outline rounded-full w-16 h-16 grid place-content-center text-center shadow-[3px_3px_0_#0b0a14]">
              <div className="font-display text-sm leading-none">LVL</div>
              <div className="font-display text-3xl leading-none">{lvl.level}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-60 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="comic-num text-5xl sm:text-6xl leading-none text-ink uppercase">{data.settings.playerName || "Hero"}</h1>
            <span className={`font-display text-xl tracking-wide px-3 pt-1 pb-0.5 border-[3px] border-outline rounded-md text-outline shadow-[3px_3px_0_#0b0a14] rotate-[2deg] ${rankBg}`}>{rank.name}</span>
          </div>
          <p className="text-lg text-muted font-bold mt-1">{rank.tagline}</p>
          <div className="mt-3 space-y-1.5 max-w-xl">
            <Bar pct={lvl.pct} tone="hero" />
            <div className="flex justify-between text-base font-bold">
              <span className="text-muted">XP {money(lvl.into)} / {money(lvl.step)}</span>
              <span className="text-hero">{lvl.level >= 11 ? "Goal smashed!" : `${money(lvl.toNext)} to LVL ${lvl.level + 1}`}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5 w-full lg:w-auto pb-4">
          <HeaderChip label="Streak" value={`${streak} 🔥`} />
          <HeaderChip label="Quests" value={`${q.done}/${q.count}`} />
          <HeaderChip label="XP" value={`+${q.xp}`} />
        </div>
      </div>
      <div className="relative flex justify-between gap-3 flex-wrap text-sm font-extrabold uppercase tracking-wide bg-outline/70 border-t-[3px] border-outline px-4 sm:px-6 py-2 text-muted">
        <span>{new Date(today + "T00:00:00").toLocaleDateString(locale(), { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
        <span className={saving === "error" ? "text-bad" : "text-good"}>{saving === "saving" ? "Saving…" : saving === "saved" ? "Saved ✓" : saving === "error" ? "Save failed" : "Ready"}</span>
      </div>
    </header>
  );
}

function HeaderChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card-2 border-[3px] border-outline rounded-[10px] px-3 py-2 text-center min-w-24 shadow-[3px_3px_0_#0b0a14]">
      <div className="text-sm font-extrabold uppercase text-muted">{label}</div>
      <div className="font-display text-2xl tracking-wide">{value}</div>
    </div>
  );
}

/** Fires a celebration the first time each achievement unlocks on this device. */
function AchievementWatcher({ data, month, today }: { data: TrackerData; month: string; today: string }) {
  const { update } = useTracker();
  const unlocked = achievements(data, summarize(data, month), today).filter((a) => a.unlocked);
  const key = unlocked.map((a) => a.id).join(",");
  // Gear is earned the first time an achievement unlocks and kept for good.
  const newGear = unlocked.filter((a) => GEAR[a.id] && !data.heroGear?.[a.id]).map((a) => a.id).join(",");
  useEffect(() => {
    if (!newGear) return;
    update((d) => {
      d.heroGear = { ...d.heroGear };
      for (const id of newGear.split(",")) d.heroGear[id] ??= today;
    });
  }, [newGear, today, update]);
  useEffect(() => {
    let seen: string[] | null = null;
    try {
      seen = JSON.parse(localStorage.getItem("tracker:achievements") ?? "null");
    } catch {}
    const ids = key ? key.split(",") : [];
    if (seen) {
      for (const a of unlocked.filter((x) => !seen!.includes(x.id))) celebrate({ title: a.name, sub: GEAR[a.id] ? `${a.desc} · New gear: ${GEAR[a.id].name}!` : a.desc, icon: a.icon, sfx: "UNLOCKED!" });
    }
    try {
      localStorage.setItem("tracker:achievements", JSON.stringify(Array.from(new Set([...(seen ?? []), ...ids]))));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
