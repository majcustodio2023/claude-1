"use client";

// Walking the Wilds. Same controls as town (arrows/WASD, Shift to run, tap to walk, Space to
// interact). Monsters roam their part of the valley; some charge at you when they spot you.
// Bump into one and the wild encounter screen takes over. Your HP carries over between fights,
// so rest at the campfire or drink potions; lose and you wake up by the fire, nothing lost.
// Positions update straight on the page each frame, so React only re-renders on real changes.

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTracker } from "../App";
import { useHeroLevel } from "../BossFight";
import { Icon } from "../icons";
import { Btn, toast } from "../ui";
import { PixelForce } from "../pixelate";
import { pixelGrid, pixelPicture, svgText } from "../city/pixel";
import { SPRITE_H, SPRITE_W, sheetUrl } from "../city/pixelSprite";
import { MonsterSprite, TREE_BOX, TreeSvg, WildsGround, monsterSize } from "./wildsArt";
import Encounter, { type EncounterResult } from "./Encounter";
import Inventory from "./Inventory";
import { T, hits, type Pt, type Rect } from "@/lib/city";
import { MONSTERS, STARTER_KEY, STARTER_PACK, layoutWilds, zoneAt, type Monster, type TreeKind, type ZoneId } from "@/lib/wilds";
import { loadoutFor } from "@/lib/battle";
import { addLoot, bagItemById, takeOne } from "@/lib/bag";
import { ensureGame } from "@/lib/loot";
import { randomHeroLook } from "@/lib/heroLook";
import { rng } from "@/lib/avatar";
import { sfx } from "@/lib/sound";
import { PX } from "../city/pixel";

const WALK = 190;
const RUN = 290;
const CELL = 240;

interface Mon {
  uid: number;
  m: Monster;
  x: number;
  y: number;
  tx: number;
  ty: number;
  wait: number;
  face: 1 | -1;
  moving: boolean;
  alive: boolean;
  respawnAt: number;
  chasing: boolean;
  /** Can't start a fight until then (just ran from it). */
  calmUntil: number;
}

/** Buckets of solid boxes, so walking only checks what's nearby. */
function solidGrid(solids: Rect[]) {
  const map = new Map<string, Rect[]>();
  for (const s of solids)
    for (let gx = Math.floor(s.x / CELL); gx <= Math.floor((s.x + s.w) / CELL); gx++)
      for (let gy = Math.floor(s.y / CELL); gy <= Math.floor((s.y + s.h) / CELL); gy++) {
        const k = `${gx},${gy}`;
        const list = map.get(k);
        if (list) list.push(s);
        else map.set(k, [s]);
      }
  return (box: Rect) => {
    const out = new Set<Rect>();
    for (let gx = Math.floor(box.x / CELL); gx <= Math.floor((box.x + box.w) / CELL); gx++)
      for (let gy = Math.floor(box.y / CELL); gy <= Math.floor((box.y + box.h) / CELL); gy++) for (const s of map.get(`${gx},${gy}`) ?? []) out.add(s);
    return [...out];
  };
}

function slide(box: Rect, dx: number, dy: number, near: (b: Rect) => Rect[]) {
  let { x, y } = box;
  const area = { x: box.x - Math.abs(dx) - 2, y: box.y - Math.abs(dy) - 2, w: box.w + Math.abs(dx) * 2 + 4, h: box.h + Math.abs(dy) * 2 + 4 };
  const list = near(area);
  const tx = { ...box, x: x + dx };
  if (!list.some((s) => hits(tx, s))) x += dx;
  const ty = { ...box, x, y: y + dy };
  if (!list.some((s) => hits(ty, s))) y += dy;
  return { x, y };
}

const MERCHANT_LOOK = (() => {
  const l = randomHeroLook(rng(4242));
  return { ...l, outfit: "#2f8f83", accent: "#f4c95d", hairColor: "#c0502f" };
})();

