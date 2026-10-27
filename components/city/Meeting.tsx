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
import { sfx } from "@/lib/sound";
import type { CityStaff, Meeting as MeetingT } from "@/lib/types";

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function Meeting({ kind, buildingId, meetingId, onClose }: { kind: MeetingT["kind"]; buildingId?: string; meetingId?: string; onClose: () => void }) {
  const { data, update } = useTracker();
  const staff = data.city?.staff ?? [];
  const here = (data.meetings ?? []).filter((m) => m.kind === kind && (kind === "townhall" || m.buildingId === buildingId));
  const [id, setId] = useState(meetingId ?? here.find((m) => m.status !== "ended")?.id ?? "");
  const m = (data.meetings ?? []).find((x) => x.id === id);
  const people = useMemo(() => (m ? m.staffIds.map((sid) => staff.find((s) => s.id === sid)).filter((s): s is CityStaff => Boolean(s)) : attendees(data, kind, buildingId)), [m, staff, data, kind, buildingId]);
  const [text, setText] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const place = kind === "townhall" ? data.city?.name ?? "the city" : (() => { const b = data.city?.buildings.find((x) => x.id === buildingId); return b ? buildingName(data, b) : "the building"; })();

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

  // While they're thinking, look for the answer every 15 seconds.
  const waiting = m?.status === "waiting";
  useEffect(() => {
    if (!waiting || !id) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/city/meeting?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const j = (await r.json()) as { meeting: MeetingT | null };
        if (j.meeting && j.meeting.messages.length !== m?.messages.length) {
          put(j.meeting);
          sfx("loot");
        } else if (j.meeting && j.meeting.status !== "waiting") put(j.meeting);
      } catch {}
    }, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, id, m?.messages.length]);
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [m?.messages.length, waiting]);

  const send = async () => {
    const t = text.trim();
    if (!t || !m) return;
    setText("");
    sfx("click");
    const out = await call({ action: "say", id: m.id, text: t, to: to ? [to] : [] });
    if (!out) setText(t);
  };

  const who = (from: string) => staff.find((s) => s.id === from);
  const past = here.filter((x) => x.id !== id);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-[rgba(11,10,20,0.55)]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hud city-pop w-full max-w-3xl h-[90vh] flex flex-col p-3 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="users" size={28} className="text-gold" />
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-2xl sm:text-3xl tracking-wide truncate">{kind === "townhall" ? "Town hall" : `${place} meeting`}</h3>
            <div className="text-sm font-bold text-muted">{m ? `${m.status === "ended" ? "Ended" : "Started"} ${when(m.endedAt ?? m.startedAt)} · ` : ""}{people.length} staff {m ? "in the room" : "will be called in"}</div>
          </div>
          {m && m.status !== "ended" && <Btn onClick={() => call({ action: "end", id: m.id })} disabled={busy}>End meeting</Btn>}
          <Btn onClick={onClose}>Close</Btn>
        </div>

        {/* who's at the table */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 border-b-2 border-line">
          {people.map((p) => (
            <div key={p.id} className="shrink-0 w-16 text-center" title={`${p.name}, ${titleOf(p)}`}>
              <div className={`w-14 h-14 mx-auto overflow-hidden rounded-md border-2 border-outline grid place-content-center ${waiting && (!to || to === p.id) ? "city-blink" : ""}`} style={{ background: `${roleOf(p).color}44` }}>
                <Hero look={p.look} items={[]} size={52} />
              </div>
              <div className="text-xs font-extrabold truncate mt-0.5">{p.name}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {!m && (
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
          {m && m.messages.length === 0 && !waiting && <p className="text-center text-lg font-bold text-muted py-4">Everyone's seated. Say something to open the meeting.</p>}
          {m?.messages.map((x) => {
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
          {waiting && (
            <div className="flex gap-2 items-center border-2 border-dashed border-line rounded-md px-3 py-2">
              <span className="font-display text-2xl city-blink">…</span>
              <div className="text-base font-bold">
                {to ? `${who(to)?.name ?? "They"} is thinking.` : "The team is thinking."}{" "}
                <span className="text-muted">They answer through your Claude account. The first answer in a meeting can take up to an hour; while a meeting is going, the next ones come in a few minutes. You can close this and come back.</span>
              </div>
            </div>
          )}
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
            <select value={to} onChange={(e) => setTo(e.target.value)} className="text-base" aria-label="Ask who">
              <option value="">Ask everyone</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>Ask {p.name}</option>
              ))}
            </select>
            <textarea
              className="flex-1 min-w-48 text-base"
              rows={2}
              placeholder={waiting ? "You can add more while they think" : "Type to the team…"}
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
            <summary className="font-extrabold cursor-pointer">Past meetings here ({past.length})</summary>
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
