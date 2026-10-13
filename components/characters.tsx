"use client";

// Original anime-style mascots drawn as inline SVG, with comic ink outlines.
// Hero: the player (look and items are customisable). Kit: a fox-spirit sidekick who gives briefings.

import { createContext, useContext } from "react";
import type { HeroLook } from "@/lib/types";
import { ItemAura, ItemBack, ItemFace, ItemHat, ItemPet, ItemWeapon } from "./heroItems";

export type HeroMood = "ready" | "focus" | "hype";

export const INK = "#0b0a14";

export const HERO_DEFAULTS: Required<HeroLook> = {
  skin: "#ffd9b8",
  hair: "spiky",
  hairColor: "#2a2f7a",
  eyes: "#ffae00",
  outfit: "#2c2b6b",
  accent: "#ffd23f",
  scarf: "#ff3b4f",
  achievementGear: true,
};

/** The player's saved look and equipped items, so every Hero on screen matches. */
export const HeroStyleContext = createContext<{ look?: HeroLook; items?: string[] }>({});

/** Darker or lighter shade of a #rrggbb colour (amount -1..1). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function Hero({
  mood = "ready",
  size = 160,
  className = "",
  gear = [],
  look: lookProp,
  items: itemsProp,
  attacking = false,
}: {
  mood?: HeroMood;
  size?: number;
  className?: string;
  gear?: string[];
  look?: HeroLook;
  items?: string[];
  attacking?: boolean;
}) {
  const ctx = useContext(HeroStyleContext);
  const L = { ...HERO_DEFAULTS, ...(lookProp ?? ctx.look) };
  const items = itemsProp ?? ctx.items ?? [];
  const hype = mood === "hype" || attacking;
  const has = (id: string) => L.achievementGear && gear.includes(id);
  const it = (id: string) => items.includes(id);
  const skin = L.skin;
  const skinShade = shade(skin, -0.16);
  const suit = L.outfit;
  const legs = shade(suit, -0.15);
  // Right hand: raised when hyped (weapon held up), at the side otherwise.
  const hand: [number, number] = hype ? [151, 98] : [138, 201];
  return (
    <svg viewBox="-20 -24 240 270" width={size} height={size * 1.125} className={className} role="img" aria-label="Hero">
      <ellipse cx="100" cy="236" rx="62" ry="9" fill="#000" opacity="0.28" />
      <ItemAura items={items} />
      <GearBack has={has} />
      <ItemBack items={items} />
      {L.hair === "long" && <path d="M48,92 C40,140 44,170 56,186 L144,186 C156,170 160,140 152,92 Z" fill={L.hairColor} stroke={INK} strokeWidth="4" strokeLinejoin="round" />}
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {/* scarf tail, waving */}
        <path className="scarf-wave" d="M120,150 C150,140 170,150 192,132 C182,156 170,168 140,166 Z" fill={L.scarf} />
        {/* legs */}
        <path d="M84,206 L80,232 L98,232 L98,206 Z" fill={legs} />
        <path d="M104,206 L104,232 L122,232 L118,206 Z" fill={legs} />
        <path d="M76,232 h24 M102,232 h24" strokeWidth="6" />
        {/* body with cel shading */}
        <path d="M68,160 C68,148 80,142 100,142 C120,142 132,148 132,160 L128,210 L72,210 Z" fill={suit} />
        <path d="M116,146 C126,150 132,154 132,160 L128,210 L114,210 Z" fill={shade(suit, -0.3)} stroke="none" />
        <path d="M86,150 L114,150 L108,206 L92,206 Z" fill={L.accent} strokeWidth="3" />
        <path d="M103,160 L92,178 L101,178 L96,194 L110,172 L101,172 Z" fill={L.scarf} strokeWidth="3" />
        {/* arms */}
        {hype ? (
          <>
            <path d="M128,158 C142,146 150,126 150,104" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M128,158 C142,146 150,126 150,104" fill="none" strokeWidth="8" stroke={suit} />
            <circle cx="151" cy="98" r="11" fill={skin} />
            <path d="M72,160 C58,170 54,184 58,196" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M72,160 C58,170 54,184 58,196" fill="none" strokeWidth="8" stroke={suit} />
            <circle cx="58" cy="199" r="9" fill={skin} />
          </>
        ) : (
          <>
            <path d="M72,160 C60,172 58,186 62,198" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M72,160 C60,172 58,186 62,198" fill="none" strokeWidth="8" stroke={suit} />
            <circle cx="62" cy="201" r="9" fill={skin} />
            <path d="M128,160 C140,172 142,186 138,198" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M128,160 C140,172 142,186 138,198" fill="none" strokeWidth="8" stroke={suit} />
            <circle cx="138" cy="201" r="9" fill={skin} />
          </>
        )}
        {/* scarf wrap */}
        <path d="M70,140 C84,152 116,152 130,140 L132,154 C116,164 84,164 68,154 Z" fill={L.scarf} />
        {/* face with cel shadow */}
        <ellipse cx="100" cy="96" rx="48" ry="47" fill={skin} />
        <path d="M136,70 C150,88 150,116 130,136 C120,142 112,143 108,143 C130,130 142,104 136,70 Z" fill={skinShade} stroke="none" opacity="0.8" />
        <ellipse cx="52" cy="102" rx="7" ry="10" fill={skin} />
        <ellipse cx="148" cy="102" rx="7" ry="10" fill={skinShade} />
      </g>
      <ellipse cx="72" cy="118" rx="9" ry="5" fill="#ff8fa3" opacity="0.7" />
      <ellipse cx="128" cy="118" rx="9" ry="5" fill="#ff8fa3" opacity="0.7" />
      {/* eyes */}
      {hype ? (
        <g stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M70,104 Q82,90 94,104" />
          <path d="M106,104 Q118,90 130,104" />
        </g>
      ) : (
        <g stroke={INK} strokeWidth="3">
          <ellipse cx="82" cy="104" rx="11" ry="15" fill="#fff" />
          <ellipse cx="118" cy="104" rx="11" ry="15" fill="#fff" />
          <ellipse cx="83" cy="106" rx="8" ry="12" fill={L.eyes} stroke="none" />
          <ellipse cx="117" cy="106" rx="8" ry="12" fill={L.eyes} stroke="none" />
          <ellipse cx="83" cy="110" rx="8" ry="6" fill={shade(L.eyes, -0.35)} stroke="none" opacity="0.6" />
          <ellipse cx="117" cy="110" rx="8" ry="6" fill={shade(L.eyes, -0.35)} stroke="none" opacity="0.6" />
          <ellipse cx="83" cy="108" rx="4.5" ry="7" fill={INK} stroke="none" />
          <ellipse cx="117" cy="108" rx="4.5" ry="7" fill={INK} stroke="none" />
          <circle cx="86" cy="100" r="3.5" fill="#fff" stroke="none" />
          <circle cx="120" cy="100" r="3.5" fill="#fff" stroke="none" />
          <circle cx="80" cy="112" r="1.8" fill="#fff" stroke="none" />
          <circle cx="114" cy="112" r="1.8" fill="#fff" stroke="none" />
          {mood === "focus" && (
            <>
              <path d="M66,86 L96,94" strokeWidth="5" strokeLinecap="round" />
              <path d="M134,86 L104,94" strokeWidth="5" strokeLinecap="round" />
            </>
          )}
        </g>
      )}
      {/* mouth */}
      <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {hype ? (
          <path d="M86,122 Q100,124 114,122 Q110,140 100,140 Q90,140 86,122 Z" fill="#c2253a" />
        ) : mood === "focus" ? (
          <path d="M92,128 L108,126" fill="none" />
        ) : (
          <path d="M90,124 Q100,132 110,124" fill="none" />
        )}
      </g>
      <ItemFace items={items} />
      <GearMid has={has} hype={hype} />
      <Hair style={L.hair} color={L.hairColor} />
      <GearTop has={has} />
      <ItemHat items={items} />
      {it("hammer") || it("katana") || it("staff") || it("laser") || it("scythe") ? <ItemWeapon items={items} at={hand} raised={hype} /> : null}
      <ItemPet items={items} />
    </svg>
  );
}

