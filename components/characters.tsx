"use client";

// Original anime-style mascots drawn as inline SVG, with comic ink outlines.
// Hero: the player (look and items are customisable). Kit: a fox-spirit sidekick who gives briefings.

import { createContext, useContext } from "react";
import type { HeroLook } from "@/lib/types";
import { ItemAura, ItemBack, ItemFace, ItemHat, ItemPet, ItemWeapon } from "./heroItems";
import { HERO_DEFAULTS, HERO_HAIR } from "@/lib/heroLook";
import { Extra, Eyes, HairBack, HairFront, Mouth } from "./avatars";

export type HeroMood = "ready" | "focus" | "hype";

export const INK = "#0b0a14";

export { HERO_DEFAULTS };

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
  const legs = L.bottomsColor || shade(suit, -0.15);
  const sleeve = L.top === "tank" ? skin : L.top === "sailor" ? "#f1f1f1" : suit;
  const hand = L.gloves !== "none" && L.gloves.startsWith("#") ? L.gloves : skin;
  const avHair = HERO_HAIR.find(([v]) => v === L.hair)?.[2] ?? null;
  const classicHair = ["spiky", "long", "mohawk", "bob"].includes(L.hair) ? L.hair : null;
  // Right hand: raised when hyped (weapon held up), at the side otherwise.
  const handAt: [number, number] = hype ? [151, 98] : [138, 201];
  return (
    <svg viewBox="-20 -24 240 270" width={size} height={size * 1.125} className={className} role="img" aria-label="Hero">
      <ellipse cx="100" cy="236" rx="62" ry="9" fill="#000" opacity="0.28" />
      <ItemAura items={items} />
      <GearBack has={has} />
      <HeroBack kind={L.back} color={L.backColor} />
      <ItemBack items={items} />
      {classicHair === "long" && <path d="M48,92 C40,140 44,170 56,186 L144,186 C156,170 160,140 152,92 Z" fill={L.hairColor} stroke={INK} strokeWidth="4" strokeLinejoin="round" />}
      {avHair != null && (
        <g transform={AV}>
          <HairBack style={avHair} color={L.hairColor} outfit={suit} />
        </g>
      )}
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {L.neck === "scarf" && <path className="scarf-wave" d="M120,150 C150,140 170,150 192,132 C182,156 170,168 140,166 Z" fill={L.scarf} />}
        <Bottoms kind={L.bottoms} color={legs} skin={skin} shoes={L.shoes} />
        <Top kind={L.top} color={suit} accent={L.accent} emblem={L.emblem} skin={skin} />
        <BottomsOver kind={L.bottoms} color={legs} />
        {/* arms */}
        {hype ? (
          <>
            <path d="M128,158 C142,146 150,126 150,104" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M128,158 C142,146 150,126 150,104" fill="none" strokeWidth="8" stroke={sleeve} />
            <circle cx="151" cy="98" r="11" fill={hand} />
            <path d="M72,160 C58,170 54,184 58,196" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M72,160 C58,170 54,184 58,196" fill="none" strokeWidth="8" stroke={sleeve} />
            <circle cx="58" cy="199" r="9" fill={hand} />
          </>
        ) : (
          <>
            <path d="M72,160 C60,172 58,186 62,198" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M72,160 C60,172 58,186 62,198" fill="none" strokeWidth="8" stroke={sleeve} />
            <circle cx="62" cy="201" r="9" fill={hand} />
            <path d="M128,160 C140,172 142,186 138,198" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M128,160 C140,172 142,186 138,198" fill="none" strokeWidth="8" stroke={sleeve} />
            <circle cx="138" cy="201" r="9" fill={hand} />
          </>
        )}
        <Neck kind={L.neck} color={L.scarf} />
        {/* face with cel shadow */}
        <ellipse cx="100" cy="96" rx="48" ry="47" fill={skin} />
        <path d="M136,70 C150,88 150,116 130,136 C120,142 112,143 108,143 C130,130 142,104 136,70 Z" fill={skinShade} stroke="none" opacity="0.8" />
        <ellipse cx="52" cy="102" rx="7" ry="10" fill={skin} />
        <ellipse cx="148" cy="102" rx="7" ry="10" fill={skinShade} />
      </g>
      <FaceMarks kind={L.marks} />
      {/* eyes */}
      {hype ? (
        <g stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M70,104 Q82,90 94,104" />
          <path d="M106,104 Q118,90 130,104" />
        </g>
      ) : L.eyeStyle !== "hero" ? (
        <g transform={AV}>
          <Eyes style={Number(L.eyeStyle) || 0} color={L.eyes} skin={skin} />
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
        </g>
      )}
      {mood === "focus" && !hype && (
        <g stroke={INK} strokeWidth="5" strokeLinecap="round">
          <path d="M66,86 L96,94" />
          <path d="M134,86 L104,94" />
        </g>
      )}
      {/* mouth */}
      {hype ? (
        <path d="M86,122 Q100,124 114,122 Q110,140 100,140 Q90,140 86,122 Z" fill="#c2253a" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      ) : mood === "focus" ? (
        <path d="M92,128 L108,126" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      ) : L.mouth !== "auto" ? (
        <g transform={AV}>
          <Mouth style={Number(L.mouth) || 0} y={64} />
        </g>
      ) : (
        <path d="M90,124 Q100,132 110,124" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      )}
      {L.eyewear !== "none" && (
        <g transform={AV}>
          <Extra n={EYEWEAR[L.eyewear] ?? 0} hair={L.hairColor} outfit={suit} />
        </g>
      )}
      {L.earrings === "studs" && (
        <g transform={AV}>
          <Extra n={9} hair={L.hairColor} outfit={suit} />
        </g>
      )}
      <ItemFace items={items} />
      <GearMid has={has} hype={hype} />
      {classicHair ? (
        <Hair style={classicHair as "spiky" | "long" | "mohawk" | "bob"} color={L.hairColor} />
      ) : avHair != null ? (
        <g transform={AV}>
          <HairFront style={avHair} color={L.hairColor} outfit={suit} />
        </g>
      ) : null}
      <Headwear kind={L.headwear} hair={L.hairColor} outfit={suit} accent={L.accent} />
      <GearTop has={has} />
      <ItemHat items={items} />
      {it("hammer") || it("katana") || it("staff") || it("laser") || it("scythe") ? <ItemWeapon items={items} at={handAt} raised={hype} /> : null}
      <ItemPet items={items} />
    </svg>
  );
}

