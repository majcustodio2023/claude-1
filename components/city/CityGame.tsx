"use client";

// The walkable city. Top-down like the old Pokemon games: the player's own hero walks the
// streets, AI staff go about their jobs (out in their yards, across town to other buildings,
// in and out of doors; inside, between their desks, the Progress Room and the Mission Board),
// and walking up to anyone opens a conversation. Positions update straight on the DOM each
// frame so React only re-renders when something you can click changes.

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTracker } from "../App";
import { Icon } from "../icons";
import { Btn } from "../ui";
import Dialogue, { type Talk } from "./Dialogue";
import Decorate from "./Decorate";
import { CityArt, CityGlow, CityLabels, InteriorArt, InteriorLabels, type DeskStatus, type HouseInfo, type InteriorInfo } from "./art";
import { HomeArt, HomeLabels } from "./homeArt";
import { FURNITURE, furnitureOf, layoutHome } from "@/lib/home";
import { SPRITE_H, SPRITE_W, kitUrl, sheetUrl } from "./pixelSprite";
import { pixelPicture } from "./pixel";
import { snapHex } from "@/lib/palette";
import { shade } from "../characters";
import { PixelForce } from "../pixelate";
import { cityWork, type Work } from "@/lib/cityWork";
import { dueJob } from "@/lib/cityJobs";
import { onRunning, runJob, runningJobs } from "./workRunner";
import {
  T, buildingName, hits, layoutCity, layoutInterior, moveBox, roadRoute, roleOf, roofColor, setupProgress, titleOf, visibleBuildings,
  STUDIO_KINDS, isShop, type CityLayout, type InteriorLayout, type Pt, type Rect,
} from "@/lib/city";
import { buildingReport, missions } from "@/lib/cityReport";
import { CITIZENS } from "@/lib/cityLore";
import { randomHeroLook } from "@/lib/heroLook";
import { hashString, rng } from "@/lib/avatar";
import { sfx } from "@/lib/sound";
import type { CityStaff, HeroLook } from "@/lib/types";

type Scene = { type: "city" } | { type: "inside"; id: string };

interface Agent {
  id: string;
  x: number;
  y: number;
  path: Pt[];
  wait: number;
  act: string;
  visible: boolean;
  face: 1 | -1;
  /** Which way they look: toward you, away, or sideways (face says left or right) */
  dir: Dir;
  moving: boolean;
  /** Building they're inside (city scene), when hidden */
  inside?: string;
  phase?: "desk" | "away";
  onArrive?: () => void;
}

type Dir = "down" | "up" | "side";
/** Which way someone walking by (dx, dy) looks. */
const dirOf = (dx: number, dy: number): Dir => (Math.abs(dy) > Math.abs(dx) * 1.2 ? (dy > 0 ? "down" : "up") : "side");
const WALK = 62;
const RUN_PLAYER = 290;
const WALK_PLAYER = 190;

/** Moves a character, touching the page only when something changed. */
function place(el: HTMLElement, x: number, y: number, depth: number, moving: boolean, face: number, dir: Dir) {
  const tf = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  if (el.style.transform !== tf) el.style.transform = tf;
  const z = String(Math.round(depth));
  if (el.style.zIndex !== z) el.style.zIndex = z;
  const m = moving ? "1" : "0";
  if (el.dataset.moving !== m) el.dataset.moving = m;
  const f = String(face);
  if (el.dataset.face !== f) el.dataset.face = f;
  if (el.dataset.dir !== dir) el.dataset.dir = dir;
}

const randIn = (r: Rect, rand: () => number, pad = 10): Pt => ({ x: r.x + pad + rand() * Math.max(1, r.w - pad * 2), y: r.y + pad + rand() * Math.max(1, r.h - pad * 2) });
const pick = <X,>(list: X[], rand: () => number) => list[Math.floor(rand() * list.length)];

