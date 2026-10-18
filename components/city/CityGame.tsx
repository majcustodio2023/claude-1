"use client";

// The walkable city. Top-down like the old Pokemon games: the player's own hero walks the
// streets, AI staff go about their jobs (out in their yards, across town to other buildings,
// in and out of doors; inside, between their desks, the Progress Room and the Mission Board),
// and walking up to anyone opens a conversation. Positions update straight on the DOM each
// frame so React only re-renders when something you can click changes.

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTracker } from "../App";
import { Hero, Kit } from "../characters";
import { Icon } from "../icons";
import { Btn } from "../ui";
import Dialogue, { type Talk } from "./Dialogue";
import { CityArt, CityGlow, InteriorArt, type HouseInfo, type InteriorInfo } from "./art";
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
  moving: boolean;
  /** Building they're inside (city scene), when hidden */
  inside?: string;
  phase?: "desk" | "away";
  onArrive?: () => void;
}

const SPRITE = 58;
const SPRITE_H = SPRITE * 1.125;
const WALK = 68;
const RUN_PLAYER = 290;
const WALK_PLAYER = 190;

const randIn = (r: Rect, rand: () => number, pad = 10): Pt => ({ x: r.x + pad + rand() * Math.max(1, r.w - pad * 2), y: r.y + pad + rand() * Math.max(1, r.h - pad * 2) });
const pick = <X,>(list: X[], rand: () => number) => list[Math.floor(rand() * list.length)];

