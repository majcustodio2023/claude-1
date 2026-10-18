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
import Calendar from "./tabs/Calendar";
import Clients from "./tabs/Clients";
import Team from "./tabs/Team";
import Ads from "./tabs/Ads";
import Creatives from "./tabs/Creatives";
import City from "./tabs/City";
import SettingsTab from "./tabs/Settings";
import HeroTab from "./tabs/HeroTab";
import BossFight from "./BossFight";
import { Bar, Celebrations, Toasts, celebrate, money, toast } from "./ui";
import { KitBubble } from "./KitChat";
import { CoverLayer } from "./covers";
import { activeCover } from "@/lib/covers";
import { Hero, HeroStyleContext, KitStyleContext } from "./characters";
import { claimRewards, pendingRewards } from "@/lib/loot";
import { RARITY } from "@/lib/items";
import MonthPicker from "./MonthPicker";
import { Icon, WithIcons, type IconName } from "./icons";
import { applyLook, resolveLook } from "@/lib/appearance";
import { setVolumes, sfx } from "@/lib/sound";

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
  ["today", "HQ", "home"],
  ["city", "City", "globe"],
  ["hero", "Hero & Shop", "shop"],
  ["income", "Income", "income"],
  ["pipeline", "Boss Deals", "swords"],
  ["expenses", "Expenses", "receipt"],
  ["log", "Check-in", "checkin"],
  ["clients", "Clients", "clients"],
  ["tasks", "Missions", "target"],
  ["calendar", "Calendar", "calendar"],
  ["team", "Squad", "squad"],
  ["ads", "Ad Command", "radar"],
  ["creatives", "Creatives", "palette"],
  ["settings", "Settings", "gear"],
] as const satisfies readonly (readonly [string, string, IconName])[];
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

  const lookKey = JSON.stringify(data?.settings.appearance ?? {});
  useEffect(() => applyLook(JSON.parse(lookKey)), [lookKey]);
  const soundKey = JSON.stringify(data?.settings.sound ?? {});
  useEffect(() => setVolumes(JSON.parse(soundKey)), [soundKey]);

  if (data) configureLocale(data.settings);
  if (error) return <div className="p-6 text-bad">{error}</div>;
  if (!data) return <div className="min-h-screen grid place-content-center font-display text-3xl tracking-wide">Loading…</div>;

  const look = resolveLook(data.settings.appearance);
  const go = (id: TabId) => {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
    // Each tab opens at its top: if you'd scrolled past where the tabs start, jump back up there.
    requestAnimationFrame(() => {
      const el = document.getElementById("tab-top");
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 12;
      if (window.scrollY > top) window.scrollTo({ top: Math.max(top, 0) });
    });
  };

  return (
    <TrackerCtx.Provider value={{ data, update, reload, month, setMonth, today }}>
     <HeroStyleContext.Provider value={{ look: data.game?.look, items: Object.values(data.game?.equipped ?? {}).filter((x): x is string => Boolean(x)) }}>
     <KitStyleContext.Provider value={{ persona: data.settings.kitPersona, fur: data.game?.kitLook?.fur, eyes: data.game?.kitLook?.eyes, items: Object.values(data.game?.equipped ?? {}).filter((x): x is string => Boolean(x)) }}>
      <div className={`${look.width === "wide" || look.layout === "sidebar" ? "max-w-[1500px]" : "max-w-6xl"} mx-auto px-4 ${look.layout === "dock" ? "pb-32" : "pb-20"}`}>
        {look.header === "slim" ? (
          <SlimHeader data={data} month={month} today={today} saving={saving} onSettings={() => go("settings")} />
        ) : (
          <PlayerCard data={data} month={month} today={today} saving={saving} onSettings={() => go("settings")} />
        )}
        <div className="flex items-center justify-end gap-x-3 gap-y-2 mb-4 flex-wrap">
          <span className="text-base font-extrabold text-muted max-sm:hidden">Viewing month</span>
          <MonthPicker value={month} onChange={setMonth} current={monthOf(today)} />
        </div>
        {!persistent && (
          <div className="mb-5 hud hud-gold text-base p-4">
            No database is connected, so changes won&apos;t survive a redeploy. Set the Supabase variables described in the README.
          </div>
        )}
        <div className={look.layout === "sidebar" ? "lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6 lg:items-start" : ""}>
        {look.layout === "sidebar" && (
          <nav className="hidden lg:flex flex-col gap-2 sticky top-4 hud p-3" aria-label="Sections">
            {TABS.map(([id, label, icon]) => (
              <button key={id} onClick={() => go(id)} className={`btn text-left flex items-center gap-2.5 ${tab === id ? "btn-primary" : "btn-ghost"}`} aria-current={tab === id ? "page" : undefined}>
                <Icon name={icon} size={22} />
                {label}
              </button>
            ))}
          </nav>
        )}
        <div className="min-w-0" id="tab-top">
        {look.layout !== "dock" && (
          <nav className={`flex gap-2.5 overflow-x-auto pt-1 pb-4 mb-5 -mx-4 px-4 ${look.layout === "sidebar" ? "lg:hidden" : ""}`} aria-label="Sections">
            {TABS.map(([id, label, icon]) => (
              <button key={id} onClick={() => go(id)} className={`btn whitespace-nowrap flex items-center gap-2 ${tab === id ? "btn-primary -rotate-2" : "btn-ghost"}`} aria-current={tab === id ? "page" : undefined}>
                <Icon name={icon} size={20} />
                {label}
              </button>
            ))}
          </nav>
        )}
        {tab === "today" && <Today goTo={go} />}
        {tab === "city" && <City goTo={(t) => go(t as TabId)} />}
        {tab === "income" && <Income goTo={go} />}
        {tab === "pipeline" && <Pipeline />}
        {tab === "expenses" && <Expenses />}
        {tab === "log" && <Log />}
        {tab === "clients" && <Clients />}
        {tab === "tasks" && <Tasks />}
        {tab === "calendar" && <Calendar />}
        {tab === "team" && <Team goTo={go} />}
        {tab === "ads" && <Ads />}
        {tab === "creatives" && <Creatives />}
        {tab === "settings" && <SettingsTab />}
        {tab === "hero" && <HeroTab />}
        </div>
        </div>
      </div>
      {look.layout === "dock" && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t-[3px] border-outline" aria-label="Sections">
          <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto px-2 py-2">
            {TABS.map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={tab === id ? "page" : undefined}
                className={`flex flex-col items-center gap-1 min-w-[4.6rem] px-2 py-1.5 rounded-[10px] text-xs font-extrabold whitespace-nowrap ${tab === id ? "bg-gold text-outline" : "text-muted hover:text-ink"}`}
              >
                <Icon name={icon} size={24} />
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}
      <KitBubble raised={look.layout === "dock"} />
      <Celebrations />
      <Toasts />
      <AchievementWatcher data={data} month={month} today={today} />
      <RewardWatcher data={data} today={today} />
     </KitStyleContext.Provider>
     </HeroStyleContext.Provider>
    </TrackerCtx.Provider>
  );
}

function SettingsButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`btn btn-ghost flex items-center gap-2 ${className}`} title="Settings: look, theme, profile and more" aria-label="Settings">
      <Icon name="gear" size={22} />
      <span className="max-sm:hidden">Settings</span>
    </button>
  );
}

function SaveState({ saving }: { saving: string }) {
  return <span className={saving === "error" ? "text-bad" : "text-good"}>{saving === "saving" ? "Saving…" : saving === "saved" ? "Saved ✓" : saving === "error" ? "Save failed" : "Ready"}</span>;
}

/** A one-line header: small hero, name, level and coins, for layouts that want the room. */
function SlimHeader({ data, month, today, saving, onSettings }: { data: TrackerData; month: string; today: string; saving: string; onSettings: () => void }) {
  const s = summarize(data, month);
  const lvl = levelFor(s.moneyMade, s.goal);
  const rank = rankFor(s);
  const streak = logStreak(data, today);
  return (
    <header className="hud mt-4 mb-4 px-3 sm:px-4 py-2.5 flex items-center gap-3 sm:gap-4">
      <Hero mood="ready" size={64} className="shrink-0 -my-1 max-sm:w-12 max-sm:h-auto" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-x-2 flex-wrap">
          <span className="font-display text-2xl sm:text-3xl tracking-wide leading-none truncate max-w-full">{data.settings.playerName || "Hero"}</span>
          <span className="text-sm font-extrabold uppercase text-gold whitespace-nowrap">LVL {lvl.level} · {rank.name}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <div className="flex-1 max-w-md">
            <Bar pct={lvl.pct} tone="hero" thin />
          </div>
          <span className="flex items-center gap-1 text-base font-extrabold" title="Check-in streak"><Icon name="flame" size={18} className="text-warn" />{streak}</span>
          <span className="flex items-center gap-1 text-base font-extrabold" title="Coins"><Icon name="coin" size={18} className="text-gold" />{data.game?.coins ?? 0}</span>
          <span className="text-sm font-extrabold max-md:hidden"><SaveState saving={saving} /></span>
        </div>
      </div>
      <SettingsButton onClick={onSettings} />
    </header>
  );
}