export default function WildsGame({ onExit }: { onExit: () => void }) {
  const { data, update, today } = useTracker();
  const level = useHeroLevel();
  const L = useMemo(() => layoutWilds(), []);
  const near = useMemo(() => solidGrid(L.solids), [L]);
  const maxHp = loadoutFor(data, level).stats.hp;
  const [hp, setHp] = useState<number | null>(null);
  const cur = Math.min(maxHp, hp ?? maxHp);
  const [fight, setFight] = useState<{ uid: number; m: Monster; zone: ZoneId } | null>(null);
  const [bag, setBag] = useState<{ merchant: boolean } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [zone, setZone] = useState<ZoneId>("meadow");
  const [zoneKey, setZoneKey] = useState(0);
  const [ground, setGround] = useState("");
  const [trees, setTrees] = useState<Partial<Record<TreeKind, string>>>({});
  const [mons, setMons] = useState<Partial<Record<string, string>>>({});
  const [talk, setTalk] = useState<{ name: string; text: string; actions?: { label: string; go: () => void }[] } | null>(null);

  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const playerEl = useRef<HTMLDivElement>(null);
  const miniDot = useRef<SVGCircleElement>(null);
  const treeEls = useRef<(HTMLDivElement | null)[]>([]);
  const monEls = useRef(new Map<number, HTMLDivElement>());
  const P = useRef({ x: L.spawn.x, y: L.spawn.y, face: 1 as 1 | -1, dir: "up" as "up" | "down" | "side", moving: false });
  const pressed = useRef(new Set<string>());
  const joy = useRef({ x: 0, y: 0 });
  const tapTo = useRef<Pt | null>(null);
  const act = useRef<(() => void) | null>(null);
  const paused = useRef(false);
  paused.current = Boolean(fight || bag || talk);
  const zoomRef = useRef(1.4);
  const cam = useRef({ x: 0, y: 0 });
  // A few calm seconds when you arrive, so nothing jumps you at the gate.
  const grace = useRef(typeof performance === "undefined" ? 0 : performance.now() + 4000);
  const zoneRef = useRef<ZoneId>("meadow");

  // Monsters, spread over their zones.
  const monsters = useRef<Mon[]>([]);
  if (!monsters.current.length) {
    let uid = 0;
    for (const m of MONSTERS)
      for (let i = 0; i < m.count; i++) {
        const p = L.open(m.zone);
        monsters.current.push({ uid: uid++, m, x: p.x, y: p.y, tx: p.x, ty: p.y, wait: Math.random() * 3, face: 1, moving: false, alive: true, respawnAt: 0, chasing: false, calmUntil: 0 });
      }
  }

  // Pictures: the ground once, one per tree kind, one per monster.
  useEffect(() => {
    let gone = false;
    const urls: string[] = [];
    pixelPicture(<WildsGround layout={L} />, L.w, L.h).then((u) => (gone ? URL.revokeObjectURL(u) : (urls.push(u), setGround(u))));
    (["oak", "pine", "birch", "bush", "ancient", "willow"] as TreeKind[]).forEach((k) =>
      pixelPicture(<TreeSvg kind={k} />, TREE_BOX.w, TREE_BOX.h).then((u) => (gone ? URL.revokeObjectURL(u) : (urls.push(u), setTrees((t) => ({ ...t, [k]: u }))))),
    );
    MONSTERS.forEach((m) => {
      const s = monsterSize(m.id);
      const svg = svgText(
        <svg xmlns="http://www.w3.org/2000/svg" width={s.w} height={s.h} viewBox={`0 0 ${s.w} ${s.h}`}>
          <MonsterSprite id={m.id} />
        </svg>,
      );
      pixelGrid(svg, s.w, s.h).then((u) => (gone ? URL.revokeObjectURL(u) : (urls.push(u), setMons((x) => ({ ...x, [m.id]: u })))));
    });
    return () => {
      gone = true;
      setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 2000);
    };
  }, [L]);

  // The first time out, Wren gives you a few potions.
  useEffect(() => {
    if (data.game?.claimed?.[STARTER_KEY]) return;
    update((d) => {
      const g = ensureGame(d, today);
      if (g.claimed[STARTER_KEY]) return;
      g.claimed[STARTER_KEY] = today;
      addLoot(d, STARTER_PACK, today);
    });
    setTalk({
      name: "Wren · Forager",
      text: "First time past the gate? Take these: 3 red potions, 3 red herbs and a green potion. They're in your bag (press I). The meadow critters are gentle, the woods up north are not. Rest by my fire whenever you're hurt.",
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- input ----
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (paused.current) {
        if (k === "escape") (setBag(null), setTalk(null));
        return;
      }
      if (k === "i" || k === "b") return setBag({ merchant: false });
      if (k === " " || k === "enter" || k === "e") return act.current?.();
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

  const rest = useCallback(() => {
    setHp(null);
    sfx("heal");
    setTalk({ name: "Campfire", text: "You sit by the fire for a while. The warmth soaks in. HP fully restored." });
  }, []);
  const openMerchant = useCallback(() => {
    setTalk({
      name: "Wren · Forager",
      text: "Back in one piece! I buy monster loot and spare gear, up to 150 coins a day. Potions? The critters drop those. Rest by the fire before you head north. The Old Grove isn't kind.",
      actions: [{ label: "Open my bag to sell", go: () => (setTalk(null), setBag({ merchant: true })) }],
    });
  }, []);

  // ---- frame loop ----
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let checkAt = 0;
    let cullAt = 0;
    let lastPrompt = "";
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const p = P.current;
      if (!paused.current) {
        const k = pressed.current;
        let dx = (k.has("arrowright") || k.has("d") ? 1 : 0) - (k.has("arrowleft") || k.has("a") ? 1 : 0) + joy.current.x;
        let dy = (k.has("arrowdown") || k.has("s") ? 1 : 0) - (k.has("arrowup") || k.has("w") ? 1 : 0) + joy.current.y;
        if (!dx && !dy && tapTo.current) {
          dx = tapTo.current.x - p.x;
          dy = tapTo.current.y - p.y;
          if (Math.hypot(dx, dy) < 6) tapTo.current = null;
        }
        const len = Math.hypot(dx, dy);
        p.moving = len > 0.01;
        if (p.moving) {
          const sp = (k.has("shift") ? RUN : WALK) * dt;
          dx = (dx / len) * sp;
          dy = (dy / len) * sp;
          if (dx) p.face = dx > 0 ? 1 : -1;
          p.dir = Math.abs(dy) > Math.abs(dx) * 1.2 ? (dy > 0 ? "down" : "up") : "side";
          const box = { x: p.x - 11, y: p.y - 8, w: 22, h: 10 };
          const moved = slide(box, dx, dy, near);
          if (tapTo.current && moved.x === box.x && moved.y === box.y) tapTo.current = null;
          p.x = moved.x + 11;
          p.y = moved.y + 8;
        }
        if (hits({ x: p.x - 11, y: p.y - 8, w: 22, h: 10 }, L.exit)) {
          paused.current = true;
          sfx("door");
          onExit();
          return;
        }
        // monsters
        for (const mo of monsters.current) {
          if (!mo.alive) {
            if (now > mo.respawnAt) {
              const at = L.open(mo.m.zone);
              // never pop up right next to you
              if (Math.hypot(at.x - p.x, at.y - p.y) > 500) Object.assign(mo, { x: at.x, y: at.y, tx: at.x, ty: at.y, alive: true, chasing: false });
              else mo.respawnAt = now + 2000;
            }
            continue;
          }
          const d = Math.hypot(p.x - mo.x, p.y - mo.y);
          const calm = now < mo.calmUntil || now < grace.current;
          mo.chasing = Boolean(mo.m.aggressive) && !calm && d < 230 && zoneAt(L, p).id === mo.m.zone;
          let gx = mo.tx;
          let gy = mo.ty;
          let speed = mo.m.speed;
          if (mo.chasing) {
            gx = p.x;
            gy = p.y;
            speed = mo.m.speed * 1.6 + 30;
          } else if (mo.wait > 0) {
            mo.wait -= dt;
            mo.moving = false;
            continue;
          }
          const ddx = gx - mo.x;
          const ddy = gy - mo.y;
          const dd = Math.hypot(ddx, ddy);
          if (dd < 4) {
            mo.moving = false;
            // pick somewhere new to wander, near where it is, inside its zone
            const z = L.zones.find((zz) => zz.id === mo.m.zone)!.rect;
            mo.tx = Math.max(3 * T, Math.min(L.w - 3 * T, mo.x + (Math.random() - 0.5) * 8 * T));
            mo.ty = Math.max(z.y + T, Math.min(z.y + z.h - T, mo.y + (Math.random() - 0.5) * 6 * T));
            mo.wait = 1 + Math.random() * 3;
          } else {
            const step = Math.min(dd, speed * dt);
            const box = { x: mo.x - 12, y: mo.y - 8, w: 24, h: 10 };
            const moved = slide(box, (ddx / dd) * step, (ddy / dd) * step, near);
            if (moved.x === box.x && moved.y === box.y && !mo.chasing) {
              mo.tx = mo.x;
              mo.ty = mo.y;
            }
            mo.x = moved.x + 12;
            mo.y = moved.y + 8;
            mo.moving = true;
            if (Math.abs(ddx) > 1) mo.face = ddx > 0 ? 1 : -1;
          }
          if (!calm && d < (mo.m.big ? 44 : 32)) {
            // Contact: a wild battle!
            paused.current = true;
            pressed.current.clear();
            tapTo.current = null;
            p.moving = false;
            setFight({ uid: mo.uid, m: mo.m, zone: mo.m.zone });
            break;
          }
        }
      } else p.moving = false;

      // camera
      const vp = viewport.current;
      if (vp && world.current) {
        const vw = vp.clientWidth;
        const vh = vp.clientHeight;
        const z = vw < 700 ? 1.05 : Math.min(1.75, Math.max(1.35, Math.min(vw, vh * 1.6) / 1100));
        zoomRef.current = z;
        const cx = Math.min(Math.max(p.x * z - vw / 2, 0), L.w * z - vw);
        const cy = Math.min(Math.max(p.y * z - vh / 2, 0), L.h * z - vh);
        cam.current = { x: cx, y: cy };
        const tf = `translate(${Math.round(-cx)}px, ${Math.round(-cy)}px) scale(${z})`;
        if (world.current.style.transform !== tf) world.current.style.transform = tf;
        // only trees and monsters near the screen are shown
        if (now > cullAt) {
          cullAt = now + 200;
          const view = { x: cx / z - 200, y: cy / z - 200, w: vw / z + 400, h: vh / z + 400 };
          L.trees.forEach((t, i) => {
            const el = treeEls.current[i];
            if (!el) return;
            const show = t.x > view.x && t.x < view.x + view.w && t.y > view.y && t.y < view.y + view.h + 200 ? "" : "none";
            if (el.style.display !== show) el.style.display = show;
          });
        }
      }
      // draw
      const pe = playerEl.current;
      if (pe) {
        const tf = `translate(${Math.round(p.x - SPRITE_W / 2)}px, ${Math.round(p.y - SPRITE_H + 4)}px)`;
        if (pe.style.transform !== tf) pe.style.transform = tf;
        pe.style.zIndex = String(Math.round(p.y));
        pe.dataset.moving = p.moving ? "1" : "0";
        pe.dataset.face = String(p.face);
        pe.dataset.dir = p.dir;
        pe.style.opacity = now < grace.current ? (Math.floor(now / 120) % 2 ? "0.45" : "1") : "1";
      }
      for (const mo of monsters.current) {
        const el = monEls.current.get(mo.uid);
        if (!el) continue;
        const show = mo.alive ? "" : "none";
        if (el.style.display !== show) el.style.display = show;
        if (!mo.alive) continue;
        const s = monsterSize(mo.m.id);
        const w = s.w * PX * (mo.m.big ? 1.6 : 1.15);
        const h = (w * s.h) / s.w;
        el.style.transform = `translate(${Math.round(mo.x - w / 2)}px, ${Math.round(mo.y - h + 6)}px)`;
        el.style.zIndex = String(Math.round(mo.y));
        el.dataset.moving = mo.moving ? "1" : "0";
        el.dataset.face = String(mo.face);
        el.dataset.alert = mo.chasing ? "1" : "0";
        const tag = el.lastElementChild as HTMLElement | null;
        if (tag) tag.style.opacity = Math.hypot(mo.x - p.x, mo.y - p.y) < 260 ? "1" : "0";
      }
      if (miniDot.current) {
        miniDot.current.setAttribute("cx", String(p.x));
        miniDot.current.setAttribute("cy", String(p.y));
      }
      // what's nearby to use, and which zone you're in
      if (now > checkAt) {
        checkAt = now + 150;
        const z = zoneAt(L, p).id;
        if (z !== zoneRef.current) {
          zoneRef.current = z;
          setZone(z);
          setZoneKey((n) => n + 1);
        }
        let label = "";
        let go: (() => void) | null = null;
        const c = L.camp;
        if (Math.hypot(p.x - c.fire.x, p.y - c.fire.y) < 90) (label = "Rest by the campfire"), (go = rest);
        else if (Math.hypot(p.x - c.merchant.x, p.y - (c.merchant.y + 30)) < 90) (label = "Talk to Wren · Forager"), (go = openMerchant);
        else if (Math.hypot(p.x - c.sign.x, p.y - c.sign.y) < 80)
          (label = "Read the signpost"),
            (go = () => setTalk({ name: "Signpost", text: "NORTH: Mosswood and the Glimmer River. Beyond it, the Old Grove. Monsters get tougher the further north you go. SOUTH: back to Dawnterra." }));
        else if (hits({ x: p.x - 1, y: p.y - 1, w: 2, h: 2 }, { x: L.altar.x - T, y: L.altar.y - T, w: L.altar.w + 2 * T, h: L.altar.h + 2.4 * T }))
          (label = "Look at the altar"),
            (go = () => setTalk({ name: "Grove altar", text: "Old stone, warm to the touch. Antler marks are carved into it, and a golden acorn has been left as an offering. The Grove King walks these woods. Beat it and it may drop one for you." }));
        act.current = go;
        if (label !== lastPrompt) {
          lastPrompt = label;
          setPrompt(label);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [L, near, onExit, rest, openMerchant]);

  const endFight = (r: EncounterResult) => {
    const f = fight;
    setFight(null);
    if (!f) return;
    const mo = monsters.current.find((x) => x.uid === f.uid);
    const now = performance.now();
    if (r.outcome === "win") {
      if (mo) Object.assign(mo, { alive: false, respawnAt: now + mo.m.respawn * 1000 });
      setHp(r.hp);
      grace.current = now + 1200;
    } else if (r.outcome === "fled") {
      setHp(r.hp);
      if (mo) {
        mo.calmUntil = now + 6000;
        const p = P.current;
        const d = Math.hypot(mo.x - p.x, mo.y - p.y) || 1;
        const box = { x: mo.x - 12, y: mo.y - 8, w: 24, h: 10 };
        const moved = slide(box, ((mo.x - p.x) / d) * 70, ((mo.y - p.y) / d) * 70, near);
        mo.x = moved.x + 12;
        mo.y = moved.y + 8;
      }
      grace.current = now + 2500;
    } else {
      setHp(null);
      Object.assign(P.current, { x: L.camp.fire.x - 60, y: L.camp.fire.y + 50 });
      if (mo) mo.calmUntil = now + 4000;
      grace.current = now + 3000;
      setTalk({ name: "Campfire", text: "You come to by the fire, patched up and fully healed. Whatever knocked you out wandered off. Nothing was lost." });
    }
  };

  const drink = (id: string) => {
    const it = bagItemById(id);
    if (!it?.use) return;
    if (!it.use.heal) return toast("That one only helps in a fight.");
    if (cur >= maxHp) return toast("You're already at full HP.");
    update((d) => void takeOne(d, id));
    setHp(Math.min(maxHp, cur + Math.round(maxHp * it.use.heal)));
    sfx("heal");
  };

  const onPointer = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    const rect = viewport.current!.getBoundingClientRect();
    const z = zoomRef.current;
    tapTo.current = { x: (e.clientX - rect.left + cam.current.x) / z, y: (e.clientY - rect.top + cam.current.y) / z };
  };

  const z = L.zones.find((x) => x.id === zone)!;
  const pct = cur / maxHp;

  return (
    <PixelForce.Provider value={true}>
      <div className="dawn fixed inset-0 z-[65] bg-outline select-none touch-none" role="application" aria-label="The Wilds: walk with the arrow keys, Space to interact, I for your bag">
        <div ref={viewport} className="absolute inset-0 overflow-hidden" onPointerDown={onPointer}>
          <div ref={world} className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ width: L.w, height: L.h }}>
            {ground && <img src={ground} alt="" width={L.w} height={L.h} className="absolute left-0 top-0 block max-w-none pixelated" draggable={false} />}
            <Trees L={L} urls={trees} refs={treeEls} />
            <Labels L={L} />
            {/* Wren the forager at her stall */}
            <div className="absolute left-0 top-0" style={{ transform: `translate(${L.camp.merchant.x - SPRITE_W / 2}px, ${L.camp.merchant.y - SPRITE_H + 30}px)`, zIndex: Math.round(L.camp.merchant.y + 30), width: SPRITE_W }}>
              <div className="city-shadow" />
              <div className="pix-bob">
                <div className="pix" style={{ width: SPRITE_W, height: SPRITE_H, backgroundImage: `url(${sheetUrl(MERCHANT_LOOK)})`, backgroundSize: `${SPRITE_W * 4}px ${SPRITE_H * 3}px`, backgroundPosition: `${-SPRITE_W}px 0` }} />
              </div>
              <div className="city-tag" style={{ background: "#2a6a6e" }}>Wren</div>
            </div>
            {monsters.current.map((mo) => (
              <MonsterEl key={mo.uid} mo={mo} url={mons[mo.m.id]} refFn={(el) => (el ? monEls.current.set(mo.uid, el) : monEls.current.delete(mo.uid))} />
            ))}
            <div ref={playerEl} className="absolute left-0 top-0 city-walker" style={{ width: SPRITE_W }}>
              <div className="city-shadow" />
              <div className="city-flip">
                <div className="city-body pix" style={{ width: SPRITE_W, height: SPRITE_H, backgroundImage: `url(${sheetUrl(data.game?.look)})` }} />
              </div>
              <div className="city-tag" style={{ background: "#f2b866" }}>{data.settings.playerName || "You"}</div>
            </div>
          </div>
        </div>

        {/* area banner when you walk into a new zone */}
        <div key={zoneKey} className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none wild-zone z-20">
          <div className="hud px-6 py-3 text-center">
            <div className="font-display text-3xl sm:text-4xl leading-none">{z.name}</div>
            <div className="text-base font-extrabold text-muted mt-1">{z.blurb}</div>
          </div>
        </div>

        {/* HUD */}
        <div className="absolute top-0 inset-x-0 p-2 sm:p-3 flex items-start gap-2 pointer-events-none">
          <div className="hud px-3 py-2 pointer-events-auto min-w-[220px] max-w-[60vw]">
            <div className="font-display text-2xl sm:text-3xl tracking-wide leading-none truncate">The Wilds</div>
            <div className="text-sm font-extrabold text-muted truncate">
              {z.name} · {z.danger}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="font-display text-base">HP</span>
              <div className="relative flex-1 h-4 bg-[#3d3a40] border-2 border-[#2b1d2e]">
                <div className="absolute inset-y-0 left-0 transition-[width] duration-300" style={{ width: `${pct * 100}%`, background: pct > 0.5 ? "#6aa645" : pct > 0.2 ? "#e8a33d" : "#c0502f" }} />
              </div>
              <span className="font-display text-lg tabular-nums whitespace-nowrap">
                {cur}/{maxHp}
              </span>
            </div>
          </div>
          <div className="ml-auto flex gap-2 pointer-events-auto">
            <Btn kind="primary" onClick={() => setBag({ merchant: false })} className="flex items-center gap-1.5 max-sm:hidden" title="Your bag and gear (I)">
              <Icon name="backpack" size={20} /> Bag
            </Btn>
            <Btn onClick={onExit} className="flex items-center gap-1.5">
              <Icon name="home" size={20} /> <span className="max-sm:hidden">Back to town</span>
            </Btn>
          </div>
        </div>

        {/* mini map */}
        <div className="absolute bottom-3 right-3 w-44 pointer-events-none max-sm:hidden">
          <div className="hud p-1">
            <svg viewBox={`0 0 ${L.w} ${L.h}`} className="block w-full h-auto" shapeRendering="crispEdges" aria-hidden>
              <rect y={L.zones[2].rect.y} width={L.w} height={L.zones[2].rect.h} fill="#8cc05a" />
              <rect y={L.zones[1].rect.y} width={L.w} height={L.zones[1].rect.h} fill="#6aa645" />
              <rect width={L.w} height={L.zones[0].rect.h} fill="#3e6b32" />
              {[L.path, L.trail].map((pp, i) => (
                <polyline key={i} points={pp.map((q) => `${q.x},${q.y}`).join(" ")} fill="none" stroke="#e0b57a" strokeWidth="60" />
              ))}
              {L.water.map((r, i) => (
                <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#4f78a8" />
              ))}
              <ellipse cx={L.pond.x} cy={L.pond.y} rx={L.pond.rx} ry={L.pond.ry} fill="#4f78a8" />
              <rect x={L.camp.fire.x - 60} y={L.camp.fire.y - 60} width="120" height="120" fill="#d9703b" />
              <rect x={L.altar.x} y={L.altar.y} width={L.altar.w} height={L.altar.h} fill="#f4c95d" />
              <circle ref={miniDot} r="70" fill="#c0502f" stroke="#fffaf0" strokeWidth="26" />
            </svg>
          </div>
        </div>

        {prompt && !talk && !fight && !bag && (
          <div className="absolute bottom-8 left-1/2 max-sm:bottom-48 city-prompt z-30">
            <button type="button" onClick={() => act.current?.()} className="hud px-4 py-2.5 flex items-center gap-2 text-lg font-extrabold whitespace-nowrap">
              <span className="max-sm:hidden font-display bg-gold text-outline border-2 border-outline rounded px-2 pt-0.5">SPACE</span>
              {prompt}
            </button>
          </div>
        )}
        {!talk && !fight && !bag && (
          <div className="absolute bottom-2 left-3 text-[15px] text-[#fbf1dc] max-sm:hidden pointer-events-none [text-shadow:2px_2px_0_#2b1d2e]">
            Arrows or WASD to walk · Shift to run · Space to interact · I for your bag · Monsters with a red ! are coming for you
          </div>
        )}

        {talk && (
          <div className="absolute inset-x-2 bottom-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[min(720px,94vw)] z-40">
            <div className="hud p-4">
              <div className="font-display text-2xl leading-none mb-1.5">{talk.name}</div>
              <p className="text-xl font-bold leading-snug">{talk.text}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-end">
                {talk.actions?.map((a) => (
                  <Btn key={a.label} kind="primary" onClick={a.go}>
                    {a.label}
                  </Btn>
                ))}
                <Btn onClick={() => setTalk(null)}>OK</Btn>
              </div>
            </div>
          </div>
        )}

        <TouchPad joy={joy} onA={() => act.current?.()} onBag={() => setBag({ merchant: false })} hidden={Boolean(talk || fight || bag)} />

        {bag && <Inventory onClose={() => setBag(null)} hp={{ cur, max: maxHp }} onDrink={drink} merchant={bag.merchant} />}
        {fight && <Encounter monster={fight.m} heroHp={cur} zone={fight.zone} onDone={endFight} />}
      </div>
    </PixelForce.Provider>
  );
}

const Trees = memo(function Trees({ L, urls, refs }: { L: ReturnType<typeof layoutWilds>; urls: Partial<Record<TreeKind, string>>; refs: React.RefObject<(HTMLDivElement | null)[]> }) {
  return (
    <>
      {L.trees.map((t, i) => {
        const u = urls[t.kind];
        if (!u) return null;
        const w = TREE_BOX.w * t.s;
        const h = TREE_BOX.h * t.s;
        return (
          <div
            key={i}
            ref={(el) => void (refs.current![i] = el)}
            className="absolute pixelated pointer-events-none"
            style={{ left: t.x - TREE_BOX.footX * t.s, top: t.y - TREE_BOX.footY * t.s, width: w, height: h, zIndex: Math.round(t.y), backgroundImage: `url(${u})`, backgroundSize: "100% 100%" }}
          />
        );
      })}
    </>
  );
});

const MonsterEl = memo(function MonsterEl({ mo, url, refFn }: { mo: Mon; url?: string; refFn: (el: HTMLDivElement | null) => void }) {
  const s = monsterSize(mo.m.id);
  const w = s.w * PX * (mo.m.big ? 1.6 : 1.15);
  const h = (w * s.h) / s.w;
  const tone = mo.m.zone === "meadow" ? "#4f8a3a" : mo.m.zone === "mosswood" ? "#cf8a1f" : "#c0502f";
  return (
    <div ref={refFn} className="absolute left-0 top-0 wild-mon" style={{ width: w, height: h }}>
      <div className="city-shadow" />
      <div className="wild-mon-flip w-full h-full">
        <div className="wild-mon-body w-full h-full pix" style={{ backgroundImage: url ? `url(${url})` : undefined, backgroundSize: "100% 100%" }} />
      </div>
      <div className="wild-tag" style={{ background: tone, opacity: 0 }}>
        Lv{mo.m.lv} {mo.m.name}
      </div>
    </div>
  );
});

/** Readable signs over the map: zone names on the path, the camp. */
const Labels = memo(function Labels({ L }: { L: ReturnType<typeof layoutWilds> }) {
  const sign = (x: number, y: number, text: string, sub?: string) => (
    <div className="absolute pointer-events-none text-center" style={{ left: x, top: y, transform: "translate(-50%, -100%)", zIndex: Math.round(y) }}>
      <div className="font-display text-[22px] leading-none px-2 py-1 bg-[#fbf1dc] text-[#2b1d2e] border-[3px] border-[#2b1d2e] whitespace-nowrap shadow-[3px_3px_0_rgba(43,29,46,0.5)]">{text}</div>
      {sub && <div className="text-[13px] font-extrabold text-[#fbf1dc] [text-shadow:2px_2px_0_#2b1d2e] whitespace-nowrap mt-0.5">{sub}</div>}
    </div>
  );
  const c = L.camp;
  return (
    <>
      {sign(c.sign.x - 6, c.sign.y - 64, "Wilds Camp", "Rest · trade · back to town")}
      {sign(L.w / 2, L.h - 1.8 * T, "To Dawnterra")}
      {sign(L.bridges[0].x + L.bridges[0].w / 2, L.bridges[0].y - 10, "Glimmer River")}
      {sign(L.altar.x + L.altar.w / 2, L.altar.y - 1.2 * T, "Grove King's altar", "Dangerous")}
      {sign(L.w / 2 + 2 * T, 54 * T + 1.5 * T, "Mosswood ahead", "Tougher monsters")}
      {sign(L.w / 2 - 8 * T, 26 * T + 1.2 * T, "The Old Grove", "Very dangerous")}
    </>
  );
});

function TouchPad({ joy, onA, onBag, hidden }: { joy: React.RefObject<{ x: number; y: number }>; onA: () => void; onBag: () => void; hidden: boolean }) {
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
      <button type="button" onClick={onBag} className="absolute bottom-32 right-6 w-16 h-16 rounded-full bg-gold border-[3px] border-outline font-display text-lg text-outline shadow-[3px_3px_0_var(--color-outline)]">
        BAG
      </button>
      <button type="button" onClick={onA} className="absolute bottom-10 right-6 w-20 h-20 rounded-full bg-hero border-[3px] border-outline font-display text-2xl text-outline shadow-[3px_3px_0_var(--color-outline)]">
        A
      </button>
    </div>
  );
}