/** Maps the avatar face grid (100×100, eyes at y 55) onto the hero's head. */
const AV = "translate(100 104) scale(2.5) translate(-50 -55)";
const EYEWEAR: Record<string, number> = { glasses: 1, round: 2, eyepatch: 6, shades: 13 };
const HEADWEAR: Record<string, number> = { cap: 4, headband: 5, catears: 10, horns: 11, star: 12, headphones: 14, headset: 3 };

function Headwear({ kind, hair, outfit, accent }: { kind: string; hair: string; outfit: string; accent: string }) {
  const s = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const };
  if (kind === "beanie")
    return (
      <g {...s}>
        <path d="M50,80 C46,30 154,30 150,80 Z" fill={outfit} />
        <path d="M46,74 L154,74 L154,90 L46,90 Z" fill={shade(outfit, -0.25)} />
        <circle cx="100" cy="30" r="10" fill={accent} />
      </g>
    );
  if (kind === "crown")
    return (
      <g {...s}>
        <path d="M74,48 L72,22 L86,34 L100,14 L114,34 L128,22 L126,48 Z" fill="#ffd23f" />
        <circle cx="100" cy="36" r="4" fill="#d62839" strokeWidth="2.5" />
      </g>
    );
  const n = HEADWEAR[kind];
  if (!n) return null;
  return (
    <g transform={AV}>
      <Extra n={n} hair={hair} outfit={outfit} top={kind === "cap" ? 38 : 40} />
    </g>
  );
}