function PlayerCard({ data, month, today, saving, onSettings }: { data: TrackerData; month: string; today: string; saving: string; onSettings: () => void }) {
  const s = summarize(data, month);
  const lvl = levelFor(s.moneyMade, s.goal);
  const rank = rankFor(s);
  const streak = logStreak(data, today);
  const q = questStats(data, today);
  const mood = s.moneyMade >= s.expenseTarget ? "hype" : s.pctExpenses < 0.5 ? "focus" : "ready";
  const rankBg = { bad: "bg-bad", warn: "bg-warn", accent: "bg-accent", good: "bg-good", gold: "bg-gold" }[rank.tone];
  const cover = activeCover(data);
  return (
    <header className="hud hud-hero mt-5 mb-4 overflow-hidden">
      <CoverLayer id={cover} image={data.game?.coverImage} />
      {cover === "classic" && <div className="speed-lines" />}
      <span className="sparkle" style={{ left: "8%", top: "16%" }} />
      <span className="sparkle" style={{ left: "30%", top: "70%", animationDelay: "0.6s" }} />
      <span className="sparkle" style={{ right: "6%", top: "12%", animationDelay: "1.1s" }} />
      <div className="absolute top-3 right-3 z-10">
        <SettingsButton onClick={onSettings} />
      </div>
      <div className="relative flex items-end gap-3 sm:gap-6 flex-wrap px-4 sm:px-6 pt-4">
        <div className="relative shrink-0 -mb-1">
          <Hero mood={mood} size={196} gear={Object.keys(data.heroGear ?? {})} className="bob drop-shadow-[5px_5px_0_var(--color-outline)] max-sm:w-[136px] max-sm:h-auto" />
          <div className="absolute top-1 -left-3 rotate-[-10deg]">
            <div className="bg-gold text-outline border-[3px] border-outline rounded-full w-16 h-16 grid place-content-center text-center shadow-[3px_3px_0_var(--color-outline)]">
              <div className="font-display text-sm leading-none">LVL</div>
              <div className="font-display text-3xl leading-none">{lvl.level}</div>
            </div>
          </div>
        </div>
        <div className={`flex-1 min-w-60 pb-4 ${cover === "classic" ? "" : "[text-shadow:0_2px_0_#0b0a14,0_0_10px_rgba(11,10,20,0.95)]"}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="comic-num text-5xl sm:text-6xl leading-none text-ink uppercase">{data.settings.playerName || "Hero"}</h1>
            <span className={`font-display text-xl tracking-wide px-3 pt-1 pb-0.5 border-[3px] border-outline rounded-md text-outline shadow-[3px_3px_0_var(--color-outline)] rotate-[2deg] ${rankBg}`}>{rank.name}</span>
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
          <HeaderChip label="Coins" value={`${data.game?.coins ?? 0} 🪙`} />
        </div>
      </div>
      <div className="relative flex justify-between gap-3 flex-wrap text-sm font-extrabold uppercase tracking-wide bg-card-2 border-t-[3px] border-outline px-4 sm:px-6 py-2 text-muted">
        <span>{new Date(today + "T00:00:00").toLocaleDateString(locale(), { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
        <SaveState saving={saving} />
      </div>
    </header>
  );
}

function HeaderChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card-2 border-[3px] border-outline rounded-[10px] px-3 py-2 text-center min-w-24 shadow-[3px_3px_0_var(--color-outline)]">
      <div className="text-sm font-extrabold uppercase text-muted">{label}</div>
      <div className="font-display text-2xl tracking-wide flex items-center justify-center gap-1"><WithIcons text={value} size={22} /></div>
    </div>
  );
}

/** Pays coins and loot for anything newly finished, and starts boss fights for deals just paid off. */
function RewardWatcher({ data, today }: { data: TrackerData; today: string }) {
  const { update } = useTracker();
  const pendingKey = pendingRewards(data).map((p) => p.key).join(",");
  const boss = data.game?.bossQueue?.find((id) => data.deals.some((d) => d.id === id));
  useEffect(() => {
    if (!pendingKey && data.game) return;
    const draft = structuredClone(data);
    const first = !draft.game;
    const events = claimRewards(draft, today);
    update((d) => void (d.game = draft.game));
    if (first) toast("+100 🪙 starter coins! Spend them in Hero & Shop");
    if (events.some((e) => e.item)) sfx("loot");
    else if (events.some((e) => e.coins)) sfx("coin");
    for (const ev of events) {
      if (ev.item) celebrate({ kicker: ev.chest ? "Loot chest opened" : "Surprise loot drop", title: ev.item.name, sub: `${RARITY[ev.item.rarity].label} item · from "${ev.text}". Equip it in Hero & Shop.`, icon: "🎁", sfx: "LOOT!" });
      if (ev.coins) toast(`+${ev.coins} 🪙 ${ev.text.length > 34 ? ev.text.slice(0, 32) + "…" : ev.text}`);
    }
    // Only when something new is finished.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey, Boolean(data.game)]);
  // The fight stays open until claimed, even though paying out takes it off the queue.
  const [fighting, setFighting] = useState<string | null>(null);
  useEffect(() => {
    if (boss && !fighting) setFighting(boss);
  }, [boss, fighting]);
  if (!fighting) return null;
  return <BossFight key={fighting} dealId={fighting} onClose={() => setFighting(null)} />;
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