function Hair({ style, color }: { style: Required<HeroLook>["hair"]; color: string }) {
  const hi = shade(color, 0.45);
  const lo = shade(color, -0.3);
  if (style === "mohawk") {
    return (
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
        <path d="M58,80 C64,60 80,50 100,49 C120,50 136,60 142,80 C130,66 116,62 100,62 C84,62 70,66 58,80 Z" fill={lo} opacity="0.55" />
        <path d="M84,62 L70,24 L92,40 L94,-6 L108,34 L126,4 L118,48 L136,40 L116,66 Z" fill={color} />
        <path d="M94,8 L100,44 M114,20 L106,48" stroke={hi} strokeWidth="4" fill="none" />
      </g>
    );
  }
  if (style === "bob") {
    return (
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
        <path d="M44,118 C34,60 62,36 100,36 C138,36 166,60 156,118 L142,118 C146,96 140,82 132,76 C118,90 92,92 70,78 C62,88 58,100 58,118 Z" fill={color} />
        <path d="M70,52 C84,44 104,42 118,46" stroke={hi} strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (style === "long") {
    return (
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
        <path d="M46,110 C36,58 66,34 100,34 C134,34 164,58 154,110 L142,96 L136,72 C122,82 108,84 96,74 C86,86 70,88 62,76 L58,98 Z" fill={color} />
        <path d="M72,50 C86,42 106,40 122,46" stroke={hi} strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
      <path
        d="M46,96 C40,62 58,36 82,32 L70,10 L96,26 L102,2 L114,28 L138,10 L130,36 C152,44 162,68 154,98 L144,80 L140,100 L128,72 L120,92 L110,66 L98,88 L88,64 L78,90 L70,72 L60,100 Z"
        fill={color}
      />
      <path d="M130,40 C148,52 154,72 150,92 L144,80 L140,100 L128,72 Z" fill={lo} stroke="none" opacity="0.7" />
      <path d="M84,40 L96,30 L100,44 Z M114,36 L126,30 L120,46 Z" fill={hi} stroke="none" />
    </g>
  );
}

// ---------- Gear earned from achievements (see GEAR in lib/game.ts) ----------

type Has = (id: string) => boolean;

function GearBack({ has }: { has: Has }) {
  return (
    <>
      {has("on-fire") && (
        <g className="aura-flicker" opacity="0.85">
          <path d="M100,-10 C130,20 170,30 176,90 C186,130 170,170 150,200 L50,200 C30,170 14,130 24,90 C30,30 70,20 100,-10 Z" fill="#ff7a1a" opacity="0.35" />
          <path d="M100,10 C122,36 154,46 158,96 C164,128 152,160 140,190 L60,190 C48,160 36,128 42,96 C46,46 78,36 100,10 Z" fill="#ffd23f" opacity="0.35" />
        </g>
      )}
      {has("unstoppable") && (
        <g stroke="#4fd2ff" strokeWidth="5" strokeLinejoin="round" fill="none" className="aura-flicker">
          <path d="M8,40 L24,62 L12,66 L30,92" />
          <path d="M192,30 L176,54 L190,58 L170,86" />
          <path d="M4,150 L22,166 L10,172 L26,194" />
        </g>
      )}
      {has("first-blood") && (
        <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
          <path d="M150,48 L178,20 L186,28 L158,56 Z" fill="#dfe6ff" />
          <path d="M146,46 L160,60" strokeWidth="9" />
          <path d="M146,46 L160,60" strokeWidth="4" stroke="#ffd23f" />
          <path d="M152,56 L132,76" strokeWidth="8" />
        </g>
      )}
    </>
  );
}

function GearMid({ has, hype }: { has: Has; hype: boolean }) {
  const hands = hype ? [[58, 199], [151, 98]] : [[62, 201], [138, 201]];
  return (
    <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
      {has("quest-master") && (
        <>
          <path d="M71,196 L129,196 L128,206 L72,206 Z" fill="#7a4a1f" />
          <rect x="92" y="192" width="16" height="17" rx="3" fill="#ffd23f" />
        </>
      )}
      {has("full-house") && <path d="M100,168 L110,178 L100,192 L90,178 Z" fill="#7ff3ff" />}
      {has("giant-slayer") && (
        <>
          <path d="M58,150 C62,136 80,132 88,142 L80,162 C70,166 58,162 58,150 Z" fill="#ffd23f" />
          <path d="M142,150 C138,136 120,132 112,142 L120,162 C130,166 142,162 142,150 Z" fill="#ffd23f" />
          <path d="M66,146 L74,150 M134,146 L126,150" />
        </>
      )}
      {has("closer") && hands.map(([x, y]) => <circle key={`${x}`} cx={x} cy={y} r="11" fill="#ffd23f" />)}
      {has("shields-up") && (
        <g>
          <path d="M30,170 L60,162 L62,196 C58,212 44,218 36,220 C30,212 26,198 30,170 Z" fill="#4fd2ff" />
          <path d="M46,176 L52,188 L44,188 L48,204" fill="none" stroke="#fff" strokeWidth="4" />
        </g>
      )}
      {has("first-strike") && (
        <>
          <path d="M52,84 C70,74 130,74 148,84 L148,94 C130,86 70,86 52,94 Z" fill="#ff3b4f" />
          <path d="M148,88 C162,84 172,92 180,86 C176,98 164,100 150,96 Z" fill="#ff3b4f" />
        </>
      )}
      {has("strategist") && (
        <>
          <circle cx="118" cy="104" r="17" fill="#4fd2ff" fillOpacity="0.35" stroke="#4fd2ff" strokeWidth="4" />
          <path d="M135,104 L150,98" stroke="#4fd2ff" strokeWidth="4" />
        </>
      )}
    </g>
  );
}

function GearTop({ has }: { has: Has }) {
  return (
    <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
      {has("ad-commander") && (
        <>
          <path d="M50,100 C46,56 154,56 150,100" fill="none" strokeWidth="6" />
          <rect x="40" y="92" width="16" height="24" rx="6" fill="#ff5fae" />
          <rect x="144" y="92" width="16" height="24" rx="6" fill="#ff5fae" />
          <path d="M48,116 C50,132 62,136 76,134" fill="none" strokeWidth="4" />
          <circle cx="78" cy="134" r="5" fill="#ff5fae" />
        </>
      )}
      {has("goal-crusher") && (
        <g className="pulse-gold">
          <path d="M70,4 L76,-18 L88,-4 L100,-22 L112,-4 L124,-18 L130,4 Z" fill="#ffd23f" />
          <circle cx="100" cy="-6" r="4" fill="#ff3b4f" strokeWidth="2.5" />
        </g>
      )}
    </g>
  );
}

export { Kit, KitStyleContext, KIT_LOOKS } from "./kitArt";

/** Spiky comic "sound effect" burst with text, e.g. KA-CHING! */
export function SfxBurst({ text, className = "", color = "#ffd23f", ink = "#ff3b4f" }: { text: string; className?: string; color?: string; ink?: string }) {
  const pts: string[] = [];
  const n = 18;
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? 96 : 66 + ((i * 7) % 11);
    const a = (Math.PI * i) / n;
    pts.push(`${(120 + Math.cos(a) * r * 1.15).toFixed(1)},${(100 + Math.sin(a) * r * 0.8).toFixed(1)}`);
  }
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden>
      <polygon points={pts.join(" ")} fill={color} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <text
        x="120"
        y="114"
        textAnchor="middle"
        fontFamily="Bangers, Impact, sans-serif"
        fontSize={text.length > 9 ? 34 : 44}
        fill={ink}
        stroke={INK}
        strokeWidth="2.5"
        paintOrder="stroke"
        transform="rotate(-8 120 100)"
        letterSpacing="2"
      >
        {text}
      </text>
    </svg>
  );
}
