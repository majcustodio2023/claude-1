"use client";

import { useEffect, useMemo, useState } from "react";
import { dailyAdvice, generateTodos } from "@/lib/advice";
import { daysLeftInMonth, monthOf, summarize, uid, weekLogs } from "@/lib/finance";
import { QUEST_XP, achievements } from "@/lib/game";
import { useTracker } from "../App";
import { Badge, Bar, Btn, Card, Meter, Stat, celebrate, peso } from "../ui";

export default function Today({ goTo }: { goTo: (t: "income" | "pipeline" | "log" | "ads") => void }) {
  const { data, update, month, today } = useTracker();
  const s = useMemo(() => summarize(data, month), [data, month]);
  const advice = useMemo(() => dailyAdvice(data, today), [data, today]);
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
      celebrate({ title: "All quests cleared", sub: `+${list.length * QUEST_XP} XP today. Legendary.`, icon: "🏅" });
    }
  };

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const questDone = (todos ?? []).filter((t) => t.done).length;

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <Card glow="cyan">
          <Meter
            label="Shield · expenses covered"
            icon="🛡"
            tone="cyan"
            value={s.moneyMade}
            target={s.expenseTarget}
            sub={s.gapToExpenses > 0 ? `${peso(s.gapToExpenses)} more to fully charge your shield` : "Shield at full power. Expenses are covered."}
          />
        </Card>
        <Card glow="hero">
          <Meter
            label="Power · monthly goal"
            icon="⚡"
            tone="hero"
            value={s.moneyMade}
            target={s.goal}
            sub={s.gapToGoal > 0 ? `${peso(s.gapToGoal)} to the goal${isCurrent ? ` · ${daysLeftInMonth(today)} days left` : ""}` : "Goal conquered this month."}
          />
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Retainers collected" value={peso(s.recurringCollected)} hint={`${peso(s.recurringPending)} still incoming`} tone="cyan" />
        <Stat label="Boss loot (deals)" value={peso(s.dealCollected)} hint={`${peso(s.wonUnpaid)} won, not yet paid`} tone="gold" />
        <Stat label="One-time drops" value={peso(s.oneTimeCollected)} tone="good" />
        <Stat label="If retainers land" value={peso(s.projected)} hint="Collected + incoming" />
        <Stat label="Bosses in the field" value={peso(s.openPipeline)} hint="Counts once collected" tone="hero" />
        <Stat label="Ad spend" value={peso(s.adSpend)} />
        <Stat label="Monthly upkeep" value={peso(s.fixedExpenses)} hint={`${peso(s.expensesPaid)} marked paid`} />
        <Stat label="Extra spending" value={peso(s.adHocExpenses)} tone={s.adHocExpenses ? "bad" : undefined} />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Card title="Mission briefing" icon="◈">
            <p className="text-xl leading-snug font-bold text-accent glow-text-cyan mb-4">{advice.headline}</p>
            <ul className="space-y-2.5 mb-4">
              {advice.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-[0.95rem]">
                  <span className="text-hero mt-0.5">▸</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm italic text-muted">&ldquo;{advice.inspiration}&rdquo;</p>
          </Card>
          <Card glow="gold" title="Power verse" icon="✝">
            <blockquote>
              <p className="text-lg leading-relaxed font-semibold">&ldquo;{advice.verse.text}&rdquo;</p>
              <footer className="font-display text-xs text-gold mt-3 glow-text-gold">{advice.verse.ref} · KJV</footer>
            </blockquote>
          </Card>
        </div>

        <Card
          title={`Daily quests · ${questDone}/${todos?.length ?? 0}`}
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
              <li key={t.id} className={`flex items-start gap-3 group px-2 py-1.5 rounded-[3px] transition ${t.done ? "bg-good/5" : "hover:bg-white/[0.03]"}`}>
                <input type="checkbox" className="mt-0.5" checked={t.done} onChange={() => toggle(t.id)} aria-label={t.text} />
                <span className={`text-[0.95rem] flex-1 leading-snug ${t.done ? "line-through text-muted" : ""}`}>{t.text}</span>
                <span className={`font-display text-[0.62rem] mt-1 ${t.done ? "text-good" : "text-gold"}`}>+{QUEST_XP}</span>
                <button
                  className="text-xs text-muted opacity-0 group-hover:opacity-100"
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
        <Card title="Bosses to defeat" icon="⚔" glow="hero" actions={<Btn onClick={() => goTo("pipeline")}>All deals</Btn>}>
          {bosses.length === 0 ? (
            <p className="text-muted">No open deals. Time to hunt for new ones.</p>
          ) : (
            <ul className="space-y-4">
              {bosses.map((d) => (
                <li key={d.id}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="font-semibold">{d.name}</span>
                    <span className="font-display text-sm text-bad">{peso(d.value)} HP</span>
                  </div>
                  <Bar pct={1} tone="bad" thin />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Achievements · ${unlockedCount}/${badges.length}`} icon="🏆" glow="gold">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {badges.map((b) => (
              <div
                key={b.id}
                title={`${b.name}: ${b.desc}`}
                className={`relative text-center px-1.5 py-2.5 rounded-[3px] border ${b.unlocked ? "border-gold/60 bg-gold/10 pulse-gold" : "border-line bg-white/[0.02] opacity-45 grayscale"}`}
              >
                <div className="text-2xl leading-none">{b.unlocked ? b.icon : "🔒"}</div>
                <div className="text-[0.68rem] font-bold uppercase tracking-wide mt-1.5 leading-tight">{b.name}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="This week's stats" icon="✦" actions={<Btn kind="primary" onClick={() => goTo("log")}>Check in today</Btn>}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Leads" value={wk.leads} tone="cyan" />
          <Stat label="Booked calls" value={wk.bookedCalls} hint={wk.leads ? `${Math.round((wk.bookedCalls / wk.leads) * 100)}% of leads` : undefined} />
          <Stat label="Show-ups" value={wk.showUps} hint={wk.bookedCalls ? `${Math.round((wk.showUps / wk.bookedCalls) * 100)}% show rate` : undefined} />
          <Stat label="Closes" value={wk.closes} tone="gold" />
          <Stat label="Ad spend" value={peso(wk.adSpend)} hint={wk.leads ? `${peso(wk.adSpend / wk.leads)} per lead` : undefined} />
        </div>
        {wk.days === 0 && (
          <p className="text-sm text-muted mt-3">
            <Badge tone="hero">Tip</Badge> Check in daily to build your streak and sharpen the briefing.
          </p>
        )}
      </Card>
    </div>
  );
}