function FaceMarks({ kind }: { kind: string }) {
  if (kind === "none") return null;
  if (kind === "blush")
    return (
      <g fill="#ff8fa3" opacity="0.7">
        <ellipse cx="72" cy="118" rx="9" ry="5" />
        <ellipse cx="128" cy="118" rx="9" ry="5" />
      </g>
    );
  if (kind === "freckles" || kind === "bandage")
    return (
      <g transform={AV}>
        <Extra n={kind === "freckles" ? 15 : 7} hair="#000" outfit="#000" />
      </g>
    );
  if (kind === "scar") return <path d="M122,90 L134,122 M124,100 L132,98 M127,108 L135,106 M130,116 L137,114" stroke="#c2253a" strokeWidth="3" strokeLinecap="round" fill="none" />;
  if (kind === "whiskers") return <path d="M60,116 L76,118 M60,124 L76,122 M140,116 L124,118 M140,124 L124,122" stroke={INK} strokeWidth="3" strokeLinecap="round" />;
  if (kind === "star") return <path d="M132,118 l2.6,5.2 5.7,0.8 -4.1,4 1,5.7 -5.2,-2.7 -5.1,2.7 1,-5.7 -4.1,-4 5.7,-0.8z" fill="#ffd23f" stroke={INK} strokeWidth="2" strokeLinejoin="round" />;
  if (kind === "mole") return <circle cx="114" cy="132" r="2.4" fill={INK} />;
  return null;
}

function Emblem({ kind, color }: { kind: string; color: string }) {
  const s = { fill: color, strokeWidth: 3 };
  switch (kind) {
    case "none":
      return null;
    case "star":
      return <path d="M100,166 l4,8.4 9.2,1.3 -6.6,6.5 1.6,9.2 -8.2,-4.4 -8.2,4.4 1.6,-9.2 -6.6,-6.5 9.2,-1.3z" {...s} />;
    case "heart":
      return <path d="M100,192 C88,184 86,176 90,171 C94,166 99,169 100,173 C101,169 106,166 110,171 C114,176 112,184 100,192 Z" {...s} />;
    case "diamond":
      return <path d="M100,164 L111,178 L100,194 L89,178 Z" {...s} />;
    case "flame":
      return <path d="M100,194 C88,192 86,180 94,172 C94,178 98,180 99,176 C98,170 102,164 106,162 C104,170 114,176 110,186 C108,191 104,194 100,194 Z" {...s} />;
    case "crown":
      return <path d="M88,188 L86,170 L94,177 L100,166 L106,177 L114,170 L112,188 Z" {...s} />;
    case "coin":
      return (
        <g>
          <circle cx="100" cy="179" r="12" {...s} />
          <circle cx="100" cy="179" r="6.5" fill="none" strokeWidth="2.5" />
        </g>
      );
    default:
      return <path d="M103,160 L92,178 L101,178 L96,194 L110,172 L101,172 Z" {...s} />;
  }
}

