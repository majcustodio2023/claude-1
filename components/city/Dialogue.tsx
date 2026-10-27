"use client";

// Talking to someone in the city: an anime-style text box with a portrait, typed-out lines
// with voice blips, answer choices, and a pop-up that shows what they're talking about
// (the progress report, the mission board, what they need from you, a video request…).

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTracker } from "../App";
import { Hero, Kit } from "../characters";
import { Icon } from "../icons";
import { Badge, Btn, money } from "../ui";
import { EditButton, SaveButton } from "../editable";
import { ME, nextStatus } from "@/lib/clients";
import { uid, weekLogs } from "@/lib/finance";
import { groupOf } from "@/lib/adgroups";
import { blip, sfx } from "@/lib/sound";
import { ROLES, buildingName, clientsOf, roleOf, say, secretKey, setupProgress, titleOf, type StaffRole } from "@/lib/city";
import { buildingReport, missions } from "@/lib/cityReport";
import { WRITER_PROMPTS } from "@/lib/cityPrompts";
import { NOT_LIVE, dueJob, jobsOf, workOf } from "@/lib/cityJobs";
import { onRunning, runJob, runningJobs } from "./workRunner";
import { MeetingList } from "./Meeting";
import { ServicesPanel } from "./Services";
import { allOutputs } from "@/lib/cityOutputs";
import { PRACTICE_WEAPONS, foeById } from "@/lib/training";
import { FoePortrait } from "./trainingArt";
import { itemPowerText } from "@/lib/battle";
import { GATE, SHOPKEEPERS, STAFF_CHATS, citizenById, citizenStart, questById, questProgress, questState } from "@/lib/cityLore";
import { ITEMS, RARITY, SLOT_LABEL } from "@/lib/items";
import { ITEM_POWER } from "@/lib/battle";
import { takeShopItem } from "@/lib/loot";
import { hashString, rng } from "@/lib/avatar";
import { randomHeroLook } from "@/lib/heroLook";
import type { HeroLook, ItemSlot } from "@/lib/types";
import { toast } from "../ui";
import type { CityBuilding, CityStaff, Creative, StaffWork, TrackerData, VideoRequest } from "@/lib/types";

export type Talk =
  | { kind: "staff"; staffId: string }
  | { kind: "board"; buildingId: string }
  | { kind: "screen"; buildingId: string }
  | { kind: "room"; buildingId: string; roomId: string }
  | { kind: "kit" }
  | { kind: "citizen"; id: string }
  | { kind: "gate" }
  | { kind: "shop"; buildingId: string }
  | { kind: "rack" }
  | { kind: "foe"; id: string };

type Page = "greet" | "jobs" | "panel" | "setup" | "work" | "chat" | "news" | `reply:${number}` | `node:${string}`;

/** Each speaker gets their own voice pitch. */
const pitchOf = (id: string) => 62 + (id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 18);

function useTyped(text: string, voice: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setN(i);
      if (i % 3 === 1 && text[i] && text[i] !== " ") blip(voice);
      if (i >= text.length) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [text, voice]);
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) };
}

