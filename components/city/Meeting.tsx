"use client";

// A meeting in the city: a town hall with everyone, or one building's team at the Mission Room
// table. You type; the staff answer in character from the app's real data. The answers are
// written by Claude through your Claude project (no API key), so while they're being written the
// room shows who's thinking instead of a made-up reply. Transcripts stay in the Mission Room.

import { useEffect, useMemo, useRef, useState } from "react";
import { useTracker } from "../App";
import { Hero } from "../characters";
import { Icon } from "../icons";
import { Badge, Btn, toast } from "../ui";
import { buildingName, roleOf, titleOf } from "@/lib/city";
import { attendees } from "@/lib/meetings";
import { personalityOf } from "@/lib/personality";
import { sfx } from "@/lib/sound";
import type { CityStaff, Meeting as MeetingT } from "@/lib/types";

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function Meeting({ kind, buildingId, staffId, meetingId, onClose }: { kind: MeetingT["kind"]; buildingId?: string; staffId?: string; meetingId?: string; onClose: () => void }) {
  const { data, update } = useTracker();
  const staff = data.city?.staff ?? [];
  const here = (data.meetings ?? []).filter((m) => m.kind === kind && (kind === "townhall" || (kind === "chat" ? m.staffIds[0] === staffId : m.buildingId === buildingId)));
  const dm = kind === "chat";
  const [id, setId] = useState(meetingId ?? here.find((m) => m.status !== "ended")?.id ?? "");
  const m = (data.meetings ?? []).find((x) => x.id === id);
  const people = useMemo(() => (m ? m.staffIds.map((sid) => staff.find((s) => s.id === sid)).filter((s): s is CityStaff => Boolean(s)) : attendees(data, kind, buildingId, staffId)), [m, staff, data, kind, buildingId, staffId]);
  const [text, setText] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  // Your message shows the moment you hit Send, before the server has saved it.
  const [pending, setPending] = useState<{ text: string; at: string; to: string } | null>(null);
  const [now, setNow] = useState(Date.now());
  const end = useRef<HTMLDivElement>(null);
  const place = kind === "townhall" ? data.city?.name ?? "the city" : (() => { const bid = kind === "chat" ? staff.find((x) => x.id === staffId)?.buildingId : buildingId; const b = data.city?.buildings.find((x) => x.id === bid); return b ? buildingName(data, b) : "the building"; })();

  const [persona, setPersona] = useState<string | null>(null);
  const savePersona = (sid: string, v: string) => update((d) => { const s = d.city?.staff.find((x) => x.id === sid); if (s) s.personality = v.trim() || undefined; });
  const put = (meeting: MeetingT) => update((d) => void (d.meetings = [meeting, ...(d.meetings ?? []).filter((x) => x.id !== meeting.id)]));
  const call = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await fetch("/api/city/meeting", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      put(j.meeting);
      return j.meeting as MeetingT;
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // A chat opens straight away: no "start" step.
  const started = useRef(false);
  useEffect(() => {
    if (!dm || m || started.current || !people.length) return;
    started.current = true;
    call({ action: "start", kind, staffId }).then((x) => x && setId(x.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dm, m, people.length]);

  // While they're thinking, look for the answer every 2 seconds.
  const thinking = m?.status === "waiting";
  const waiting = thinking || Boolean(pending);
  useEffect(() => {
    if (!thinking || !id) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/city/meeting?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const j = (await r.json()) as { meeting: MeetingT | null };
        // Never step back to an older copy (a reply that's still in flight).
        if (j.meeting && j.meeting.messages.length > (m?.messages.length ?? 0)) {
          put(j.meeting);
          sfx("loot");
        } else if (j.meeting && j.meeting.status !== "waiting" && j.meeting.messages.length === m?.messages.length) put(j.meeting);
      } catch {}
    }, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinking, id, m?.messages.length]);
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [waiting]);
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [m?.messages.length, waiting, pending]);

  const send = async () => {
    const t = text.trim();
    if (!t || !m) return;
    setText("");
    setPending({ text: t, at: new Date().toISOString(), to });
    sfx("click");
    const out = await call({ action: "say", id: m.id, text: t, to: to ? [to] : [] });
    setPending(null);
    if (!out) setText(t);
  };

  const who = (from: string) => staff.find((s) => s.id === from);
  const shown = [...(m?.messages ?? []), ...(pending ? [{ id: "pending", from: "you", name: data.settings.playerName || "You", text: pending.text, at: pending.at }] : [])];
  // Who's on it while they think: the person you asked, anyone you named, else the first at the table.
  const lastMine = [...shown].reverse().find((x) => x.from === "you");
  const askedTo = pending ? pending.to : to;
  const onIt = waiting ? workingOn(people, lastMine?.text ?? "", askedTo) : [];
  const elapsed = lastMine ? Math.max(0, Math.round((now - new Date(lastMine.at).getTime()) / 1000)) : 0;
  const past = here.filter((x) => x.id !== id);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-[rgba(11,10,20,0.55)]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hud city-pop w-full max-w-3xl h-[90vh] flex flex-col p-3 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="users" size={28} className="text-gold" />
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-2xl sm:text-3xl tracking-wide truncate">{dm ? `Chat with ${people[0]?.name ?? "staff"}` : kind === "townhall" ? "Town hall" : `${place} meeting`}</h3>
            <div className="text-sm font-bold text-muted">{dm ? `${people[0] ? titleOf(people[0]) : ""} · ${place}` : <>{m ? `${m.status === "ended" ? "Ended" : "Started"} ${when(m.endedAt ?? m.startedAt)} · ` : ""}{people.length} staff {m ? "in the room" : "will be called in"}</>}</div>
          </div>
          {m && m.status !== "ended" && !dm && <Btn onClick={() => call({ action: "end", id: m.id })} disabled={busy}>End meeting</Btn>}
          <Btn onClick={onClose}>Close</Btn>
        </div>

        {/* a chat: who they are, editable */}
        {dm && people[0] && (
          <div className="flex gap-3 items-start pb-2 border-b-2 border-line">
            <div className={`shrink-0 w-16 h-16 overflow-hidden rounded-md border-2 border-outline grid place-content-center ${waiting ? "city-blink" : ""}`} style={{ background: `${roleOf(people[0]).color}44` }}>
              <Hero look={people[0].look} items={[]} size={60} />
            </div>
            {persona === null ? (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold text-muted">Personality</div>
                <p className="text-base">{personalityOf(people[0])}</p>
              </div>
            ) : (
              <textarea className="flex-1 text-base" rows={3} value={persona} onChange={(e) => setPersona(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder="How they are, how they talk, a bit about their life. Leave blank for the one they were given." />
            )}
            {persona === null ? (
              <Btn className="text-sm py-1" onClick={() => setPersona(people[0].personality ?? personalityOf(people[0]))}>Edit</Btn>
            ) : (
              <div className="flex flex-col gap-1">
                <Btn kind="primary" className="text-sm py-1" onClick={() => (savePersona(people[0].id, persona), setPersona(null))}>Save</Btn>
                <Btn className="text-sm py-1" onClick={() => setPersona(null)}>Cancel</Btn>
              </div>
            )}
          </div>
        )}

        {/* who's at the table */}
        {!dm && <div className="flex gap-1.5 overflow-x-auto pb-2 border-b-2 border-line">
          {people.map((p) => (
            <div key={p.id} className="shrink-0 w-16 text-center" title={`${p.name}, ${titleOf(p)}`}>
              <div className={`w-14 h-14 mx-auto overflow-hidden rounded-md border-2 border-outline grid place-content-center ${waiting && (!to || to === p.id) ? "city-blink" : ""}`} style={{ background: `${roleOf(p).color}44` }}>
                <Hero look={p.look} items={[]} size={52} />
              </div>
              <div className="text-xs font-extrabold truncate mt-0.5">{p.name}</div>
            </div>
          ))}
        </div>}

        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {!m && dm && <p className="text-center text-lg font-bold text-muted py-4">{people.length ? `Opening your chat with ${people[0].name}…` : "That worker isn't in town any more."}</p>}
          {!m && !dm && (
            <div className="text-center py-6 space-y-3">
              <p className="text-lg font-bold">
                {people.length
                  ? kind === "townhall"
                    ? `Call all ${people.length} staff in ${place} to the town hall. Ask anything: how each team is doing, what's blocked, what to focus on.`
                    : `Sit down with the ${people.length} staff at ${place}. They answer from this building's real numbers, missions and work.`
                  : "Nobody works here yet."}
              </p>
              {people.length > 0 && (
                <Btn kind="primary" className="text-lg" disabled={busy} onClick={async () => { const x = await call({ action: "start", kind, buildingId }); if (x) (setId(x.id), sfx("loot")); }}>
                  {kind === "townhall" ? "Call the town hall" : "Start the meeting"}
                </Btn>
              )}
            </div>
          )}
          {m && m.messages.length === 0 && !waiting && !pending && <p className="text-center text-lg font-bold text-muted py-4">{dm ? `Say hi to ${people[0]?.name ?? "them"}. Ask about work, give them a job, or just talk.` : "Everyone's seated. Say something to open the meeting."}</p>}
          {shown.map((x) => {
            const s = who(x.from);
            const mine = x.from === "you";
            return (
              <div key={x.id} className={`flex gap-2 items-start ${mine ? "flex-row-reverse" : ""}`}>
                {!mine && (
                  <div className="shrink-0 w-11 h-11 overflow-hidden rounded-md border-2 border-outline grid place-content-center" style={{ background: `${s ? roleOf(s).color : "#c4bfe6"}44` }}>
                    {s && <Hero look={s.look} items={[]} size={40} />}
                  </div>
                )}
                <div className={`max-w-[85%] border-2 border-outline rounded-md px-3 py-2 ${mine ? "bg-gold/30" : "bg-card-2"}`}>
                  <div className="text-sm font-extrabold">
                    {x.name}
                    {s && <span className="text-muted font-bold"> · {titleOf(s)}</span>}
                  </div>
                  <div className="text-base whitespace-pre-wrap leading-relaxed">{x.text}</div>
                </div>
              </div>
            );
          })}
          {waiting &&
            onIt.map((p, i) => (
              <div key={`on-${p.id}`} className="flex gap-2 items-start">
                <div className="shrink-0 w-11 h-11 overflow-hidden rounded-md border-2 border-outline grid place-content-center city-blink" style={{ background: `${roleOf(p).color}44` }}>
                  <Hero look={p.look} items={[]} size={40} />
                </div>
                <div className="max-w-[85%] border-2 border-dashed border-outline rounded-md px-3 py-2 bg-card-2">
                  <div className="text-sm font-extrabold">
                    {p.name}
                    <span className="text-muted font-bold"> · {titleOf(p)}</span>
                  </div>
                  <div className="text-base font-bold">{dm && elapsed < 20 ? "Typing…" : progressLine(p, i, elapsed)}</div>
                  {i === onIt.length - 1 && (
                    <div className="text-sm font-bold text-muted mt-1 flex items-center gap-2">
                      <span className="font-display text-lg city-blink">…</span>
                      {pending ? "Sending" : `Working on it · ${clock(elapsed)}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          <div ref={end} />
        </div>

        {m && m.status !== "ended" && (
          <form
            className="flex gap-2 flex-wrap items-end border-t-2 border-line pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            {!dm && (
              <select value={to} onChange={(e) => setTo(e.target.value)} className="text-base" aria-label="Ask who">
                <option value="">Ask everyone</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>Ask {p.name}</option>
                ))}
              </select>
            )}
            <textarea
              className="flex-1 min-w-48 text-base"
              rows={2}
              placeholder={waiting ? "You can add more while they think" : dm ? `Message ${people[0]?.name ?? ""}…` : "Type to the team…"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Btn kind="primary" disabled={busy || !text.trim()}>Send</Btn>
          </form>
        )}
        {m?.status === "ended" && (
          <div className="border-t-2 border-line pt-2 flex gap-2 items-center">
            <span className="text-base font-bold text-muted flex-1">This meeting has ended. The transcript stays in the Mission Room.</span>
            <Btn kind="primary" onClick={() => setId("")}>New meeting</Btn>
          </div>
        )}

        {past.length > 0 && (
          <details className="border-t-2 border-line pt-2 mt-2">
            <summary className="font-extrabold cursor-pointer">{dm ? "Earlier chats" : "Past meetings here"} ({past.length})</summary>
            <ul className="mt-1 max-h-32 overflow-y-auto">
              {past.map((x) => (
                <li key={x.id}>
                  <button type="button" className="w-full text-left px-2 py-1 hover:bg-card-2 rounded flex gap-2 items-center" onClick={() => setId(x.id)}>
                    <span className="flex-1 truncate font-bold">{when(x.startedAt)} · {x.messages.length} messages</span>
                    {x.status === "waiting" ? <Badge tone="accent">Thinking</Badge> : x.status === "ended" ? <Badge tone="muted">Ended</Badge> : <Badge tone="good">Open</Badge>}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

/** Up to 3 people who'll answer: the one you picked, people you named, else whoever is first at the table. */
function workingOn(people: CityStaff[], text: string, to: string): CityStaff[] {
  const picked = people.find((p) => p.id === to);
  if (picked) return [picked];
  const low = text.toLowerCase();
  const named = people.filter((p) => p.name && new RegExp(`\\b${p.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(low));
  return (named.length ? named : people).slice(0, named.length ? 3 : 1);
}

/** What they say while they work, with a time frame. Honest: it's a status, not their answer. */
function progressLine(p: CityStaff, i: number, sec: number): string {
  if (i > 0) return sec < 20 ? "I'll add my part right after." : "Checking my side too, nearly there.";
  if (sec < 15) return "On it. Give me a minute.";
  if (sec < 45) return `Pulling up the numbers for this. About a minute.`;
  if (sec < 90) return "Writing it up now. Give me another minute.";
  if (sec < 180) return "Still on it, this one needs a closer look. A couple more minutes.";
  return "Taking longer than I'd like. It's still being worked on, you can close this and I'll have it here when you're back.";
}

/** The Mission Room's list of this building's meetings, with a way to open each transcript. */
export function MeetingList({ buildingId, onOpen }: { buildingId: string; onOpen: (id?: string) => void }) {
  const { data } = useTracker();
  const list = (data.meetings ?? []).filter((m) => m.kind === "building" && m.buildingId === buildingId);
  return (
    <div className="mt-4 border-t-2 border-line pt-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="users" size={22} />
        <h4 className="font-display text-xl tracking-wide flex-1">Meetings</h4>
        <Btn kind="primary" className="text-sm py-1" onClick={() => onOpen()}>Hold a meeting</Btn>
      </div>
      {list.length === 0 ? (
        <p className="text-base text-muted">No meetings here yet. Hold one at the table to talk to the whole team.</p>
      ) : (
        <ul className="space-y-1">
          {list.slice(0, 8).map((m) => (
            <li key={m.id}>
              <button type="button" className="w-full text-left px-2 py-1.5 hover:bg-card-2 rounded flex gap-2 items-center" onClick={() => onOpen(m.id)}>
                <span className="flex-1 min-w-0 truncate text-base">
                  <b>{when(m.startedAt)}</b> · {m.messages.find((x) => x.from === "you")?.text.slice(0, 60) ?? "No messages yet"}
                </span>
                {m.status === "waiting" ? <Badge tone="accent">Thinking</Badge> : m.status === "ended" ? <Badge tone="muted">Ended</Badge> : <Badge tone="good">Open</Badge>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