/** The torso: one of several outfits, with sleeves drawn separately by Hero. */
function Top({ kind, color, accent, emblem, skin }: { kind: string; color: string; accent: string; emblem: string; skin: string }) {
  const body = "M68,160 C68,148 80,142 100,142 C120,142 132,148 132,160 L128,210 L72,210 Z";
  const side = <path d="M116,146 C126,150 132,154 132,160 L128,210 L114,210 Z" fill={shade(color, -0.3)} stroke="none" />;
  const mark = <Emblem kind={emblem} color={kind === "hero" ? "#ff3b4f" : accent} />;
  switch (kind) {
    case "hoodie":
      return (
        <>
          <path d="M70,150 C66,132 134,132 130,150 C120,140 80,140 70,150 Z" fill={shade(color, -0.2)} />
          <path d={body} fill={color} />
          {side}
          <path d="M80,186 L120,186 L116,206 L84,206 Z" fill={shade(color, -0.15)} strokeWidth="3" />
          <path d="M92,150 L90,172 M108,150 L110,172" strokeWidth="2.5" stroke={accent} />
          <g transform="translate(0 -8) scale(1)">{emblem !== "none" && mark}</g>
        </>
      );
    case "jacket":
      return (
        <>
          <path d={body} fill={color} />
          {side}
          <path d="M88,146 L112,146 L110,210 L90,210 Z" fill={accent} strokeWidth="3" />
          <path d="M88,146 L80,172 L90,180 M112,146 L120,172 L110,180" fill="none" strokeWidth="3" />
          {mark}
        </>
      );
    case "uniform":
    case "suit":
      return (
        <>
          <path d={body} fill={color} />
          {side}
          <path d="M86,146 L114,146 L100,182 Z" fill="#f5f5f5" strokeWidth="3" />
          <path d="M96,150 L104,150 L106,178 L100,186 L94,178 Z" fill={kind === "suit" ? accent : "#d62839"} strokeWidth="3" />
          <path d="M86,146 L94,184 L100,210 M114,146 L106,184 L100,210" fill="none" strokeWidth="3" />
          {kind === "uniform" && <path d="M76,170 L88,170 L88,180 L76,180 Z" fill={accent} strokeWidth="2.5" />}
        </>
      );
    case "gi":
      return (
        <>
          <path d={body} fill={color} />
          {side}
          <path d="M84,146 L112,192 M116,146 L94,182" fill="none" strokeWidth="6" stroke={accent} />
          <path d="M84,146 L112,192 M116,146 L94,182" fill="none" strokeWidth="2" />
          <path d="M72,190 L128,190 L128,200 L72,200 Z" fill={INK} />
          <path d="M100,198 L94,214 M104,198 L110,214" strokeWidth="5" />
        </>
      );
    case "armor":
      return (
        <>
          <path d={body} fill={shade(color, -0.1)} />
          <path d="M78,152 C88,146 112,146 122,152 L118,190 C108,198 92,198 82,190 Z" fill={color} strokeWidth="3" />
          <path d="M86,156 C94,152 104,152 112,156" fill="none" stroke="#fff" strokeWidth="3" opacity="0.6" />
          <circle cx="68" cy="156" r="12" fill={accent} />
          <circle cx="132" cy="156" r="12" fill={accent} />
          <path d="M72,200 L128,200 L128,210 L72,210 Z" fill={accent} strokeWidth="3" />
          {mark}
        </>
      );
    case "tank":
      return (
        <>
          <path d="M72,160 C72,150 80,146 86,146 L86,152 C94,158 106,158 114,152 L114,146 C120,146 128,150 128,160 L126,210 L74,210 Z" fill={color} />
          <path d="M86,146 C90,154 110,154 114,146" fill={skin} strokeWidth="3" />
          {mark}
        </>
      );
    case "tee":
      return (
        <>
          <path d={body} fill={color} />
          {side}
          <path d="M88,146 C92,154 108,154 112,146" fill={skin} strokeWidth="3" />
          {mark}
        </>
      );
    case "sailor":
      return (
        <>
          <path d={body} fill="#f5f5f5" />
          <path d="M116,146 C126,150 132,154 132,160 L128,210 L114,210 Z" fill="#d9dce6" stroke="none" />
          <path d="M72,150 L100,176 L128,150 L128,162 L100,186 L72,162 Z" fill={color} strokeWidth="3" />
          <path d="M92,178 L100,186 L108,178 L114,190 L100,188 L86,190 Z" fill={accent} strokeWidth="3" />
          <path d="M72,200 L128,200 L128,210 L72,210 Z" fill={color} strokeWidth="3" />
        </>
      );
    default:
      return (
        <>
          <path d={body} fill={color} />
          {side}
          <path d="M86,150 L114,150 L108,206 L92,206 Z" fill={accent} strokeWidth="3" />
          {mark}
        </>
      );
  }
}