export default function Dialogue({ talk, onClose, goTo, onOutputs, onSpar, onMeeting }: { talk: Talk; onClose: () => void; goTo: (tab: string) => void; onOutputs?: (staffId: string) => void; onSpar?: (foeId: string) => void; onMeeting?: (buildingId: string, meetingId?: string) => void }) {
  const { data, update, month, today } = useTracker();
  const citizen = talk.kind === "citizen" ? citizenById(talk.id) : undefined;
  const [page, setPage] = useState<Page>(talk.kind === "board" || talk.kind === "screen" ? "panel" : citizen ? `node:${citizenStart(data, citizen)}` : talk.kind === "gate" ? "node:0" : "greet");
  const [chat] = useState(() => Math.floor(Math.random() * STAFF_CHATS.length));
  const staff = talk.kind === "staff" ? data.city?.staff.find((s) => s.id === talk.staffId) : undefined;
  const bId = talk.kind === "staff" ? staff?.buildingId : "buildingId" in talk ? talk.buildingId : undefined;
  const building = data.city?.buildings.find((b) => b.id === bId);
  const place = building ? buildingName(data, building) : data.city?.name ?? "the city";
  const reporter = data.city?.staff.find((s) => s.buildingId === bId && s.role === "reporter");
  const keys = data.integrations?.staffKeys ?? [];

  // Who's talking and what they say.
  let speaker: { id: string; name: string; title: string; color: string; portrait: ReactNode };
  let text = "";
  let panel: ReactNode = null;
  let choices: { label: string; go: () => void; primary?: boolean }[] = [];
  const bye = { label: "See you!", go: onClose };
  const back = { label: "Back", go: () => setPage("greet") };

  if (citizen) {
    const id = page.startsWith("node:") ? page.slice(5) : "start";
    const node = citizen.nodes[id] ?? citizen.nodes.start;
    speaker = { id: citizen.id, name: citizen.name, title: citizen.title, color: citizen.color, portrait: <Hero look={citizenPortrait(citizen.id)} items={[]} size={112} /> };
    text = node.text;
    if (citizen.quest && ["offer", "accepted", "waiting", "after"].includes(id)) panel = <QuestCard id={citizen.quest} />;
    choices = node.replies.map((r) => ({
      label: r.label,
      primary: Boolean(r.quest),
      go: () => {
        if (r.quest) {
          const q = questById(r.quest)!;
          update((d) => void (d.city!.quests = { ...(d.city!.quests ?? {}), [q.id]: { at: today, base: q.progress(d) } }));
          sfx("loot");
        }
        if (r.next) setPage(`node:${r.next}`);
        else onClose();
      },
    }));
  } else if (talk.kind === "gate") {
    const n = GATE[Number(page.slice(5)) || 0];
    speaker = { id: "gate", name: "The Gate", title: "North wall", color: "#7c5cff", portrait: <Icon name="lock" size={80} className="text-hero" /> };
    text = n.text;
    if (page === "node:1") sfx("dark");
    choices = n.replies.map((r) => ({ label: r.label, go: () => (r.next ? setPage(`node:${r.next}`) : onClose()) }));
  } else if (talk.kind === "shop" && building) {
    const k = SHOPKEEPERS[building.kind as "weapons" | "armor"] ?? SHOPKEEPERS.weapons;
    speaker = { id: k.seed, name: k.name, title: `${k.title} · ${place}`, color: k.color, portrait: <Hero look={citizenPortrait(k.seed)} items={[]} size={112} /> };
    if (page === "panel") {
      text = data.city?.freeShops === false ? "Coins on the counter and it's yours." : "Everything's on the house while you're the only hero in town. Take what you like.";
      panel = <ShopPanel slots={k.slots} />;
      choices = [{ label: "Back", go: () => setPage("greet") }, bye];
    } else if (page === "news") {
      text = k.news;
      choices = [{ label: "Show me the goods", go: () => setPage("panel"), primary: true }, { label: "Creepy. Bye.", go: onClose }];
    } else {
      text = k.greet;
      choices = [{ label: "Show me the goods", go: () => setPage("panel"), primary: true }, { label: "Heard any news?", go: () => setPage("news") }, bye];
    }
  } else if (talk.kind === "rack") {
    const w = data.city?.practiceWeapon ?? "";
    speaker = { id: "rack", name: "Weapon rack", title: "Training Hall", color: "#e8a33d", portrait: <Icon name="swords" size={80} className="text-hero" /> };
    text = `Take any weapon for practice. It's only for sparring here; your real gear stays as it is.${w ? ` You're holding the ${ITEMS.find((i) => i.id === w)?.name.toLowerCase()}.` : ""}`;
    panel = <RackPanel />;
    choices = [bye];
  } else if (talk.kind === "foe") {
    const f = foeById(talk.id);
    const w = data.city?.practiceWeapon ?? "";
    speaker = { id: `foe-${talk.id}`, name: f?.name ?? "Monster", title: `Practice · ${f?.level ?? ""}`, color: talk.id === "dummy" ? "#b5d67a" : talk.id === "slime" ? "#f4c95d" : "#e8a0a0", portrait: f ? <FoePortrait id={f.id} size={96} /> : null };
    text = `${f?.about ?? ""} ${w ? `You'll fight with the ${ITEMS.find((i) => i.id === w)?.name.toLowerCase()} from the rack.` : "You'll fight with your own gear."} Practice never costs or pays coins.`;
    choices = f && onSpar ? [{ label: "Spar!", go: () => onSpar(f.id), primary: true }, bye] : [bye];
  } else if (talk.kind === "kit") {
    const all = data.city?.staff ?? [];
    const waiting = all.filter((s) => setupProgress(s, keys).missing.length > 0).length;
    speaker = { id: "kit", name: "Kit", title: "City guide", color: "#ff9f1c", portrait: <Kit size={120} talking /> };
    text = `Welcome to ${data.city?.name}! ${all.length} AI staff work across ${data.city?.buildings.length ?? 0} buildings. ${waiting ? `${waiting} of them are waiting on setup from you; buildings with a red number on the sign have someone who needs you.` : "Everyone is set up. Go check on the teams!"} Walk into any door to go inside, and press Talk next to anyone.`;
    choices = [bye];
  } else if (talk.kind === "staff" && staff && building) {
    const role = roleOf(staff);
    const prog = setupProgress(staff, keys);
    const made = allOutputs(data).filter((o) => o.staffId === staff.id && !o.queued).length;
    speaker = { id: staff.id, name: staff.name, title: titleOf(staff), color: role.color, portrait: <Hero look={staff.look} items={[]} size={112} mood="ready" /> };
    if (page === "greet") {
      text = `${say(role.greet, place)} ${prog.missing.length ? `I'm waiting on ${prog.missing.length} thing${prog.missing.length === 1 ? "" : "s"} from you before I can start.` : role.needs.length ? "I'm all set up." : ""}`.trim();
      choices = [
        prog.missing.length && role.panel === "work"
          ? { label: "Here's what I need", go: () => setPage("setup"), primary: true }
          : { label: role.action, go: () => setPage(role.panel === "setup" ? "setup" : role.panel === "work" ? "work" : "panel"), primary: true },
        ...(jobsOf(staff).length && role.panel !== "work" ? [{ label: "My work", go: () => setPage("work") }] : []),
        ...(made && onOutputs ? [{ label: `What I made (${made})`, go: () => onOutputs(staff.id) }] : []),
        { label: "What do you do?", go: () => setPage("jobs") },
        { label: "How's it going?", go: () => setPage("chat") },
        ...(role.needs.length && role.panel !== "setup" ? [{ label: "My setup", go: () => setPage("setup") }] : []),
        bye,
      ];
    } else if (page === "chat") {
      const c = STAFF_CHATS[chat];
      text = c.line;
      choices = c.replies.map(([label], i) => ({ label, go: () => setPage(`reply:${i}`) }));
    } else if (page.startsWith("reply:")) {
      text = STAFF_CHATS[chat].replies[Number(page.slice(6))]?.[1] ?? "";
      choices = [{ label: "Back to work talk", go: () => setPage("greet") }, bye];
    } else if (page === "jobs") {
      text = `My day looks like this: ${role.jobs.map((j) => j.toLowerCase()).join(", ")}.${prog.missing.length ? ` First I need: ${prog.missing.map((m) => m.label.toLowerCase()).join(", ")}.` : ""}`;
      choices = [back, bye];
    } else if (page === "work") {
      const mine = workOf(data, staff.id);
      text = mine[0]?.status === "queued"
        ? `I'm on "${mine[0].label.toLowerCase()}". It'll be here within the hour.`
        : mine.length
          ? `Here's what I've made. ${mine[0].day === today ? `Today I did: ${mine[0].label.toLowerCase()}.` : ""} Want something else? Pick a job.`
          : prog.missing.length
            ? "Give me what I need first, or pick a job and I'll do my best with what I have."
            : "Pick a job and I'll do it now.";
      panel = <WorkPanel staff={staff} goTo={goTo} />;
      choices = [{ label: "My setup", go: () => setPage("setup") }, back, bye];
    } else if (page === "setup") {
      text = prog.missing.length ? "Here's my checklist. Fill in the red ones and I'm good to go." : "All green! Here's what I'm working with.";
      panel = <SetupPanel staff={staff} role={role} />;
      choices = jobsOf(staff).length ? [{ label: "See my work", go: () => setPage("work"), primary: !prog.missing.length }, back, bye] : [back, bye];
    } else {
      const p = rolePanel(role, staff, building, data, month, today, goTo, place);
      text = p.text;
      panel = p.panel;
      choices = [back, bye];
    }
  } else if (building && (talk.kind === "screen" || talk.kind === "board" || talk.kind === "room")) {
    const r = reporter;
    const rep = buildingReport(data, building, month, today);
    if (talk.kind === "screen") {
      speaker = r
        ? { id: r.id, name: r.name, title: titleOf(r), color: ROLES.reporter.color, portrait: <Hero look={r.look} items={[]} size={112} /> }
        : { id: "screen", name: "Results screen", title: place, color: "#ffd23f", portrait: <Icon name="chart" size={80} /> };
      text = rep.say;
      panel = <ReportPanel building={building} />;
    } else if (talk.kind === "board") {
      const list = missions(data, building);
      speaker = { id: "board", name: "Mission board", title: place, color: "#3fd0ff", portrait: <Icon name="target" size={80} className="text-accent" /> };
      text = list.length ? `${list.filter((m) => !m.done).length} open missions for ${place}. Tap a status to move it along, or add a new one. The meeting table is here too.` : `No missions for ${place} yet. Add the first one below, or call the team to the meeting table.`;
      panel = (
        <>
          <TasksPanel building={building} />
          {onMeeting && <MeetingList buildingId={building.id} onOpen={(id) => onMeeting(building.id, id)} />}
          <ServicesPanel building={building} />
        </>
      );
    } else {
      const room = building.rooms?.find((x) => x.id === talk.roomId);
      speaker = { id: "room", name: room?.name ?? "Room", title: place, color: "#7c5cff", portrait: <Icon name="home" size={80} className="text-hero" /> };
      text = room?.notes?.trim() || `This is the ${room?.name ?? "room"}. Leave notes here for what happens in it.`;
      panel = room ? <RoomPanel building={building} roomId={room.id} /> : null;
    }
    choices = talk.kind === "board" && onMeeting ? [{ label: "Hold a meeting", go: () => onMeeting(building.id), primary: true }, bye] : [bye];
  } else {
    speaker = { id: "x", name: "…", title: "", color: "#c4bfe6", portrait: null };
    text = "They wandered off.";
    choices = [bye];
  }

  const voice = pitchOf(speaker.id);
  const typed = useTyped(text, voice);
  useEffect(() => sfx("open"), [page]);

  // Skip: the first press shows the whole line, the next one moves on to what comes next.
  const nextChoice = choices.find((c) => c.primary) ?? choices.find((c) => c !== bye) ?? choices[0];
  const skip = () => {
    if (!typed.done) typed.skip();
    else nextChoice?.go();
  };
  const skipRef = useRef(skip);
  skipRef.current = skip;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select, button")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        skipRef.current();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end items-center p-2 sm:p-4 gap-3 bg-[radial-gradient(ellipse_at_center,rgba(11,10,20,0.15),rgba(11,10,20,0.6))]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {panel && (
        <div key={page} className="city-pop hud w-full max-w-2xl max-h-[52vh] overflow-y-auto p-4 sm:p-5" style={{ borderColor: "#0b0a14", boxShadow: `6px 6px 0 #0b0a14, 0 0 0 3px ${speaker.color} inset` }}>
          {panel}
        </div>
      )}
      <div className="city-box w-full max-w-3xl relative" onClick={typed.skip}>
        <div className="absolute -top-5 left-4 sm:left-36 z-10 flex items-center gap-2">
          <span className="font-display text-2xl tracking-wide px-3 pt-1 pb-0.5 border-[3px] border-outline rounded-md text-outline shadow-[3px_3px_0_var(--color-outline)] -rotate-2" style={{ background: speaker.color }}>
            {speaker.name}
          </span>
          {speaker.title && <span className="bg-card-2 border-2 border-outline rounded-md px-2 py-0.5 text-sm font-extrabold">{speaker.title}</span>}
        </div>
        <div className="hud flex gap-3 sm:gap-4 p-3 pt-6 sm:p-4 sm:pt-7 items-start">
          <div className="hidden sm:grid shrink-0 w-28 h-32 place-content-center overflow-hidden rounded-[10px] border-[3px] border-outline" style={{ background: `linear-gradient(180deg, ${speaker.color}55, transparent)` }}>
            <div className="talk-bob">{speaker.portrait}</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg sm:text-xl font-bold leading-snug min-h-[3.5rem]">
              {typed.shown}
              {!typed.done && <span className="opacity-60">▌</span>}
            </p>
            <div className={`flex flex-wrap gap-2 mt-3 transition-opacity ${typed.done ? "opacity-100" : "opacity-40"}`}>
              <Btn
                kind="ghost"
                className="text-base order-last ml-auto flex items-center gap-1"
                title={typed.done ? `Skip to: ${nextChoice?.label ?? "close"}` : "Show the whole line"}
                onClick={(e) => {
                  e.stopPropagation();
                  skip();
                }}
              >
                Skip <Icon name="skip" size={18} />
              </Btn>
              {choices.map((c) => (
                <Btn
                  key={c.label}
                  kind={c.primary ? "primary" : "ghost"}
                  className="text-base"
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx("click");
                    c.go();
                  }}
                >
                  {c.label}
                </Btn>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function rolePanel(role: StaffRole, staff: CityStaff, building: CityBuilding, data: TrackerData, month: string, today: string, goTo: (t: string) => void, place: string): { text: string; panel: ReactNode } {
  switch (role.panel) {
    case "report":
      return { text: buildingReport(data, building, month, today).say, panel: <ReportPanel building={building} /> };
    case "tasks":
      return { text: `Here's the mission board for ${place}.`, panel: <TasksPanel building={building} /> };
    case "videoAI":
      return {
        text: data.integrations?.higgsfield ? "Describe the shot. I'll make the image first, then you can have me animate it into a video." : "I shoot with Higgsfield, so I need your Higgsfield key first. Paste it below; it's locked away on the server.",
        panel: <VideoAIPanel />,
      };
    case "imageAI":
      return {
        text: data.integrations?.higgsfield ? "Paste the image copy and describe the look. I'll paint it with Higgsfield." : "I paint with Higgsfield, so I need your Higgsfield key first.",
        panel: <VideoAIPanel imageOnly />,
      };
    case "writer":
      return {
        text: staff.role === "imageCopy" ? "Paste the landing page. Tell me the target market, or leave it blank and I'll suggest one first." : "Paste the landing page or sales page copy and I'll get writing.",
        panel: <WriterPanel staff={staff} />,
      };
    case "videoEdit":
      return { text: "Upload your raw video or paste a link, pick a style, and tell me how you want it cut. No footage? Just describe the video you want. It all joins my edit queue.", panel: <VideoEditPanel building={building} /> };
    case "funnel": {
      const w = weekLogs(data, today);
      return { text: `This week ${w.leads} leads came in, ${w.bookedCalls} booked a call and ${w.closes} closed. Here's every deal in the funnel.`, panel: <FunnelPanel goTo={goTo} /> };
    }
    case "ads": {
      const list = adsFor(data, building, role.id === "adsTracker");
      return {
        text: list.length ? `${list.length} campaign${list.length === 1 ? " reports" : "s report"} to me. The live numbers open in Ad Command.` : `No campaigns are filed under ${place} yet. Track one in Ad Command and put it in this client's folder.`,
        panel: <AdsPanel building={building} all={role.id === "adsTracker"} goTo={goTo} />,
      };
    }
    case "webinar": {
      const d = staff.setup?.date;
      const days = d ? Math.round((Date.parse(d + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000) : null;
      return {
        text: days == null ? "Give me the webinar date and I'll count down to it." : days > 0 ? `${days} day${days === 1 ? "" : "s"} to the webinar! Let's fill those seats.` : days === 0 ? "The webinar is TODAY! Places, everyone!" : "The webinar is done. Time for the replay and follow-ups.",
        panel: <WebinarPanel staff={staff} days={days} />,
      };
    }
    default:
      return { text: "", panel: <SetupPanel staff={staff} role={role} /> };
  }
}

function adsFor(data: TrackerData, b: CityBuilding, all: boolean) {
  return data.trackedCampaigns.filter((t) => all || clientsOf(b).some((id) => groupOf(data, t).key === `client:${id}`));
}

// ---------- panels ----------

function PanelTitle({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon name={icon} size={26} className="text-gold" />
      <h3 className="font-display text-2xl tracking-wide">{children}</h3>
    </div>
  );
}

function ReportPanel({ building }: { building: CityBuilding }) {
  const { data, update, month, today } = useTracker();
  const rep = buildingReport(data, building, month, today);
  const [editing, setEditing] = useState(false);
  const setNote = (v: string) => update((d) => void (d.city!.buildings.find((b) => b.id === building.id)!.progressNote = v));
  return (
    <div>
      <PanelTitle icon="chart">{rep.title}</PanelTitle>
      <div className="grid grid-cols-3 gap-2.5">
        {rep.stats.map(([k, v], i) => (
          <div key={k} className="bg-card-2 border-[3px] border-outline rounded-[10px] p-3 text-center city-count" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="comic-num text-4xl">{v}</div>
            <div className="text-sm font-extrabold uppercase text-muted">{k}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 h-4 rounded-full border-[3px] border-outline bg-card-2 overflow-hidden">
        <div className="h-full bg-good city-fill" style={{ width: `${Math.round(rep.pct * 100)}%` }} />
      </div>
      {rep.feed.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {rep.feed.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-base font-bold">
              <Icon name="check" size={18} className="text-good" />
              {f}
            </li>
          ))}
        </ul>
      )}
      <StaffWorkFeed buildingId={building.id} />
      <div className="mt-4 border-t-2 border-line pt-3">
        <div className="text-sm font-extrabold uppercase text-muted mb-1">Reporter&apos;s note</div>
        {editing || !building.progressNote ? (
          <div className="flex gap-2 flex-wrap">
            <NoteInput value={building.progressNote ?? ""} onSave={(v) => (setNote(v), setEditing(false))} placeholder="What the client should hear, e.g. 'Launch moved to Friday'" />
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <p className="text-lg font-bold flex-1">{building.progressNote}</p>
            <EditButton onClick={() => setEditing(true)} />
          </div>
        )}
      </div>
    </div>
  );
}

/** What the building's staff made lately, in the Progress Room. */
function StaffWorkFeed({ buildingId }: { buildingId: string }) {
  const { data, today } = useTracker();
  const [open, setOpen] = useState("");
  const list = (data.staffWork ?? []).filter((w) => w.buildingId === buildingId).slice(0, 6);
  if (!list.length) return null;
  const who = (id: string) => data.city?.staff.find((s) => s.id === id)?.name ?? "Someone";
  return (
    <div className="mt-4 border-t-2 border-line pt-3">
      <div className="text-sm font-extrabold uppercase text-muted mb-1">What the team made</div>
      <ul className="space-y-1.5">
        {list.map((w) => (
          <li key={w.id} className="bg-card-2 border-2 border-outline rounded-[8px] px-3 py-2">
            <button type="button" className="w-full flex items-center gap-2 text-left" onClick={() => setOpen(open === w.id ? "" : w.id)}>
              <Icon name="check" size={18} className="text-good shrink-0" />
              <span className="font-bold flex-1 min-w-0 truncate">
                {who(w.staffId)}: {w.label}
              </span>
              <Badge tone={w.day === today ? "gold" : "muted"}>{w.day === today ? "Today" : w.day}</Badge>
            </button>
            {open === w.id && <div className="text-base whitespace-pre-wrap leading-relaxed mt-2 max-h-72 overflow-y-auto">{w.text}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NoteInput({ value, onSave, placeholder }: { value: string; onSave: (v: string) => void; placeholder?: string }) {
  const [t, setT] = useState(value);
  return (
    <>
      <input className="flex-1 min-w-48" value={t} placeholder={placeholder} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSave(t.trim())} />
      <SaveButton onClick={() => onSave(t.trim())} />
    </>
  );
}

function TasksPanel({ building }: { building: CityBuilding }) {
  const { data, update, today } = useTracker();
  const list = missions(data, building);
  const [title, setTitle] = useState("");
  const add = () => {
    const t = title.trim();
    if (!t) return;
    update((d) => {
      if (building.clientId) {
        d.clientTasks = [...(d.clientTasks ?? []), { id: uid("ct"), clientId: building.clientId, title: t, assignees: [ME], status: "todo", createdAt: today }];
      } else {
        const b = d.city!.buildings.find((x) => x.id === building.id)!;
        b.todos = [...(b.todos ?? []), { id: uid("todo"), title: t, done: false }];
      }
    });
    setTitle("");
    sfx("coin");
  };
  const tap = (id: string) =>
    update((d) => {
      if (building.clientId) {
        const t = d.clientTasks?.find((x) => x.id === id);
        if (!t) return;
        t.status = nextStatus(t.status);
        t.doneOn = t.status === "done" ? today : undefined;
      } else {
        const t = d.city!.buildings.find((x) => x.id === building.id)?.todos?.find((x) => x.id === id);
        if (!t) return;
        t.done = !t.done;
        t.doneOn = t.done ? today : undefined;
      }
    });
  const label = (m: (typeof list)[number]) => (m.status ? { todo: "To do", doing: "Doing", done: "Done" }[m.status] : m.done ? "Done" : "To do");
  const tone = (m: (typeof list)[number]) => (m.done ? "bg-good" : m.status === "doing" ? "bg-gold" : "bg-card-2 text-ink");
  return (
    <div>
      <PanelTitle icon="target">Mission board</PanelTitle>
      <ul className="space-y-2">
        {list.map((m) => (
          <li key={m.id} className={`flex items-center gap-3 bg-card-2 border-[3px] border-outline rounded-[10px] px-3 py-2 ${m.done ? "opacity-70" : ""}`}>
            <button type="button" onClick={() => tap(m.id)} className={`shrink-0 font-display text-base tracking-wide border-2 border-outline rounded-md px-2.5 pt-1 pb-0.5 text-outline ${tone(m)}`}>
              {label(m)}
            </button>
            <span className={`text-lg font-bold flex-1 min-w-0 ${m.done ? "line-through" : ""}`}>{m.title}</span>
            {m.dueDate && <span className={`text-sm font-extrabold ${!m.done && m.dueDate < today ? "text-bad" : "text-muted"}`}>{m.dueDate.slice(5)}</span>}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mt-3 flex-wrap">
        <input className="flex-1 min-w-48" value={title} placeholder="New mission…" onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Btn kind="primary" onClick={add}>
          <Icon name="check" size={20} /> Add
        </Btn>
      </div>
      {building.clientId && <p className="text-sm text-muted mt-2">These are this client&apos;s tasks from the Clients tab, so finishing one here pays coins like anywhere else.</p>}
    </div>
  );
}

function SetupPanel({ staff, role }: { staff: CityStaff; role: StaffRole }) {
  const { data, update, reload } = useTracker();
  const keys = data.integrations?.staffKeys ?? [];
  const [editing, setEditing] = useState(setupProgress(staff, keys).missing.length > 0);
  const [draft, setDraft] = useState<Record<string, string>>({ ...(staff.setup ?? {}) });
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!role.needs.length) return <p className="text-lg font-bold">I don&apos;t need anything from you. Just come say hi.</p>;
  const save = async () => {
    setErr("");
    setBusy(true);
    update((d) => {
      const s = d.city!.staff.find((x) => x.id === staff.id)!;
      s.setup = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
    });
    try {
      for (const [k, v] of Object.entries(secrets)) {
        if (!v.trim()) continue;
        const res = await fetch("/api/city/key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: secretKey(staff.id, k), value: v }) });
        if (!res.ok) throw new Error((await res.json()).error ?? "Couldn't save that key");
      }
      if (Object.values(secrets).some((v) => v.trim())) await reload();
      setSecrets({});
      setEditing(false);
      sfx("coin");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Icon name="key" size={26} className="text-gold" />
          <h3 className="font-display text-2xl tracking-wide">What {staff.name} needs</h3>
        </div>
        {!editing && <EditButton onClick={() => setEditing(true)} />}
      </div>
      <ul className="space-y-2">
        {role.needs.map((n) => {
          const val = staff.setup?.[n.key];
          const has = n.secret ? keys.includes(secretKey(staff.id, n.key)) : Boolean(val?.trim());
          return (
            <li key={n.key} className="flex items-center gap-3 bg-card-2 border-[3px] border-outline rounded-[10px] px-3 py-2">
              <span className={`shrink-0 w-4 h-4 rounded-full border-2 border-outline ${has ? "bg-good" : n.optional ? "bg-line" : "bg-bad city-blink"}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold uppercase text-muted">
                  {n.label}
                  {n.optional ? " (optional)" : ""}
                </div>
                {editing ? (
                  n.secret ? (
                    <input type="password" className="w-full mt-1" placeholder={has ? "Saved. Paste a new one to replace it" : n.placeholder} value={secrets[n.key] ?? ""} onChange={(e) => setSecrets({ ...secrets, [n.key]: e.target.value })} autoComplete="off" />
                  ) : (
                    <input className="w-full mt-1" placeholder={n.placeholder} value={draft[n.key] ?? ""} onChange={(e) => setDraft({ ...draft, [n.key]: e.target.value })} />
                  )
                ) : (
                  <div className="text-lg font-bold [overflow-wrap:anywhere]">{n.secret ? (has ? "Saved and locked" : "Not given yet") : val || "Not given yet"}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {err && <p className="text-bad font-bold mt-2">{err}</p>}
      {editing && (
        <div className="mt-3 flex gap-2">
          <SaveButton onClick={save} label={busy ? "Saving…" : "Save"} />
          <Btn onClick={() => setEditing(false)}>Cancel</Btn>
        </div>
      )}
      <p className="text-sm text-muted mt-3">Keys and passwords are encrypted on the server and never shown again. {jobsOf(staff).length ? `${staff.name} works from these: open their work to see what they've made.` : `${staff.name} keeps these details ready for their job.`}</p>
    </div>
  );
}

function VideoAIPanel({ imageOnly = false }: { imageOnly?: boolean }) {
  const { data, reload } = useTracker();
  const [list, setList] = useState<Creative[]>(data.creatives ?? []);
  const [prompt, setPrompt] = useState("");
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const has = Boolean(data.integrations?.higgsfield);
  const refresh = async () => {
    const r = await fetch("/api/creative", { cache: "no-store" });
    if (r.ok) setList((await r.json()).creatives);
  };
  const generating = list.some((c) => c.status === "generating");
  useEffect(() => {
    if (!has) return;
    refresh();
  }, [has]);
  useEffect(() => {
    if (!generating) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [generating]);
  const post = async (url: string, body: unknown) => {
    setErr("");
    setBusy(true);
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Something went wrong");
      if (j.creatives) setList(j.creatives);
      return true;
    } catch (e) {
      setErr((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  if (!has) {
    return (
      <div>
        <PanelTitle icon="key">Higgsfield key</PanelTitle>
        <p className="text-base mb-2">Make one at cloud.higgsfield.ai and paste it as KEY_ID:KEY_SECRET.</p>
        <div className="flex gap-2 flex-wrap">
          <input type="password" className="flex-1 min-w-48" placeholder="KEY_ID:KEY_SECRET" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />
          <SaveButton onClick={async () => (await post("/api/creative/key", { key })) && reload()} label={busy ? "Saving…" : "Save key"} />
        </div>
        {err && <p className="text-bad font-bold mt-2">{err}</p>}
      </div>
    );
  }
  const recent = list.filter((c) => c.source === "higgsfield").slice(0, 6);
  return (
    <div>
      <PanelTitle icon={imageOnly ? "image" : "film"}>{imageOnly ? "Make an ad image" : "Shoot a new scene"}</PanelTitle>
      <textarea className="w-full min-h-20" placeholder={imageOnly ? "e.g. Bold ad image, headline 'Get 50 booked calls in 30 days' at the top, happy coach at a laptop, bright colours, 4:5" : "e.g. Anime-style hero walking through a neon city at night, cinematic, 9:16"} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <div className="flex gap-2 mt-2 flex-wrap">
        <Btn kind="primary" disabled={busy || !prompt.trim()} onClick={async () => (await post("/api/creative", { op: "image", prompt })) && sfx("loot")}>
          <Icon name="image" size={20} /> {imageOnly ? "Make the image" : "Shoot the first frame"}
        </Btn>
      </div>
      {err && <p className="text-bad font-bold mt-2">{err}</p>}
      {recent.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
          {recent.map((c) => (
            <div key={c.id} className="bg-card-2 border-[3px] border-outline rounded-[10px] overflow-hidden">
              <div className="aspect-[4/5] bg-outline grid place-content-center">
                {c.status === "ready" && c.url ? (
                  c.kind === "video" ? <video src={c.url} controls playsInline className="w-full h-full object-cover" /> : <img src={c.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-xl text-muted">{c.status === "generating" ? "Rendering…" : "Failed"}</span>
                )}
              </div>
              {!imageOnly && c.kind === "image" && c.status === "ready" && c.url && (
                <button type="button" className="w-full font-display tracking-wide text-base py-1.5 bg-accent text-outline border-t-[3px] border-outline" disabled={busy} onClick={() => post("/api/creative", { op: "video", prompt: c.prompt || prompt || "Cinematic motion", imageUrl: c.url, duration: 5 })}>
                  Animate it
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-sm text-muted mt-3">Uses your Higgsfield credits. Everything made here also shows in the Creatives tab, ready for test ads.</p>
    </div>
  );
}

function WriterPanel({ staff }: { staff: CityStaff }) {
  const { data, update, today } = useTracker();
  const live = data.city?.staff.find((s) => s.id === staff.id) ?? staff;
  const [tab, setTab] = useState<"write" | "how" | "samples">("write");
  const [input, setInput] = useState("");
  const [target, setTarget] = useState("");
  const [more, setMore] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editingHow, setEditingHow] = useState(false);
  const [how, setHow] = useState(live.instructions || WRITER_PROMPTS[live.role] || "");
  const [sample, setSample] = useState("");
  const [copied, setCopied] = useState("");
  const edit = (fn: (s: CityStaff) => void) => update((d) => fn(d.city!.staff.find((x) => x.id === staff.id)!));
  const write = async () => {
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/city/write", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staffId: staff.id, input, target, more }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Something went wrong");
      update((d) => void (d.staffWork = j.work));
      setInput("");
      sfx("loot");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  };
  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {([["write", "Write"], ["how", "How I write"], ["samples", `Samples (${live.samples?.length ?? 0})`]] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`btn text-base ${tab === id ? "btn-primary" : "btn-ghost"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "write" && (
        <div>
          <textarea className="w-full min-h-28" placeholder="Paste the landing page or sales page copy here" value={input} onChange={(e) => setInput(e.target.value)} />
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            <input placeholder={live.role === "imageCopy" ? "Target market (blank = I'll suggest one)" : "Target market (optional)"} value={target} onChange={(e) => setTarget(e.target.value)} />
            <input placeholder="Extra direction (optional), e.g. Taglish, myth-busting ad" value={more} onChange={(e) => setMore(e.target.value)} />
          </div>
          <Btn kind="primary" className="mt-2" disabled={busy || input.trim().length < 40} onClick={write}>
            <Icon name="pencil" size={20} /> {busy ? "Writing…" : "Write it"}
          </Btn>
          {err && <p className="text-bad font-bold mt-2">{err}</p>}
          <QueuePoll staffId={live.id} />
          {[...workOf(data, live.id).map((w) => ({ id: w.id, text: w.text, at: w.day, target: undefined as string | undefined, queued: w.status === "queued" })), ...(live.outputs ?? []).map((o) => ({ ...o, queued: false }))].map((o, i) => (
            <div key={o.id} className={`mt-4 bg-card-2 border-[3px] border-outline rounded-[10px] p-3 ${i === 0 ? "city-pop" : ""}`}>
              <div className="flex items-center gap-2 mb-2">
                <Badge tone={i === 0 ? "gold" : "muted"}>{i === 0 ? "Latest" : o.at}</Badge>
                {o.queued && <Badge tone="accent">Writing it</Badge>}
                {o.target && <span className="text-sm font-bold text-muted truncate">For: {o.target}</span>}
                {!o.queued && <Btn className="ml-auto text-sm py-1" onClick={() => copy(o.id, o.text)}>{copied === o.id ? "Copied" : "Copy"}</Btn>}
              </div>
              <div className="text-base whitespace-pre-wrap leading-relaxed">{o.queued ? `${live.name} is writing this through your Claude account. Within the hour it shows up here and in Outputs (top right of the city).` : o.text}</div>
            </div>
          ))}
        </div>
      )}
      {tab === "how" && (
        <div>
          {editingHow ? (
            <>
              <textarea className="w-full min-h-64 text-base" value={how} onChange={(e) => setHow(e.target.value)} />
              <div className="flex gap-2 mt-2 flex-wrap">
                <SaveButton onClick={() => (edit((s) => void (s.instructions = how.trim() === (WRITER_PROMPTS[s.role] ?? "").trim() ? undefined : how)), setEditingHow(false))} />
                <Btn onClick={() => setHow(WRITER_PROMPTS[live.role] ?? "")}>Back to the original</Btn>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <EditButton onClick={() => setEditingHow(true)} />
              </div>
              <div className="text-base whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">{live.instructions || WRITER_PROMPTS[live.role]}</div>
            </>
          )}
        </div>
      )}
      {tab === "samples" && (
        <div>
          <p className="text-base mb-2">Paste sample ads (scripts, copy, or the words on sample ad images) for {live.name} to study and match.</p>
          <ul className="space-y-2">
            {(live.samples ?? []).map((sm, i) => (
              <li key={sm.id} className="bg-card-2 border-[3px] border-outline rounded-[10px] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge tone="accent">Sample {i + 1}</Badge>
                  <Btn kind="danger" className="ml-auto text-sm py-1" onClick={() => edit((s) => void (s.samples = (s.samples ?? []).filter((x) => x.id !== sm.id)))}>
                    Remove
                  </Btn>
                </div>
                <div className="text-base whitespace-pre-wrap max-h-40 overflow-y-auto">{sm.text}</div>
              </li>
            ))}
          </ul>
          <textarea className="w-full min-h-24 mt-2" placeholder="Paste a sample here" value={sample} onChange={(e) => setSample(e.target.value)} />
          <Btn
            kind="primary"
            className="mt-2"
            disabled={!sample.trim()}
            onClick={() => {
              edit((s) => void (s.samples = [...(s.samples ?? []), { id: uid("smp"), text: sample.trim() }]));
              setSample("");
            }}
          >
            Add sample
          </Btn>
        </div>
      )}
    </div>
  );
}

const STYLES = ["Anime", "Cinematic", "TikTok fast cuts", "Talking head + captions", "Clean corporate", "Vlog"];

function VideoEditPanel({ building }: { building: CityBuilding }) {
  const { data, update, today } = useTracker();
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState(STYLES[2]);
  const [prompt, setPrompt] = useState("");
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState("");
  const reqs = (data.city?.videoRequests ?? []).filter((r) => r.buildingId === building.id);
  const link = url.trim();
  const ok = (Boolean(file) || /^https?:\/\//.test(link) || prompt.trim().length > 3) && pct == null;

  // Straight from your computer to storage, in 40 MB pieces (three at a time, each retried),
  // so any size goes up and a dropped connection only costs one piece.
  const upload = async (f: File): Promise<{ path: string; name: string; size: number; parts?: number }> => {
    const res = await fetch("/api/city/video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, type: f.type || "video/mp4", size: f.size }) });
    const j = (await res.json()) as { uploadUrls?: string[]; path?: string; partBytes?: number; error?: string };
    if (!res.ok || !j.uploadUrls?.length || !j.path) throw new Error(j.error ?? "Couldn't start the upload");
    const urls = j.uploadUrls;
    const size = j.partBytes ?? f.size;
    const sent = new Array<number>(urls.length).fill(0);
    const show = () => setPct(sent.reduce((a, b) => a + b, 0) / f.size);
    const put = (i: number) =>
      new Promise<void>((resolve, reject) => {
        const x = new XMLHttpRequest();
        x.open("PUT", urls[i]);
        x.setRequestHeader("Content-Type", f.type || "video/mp4");
        x.upload.onprogress = (e) => ((sent[i] = e.loaded), show());
        x.onload = () => (x.status < 300 ? resolve() : reject(new Error(`Upload failed (${x.status}): ${x.responseText.slice(0, 160)}`)));
        x.onerror = () => reject(new Error("Upload failed. Check your connection."));
        x.send(urls.length > 1 ? f.slice(i * size, (i + 1) * size) : f);
      });
    let next = 0;
    const worker = async () => {
      while (next < urls.length) {
        const i = next++;
        for (let tries = 0; ; tries++) {
          try {
            await put(i);
            break;
          } catch (e) {
            sent[i] = 0;
            if (tries >= 2) throw e;
          }
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    return { path: j.path, name: f.name, size: f.size, parts: urls.length > 1 ? urls.length : undefined };
  };

  const send = async () => {
    if (!ok) return;
    setError("");
    try {
      let saved: { path: string; name: string; size: number } | undefined;
      if (file) {
        setPct(0);
        saved = await upload(file);
      }
      update((d) => {
        d.city!.videoRequests = [{ id: uid("vid"), buildingId: building.id, videoUrl: /^https?:\/\//.test(link) ? link : "", file: saved, style, prompt: prompt.trim(), status: "requested", createdAt: today }, ...(d.city!.videoRequests ?? [])];
      });
      setUrl("");
      setFile(null);
      setPrompt("");
      sfx("loot");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPct(null);
    }
  };
  const setStatus = (id: string, status: "requested" | "editing" | "done") => update((d) => void (d.city!.videoRequests!.find((r) => r.id === id)!.status = status));
  return (
    <div>
      <PanelTitle icon="film">New edit request</PanelTitle>
      <p className="text-base font-bold text-muted mb-2">Upload your raw video, paste a link to it, or just describe the video you want.</p>
      <label className="flex items-center gap-3 bg-card-2 border-[3px] border-dashed border-outline rounded-[10px] px-3 py-3 cursor-pointer">
        <Icon name="film" size={26} />
        <span className="flex-1 min-w-0 font-bold text-lg truncate">{file ? `${file.name} (${(file.size / 1048576).toFixed(1)} MB)` : "Upload a video from your computer (any size)"}</span>
        {file && (
          <button type="button" className="text-bad font-extrabold" onClick={(e) => (e.preventDefault(), setFile(null))}>
            Remove
          </button>
        )}
        <input type="file" accept="video/*" className="sr-only" onChange={(e) => (setFile(e.target.files?.[0] ?? null), setError(""))} />
      </label>
      {!file && <input className="w-full mt-2" placeholder="Or a link to it (Google Drive, Dropbox…)" value={url} onChange={(e) => setUrl(e.target.value)} />}
      <div className="flex flex-wrap gap-2 mt-2">
        {STYLES.map((s) => (
          <button key={s} type="button" onClick={() => setStyle(s)} className={`btn text-base ${style === s ? "btn-primary" : "btn-ghost"}`}>
            {s}
          </button>
        ))}
      </div>
      <textarea className="w-full min-h-20 mt-2" placeholder="How should it be edited? e.g. Cut to 30s, hook in the first 2 seconds, captions in yellow, upbeat music" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      {pct != null && (
        <div className="mt-2 h-3 rounded-full bg-card-2 border-2 border-outline overflow-hidden">
          <div className="h-full bg-good" style={{ width: `${Math.round(pct * 100)}%` }} />
        </div>
      )}
      {error && <p className="text-bad font-bold mt-2">{error}</p>}
      <Btn kind="primary" className="mt-2" onClick={send} disabled={!ok}>
        <Icon name="film" size={20} /> {pct != null ? `Uploading ${Math.round(pct * 100)}%` : "Send to the edit queue"}
      </Btn>
      {reqs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {reqs.map((r) => (
            <li key={r.id} className="bg-card-2 border-[3px] border-outline rounded-[10px] px-3 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={r.status === "done" ? "good" : r.status === "editing" ? "gold" : "accent"}>{r.status === "done" ? "Done" : r.status === "editing" ? "Editing" : "Requested"}</Badge>
                <span className="font-bold">{r.style}</span>
                {r.file ? (
                  <VideoFileLink file={r.file} />
                ) : r.videoUrl ? (
                  <a href={r.videoUrl} target="_blank" rel="noreferrer" className="text-accent font-bold underline ml-auto">Raw video</a>
                ) : (
                  <span className="ml-auto text-sm font-bold text-muted">Prompt only</span>
                )}
              </div>
              {r.prompt && <p className="text-base mt-1">{r.prompt}</p>}
              <div className="flex gap-2 mt-2">
                {r.status !== "editing" && r.status !== "done" && <Btn className="text-sm py-1" onClick={() => setStatus(r.id, "editing")}>Mark editing</Btn>}
                {r.status !== "done" && <Btn className="text-sm py-1" onClick={() => setStatus(r.id, "done")}>Mark done</Btn>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted mt-3">Any size and any length goes up. Requests wait here with the style and notes. To get one edited, ask Claude in the project: it downloads the full video from here and edits the whole thing.</p>
    </div>
  );
}

function WorkPanel({ staff, goTo }: { staff: CityStaff; goTo: (t: string) => void }) {
  const { data, update, today } = useTracker();
  const live = data.city?.staff.find((s) => s.id === staff.id) ?? staff;
  const jobs = jobsOf(live);
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const [, tick] = useState(0);
  useEffect(() => onRunning(() => tick((n) => n + 1)), []);
  const doing = runningJobs().get(live.id);
  const job = jobs.find((j) => j.id === jobId) ?? jobs[0];
  const mine = workOf(data, live.id);
  const keys = data.integrations?.staffKeys ?? [];
  const canPost = live.role === "discord" && Boolean(live.setup?.channel) && keys.includes(secretKey(live.id, "botToken"));
  const due = dueJob(data, live, today);
  if (!job) return null;
  const go = async () => {
    setErr("");
    try {
      const j = await runJob(live.id, job.doing, { jobId: job.id, input });
      update((d) => void (d.staffWork = j.work));
      setInput("");
      setOpen(j.work[0]?.id ?? null);
      sfx("loot");
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const call = async (method: "POST" | "DELETE", body?: unknown, q = "") => {
    setErr("");
    try {
      const r = await fetch(`/api/city/work${q}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Something went wrong");
      update((d) => void (d.staffWork = j.work));
      return true;
    } catch (e) {
      setErr((e as Error).message);
      return false;
    }
  };
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon name="pencil" size={26} className="text-gold" />
          <h3 className="font-display text-2xl tracking-wide">{live.name}&apos;s work</h3>
        </div>
        {jobs.some((j) => j.every && !j.input?.required) && <button
          type="button"
          className={`btn text-sm ${live.autoWork === false ? "btn-ghost" : "btn-primary"}`}
          onClick={() => update((d) => void (d.city!.staff.find((x) => x.id === live.id)!.autoWork = live.autoWork === false ? undefined : false))}
          title="When on, they do their daily job on their own (when you open the city, and every morning at 9:00)"
        >
          Works on their own: {live.autoWork === false ? "Off" : "On"}
        </button>}
      </div>
      <QueuePoll staffId={live.id} />
      {NOT_LIVE[live.role] && <p className="text-base font-bold text-muted mb-3">{NOT_LIVE[live.role]}</p>}
      <div className="flex gap-2 flex-wrap">
        {jobs.map((j) => (
          <button key={j.id} type="button" onClick={() => setJobId(j.id)} className={`btn text-base ${j.id === job.id ? "btn-primary" : "btn-ghost"}`}>
            {j.label}
          </button>
        ))}
      </div>
      {job.input && <textarea className="w-full min-h-24 mt-2" placeholder={`${job.input.label}: ${job.input.placeholder}`} value={input} onChange={(e) => setInput(e.target.value)} />}
      <Btn kind="primary" className="mt-2" disabled={Boolean(doing) || (job.input?.required && input.trim().length < 10)} onClick={go}>
        <Icon name="rocket" size={20} /> {doing ? `${doing}…` : "Do it now"}
      </Btn>
      {doing && <p className="text-base font-bold text-good mt-2 city-blink">{live.name} is on it. This takes up to a minute.</p>}
      {!doing && due && live.autoWork !== false && <p className="text-sm font-bold text-muted mt-2">Up next on their own: {due.label.toLowerCase()}.</p>}
      {err && <p className="text-bad font-bold mt-2">{err}</p>}
      <ul className="mt-4 space-y-2">
        {mine.map((w, i) => {
          const shown = open === w.id || (open == null && i === 0);
          return (
            <li key={w.id} className={`bg-card-2 border-[3px] border-outline rounded-[10px] p-3 ${i === 0 ? "city-pop" : ""}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" className="font-display text-xl tracking-wide text-left flex-1 min-w-0 truncate" onClick={() => setOpen(shown ? "" : w.id)}>
                  {w.label}
                </button>
                <Badge tone={w.day === today ? "gold" : "muted"}>{w.day === today ? "Today" : w.day}</Badge>
                {w.status === "queued" && <Badge tone="accent">Working on it</Badge>}
                {w.auto && <Badge tone="accent">On their own</Badge>}
                {w.sent && <Badge tone="good">{w.sent}</Badge>}
              </div>
              {shown && (
                <>
                  {w.input && <p className="text-sm text-muted mt-1 truncate">From: {w.input}</p>}
                  {w.status === "queued" ? (
                    <p className="text-base font-bold mt-2">{live.name} is working on this through your Claude account. Within the hour it shows up here and in Outputs (top right of the city), so no need to wait around.</p>
                  ) : (
                    <div className="text-base whitespace-pre-wrap leading-relaxed mt-2 max-h-96 overflow-y-auto">{w.text}</div>
                  )}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {w.status !== "queued" && <Btn className="text-sm py-1" onClick={() => copy(w.id, w.text)}>{copied === w.id ? "Copied" : "Copy"}</Btn>}
                    {canPost && !w.sent && w.status !== "queued" && (
                      <Btn kind="primary" className="text-sm py-1" onClick={async () => (await call("POST", { workId: w.id, post: "discord" })) && sfx("coin")}>
                        Post to Discord
                      </Btn>
                    )}
                    <Btn kind="danger" className="text-sm py-1 ml-auto" onClick={() => call("DELETE", undefined, `?id=${encodeURIComponent(w.id)}`)}>
                      Remove
                    </Btn>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {!mine.length && <p className="text-base text-muted mt-3">Nothing made yet.</p>}
    </div>
  );
}

/** While someone's work is queued, checks every minute for it to come back done. */
function QueuePoll({ staffId }: { staffId: string }) {
  const { data, update } = useTracker();
  const waiting = (data.staffWork ?? []).some((w) => w.staffId === staffId && w.status === "queued");
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/city/work", { cache: "no-store" });
        if (!r.ok) return;
        const { work } = (await r.json()) as { work: StaffWork[] };
        update((d) => void (d.staffWork = work));
      } catch {}
    }, 60000);
    return () => clearInterval(t);
  }, [waiting]);
  return null;
}

/** Opens an uploaded video. A video stored in pieces is joined back together in the browser first. */
function VideoFileLink({ file }: { file: NonNullable<VideoRequest["file"]> }) {
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const href = `/api/city/video?path=${encodeURIComponent(file.path)}`;
  const cls = "text-accent font-bold underline ml-auto truncate max-w-[50%]";
  if (!file.parts) return <a href={href} target="_blank" rel="noreferrer" className={cls}>{file.name}</a>;
  const get = async () => {
    setErr("");
    setPct(0);
    try {
      const r = await fetch(`${href}&parts=${file.parts}`, { cache: "no-store" });
      const { urls } = (await r.json()) as { urls: string[] };
      const pieces: Blob[] = [];
      for (const [i, u] of urls.entries()) {
        const res = await fetch(u);
        if (!res.ok) throw new Error(`Piece ${i + 1} is missing (${res.status})`);
        pieces.push(await res.blob());
        setPct((i + 1) / urls.length);
      }
      const url = URL.createObjectURL(new Blob(pieces, { type: pieces[0]?.type || "video/mp4" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPct(null);
    }
  };
  return (
    <button type="button" className={cls} onClick={get} disabled={pct != null} title={err || `${(file.size / 1048576).toFixed(0)} MB`}>
      {pct != null ? `Downloading ${Math.round(pct * 100)}%` : err ? "Retry download" : file.name}
    </button>
  );
}

function FunnelPanel({ goTo }: { goTo: (t: string) => void }) {
  const { data, today } = useTracker();
  const w = weekLogs(data, today);
  const stages: [string, string[]][] = [["Leads", ["lead"]], ["Proposals", ["proposal"]], ["Negotiating", ["negotiating"]], ["Won", ["won"]]];
  const rows = stages.map(([label, st]) => {
    const ds = data.deals.filter((d) => st.includes(d.stage));
    return { label, n: ds.length, value: ds.reduce((a, d) => a + d.value, 0) };
  });
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div>
      <PanelTitle icon="rocket">The funnel</PanelTitle>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-28 text-base font-extrabold">{r.label}</span>
            <div className="flex-1 h-8 bg-card-2 border-[3px] border-outline rounded-md overflow-hidden">
              <div className="h-full bg-gold city-fill flex items-center px-2 font-display text-outline text-lg" style={{ width: `${Math.max(8, (r.n / max) * 100)}%`, animationDelay: `${i * 100}ms` }}>
                {r.n}
              </div>
            </div>
            <span className="w-28 text-right text-base font-bold">{money(r.value)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 mt-4 text-center">
        {([["Leads", w.leads], ["Calls", w.bookedCalls], ["Shows", w.showUps], ["Closes", w.closes]] as const).map(([k, v]) => (
          <div key={k} className="bg-card-2 border-[3px] border-outline rounded-[10px] p-2">
            <div className="comic-num text-3xl">{v}</div>
            <div className="text-xs font-extrabold uppercase text-muted">{k} this week</div>
          </div>
        ))}
      </div>
      <Btn kind="primary" className="mt-3" onClick={() => goTo("pipeline")}>
        <Icon name="swords" size={20} /> Open Boss Deals
      </Btn>
    </div>
  );
}

function AdsPanel({ building, all, goTo }: { building: CityBuilding; all: boolean; goTo: (t: string) => void }) {
  const { data } = useTracker();
  const list = adsFor(data, building, all);
  return (
    <div>
      <PanelTitle icon="radar">Campaigns reporting in</PanelTitle>
      {list.length ? (
        <ul className="space-y-2">
          {list.map((t) => (
            <li key={t.id} className="flex items-center gap-3 bg-card-2 border-[3px] border-outline rounded-[10px] px-3 py-2">
              <Icon name="target" size={20} className="text-good" />
              <span className="text-lg font-bold flex-1 min-w-0">{t.name}</span>
              <Badge tone={t.mode === "autopilot" ? "hero" : t.mode === "manage" ? "gold" : "muted"}>{t.mode === "autopilot" ? "Autopilot" : t.mode === "manage" ? "Manage" : "View"}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-lg font-bold">Nothing filed here yet.</p>
      )}
      <Btn kind="primary" className="mt-3" onClick={() => goTo("ads")}>
        <Icon name="radar" size={20} /> Open Ad Command
      </Btn>
    </div>
  );
}

function WebinarPanel({ staff, days }: { staff: CityStaff; days: number | null }) {
  const s = staff.setup ?? {};
  const goal = Number(s.goal) || 0;
  const got = Number(s.signups) || 0;
  return (
    <div>
      <PanelTitle icon="mic">Webinar</PanelTitle>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card-2 border-[3px] border-outline rounded-[10px] p-3 text-center">
          <div className="comic-num text-5xl">{days == null ? "?" : Math.max(0, days)}</div>
          <div className="text-sm font-extrabold uppercase text-muted">Days to go</div>
          {s.date && <div className="text-base font-bold mt-1">{s.date} {s.time}</div>}
        </div>
        <div className="bg-card-2 border-[3px] border-outline rounded-[10px] p-3 text-center">
          <div className="comic-num text-5xl">{got}</div>
          <div className="text-sm font-extrabold uppercase text-muted">Sign-ups{goal ? ` of ${goal}` : ""}</div>
          {goal > 0 && (
            <div className="mt-2 h-3 rounded-full border-2 border-outline bg-bg overflow-hidden">
              <div className="h-full bg-hero city-fill" style={{ width: `${Math.min(100, (got / goal) * 100)}%` }} />
            </div>
          )}
        </div>
      </div>
      {s.page && (
        <a href={s.page} target="_blank" rel="noreferrer" className="inline-block mt-3 text-accent font-bold underline">
          Sign-up page
        </a>
      )}
      <div className="mt-4">
        <SetupPanel staff={staff} role={ROLES.webinar} />
      </div>
    </div>
  );
}

function RoomPanel({ building, roomId }: { building: CityBuilding; roomId: string }) {
  const { update } = useTracker();
  const room = building.rooms?.find((r) => r.id === roomId);
  const [editing, setEditing] = useState(!room?.notes);
  if (!room) return null;
  const save = (v: string) => {
    update((d) => void (d.city!.buildings.find((b) => b.id === building.id)!.rooms!.find((r) => r.id === roomId)!.notes = v));
    setEditing(false);
  };
  return (
    <div>
      <PanelTitle icon="home">{room.name}</PanelTitle>
      {editing ? (
        <div className="flex gap-2 flex-wrap">
          <NoteInput value={room.notes ?? ""} onSave={save} placeholder="What's in this room: results, files, links…" />
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <p className="text-lg font-bold flex-1 whitespace-pre-wrap">{room.notes}</p>
          <EditButton onClick={() => setEditing(true)} />
        </div>
      )}
    </div>
  );
}


/** Looks for townspeople and shopkeepers (the same seeds as in the city). */
const portraits = new Map<string, HeroLook>();
function citizenPortrait(id: string): HeroLook {
  if (!portraits.has(id)) {
    const c = citizenById(id);
    const l = randomHeroLook(rng(hashString(c?.seed ?? id)));
    if (id === "stranger") Object.assign(l, { outfit: "#16151f", accent: "#7c5cff", hairColor: "#16151f", skin: "#c4bfe6", eyes: "#b5179e", back: "cape", backColor: "#2b2d42", neck: "none" });
    if (id === "bram") Object.assign(l, { hairColor: "#f5f5f5", outfit: "#5a3825", accent: "#9aa0b4" });
    if (id === "ume") Object.assign(l, { hairColor: "#d8d8e0", outfit: "#f15bb5" });
    portraits.set(id, l);
  }
  return portraits.get(id)!;
}

function QuestCard({ id }: { id: string }) {
  const { data } = useTracker();
  const q = questById(id);
  if (!q) return null;
  const st = questState(data, id);
  const got = questProgress(data, id);
  const claimed = Boolean(data.game?.claimed?.[`cquest:${id}`]);
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon name="scroll" size={26} className="text-gold" />
        <h3 className="font-display text-2xl tracking-wide flex-1">Quest: {q.title}</h3>
        <Badge tone={st === "done" ? "good" : st === "active" ? "gold" : "accent"}>{st === "done" ? (claimed ? "Complete" : "Done!") : st === "active" ? "In progress" : "New"}</Badge>
      </div>
      <p className="text-lg font-bold">{q.goal}</p>
      <div className="flex items-center gap-3 mt-3">
        <div className="flex-1 h-4 rounded-full border-[3px] border-outline bg-card-2 overflow-hidden">
          <div className="h-full bg-gold city-fill" style={{ width: `${st === "new" ? 0 : (got / q.need) * 100}%` }} />
        </div>
        <span className="font-display text-xl">{st === "new" ? 0 : got}/{q.need}</span>
        <span className="flex items-center gap-1 font-display text-xl text-gold">
          <Icon name="coin" size={20} /> {q.coins}
        </span>
      </div>
    </div>
  );
}

const STAT_LABEL: Record<string, string> = { hp: "HP", atk: "ATK", def: "DEF", spd: "SPD", crit: "CRIT" };

function ShopPanel({ slots }: { slots: string[] }) {
  const { data, update, today } = useTracker();
  const free = data.city?.freeShops !== false;
  const owned = new Set(data.game?.owned ?? []);
  const equipped = data.game?.equipped ?? {};
  const list = ITEMS.filter((i) => slots.includes(i.slot));
  const take = (id: string) =>
    update((d) => {
      const err = takeShopItem(d, id, today);
      if (err) toast(err);
      else sfx("loot");
    });
  const wear = (slot: ItemSlot, id: string) => update((d) => void (d.game!.equipped[slot] = d.game!.equipped[slot] === id ? undefined : id));
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon name="shop" size={26} className="text-gold" />
        <h3 className="font-display text-2xl tracking-wide flex-1">{free ? "Everything's free right now" : "For sale"}</h3>
        <span className="flex items-center gap-1 font-display text-xl"><Icon name="coin" size={20} className="text-gold" />{data.game?.coins ?? 0}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {list.map((it) => {
          const have = owned.has(it.id);
          const on = equipped[it.slot] === it.id;
          const locked = it.source === "loot";
          const stats = Object.entries(ITEM_POWER[it.id]?.stats ?? {});
          return (
            <div key={it.id} className="bg-card-2 border-[3px] border-outline rounded-[10px] overflow-hidden flex flex-col" style={{ boxShadow: `inset 0 0 0 2px ${RARITY[it.rarity].color}55` }}>
              <div className="h-24 grid place-content-center overflow-hidden" style={{ background: `radial-gradient(circle, ${RARITY[it.rarity].color}44, transparent 70%)` }}>
                <div className={locked && !have ? "opacity-40 grayscale" : ""}>
                  <Hero size={78} items={[it.id]} />
                </div>
              </div>
              <div className="p-2 flex-1 flex flex-col">
                <div className="font-extrabold leading-tight">{it.name}</div>
                <div className="text-xs font-extrabold uppercase" style={{ color: RARITY[it.rarity].color }}>
                  {RARITY[it.rarity].label} · {SLOT_LABEL[it.slot]}
                </div>
                {stats.length > 0 && <div className="text-xs font-bold text-muted mt-0.5">{stats.map(([k, v]) => `${STAT_LABEL[k] ?? k} +${v}`).join(" · ")}</div>}
                <div className="mt-auto pt-2">
                  {have ? (
                    <button type="button" onClick={() => wear(it.slot, it.id)} className={`w-full btn text-sm py-1 ${on ? "btn-primary" : "btn-ghost"}`}>
                      {on ? "Wearing" : "Wear"}
                    </button>
                  ) : locked ? (
                    <div className="text-xs font-extrabold text-hero text-center py-1">Drops beyond the gate</div>
                  ) : (
                    <button type="button" onClick={() => take(it.id)} className="w-full btn btn-primary text-sm py-1">
                      {free ? (
                        <>
                          <s className="opacity-60 mr-1">{it.price}</s> Free
                        </>
                      ) : (
                        `${it.price} coins`
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The Training Hall's weapon rack: borrow a weapon for practice fights. */
function RackPanel() {
  const { data, update } = useTracker();
  const cur = data.city?.practiceWeapon ?? "";
  const own = data.game?.equipped?.weapon;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon name="swords" size={26} className="text-gold" />
        <h3 className="font-display text-2xl tracking-wide">Practice weapons</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {PRACTICE_WEAPONS.map((id) => {
          const it = id ? ITEMS.find((i) => i.id === id) : undefined;
          const p = id ? itemPowerText(id) : null;
          const on = cur === id;
          return (
            <button
              key={id || "own"}
              type="button"
              aria-pressed={on}
              onClick={() => (update((d) => void (d.city!.practiceWeapon = id || undefined)), sfx("click"))}
              className={`text-left p-3 border-[3px] ${on ? "border-gold bg-gold/15" : "border-outline bg-card-2"}`}
            >
              <div className="flex items-center gap-3">
                <Hero size={64} items={id ? [id] : own ? [own] : []} gear={[]} />
                <div className="min-w-0">
                  <div className="font-bold text-lg">{it?.name ?? "My own gear"}</div>
                  <div className="text-sm font-bold text-muted">{p ? `${p.stats}${p.extra ? ` · ${p.extra}` : ""}` : own ? `Whatever you have on now` : "Bare hands and your outfit"}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
