"use client";

import { useEffect, useMemo, useState } from "react";
import { calendarItems, daysInMonth, monthGrid, ordinal, sortItems, type CalItem } from "@/lib/calendar";
import { locale, monthOf, uid } from "@/lib/finance";
import type { CalEvent } from "@/lib/ical";
import type { Quadrant } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Btn, Card, celebrate, money, toast } from "../ui";
import { EditButton, SaveButton } from "../editable";
import { HELP } from "../help";
import { Icon, type IconName } from "../icons";

const KIND: Record<CalItem["kind"], { label: string; chip: string; icon: IconName }> = {
  pay: { label: "Pay day", chip: "bg-good text-outline", icon: "income" },
  bill: { label: "Bill due", chip: "bg-bad text-outline", icon: "receipt" },
  deal: { label: "Deal closes", chip: "bg-gold text-outline", icon: "swords" },
  task: { label: "Mission", chip: "bg-accent text-outline", icon: "target" },
  clientTask: { label: "Client task", chip: "bg-hero text-outline", icon: "clients" },
  google: { label: "Your calendar", chip: "bg-card-2 text-ink border-2 border-line", icon: "calendar" },
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const QUADS: [Quadrant, string][] = [
  ["do", "Do first"],
  ["schedule", "Schedule & build"],
  ["delegate", "Delegate"],
];

const dayLabel = (date: string) => new Date(date + "T00:00:00").toLocaleDateString(locale(), { weekday: "long", month: "long", day: "numeric" });
const monthLabel = (m: string) => new Date(m + "-01T00:00:00").toLocaleDateString(locale(), { month: "long", year: "numeric" });
const timeLabel = (t?: string) => (t ? new Date(`2000-01-01T${t}:00`).toLocaleTimeString(locale(), { hour: "numeric", minute: "2-digit" }) : "");

function useGoogleEvents(month: string, connected: boolean) {
  const { data } = useTracker();
  const [state, setState] = useState<{ month: string; events: CalEvent[]; error?: string; loading: boolean }>({ month, events: [], loading: false });
  const [nonce, setNonce] = useState(0);
  const tz = data.settings.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  useEffect(() => {
    if (!connected) return setState({ month, events: [], loading: false });
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    const q = new URLSearchParams({ from: `${month}-01`, to: `${month}-${daysInMonth(month)}`, tz });
    fetch(`/api/calendar?${q}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { events?: CalEvent[]; error?: string }) => live && setState({ month, events: j.events ?? [], error: j.error, loading: false }))
      .catch(() => live && setState({ month, events: [], error: "Couldn't reach your calendar.", loading: false }));
    return () => {
      live = false;
    };
  }, [month, connected, tz, nonce]);
  return { ...state, refresh: () => setNonce((n) => n + 1) };
}

export default function Calendar() {
  const { data, month, today } = useTracker();
  const connected = Boolean(data.integrations?.calendar);
  const google = useGoogleEvents(month, connected);
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked && monthOf(picked) === month ? picked : monthOf(today) === month ? today : `${month}-01`;

  const items = useMemo(() => {
    const own = calendarItems(data, month);
    const gcal: CalItem[] = google.events.map((e, i) => ({ id: `g:${i}`, date: e.date, kind: "google", title: e.title, time: e.time, location: e.location, allDay: e.allDay }));
    return sortItems([...own, ...gcal]);
  }, [data, month, google.events]);
  const byDay = useMemo(() => {
    const m = new Map<string, CalItem[]>();
    for (const it of items) m.set(it.date, [...(m.get(it.date) ?? []), it]);
    return m;
  }, [items]);

  const due = items.filter((i) => i.kind === "pay" && !i.done).reduce((a, i) => a + (i.amount ?? 0), 0);
  const bills = items.filter((i) => i.kind === "bill" && !i.done).reduce((a, i) => a + (i.amount ?? 0), 0);
  const hasPayDays = items.some((i) => i.kind === "pay");
  const hasDueDays = items.some((i) => i.kind === "bill");
  const noDays = !data.streams.some((s) => s.active && s.payDay) && !data.expenses.some((e) => e.active && e.dueDay);

  return (
    <div className="space-y-4">
      <Card
        icon={<Icon name="calendar" size={24} />}
        glow="cyan"
        title={`Calendar · ${monthLabel(month)}`}
        help={HELP.calendar}
        actions={
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-base font-bold">
            {hasPayDays && <span className="text-good">{money(due)} still to come in</span>}
            {hasDueDays && <span className="text-bad">{money(bills)} bills left</span>}
          </div>
        }
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {(Object.keys(KIND) as CalItem["kind"][]).filter((k) => k !== "google" || connected).map((k) => (
            <span key={k} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-extrabold ${KIND[k].chip}`}>
              <Icon name={KIND[k].icon} size={16} /> {KIND[k].label}
            </span>
          ))}
        </div>
        {noDays && (
          <p className="text-base text-muted mb-3">
            Tip: set the day each client pays in &ldquo;Client pay days&rdquo; below, and the day each bill is due in Expenses (Edit). They show up here every month.
          </p>
        )}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-xs sm:text-sm font-extrabold uppercase text-muted pb-1">
              {w}
            </div>
          ))}
          {monthGrid(month).flat().map((date, i) =>
            date ? (
              <DayCell key={date} date={date} items={byDay.get(date) ?? []} today={date === today} selected={date === selected} onPick={() => setPicked(date)} />
            ) : (
              <div key={`pad-${i}`} />
            ),
          )}
        </div>
        {connected && google.loading && <p className="text-sm text-muted mt-2">Loading your calendar…</p>}
        {connected && google.error && <p className="text-base text-bad font-bold mt-2">Your calendar: {google.error}</p>}
      </Card>

      <div className="grid lg:grid-cols-[3fr_2fr] gap-4 items-start">
        <DayPanel date={selected} items={byDay.get(selected) ?? []} />
        <div className="space-y-4">
          <PayDaysCard />
          <GoogleCard connected={connected} onChange={google.refresh} />
        </div>
      </div>
    </div>
  );
}

