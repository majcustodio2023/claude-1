"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { bossCoins, finishBoss, type FightRank, type RewardEvent } from "@/lib/loot";
import { RARITY } from "@/lib/items";
import { useTracker } from "./App";
import { Hero } from "./characters";
import { Bar, Btn, money } from "./ui";

// Boss-defeat mini game. A deal was fully paid in real life; now land the final blow.
// Tap ATTACK when the marker is in the gold zone for a critical hit. Faster K.O. = better rank = more loot.

const MAX_HP = 12;
const TIME = 10;
const ZONE = 0.2;

type Phase = "intro" | "fight" | "ko" | "done";

export default function BossFight({ dealId, onClose }: { dealId: string; onClose: () => void }) {
  const { data, update, today } = useTracker();
  const deal = data.deals.find((d) => d.id === dealId);
  const [phase, setPhase] = useState<Phase>("intro");
  const [hp, setHp] = useState(MAX_HP);
  const [zone, setZone] = useState(0.62);
  const [pos, setPos] = useState(0);
  const [left, setLeft] = useState(TIME);
  const [hit, setHit] = useState(0);
  const [pops, setPops] = useState<{ id: number; text: string; crit: boolean }[]>([]);
  const [rank, setRank] = useState<FightRank>("C");
  const [reward, setReward] = useState<RewardEvent | null>(null);
  const start = useRef(0);
  const hpRef = useRef(MAX_HP);
  const posRef = useRef(0);
  const ended = useRef(false);

  const end = useCallback((r: FightRank) => {
    if (ended.current) return;
    ended.current = true;
    setRank(r);
    setPhase("ko");
    setTimeout(() => setPhase("done"), 1100);
  }, []);

  // Marker sweeps back and forth, faster as the boss weakens. Timer runs alongside.
  useEffect(() => {
    if (phase !== "fight") return;
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start.current) / 1000;
      const speed = 1.6 + (1 - hpRef.current / MAX_HP) * 2.2;
      const p = (Math.sin(t * speed * Math.PI) + 1) / 2;
      posRef.current = p;
      setPos(p);
      const remaining = Math.max(0, TIME - t);
      setLeft(remaining);
      if (remaining <= 0) return end("C");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, end]);

  const attack = useCallback(() => {
    if (phase !== "fight" || ended.current) return;
    const crit = Math.abs(posRef.current - zone) <= ZONE / 2;
    const dmg = crit ? 3 : 1;
    hpRef.current = Math.max(0, hpRef.current - dmg);
    setHp(hpRef.current);
    setHit((h) => h + 1);
    const id = Date.now() + Math.random();
    setPops((p) => [...p.slice(-4), { id, text: crit ? `CRIT! -${dmg}` : `-${dmg}`, crit }]);
    if (crit) setZone(0.15 + Math.random() * 0.7);
    if (hpRef.current === 0) {
      const secs = (performance.now() - start.current) / 1000;
      end(secs <= 4 ? "S" : secs <= 6.5 ? "A" : "B");
    }
  }, [phase, zone, end]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (phase === "fight") attack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, attack]);

  // Pay out once, when the fight ends.
  useEffect(() => {
    if (phase !== "done" || reward) return;
    const draft = structuredClone(data);
    const ev = finishBoss(draft, dealId, rank, today);
    update((d) => void (d.game = draft.game));
    setReward(ev);
  }, [phase, reward, data, dealId, rank, today, update]);

  const fight = () => {
    start.current = performance.now();
    setPhase("fight");
  };

  const skip = () => {
    if (phase === "intro") end("C");
  };

  if (!deal) return null;
  const big = deal.value;

  return (
    <div className="fixed inset-0 z-[60] bg-[#06070d] overflow-y-auto" role="dialog" aria-modal="true" aria-label={`Boss fight: ${deal.name}`}>
      <div className="impact-lines absolute inset-[-20%] opacity-40 pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-4 py-6 min-h-full flex flex-col">
        <div className="text-center">
          <div className="caption inline-block mb-2">Boss fight</div>
          <h2 className="font-display text-4xl sm:text-5xl tracking-wide break-words">{deal.name}</h2>
          <p className="text-lg text-muted font-bold">{money(big)} collected in real life. Now finish it!</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="font-display text-xl tracking-wide text-bad">HP</span>
          <div className="flex-1">
            <Bar pct={hp / MAX_HP} tone="bad" />
          </div>
          <span className="font-display text-2xl tracking-wide w-16 text-right">{phase === "fight" ? `${left.toFixed(1)}s` : `${TIME}s`}</span>
        </div>

        <div className="relative flex items-end justify-between mt-4 min-h-[240px] select-none">
          <div key={`h${hit}`} className={hit ? "hero-lunge" : ""}>
            <Hero mood={phase === "done" ? "hype" : "focus"} attacking={phase === "fight" || phase === "ko"} size={170} gear={Object.keys(data.heroGear ?? {})} className="drop-shadow-[5px_5px_0_#0b0a14] max-sm:w-[120px] max-sm:h-auto" />
          </div>
          <button
            type="button"
            onClick={attack}
            className="relative focus:outline-none"
            aria-label="Hit the boss"
            disabled={phase !== "fight"}
          >
            <div key={`b${hit}`} className={phase === "ko" || phase === "done" ? "boss-ko" : hit ? "boss-hit" : "bob"}>
              <Boss size={210} hp={hp / MAX_HP} />
            </div>
            {pops.map((p) => (
              <span key={p.id} className={`dmg-float absolute left-1/2 top-6 font-display tracking-wide pointer-events-none ${p.crit ? "text-gold text-5xl" : "text-white text-3xl"}`} style={{ WebkitTextStroke: "2px #0b0a14" }}>
                {p.text}
              </span>
            ))}
          </button>
          {phase === "ko" && <div className="absolute inset-0 grid place-content-center font-display text-7xl sm:text-8xl text-gold sfx-in" style={{ WebkitTextStroke: "3px #0b0a14" }}>K.O.!</div>}
        </div>

        {phase === "intro" && (
          <div className="hud p-5 mt-4 text-center space-y-3">
            <p className="text-lg font-bold">Tap <b>ATTACK</b> (or the boss, or Space) when the marker is in the <span className="text-gold">gold zone</span> for a critical hit. You have {TIME} seconds.</p>
            <p className="text-base text-muted">K.O. in 4s = rank S (epic loot or better) · 6.5s = A (loot) · slower = B · time out = C. Coins for this boss: {bossCoins(big, data.settings.monthlyGoal, "C")} to {bossCoins(big, data.settings.monthlyGoal, "S")}.</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Btn kind="hero" className="text-2xl px-8" onClick={fight}>FIGHT!</Btn>
              <Btn onClick={skip}>Skip (rank C)</Btn>
            </div>
          </div>
        )}

        {phase === "fight" && (
          <div className="mt-4 space-y-3">
            <div className="relative h-10 rounded-[10px] border-[3px] border-outline bg-card-2 overflow-hidden">
              <div className="absolute inset-y-0 bg-gold/80" style={{ left: `${(zone - ZONE / 2) * 100}%`, width: `${ZONE * 100}%` }} />
              <div className="absolute inset-y-0 w-2 -ml-1 bg-white border-x-2 border-outline" style={{ left: `${pos * 100}%` }} />
            </div>
            <button type="button" onClick={attack} className="btn btn-hero w-full text-3xl py-4">⚔️ ATTACK</button>
          </div>
        )}

        {phase === "done" && reward && (
          <div className="hud hud-gold p-5 mt-4 text-center space-y-2">
            <div className="font-display text-5xl text-gold tracking-wide">RANK {rank}</div>
            <div className="font-display text-3xl tracking-wide">+{reward.coins} 🪙</div>
            {reward.item ? (
              <div className="text-xl font-extrabold">
                🎁 Loot: <span style={{ color: RARITY[reward.item.rarity].color }}>{reward.item.name}</span> <span className="text-muted">({RARITY[reward.item.rarity].label})</span>
                <div className="flex justify-center mt-2">
                  <Hero size={120} items={[reward.item.id]} gear={[]} />
                </div>
              </div>
            ) : (
              <p className="text-base text-muted">{rank === "C" || rank === "B" ? "Faster K.O. next time for loot." : ""}</p>
            )}
            <Btn kind="primary" className="text-xl mt-2" onClick={onClose}>Claim</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/** Comic boss monster. Gets angrier (redder) as it loses HP. */
export function Boss({ size = 200, hp = 1 }: { size?: number; hp?: number }) {
  const body = hp > 0.5 ? "#7b2cbf" : hp > 0.2 ? "#b5179e" : "#d62839";
  const INK = "#0b0a14";
  return (
    <svg viewBox="0 0 220 220" width={size} height={size} aria-hidden>
      <ellipse cx="110" cy="208" rx="70" ry="9" fill="#000" opacity="0.3" />
      <g stroke={INK} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M58,60 C46,30 30,20 14,22 C30,34 34,52 40,74 Z" fill="#f1e3c4" />
        <path d="M162,60 C174,30 190,20 206,22 C190,34 186,52 180,74 Z" fill="#f1e3c4" />
        <path d="M30,200 C18,150 26,72 110,56 C194,72 202,150 190,200 Z" fill={body} />
        <path d="M150,70 C186,92 196,150 186,200 L160,200 C170,150 168,104 150,70 Z" fill="#000" opacity="0.25" stroke="none" />
        <path d="M52,104 L94,118 L88,130 L50,120 Z" fill="#fff" />
        <path d="M168,104 L126,118 L132,130 L170,120 Z" fill="#fff" />
        <circle cx="76" cy="120" r="5" fill={INK} />
        <circle cx="144" cy="120" r="5" fill={INK} />
        <path d="M48,96 L96,110 M172,96 L124,110" strokeWidth="8" />
        <path d="M62,150 C80,140 140,140 158,150 C150,182 70,182 62,150 Z" fill="#2b0b1f" />
        <path d="M70,150 L80,166 L90,148 L100,166 L110,146 L120,166 L130,148 L140,166 L150,150" fill="#fff" strokeWidth="3" />
        <path d="M96,170 C100,182 120,182 124,170" fill="#ff5f7a" strokeWidth="3" />
      </g>
      <text x="110" y="100" textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="26" fill="#ffd23f" stroke={INK} strokeWidth="2" paintOrder="stroke">
        {hp > 0 ? "" : "X_X"}
      </text>
    </svg>
  );
}