export default function CityGame({ onExit, goTo }: { onExit: () => void; goTo: (tab: string) => void }) {
  const { data, update, month, today } = useTracker();
  const city = data.city!;
  const keys = data.integrations?.staffKeys;
  const [scene, setScene] = useState<Scene>({ type: "city" });
  const [talk, setTalk] = useState<Talk | null>(null);
  const [near, setNear] = useState<string>("");
  const [travel, setTravel] = useState(false);
  const [fade, setFade] = useState(0);
  const [decorating, setDecorating] = useState(false);
  const [picked, setPicked] = useState("");
  const [badSpot, setBadSpot] = useState(false);

  const buildings = visibleBuildings(data);
  const bIds = buildings.map((b) => b.id).join(",");
  const studioIds = STUDIO_KINDS.map((k) => buildings.find((b) => b.kind === k)?.id).filter((x): x is string => Boolean(x));
  const homeIds = buildings.filter((b) => b.kind === "home").map((b) => b.id);
  const cityLayout = useMemo(() => layoutCity(bIds ? bIds.split(",") : [], studioIds, homeIds), [bIds, studioIds.join(","), homeIds.join(",")]);
  const staff = city.staff.filter((s) => buildings.some((b) => b.id === s.buildingId));
  const staffKey = staff.map((s) => `${s.id}:${s.buildingId}:${s.role}`).join("|");

  const inside = scene.type === "inside" ? buildings.find((b) => b.id === scene.id) : undefined;
  const atHome = inside?.kind === "home";
  const furnKey = atHome ? JSON.stringify(furnitureOf(inside!)) : "";
  const homeLayout = useMemo(() => (furnKey ? layoutHome(JSON.parse(furnKey)) : null), [furnKey]);
  const insideStaff = inside ? staff.filter((s) => s.buildingId === inside.id) : [];
  const reporterId = insideStaff.find((s) => s.role === "reporter")?.id;
  const roomKey = (inside?.rooms ?? []).map((r) => r.id).join(",");
  const deskIds = insideStaff.filter((s) => s.id !== reporterId).map((s) => s.id).join(",");
  const interior = useMemo(() => (scene.type === "inside" && !atHome ? layoutInterior(deskIds ? deskIds.split(",") : [], reporterId, roomKey ? roomKey.split(",") : []) : null), [scene, deskIds, reporterId, roomKey, atHome]);
  /** The room you're in (an office or your home): its size, walls and way out. */
  const room = interior ?? homeLayout;

  const W = room?.w ?? cityLayout.w;
  const H = room?.h ?? cityLayout.h;

  // ---- refs the frame loop works with ----
  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const playerEl = useRef<HTMLDivElement>(null);
  const miniDot = useRef<SVGCircleElement>(null);
  const els = useRef(new Map<string, HTMLDivElement>());
  const agents = useRef(new Map<string, Agent>());
  const player = useRef({ x: cityLayout.spawn.x, y: cityLayout.spawn.y, face: 1 as 1 | -1, dir: "down" as Dir, moving: false });
  const pressed = useRef(new Set<string>());
  const joy = useRef({ x: 0, y: 0 });
  const tapTo = useRef<Pt | null>(null);
  const nearAct = useRef<(() => void) | null>(null);
  const talkRef = useRef<Talk | null>(null);
  const doorLock = useRef(0);
  const decoRef = useRef(false);
  decoRef.current = decorating;
  const spawnInside = useRef(false);
  const zoomRef = useRef(1);
  const cam = useRef({ x: 0, y: 0 });
  talkRef.current = talk;

  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staffKey, city.staff]);
  const [runKey, setRunKey] = useState("");
  useEffect(() => onRunning(() => setRunKey([...runningJobs()].join("|"))), []);
  const work = useMemo(() => cityWork(data, buildings, today, runningJobs()), [data, bIds, today, runKey]);

  // Set-up staff do the day's job on their own when you open the city (the daily run at 9:00
  // does the same when you don't), a couple at a time so you can watch them get to it.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const due = (data.city?.staff ?? []).filter((s) => dueJob(data, s, today));
    let i = 0;
    const next = async (): Promise<void> => {
      const s = due[i++];
      if (!s) return;
      try {
        const j = await runJob(s.id, dueJob(data, s, today)!.doing, { auto: true });
        if (!j.skipped) update((d) => void (d.staffWork = j.work));
      } catch {}
      return next();
    };
    next();
    next();
  }, []);
  const workKey = [...work].map(([k, w]) => `${k}:${w.state}:${w.line}`).join("|");
  const nameOf = useCallback((id: string) => buildingName(data, buildings.find((b) => b.id === id) ?? buildings[0]), [data, bIds]);
  const shopIds = buildings.filter(isShop).map((b) => b.id);
  const kinds = useMemo(() => new Map(buildings.map((b) => [b.id, b.kind as string])), [bIds]);
  const latest = useRef({ staffById, nameOf, keys, cityLayout, interior, room, homeLayout, shopIds, work, kinds });
  latest.current = { staffById, nameOf, keys, cityLayout, interior, room, homeLayout, shopIds, work, kinds };

  const switchScene = useCallback((next: Scene, at?: Pt) => {
    setFade((f) => f + 1);
    sfx("door");
    setTalk(null);
    setDecorating(false);
    setPicked("");
    setScene(next);
    doorLock.current = performance.now() + 700;
    if (at) Object.assign(player.current, at);
  }, []);

  // ---- people: what each one is up to ----
  // Staff only move when there's real work behind it (lib/cityWork). With no open missions
  // they sit at their desks inside; waiting on setup, they wait at their desk for you.
  useEffect(() => {
    const map = new Map<string, Agent>();
    const rand = rng(Date.now() % 100000);
    const L = latest.current;
    const workOf = (id: string): Work => latest.current.work.get(id) ?? { state: "idle", line: "" };
    if (scene.type === "city") {
      const layout = L.cityLayout;
      const plot = (id: string) => layout.plots.find((p) => p.buildingId === id);
      const doorPt = (id: string) => {
        const p = plot(id)!;
        return { x: p.door.x + p.door.w / 2, y: p.door.y + p.door.h + 10 };
      };
      const yardPt = (id: string) => randIn(plot(id)!.yard, rand, 20);
      const studioFor = (s: CityStaff) => {
        const kind = ["content", "social"].includes(s.role) ? "video" : ["ads", "insights"].includes(s.role) ? "acquisition" : ["scriptWriter", "copyWriter", "imageCopy", "imageAI"].includes(s.role) ? "acquisition" : "creative";
        return layout.plots.find((p) => p.buildingId !== s.buildingId && latest.current.kinds.get(p.buildingId) === kind)?.buildingId;
      };
      const decide = (a: Agent) => {
        const s = latest.current.staffById.get(a.id);
        if (!s || !plot(s.buildingId)) return;
        const home = s.buildingId;
        const w = workOf(s.id);
        if (!a.visible) {
          // Inside. Only busy people come out now and then.
          if (w.state !== "busy" || rand() < 0.7) {
            a.wait = 20 + rand() * 30;
            return;
          }
          const at = a.inside && plot(a.inside) ? a.inside : home;
          Object.assign(a, doorPt(at));
          a.visible = true;
          a.inside = undefined;
          a.path = at === home ? [yardPt(home)] : roadRoute(doorPt(at), yardPt(home), layout);
          a.act = at === home ? w.line : `Back to ${latest.current.nameOf(home)}`;
          a.onArrive = () => (a.wait = 4 + rand() * 6);
          return;
        }
        // Outside: an errand that fits the job, or back in to keep working.
        const q = studioFor(s);
        if (w.state === "busy" && q && rand() < 0.35) {
          a.path = roadRoute(a, doorPt(q), layout);
          a.act = `${w.line.replace(/^Working on: /, "Taking ")} to ${latest.current.nameOf(q)}`;
          a.onArrive = () => Object.assign(a, { visible: false, inside: q, wait: 8 + rand() * 10 });
        } else {
          a.path = [doorPt(home)];
          a.act = w.state === "busy" ? "Back to my desk" : "Heading in";
          a.onArrive = () => Object.assign(a, { visible: false, inside: home, wait: 15 + rand() * 25 });
        }
      };
      for (const c of CITIZENS) {
        const home = layout.spots[c.spot];
        const a: Agent = { id: `cit:${c.id}`, ...home, path: [], wait: rand() * 3, act: pick(c.bubbles, rand), visible: true, face: 1, dir: "down", moving: false };
        (a as Agent & { decide: () => void }).decide = () => {
          a.path = [{ x: home.x + (rand() - 0.5) * (c.spot === "plaza-left" ? 10 : 90), y: home.y + (rand() - 0.5) * (c.spot === "plaza-left" ? 4 : 40) }];
          a.act = pick(c.bubbles, rand);
          a.onArrive = () => (a.wait = 4 + rand() * 6);
        };
        map.set(a.id, a);
      }
      for (const s of latest.current.staffById.values()) {
        if (!plot(s.buildingId)) continue;
        const w = workOf(s.id);
        const out = w.state === "busy" && s.role !== "reporter" && rand() < 0.3;
        const p = out ? yardPt(s.buildingId) : doorPt(s.buildingId);
        const a: Agent = { id: s.id, ...p, path: [], wait: out ? 3 + rand() * 4 : 5 + rand() * 25, act: w.line, visible: out, face: rand() < 0.5 ? 1 : -1, dir: "down", moving: false, inside: out ? undefined : s.buildingId };
        (a as Agent & { decide: () => void }).decide = () => decide(a);
        map.set(s.id, a);
      }
    } else if (L.interior) {
      const I = L.interior;
      const corridor = I.progress.y + I.progress.h + 0.35 * T;
      const via = (from: Pt, to: Pt): Pt[] => [{ x: from.x, y: corridor }, { x: to.x, y: corridor }, to];
      const deskOf = new Map(I.stations.map((st) => [st.staffId, st]));
      const insideNow = [...latest.current.staffById.values()].filter((s) => deskOf.has(s.id) || s.id === I.reporter?.staffId);
      const decide = (a: Agent) => {
        const s = latest.current.staffById.get(a.id);
        if (!s) return;
        const w = workOf(s.id);
        if (I.reporter?.staffId === a.id) {
          const busyDesks = I.stations.filter((st) => workOf(st.staffId).state === "busy");
          a.act = w.line;
          if (w.state === "busy" && busyDesks.length && rand() < 0.4) {
            const st = pick(busyDesks, rand);
            a.path = via(a, { x: st.x + 0.9 * T, y: st.y });
            a.act = `Collecting an update from ${latest.current.staffById.get(st.staffId)?.name ?? "the team"}`;
            a.onArrive = () => {
              a.wait = 3;
              a.onArrive = undefined;
              setTimeout(() => {
                a.path = via(a, { x: I.reporter!.x, y: I.reporter!.y });
                a.act = "Updating the scoreboard";
                a.onArrive = () => (a.wait = 15 + rand() * 15);
              }, 3000);
            };
          } else a.wait = 15 + rand() * 20;
          return;
        }
        const desk = deskOf.get(a.id);
        if (!desk) return;
        const home = { x: desk.x, y: desk.y };
        if (a.phase === "away") {
          a.path = via(a, home);
          a.act = w.line;
          a.onArrive = () => Object.assign(a, { phase: "desk", wait: 18 + rand() * 20 });
          return;
        }
        a.act = w.line;
        if (w.state !== "busy") {
          // Nothing to do: they stay put. Waiting on setup, they keep reminding you.
          a.wait = 30 + rand() * 30;
          return;
        }
        const away = (to: Pt, act: string, stay: number) => {
          a.path = via(a, to);
          a.act = act;
          a.onArrive = () => Object.assign(a, { phase: "away", wait: stay });
        };
        const r = rand();
        const busyMates = I.stations.filter((x) => x.staffId !== a.id && workOf(x.staffId).state === "busy");
        if (r < 0.3 && w.line.startsWith("Working on")) away({ x: I.mission.x + T + rand() * (I.mission.w - 2 * T), y: I.mission.y + 0.7 * T + rand() * T }, "Checking the mission board", 3 + rand() * 2);
        else if (r < 0.55) away({ x: I.progress.x + T + rand() * (I.progress.w - 2 * T), y: I.progress.y + 0.7 * T + rand() * T }, "Posting an update", 3 + rand() * 2);
        else if (r < 0.7 && busyMates.length) {
          const c = pick(busyMates, rand);
          away({ x: c.x + 0.9 * T, y: c.y + 4 }, `Asking ${latest.current.staffById.get(c.staffId)?.name ?? "a teammate"} something`, 4 + rand() * 2);
        } else a.wait = 15 + rand() * 20;
      };
      for (const s of insideNow) {
        const st = deskOf.get(s.id);
        const p = st ? { x: st.x, y: st.y } : { x: I.reporter!.x, y: I.reporter!.y };
        const a: Agent = { id: s.id, ...p, path: [], wait: 4 + rand() * 12, act: workOf(s.id).line, visible: true, face: 1, dir: "down", moving: false, phase: "desk" };
        (a as Agent & { decide: () => void }).decide = () => decide(a);
        map.set(s.id, a);
      }
    }
    agents.current = map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, staffKey, cityLayout, interior]);

  // When work changes (a mission is added or finished), people pick up their new lines.
  useEffect(() => {
    for (const a of agents.current.values()) {
      const w = latest.current.work.get(a.id);
      if (w && !a.path.length) a.act = w.line;
    }
  }, [workKey]);

  // Walking in through the door puts you just inside it.
  useEffect(() => {
    if (room && spawnInside.current) {
      spawnInside.current = false;
      Object.assign(player.current, room.spawn);
    }
  }, [room]);
  // Furniture moved onto you: step back to the door.
  useEffect(() => {
    const P = player.current;
    if (homeLayout && homeLayout.solids.some((r) => hits({ x: P.x - 11, y: P.y - 8, w: 22, h: 10 }, r))) Object.assign(P, homeLayout.spawn);
  }, [homeLayout]);

  const talkTo = useCallback((id: string) => {
    const a = agents.current.get(id);
    if (!a) return;
    if (Math.hypot(a.x - player.current.x, a.y - player.current.y) < 90) setTalk(id.startsWith("cit:") ? { kind: "citizen", id: id.slice(4) } : { kind: "staff", staffId: id });
    else tapTo.current = { x: a.x, y: a.y + 20 };
  }, []);

  // ---- input ----
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (k === "escape") {
        if (talkRef.current) setTalk(null);
        else setTravel(false);
        return;
      }
      if ((k === " " || k === "enter" || k === "e") && !talkRef.current && !decoRef.current) {
        nearAct.current?.();
        return;
      }
      pressed.current.add(k);
      tapTo.current = null;
    };
    const up = (e: KeyboardEvent) => pressed.current.delete(e.key.toLowerCase());
    const blur = () => pressed.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  // ---- the frame loop ----
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastNear = "";
    let checkAt = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const L = latest.current;
      const solids = scene.type === "city" ? L.cityLayout.solids : L.room?.solids ?? [];
      const P = player.current;
      // player (stands still while you talk or decorate)
      if (!talkRef.current && !decoRef.current) {
        const k = pressed.current;
        let dx = (k.has("arrowright") || k.has("d") ? 1 : 0) - (k.has("arrowleft") || k.has("a") ? 1 : 0) + joy.current.x;
        let dy = (k.has("arrowdown") || k.has("s") ? 1 : 0) - (k.has("arrowup") || k.has("w") ? 1 : 0) + joy.current.y;
        if (!dx && !dy && tapTo.current) {
          dx = tapTo.current.x - P.x;
          dy = tapTo.current.y - P.y;
          if (Math.hypot(dx, dy) < 6) tapTo.current = null;
        }
        const len = Math.hypot(dx, dy);
        P.moving = len > 0.01;
        if (P.moving) {
          const sp = (k.has("shift") ? RUN_PLAYER : WALK_PLAYER) * dt;
          dx = (dx / len) * sp;
          dy = (dy / len) * sp;
          if (dx) P.face = dx > 0 ? 1 : -1;
          P.dir = dirOf(dx, dy);
          const box = { x: P.x - 11, y: P.y - 8, w: 22, h: 10 };
          const moved = moveBox(box, dx, dy, solids);
          if (tapTo.current && moved.x === box.x && moved.y === box.y) tapTo.current = null;
          P.x = moved.x + 11;
          P.y = moved.y + 8;
        }
        // doors
        if (now > doorLock.current) {
          const foot = { x: P.x - 11, y: P.y - 8, w: 22, h: 10 };
          if (scene.type === "city") {
            const p = L.cityLayout.plots.find((pl) => hits(foot, pl.door));
            if (p && L.shopIds.includes(p.buildingId)) {
              P.y = p.door.y + p.door.h + 0.9 * T;
              doorLock.current = now + 900;
              tapTo.current = null;
              sfx("door");
              setTalk({ kind: "shop", buildingId: p.buildingId });
            } else if (p) {
              spawnInside.current = true;
              switchScene({ type: "inside", id: p.buildingId });
              tapTo.current = null;
            }
          } else if (L.room && hits(foot, L.room.exit)) {
            const p = L.cityLayout.plots.find((pl) => pl.buildingId === scene.id);
            switchScene({ type: "city" }, p ? { x: p.door.x + p.door.w / 2, y: p.door.y + p.door.h + 0.9 * T } : L.cityLayout.spawn);
            tapTo.current = null;
          }
        }
      } else P.moving = false;
      // people
      for (const a of agents.current.values()) {
        const talking = talkRef.current?.kind === "staff" && talkRef.current.staffId === a.id;
        if (talking) {
          a.moving = false;
          a.face = P.x > a.x ? 1 : -1;
          a.dir = dirOf(P.x - a.x, P.y - a.y);
          continue;
        }
        if (a.path.length) {
          const t = a.path[0];
          const ddx = t.x - a.x;
          const ddy = t.y - a.y;
          const d = Math.hypot(ddx, ddy);
          const step = WALK * dt;
          if (d <= step) {
            a.x = t.x;
            a.y = t.y;
            a.path.shift();
            if (!a.path.length) {
              const f = a.onArrive;
              a.onArrive = undefined;
              f?.();
            }
          } else {
            a.x += (ddx / d) * step;
            a.y += (ddy / d) * step;
            if (Math.abs(ddx) > 1) a.face = ddx > 0 ? 1 : -1;
            a.dir = dirOf(ddx, ddy);
          }
          a.moving = a.path.length > 0;
        } else {
          a.moving = false;
          a.wait -= dt;
          if (a.wait <= 0) (a as Agent & { decide?: () => void }).decide?.();
        }
      }
      // camera
      const vp = viewport.current;
      if (vp && world.current) {
        const fullW = vp.clientWidth;
        const fullH = vp.clientHeight;
        // While decorating, the room fits in the space the decorate panel leaves free.
        const vw = decoRef.current && fullW >= 640 ? fullW - 400 : fullW;
        const vh = decoRef.current && fullW < 640 ? fullH * 0.55 : fullH;
        // Close enough to see faces and read signs; a bit wider on big screens.
        const base = vw < 700 ? 1.05 : Math.min(1.75, Math.max(1.35, Math.min(vw, vh * 1.6) / 1100));
        // Inside, zoom in so the room fills the screen.
        const fit = L.room ? Math.min(2, vw / L.room.w, (vh - 40) / L.room.h) : base;
        const z = scene.type === "inside" && L.room ? (decoRef.current ? fit : Math.max(base, fit)) : base;
        zoomRef.current = z;
        const ww = (scene.type === "city" ? L.cityLayout.w : L.room?.w ?? 0) * z;
        const wh = (scene.type === "city" ? L.cityLayout.h : L.room?.h ?? 0) * z;
        const cx = ww <= vw ? -(vw - ww) / 2 : Math.min(Math.max(P.x * z - vw / 2, 0), ww - vw);
        const cy = wh <= vh ? -(vh - wh) / 2 : Math.min(Math.max(P.y * z - vh / 2, 0), wh - vh);
        cam.current = { x: cx, y: cy };
        const tf = `translate(${Math.round(-cx)}px, ${Math.round(-cy)}px) scale(${z})`;
        if (world.current.style.transform !== tf) world.current.style.transform = tf;
      }
      // draw
      if (playerEl.current) place(playerEl.current, P.x - SPRITE_W / 2, P.y - SPRITE_H + 4, P.y, P.moving, P.face, P.dir);
      // Only the person nearest you (and anyone right beside you) shows a speech bubble;
      // everyone else shows a small badge for what they're up to.
      let nearest = "";
      let nd = scene.type === "city" ? 240 : 170;
      for (const a of agents.current.values()) {
        if (!a.visible) continue;
        const d = Math.hypot(a.x - P.x, a.y - P.y);
        if (d < nd) {
          nd = d;
          nearest = a.id;
        }
      }
      for (const a of agents.current.values()) {
        const el = els.current.get(a.id);
        if (!el) continue;
        const show = a.visible ? "" : "none";
        if (el.style.display !== show) el.style.display = show;
        if (!a.visible) continue;
        place(el, a.x - SPRITE_W / 2, a.y - SPRITE_H + 4, a.y, a.moving, a.face, a.dir);
        const b = el.firstElementChild as HTMLElement | null;
        if (b) {
          if (b.textContent !== a.act) b.textContent = a.act;
          const op = a.id === nearest || Math.hypot(a.x - P.x, a.y - P.y) < 55 ? "1" : "0";
          if (b.style.opacity !== op) b.style.opacity = op;
          const st = L.work.get(a.id)?.state ?? "";
          if (el.dataset.state !== st) el.dataset.state = st;
        }
      }
      if (miniDot.current && scene.type === "city") {
        miniDot.current.setAttribute("cx", String(P.x));
        miniDot.current.setAttribute("cy", String(P.y));
      }
      // who's close enough to talk to
      if (now > checkAt) {
        checkAt = now + 120;
        let best: { key: string; label: string; go: () => void; d: number } | null = null;
        for (const a of agents.current.values()) {
          if (!a.visible) continue;
          const d = Math.hypot(a.x - P.x, a.y - P.y);
          if (d >= 70 || (best && d >= best.d)) continue;
          const s = L.staffById.get(a.id);
          const c = a.id.startsWith("cit:") ? CITIZENS.find((x) => `cit:${x.id}` === a.id) : undefined;
          if (s) best = { key: `s:${a.id}`, label: `Talk to ${s.name} · ${titleOf(s)}`, go: () => setTalk({ kind: "staff", staffId: a.id }), d };
          else if (c) best = { key: `c:${c.id}`, label: `Talk to ${c.name} · ${c.title}`, go: () => setTalk({ kind: "citizen", id: c.id }), d };
        }
        if (!best && scene.type === "city") {
          const g = L.cityLayout.gate;
          if (P.y < g.h + 1.6 * T && Math.abs(P.x - (g.x + g.w / 2)) < g.w * 0.8) best = { key: "gate", label: "Look at the gate", go: () => setTalk({ kind: "gate" }), d: 0 };
        }
        if (!best && scene.type === "city") {
          const f = L.cityLayout.fountain;
          const kx = f.x - f.r * 1.15;
          const ky = f.y + f.r * 1.85;
          if (Math.hypot(kx - P.x, ky - P.y) < 80) best = { key: "kit", label: "Talk to Kit · City guide", go: () => setTalk({ kind: "kit" }), d: 0 };
        }
        if (!best && scene.type === "inside" && L.interior) {
          const I = L.interior;
          const pt = { x: P.x - 1, y: P.y - 1, w: 2, h: 2 };
          const top = (r: Rect) => ({ x: r.x, y: r.y - T, w: r.w, h: 2.6 * T });
          if (hits(pt, top(I.progress))) best = { key: "screen", label: "Read the results screen", go: () => setTalk({ kind: "screen", buildingId: scene.id }), d: 0 };
          else if (hits(pt, top(I.mission))) best = { key: "board", label: "Open the mission board", go: () => setTalk({ kind: "board", buildingId: scene.id }), d: 0 };
          else {
            const room = I.rooms.find((r) => hits(pt, r.rect));
            if (room) best = { key: `r:${room.id}`, label: "Look around this room", go: () => setTalk({ kind: "room", buildingId: scene.id, roomId: room.id }), d: 0 };
          }
        }
        if (!best && scene.type === "inside" && L.homeLayout) {
          // Walk up to any piece of furniture to start decorating.
          const near = L.homeLayout.items.find((f) => !FURNITURE[f.kind].walk && hits({ x: P.x - 30, y: P.y - 30, w: 60, h: 50 }, f.rect));
          if (near) best = { key: `h:${near.id}`, label: "Decorate your home", go: () => (setPicked(near.id), setDecorating(true)), d: 0 };
        }
        if (decoRef.current) best = null;
        nearAct.current = best?.go ?? null;
        const label = best ? `${best.key}|${best.label}` : "";
        if (label !== lastNear) {
          lastNear = label;
          setNear(label);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scene, switchScene]);

  // Tap the ground to walk there.
  const onPointer = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a, input, textarea, .city-npc")) return;
    const rect = viewport.current!.getBoundingClientRect();
    const z = zoomRef.current;
    tapTo.current = { x: (e.clientX - rect.left + cam.current.x) / z, y: (e.clientY - rect.top + cam.current.y) / z };
  };

  const goToBuilding = (id: string) => {
    setTravel(false);
    const p = cityLayout.plots.find((pl) => pl.buildingId === id);
    if (!p) return;
    const at = { x: p.door.x + p.door.w / 2, y: p.door.y + p.door.h + 0.9 * T };
    if (scene.type === "inside") switchScene({ type: "city" }, at);
    else {
      Object.assign(player.current, at);
      sfx("open");
    }
  };

  const houses: HouseInfo[] = buildings.map((b) => {
    const client = b.clientId ? data.clients?.find((c) => c.id === b.clientId) : undefined;
    return { id: b.id, name: buildingName(data, b), color: roofColor(b), kind: b.kind, avatar: client?.avatar, alert: staff.filter((s) => s.buildingId === b.id && setupProgress(s, keys).missing.length).length, busy: staff.filter((s) => s.buildingId === b.id && work.get(s.id)?.state === "busy").length };
  });
  const houseKey = JSON.stringify(houses);
  const housesMemo = useMemo(() => houses, [houseKey]);

  const interiorInfo: InteriorInfo | null = inside
    ? (() => {
        const rep = buildingReport(data, inside, month, today);
        return {
          name: buildingName(data, inside),
          color: roofColor(inside),
          screen: { title: rep.title, stats: rep.stats, pct: rep.pct, feed: rep.feed },
          notes: missions(data, inside).map((m) => ({ text: m.title, done: m.done })),
          rooms: (inside.rooms ?? []).map((r) => ({ id: r.id, name: r.name })),
          reporter: (() => {
            const r = insideStaff.find((s) => s.id === reporterId);
            return r ? { name: r.name, title: titleOf(r) } : undefined;
          })(),
          kind: inside.kind,
          desks: insideStaff.filter((s) => s.id !== reporterId).map((s) => ({ staffId: s.id, name: s.name, title: titleOf(s), role: s.role, color: roleOf(s).color, ready: !setupProgress(s, keys).missing.length })),
        };
      })()
    : null;
  const interiorKey = JSON.stringify(interiorInfo);
  const interiorMemo = useMemo(() => interiorInfo, [interiorKey]);
  // Each desk's nameplate shows whether they're working, done, free or waiting on you.
  const deskStatus = useMemo(() => Object.fromEntries(insideStaff.map((s) => [s.id, work.get(s.id) ?? { state: "idle" as const, line: "" }])) as DeskStatus, [workKey, scene, staffKey]);

  // The scenery as one picture; it's redrawn only when the town or the room changes.
  const [sceneryUrl, setSceneryUrl] = useState("");
  useEffect(() => {
    const art =
      scene.type === "city" ? <CityArt layout={cityLayout} houses={housesMemo} />
      : homeLayout ? <HomeArt layout={homeLayout} />
      : interior && interiorMemo ? <InteriorArt layout={interior} info={interiorMemo} />
      : null;
    if (!art) return setSceneryUrl("");
    let url = "";
    let gone = false;
    pixelPicture(art, W, H).then((u) => {
      if (gone) return URL.revokeObjectURL(u);
      url = u;
      setSceneryUrl(u);
    });
    return () => {
      gone = true;
      if (url) setTimeout(() => URL.revokeObjectURL(url), 2000);
    };
  }, [scene.type, cityLayout, housesMemo, interior, interiorMemo, homeLayout, W, H]);

  const playerUrl = sheetUrl(data.game?.look);

  const hour = new Date().getHours();
  const tint = scene.type === "inside" ? null : hour >= 19 || hour < 5 ? "night" : hour >= 17 || hour < 7 ? "dusk" : null;
  const sceneStaff = scene.type === "city" ? staff : insideStaff;
  const nearLabel = near.split("|")[1] ?? "";
  const counts = { busy: 0, idle: 0, setup: 0 };
  for (const s of staff) counts[work.get(s.id)?.state ?? "idle"]++;

  return (
    <PixelForce.Provider value={true}>
    <div className="dawn fixed inset-0 z-[60] bg-outline select-none touch-none" role="application" aria-label={`${city.name}: walk with the arrow keys, talk with Space`}>
      <div ref={viewport} className="absolute inset-0 overflow-hidden" onPointerDown={onPointer}>
        <div ref={world} className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ width: W, height: H }}>
          {sceneryUrl && <img src={sceneryUrl} alt="" width={W} height={H} className="absolute left-0 top-0 block max-w-none pixelated" draggable={false} />}
          {scene.type === "city" ? (
            <CityLabels layout={cityLayout} houses={housesMemo} cityName={city.name} />
          ) : homeLayout ? (
            <HomeLabels layout={homeLayout} selected={decorating ? picked : undefined} problem={badSpot} />
          ) : (
            interior && interiorMemo && <InteriorLabels layout={interior} info={interiorMemo} status={deskStatus} />
          )}
          {scene.type === "city" && <KitNpc layout={cityLayout} />}
          {sceneStaff.map((s) => (
            <Npc key={`${scene.type}-${s.id}`} id={s.id} name={s.name} color={roleOf(s).color} look={s.look} refFn={(el) => (el ? els.current.set(s.id, el) : els.current.delete(s.id))} onTalk={talkTo} />
          ))}
          {scene.type === "city" &&
            CITIZENS.map((c) => (
              <Npc key={c.id} id={`cit:${c.id}`} name={c.name} color={c.color} look={citizenLook(c.id, c.seed)} refFn={(el) => (el ? els.current.set(`cit:${c.id}`, el) : els.current.delete(`cit:${c.id}`))} onTalk={talkTo} />
            ))}
          <div ref={playerEl} className="absolute left-0 top-0 city-walker" style={{ width: SPRITE_W }}>
            <div className="city-shadow" />
            <div className="city-flip">
              <PixelBody url={playerUrl} />
            </div>
            <div className="city-tag" style={{ background: "#f2b866" }}>{data.settings.playerName || "You"}</div>
          </div>
          {tint && <div className={`absolute inset-0 pointer-events-none city-tint-${tint}`} style={{ zIndex: 100000 }} />}
          {tint && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 100001 }}>
              <CityGlow layout={cityLayout} houses={housesMemo} />
            </div>
          )}
        </div>
      </div>
      <div key={fade} className="absolute inset-0 pointer-events-none city-fade" />

      {/* HUD */}
      <div className="absolute top-0 inset-x-0 p-2 sm:p-3 flex items-start gap-2 pointer-events-none">
        <div className="hud px-3 py-2 pointer-events-auto max-w-[60vw]">
          <div className="font-display text-2xl sm:text-3xl tracking-wide leading-none truncate">{city.name}</div>
          <div className="text-sm font-extrabold text-muted truncate">{inside ? buildingName(data, inside) : "Downtown"}</div>
        </div>
        <div className="hud px-3 py-2 flex items-center gap-2 pointer-events-auto max-sm:hidden">
          <span className={`w-3 h-3 rounded-full ${counts.busy ? "bg-good city-blink" : "bg-muted"}`} />
          <span className="font-extrabold">
            {counts.busy} working · {counts.idle} free{counts.setup ? ` · ${counts.setup} need you` : ""}
          </span>
        </div>
        <div className="ml-auto flex gap-2 pointer-events-auto">
          {atHome && !decorating && (
            <Btn kind="primary" onClick={() => (setTalk(null), setDecorating(true))} className="flex items-center gap-1.5">
              <Icon name="palette" size={20} /> Decorate
            </Btn>
          )}
          <Btn onClick={() => setTravel((v) => !v)} className="flex items-center gap-1.5">
            <Icon name="pin" size={20} /> <span className="max-sm:hidden">Go to</span>
          </Btn>
          <Btn kind="primary" onClick={onExit} className="flex items-center gap-1.5">
            <Icon name="home" size={20} /> Exit city
          </Btn>
        </div>
      </div>
      {travel && (
        <div className="absolute top-20 right-2 sm:right-3 z-50 w-72"><div className="hud p-2 max-h-[60vh] overflow-y-auto">
          {buildings.map((b) => (
            <button key={b.id} type="button" className="w-full text-left px-3 py-2 rounded-md hover:bg-card-2 flex items-center gap-2 font-bold text-lg" onClick={() => goToBuilding(b.id)}>
              <span className="w-4 h-4 rounded-sm border-2 border-outline shrink-0" style={{ background: roofColor(b) }} />
              <span className="truncate">{buildingName(data, b)}</span>
            </button>
          ))}
        </div></div>
      )}
      {scene.type === "city" && (
        <div className="absolute bottom-3 right-3 w-44 pointer-events-none max-sm:hidden"><div className="hud p-1">
        <svg viewBox={`0 0 ${cityLayout.w} ${cityLayout.h}`} className="block w-full h-auto" shapeRendering="crispEdges" aria-hidden>
          <rect width={cityLayout.w} height={cityLayout.h} fill="#6aa645" />
          {cityLayout.roads.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#7d7574" />
          ))}
          <rect x={cityLayout.plaza.x} y={cityLayout.plaza.y} width={cityLayout.plaza.w} height={cityLayout.plaza.h} fill="#c8bdae" />
          {cityLayout.plots.map((p) => (
            <rect key={p.buildingId} x={p.house.x} y={p.house.y} width={p.house.w} height={p.house.h} fill={snapHex(housesMemo.find((h) => h.id === p.buildingId)?.color ?? "#fffaf0")} />
          ))}
          <circle ref={miniDot} r="60" fill="#d9603b" stroke="#fffaf0" strokeWidth="24" />
        </svg>
        </div></div>
      )}

      {/* talk prompt */}
      {nearLabel && !talk && !decorating && (
        <div className="absolute bottom-8 left-1/2 max-sm:bottom-48 city-prompt z-30">
          <button type="button" onClick={() => nearAct.current?.()} className="hud px-4 py-2.5 flex items-center gap-2 text-lg font-extrabold whitespace-nowrap">
            <span className="max-sm:hidden font-display bg-gold text-outline border-2 border-outline rounded px-2 pt-0.5">SPACE</span>
            {nearLabel}
          </button>
        </div>
      )}
      {!talk && <div className="absolute bottom-2 left-3 text-[15px] text-[#fbf1dc] max-sm:hidden pointer-events-none [text-shadow:2px_2px_0_#2b1d2e]">Arrows or WASD to walk · Shift to run · Space to talk · Tap the ground to walk there</div>}

      <TouchPad joy={joy} onA={() => nearAct.current?.()} hidden={Boolean(talk) || decorating} />
      {decorating && inside && (
        <Decorate
          buildingId={inside.id}
          selected={picked}
          onSelect={setPicked}
          onProblem={setBadSpot}
          onClose={() => (setDecorating(false), setPicked(""), setBadSpot(false))}
        />
      )}

      {talk && <Dialogue talk={talk} onClose={() => setTalk(null)} goTo={goTo} />}
    </div>
    </PixelForce.Provider>
  );
}

