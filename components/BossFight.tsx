"use client";

import { PixelArena } from "./pixelScenes";
import { FoePortrait } from "./city/trainingArt";
import { practiceItems, practiceLoadout, type PracticeFoe } from "@/lib/training";
import { themeById, themeVars } from "@/lib/appearance";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "./avatars";
import { bossCoins, finishBoss, type FightRank, type RewardEvent } from "@/lib/loot";
import { rematchBoss, recordBattleLoss } from "@/lib/fallen";
import { RARITY } from "@/lib/items";
import { monthOf, summarize } from "@/lib/finance";
import { levelFor } from "@/lib/game";
import {
  BOSS_MOVES,
  MAX_ENERGY,
  PASSIVE_DESC,
  SKILLS,
  STATUS_LABEL,
  battleRank,
  bossTier,
  loadoutFor,
  makeBoss,
  moveName,
  playRound,
  skillBlocked,
  startBattle,
  type Battle,
  type BattleEvent,
  type BossSpec,
  type Fx,
  type SkillId,
} from "@/lib/battle";
import { setIntensity, sfx, startMusic, stopMusic, type Sfx } from "@/lib/sound";
import { useTracker } from "./App";
import { Hero, Kit } from "./characters";
import { Bar, Btn, money } from "./ui";
import { Icon } from "./icons";

// Turn-based boss battle. A deal was fully paid in real life; now the boss fights back.
// Pick a skill each round; the boss shows what it will do next, so you can guard against
// its big attacks. Gear you wear sets your stats and adds skills (lib/battle.ts).

const FX_COLOR: Record<Fx, string> = {
  slash: "#e8f6ff",
  impact: "#ffd23f",
  fire: "#ff6b1f",
  thunder: "#4fd2ff",
  holy: "#fff3b0",
  dark: "#a14cff",
  heal: "#6ee77a",
  shield: "#4fd2ff",
  cosmic: "#ff5fae",
  laser: "#ff2a4f",
  buff: "#ffd23f",
};
const FX_SOUND: Record<Fx, Sfx> = { slash: "slash", impact: "hit", fire: "fire", thunder: "thunder", holy: "holy", dark: "dark", heal: "heal", shield: "guard", cosmic: "cosmic", laser: "laser", buff: "buff" };

type Phase = "intro" | "battle" | "won" | "lost" | "done";
type Float = { id: number; side: "hero" | "boss"; text: string; color: string; big?: boolean };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The current level, used for stats. */
/** The arena is always night, so the fight uses the dark Dawnterra palette whatever the app's theme. */
const ARENA_THEME = {
  ...themeVars(themeById("dusk")),
  "--pix-shadow": "rgb(0 0 0 / 0.65)",
  "--pix-hi": "rgb(255 255 255 / 0.07)",
  "--pix-lo": "rgb(0 0 0 / 0.3)",
  "--pix-sheen": "rgb(255 255 255 / 0.06)",
  "--pix-ghost": "var(--color-card-2)",
  "--pix-ghost-ink": "var(--color-ink)",
} as React.CSSProperties;

export function useHeroLevel() {
  const { data, today } = useTracker();
  const s = summarize(data, monthOf(today));
  return levelFor(s.moneyMade, s.goal).level;
}

