"use client";

import { useEffect, useMemo, useState } from "react";
import { dailyAdvice, generateTodos } from "@/lib/advice";
import { daysLeftInMonth, monthOf, summarize, uid, weekLogs } from "@/lib/finance";
import { GEAR, QUEST_XP, achievements } from "@/lib/game";
import { useTracker } from "../App";
import { Badge, Bar, Btn, Card, Meter, NumInput, Stat, celebrate, money } from "../ui";
import { Kit } from "../characters";
import WarChest from "../WarChest";
import { CURRENCIES } from "./Settings";
import KitChat from "../KitChat";
import { HELP } from "../help";

export default function Today({ goTo }: { goTo: (t: "income" | "pipeline" | "log" | "ads") => void }) {
  const { data, update, month, today } = useTracker();
  const s = useMemo(() => summarize(data, month), [data, month]);
  const auto = useMemo(() => dailyAdvice(data, today), [data, today]);
  const custom = data.briefing?.date === today ? data.briefing : null;
  const advice = custom ? { ...auto, headline: custom.headline, points: custom.points, inspiration: custom.inspiration ?? auto.inspiration } : auto;
  const wk = useMemo(() => weekLogs(data, today), [data, today]);
  const badges = useMemo(() => achievements(data, s, today), [data, s, today]);
  const todos = data.todos[today];
  const [newTodo, setNewTodo] = useState("");
  const isCurrent = month === monthOf(today);
  const bosses = data.deals.filter((d) => d.stage !== "won" && d.stage !== "lost").sort((a, b) => b.value - a.value).slice(0, 3);

  useEffect(() => {
    if (!todos) update((d) => void (d.todos[today] = generateTodos(d, today)));
  }, [todos, today, update]);

  const refreshTodos = () =>
    update((d) => {
      const existing = d.todos[today] ?? [];
      const texts = new Set(existing.map((t) => t.text));
      d.todos[today] = [...existing, ...generateTodos(d, today).filter((t) => !texts.has(t.text))];
    });

  const carryOver = () =>
    update((d) => {
      const prevDates = Object.keys(d.todos).filter((k) => k < today).sort();
      const prev = prevDates.length ? d.todos[prevDates[prevDates.length - 1]] : [];
      const existing = d.todos[today] ?? [];
      const texts = new Set(existing.map((t) => t.text));
      d.todos[today] = [...existing, ...prev.filter((t) => !t.done && !texts.has(t.text)).map((t) => ({ ...t, id: uid("todo"), done: false }))];
    });

  const toggle = (id: string) => {
    const list = todos ?? [];
    const item = list.find((x) => x.id === id);
    if (!item) return;
    const willBeDone = !item.done;
    update((d) => void (d.todos[today].find((x) => x.id === id)!.done = willBeDone));
    if (willBeDone && list.length > 1 && list.filter((x) => x.done).length === list.length - 1) {
      celebrate({ kicker: "Daily quests cleared", title: `+${list.length * QUEST_XP} XP`, sub: "Every quest done today. Legendary.", icon: "🏅", sfx: "SUGOI!" });
    }
  };

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const questDone = (todos ?? []).filter((t) => t.done).length;

  return (
    <div className="space-y-5">
      {!data.settings.playerName && <SetupCard />}
      <div className="grid md:grid-cols-2 gap-4">
        <Card glow="cyan">
          <Meter
            label="Shield · expenses covered"
            icon="🛡"
            tone="cyan"
            value={s.moneyMade}
            target={s.expenseTarget}
            sub={!s.expenseTarget ? "Add your monthly expenses in the Expenses tab to set your shield." : s.gapToExpenses > 0 ? `${money(s.gapToExpenses)} more to fully charge your shield` : "Shield at full power. Expenses are covered."}
          />
        </Card>
        <Card glow="hero">
          <Meter
            label="Power · monthly goal"
            icon="⚡"
            tone="hero"
            value={s.moneyMade}
            target={s.goal}
            sub={s.gapToGoal > 0 ? `${money(s.gapToGoal)} to the goal${isCurrent ? ` · ${daysLeftInMonth(today)} days left` : ""}` : "Goal conquered this month."}
          />
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Collected this month" value={money(s.moneyMade)} hint={`Retainers ${money(s.recurringCollected)} · deals ${money(s.dealCollected)}`} tone="good" />
        <Stat label="Retainers to collect" value={money(s.recurringPending)} hint={`of ${money(s.recurringCollected + s.recurringPending)} retainers this month`} tone="cyan" />
        <Stat label="Deals to collect" value={money(s.wonUnpaid)} hint="Closed, waiting for payment" tone="gold" />
        <Stat label="Month total if all lands" value={money(s.projected)} hint="Collected + everything still owed" />
        <Stat label="Bosses in the field" value={money(s.openPipeline)} hint="Not closed yet" tone="hero" />
        <Stat label="Ad spend" value={money(s.adSpend)} />
        <Stat label="Monthly bills" value={money(s.fixedExpenses)} hint={`${money(s.expensesPaid)} paid · ${money(s.billsLeft)} left`} />
        <Stat label="Extra spending" value={money(s.adHocExpenses)} tone={s.adHocExpenses ? "bad" : undefined} />
      </div>

      <WarChest />

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4 min-w-0">
          <Card
            title="Mission briefing"
            help={HELP.briefing}
            icon="📣"
            actions={
              custom && (
                <button className="text-base text-muted underline" onClick={() => update((d) => void delete d.briefing)}>
                  Kit rewrote this · reset
                </button>
              )
            }
          >
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
              <div className="shrink-0 text-center">
                <Kit size={104} talking className="bob" />
                <div className="font-display text-lg tracking-wide text-gold -mt-1">KIT</div>
              </div>
              <div className="bubble flex-1 p-4 sm:p-5">
                <p className="font-display text-2xl sm:text-[1.7rem] leading-tight tracking-wide text-[#15132b] mb-3">{advice.headline}</p>
                <ul className="space-y-2.5">
                  {advice.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-[1.02rem] leading-snug font-bold text-[#2a2748]">
                      <span className="text-[#e0306f] font-display text-xl leading-none mt-0.5">★</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-base font-extrabold italic text-[#6a3fb5]">&ldquo;{advice.inspiration}&rdquo;</p>
              </div>
            </div>
            <KitChat />
          </Card>
          {data.settings.dailyVerse && <Card glow="gold" title="Power verse" icon="✨">
            <blockquote className="relative">
              <p className="relative text-xl sm:text-[1.35rem] leading-relaxed font-extrabold">&ldquo;{advice.verse.text}&rdquo;</p>
              <footer className="mt-3"><span className="font-display text-xl tracking-wide text-gold">— {advice.verse.ref} (KJV)</span></footer>
            </blockquote>
          </Card>}
        </div>

        <Card
          title={`Daily quests ${questDone}/${todos?.length ?? 0}`}
          help={HELP.quests}
          icon="📜"
          glow="hero"
          className="lg:col-span-2"
          actions={
            <>
              <Btn onClick={refreshTodos} title="Add quests based on the latest numbers">New quests</Btn>
              <Btn onClick={carryOver} title="Bring over unfinished quests from the last day">Carry over</Btn>
            </>
          }
        >
          <div className="mb-4">
            <Bar pct={todos?.length ? questDone / todos.length : 0} tone="hero" thin />
          </div>
          <ul className="space-y-1.5">
            {(todos ?? []).map((t) => (
              <li key={t.id} className={`flex items-start gap-3 group px-2.5 py-2 rounded-[10px] border-2 transition ${t.done ? "bg-good/10 border-good/40" : "border-transparent hover:bg-white/[0.04]"}`}>
                <input type="checkbox" className="mt-0.5" checked={t.done} onChange={() => toggle(t.id)} aria-label={t.text} />
                <span className={`text-[1.02rem] flex-1 leading-snug font-bold ${t.done ? "line-through text-muted" : ""}`}>{t.text}</span>
                <span className={`font-display text-lg leading-none mt-0.5 ${t.done ? "text-good" : "text-gold"}`}>+{QUEST_XP}XP</span>
                <button
                  className="text-sm text-muted opacity-0 group-hover:opacity-100"
                  onClick={() => update((d) => void (d.todos[today] = d.todos[today].filter((x) => x.id !== t.id)))}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <form
            className="flex gap-2 mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTodo.trim()) return;
              update((d) => void (d.todos[today] = [...(d.todos[today] ?? []), { id: uid("todo"), text: newTodo.trim(), done: false, source: "manual" }]));
              setNewTodo("");
            }}
          >
            <input className="flex-1" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Add a quest" />
            <Btn kind="hero">Add</Btn>
          </form>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card help={HELP.bosses} title="Bosses to defeat" icon="⚔" glow="hero" actions={<Btn onClick={() => goTo("pipeline")}>All deals</Btn>}>
          {bosses.length === 0 ? (
            <p className="text-lg text-muted">No open deals. Time to hunt for new ones.</p>
          ) : (
            <ul className="space-y-4">
              {bosses.map((d) => (
                <li key={d.id}>
                  <div className="flex justify-between items-center gap-3 mb-2">
                    <span className="flex items-center gap-2 text-lg font-extrabold">
                      <span className="text-2xl" aria-hidden>👹</span>
                      {d.name}
                    </span>
                    <span className="font-display text-xl tracking-wide text-bad">{money(d.value)} HP</span>
                  </div>
                  <Bar pct={1} tone="bad" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card help={HELP.achievements} title={`Achievements · ${unlockedCount}/${badges.length}`} icon="🏆" glow="gold">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {badges.map((b) => (
              <div
                key={b.id}
                title={`${b.name}: ${b.desc}${GEAR[b.id] ? ` · Unlocks ${GEAR[b.id].name} for your hero` : ""}`}
                className={`relative text-center px-1.5 py-3 rounded-[10px] border-[3px] border-outline ${b.unlocked ? "bg-gold text-outline shadow-[3px_3px_0_#0b0a14] pulse-gold" : "bg-card-2 opacity-55"}`}
              >
                <div className="text-3xl leading-none">{b.unlocked ? b.icon : "🔒"}</div>
                <div className="font-display text-base tracking-wide mt-1.5 leading-tight">{b.name}</div>
                {GEAR[b.id] && <div className={`text-xs font-extrabold mt-1 ${b.unlocked || data.heroGear?.[b.id] ? "" : "text-muted"}`}>{data.heroGear?.[b.id] ? "✓ " : "+ "}{GEAR[b.id].name}</div>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card help={HELP.week} title="This week's stats" icon="✦" actions={<Btn kind="primary" onClick={() => goTo("log")}>Check in today</Btn>}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Leads" value={wk.leads} tone="cyan" />
          <Stat label="Booked calls" value={wk.bookedCalls} hint={wk.leads ? `${Math.round((wk.bookedCalls / wk.leads) * 100)}% of leads` : undefined} />
          <Stat label="Show-ups" value={wk.showUps} hint={wk.bookedCalls ? `${Math.round((wk.showUps / wk.bookedCalls) * 100)}% show rate` : undefined} />
          <Stat label="Closes" value={wk.closes} tone="gold" />
          <Stat label="Ad spend" value={money(wk.adSpend)} hint={wk.leads ? `${money(wk.adSpend / wk.leads)} per lead` : undefined} />
        </div>
        {wk.days === 0 && (
          <p className="text-base text-muted mt-4 flex items-center gap-2">
            <Badge tone="hero">Tip</Badge> Check in daily to build your streak and sharpen the briefing.
          </p>
        )}
      </Card>
    </div>
  );
}

/** First-run setup: who's playing, the business, currency and goal. Everything stays editable in Settings. */
function SetupCard() {
  const { data, update } = useTracker();
  const guessTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
  const [f, setF] = useState({
    playerName: "",
    businessName: data.settings.businessName ?? "",
    currency: data.settings.currency || "USD",
    monthlyGoal: data.settings.monthlyGoal ? String(data.settings.monthlyGoal) : "",
  });
  return (
    <Card title="Set up your HQ" icon="🚀" glow="hero">
      <p className="text-lg mb-3">Tell Kit who you are. You can change all of this later in Settings.</p>
      <form
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (!f.playerName.trim()) return;
          update((d) =>
            void Object.assign(d.settings, {
              playerName: f.playerName.trim(),
              businessName: f.businessName.trim() || undefined,
              currency: f.currency.trim().toUpperCase() || "USD",
              monthlyGoal: Number(f.monthlyGoal.replace(/[^\d.]/g, "")) || d.settings.monthlyGoal,
              timeZone: d.settings.timeZone || guessTz || undefined,
            }),
          );
        }}
      >
        <label className="flex flex-col gap-1 text-base text-muted">
          Your name (hero name)
          <input value={f.playerName} onChange={(e) => setF({ ...f, playerName: e.target.value })} placeholder="e.g. Alex" required />
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          Business name
          <input value={f.businessName} onChange={(e) => setF({ ...f, businessName: e.target.value })} placeholder="e.g. Bright Ads Co." />
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          Currency
          <select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          Monthly revenue goal
          <input inputMode="decimal" value={f.monthlyGoal} onChange={(e) => setF({ ...f, monthlyGoal: e.target.value })} placeholder="e.g. 20000" />
        </label>
        <Btn kind="primary" className="sm:col-span-2 lg:col-span-4">Start my game</Btn>
      </form>
    </Card>
  );
}