function Bottoms({ kind, color, skin, shoes }: { kind: string; color: string; skin: string; shoes: string }) {
  const shoe = (
    <g fill={shoes}>
      <path d="M74,228 C76,224 98,224 100,228 L100,236 L72,236 Z" />
      <path d="M100,228 C102,224 124,224 126,228 L128,236 L100,236 Z" />
    </g>
  );
  if (kind === "shorts" || kind === "skirt")
    return (
      <>
        <path d="M84,206 L82,230 L98,230 L98,206 Z" fill={skin} />
        <path d="M104,206 L104,230 L120,230 L118,206 Z" fill={skin} />
        {shoe}
      </>
    );
  return (
    <>
      <path d="M84,206 L80,232 L98,232 L98,206 Z" fill={color} />
      <path d="M104,206 L104,232 L122,232 L118,206 Z" fill={color} />
      {kind === "cargo" && <path d="M80,214 L90,214 L90,222 L80,222 Z M110,214 L120,214 L120,222 L110,222 Z" fill={shade(color, -0.25)} strokeWidth="2.5" />}
      {shoe}
    </>
  );
}

/** Shorts and skirts sit over the hem of the top so they read clearly at small sizes. */
function BottomsOver({ kind, color }: { kind: string; color: string }) {
  if (kind === "shorts") return <path d="M73,203 L127,203 L130,221 L103,221 L100,213 L97,221 L70,221 Z" fill={color} />;
  if (kind === "skirt")
    return (
      <>
        <path d="M73,203 L127,203 L140,225 L60,225 Z" fill={color} />
        <path d="M86,206 L80,224 M100,206 L100,224 M114,206 L120,224" fill="none" strokeWidth="2.5" stroke={shade(color, -0.4)} />
      </>
    );
  return null;
}

function Neck({ kind, color }: { kind: string; color: string }) {
  switch (kind) {
    case "scarf":
      return <path d="M70,140 C84,152 116,152 130,140 L132,154 C116,164 84,164 68,154 Z" fill={color} />;
    case "bandana":
      return <path d="M74,142 C86,150 114,150 126,142 L100,168 Z" fill={color} />;
    case "necklace":
      return (
        <>
          <path d="M80,144 C88,158 112,158 120,144" fill="none" stroke="#ffd23f" strokeWidth="3" />
          <path d="M100,156 L106,163 L100,170 L94,163 Z" fill={color} strokeWidth="2.5" />
        </>
      );
    case "bow":
      return <path d="M100,150 L84,142 L84,158 Z M100,150 L116,142 L116,158 Z" fill={color} strokeWidth="3" />;
    case "tie":
      return <path d="M95,146 L105,146 L108,176 L100,186 L92,176 Z" fill={color} strokeWidth="3" />;
    default:
      return null;
  }
}

function HeroBack({ kind, color }: { kind: string; color: string }) {
  const s = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const };
  switch (kind) {
    case "cape":
      return <path className="scarf-wave" d="M70,146 C56,180 46,210 40,232 L160,232 C154,210 144,180 130,146 Z" fill={color} {...s} />;
    case "backpack":
      return (
        <g {...s}>
          <rect x="62" y="150" width="76" height="56" rx="14" fill={color} />
          <path d="M70,150 L66,140 M130,150 L134,140" />
        </g>
      );
    case "wings":
      return (
        <g {...s} fill={color === "#16131f" ? "#2b2d42" : "#f5f5f5"}>
          <path d="M80,160 C50,120 20,120 4,140 C20,146 22,156 14,166 C30,166 34,176 28,186 C48,184 64,176 80,170 Z" />
          <path d="M120,160 C150,120 180,120 196,140 C180,146 178,156 186,166 C170,166 166,176 172,186 C152,184 136,176 120,170 Z" />
        </g>
      );
    case "sword":
      return (
        <g {...s}>
          <path d="M146,124 L60,212 L68,220 L154,132 Z" fill={color} />
          <path d="M140,118 L160,138" strokeWidth="8" />
        </g>
      );
    default:
      return null;
  }
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