/** Tick off, move and delete missions and client tasks from the calendar. Money dates and Google events can't be changed here. */
function useMissionActions() {
  const { update, today } = useTracker();
  const toggle = (it: CalItem) =>
    update((d) => {
      if (it.kind === "task") {
        const t = d.tasks.find((x) => x.id === it.ref);
        if (!t) return;
        t.done = !t.done;
        t.doneOn = t.done ? today : undefined;
        if (t.done) celebrate({ kicker: "Mission complete", title: t.title, icon: "🎯", sfx: "DONE!" });
      } else if (it.kind === "clientTask") {
        const t = d.clientTasks?.find((x) => x.id === it.ref);
        if (!t) return;
        t.status = t.status === "done" ? "todo" : "done";
        t.doneOn = t.status === "done" ? today : undefined;
      }
    });
  const move = (kind: CalItem["kind"], ref: string, date: string, time?: string | null) =>
    update((d) => {
      if (kind === "task") {
        const t = d.tasks.find((x) => x.id === ref);
        if (!t) return;
        t.dueDate = date;
        if (time !== undefined) t.time = time || undefined;
      } else if (kind === "clientTask") {
        const t = d.clientTasks?.find((x) => x.id === ref);
        if (t) t.dueDate = date;
      }
    });
  const remove = (it: CalItem) =>
    update((d) => {
      if (it.kind === "task") d.tasks = d.tasks.filter((x) => x.id !== it.ref);
    });
  return { toggle, move, remove };
}

const movable = (it: CalItem) => (it.kind === "task" || it.kind === "clientTask") && Boolean(it.ref);
const DRAG_TYPE = "application/x-tracker-mission";
const startDrag = (e: React.DragEvent, it: CalItem) => {
  e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ kind: it.kind, ref: it.ref, title: it.title }));
  e.dataTransfer.effectAllowed = "move";
};