export default function CityGame({ onExit, goTo }: { onExit: () => void; goTo: (tab: string) => void }) {
  const { data, month, today } = useTracker();
  const city = data.city!;
  const keys = data.integrations?.staffKeys;
  const [scene, setScene] = useState<Scene>({ type: "city" });
  const [talk, setTalk] = useState<Talk | null>(null);
  const [near, setNear] = useState<string>("");
  const [travel, setTravel] = useState(false);
  const [fade, setFade] = useState(0);

  const buildings = visibleBuildings(data);
  const bIds = buildings.map((b) => b.id).join(",");
  const studioIds = STUDIO_KINDS.map((k) => buildings.find((b) => b.kind === k)?.id).filter((x): x is string => Boolean(x));
  const cityLayout = useMemo(() => layoutCity(bIds ? bIds.split(",") : [], studioIds), [bIds, studioIds.join(",")]);
  const staff = city.staff.filter((s) => buildings.some((b) => b.id === s.buildingId));
  const staffKey = staff.map((s) => `${s.id}:${s.buildingId}:${s.role}`).join("|");

  const inside = scene.type === "inside" ? buildings.find((b) => b.id === scene.id) : undefined;
  const insideStaff = inside ? staff.filter((s) => s.buildingId === inside.id) : [];
  const reporterId = insideStaff.find((s) => s.role === "reporter")?.id;
  const roomKey = (inside?.rooms ?? []).map((r) => r.id).join(",");
  const deskIds = insideStaff.filter((s) => s.id !== reporterId).map((s) => s.id).join(",");
  const interior = useMemo(() => (scene.type === "inside" ? layoutInterior(deskIds ? deskIds.split(",") : [], reporterId, roomKey ? roomKey.split(",") : []) : null), [scene, deskIds, reporterId, roomKey]);

  const W = interior?.w ?? cityLayout.w;
  const H = interior?.h ?? cityLayout.h;

  // ---- refs the frame loop works with ----
  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const playerEl = useRef<HTMLDivElement>(null);
  const miniDot = useRef<SVGCircleElement>(null);
  const els = useRef(new Map<string, HTMLDivElement>());
  const agents = useRef(new Map<string, Agent>());
  const player = useRef({ x: cityLayout.spawn.x, y: cityLayout.spawn.y, face: 1 as 1 | -1, moving: false });
  const pressed = useRef(new Set<string>());
  const joy = useRef({ x: 0, y: 0 });
  const tapTo = useRef<Pt | null>(null);
  const nearAct = useRef<(() => void) | null>(null);
  const talkRef = useRef<Talk | null>(null);
  const doorLock = useRef(0);
  const spawnInside = useRef(false);
  const zoomRef = useRef(1);
  const cam = useRef({ x: 0, y: 0 });
  talkRef.current = talk;

  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staffKey, city.staff]);
  const nameOf = useCallback((id: string) => buildingName(data, buildings.find((b) => b.id === id) ?? buildings[0]), [data, bIds]);
  const shopIds = buildings.filter(isShop).map((b) => b.id);
  const latest = useRef({ staffById, nameOf, keys, cityLayout, interior, shopIds });
  latest.current = { staffById, nameOf, keys, cityLayout, interior, shopIds };

  const switchScene = useCallback((next: Scene, at?: Pt) => {
    setFade((f) => f + 1);
    sfx("door");
    setTalk(null);
    setScene(next);
    doorLock.current = performance.now() + 700;
    if (at) Object.assign(player.current, at);
  }, []);

  // ---- people: what each one is up to ----
  useEffect(() => {
    const map = new Map<string, Agent>();
    const rand = rng(Date.now() % 100000);
    const L = latest.current;
    const jobLine = (s: CityStaff) => {
      const prog = setupProgress(s, L.keys);
      if (prog.missing.length && rand() < 0.45) return `Waiting on you: ${prog.missing[0].label}`;
      return pick(roleOf(s).jobs, rand) + "…";
    };
    if (scene.type === "city") {
      const layout = L.cityLayout;
      const plot = (id: string) => layout.plots.find((p) => p.buildingId === id);
      const doorPt = (id: string) => {
        const p = plot(id)!;
        return { x: p.door.x + p.door.w / 2, y: p.door.y + p.door.h + 6 };
      };
      const yardPt = (id: string) => randIn(plot(id)!.yard, rand, 16);
      const plazaPt = () => {
        const f = layout.fountain;
        const side = rand() < 0.5 ? -1 : 1;
        return { x: f.x + side * f.r * (1.4 + rand() * 0.8), y: f.y + f.r * (0.8 + rand() * 0.9) };
      };
      const decide = (a: Agent) => {
        const s = latest.current.staffById.get(a.id);
        if (!s || !plot(s.buildingId)) return;
        const home = s.buildingId;
        if (!a.visible) {
          const at = a.inside && plot(a.inside) ? a.inside : home;
          Object.assign(a, doorPt(at));
          a.visible = true;
          a.inside = undefined;
          a.path = at === home ? [yardPt(home)] : roadRoute(doorPt(at), yardPt(home), layout);
          a.act = at === home ? jobLine(s) : `Heading back to ${latest.current.nameOf(home)}`;
          a.onArrive = () => (a.wait = 2 + rand() * 4);
          return;
        }
        const r = rand();
        const others = layout.plots.filter((p) => p.buildingId !== home);
        if (r < 0.48) {
          a.path = [yardPt(home)];
          a.act = jobLine(s);
          a.onArrive = () => (a.wait = 2 + rand() * 5);
        } else if (r < 0.66) {
          a.path = [doorPt(home)];
          a.act = pick(["Back to my desk", "Taking this inside", "Got an idea, heading in"], rand);
          a.onArrive = () => Object.assign(a, { visible: false, inside: home, wait: 5 + rand() * 10 });
        } else if (r < 0.86 && others.length) {
          const q = pick(others, rand).buildingId;
          a.path = roadRoute(a, doorPt(q), layout);
          a.act = `${pick(["Dropping off a report at", "Meeting the team at", "Picking up files from", "Syncing with"], rand)} ${latest.current.nameOf(q)}`;
          a.onArrive = () => Object.assign(a, { visible: false, inside: q, wait: 3 + rand() * 6 });
        } else {
          a.path = roadRoute(a, plazaPt(), layout);
          a.act = pick(["Coffee break at the plaza", "Stand-up meeting at the fountain", "Getting some air"], rand);
          a.onArrive = () => (a.wait = 3 + rand() * 5);
        }
      };
      for (const c of CITIZENS) {
        const home = layout.spots[c.spot];
        const a: Agent = { id: `cit:${c.id}`, ...home, path: [], wait: rand() * 3, act: pick(c.bubbles, rand), visible: true, face: 1, moving: false };
        (a as Agent & { decide: () => void }).decide = () => {
          a.path = [{ x: home.x + (rand() - 0.5) * (c.spot === "plaza-left" ? 10 : 90), y: home.y + (rand() - 0.5) * (c.spot === "plaza-left" ? 4 : 40) }];
          a.act = pick(c.bubbles, rand);
          a.onArrive = () => (a.wait = 3 + rand() * 5);
        };
        map.set(a.id, a);
      }
      for (const s of latest.current.staffById.values()) {
        if (!plot(s.buildingId)) continue;
        const out = rand() < (s.role === "reporter" ? 0.25 : 0.5);
        const p = out ? yardPt(s.buildingId) : doorPt(s.buildingId);
        const a: Agent = { id: s.id, ...p, path: [], wait: out ? rand() * 3 : 1 + rand() * 9, act: jobLine(s), visible: out, face: rand() < 0.5 ? 1 : -1, moving: false, inside: out ? undefined : s.buildingId };
        (a as Agent & { decide: () => void }).decide = () => decide(a);
        map.set(s.id, a);
      }
    } else if (L.interior) {
      const I = L.interior;
      const corridor = I.progress.y + I.progress.h + 0.35 * T;
      const via = (from: Pt, to: Pt): Pt[] => [{ x: from.x, y: corridor }, { x: to.x, y: corridor }, to];
      const deskOf = new Map(I.stations.map((st) => [st.staffId, st]));
      const roomsArr = I.rooms;
      const insideNow = [...latest.current.staffById.values()].filter((s) => deskOf.has(s.id) || s.id === I.reporter?.staffId);
      const decide = (a: Agent) => {
        const s = latest.current.staffById.get(a.id);
        if (!s) return;
        if (I.reporter?.staffId === a.id) {
          if (rand() < 0.3 && I.stations.length) {
            const st = pick(I.stations, rand);
            a.path = via(a, { x: st.x + 0.9 * T, y: st.y });
            a.act = `Collecting updates from ${latest.current.staffById.get(st.staffId)?.name ?? "the team"}`;
            a.onArrive = () => {
              a.wait = 2.5;
              a.onArrive = undefined;
              setTimeout(() => {
                a.path = via(a, { x: I.reporter!.x, y: I.reporter!.y });
                a.act = "Updating the scoreboard…";
                a.onArrive = () => (a.wait = 4 + rand() * 4);
              }, 2500);
            };
          } else {
            a.path = [{ x: I.progress.x + T + rand() * (I.progress.w - 2 * T), y: I.progress.y + 0.6 * T + rand() * 1.2 * T }];
            a.act = pick(["Updating the scoreboard…", "Writing today's report…", "Checking the numbers…"], rand);
            a.onArrive = () => (a.wait = 3 + rand() * 5);
          }
          return;
        }
        const desk = deskOf.get(a.id);
        if (!desk) return;
        const home = { x: desk.x, y: desk.y };
        if (a.phase === "away") {
          a.path = via(a, home);
          a.act = jobLine(s);
          a.onArrive = () => Object.assign(a, { phase: "desk", wait: 6 + rand() * 9 });
          return;
        }
        const r = rand();
        const coworkers = I.stations.filter((x) => x.staffId !== a.id);
        const away = (to: Pt, act: string, stay: number) => {
          a.path = via(a, to);
          a.act = act;
          a.onArrive = () => Object.assign(a, { phase: "away", wait: stay });
        };
        if (r < 0.34) away({ x: I.progress.x + T + rand() * (I.progress.w - 2 * T), y: I.progress.y + 0.7 * T + rand() * T }, `Posting results: ${pick(roleOf(s).jobs, rand).toLowerCase()}`, 2.5 + rand() * 2);
        else if (r < 0.54) away({ x: I.mission.x + T + rand() * (I.mission.w - 2 * T), y: I.mission.y + 0.7 * T + rand() * T }, "Grabbing the next mission", 2 + rand() * 2);
        else if (r < 0.76 && coworkers.length) {
          const c = pick(coworkers, rand);
          const other = map.get(c.staffId);
          away({ x: c.x + 0.9 * T, y: c.y + 4 }, `Talking shop with ${latest.current.staffById.get(c.staffId)?.name ?? "a teammate"}`, 3 + rand() * 2);
          if (other && other.phase !== "away" && !other.path.length) other.act = `Chatting with ${s.name}`;
        } else if (r < 0.86 && roomsArr.length) {
          const room = pick(roomsArr, rand);
          away(randIn(room.rect, rand, 30), `Working in the ${(data.city?.buildings.find((b) => b.id === scene.id)?.rooms ?? []).find((x) => x.id === room.id)?.name ?? "back room"}`, 4 + rand() * 3);
        } else {
          a.act = jobLine(s);
          a.wait = 5 + rand() * 6;
        }
      };
      for (const s of insideNow) {
        const st = deskOf.get(s.id);
        const p = st ? { x: st.x, y: st.y } : { x: I.reporter!.x, y: I.reporter!.y };
        const a: Agent = { id: s.id, ...p, path: [], wait: 1 + rand() * 6, act: jobLine(s), visible: true, face: 1, moving: false, phase: "desk" };
        (a as Agent & { decide: () => void }).decide = () => decide(a);
        map.set(s.id, a);
      }
    }
    agents.current = map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, staffKey, cityLayout, interior]);

  // Walking in through the door puts you just inside it.
  useEffect(() => {
    if (interior && spawnInside.current) {
      spawnInside.current = false;
      Object.assign(player.current, interior.spawn);
    }
  }, [interior]);

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
      if ((k === " " || k === "enter" || k === "e") && !talkRef.current) {
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
      const solids = scene.type === "city" ? L.cityLayout.solids : L.interior?.solids ?? [];
      const P = player.current;
      // player
      if (!talkRef.current) {
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
          } else if (L.interior && hits(foot, L.interior.exit)) {
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
        const vw = vp.clientWidth;
        const vh = vp.clientHeight;
        const base = vw < 700 ? 0.78 : vw > 1400 ? 1.15 : 1;
        // Inside, zoom in so the room fills the screen.
        const z = scene.type === "inside" && L.interior ? Math.max(base, Math.min(1.7, vw / L.interior.w, (vh - 40) / L.interior.h)) : base;
        zoomRef.current = z;
        const ww = (scene.type === "city" ? L.cityLayout.w : L.interior?.w ?? 0) * z;
        const wh = (scene.type === "city" ? L.cityLayout.h : L.interior?.h ?? 0) * z;
        const cx = ww <= vw ? -(vw - ww) / 2 : Math.min(Math.max(P.x * z - vw / 2, 0), ww - vw);
        const cy = wh <= vh ? -(vh - wh) / 2 : Math.min(Math.max(P.y * z - vh / 2, 0), wh - vh);
        cam.current = { x: cx, y: cy };
        world.current.style.transform = `translate(${-cx}px, ${-cy}px) scale(${z})`;
      }
      // draw
      if (playerEl.current) {
        playerEl.current.style.transform = `translate(${P.x - 32}px, ${P.y - 70}px)`;
        playerEl.current.style.zIndex = String(Math.round(P.y));
        playerEl.current.dataset.moving = P.moving ? "1" : "0";
        playerEl.current.dataset.face = String(P.face);
      }
      for (const a of agents.current.values()) {
        const el = els.current.get(a.id);
        if (!el) continue;
        el.style.display = a.visible ? "" : "none";
        if (!a.visible) continue;
        el.style.transform = `translate(${a.x - SPRITE / 2}px, ${a.y - SPRITE_H * 0.95}px)`;
        el.style.zIndex = String(Math.round(a.y));
        el.dataset.moving = a.moving ? "1" : "0";
        el.dataset.face = String(a.face);
        const b = el.firstElementChild as HTMLElement | null;
        if (b) {
          if (b.textContent !== a.act) b.textContent = a.act;
          b.style.opacity = Math.hypot(a.x - P.x, a.y - P.y) < 300 ? "1" : "0";
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
          const kx = f.x - f.r * 1.9;
          const ky = f.y + f.r * 1.6;
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
    return { id: b.id, name: buildingName(data, b), color: roofColor(b), kind: b.kind, avatar: client?.avatar, alert: staff.filter((s) => s.buildingId === b.id && setupProgress(s, keys).missing.length).length };
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
          desks: insideStaff.filter((s) => s.id !== reporterId).map((s) => ({ staffId: s.id, name: s.name, color: roleOf(s).color, ready: !setupProgress(s, keys).missing.length })),
        };
      })()
    : null;
  const interiorKey = JSON.stringify(interiorInfo);
  const interiorMemo = useMemo(() => interiorInfo, [interiorKey]);

  const hour = new Date().getHours();
  const tint = scene.type === "inside" ? null : hour >= 19 || hour < 5 ? "night" : hour >= 17 || hour < 7 ? "dusk" : null;
  const sceneStaff = scene.type === "city" ? staff : insideStaff;
  const nearLabel = near.split("|")[1] ?? "";
  const online = staff.length;

  return (
    <div className="fixed inset-0 z-[60] bg-outline select-none touch-none" role="application" aria-label={`${city.name}: walk with the arrow keys, talk with Space`}>
      <div ref={viewport} className="absolute inset-0 overflow-hidden" onPointerDown={onPointer}>
        <div ref={world} className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ width: W, height: H }}>
          {scene.type === "city" ? <CityArt layout={cityLayout} houses={housesMemo} cityName={city.name} /> : interior && interiorMemo && <InteriorArt layout={interior} info={interiorMemo} />}
          {scene.type === "city" && <KitNpc layout={cityLayout} />}
          {sceneStaff.map((s) => (
            <Npc key={`${scene.type}-${s.id}`} id={s.id} name={s.name} color={roleOf(s).color} look={s.look} refFn={(el) => (el ? els.current.set(s.id, el) : els.current.delete(s.id))} onTalk={talkTo} />
          ))}
          {scene.type === "city" &&
            CITIZENS.map((c) => (
              <Npc key={c.id} id={`cit:${c.id}`} name={c.name} color={c.color} look={citizenLook(c.id, c.seed)} refFn={(el) => (el ? els.current.set(`cit:${c.id}`, el) : els.current.delete(`cit:${c.id}`))} onTalk={talkTo} />
            ))}
          <div ref={playerEl} className="absolute left-0 top-0 city-walker" style={{ width: 64 }}>
            <div className="city-shadow" />
            <div className="city-flip">
              <div className="city-body">
                <Hero size={64} mood="ready" gear={Object.keys(data.heroGear ?? {})} />
              </div>
            </div>
            <div className="city-tag" style={{ background: "#ff5fae" }}>{data.settings.playerName || "You"}</div>
          </div>
          {tint && <div className={`absolute inset-0 pointer-events-none city-tint-${tint}`} style={{ zIndex: 100000 }} />}
          {tint && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 100001 }}>
              <CityGlow layout={cityLayout} />
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
          <span className="w-3 h-3 rounded-full bg-good city-blink" />
          <span className="font-extrabold">{online} staff online</span>
        </div>
        <div className="ml-auto flex gap-2 pointer-events-auto">
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
        <svg viewBox={`0 0 ${cityLayout.w} ${cityLayout.h}`} className="block w-full h-auto" aria-hidden>
          <rect width={cityLayout.w} height={cityLayout.h} fill="#3f9a4a" />
          {cityLayout.roads.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#454861" />
          ))}
          <rect x={cityLayout.plaza.x} y={cityLayout.plaza.y} width={cityLayout.plaza.w} height={cityLayout.plaza.h} fill="#e3dcef" />
          {cityLayout.plots.map((p) => (
            <rect key={p.buildingId} x={p.house.x} y={p.house.y} width={p.house.w} height={p.house.h} fill={housesMemo.find((h) => h.id === p.buildingId)?.color ?? "#fff"} />
          ))}
          <circle ref={miniDot} r="60" fill="#ff5fae" stroke="#fff" strokeWidth="24" />
        </svg>
        </div></div>
      )}

      {/* talk prompt */}
      {nearLabel && !talk && (
        <div className="absolute bottom-8 left-1/2 max-sm:bottom-48 city-prompt z-30">
          <button type="button" onClick={() => nearAct.current?.()} className="hud px-4 py-2.5 flex items-center gap-2 text-lg font-extrabold whitespace-nowrap">
            <span className="max-sm:hidden font-display bg-gold text-outline border-2 border-outline rounded px-2 pt-0.5">SPACE</span>
            {nearLabel}
          </button>
        </div>
      )}
      {!talk && <div className="absolute bottom-2 left-3 text-sm font-bold text-ink/80 max-sm:hidden pointer-events-none [text-shadow:0_1px_0_#000]">Arrows or WASD to walk · Shift to run · Space to talk · Tap the ground to walk there</div>}

      <TouchPad joy={joy} onA={() => nearAct.current?.()} hidden={Boolean(talk)} />

      {talk && <Dialogue talk={talk} onClose={() => setTalk(null)} goTo={goTo} />}
    </div>
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
      <div ref={refFn} className="absolute left-0 top-0 city-walker city-npc" style={{ width: SPRITE, display: "none" }} onClick={() => onTalk(id)}>
        <div className="city-bubble" />
        <div className="city-shadow" />
        <div className="city-flip">
          <div className="city-body">
            <Hero size={SPRITE} look={look} items={[]} mood="ready" />
          </div>
        </div>
        <div className="city-tag" style={{ background: color }}>
          {name}
        </div>
      </div>
    );
  },
  (a, b) => a.id === b.id && a.name === b.name && a.color === b.color && JSON.stringify(a.look) === JSON.stringify(b.look),
);

const KitNpc = memo(function KitNpc({ layout }: { layout: CityLayout }) {
  const f = layout.fountain;
  const x = f.x - f.r * 1.9;
  const y = f.y + f.r * 1.6;
  return (
    <div className="absolute left-0 top-0" style={{ transform: `translate(${x - 32}px, ${y - 62}px)`, zIndex: Math.round(y) }}>
      <div className="city-bubble" style={{ opacity: 1 }}>
        Welcome! Talk to me
      </div>
      <div className="city-shadow" />
      <div className="bob">
        <Kit size={64} />
      </div>
    </div>
  );
});

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