/** Townspeople's looks: seeded, with the hooded stranger in the dark. */
const looks = new Map<string, HeroLook>();
function citizenLook(id: string, seed: string): HeroLook {
  if (!looks.has(id)) {
    const l = randomHeroLook(rng(hashString(seed)));
    if (id === "stranger") Object.assign(l, { outfit: "#16151f", accent: "#7c5cff", hairColor: "#16151f", skin: "#c4bfe6", eyes: "#b5179e", back: "cape", backColor: "#2b2d42", neck: "none" });
    if (id === "bram") Object.assign(l, { hairColor: "#f5f5f5", outfit: "#5a3825", accent: "#9aa0b4" });
    if (id === "ume") Object.assign(l, { hairColor: "#d8d8e0", outfit: "#f15bb5" });
    looks.set(id, l);
  }
  return looks.get(id)!;
}

const Npc = memo(
  function Npc({ id, name, color, look, refFn, onTalk }: { id: string; name: string; color: string; look?: HeroLook; refFn: (el: HTMLDivElement | null) => void; onTalk: (id: string) => void }) {
    return (
      <div ref={refFn} className="absolute left-0 top-0 city-walker city-npc" style={{ width: SPRITE_W, display: "none" }} onClick={() => onTalk(id)}>
        <div className="city-bubble" />
        <div className="city-badge" aria-hidden />
        <div className="city-shadow" />
        <div className="city-flip">
          <PixelBody url={sheetUrl(look)} />
        </div>
        <div className="city-tag" style={{ background: snapHex(shade(color, 0.4)) }}>
          {name}
        </div>
      </div>
    );
  },
  (a, b) => a.id === b.id && a.name === b.name && a.color === b.color && JSON.stringify(a.look) === JSON.stringify(b.look),
);