function DayCell({ date, items, today, selected, onPick }: { date: string; items: CalItem[]; today: boolean; selected: boolean; onPick: () => void }) {
  const { toggle, move } = useMissionActions();
  const [over, setOver] = useState(false);
  const shown = items.slice(0, 3);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick())}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const raw = e.dataTransfer.getData(DRAG_TYPE);
        if (!raw) return;
        e.preventDefault();
        const m = JSON.parse(raw) as { kind: CalItem["kind"]; ref: string; title: string };
        move(m.kind, m.ref, date);
        toast(`Moved "${m.title}" to ${dayLabel(date)}`);
        onPick();
      }}
      aria-pressed={selected}
      aria-label={`${dayLabel(date)}: ${items.length ? `${items.length} item${items.length > 1 ? "s" : ""}` : "nothing planned"}`}
      className={`min-h-16 sm:min-h-28 rounded-[8px] border-[3px] p-1 sm:p-1.5 text-left flex flex-col gap-1 cursor-pointer transition-colors ${over ? "border-good bg-good/15" : selected ? "border-gold bg-card-2" : "border-outline bg-card-2/50 hover:bg-card-2"}`}
    >
      <span className={`text-sm sm:text-base font-extrabold leading-none ${today ? "bg-hero text-outline rounded-full px-1.5 py-0.5 self-start" : ""}`}>{Number(date.slice(8))}</span>
      {/* Phones: colored dots. Wider screens: labels you can tick and drag. */}
      <span className="flex flex-wrap gap-0.5 sm:hidden">
        {items.slice(0, 6).map((it) => (
          <span key={it.id} className={`w-2.5 h-2.5 rounded-full border border-outline ${KIND[it.kind].chip} ${it.done ? "opacity-40" : ""}`} />
        ))}
      </span>
      <span className="hidden sm:flex flex-col gap-0.5 min-w-0">
        {shown.map((it) => (
          <span
            key={it.id}
            draggable={movable(it)}
            onDragStart={(e) => startDrag(e, it)}
            className={`flex items-center gap-1 min-w-0 rounded px-1 text-xs lg:text-sm font-bold ${KIND[it.kind].chip} ${it.done ? "opacity-50" : ""} ${movable(it) ? "cursor-grab active:cursor-grabbing" : ""}`}
            title={movable(it) ? `${it.title} (drag to another day)` : it.title}
          >
            {movable(it) && (
              <button
                type="button"
                className="shrink-0 w-3.5 h-3.5 rounded-sm border-2 border-outline bg-ink/90 grid place-items-center"
                aria-label={it.done ? `Mark not done: ${it.title}` : `Mark done: ${it.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(it);
                }}
              >
                {it.done && <Icon name="check" size={10} strokeWidth={4} className="text-outline" />}
              </button>
            )}
            <span className={`truncate ${it.done ? "line-through" : ""}`}>
              {it.time ? `${timeLabel(it.time)} ` : ""}
              {it.title}
            </span>
          </span>
        ))}
        {items.length > shown.length && <span className="text-xs text-muted font-bold">+{items.length - shown.length} more</span>}
      </span>
    </div>
  );
}

function DayPanel({ date, items }: { date: string; items: CalItem[] }) {
  const { data, update, today } = useTracker();
  const blank = { title: "", time: "", owner: "You", quadrant: "do" as Quadrant };
  const [form, setForm] = useState(blank);
  const owners = Array.from(new Set(["You", ...data.team.filter((m) => m.active).map((m) => m.name)]));


  const add = () => {
    const title = form.title.trim();
    if (!title) return;
    update((d) => void d.tasks.unshift({ id: uid("task"), title, quadrant: form.quadrant, owner: form.owner.trim() || "You", dueDate: date, time: form.time || undefined, done: false }));
    toast(`Scheduled "${title}" for ${dayLabel(date)}`);
    setForm({ ...blank, owner: form.owner, quadrant: form.quadrant });
  };

  return (
    <Card icon={<Icon name="calendar" size={22} />} glow="hero" title={dayLabel(date)} help={HELP.calendarDay}>
      {items.length === 0 ? (
        <p className="text-base text-muted mb-4">Nothing planned on this day.</p>
      ) : (
        <ul className="divide-y divide-line mb-4">
          {items.map((it) => (
            <DayRow key={it.id} it={it} date={date} today={today} />
          ))}
        </ul>
      )}

      <form
        className="grid gap-2 sm:flex sm:flex-wrap sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label className="flex flex-col gap-1 text-base text-muted sm:flex-1 sm:min-w-48">
          Schedule a mission on this day
          <input placeholder="Call the bank, send invoices…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          Time
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          Who
          <input className="sm:w-32" list="cal-owners" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <datalist id="cal-owners">
            {owners.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-base text-muted">
          Column
          <select value={form.quadrant} onChange={(e) => setForm({ ...form, quadrant: e.target.value as Quadrant })}>
            {QUADS.map(([q, l]) => (
              <option key={q} value={q}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <Btn kind="primary" disabled={!form.title.trim()}>
          Add mission
        </Btn>
      </form>
    </Card>
  );
}

function DayRow({ it, date, today }: { it: CalItem; date: string; today: string }) {
  const { toggle, move, remove } = useMissionActions();
  const [editing, setEditing] = useState(false);
  const [to, setTo] = useState({ date, time: it.time ?? "" });
  const k = KIND[it.kind];
  const canMove = movable(it);
  return (
    <li draggable={canMove && !editing} onDragStart={(e) => startDrag(e, it)} className={`py-2.5 text-base ${canMove && !editing ? "cursor-grab" : ""}`}>
      <div className="flex items-center gap-3 flex-wrap">
        {canMove ? (
          <input type="checkbox" className="w-6 h-6" checked={Boolean(it.done)} onChange={() => toggle(it)} aria-label={`Done: ${it.title}`} />
        ) : (
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-outline ${k.chip}`}>
            <Icon name={k.icon} size={18} />
          </span>
        )}
        <div className="flex-1 min-w-40">
          <div className={`font-bold ${it.done ? "line-through text-muted" : ""}`}>{it.title}</div>
          <div className="text-sm text-muted">
            {k.label}
            {it.time && ` · ${timeLabel(it.time)}`}
            {it.allDay && " · all day"}
            {it.location && ` · ${it.location}`}
            {it.kind === "google" && " · change it in Google"}
          </div>
        </div>
        {it.amount != null && <span className={`font-extrabold tabular-nums ${it.kind === "pay" ? "text-good" : it.kind === "bill" ? "text-bad" : "text-gold"}`}>{money(it.amount)}</span>}
        {it.kind === "pay" && (it.done ? <Badge tone="good">Collected</Badge> : date < today ? <Badge tone="warn">Late</Badge> : null)}
        {it.kind === "bill" && (it.done ? <Badge tone="good">Paid</Badge> : date < today ? <Badge tone="bad">Overdue</Badge> : null)}
        {canMove && !editing && <EditButton label="Move" title={`Move or delete: ${it.title}`} onClick={() => (setTo({ date, time: it.time ?? "" }), setEditing(true))} />}
      </div>
      {editing && (
        <div className="mt-2 ml-9 flex flex-wrap items-end gap-2 bg-card-2 rounded-[8px] p-3">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Day
            <input type="date" value={to.date} onChange={(e) => e.target.value && setTo({ ...to, date: e.target.value })} />
          </label>
          {it.kind === "task" && (
            <label className="flex flex-col gap-1 text-sm text-muted">
              Time
              <input type="time" value={to.time} onChange={(e) => setTo({ ...to, time: e.target.value })} />
            </label>
          )}
          <SaveButton
            onClick={() => {
              move(it.kind, it.ref!, to.date, it.kind === "task" ? to.time : undefined);
              if (to.date !== date) toast(`Moved "${it.title}" to ${dayLabel(to.date)}`);
              setEditing(false);
            }}
          />
          <Btn kind="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Btn>
          {it.kind === "task" && (
            <Btn kind="danger" onClick={() => confirm(`Delete "${it.title}"?`) && remove(it)}>
              Delete
            </Btn>
          )}
        </div>
      )}
    </li>
  );
}

/** Every monthly client and the day of the month they pay, set in one place. */
function PayDaysCard() {
  const { data, update } = useTracker();
  const [editing, setEditing] = useState(false);
  const streams = data.streams.filter((s) => s.active);
  if (!streams.length) return null;
  const missing = streams.filter((s) => !s.payDay).length;
  return (
    <Card icon={<Icon name="income" size={24} />} glow="hero" title="Client pay days" help={HELP.payDays} actions={!editing && <EditButton title="Set the days" onClick={() => setEditing(true)} />}>
      {editing ? (
        <div className="space-y-2">
          {streams.map((s) => (
            <label key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-base font-bold">
              <span className="[overflow-wrap:anywhere]">{s.name}</span>
              <select
                aria-label={`${s.name} pays on`}
                value={s.payDay ?? ""}
                onChange={(e) =>
                  update((d) => {
                    const x = d.streams.find((y) => y.id === s.id)!;
                    if (e.target.value) x.payDay = Number(e.target.value);
                    else delete x.payDay;
                  })
                }
              >
                <option value="">Not set</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n === 31 ? "Last day" : `The ${ordinal(n)}`}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <SaveButton onClick={() => setEditing(false)} />
        </div>
      ) : (
        <div className="space-y-1.5">
          {streams.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-base">
              <span className="font-bold [overflow-wrap:anywhere]">{s.name}</span>
              <span className={s.payDay ? "font-bold text-good" : "text-muted"}>{s.payDay ? (s.payDay === 31 ? "Last day" : `The ${ordinal(s.payDay)}`) : "Not set"}</span>
            </div>
          ))}
          {missing > 0 && (
            <Btn kind="hero" className="mt-2" onClick={() => setEditing(true)}>
              Set {missing === streams.length ? "pay days" : `${missing} missing pay day${missing > 1 ? "s" : ""}`}
            </Btn>
          )}
        </div>
      )}
    </Card>
  );
}

function GoogleCard({ connected, onChange }: { connected: boolean; onChange: () => void }) {
  const { reload } = useTracker();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (value: string | null) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: value }) });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error || "Couldn't save that.");
      setUrl("");
      await reload();
      onChange();
      toast(value ? "Your calendar is linked" : "Calendar unlinked");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card icon={<Icon name="link" size={22} />} glow="gold" title="Google Calendar" help={HELP.googleCalendar}>
      <h3 className="text-lg font-extrabold mb-2">Your Google events, here</h3>
      {connected ? (
        <div className="space-y-3 text-base">
          <p className="flex items-center gap-2 font-bold">
            <Badge tone="good">Linked</Badge> Your events show on the calendar above (view only).
          </p>
          <div className="flex flex-wrap gap-2">
            <Btn kind="soft" onClick={onChange}>
              Refresh
            </Btn>
            <Btn kind="danger" disabled={busy} onClick={() => confirm("Unlink your calendar? Your events stop showing here. Nothing is deleted from Google.") && save(null)}>
              Unlink
            </Btn>
          </div>
        </div>
      ) : (
        <form
          className="space-y-3 text-base"
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) save(url);
          }}
        >
          <ol className="list-decimal pl-5 space-y-1 text-muted">
            <li>Open Google Calendar on a computer, then Settings (the gear).</li>
            <li>On the left, under &ldquo;Settings for my calendars&rdquo;, click your calendar.</li>
            <li>Scroll to &ldquo;Integrate calendar&rdquo; and copy &ldquo;Secret address in iCal format&rdquo;.</li>
            <li>Paste it below. It&apos;s stored encrypted and only used to read your events.</li>
          </ol>
          <input className="w-full" type="password" autoComplete="off" placeholder="https://calendar.google.com/calendar/ical/…/basic.ics" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Secret address in iCal format" />
          {error && <p className="text-bad font-bold">{error}</p>}
          <Btn kind="primary" disabled={busy || !url.trim()}>
            {busy ? "Checking…" : "Link calendar"}
          </Btn>
        </form>
      )}
      <MissionsToGoogle />
    </Card>
  );
}

