"use client";

import { useEffect, useMemo, useState } from "react";
import { dailyAdvice, generateTodos } from "@/lib/advice";
import { daysLeftInMonth, monthOf, summarize, uid, weekLogs } from "@/lib/finance";
import { useTracker } from "../App";
import { Btn, Card, Meter, Stat, peso } from "../ui";

export default function Today({ goTo }: { goTo: (t: "income" | "pipeline" | "log" | "ads") => void }) {
  const { data, update, month, today } = useTracker();
  const s = useMemo(() => summarize(data, month), [data, month]);
  const advice = useMemo(() => dailyAdvice(data, today), [data, today]);
  const wk = useMemo(() => weekLogs(data, today), [data, today]);
  const todos = data.todos[today];
  const [newTodo, setNewTodo] = useState("");
  const isCurrent = month === monthOf(today);

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

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <Meter
            label="Monthly expenses covered"
            value={s.moneyMade}
            target={s.expenseTarget}
            sub={s.gapToExpenses > 0 ? `${peso(s.gapToExpenses)} still needed to stay afloat` : "Expenses covered for the month"}
          />
        </Card>
        <Card>
          <Meter
            label="Monthly revenue goal"
            value={s.moneyMade}
            target={s.goal}
            sub={s.gapToGoal > 0 ? `${peso(s.gapToGoal)} to go${isCurrent ? `, ${daysLeftInMonth(today)} days left` : ""}` : "Goal reached"}
          />
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Recurring collected" value={peso(s.recurringCollected)} hint={`${peso(s.recurringPending)} still expected`} />
        <Stat label="From closed deals" value={peso(s.dealCollected)} hint={`${peso(s.wonUnpaid)} won but unpaid`} />
        <Stat label="One-time income" value={peso(s.oneTimeCollected)} />
        <Stat label="If retainers land" value={peso(s.projected)} hint="Collected + expected recurring" />
        <Stat label="Open pipeline" value={peso(s.openPipeline)} hint="Not counted until collected" />
        <Stat label="Ad spend (month)" value={peso(s.adSpend)} />
        <Stat label="Fixed expenses" value={peso(s.fixedExpenses)} hint={`${peso(s.expensesPaid)} marked paid`} />
        <Stat label="Extra spending" value={peso(s.adHocExpenses)} />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <Card title="Today's advice" className="lg:col-span-3">
          <p className="font-medium mb-3">{advice.headline}</p>
          <ul className="space-y-2 text-sm list-disc pl-5 mb-4">
            {advice.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="text-sm italic text-muted mb-4">{advice.inspiration}</p>
          <blockquote className="border-l-4 border-accent pl-3 text-sm">
            <p>&ldquo;{advice.verse.text}&rdquo;</p>
            <footer className="text-muted mt-1">{advice.verse.ref} (KJV)</footer>
          </blockquote>
        </Card>

        <Card
          title="To-do today"
          className="lg:col-span-2"
          actions={
            <>
              <Btn onClick={refreshTodos} title="Add suggestions based on the latest numbers">Suggest</Btn>
              <Btn onClick={carryOver} title="Bring over unfinished items from the last day">Carry over</Btn>
            </>
          }
        >
          <ul className="space-y-1">
            {(todos ?? []).map((t) => (
              <li key={t.id} className="flex items-start gap-2 group">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={t.done}
                  onChange={() => update((d) => void (d.todos[today].find((x) => x.id === t.id)!.done = !t.done))}
                />
                <span className={`text-sm flex-1 ${t.done ? "line-through text-muted" : ""}`}>{t.text}</span>
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
            className="flex gap-2 mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTodo.trim()) return;
              update((d) => void (d.todos[today] = [...(d.todos[today] ?? []), { id: uid("todo"), text: newTodo.trim(), done: false, source: "manual" }]));
              setNewTodo("");
            }}
          >
            <input className="flex-1" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Add a to-do" />
            <Btn kind="primary">Add</Btn>
          </form>
        </Card>
      </div>

      <Card title="This week" actions={<Btn onClick={() => goTo("log")}>Log today</Btn>}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Leads" value={wk.leads} />
          <Stat label="Booked calls" value={wk.bookedCalls} hint={wk.leads ? `${Math.round((wk.bookedCalls / wk.leads) * 100)}% of leads` : undefined} />
          <Stat label="Show-ups" value={wk.showUps} hint={wk.bookedCalls ? `${Math.round((wk.showUps / wk.bookedCalls) * 100)}% show rate` : undefined} />
          <Stat label="Closes" value={wk.closes} />
          <Stat label="Ad spend" value={peso(wk.adSpend)} hint={wk.leads ? `${peso(wk.adSpend / wk.leads)} per lead` : undefined} />
        </div>
      </Card>
    </div>
  );
}
