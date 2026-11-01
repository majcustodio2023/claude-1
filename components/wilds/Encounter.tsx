"use client";

// A wild monster fight, laid out like the classic handheld monster games: the foe on its
// patch of grass at the top right with its name and HP box, your hero at the bottom left with
// yours, and a text box with FIGHT / BAG / RUN underneath. It runs on the same battle engine
// as the boss fights (lib/battle.ts); this screen is all about making every hit land: the
// attacker lunges, the target flashes white and gets knocked back, the screen shakes, sparks
// fly, big damage numbers pop, HP bars drain with a lagging red trail, and every move has sound.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTracker } from "../App";
import { useHeroLevel } from "../BossFight";
import { PixelHero } from "../pixelate";
import { pixelPicture } from "../city/pixel";
import { MonsterPortrait } from "./wildsArt";
import { ItemIcon } from "./ItemIcon";
import {
  BOSS_MOVES, MAX_ENERGY, SKILLS, STATUS_LABEL, failedFleeRound, fleeChance, loadoutFor, moveName, playRound, skillBlocked, startBattle, useItemRound,
  type Battle, type BattleEvent, type Fx, type SkillId,
} from "@/lib/battle";
import { rollDrops, type Monster, type ZoneId } from "@/lib/wilds";
import { addLoot, anyItem, bagCount, bagItemById, BAG_ITEMS, rarityColor, takeOne } from "@/lib/bag";
import { setIntensity, sfx, startMusic, stopMusic, type Sfx } from "@/lib/sound";

const FX_COLOR: Record<Fx, string> = {
  slash: "#fbf1dc", impact: "#f4c95d", fire: "#d9703b", thunder: "#86d0bd", holy: "#fbe29a", dark: "#a996d6",
  heal: "#8cc05a", shield: "#7aa3cc", cosmic: "#e8a0a0", laser: "#c0502f", buff: "#f4c95d",
};
const FX_SOUND: Record<Fx, Sfx> = { slash: "slash", impact: "hit", fire: "fire", thunder: "thunder", holy: "holy", dark: "dark", heal: "heal", shield: "guard", cosmic: "cosmic", laser: "laser", buff: "buff" };
const FX_LABEL: Record<Fx, string> = { slash: "Slash", impact: "Strike", fire: "Fire", thunder: "Storm", holy: "Holy", dark: "Dark", heal: "Nature", shield: "Guard", cosmic: "Cosmic", laser: "Laser", buff: "Boost" };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Menu = "main" | "fight" | "bag";
type Phase = "intro" | "battle" | "won" | "lost" | "fled";
type Pop = { id: number; side: "hero" | "foe"; text: string; color: string; big?: boolean };
type Spark = { id: number; side: "hero" | "foe"; color: string; fx: Fx; crit?: boolean };

export interface EncounterResult {
  outcome: "win" | "lose" | "fled";
  hp: number;
  loot: string[];
}

const SKY: Record<ZoneId, [string, string, string, string]> = {
  // sky top, sky low, far hills, ground
  meadow: ["#7aa3cc", "#b4d0e6", "#6aa645", "#8cc05a"],
  mosswood: ["#2a6a6e", "#86d0bd", "#3e6b32", "#6aa645"],
  grove: ["#23314f", "#4fb0a0", "#2f4a2a", "#4f8a3a"],
};