const KitNpc = memo(function KitNpc({ layout }: { layout: CityLayout }) {
  const f = layout.fountain;
  const x = f.x - f.r * 1.15;
  const y = f.y + f.r * 1.85;
  return (
    <div className="absolute left-0 top-0" style={{ transform: `translate(${x - SPRITE_W / 2}px, ${y - SPRITE_H + 4}px)`, zIndex: Math.round(y), width: SPRITE_W }}>
      <div className="city-bubble" style={{ opacity: 1 }}>
        Welcome! Talk to me
      </div>
      <div className="city-shadow" />
      <div className="pix-bob">
        <div className="pix" style={{ width: SPRITE_W, height: SPRITE_H, backgroundImage: `url(${kitUrl()})`, backgroundSize: `${SPRITE_W}px ${SPRITE_H}px` }} />
      </div>
    </div>
  );
});

/** A pixel character: the sheet shows the frame for where they're looking and whether they walk. */
function PixelBody({ url }: { url: string }) {
  return <div className="city-body pix" style={{ width: SPRITE_W, height: SPRITE_H, backgroundImage: `url(${url})` }} />;
}

function TouchPad({ joy, onA, hidden }: { joy: React.RefObject<{ x: number; y: number }>; onA: () => void; hidden: boolean }) {
  const set = (x: number, y: number) => () => void Object.assign(joy.current!, { x, y });
  const stop = () => void Object.assign(joy.current!, { x: 0, y: 0 });
  if (hidden) return null;
  const pad = (x: number, y: number, rot: number, cls: string) => (
    <button
      type="button"
      aria-label="Move"
      className={`absolute w-14 h-14 grid place-content-center bg-card/90 border-[3px] border-outline rounded-xl active:bg-gold ${cls}`}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        set(x, y)();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" style={{ transform: `rotate(${rot}deg)` }}>
        <path d="M12 4 L20 16 H4 Z" fill="currentColor" />
      </svg>
    </button>
  );
  return (
    <div className="sm:hidden">
      <div className="absolute bottom-4 left-4 w-44 h-44">
        {pad(0, -1, 0, "left-[3.75rem] top-0")}
        {pad(0, 1, 180, "left-[3.75rem] bottom-0")}
        {pad(-1, 0, -90, "left-0 top-[3.75rem]")}
        {pad(1, 0, 90, "right-0 top-[3.75rem]")}
      </div>
      <button type="button" onClick={onA} className="absolute bottom-10 right-6 w-20 h-20 rounded-full bg-hero border-[3px] border-outline font-display text-2xl text-outline shadow-[3px_3px_0_var(--color-outline)]">
        TALK
      </button>
    </div>
  );
}