/** The app's own feed of missions, for Google Calendar to subscribe to. */
function MissionsToGoogle() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const get = async (reset = false) => {
    setBusy(true);
    try {
      const res = await fetch("/api/calendar/feed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reset }) });
      const j = (await res.json()) as { url?: string };
      if (j.url) setUrl(j.url);
      if (reset) toast("New address made. The old one stopped working.");
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Address copied");
    } catch {
      toast("Select the address and copy it");
    }
  };
  return (
    <div className="mt-5 pt-4 border-t-2 border-line space-y-3 text-base">
      <h3 className="text-lg font-extrabold">Your missions, in Google</h3>
      <p className="text-muted">Missions with a date (including ones you add on this calendar) show up in Google Calendar as their own calendar.</p>
      {!url ? (
        <Btn kind="primary" disabled={busy} onClick={() => get()}>
          {busy ? "Getting it…" : "Get my missions address"}
        </Btn>
      ) : (
        <>
          <div className="flex gap-2">
            <input className="flex-1 min-w-0" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Missions calendar address" />
            <Btn kind="primary" type="button" onClick={copy}>
              Copy
            </Btn>
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-muted">
            <li>In Google Calendar on a computer, next to &ldquo;Other calendars&rdquo; on the left, click +.</li>
            <li>Choose &ldquo;From URL&rdquo;, paste the address, and click &ldquo;Add calendar&rdquo;.</li>
            <li>Done. Google checks it for new missions every few hours, on its own schedule.</li>
          </ol>
          <p className="text-sm text-muted">Keep this address private: anyone with it can see your missions.</p>
          <Btn kind="danger" disabled={busy} onClick={() => confirm("Make a new address? The old one stops working, so you'd add the new one in Google again.") && get(true)}>
            Make a new address
          </Btn>
        </>
      )}
    </div>
  );
}