function Backdrop({ zone }: { zone: ZoneId }) {
  const [top, low, hills, ground] = SKY[zone];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={low} />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#sky)" />
      <circle cx="520" cy="56" r="26" fill={zone === "grove" ? "#d3c8ec" : "#fbe29a"} />
      {[[60, 70], [210, 44], [380, 80]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} h60 a14 14 0 0 0 -14 -14 a18 18 0 0 0 -32 0 a12 12 0 0 0 -14 14 z`} fill="#fbf1dc" opacity={zone === "grove" ? 0.3 : 0.85} />
      ))}
      <path d="M0 170 Q80 120 160 160 T320 150 T480 140 T640 160 V200 H0 Z" fill={hills} />
      {Array.from({ length: 22 }, (_, i) => (
        <path key={i} d={`M${i * 30 - 10} 196 L${i * 30 + 6} ${150 + ((i * 17) % 22)} L${i * 30 + 22} 196 Z`} fill={zone === "meadow" ? "#4f8a3a" : "#2f4a2a"} />
      ))}
      <rect y="190" width="640" height="170" fill={ground} />
      {Array.from({ length: 40 }, (_, i) => (
        <path key={i} d={`M${(i * 53) % 640} ${210 + ((i * 37) % 140)} l4 -10 l4 10`} stroke={zone === "grove" ? "#3e6b32" : "#4f8a3a"} strokeWidth="3" fill="none" />
      ))}
    </svg>
  );
}

function Platform({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 16" className="w-full h-auto pixelated" shapeRendering="crispEdges" aria-hidden>
      <ellipse cx="32" cy="8" rx="31" ry="7.5" fill="#2b1d2e" opacity="0.35" />
      <ellipse cx="32" cy="7" rx="30" ry="6.5" fill={color} />
      <ellipse cx="32" cy="6" rx="24" ry="4" fill="#b5d67a" opacity="0.55" />
    </svg>
  );
}

export default function Encounter({ monster, heroHp, zone, onDone }: { monster: Monster; heroHp: number | null; zone: ZoneId; onDone: (r: EncounterResult) => void }) {
  const { data, update, today } = useTracker();
  const level = useHeroLevel();
  const [narrow] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  const loadout = useMemo(() => loadoutFor(data, level), [data.game?.equipped, data.heroGear, level]); // eslint-disable-line react-hooks/exhaustive-deps
  const spec = monster.spec;
  const [battle, setBattle] = useState<Battle>(() => startBattle(loadout, spec, heroHp ?? undefined));
  const [view, setView] = useState({ hero: battle.hero.hp, foe: battle.boss.hp, energy: battle.hero.energy });
  const [phase, setPhase] = useState<Phase>("intro");
  const [menu, setMenu] = useState<Menu>("main");
  const [msg, setMsg] = useState(`A wild ${monster.name} appeared!`);
  const [busy, setBusy] = useState(true);
  const [pops, setPops] = useState<Pop[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [banner, setBanner] = useState<{ id: number; text: string; color: string } | null>(null);
  const [loot, setLoot] = useState<{ id: string; isNew: boolean }[] | null>(null);
  const [flees, setFlees] = useState(0);
  const [bg, setBg] = useState("");
  const heroEl = useRef<HTMLDivElement>(null);
  const foeEl = useRef<HTMLDivElement>(null);
  const sceneEl = useRef<HTMLDivElement>(null);
  const flashEl = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const seq = useRef(0);
  const nid = () => ++seq.current;

  const equipped = Object.values(data.game?.equipped ?? {}).filter(Boolean) as string[];
  const gear = Object.keys(data.heroGear ?? {});
  const potions = BAG_ITEMS.filter((b) => b.kind === "potion" && bagCount(data.game, b.id) > 0);

  useEffect(() => {
    let url = "";
    pixelPicture(<Backdrop zone={zone} />, 640, 360).then((u) => (alive.current ? setBg((url = u)) : URL.revokeObjectURL(u)));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [zone]);

  useEffect(() => {
    alive.current = true;
    startMusic();
    sfx("charge");
    const t = setTimeout(() => {
      if (!alive.current) return;
      setPhase("battle");
      setBusy(false);
      setMsg(`A wild ${monster.name} appeared! What will you do?`);
    }, 1500);
    return () => {
      alive.current = false;
      clearTimeout(t);
      stopMusic();
      setIntensity(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- the hit feel ----
  const anim = (el: HTMLElement | null, frames: Keyframe[], ms: number, easing = "ease-out") => el?.animate(frames, { duration: ms, easing });
  const shake = (power: number) =>
    anim(sceneEl.current, [0, 1, 2, 3, 4, 5, 6].map((i) => ({ transform: i === 6 ? "translate(0,0)" : `translate(${(i % 2 ? -1 : 1) * power * (1 - i / 7)}px, ${(i % 3 - 1) * power * 0.5}px)` })), 320, "linear");
  const flash = (color: string, strength = 0.7) => anim(flashEl.current, [{ opacity: strength, background: color }, { opacity: 0, background: color }], 260);
  const lunge = (who: "hero" | "foe") =>
    anim(who === "hero" ? heroEl.current : foeEl.current, [
      { transform: "translate(0,0)" },
      { transform: who === "hero" ? "translate(-14px, 8px)" : "translate(14px, -6px)", offset: 0.25 },
      { transform: who === "hero" ? "translate(70px, -46px) scale(1.06)" : "translate(-80px, 44px) scale(1.08)", offset: 0.55 },
      { transform: "translate(0,0)" },
    ], 360, "cubic-bezier(.2,.8,.3,1)");
  const knock = (who: "hero" | "foe", big: boolean) => {
    const el = who === "hero" ? heroEl.current : foeEl.current;
    const d = who === "hero" ? -1 : 1;
    const k = big ? 40 : 24;
    anim(el, [
      { transform: "translate(0,0)", filter: "brightness(1)" },
      { transform: `translate(${d * k}px, ${-d * k * 0.3}px)`, filter: "brightness(0) invert(1)", offset: 0.12 },
      { transform: `translate(${d * k * 0.7}px, 0)`, filter: "brightness(1)", offset: 0.3 },
      { transform: `translate(${d * k * 0.5}px, 0)`, filter: "brightness(0) invert(1)", offset: 0.45 },
      { transform: `translate(${-d * 4}px, 0)`, filter: "brightness(1)", offset: 0.75 },
      { transform: "translate(0,0)", filter: "brightness(1)" },
    ], big ? 520 : 420);
  };
  const pop = (side: Pop["side"], text: string, color: string, big?: boolean) => {
    const p = { id: nid(), side, text, color, big };
    setPops((x) => [...x.slice(-6), p]);
    setTimeout(() => alive.current && setPops((x) => x.filter((y) => y.id !== p.id)), 1100);
  };
  const spark = (side: Spark["side"], fx: Fx, crit?: boolean) => {
    const s = { id: nid(), side, color: FX_COLOR[fx], fx, crit };
    setSparks((x) => [...x.slice(-4), s]);
    setTimeout(() => alive.current && setSparks((x) => x.filter((y) => y.id !== s.id)), 600);
  };
  const showBanner = (text: string, color: string) => {
    const b = { id: nid(), text, color };
    setBanner(b);
    setTimeout(() => alive.current && setBanner((x) => (x?.id === b.id ? null : x)), 900);
  };

  const play = useCallback(
    async (events: BattleEvent[], next: Battle) => {
      let hero = view.hero;
      let foe = view.foe;
      let energy = view.energy;
      const name = monster.name;
      for (const e of events) {
        if (!alive.current) return;
        switch (e.kind) {
          case "act":
            if (e.who === "hero") {
              setMsg(`You used ${e.name}!`);
              if (e.fx === "heal" || e.fx === "buff" || e.fx === "shield" || e.fx === "holy") {
                anim(heroEl.current, [{ transform: "translateY(0)" }, { transform: "translateY(-18px) scale(1.05)" }, { transform: "translateY(0)" }], 420);
                sfx(FX_SOUND[e.fx]);
                await wait(380);
              } else {
                if (e.special) {
                  showBanner(e.name, FX_COLOR[e.fx]);
                  sfx("charge");
                  await wait(450);
                }
                lunge("hero");
                sfx("slash");
                await wait(200);
              }
            } else if (e.who === "boss") {
              setMsg(`${name} used ${e.name}!`);
              if (e.special) {
                showBanner(e.name, "#c0502f");
                sfx("charge");
                await wait(500);
              }
              lunge("foe");
              await wait(220);
            } else {
              setMsg(e.who === "kit" ? "Kit cheers you on!" : `${e.name} joins the attack!`);
              sfx(e.who === "kit" ? "heal" : "click");
              await wait(280);
            }
            break;
          case "damage": {
            const big = e.crit || e.amount >= (e.target === "boss" ? next.boss.maxHp : next.hero.maxHp) * 0.18;
            // hit stop: freeze a beat so the impact reads
            await wait(e.crit ? 110 : 60);
            if (e.target === "boss") {
              foe = Math.max(0, foe - e.amount);
              knock("foe", big);
              spark("foe", e.fx, e.crit);
              pop("foe", `${e.amount}`, e.crit ? "#f4c95d" : "#fffaf0", big);
              sfx(e.crit ? "crit" : e.fx === "heal" ? "hit" : FX_SOUND[e.fx]);
              if (e.crit) {
                flash("#fffaf0", 0.8);
                showBanner("CRITICAL HIT!", "#e8a33d");
                setMsg("A critical hit!");
              }
              shake(e.crit ? 16 : big ? 10 : 5);
            } else {
              hero = Math.max(0, hero - e.amount);
              knock("hero", big);
              spark("hero", e.fx, e.crit);
              pop("hero", e.amount ? `${e.amount}` : "BLOCKED", e.crit ? "#e8954a" : "#f5cfc4", big);
              sfx(e.amount ? "hurt" : "guard");
              flash("#c0502f", big ? 0.45 : 0.25);
              shake(big ? 14 : 6);
              if (e.blocked && e.amount) pop("hero", "GUARDED", "#7aa3cc");
            }
            setView({ hero, foe, energy });
            await wait(e.crit ? 560 : 430);
            break;
          }
          case "heal":
            if (e.target === "hero") hero = Math.min(next.hero.maxHp, hero + e.amount);
            else foe = Math.min(next.boss.maxHp, foe + e.amount);
            setView({ hero, foe, energy });
            pop(e.target === "hero" ? "hero" : "foe", `+${e.amount}`, "#8cc05a");
            spark(e.target === "hero" ? "hero" : "foe", "heal");
            if (e.target === "boss") setMsg(`${name} healed ${e.amount} HP.`);
            sfx("heal");
            await wait(420);
            break;
          case "shield":
            pop("hero", `SHIELD ${e.amount}`, "#7aa3cc");
            sfx("guard");
            await wait(320);
            break;
          case "dodge":
            anim(heroEl.current, [{ transform: "translateX(0)", opacity: 1 }, { transform: "translateX(-60px)", opacity: 0.4, offset: 0.4 }, { transform: "translateX(0)", opacity: 1 }], 420);
            pop("hero", "MISS!", "#b4d0e6", true);
            setMsg(`${name}'s attack missed!`);
            sfx("dodge");
            await wait(420);
            break;
          case "status":
            pop(e.target === "boss" ? "foe" : "hero", e.text.toUpperCase(), e.target === "boss" ? "#f4c95d" : "#a996d6");
            setMsg(e.target === "boss" ? `${name} is ${e.text.toLowerCase()}!` : `You: ${e.text}.`);
            await wait(380);
            break;
          case "energy":
            energy = Math.max(0, Math.min(MAX_ENERGY, energy + e.amount));
            setView({ hero, foe, energy });
            pop("hero", `${e.amount > 0 ? "+" : ""}${e.amount} EN`, "#f4c95d");
            await wait(300);
            break;
          case "text":
            setMsg(e.text);
            await wait(520);
            break;
          case "enrage":
            setMsg(`${name} is furious! Its attacks hit harder.`);
            showBanner("ENRAGED!", "#c0502f");
            flash("#c0502f", 0.5);
            sfx("enrage");
            setIntensity(true);
            await wait(800);
            break;
          case "end":
            stopMusic();
            if (e.result === "win") {
              anim(foeEl.current, [{ transform: "translateY(0)", opacity: 1, clipPath: "inset(0 0 0 0)" }, { transform: "translateY(70px)", opacity: 0, clipPath: "inset(0 0 100% 0)" }], 700, "ease-in");
              sfx("ko");
              setMsg(`The wild ${name} fainted!`);
              await wait(800);
              if (foeEl.current) foeEl.current.style.opacity = "0";
              sfx("victory");
            } else {
              anim(heroEl.current, [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(60px)", opacity: 0 }], 700, "ease-in");
              sfx("defeat");
              setMsg("You blacked out!");
              await wait(800);
              if (heroEl.current) heroEl.current.style.opacity = "0";
            }
            break;
        }
      }
      if (!alive.current) return;
      setBattle(next);
      setView({ hero: next.hero.hp, foe: next.boss.hp, energy: next.hero.energy });
      if (next.over === "win") {
        const drops = rollDrops(monster);
        // What's new gear is worked out on a copy first (the saved change runs later).
        const got = addLoot(structuredClone(data), drops, today);
        update((d) => {
          addLoot(d, drops, today);
          d.game!.wildKills = { ...(d.game!.wildKills ?? {}), [monster.id]: (d.game!.wildKills?.[monster.id] ?? 0) + 1 };
        });
        setLoot(got);
        if (drops.length) sfx("loot");
        setPhase("won");
      } else if (next.over === "lose") setPhase("lost");
      else {
        setMenu("main");
        const intent = next.boss.intent;
        setMsg(intent === "unleash" ? `${name} is about to unleash ${moveName(spec, "unleash")}! Guard now!` : `What will you do?`);
      }
      setBusy(false);
    },
    [view, monster, spec, update, today, data], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const useSkill = (id: SkillId) => {
    if (busy || phase !== "battle" || skillBlocked(battle, id)) return;
    sfx("click");
    setBusy(true);
    const { battle: next, events } = playRound(battle, id);
    void play(events, next);
  };

  const drink = (id: string) => {
    const it = bagItemById(id);
    if (busy || phase !== "battle" || !it?.use || bagCount(data.game, id) <= 0) return;
    sfx("click");
    setBusy(true);
    update((d) => void takeOne(d, id));
    const { battle: next, events } = useItemRound(battle, it.use);
    void play(events, next);
  };

  const run = () => {
    if (busy || phase !== "battle") return;
    sfx("click");
    setBusy(true);
    if (Math.random() < fleeChance(battle, flees)) {
      sfx("dodge");
      setMsg("Got away safely!");
      anim(heroEl.current, [{ transform: "translateX(0)" }, { transform: "translateX(-140%)" }], 500, "ease-in");
      setPhase("fled");
      setTimeout(() => alive.current && onDone({ outcome: "fled", hp: battle.hero.hp, loot: [] }), 700);
      return;
    }
    setFlees((n) => n + 1);
    const { battle: next, events } = failedFleeRound(battle);
    void play(events, next);
  };

  // Keyboard: 1-9 pick skills in FIGHT, Escape goes back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setMenu("main");
      const n = Number(e.key);
      if (menu === "fight" && n >= 1 && n <= battle.loadout.skills.length) useSkill(battle.loadout.skills[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const b = battle;
  const intent = BOSS_MOVES[b.boss.intent];
  const danger = intent.id === "unleash";
  const playerName = data.settings.playerName || "You";

  return (
    <div className="fixed inset-0 z-[80] bg-[#1a1218] select-none overflow-hidden flex flex-col" role="dialog" aria-modal="true" aria-label={`Wild battle: ${monster.name}`}>
      {/* the field */}
      <div ref={sceneEl} className="relative flex-1 min-h-0 overflow-hidden">
        {bg && <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover pixelated" draggable={false} />}
        {/* foe */}
        <div className="absolute right-[2%] sm:right-[10%] top-[4%] sm:top-[12%] w-[38vw] sm:w-[44vw] max-w-[340px]">
          <div className="absolute inset-x-[-6%] bottom-[-10%]">
            <Platform color={SKY[zone][3] === "#8cc05a" ? "#6aa645" : "#3e6b32"} />
          </div>
          <div ref={foeEl} className={`relative enc-in-foe ${phase === "battle" ? "enc-breathe" : ""}`} style={{ transformOrigin: "50% 100%" }}>
            <MonsterPortrait id={monster.id} size={340} className={`w-full h-auto ${danger && phase === "battle" ? "enc-charging" : ""}`} style={{ filter: "drop-shadow(4px 4px 0 rgba(43,29,46,0.4))" }} />
          </div>
          <Sparks list={sparks.filter((s) => s.side === "foe")} />
          <Pops list={pops.filter((p) => p.side === "foe")} />
        </div>
        {/* hero */}
        <div className="absolute left-[3%] sm:left-[8%] bottom-[2%] w-[30vw] sm:w-[40vw] max-w-[300px]">
          <div className="absolute inset-x-[-10%] bottom-[-4%]">
            <Platform color="#4f8a3a" />
          </div>
          <div ref={heroEl} className="relative enc-in-hero" style={{ transformOrigin: "50% 100%" }}>
            <PixelHero look={data.game?.look} items={equipped} gear={gear} size={narrow ? 120 : 300} className="max-w-full h-auto" lively={phase === "battle"} />
          </div>
          <Sparks list={sparks.filter((s) => s.side === "hero")} />
          <Pops list={pops.filter((p) => p.side === "hero")} />
        </div>

        {/* foe's box */}
        <div className="absolute left-2 sm:left-6 top-3 sm:top-6 w-[min(54vw,430px)] max-sm:w-[54vw] enc-box p-2 sm:p-3 enc-in-box z-10">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`font-display leading-none ${monster.name.length > 12 ? "text-xl sm:text-[1.6rem]" : "text-2xl sm:text-3xl"}`}>{monster.name}</span>
            <span className="font-display text-xl sm:text-2xl leading-none whitespace-nowrap">Lv{monster.lv}</span>
          </div>
          <HpBar value={view.foe} max={b.boss.maxHp} />
          <div className="flex flex-wrap gap-1 mt-1.5 empty:hidden sm:empty:flex sm:min-h-[1.5rem]">
            {b.boss.enraged && <Chip color="#c0502f">Enraged</Chip>}
            {b.boss.defBuff && <Chip color="#4f78a8">Defense up</Chip>}
            {b.boss.statuses.map((s) => (
              <Chip key={s.kind} color="#cf8a1f">
                {STATUS_LABEL[s.kind]}
              </Chip>
            ))}
          </div>
          {phase === "battle" && (
            <div className={`mt-1 text-base font-extrabold leading-tight ${danger ? "text-[#c0502f] animate-pulse" : "text-[#5a5458]"}`}>
              Next: {moveName(spec, intent.id)}
              {danger && " · GUARD!"}
            </div>
          )}
        </div>
        {/* hero's box */}
        <div className="absolute right-2 sm:right-6 bottom-3 sm:bottom-6 w-[min(56vw,400px)] enc-box p-2 sm:p-3 enc-in-box">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display text-2xl sm:text-3xl leading-none truncate">{playerName}</span>
            <span className="font-display text-xl sm:text-2xl leading-none whitespace-nowrap">Lv{level}</span>
          </div>
          <HpBar value={view.hero} max={b.hero.maxHp} />
          <div className="flex justify-end font-display text-xl sm:text-2xl leading-none mt-1 tabular-nums">
            {view.hero}/{b.hero.maxHp}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-display text-base w-8 text-[#9a6a1c]">EN</span>
            <div className="flex-1 h-3 bg-[#3d3a40] border-2 border-[#2b1d2e]">
              <div className="h-full bg-[#f4c95d] transition-[width] duration-300" style={{ width: `${(view.energy / MAX_ENERGY) * 100}%` }} />
            </div>
            <span className="font-display text-base tabular-nums w-10 text-right">{view.energy}</span>
          </div>
          {b.hero.statuses.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {b.hero.statuses.map((s) => (
                <Chip key={s.kind} color="#5a4290">
                  {STATUS_LABEL[s.kind]}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {banner && (
          <div key={banner.id} className="enc-banner absolute inset-x-0 top-[40%] py-2 sm:py-3 text-center border-y-4 border-[#2b1d2e] pointer-events-none z-20" style={{ background: banner.color }}>
            <span className="font-display text-4xl sm:text-6xl tracking-wide text-[#fffaf0]" style={{ WebkitTextStroke: "2px #2b1d2e", textShadow: "4px 4px 0 #2b1d2e" }}>
              {banner.text}
            </span>
          </div>
        )}
        <div ref={flashEl} className="absolute inset-0 pointer-events-none z-30" style={{ opacity: 0 }} />
        {phase === "intro" && <div className="enc-wipe absolute inset-0 z-40 pointer-events-none" />}
      </div>

      {/* text box and commands */}
      <div className="shrink-0 bg-[#2b1d2e] p-2 sm:p-3 flex flex-col sm:flex-row gap-2 sm:gap-3 min-h-[190px]">
        <div className="enc-text flex-1 px-4 py-3 text-2xl sm:text-3xl font-bold leading-snug min-h-[96px]">
          <span key={msg} className="enc-type">{msg}</span>
        </div>
        <div className="sm:w-[440px] shrink-0">
          {phase === "won" && loot ? (
            <LootPanel loot={loot} onDone={() => onDone({ outcome: "win", hp: battle.hero.hp, loot: loot.map((l) => l.id) })} />
          ) : phase === "lost" ? (
            <div className="enc-menu p-3 h-full flex flex-col justify-center gap-2">
              <p className="text-lg font-bold">You wake up by the campfire with full HP. Nothing was lost.</p>
              <button type="button" className="enc-cmd" onClick={() => onDone({ outcome: "lose", hp: 0, loot: [] })}>
                Wake up
              </button>
            </div>
          ) : menu === "fight" ? (
            <div className="enc-menu p-2 grid grid-cols-2 gap-2 max-h-[46vh] overflow-y-auto">
              {b.loadout.skills.map((id, i) => {
                const s = SKILLS[id];
                const blocked = skillBlocked(b, id);
                return (
                  <button key={id} type="button" disabled={busy || Boolean(blocked)} onClick={() => useSkill(id)} className="enc-skill text-left" style={{ ["--fx" as string]: FX_COLOR[s.fx] }} title={s.desc}>
                    <span className="block font-display text-xl leading-tight truncate">
                      <span className="max-sm:hidden opacity-60 mr-1">{i + 1}</span>
                      {s.name}
                    </span>
                    <span className="flex justify-between text-sm font-extrabold">
                      <span>{FX_LABEL[s.fx]}</span>
                      <span>{blocked && b.hero.cooldowns[id] ? `Wait ${b.hero.cooldowns[id]}` : s.cost ? `EN ${s.cost}` : "Free"}</span>
                    </span>
                  </button>
                );
              })}
              <button type="button" className="enc-cmd col-span-2 !text-xl !py-1.5" onClick={() => setMenu("main")}>
                Back
              </button>
            </div>
          ) : menu === "bag" ? (
            <div className="enc-menu p-2 flex flex-col gap-2 max-h-[46vh] overflow-y-auto">
              {potions.length ? (
                potions.map((p) => (
                  <button key={p.id} type="button" disabled={busy} onClick={() => drink(p.id)} className="enc-skill flex items-center gap-3 text-left" style={{ ["--fx" as string]: "#8cc05a" }}>
                    <ItemIcon id={p.id} size={40} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-display text-xl leading-tight">{p.name}</span>
                      <span className="block text-sm font-bold leading-tight">{p.about}</span>
                    </span>
                    <span className="font-display text-2xl">x{bagCount(data.game, p.id)}</span>
                  </button>
                ))
              ) : (
                <p className="text-lg font-bold p-2">No potions yet. Monsters drop herbs and potions, and the camp merchant can tell you more.</p>
              )}
              <button type="button" className="enc-cmd !text-xl !py-1.5" onClick={() => setMenu("main")}>
                Back
              </button>
            </div>
          ) : (
            <div className="enc-menu p-2 grid grid-cols-2 gap-2 h-full">
              <button type="button" className="enc-cmd enc-cmd-fight" disabled={busy || phase !== "battle"} onClick={() => (sfx("click"), setMenu("fight"))}>
                FIGHT
              </button>
              <button type="button" className="enc-cmd enc-cmd-bag" disabled={busy || phase !== "battle"} onClick={() => (sfx("click"), setMenu("bag"))}>
                BAG
              </button>
              <button type="button" className="enc-cmd enc-cmd-guard" disabled={busy || phase !== "battle"} onClick={() => useSkill("guard")}>
                GUARD
              </button>
              <button type="button" className="enc-cmd enc-cmd-run" disabled={busy || phase !== "battle"} onClick={run}>
                RUN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HpBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const color = pct > 0.5 ? "#6aa645" : pct > 0.2 ? "#e8a33d" : "#c0502f";
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="font-display text-base px-1.5 bg-[#2b1d2e] text-[#f4c95d] leading-tight">HP</span>
      <div className="relative flex-1 h-4 bg-[#3d3a40] border-2 border-[#2b1d2e]">
        {/* the trail drains a moment after the hit, so you see how much it took */}
        <div className="absolute inset-y-0 left-0 bg-[#e8954a] transition-[width] duration-700 delay-300 ease-out" style={{ width: `${pct * 100}%` }} />
        <div className="absolute inset-y-0 left-0 transition-[width,background-color] duration-300 ease-out" style={{ width: `${pct * 100}%`, background: color }} />
        <div className="absolute inset-x-0 top-0 h-1 bg-white/25" />
      </div>
    </div>
  );
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="text-sm font-extrabold uppercase px-1.5 py-0.5 border-2 border-[#2b1d2e] text-[#fffaf0]" style={{ background: color }}>
      {children}
    </span>
  );
}

function Pops({ list }: { list: Pop[] }) {
  return (
    <>
      {list.map((p, i) => (
        <span
          key={p.id}
          className={`enc-pop absolute left-1/2 top-[20%] font-display pointer-events-none z-20 whitespace-nowrap ${p.big ? "text-6xl sm:text-7xl" : "text-4xl sm:text-5xl"}`}
          style={{ color: p.color, WebkitTextStroke: "2px #2b1d2e", textShadow: "4px 4px 0 #2b1d2e", ["--dx" as string]: `${((p.id * 37) % 60) - 30 + i * 4}px` }}
        >
          {p.text}
        </span>
      ))}
    </>
  );
}

function Sparks({ list }: { list: Spark[] }) {
  return (
    <>
      {list.map((s) => (
        <svg key={s.id} viewBox="-16 -16 32 32" className={`enc-spark absolute left-1/2 top-1/2 pointer-events-none z-10 ${s.crit ? "w-[85%]" : "w-[60%]"}`} shapeRendering="crispEdges" aria-hidden>
          {s.fx === "slash" ? (
            <g>
              <path d="M-14 10 L12 -12 L14 -10 L-12 12 Z" fill={s.color} stroke="#2b1d2e" strokeWidth="1" />
              <path d="M-10 14 L14 -6 L15 -4 L-8 15 Z" fill="#fffaf0" stroke="#2b1d2e" strokeWidth="1" />
            </g>
          ) : s.fx === "heal" ? (
            <g fill={s.color} stroke="#2b1d2e" strokeWidth="0.8">
              {[[-8, 4], [6, -2], [-2, -10], [10, 8], [-12, -6]].map(([x, y], i) => (
                <path key={i} d={`M${x - 1} ${y - 3} h2 v2 h2 v2 h-2 v2 h-2 v-2 h-2 v-2 h2 z`} />
              ))}
            </g>
          ) : (
            <g>
              <path d="M0 -15 L3 -5 L13 -9 L6 -1 L15 3 L5 5 L8 14 L0 7 L-8 14 L-5 5 L-15 3 L-6 -1 L-13 -9 L-3 -5 Z" fill={s.color} stroke="#2b1d2e" strokeWidth="1.2" />
              <path d="M0 -7 L2 -2 L7 -1 L2 2 L0 7 L-2 2 L-7 -1 L-2 -2 Z" fill="#fffaf0" />
            </g>
          )}
        </svg>
      ))}
    </>
  );
}

function LootPanel({ loot, onDone }: { loot: { id: string; isNew: boolean }[]; onDone: () => void }) {
  return (
    <div className="enc-menu p-3 h-full flex flex-col gap-2">
      <div className="font-display text-2xl leading-none">{loot.length ? "Loot!" : "No drops this time"}</div>
      <div className="flex flex-wrap gap-2">
        {loot.map((l, i) => {
          const it = anyItem(l.id);
          if (!it) return null;
          return (
            <div key={i} className="enc-loot relative flex items-center gap-2 bg-[#fbf1dc] border-[3px] border-[#2b1d2e] px-2 py-1" style={{ animationDelay: `${i * 160}ms`, boxShadow: `inset 0 0 0 2px ${rarityColor(it.rarity)}` }}>
              <ItemIcon id={l.id} size={36} />
              <span className="font-extrabold text-lg leading-tight">{it.name}</span>
              {l.isNew && <span className="absolute -top-3 -right-2 bg-[#c0502f] text-[#fffaf0] text-xs font-extrabold px-1.5 border-2 border-[#2b1d2e]">NEW GEAR</span>}
            </div>
          );
        })}
      </div>
      <button type="button" className="enc-cmd mt-auto" onClick={onDone}>
        Continue
      </button>
    </div>
  );
}