export default function BossFight({ dealId, practice: practiceProp, rematch, foe, weapon = "", onClose }: { dealId?: string; practice?: boolean; rematch?: boolean; foe?: PracticeFoe; weapon?: string; onClose: () => void }) {
  // A Training Hall monster is always a practice fight.
  const practice = practiceProp || Boolean(foe);
  const { data, update, today } = useTracker();
  const deal = dealId ? data.deals.find((d) => d.id === dealId) : undefined;
  const level = useHeroLevel();
  const loadout = useMemo(() => (foe ? practiceLoadout(data, level, weapon) : loadoutFor(data, level)), [data, level, foe, weapon]);
  const spec: BossSpec = useMemo(
    () => (foe ? foe.spec : deal ? makeBoss(deal.name, deal.id, bossTier(deal.value, data.settings.monthlyGoal)) : makeBoss("Training Dummy", "practice", 3)),
    [deal, data.settings.monthlyGoal, foe],
  );

  const [phase, setPhase] = useState<Phase>("intro");
  const [battle, setBattle] = useState<Battle>(() => startBattle(loadout, spec));
  const [view, setView] = useState({ heroHp: battle.hero.hp, bossHp: battle.boss.hp });
  const [busy, setBusy] = useState(false);
  const [anim, setAnim] = useState<{ hero?: string; boss?: string; n: number }>({ n: 0 });
  const [floats, setFloats] = useState<Float[]>([]);
  const [cutin, setCutin] = useState<{ id: number; name: string; color: string; boss?: boolean } | null>(null);
  const [burst, setBurst] = useState<{ id: number; side: "hero" | "boss"; color: string } | null>(null);
  const [flash, setFlash] = useState<{ id: number; color: string } | null>(null);
  const [shake, setShake] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [rank, setRank] = useState<FightRank>("C");
  const [reward, setReward] = useState<RewardEvent | null>(null);
  const [fell, setFell] = useState(false);
  const alive = useRef(true);
  const seq = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopMusic();
      setIntensity(false);
    };
  }, []);

  const id = () => ++seq.current;
  const say = (line: string) => setLog((l) => [line, ...l].slice(0, 6));
  const float = (side: "hero" | "boss", text: string, color: string, big?: boolean) => {
    const f = { id: id(), side, text, color, big };
    setFloats((x) => [...x.slice(-5), f]);
  };

  const begin = () => {
    sfx("click");
    startMusic();
    setPhase("battle");
    say(`${spec.name} appears! Next it will use ${moveName(spec, battle.boss.intent)}.`);
  };

  const restart = () => {
    const b = startBattle(loadout, spec);
    setBattle(b);
    setView({ heroHp: b.hero.hp, bossHp: b.boss.hp });
    setLog([]);
    setFloats([]);
    setIntensity(false);
    startMusic();
    setPhase("battle");
  };

  /** Plays a round's events one by one so every hit lands on screen. */
  const play = useCallback(
    async (events: BattleEvent[], next: Battle) => {
      let heroHp = view.heroHp;
      let bossHp = view.bossHp;
      for (const e of events) {
        if (!alive.current) return;
        switch (e.kind) {
          case "act": {
            const color = FX_COLOR[e.fx];
            if (e.who === "hero") {
              say(`You use ${e.name}!`);
              setAnim((a) => ({ hero: e.fx === "heal" || e.fx === "buff" || e.fx === "shield" || e.fx === "holy" ? "hero-cast" : "hero-lunge", n: a.n + 1 }));
              if (e.special) {
                setCutin({ id: id(), name: e.name, color });
                sfx("buff");
                await wait(650);
              }
              sfx(FX_SOUND[e.fx]);
              await wait(260);
            } else if (e.who === "boss") {
              say(`${spec.name} uses ${e.name}!`);
              setAnim((a) => ({ boss: "boss-lunge", n: a.n + 1 }));
              if (e.special) {
                setCutin({ id: id(), name: e.name, color: "#ff2a4f", boss: true });
                sfx("charge");
                await wait(650);
              }
              await wait(260);
            } else {
              say(e.who === "kit" ? "Kit cheers you on!" : `${e.name} attacks!`);
              sfx(e.who === "kit" ? "heal" : "click");
              await wait(260);
            }
            break;
          }
          case "damage": {
            if (e.target === "boss") {
              bossHp = Math.max(0, bossHp - e.amount);
              setAnim((a) => ({ boss: "boss-hit", n: a.n + 1 }));
              setBurst({ id: id(), side: "boss", color: FX_COLOR[e.fx] });
              float("boss", e.crit ? `CRIT ${e.amount}` : `${e.amount}`, e.crit ? "#ffd23f" : "#ffffff", e.crit);
              sfx(e.crit ? "crit" : FX_SOUND[e.fx] === "heal" ? "hit" : FX_SOUND[e.fx]);
              if (e.crit) {
                setShake((s) => s + 1);
                setFlash({ id: id(), color: FX_COLOR[e.fx] });
              }
            } else {
              heroHp = Math.max(0, heroHp - e.amount);
              setAnim((a) => ({ hero: "hero-hurt", n: a.n + 1 }));
              setBurst({ id: id(), side: "hero", color: FX_COLOR[e.fx] });
              float("hero", e.amount ? `${e.blocked ? "BLOCK " : ""}${e.amount}` : "BLOCKED", e.crit ? "#ff2a4f" : "#ff8a9a", e.crit);
              sfx(e.amount ? "hurt" : "guard");
              if (e.amount > next.hero.maxHp * 0.2) setShake((s) => s + 1);
            }
            setView({ heroHp, bossHp });
            await wait(e.crit ? 520 : 380);
            break;
          }
          case "heal":
            if (e.target === "hero") heroHp = Math.min(next.hero.maxHp, heroHp + e.amount);
            else bossHp = Math.min(next.boss.maxHp, bossHp + e.amount);
            setView({ heroHp, bossHp });
            float(e.target, `+${e.amount}`, "#6ee77a");
            if (e.target === "boss") say(`${spec.name} heals ${e.amount}.`);
            sfx("heal");
            await wait(360);
            break;
          case "shield":
            float("hero", `SHIELD ${e.amount}`, "#4fd2ff");
            sfx("guard");
            await wait(320);
            break;
          case "dodge":
            setAnim((a) => ({ hero: "dodge-blur", n: a.n + 1 }));
            float("hero", "DODGE!", "#4fd2ff", true);
            sfx("dodge");
            await wait(380);
            break;
          case "status":
            float(e.target, e.text.toUpperCase(), e.target === "boss" ? "#ffb703" : "#c77dff");
            say(`${e.target === "boss" ? spec.name : "You"}: ${e.text}.`);
            await wait(300);
            break;
          case "energy":
            float("hero", `${e.amount} EN`, "#ffd23f");
            await wait(280);
            break;
          case "text":
            say(e.text);
            await wait(300);
            break;
          case "enrage":
            say(`${spec.name} is ENRAGED! Its attacks hit 30% harder.`);
            setCutin({ id: id(), name: "ENRAGED!", color: "#ff2a4f", boss: true });
            setFlash({ id: id(), color: "#ff2a4f" });
            sfx("enrage");
            setIntensity(true);
            await wait(800);
            break;
          case "end":
            stopMusic();
            if (e.result === "win") {
              setAnim((a) => ({ boss: "boss-ko", n: a.n + 1 }));
              sfx("ko");
              await wait(700);
              sfx("victory");
            } else {
              sfx("defeat");
            }
            break;
        }
      }
      if (!alive.current) return;
      setBattle(next);
      setView({ heroHp: next.hero.hp, bossHp: next.boss.hp });
      if (next.over === "win") {
        setRank(battleRank(next));
        setPhase("won");
      } else if (next.over === "lose") {
        setPhase("lost");
      } else {
        say(`Round ${next.round}. Next ${spec.name} will use ${moveName(spec, next.boss.intent)}.`);
      }
      setBusy(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, spec.name],
  );

  const act = useCallback(
    (skill: SkillId) => {
      if (busy || phase !== "battle" || skillBlocked(battle, skill)) return;
      setBusy(true);
      const { battle: next, events } = playRound(battle, skill);
      void play(events, next);
    },
    [busy, phase, battle, play],
  );

  // Number keys pick skills.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (phase === "battle" && n >= 1 && n <= battle.loadout.skills.length) act(battle.loadout.skills[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, battle, act]);

  /** Pays out once (real bosses only), then shows the result. */
  const claim = (r: FightRank, gaveUp = false) => {
    if (reward || practice || !dealId) return setPhase("done");
    // Giving up a rematch changes nothing: it stays in the Fallen.
    if (rematch && gaveUp) return onClose();
    const draft = structuredClone(data);
    const ev = rematch ? rematchBoss(draft, dealId, r, today) : finishBoss(draft, dealId, r, today);
    if (gaveUp) recordBattleLoss(draft, dealId, today, battle.round);
    setFell(gaveUp);
    update((d) => void (d.game = draft.game));
    setReward(ev);
    setRank(r);
    if (ev.item) sfx("loot");
    else sfx("coin");
    setPhase("done");
  };

  const skip = () => {
    stopMusic();
    claim("C");
  };

  if (dealId && !deal) return null;
  const b = battle;
  const intent = BOSS_MOVES[b.boss.intent];
  const danger = intent.id === "unleash" || intent.id === "charge";
  const heroPct = view.heroHp / b.hero.maxHp;
  const bossPct = view.bossHp / b.boss.maxHp;

  const screen = (
    <div
      className="fixed inset-0 z-[70] bg-[#1a1218] text-ink overflow-y-auto overflow-x-hidden"
      style={ARENA_THEME}
      role="dialog"
      aria-modal="true"
      aria-label={`Boss battle: ${spec.name}`}
    >
      {/* Torch-lit ruins at night, dimmed so every number and button stays easy to read. */}
      <PixelArena className="fixed inset-0 w-full h-full pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none bg-[#1a1218]/45" />
      {flash && <div key={flash.id} className="fx-flash fixed inset-0 pointer-events-none z-10" style={{ background: flash.color, opacity: 0 }} />}
      <div key={`s${shake}`} className={`relative max-w-4xl mx-auto px-3 sm:px-4 py-4 min-h-full flex flex-col overflow-x-clip ${shake ? "shake" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="caption inline-block mb-1">{practice ? "Practice battle" : `${rematch ? "Rematch" : "Boss battle"} · tier ${spec.tier}`}</div>
            <h2 className="font-display text-3xl sm:text-5xl tracking-wide break-words leading-none">{spec.name}</h2>
            {deal && <p className="text-base sm:text-lg text-muted font-bold">{money(deal.value)} collected in real life. Now finish it!</p>}
          </div>
          <SoundToggle playing={phase === "battle"} />
        </div>

        {phase === "intro" && <Intro battle={b} spec={spec} practice={practice || rematch} onFight={begin} onSkip={skip} coins={deal ? (rematch ? [0, bossCoins(deal.value, data.settings.monthlyGoal, "S") - bossCoins(deal.value, data.settings.monthlyGoal, "C")] : [bossCoins(deal.value, data.settings.monthlyGoal, "C"), bossCoins(deal.value, data.settings.monthlyGoal, "S")]) : null} />}

        {phase !== "intro" && phase !== "done" && (
          <>
            {/* Boss bar and what it will do next */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg tracking-wide text-bad w-10">HP</span>
                <div className="flex-1">
                  <Bar pct={bossPct} tone="bad" />
                </div>
                <span className="font-display text-xl tracking-wide tabular-nums w-24 text-right">{view.bossHp}/{b.boss.maxHp}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {b.boss.enraged && <Chip color="#ff2a4f">Enraged</Chip>}
                {b.boss.defBuff && <Chip color="#4fd2ff">Defense up</Chip>}
                {b.boss.statuses.map((s) => (
                  <Chip key={s.kind} color="#ffb703">
                    {STATUS_LABEL[s.kind]} {s.turns}
                  </Chip>
                ))}
              </div>
              {phase === "battle" && (
                <div className={`border-[3px] rounded-[10px] px-3 py-2 text-base font-bold ${danger ? "border-bad bg-bad/20 animate-pulse" : "border-outline bg-card-2"}`}>
                  <span className="text-muted uppercase text-sm font-extrabold">Next boss move: </span>
                  <span className={danger ? "text-bad" : ""}>{moveName(spec, intent.id)}</span> <span className="text-muted">· {intent.desc}</span>
                  {intent.id === "unleash" && <span className="block text-gold">Guard, dodge or shield now!</span>}
                </div>
              )}
            </div>

            {/* Arena */}
            <div className="relative flex items-end justify-between mt-2 min-h-[230px] sm:min-h-[280px] select-none overflow-x-clip">
              <div className="relative">
                <div key={`h${anim.n}`} className={anim.hero ?? ""} style={{ ["--fx" as string]: "#ffd23f" }}>
                  <Hero mood={phase === "won" ? "hype" : "focus"} attacking={phase === "battle"} size={190} gear={Object.keys(data.heroGear ?? {})} items={foe ? practiceItems(data, weapon) : undefined} className="drop-shadow-[5px_5px_0_var(--color-outline)] max-sm:w-[130px] max-sm:h-auto" />
                </div>
                <div className="absolute -left-2 bottom-0 max-sm:w-[54px]">
                  <Kit size={72} talking={busy} className="max-w-full h-auto" />
                </div>
                {burst?.side === "hero" && <div key={burst.id} className="fx-burst absolute left-1/4 top-1/4 w-1/2 h-1/2 pointer-events-none" style={{ background: burst.color }} />}
                <Floats list={floats.filter((f) => f.side === "hero")} />
              </div>
              <div className="relative">
                <div key={`b${anim.n}`} className={anim.boss ?? ""}>
                  <div className={b.boss.intent === "unleash" && phase === "battle" ? "boss-charging" : b.boss.enraged ? "boss-enraged" : "bob"}>
                    {foe ? (
                      <FoePortrait id={foe.id} size={230} className="max-sm:w-[150px] max-sm:h-auto" />
                    ) : (
                      <Avatar value={deal?.avatar} seed={dealId ?? "practice"} kind="monster" size={230} title={spec.name} className="max-sm:w-[150px] max-sm:h-auto" />
                    )}
                  </div>
                </div>
                {burst?.side === "boss" && <div key={burst.id} className="fx-burst absolute left-1/4 top-1/4 w-1/2 h-1/2 pointer-events-none" style={{ background: burst.color }} />}
                <Floats list={floats.filter((f) => f.side === "boss")} />
              </div>
              {cutin && (
                <div key={cutin.id} onAnimationEnd={() => setCutin(null)} className="cutin absolute inset-x-[-8%] top-[30%] pointer-events-none z-10 py-3 border-y-[4px] border-outline text-center" style={{ background: cutin.color }}>
                  <span className="font-display text-4xl sm:text-6xl tracking-wide text-white" style={{ WebkitTextStroke: "3px #0b0a14" }}>
                    {cutin.name}
                  </span>
                </div>
              )}
              {phase === "won" && <div className="absolute inset-0 grid place-content-center font-display text-7xl sm:text-8xl text-gold sfx-in pointer-events-none" style={{ WebkitTextStroke: "3px #0b0a14" }}>K.O.!</div>}
            </div>

            {/* Hero bars */}
            <div className="hud p-3 sm:p-4 mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg tracking-wide text-good w-10">HP</span>
                <div className="flex-1">
                  <Bar pct={heroPct} tone={heroPct < 0.3 ? "bad" : "good"} />
                </div>
                <span className="font-display text-xl tracking-wide tabular-nums w-24 text-right">{view.heroHp}/{b.hero.maxHp}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg tracking-wide text-gold w-10">EN</span>
                <div className="flex-1 energy-bar">
                  <div style={{ width: `${(b.hero.energy / MAX_ENERGY) * 100}%` }} />
                </div>
                <span className="font-display text-xl tracking-wide tabular-nums w-24 text-right">{b.hero.energy}/{MAX_ENERGY}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {b.hero.shield > 0 && <Chip color="#4fd2ff">Shield {b.hero.shield}</Chip>}
                {b.hero.dodge && <Chip color="#4fd2ff">Dodge ready</Chip>}
                {b.hero.focus && <Chip color="#ffd23f">Next hit crits</Chip>}
                {b.hero.buffs.map((x, i) => (
                  <Chip key={i} color="#ffd23f">
                    {x.atk > 0 ? `ATK +${Math.round(x.atk * 100)}%` : ""} {x.def ? `DEF ${x.def > 0 ? "+" : ""}${Math.round(x.def * 100)}%` : ""} · {x.turns}
                  </Chip>
                ))}
                {b.hero.regen.length > 0 && <Chip color="#6ee77a">Regen</Chip>}
                {b.hero.statuses.map((s) => (
                  <Chip key={s.kind} color="#c77dff">
                    {STATUS_LABEL[s.kind]} {s.turns}
                  </Chip>
                ))}
                <span className="text-sm text-muted font-bold ml-auto">Round {b.round}</span>
              </div>

              {phase === "battle" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {b.loadout.skills.map((sid, i) => {
                    const s = SKILLS[sid];
                    const blocked = skillBlocked(b, sid);
                    return (
                      <button
                        key={sid}
                        type="button"
                        disabled={busy || !!blocked}
                        onClick={() => act(sid)}
                        title={s.desc}
                        className={`text-left rounded-[10px] border-[3px] border-outline px-2.5 py-2 shadow-[3px_3px_0_var(--color-outline)] transition-transform ${blocked || busy ? "opacity-45 bg-card-2" : "bg-card-2 hover:-translate-y-0.5 hover:bg-accent/25"}`}
                        style={{ borderColor: blocked ? undefined : FX_COLOR[s.fx] }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-display text-lg sm:text-xl tracking-wide leading-tight">{s.name}</span>
                          <span className="text-xs font-extrabold text-gold shrink-0">{s.cost ? `${s.cost} EN` : "FREE"}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-muted font-bold leading-snug">{blocked ?? s.desc}</div>
                        <div className="hidden sm:block text-[10px] text-muted font-extrabold">Key {i + 1}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {phase === "lost" && (
                <div className="text-center space-y-2 pt-2">
                  <div className="font-display text-4xl text-bad tracking-wide">Knocked out!</div>
                  <p className="text-base text-muted font-bold">Gear up in the shop for more HP, attack and skills, or try a new plan. Guard when it charges.</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Btn kind="hero" onClick={restart}>
                      <Icon name="swords" size={20} /> Try again
                    </Btn>
                    {practice ? (
                      <Btn onClick={onClose}>Leave</Btn>
                    ) : rematch ? (
                      <Btn onClick={() => claim("C", true)}>Leave (it stays in the Fallen)</Btn>
                    ) : (
                      <Btn onClick={() => claim("C", true)}>Give up · rank C reward</Btn>
                    )}
                  </div>
                </div>
              )}
              {phase === "won" && (
                <div className="text-center pt-2">
                  <Btn kind="primary" className="text-xl" onClick={() => claim(rank)}>
                    {practice ? "Finish" : rematch ? `Claim rematch reward (rank ${rank})` : `Claim rank ${rank} reward`}
                  </Btn>
                </div>
              )}
            </div>

            <ul className="mt-2 text-sm sm:text-base font-bold space-y-0.5" aria-live="polite">
              {log.map((l, i) => (
                <li key={`${log.length}-${i}`} className={i === 0 ? "text-ink" : "text-muted"}>
                  {l}
                </li>
              ))}
            </ul>
          </>
        )}

        {phase === "done" && (
          <div className="hud hud-gold p-5 mt-6 text-center space-y-2">
            {practice ? (
              <>
                <div className="font-display text-5xl text-gold tracking-wide">{battle.over === "win" ? `RANK ${rank}` : "Practice over"}</div>
                <p className="text-base text-muted">Practice battles don&apos;t pay coins. Real bosses appear when a deal is fully paid.</p>
              </>
            ) : (
              <>
                <div className="font-display text-5xl text-gold tracking-wide">{rematch ? `REMATCH WON · ${rank}` : `RANK ${rank}`}</div>
                {fell && <p className="text-base text-muted font-bold">This boss is in the Fallen on Boss Deals now. Gear up and come back for a rematch.</p>}
                {reward && (
                  <div className="font-display text-3xl tracking-wide">
                    +{reward.coins} <Icon name="coin" size={24} />
                  </div>
                )}
                {reward?.item ? (
                  <div className="text-xl font-extrabold">
                    <Icon name="gift" size={20} /> Loot: <span style={{ color: RARITY[reward.item.rarity].color }}>{reward.item.name}</span> <span className="text-muted">({RARITY[reward.item.rarity].label})</span>
                    <div className="flex justify-center mt-2">
                      <Hero size={120} items={[reward.item.id]} gear={[]} />
                    </div>
                  </div>
                ) : (
                  !fell && <p className="text-base text-muted">{rank === "S" ? "" : "Win faster with more HP left for a better rank and loot."}</p>
                )}
              </>
            )}
            <Btn kind="primary" className="text-xl mt-2" onClick={onClose}>
              {practice ? "Close" : "Claim"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
  // Rendered on the page body so no card's styling can clip or shift it.
  return typeof document === "undefined" ? screen : createPortal(screen, document.body);
}

function Intro({ battle: b, spec, practice, onFight, onSkip, coins }: { battle: Battle; spec: BossSpec; practice?: boolean; onFight: () => void; onSkip: () => void; coins: [number, number] | null }) {
  const st = b.loadout.stats;
  return (
    <div className="mt-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="hud p-4 space-y-2">
          <div className="caption inline-block">You</div>
          <StatRow stats={[["HP", st.hp], ["ATK", st.atk], ["DEF", st.def], ["SPD", st.spd], ["CRIT", `${st.crit}%`]]} />
          <div className="text-sm font-extrabold uppercase text-muted">Skills</div>
          <ul className="text-base space-y-0.5">
            {b.loadout.skills.map((s) => (
              <li key={s}>
                <b>{SKILLS[s].name}</b> <span className="text-muted">· {SKILLS[s].desc}</span>
              </li>
            ))}
          </ul>
          {b.loadout.passives.length > 0 && (
            <ul className="text-sm text-muted space-y-0.5">
              {b.loadout.passives.map((p) => (
                <li key={p}>{PASSIVE_DESC[p]}</li>
              ))}
            </ul>
          )}
          {b.loadout.pets.length > 0 && <p className="text-sm text-muted">{b.loadout.pets.map((p) => p.name).join(", ")} attacks every round.</p>}
        </div>
        <div className="hud p-4 space-y-2">
          <div className="caption inline-block">{spec.name}</div>
          <StatRow stats={[["HP", b.boss.maxHp], ["ATK", Math.round(spec.stats.atk)], ["DEF", Math.round(spec.stats.def)], ["SPD", spec.stats.spd], ["CRIT", `${spec.stats.crit}%`]]} />
          <div className="text-sm font-extrabold uppercase text-muted">Moves</div>
          <ul className="text-base space-y-0.5">
            {[...spec.moves, ...(spec.moves.includes("charge") ? ["unleash" as const] : [])].map((m) => (
              <li key={m}>
                <b>{moveName(spec, m)}</b> <span className="text-muted">· {BOSS_MOVES[m].desc}</span>
              </li>
            ))}
            <li className="text-muted">Below 35% HP it gets enraged and hits harder.</li>
          </ul>
        </div>
      </div>
      <div className="hud p-4 text-center space-y-3">
        <p className="text-base sm:text-lg font-bold">
          Each round, pick a skill. Faster fighters act first. Skills cost energy (EN), which refills every round. The boss shows its next move, so <span className="text-gold">guard when it charges up</span>.
        </p>
        {coins && (
          <p className="text-base text-muted">
            Win fast with plenty of HP left for rank S (epic loot or better). Coins: {coins[0]} to {coins[1]}.
          </p>
        )}
        <div className="flex justify-center gap-3 flex-wrap">
          <Btn kind="hero" className="text-2xl px-8" onClick={onFight}>
            FIGHT!
          </Btn>
          {!practice && <Btn onClick={onSkip}>Skip (rank C)</Btn>}
        </div>
      </div>
    </div>
  );
}

function StatRow({ stats }: { stats: [string, number | string][] }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {stats.map(([k, v]) => (
        <div key={k} className="bg-card-2 border-2 border-outline rounded-[8px] text-center py-1">
          <div className="text-[11px] font-extrabold text-muted">{k}</div>
          <div className="font-display text-xl tracking-wide tabular-nums">{v}</div>
        </div>
      ))}
    </div>
  );
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full border-2 text-xs sm:text-sm font-extrabold uppercase" style={{ borderColor: color, color }}>
      {children}
    </span>
  );
}

function Floats({ list }: { list: Float[] }) {
  return (
    <>
      {list.map((p) => (
        <span key={p.id} className={`dmg-float absolute left-1/2 top-4 font-display tracking-wide pointer-events-none whitespace-nowrap ${p.big ? "text-5xl" : "text-3xl"}`} style={{ color: p.color, WebkitTextStroke: "2px #0b0a14" }}>
          {p.text}
        </span>
      ))}
    </>
  );
}

/** Quick mute for music and sound while fighting; volumes live in Settings. */
function SoundToggle({ playing }: { playing: boolean }) {
  const { data, update } = useTracker();
  const snd = data.settings.sound ?? {};
  const muted = (snd.music ?? 0.5) === 0 && (snd.sfx ?? 0.7) === 0;
  const toggle = () =>
    update((d) => {
      const s = d.settings.sound ?? {};
      if (muted) d.settings.sound = { music: s.lastMusic ?? 0.5, sfx: s.lastSfx ?? 0.7 };
      else d.settings.sound = { music: 0, sfx: 0, lastMusic: s.music ?? 0.5, lastSfx: s.sfx ?? 0.7 };
    });
  // Volumes reach the sound engine after the save, so start the music a moment later.
  useEffect(() => {
    if (muted || !playing) return;
    const t = setTimeout(startMusic, 120);
    return () => clearTimeout(t);
  }, [muted, playing]);
  return (
    <button type="button" onClick={toggle} className="btn btn-ghost px-3 py-2 shrink-0" aria-label={muted ? "Turn sound on" : "Mute sound"} title={muted ? "Turn sound on" : "Mute sound"}>
      <Icon name={muted ? "mute" : "speaker"} size={22} />
    </button>
  );
}
