"use client";

// The city's scenery in a hand-drawn, thick-outline, warm top-down style: brick sidewalks,
// autumn trees, buildings seen from above with their front walls showing (roof clutter,
// awnings, pipes, posters, crates and plants), and cosy wooden interiors with real desks.
//
// The scenery is plain shapes with no text, so the game can turn it into one picture and
// keep the frame rate up. Everything you read (signs, nameplates, the results screen) is
// drawn on top as normal page text by CityLabels and InteriorLabels, so it stays sharp.

import { memo, type CSSProperties, type ReactNode } from "react";
import { T, type CityLayout, type InteriorLayout, type Rect } from "@/lib/city";
import { hashString, rng } from "@/lib/avatar";
import { shade } from "../characters";
import { Avatar } from "../avatars";
import { Icon } from "../icons";
import { snapHex } from "@/lib/palette";

/** Outline colour: a warm dark plum, like ink on paper. */
export const LINE = "#2b1d2e";
const KIND_ICON: Record<string, string> = { video: "film", acquisition: "megaphone", creative: "palette", weapons: "swords", armor: "shield", custom: "home" };
const SW = 4;

export interface HouseInfo {
  id: string;
  name: string;
  color: string;
  kind: string;
  avatar?: string;
  /** Staff waiting on setup: a number shows on the sign */
  alert: number;
  /** Staff busy right now: lights are on inside */
  busy: number;
}

const short = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Mixes a colour toward warm cream, so client colours sit nicely in the scene. */
const soft = (hex: string, k = 0.55) => {
  const a = parseInt(hex.slice(1), 16);
  const b = 0xf6e7cf;
  const m = (s: number) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
  return `#${((1 << 24) | (m(16) << 16) | (m(8) << 8) | m(0)).toString(16).slice(1)}`;
};

export function Defs() {
  return (
    <defs>
      <pattern id="a-grass" width="120" height="120" patternUnits="userSpaceOnUse">
        <rect width="120" height="120" fill="#9cc764" />
        <path d="M8 22 q3 -8 5 0 q2 -7 4 0 M70 12 q3 -8 5 0 q2 -7 4 0 M38 70 q3 -8 5 0 q2 -7 4 0 M92 84 q3 -8 5 0 q2 -7 4 0 M14 100 q3 -8 5 0" stroke="#7fae4c" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <circle cx="54" cy="36" r="2.4" fill="#f6e7cf" />
        <circle cx="104" cy="44" r="2" fill="#ffd08a" />
        <circle cx="26" cy="52" r="2" fill="#f5a6b8" />
        <path d="M84 110 l6 -3 l-2 6 z" fill="#e8845f" />
        <path d="M30 6 l6 -2 l-3 5 z" fill="#f2a07b" />
      </pattern>
      <pattern id="a-brick" width="40" height="20" patternUnits="userSpaceOnUse">
        <rect width="40" height="20" fill="#e3905e" />
        <path d="M0 0.5 H40 M0 10 H40 M10 0 V10 M30 10 V20" stroke="#c46f45" strokeWidth="2" />
        <rect x="12" y="2" width="16" height="6" fill="#ec9f6e" />
        <rect x="32" y="12" width="6" height="6" fill="#d98252" />
      </pattern>
      <pattern id="a-mosaic" width="48" height="48" patternUnits="userSpaceOnUse">
        <rect width="48" height="48" fill="#a3998f" />
        <rect x="2" y="2" width="20" height="10" fill="#c8bdae" />
        <rect x="26" y="2" width="20" height="10" fill="#bdb1a2" />
        <rect x="-10" y="14" width="20" height="10" fill="#bdb1a2" />
        <rect x="14" y="14" width="20" height="10" fill="#c8bdae" />
        <rect x="38" y="14" width="20" height="10" fill="#c8bdae" />
        <rect x="2" y="26" width="20" height="10" fill="#bdb1a2" />
        <rect x="26" y="26" width="20" height="10" fill="#c8bdae" />
        <rect x="-10" y="38" width="20" height="10" fill="#c8bdae" />
        <rect x="14" y="38" width="20" height="10" fill="#bdb1a2" />
        <rect x="38" y="38" width="20" height="10" fill="#bdb1a2" />
        <rect x="4" y="4" width="6" height="2" fill="#e4dacb" />
        <rect x="28" y="28" width="6" height="2" fill="#e4dacb" />
      </pattern>
      <pattern id="a-road" width="80" height="80" patternUnits="userSpaceOnUse">
        <rect width="80" height="80" fill="#6f6878" />
        <path d="M12 18 l10 4 l6 -3 M52 58 l8 6 l9 -2" stroke="#5d5768" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="62" cy="20" r="2" fill="#7d7686" />
        <circle cx="20" cy="62" r="2.5" fill="#7d7686" />
      </pattern>
      <pattern id="a-tile" width="28" height="14" patternUnits="userSpaceOnUse">
        <path d="M0 13 Q7 3 14 13 Q21 3 28 13" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="2.4" />
      </pattern>
      <pattern id="a-plank" width="160" height="32" patternUnits="userSpaceOnUse">
        <rect width="160" height="32" fill="#cf9560" />
        <rect y="16" width="160" height="16" fill="#c4884f" />
        <path d="M0 0.5 H160 M0 16 H160 M56 0 V16 M120 16 V32 M10 16 V32" stroke="#a46b38" strokeWidth="2" />
        <path d="M20 8 h18 M90 24 h14" stroke="#dba673" strokeWidth="2" strokeLinecap="round" />
      </pattern>
      <pattern id="a-stone" width="56" height="28" patternUnits="userSpaceOnUse">
        <rect width="56" height="28" fill="#a99a9a" />
        <path d="M0 0.5 H56 M0 14 H56 M20 0 V14 M48 0 V14 M8 14 V28 M36 14 V28" stroke="#837474" strokeWidth="2.4" />
        <rect x="24" y="3" width="20" height="8" rx="2" fill="#b8a9a8" />
      </pattern>
      <pattern id="a-rug" width="36" height="36" patternUnits="userSpaceOnUse">
        <rect width="36" height="36" fill="#c2456b" />
        <path d="M0 18 L18 0 L36 18 L18 36 Z" fill="none" stroke="#e8799a" strokeWidth="3" />
        <circle cx="18" cy="18" r="3" fill="#f6e7cf" />
      </pattern>
      {/* woven rugs: a soft diamond motif on a warm ground */}
      <pattern id="a-carpet" width="48" height="48" patternUnits="userSpaceOnUse">
        <rect width="48" height="48" fill="#c0502f" />
        <path d="M24 6 L42 24 L24 42 L6 24 Z" fill="none" stroke="#93392a" strokeWidth="4" />
        <rect x="21" y="21" width="6" height="6" fill="#d9703b" />
      </pattern>
      <pattern id="a-carpet2" width="48" height="48" patternUnits="userSpaceOnUse">
        <rect width="48" height="48" fill="#2a6a6e" />
        <path d="M24 6 L42 24 L24 42 L6 24 Z" fill="none" stroke="#1f4a52" strokeWidth="4" />
        <rect x="21" y="21" width="6" height="6" fill="#2f8f83" />
      </pattern>
      <pattern id="a-wallpaper" width="36" height="36" patternUnits="userSpaceOnUse">
        <rect width="36" height="36" fill="#cbb3ee" />
        <rect x="0" width="6" height="36" fill="#bea2e6" />
        <path d="M21 8 l5 6 l-5 6 l-5 -6 z" fill="#f2d48a" />
        <circle cx="21" cy="28" r="1.8" fill="#f6e7cf" />
      </pattern>
      <pattern id="a-foam" width="32" height="32" patternUnits="userSpaceOnUse">
        <rect width="32" height="32" fill="#3c3148" />
        <path d="M0 0 L16 16 L0 32 Z M32 0 L16 16 L32 32 Z" fill="#46395a" />
        <path d="M0 0 L32 32 M32 0 L0 32" stroke="#2f2639" strokeWidth="1.5" />
      </pattern>
      <pattern id="a-plank-dark" width="160" height="32" patternUnits="userSpaceOnUse">
        <rect width="160" height="32" fill="#8f6748" />
        <rect y="16" width="160" height="16" fill="#86603f" />
        <path d="M0 0.5 H160 M0 16 H160 M56 0 V16 M120 16 V32 M10 16 V32" stroke="#6b4a31" strokeWidth="2" />
      </pattern>
      <pattern id="a-rug-purple" width="36" height="36" patternUnits="userSpaceOnUse">
        <rect width="36" height="36" fill="#6c4ab6" />
        <path d="M0 18 L18 0 L36 18 L18 36 Z" fill="none" stroke="#a98ae6" strokeWidth="3" />
        <circle cx="18" cy="18" r="3" fill="#f2d48a" />
      </pattern>
      <pattern id="a-rug-red" width="36" height="36" patternUnits="userSpaceOnUse">
        <rect width="36" height="36" fill="#a8323a" />
        <path d="M0 9 H36 M0 27 H36" stroke="#d65a5f" strokeWidth="4" />
        <circle cx="18" cy="18" r="2.6" fill="#f2d48a" />
      </pattern>
      <radialGradient id="a-glow">
        <stop offset="0" stopColor="#ffe3a3" stopOpacity="0.9" />
        <stop offset="1" stopColor="#ffe3a3" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

// ---------- outside ----------

/** An autumn tree: soft round canopy in peach and orange, now and then a green one. */
export function Tree({ x, y, s = 1, tone = 0 }: { x: number; y: number; s?: number; tone?: number }) {
  const sets = [
    ["#f2a07b", "#e07b56", "#f8c3a0"],
    ["#f0b26b", "#d98d45", "#f8d39b"],
    ["#e8845f", "#c9603f", "#f4a888"],
    ["#8fbf68", "#6e9e4c", "#b5dc8a"],
    ["#f2a07b", "#e07b56", "#f8c3a0"],
  ];
  const [leaf, dark, light] = sets[tone % sets.length];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={LINE} strokeWidth="3.5" strokeLinejoin="round">
      <ellipse cx="6" cy="4" rx="30" ry="9" fill="#000" opacity="0.2" stroke="none" />
      <path d="M-5 2 V-20 Q0 -26 5 -20 V2 Z" fill="#7a4b36" />
      <path d="M-30 -30 Q-36 -52 -18 -60 Q-12 -80 8 -76 Q28 -82 32 -60 Q46 -48 34 -30 Q30 -16 12 -18 Q0 -10 -12 -18 Q-28 -14 -30 -30 Z" fill={leaf} />
      <path d="M-22 -26 Q-6 -16 8 -22 Q24 -18 30 -32" fill="none" stroke={dark} strokeWidth="5" strokeLinecap="round" />
      <path d="M-14 -58 Q-4 -68 10 -64" fill="none" stroke={light} strokeWidth="6" strokeLinecap="round" />
      <circle cx="18" cy="-46" r="4" fill={light} stroke="none" />
    </g>
  );
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <ellipse cx="2" cy="2" rx="10" ry="4" fill="#000" opacity="0.25" stroke="none" />
      <rect x="-3" y="-50" width="6" height="52" fill="#4a3b4f" />
      <path d="M-3 -50 Q-3 -60 10 -60 H16" fill="none" strokeWidth="5" stroke="#4a3b4f" />
      <path d="M-3 -50 Q-3 -60 10 -60 H16" fill="none" />
      <path d="M10 -60 h14 l-3 9 h-8 z" fill="#ffe3a3" />
    </g>
  );
}

export function Plant({ x, y, s = 1, seed = 0 }: { x: number; y: number; s?: number; seed?: number }) {
  const pot = ["#c96f45", "#7cc6c0", "#f19aa8", "#e7b85a"][seed % 4];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <ellipse cx="2" cy="2" rx="13" ry="4" fill="#000" opacity="0.2" stroke="none" />
      <path d="M-10 -14 h20 l-3 16 h-14 z" fill={pot} />
      <path d="M0 -14 Q-16 -22 -14 -36 Q-4 -30 0 -16 Q2 -34 12 -38 Q16 -24 2 -14" fill="#6fae52" />
      <path d="M0 -15 Q-6 -28 -2 -40" fill="none" stroke="#4f8a3a" strokeWidth="3" />
    </g>
  );
}

function Crates({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <rect x="-2" y="-2" width="44" height="10" rx="4" fill="#000" opacity="0.18" stroke="none" />
      <rect x="0" y="-26" width="26" height="26" fill="#b4673f" />
      <path d="M0 -26 L26 0 M0 -13 H26" strokeWidth="2.2" />
      <rect x="20" y="-18" width="20" height="18" fill="#c98050" />
      <path d="M20 -9 H40" strokeWidth="2.2" />
      <rect x="6" y="-44" width="20" height="18" fill="#d99461" />
    </g>
  );
}

function Bin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <ellipse cx="2" cy="2" rx="14" ry="4" fill="#000" opacity="0.2" stroke="none" />
      <path d="M-11 -26 h22 l-2 28 h-18 z" fill="#8c9a9e" />
      <rect x="-13" y="-31" width="26" height="7" rx="2" fill="#a7b4b8" />
      <path d="M-4 -20 v16 M4 -20 v16" strokeWidth="2" />
      <path d="M8 -34 q6 -4 10 2" fill="none" stroke="#7fae4c" />
    </g>
  );
}

function Vending({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <rect x="-2" y="-4" width="40" height="10" rx="4" fill="#000" opacity="0.2" stroke="none" />
      <rect x="0" y="-58" width="34" height="58" rx="3" fill="#e2453c" />
      <rect x="4" y="-52" width="18" height="30" fill="#ffe3a3" />
      <path d="M4 -42 h18 M4 -32 h18" strokeWidth="2" />
      <rect x="25" y="-50" width="5" height="12" fill="#2b1d2e" strokeWidth="0" />
      <rect x="4" y="-16" width="26" height="9" fill="#2b1d2e" strokeWidth="0" />
    </g>
  );
}

function Bench({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <rect x="-28" y="-2" width="60" height="9" rx="4" fill="#000" opacity="0.18" stroke="none" />
      <rect x="-28" y="-24" width="56" height="9" rx="3" fill="#b4673f" />
      <rect x="-28" y="-13" width="56" height="9" rx="3" fill="#c98050" />
      <path d="M-22 -4 v6 M22 -4 v6" strokeWidth="4" />
    </g>
  );
}

function Bike({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" fill="none" strokeLinejoin="round">
      <circle cx="-14" cy="-10" r="10" fill="#f6e7cf" />
      <circle cx="16" cy="-10" r="10" fill="#f6e7cf" />
      <path d="M-14 -10 L-2 -26 L12 -26 L16 -10 M-2 -26 L2 -10 L12 -26 M12 -26 l-2 -6 h6" stroke="#2f8f9a" strokeWidth="3.5" />
    </g>
  );
}

function Board({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <path d="M-12 0 L-6 -30 H6 L12 0" fill="#7a4b36" />
      <rect x="-9" y="-28" width="18" height="22" fill={color} />
      <path d="M-5 -22 h10 M-5 -16 h7" strokeWidth="2" />
    </g>
  );
}

/** Things lying about in a yard, picked from the building's id so each street looks different. */
function YardProps({ yard, id, color }: { yard: Rect; id: string; color: string }) {
  const rand = rng(hashString(id + "yard"));
  const left = yard.x + 18;
  const right = yard.x + yard.w - 18;
  const by = yard.y + yard.h - 14;
  const pieces: ReactNode[] = [];
  const kinds = ["crates", "bin", "vending", "bench", "bike", "plants", "board"];
  const pickA = kinds[Math.floor(rand() * kinds.length)];
  let pickB = kinds[Math.floor(rand() * kinds.length)];
  if (pickB === pickA) pickB = "plants";
  const place = (k: string, x: number, flip: boolean) => {
    const key = `${k}${x}`;
    if (k === "crates") return <Crates key={key} x={flip ? x - 40 : x} y={by} />;
    if (k === "bin") return <Bin key={key} x={x} y={by} />;
    if (k === "vending") return <Vending key={key} x={flip ? x - 34 : x} y={by - 4} />;
    if (k === "bench") return <Bench key={key} x={flip ? x - 30 : x + 30} y={by} />;
    if (k === "bike") return <Bike key={key} x={flip ? x - 20 : x + 20} y={by} />;
    if (k === "board") return <Board key={key} x={x} y={by} color={soft(color, 0.3)} />;
    return (
      <g key={key}>
        <Plant x={x} y={by} seed={1} />
        <Plant x={flip ? x - 26 : x + 26} y={by + 4} s={0.8} seed={2} />
      </g>
    );
  };
  pieces.push(place(pickA, left, false), place(pickB, right, true));
  // a few fallen leaves
  for (let i = 0; i < 7; i++) {
    const lx = yard.x + rand() * yard.w;
    const ly = yard.y + rand() * yard.h;
    pieces.push(<path key={`l${i}`} d={`M${lx} ${ly} l7 -3 l-2 7 z`} fill={rand() < 0.5 ? "#e8845f" : "#f0b26b"} />);
  }
  return <g>{pieces}</g>;
}

/** What sits on the roof: AC units, vents, a water tank, a satellite dish… */
function RoofClutter({ r, roofH, id, kind, roof }: { r: Rect; roofH: number; id: string; kind: string; roof: string }) {
  const rand = rng(hashString(id + "roof"));
  const items: ReactNode[] = [];
  const top = r.y + 10;
  const ac = (x: number, y: number, k: string) => (
    <g key={k} transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <rect x="3" y="4" width="40" height="28" rx="3" fill="#000" opacity="0.18" stroke="none" />
      <rect width="38" height="26" rx="3" fill="#cfd6d3" />
      <circle cx="19" cy="13" r="8" fill="#9aa5a2" />
      <path d="M13 13 h12 M19 7 v12" strokeWidth="2" />
    </g>
  );
  const vent = (x: number, y: number, k: string) => (
    <g key={k} transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <rect x="-8" y="-4" width="16" height="22" fill="#8c9a9e" />
      <ellipse cx="0" cy="-4" rx="10" ry="5" fill="#a7b4b8" />
    </g>
  );
  const tank = (x: number, y: number, k: string) => (
    <g key={k} transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <ellipse cx="4" cy="30" rx="24" ry="7" fill="#000" opacity="0.18" stroke="none" />
      <path d="M-18 0 V26 Q0 34 18 26 V0" fill="#7cc6c0" />
      <ellipse cx="0" cy="0" rx="18" ry="7" fill="#9ad8d2" />
    </g>
  );
  const dish = (x: number, y: number, k: string) => (
    <g key={k} transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <ellipse cx="2" cy="22" rx="14" ry="5" fill="#000" opacity="0.18" stroke="none" />
      <path d="M-4 22 L0 8 L4 22 Z" fill="#8c9a9e" />
      <path d="M-18 -4 Q-14 18 10 14 Q22 10 18 -8 Z" fill="#eef1f0" />
      <path d="M0 6 L10 -12" strokeWidth="2.5" />
      <circle cx="10" cy="-13" r="3.5" fill="#e2453c" />
    </g>
  );
  const pick = [ac, vent, tank, dish];
  const n = 2 + Math.floor(rand() * 2);
  const slots = [r.x + 26, r.x + r.w - 70, r.x + 70, r.x + r.w - 26];
  for (let i = 0; i < n; i++) items.push(pick[Math.floor(rand() * pick.length)](slots[i], top + rand() * (roofH * 0.25), `c${i}`));
  if (kind === "video") items.push(dish(r.x + r.w - 40, top + 8, "kd"), dish(r.x + r.w - 76, top + 14, "kd2"));
  if (kind === "weapons")
    items.push(
      <g key="ch" stroke={LINE} strokeWidth="3.5">
        <rect x={r.x + r.w - 58} y={r.y - 20} width="26" height="34" fill="url(#a-stone)" />
        <rect x={r.x + r.w - 62} y={r.y - 24} width="34" height="8" fill="#837474" />
      </g>,
    );
  // laundry line across one roof in three
  if (rand() < 0.35)
    items.push(
      <g key="ln" stroke={LINE} strokeWidth="2.5">
        <path d={`M${r.x + 40} ${top + roofH * 0.42} Q${r.x + r.w / 2} ${top + roofH * 0.52} ${r.x + r.w - 40} ${top + roofH * 0.42}`} fill="none" />
        <rect x={r.x + r.w / 2 - 40} y={top + roofH * 0.46} width="18" height="20" fill="#f19aa8" />
        <rect x={r.x + r.w / 2 + 6} y={top + roofH * 0.47} width="22" height="16" fill="#ffe3a3" />
      </g>,
    );
  return <g>{items}</g>;
}

const SIGN: Record<string, string> = { client: "#ffd166", video: "#ffd166", acquisition: "#ff6b6b", creative: "#e9d5ff", weapons: "#ffd166", armor: "#7cc6c0", custom: "#f6e7cf" };

/** How much of a building's height is roof (seen from above). The Ad Creative Studio has two storeys, so less roof. */
export const roofFrac = (kind: string) => (kind === "creative" ? 0.3 : 0.44);
/** Where the sign board sits below the top of the front wall. */
const signDrop = (kind: string) => (kind === "creative" ? 44 : 10);

/** A building from above with its front wall showing. */
function House({ r, info, door }: { r: Rect; info: HouseInfo; door: Rect }) {
  if (info.kind === "home") return <Cottage r={r} info={info} door={door} />;
  const roofH = Math.round(r.h * roofFrac(info.kind));
  const fy = r.y + roofH; // top of the front wall
  const fh = r.h - roofH;
  const storey = info.kind === "creative";
  const stone = info.kind === "weapons";
  const roof = info.kind === "custom" || info.kind === "client" ? shade(info.color, -0.08) : info.color;
  const wall = stone ? "#b8a9a8" : soft(info.color, 0.62);
  const wallDark = shade(wall, -0.18);
  const rand = rng(hashString(info.id));
  const lit = info.busy > 0;
  const winFill = lit ? "#ffe3a3" : "#5d6f8f";
  const awning = shade(info.color, -0.05);
  const cx = r.x + r.w / 2;
  const signW = Math.min(r.w - 120, 190);
  const upperY = fy + signDrop(info.kind);
  const lowerY = upperY + 42;
  const shopH = r.y + r.h - 4 - (lowerY + 14);
  const winW = 40;
  const win = (x: number, y: number, k: string, h = 30) => (
    <g key={k}>
      <rect x={x - 4} y={y - 4} width={winW + 8} height={h + 8} rx="3" fill={shade(wall, -0.3)} />
      <rect x={x} y={y} width={winW} height={h} rx="2" fill={winFill} />
      <path d={`M${x + winW / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + winW}`} strokeWidth="2.4" />
      {!lit && <path d={`M${x + 6} ${y + 10} l9 -7`} stroke="#a9bfe3" strokeWidth="3" />}
      {/* planter */}
      <rect x={x - 4} y={y + h + 2} width={winW + 8} height="7" rx="2" fill="#a86a43" />
      <path d={`M${x} ${y + h + 2} q4 -8 8 0 q4 -8 8 0 q4 -8 8 0 q4 -8 8 0 q4 -8 8 0`} fill="#6fae52" strokeWidth="2" />
    </g>
  );
  const shopWin = (x: number, w: number, k: string) => (
    <g key={k}>
      <rect x={x} y={lowerY + 14} width={w} height={shopH} rx="2" fill={winFill} />
      <path d={`M${x + w / 2} ${lowerY + 14} V${lowerY + 14 + shopH}`} strokeWidth="2.4" />
      <path d={`M${x + 6} ${lowerY + 24} l12 -8 M${x + 6} ${lowerY + 34} l8 -6`} stroke={lit ? "#fff3cf" : "#a9bfe3"} strokeWidth="3" />
      {/* striped awning */}
      <path d={`M${x - 6} ${lowerY + 14} L${x + 2} ${lowerY} H${x + w - 2} L${x + w + 6} ${lowerY + 14} Z`} fill={awning} />
      {Array.from({ length: Math.floor(w / 14) }, (_, i) => (
        <path key={i} d={`M${x + 4 + i * 14} ${lowerY + 1} L${x + i * 14} ${lowerY + 14} H${x + 7 + i * 14} L${x + 10 + i * 14} ${lowerY + 1} Z`} fill="#f6e7cf" strokeWidth="0" />
      ))}
      <path d={`M${x - 6} ${lowerY + 14} q${(w + 12) / 8} 7 ${(w + 12) / 4} 0 t${(w + 12) / 4} 0 t${(w + 12) / 4} 0 t${(w + 12) / 4} 0`} fill={awning} />
    </g>
  );
  return (
    <g stroke={LINE} strokeWidth={SW} strokeLinejoin="round">
      {/* shadow */}
      <rect x={r.x + 14} y={r.y + 14} width={r.w} height={r.h} rx="6" fill="#000" opacity="0.2" stroke="none" />
      {/* front wall */}
      <rect x={r.x} y={fy - 6} width={r.w} height={fh + 6} fill={stone ? "url(#a-stone)" : wall} />
      {!stone && <path d={`M${r.x} ${upperY + 34} H${r.x + r.w}`} stroke={wallDark} strokeWidth="3" />}
      {/* the Ad Creative Studio's upper floor: a row of windows over a balcony with string lights */}
      {storey && (
        <g>
          {[0, 1, 2, 3].map((i) => win(r.x + 18 + i * ((r.w - 36 - winW) / 3), fy + 6, `u${i}`, 20))}
          <rect x={r.x + 6} y={fy + 36} width={r.w - 12} height="6" fill={shade(info.color, -0.3)} />
          {Array.from({ length: 14 }, (_, i) => (
            <path key={`rail${i}`} d={`M${r.x + 10 + i * ((r.w - 20) / 13)} ${fy + 36} v-8`} strokeWidth="2.4" />
          ))}
          <path d={`M${r.x + 4} ${fy + 2} Q${r.x + r.w / 2} ${fy + 22} ${r.x + r.w - 4} ${fy + 2}`} fill="none" strokeWidth="2" />
          {Array.from({ length: 9 }, (_, i) => {
            const t = (i + 0.5) / 9;
            return <circle key={`bulb${i}`} cx={r.x + 4 + t * (r.w - 8)} cy={fy + 2 + 4 * t * (1 - t) * 10 + 3} r="3.6" fill={["#ffd166", "#f19aa8", "#9ad8d2", "#c5e5a5"][i % 4]} strokeWidth="1.8" />;
          })}
        </g>
      )}
      <rect x={r.x} y={r.y + r.h - 12} width={r.w} height="12" fill={shade(wall, -0.35)} />
      {/* upper windows either side of the sign */}
      {win(r.x + 16, upperY, "w1")}
      {win(r.x + r.w - 16 - winW, upperY, "w2")}
      {/* sign board (its words are drawn on top as text) */}
      <rect x={cx - signW / 2} y={upperY - 2} width={signW} height="32" rx="5" fill={SIGN[info.kind] ?? "#f6e7cf"} />
      <rect x={cx - signW / 2 + 5} y={upperY + 3} width={signW - 10} height="22" rx="3" fill="none" stroke={shade(SIGN[info.kind] ?? "#f6e7cf", -0.25)} strokeWidth="2" />
      {/* shop windows with awnings */}
      {shopWin(r.x + 18, 74, "s1")}
      {shopWin(r.x + r.w - 18 - 74, 74, "s2")}
      {/* door, with its own little awning and steps */}
      <rect x={door.x - 8} y={lowerY + 4} width={door.w + 16} height={r.y + r.h - lowerY - 10} rx="4" fill={shade(wall, -0.32)} />
      <rect x={door.x} y={lowerY + 12} width={door.w} height={r.y + r.h - lowerY - 22} rx="3" fill={info.kind === "weapons" ? "#5b3a29" : shade(info.color, -0.35)} />
      <rect x={door.x + 7} y={lowerY + 20} width={door.w - 14} height="16" rx="2" fill={winFill} strokeWidth="2.4" />
      <circle cx={door.x + door.w - 9} cy={r.y + r.h - 34} r="3" fill="#ffd166" strokeWidth="2" />
      <path d={`M${door.x - 14} ${lowerY + 6} H${door.x + door.w + 14} L${door.x + door.w + 6} ${lowerY - 4} H${door.x - 6} Z`} fill={shade(info.color, -0.2)} />
      <rect x={door.x - 12} y={r.y + r.h - 10} width={door.w + 24} height="10" fill="#c9b9a5" />
      <rect x={door.x - 18} y={r.y + r.h} width={door.w + 36} height="9" fill="#b3a28d" />
      {/* drain pipe and wall box */}
      <path d={`M${r.x + 8} ${fy - 4} V${r.y + r.h - 12}`} stroke="#8c9a9e" strokeWidth="7" />
      <path d={`M${r.x + 8} ${fy - 4} V${r.y + r.h - 12}`} stroke={LINE} strokeWidth="2" strokeOpacity="0.6" fill="none" />
      {rand() < 0.6 && <rect x={r.x + r.w - 44} y={fy + 48} width="28" height="20" rx="2" fill="#cfd6d3" />}
      {/* posters */}
      <rect x={door.x - 34} y={lowerY + 26} width="18" height="24" fill="#f19aa8" strokeWidth="2.5" transform={`rotate(-4 ${door.x - 25} ${lowerY + 38})`} />
      <rect x={door.x + door.w + 16} y={lowerY + 28} width="18" height="22" fill="#9ad8d2" strokeWidth="2.5" transform={`rotate(3 ${door.x + door.w + 25} ${lowerY + 38})`} />
      {/* roof */}
      <rect x={r.x - 8} y={r.y} width={r.w + 16} height={roofH} rx="4" fill={roof} />
      <rect x={r.x - 8} y={r.y} width={r.w + 16} height={roofH} rx="4" fill="url(#a-tile)" strokeWidth="0" />
      <path d={`M${r.x + 6} ${r.y + 8} H${r.x + r.w - 6}`} stroke={shade(roof, 0.35)} strokeWidth="5" strokeLinecap="round" />
      <rect x={r.x - 10} y={fy - 10} width={r.w + 20} height="12" rx="3" fill={shade(roof, -0.3)} />
      <RoofClutter r={r} roofH={roofH} id={info.id} kind={info.kind} roof={roof} />
      {/* rooftop board for the emblem (a client's emblem portrait is drawn on top) */}
      <rect x={cx - 34} y={r.y + 6} width="68" height="56" fill="#a8743f" />
      <rect x={cx - 28} y={r.y + 12} width="56" height="44" fill="#f3e2c0" strokeWidth="2.5" />
      {info.kind !== "client" && <Icon name={KIND_ICON[info.kind] ?? "home"} x={cx - 19} y={r.y + 15} size={38} color={shade(info.color, -0.4)} strokeWidth={2.6} />}
      <path d={`M${cx - 20} ${r.y + 62} v8 M${cx + 20} ${r.y + 62} v8`} strokeWidth="4" />
      {info.kind === "video" && (
        <g transform={`translate(${r.x + 44} ${r.y + roofH * 0.42})`} strokeWidth="3.5">
          <path d="M-20 22 L-30 36 M20 22 L30 36" strokeWidth="4" />
          <circle r="25" fill="#2b2d42" />
          <circle r="21" fill="#4a4e69" strokeWidth="2.5" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={Math.cos((i * 2 * Math.PI) / 5) * 12} cy={Math.sin((i * 2 * Math.PI) / 5) * 12} r="5" fill="#ffd166" strokeWidth="2" />
          ))}
          <circle r="3.5" fill="#f6e7cf" strokeWidth="2" />
          <path d="M22 8 C40 10 46 24 62 18 L64 30 C46 36 40 22 22 20 Z" fill="#2b2d42" strokeWidth="2.5" />
        </g>
      )}
      {/* hanging side banner */}
      <rect x={r.x + r.w + 2} y={fy - 2} width="22" height="86" rx="3" fill={SIGN[info.kind] ?? "#f6e7cf"} />
      <path d={`M${r.x + r.w} ${fy + 4} h4 M${r.x + r.w} ${fy + 76} h4`} strokeWidth="4" />
      {/* kind extras out front */}
      {info.kind === "weapons" && (
        <g transform={`translate(${r.x + r.w - 40} ${r.y + r.h + 26})`}>
          <path d="M-18 0 h36 l-6 -10 h-24 z" fill="#4a3b4f" />
          <rect x="-12" y="-18" width="24" height="9" fill="#6b5a70" />
          <path d="M22 -2 V-40 M30 -2 V-36" stroke="#cfd6d3" strokeWidth="5" />
        </g>
      )}
      {info.kind === "armor" && (
        <g transform={`translate(${r.x + 40} ${r.y + r.h + 30})`}>
          <path d="M0 0 V-14" strokeWidth="4" />
          <path d="M-14 -14 Q-16 -40 0 -44 Q16 -40 14 -14 Z" fill="#9aa5a2" />
          <circle cx="0" cy="-50" r="8" fill="#cfd6d3" />
        </g>
      )}
    </g>
  );
}

/** Your home: a small timber cottage with a gabled roof, a smoking chimney and flower boxes. */
function Cottage({ r, info, door }: { r: Rect; info: HouseInfo; door: Rect }) {
  const roofH = Math.round(r.h * 0.5);
  const fy = r.y + roofH;
  const cx = r.x + r.w / 2;
  const roof = info.color;
  const beam = "#6b4226";
  const winFill = info.busy > 0 ? "#ffe3a3" : "#ffe9b8";
  const pane = (x: number, k: string) => (
    <g key={k}>
      <rect x={x - 10} y={fy + 22} width="10" height="34" fill="#5e8f4e" strokeWidth="2.5" />
      <rect x={x + 36} y={fy + 22} width="10" height="34" fill="#5e8f4e" strokeWidth="2.5" />
      <rect x={x} y={fy + 22} width="36" height="34" rx="3" fill={winFill} />
      <path d={`M${x + 18} ${fy + 22} V${fy + 56} M${x} ${fy + 39} H${x + 36}`} strokeWidth="2.4" />
      <rect x={x - 4} y={fy + 57} width="44" height="8" rx="2" fill="#a86a43" />
      <path d={`M${x} ${fy + 57} q4 -8 8 0 q4 -9 8 0 q4 -8 8 0 q4 -9 8 0 q4 -8 8 0`} fill="#6fae52" strokeWidth="2" />
      <circle cx={x + 8} cy={fy + 53} r="3" fill="#f19aa8" strokeWidth="1.5" />
      <circle cx={x + 26} cy={fy + 52} r="3" fill="#ffd166" strokeWidth="1.5" />
    </g>
  );
  return (
    <g stroke={LINE} strokeWidth={SW} strokeLinejoin="round">
      <rect x={r.x + 12} y={r.y + 14} width={r.w} height={r.h} rx="6" fill="#000" opacity="0.2" stroke="none" />
      {/* chimney behind the roof, with smoke */}
      <rect x={r.x + r.w - 54} y={r.y - 26} width="26" height="50" fill="url(#a-stone)" />
      <rect x={r.x + r.w - 58} y={r.y - 30} width="34" height="8" fill="#837474" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={r.x + r.w - 40 + i * 9} cy={r.y - 44 - i * 16} r={9 + i * 3} fill="#f6efe6" opacity={0.85 - i * 0.2} strokeWidth="2.5" className="fog" />
      ))}
      {/* front wall: plaster with timber beams */}
      <rect x={r.x} y={fy - 4} width={r.w} height={r.h - roofH + 4} fill="#f3e2c4" />
      <path d={`M${r.x + 4} ${fy} V${r.y + r.h} M${r.x + r.w - 4} ${fy} V${r.y + r.h} M${r.x} ${fy + 14} H${r.x + r.w}`} stroke={beam} strokeWidth="7" />
      <path d={`M${r.x + 4} ${fy} V${r.y + r.h} M${r.x + r.w - 4} ${fy} V${r.y + r.h} M${r.x} ${fy + 14} H${r.x + r.w}`} strokeWidth="2" strokeOpacity="0.6" fill="none" />
      <rect x={r.x} y={r.y + r.h - 12} width={r.w} height="12" fill="url(#a-stone)" />
      {pane(r.x + 22, "wl")}
      {pane(r.x + r.w - 58, "wr")}
      {/* door with a round top, the house sign above it, and a step */}
      <path d={`M${door.x - 4} ${r.y + r.h - 6} V${fy + 40} Q${door.x + door.w / 2} ${fy + 18} ${door.x + door.w + 4} ${fy + 40} V${r.y + r.h - 6} Z`} fill="#8a5636" />
      <path d={`M${door.x + door.w / 2} ${fy + 30} V${r.y + r.h - 8}`} strokeWidth="2.4" />
      <circle cx={door.x + door.w - 10} cy={r.y + r.h - 30} r="3" fill="#ffd166" strokeWidth="2" />
      <rect x={door.x - 10} y={r.y + r.h - 8} width={door.w + 20} height="10" fill="#c9b9a5" />
      {/* gabled roof */}
      <path d={`M${r.x - 14} ${fy + 2} L${r.x + 26} ${r.y} H${r.x + r.w - 26} L${r.x + r.w + 14} ${fy + 2} Z`} fill={roof} />
      <path d={`M${r.x - 14} ${fy + 2} L${r.x + 26} ${r.y} H${r.x + r.w - 26} L${r.x + r.w + 14} ${fy + 2} Z`} fill="url(#a-tile)" strokeWidth="0" />
      <path d={`M${r.x + 30} ${r.y + 6} H${r.x + r.w - 30}`} stroke={shade(roof, 0.35)} strokeWidth="5" strokeLinecap="round" />
      <rect x={r.x - 16} y={fy - 4} width={r.w + 32} height="10" rx="3" fill={shade(roof, -0.3)} />
      {/* round attic window */}
      <circle cx={cx} cy={r.y + roofH * 0.5} r="15" fill={winFill} />
      <path d={`M${cx - 15} ${r.y + roofH * 0.5} H${cx + 15} M${cx} ${r.y + roofH * 0.5 - 15} V${r.y + roofH * 0.5 + 15}`} strokeWidth="2.4" />
    </g>
  );
}

/** The cottage's picket fence (with a gap for the path) and its mailbox. */
function Fence({ area, door }: { area: Rect; door: Rect }) {
  const y = area.y + area.h - 20;
  const gapL = door.x - 22;
  const gapR = door.x + door.w + 22;
  const run = (x0: number, x1: number, k: string) => (
    <g key={k}>
      <rect x={x0} y={y - 14} width={x1 - x0} height="6" fill="#f6efe6" strokeWidth="2.4" />
      {Array.from({ length: Math.max(1, Math.floor((x1 - x0) / 16)) }, (_, i) => (
        <path key={i} d={`M${x0 + 4 + i * 16} ${y + 4} V${y - 22} l4 -6 l4 6 V${y + 4} Z`} fill="#f6efe6" strokeWidth="2.4" />
      ))}
    </g>
  );
  return (
    <g stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      {run(area.x + 12, gapL, "l")}
      {run(gapR, area.x + area.w - 12, "r")}
      <g transform={`translate(${gapR + 30} ${y - 30})`}>
        <path d="M0 30 V4" strokeWidth="5" />
        <path d="M-14 4 V-10 Q-14 -20 0 -20 Q14 -20 14 -10 V4 Z" fill="#4f86c6" />
        <path d="M14 -16 h8 v8 h-8" fill="#e2453c" strokeWidth="2.4" />
      </g>
    </g>
  );
}

function Fountain({ f }: { f: CityLayout["fountain"] }) {
  return (
    <g stroke={LINE} strokeWidth={SW} strokeLinejoin="round">
      <ellipse cx={f.x + 10} cy={f.y + 14} rx={f.r * 1.05} ry={f.r * 0.72} fill="#000" opacity="0.18" stroke="none" />
      <ellipse cx={f.x} cy={f.y} rx={f.r} ry={f.r * 0.7} fill="url(#a-stone)" />
      <ellipse cx={f.x} cy={f.y - 4} rx={f.r - 12} ry={f.r * 0.7 - 12} fill="#69c3c6" strokeWidth="3" />
      <path d={`M${f.x - f.r * 0.5} ${f.y - 2} q10 -6 20 0 M${f.x + f.r * 0.2} ${f.y + 10} q10 -6 20 0`} stroke="#b6ece8" strokeWidth="3" fill="none" />
      <rect x={f.x - 9} y={f.y - 46} width="18" height="40" rx="5" fill="#cfc2bd" />
      <ellipse cx={f.x} cy={f.y - 46} rx="16" ry="7" fill="#e2d7d2" />
    </g>
  );
}

function Stall({ x, y, color, seed }: { x: number; y: number; color: string; seed: number }) {
  const fruit = ["#e2453c", "#f0b26b", "#8fbf68", "#f19aa8"];
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3.5" strokeLinejoin="round">
      <rect x="-4" y="2" width="96" height="12" rx="5" fill="#000" opacity="0.2" stroke="none" />
      <rect x="0" y="-30" width="88" height="32" fill="#b4673f" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={6 + i * 28} y="-40" width="22" height="14" fill="#d99461" strokeWidth="2.5" />
          {[0, 1, 2].map((j) => (
            <circle key={j} cx={11 + i * 28 + j * 6} cy="-42" r="4.5" fill={fruit[(seed + i + j) % fruit.length]} strokeWidth="2" />
          ))}
        </g>
      ))}
      <path d="M-6 -58 L6 -76 H82 L94 -58 Z" fill={color} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${10 + i * 16} -76 L${4 + i * 16} -58 H${12 + i * 16} L${18 + i * 16} -76 Z`} fill="#f6e7cf" strokeWidth="0" />
      ))}
      <path d="M-6 -58 q12 8 25 0 t25 0 t25 0 t25 0" fill={color} />
      <path d="M2 -58 V-30 M86 -58 V-30" strokeWidth="4" />
    </g>
  );
}

/** The sealed gate to the Hollow Wilds: a stone wall, a chained iron gate, hazard paint and fog. */
function Gate({ r }: { r: Rect }) {
  const cx = r.x + r.w / 2;
  return (
    <g stroke={LINE} strokeWidth={SW} strokeLinejoin="round">
      <rect x={r.x - 70} y={-10} width={r.w + 140} height={r.h + 6} fill="#2a1f3d" stroke="none" />
      <ellipse cx={cx} cy={r.h - 6} rx={r.w * 0.9} ry="26" fill="#9aa0b4" opacity="0.35" stroke="none" className="fog" />
      <rect x={r.x - 70} y={-6} width="64" height={r.h + 4} fill="url(#a-stone)" />
      <rect x={r.x + r.w + 6} y={-6} width="64" height={r.h + 4} fill="url(#a-stone)" />
      <rect x={r.x - 76} y={r.h - 14} width="76" height="14" fill="#837474" />
      <rect x={r.x + r.w} y={r.h - 14} width="76" height="14" fill="#837474" />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${r.x + 8 + i * ((r.w - 16) / 6)} 0 V${r.h - 4}`} stroke="#3a3346" strokeWidth="7" />
      ))}
      <path d={`M${r.x} ${r.h * 0.3} H${r.x + r.w} M${r.x} ${r.h * 0.72} H${r.x + r.w}`} stroke="#3a3346" strokeWidth="7" />
      <path d={`M${r.x + 4} ${r.h * 0.18} L${r.x + r.w - 4} ${r.h * 0.82} M${r.x + r.w - 4} ${r.h * 0.18} L${r.x + 4} ${r.h * 0.82}`} stroke="#b08d57" strokeWidth="6" strokeDasharray="9 4" />
      <rect x={cx - 12} y={r.h * 0.5 - 12} width="24" height="22" rx="3" fill="#b08d57" />
      {/* hazard stripes along the bottom */}
      <rect x={r.x - 4} y={r.h - 12} width={r.w + 8} height="12" fill="#ffd166" />
      {Array.from({ length: Math.ceil(r.w / 18) }, (_, i) => (
        <path key={`h${i}`} d={`M${r.x + i * 18} ${r.h} l10 -12 h8 l-10 12 z`} fill={LINE} strokeWidth="0" />
      ))}
      {/* torn warning posters on the wall */}
      <rect x={r.x - 58} y="14" width="24" height="30" fill="#f6e7cf" strokeWidth="2.5" transform={`rotate(-6 ${r.x - 46} 29)`} />
      <rect x={r.x + r.w + 28} y="18" width="24" height="30" fill="#f19aa8" strokeWidth="2.5" transform={`rotate(5 ${r.x + r.w + 40} 33)`} />
      {/* the danger sign (its words are text on top) */}
      <rect x={cx - 76} y={r.h + 18} width="152" height="46" rx="5" fill="#ffd166" transform={`rotate(-3 ${cx} ${r.h + 41})`} />
      <path d={`M${cx - 50} ${r.h + 64} v16 M${cx + 50} ${r.h + 60} v16`} strokeWidth="5" />
    </g>
  );
}

/** Sidewalk and road along each street. */
function Streets({ L }: { L: CityLayout }) {
  return (
    <g>
      {L.roads.map((r, i) => (
        <rect key={`s${i}`} x={r.x - 14} y={r.y - 14} width={r.w + 28} height={r.h + 28} fill="url(#a-brick)" />
      ))}
      {L.roads.map((r, i) => (
        <rect key={`c${i}`} x={r.x - 4} y={r.y - 4} width={r.w + 8} height={r.h + 8} fill="#d9c7a8" />
      ))}
      {L.roads.map((r, i) => (
        <rect key={`r${i}`} x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill="url(#a-road)" />
      ))}
      {L.roads.map((r, i) =>
        r.w > r.h ? (
          <path key={`d${i}`} d={`M${r.x + 20} ${r.y + r.h / 2} H${r.x + r.w - 20}`} stroke="#f4e3c1" strokeWidth="5" strokeDasharray="26 22" />
        ) : (
          <path key={`d${i}`} d={`M${r.x + r.w / 2} ${r.y + 20} V${r.y + r.h - 20}`} stroke="#f4e3c1" strokeWidth="5" strokeDasharray="26 22" />
        ),
      )}
    </g>
  );
}

export const CityArt = memo(function CityArt({ layout, houses }: { layout: CityLayout; houses: HouseInfo[] }) {
  const L = layout;
  const byId = new Map(houses.map((h) => [h.id, h]));
  const f = L.fountain;
  const P = L.plaza;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={L.w} height={L.h} viewBox={`0 0 ${L.w} ${L.h}`}>
      <Defs />
      <rect width={L.w} height={L.h} fill="url(#a-grass)" />
      <Streets L={L} />
      {/* lots: grass with a brick path from the door to the street */}
      {L.plots.map((p) => (
        <g key={p.buildingId} stroke={LINE} strokeWidth="3">
          <rect x={p.area.x} y={p.area.y} width={p.area.w} height={p.area.h} rx="10" fill="url(#a-grass)" />
          <rect x={p.door.x - 6} y={p.house.y + p.house.h + 8} width={p.door.w + 12} height={p.area.y + p.area.h - p.house.y - p.house.h + 6} fill="url(#a-brick)" />
        </g>
      ))}
      {/* plaza */}
      <rect x={P.x} y={P.y} width={P.w} height={P.h + 14} rx="16" fill="url(#a-mosaic)" stroke={LINE} strokeWidth="4" />
      <ellipse cx={f.x} cy={f.y + 8} rx={f.r * 2.1} ry={f.r * 1.45} fill="none" stroke="#7d7574" strokeWidth="12" />
      <Fountain f={f} />
      <Stall x={P.x + 18} y={P.y + P.h - 26} color="#e2453c" seed={0} />
      <Stall x={P.x + P.w - 106} y={P.y + P.h - 26} color="#2f8f9a" seed={2} />
      {/* bunting across the plaza */}
      <path d={`M${P.x + 8} ${P.y + 70} Q${P.x + P.w / 2} ${P.y + 110} ${P.x + P.w - 8} ${P.y + 70}`} fill="none" stroke={LINE} strokeWidth="2.5" />
      {Array.from({ length: 11 }, (_, i) => {
        const t = (i + 0.5) / 11;
        const x = P.x + 8 + t * (P.w - 16);
        const y = P.y + 70 + 4 * t * (1 - t) * 40;
        return <path key={i} d={`M${x - 7} ${y} h14 l-7 13 z`} fill={["#e2453c", "#ffd166", "#2f8f9a", "#f19aa8"][i % 4]} stroke={LINE} strokeWidth="2" />;
      })}
      {/* city name: a carved wooden sign on two posts (the name is text on top) */}
      <g stroke={LINE} strokeWidth="4">
        <rect x={P.x + P.w / 2 - 130} y={P.y + 30} width="10" height="40" fill="#6e4425" />
        <rect x={P.x + P.w / 2 + 120} y={P.y + 30} width="10" height="40" fill="#6e4425" />
        <rect x={P.x + P.w / 2 - 150} y={P.y + 6} width="300" height="54" fill="#a8743f" />
        <path d={`M${P.x + P.w / 2 - 146} ${P.y + 24} H${P.x + P.w / 2 + 146} M${P.x + P.w / 2 - 146} ${P.y + 42} H${P.x + P.w / 2 + 146}`} stroke="#8a5a32" strokeWidth="3" />
        <rect x={P.x + P.w / 2 - 150} y={P.y + 6} width="300" height="6" fill="#c9955a" strokeWidth="0" />
        {[-1, 1].map((k) => (
          <circle key={k} cx={P.x + P.w / 2 + k * 138} cy={P.y + 33} r="3" fill="#e4dacb" strokeWidth="1.5" />
        ))}
      </g>
      {[-1, 1].map((s) => (
        <Bench key={s} x={f.x + s * f.r * 2.4} y={f.y + 22} />
      ))}
      {[-1, 1].map((s) => (
        <Plant key={`p${s}`} x={f.x + s * f.r * 1.4} y={f.y - f.r * 0.9} seed={s + 2} />
      ))}
      {L.plots.map((p) => {
        const info = byId.get(p.buildingId);
        return info ? <YardProps key={`y${p.buildingId}`} yard={p.yard} id={p.buildingId} color={info.color} /> : null;
      })}
      {L.plots.map((p) => {
        const info = byId.get(p.buildingId);
        return info ? <House key={p.buildingId} r={p.house} info={info} door={p.door} /> : null;
      })}
      {L.plots.map((p) => (byId.get(p.buildingId)?.kind === "home" ? <Fence key={`f${p.buildingId}`} area={p.area} door={p.door} /> : null))}
      <Gate r={L.gate} />
      {L.lamps.map((l, i) => (
        <Lamp key={i} x={l.x} y={l.y} />
      ))}
      {L.trees.map((t, i) => (
        <Tree key={i} x={t.x} y={t.y} s={t.s} tone={i} />
      ))}
    </svg>
  );
});

const display: CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "0.02em", lineHeight: 1 };

/** Everything you read outside: building signs, emblems, the city name, the danger sign. */
export const CityLabels = memo(function CityLabels({ layout, houses, cityName }: { layout: CityLayout; houses: HouseInfo[]; cityName: string }) {
  const byId = new Map(houses.map((h) => [h.id, h]));
  const P = layout.plaza;
  const g = layout.gate;
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {layout.plots.map((p) => {
        const info = byId.get(p.buildingId);
        if (!info) return null;
        const r = p.house;
        const cx = r.x + r.w / 2;
        if (info.kind === "home")
          return (
            <div key={p.buildingId} className="absolute text-center px-2 pt-1 pb-0.5 rounded-md border-[3px] whitespace-nowrap" style={{ left: cx, top: r.y - 40, transform: "translateX(-50%)", background: "#f3e2c0", borderColor: LINE, color: LINE, boxShadow: `3px 3px 0 rgb(40 22 10 / 0.5)`, ...display, fontWeight: 600, fontSize: 18 }}>
              {short(info.name.toUpperCase(), 22)}
            </div>
          );
        const roofH = Math.round(r.h * roofFrac(info.kind));
        const signW = Math.min(r.w - 120, 190);
        const fy = r.y + roofH;
        return (
          <div key={p.buildingId}>
            <div className="absolute grid place-content-center text-center overflow-hidden whitespace-nowrap" style={{ left: cx - signW / 2, top: fy + signDrop(info.kind) - 2, width: signW, height: 32, ...display, fontSize: Math.max(13, Math.min(22, (signW - 14) / (Math.min(info.name.length, 24) * 0.62))), color: LINE }}>
              {short(info.name.toUpperCase(), 24)}
            </div>
            {info.kind === "client" && (
              <div className="absolute grid place-content-center" style={{ left: cx - 28, top: r.y + 10, width: 56, height: 48 }}>
                <Avatar value={info.avatar} seed={info.id} kind="emblem" size={44} />
              </div>
            )}
            <div className="absolute text-center" style={{ left: r.x + r.w + 2, top: fy + 3, width: 22, height: 80, ...display, fontSize: 12.5, lineHeight: "13px", color: LINE, writingMode: "vertical-rl", textOrientation: "upright", letterSpacing: "-0.2em" }}>
              {info.kind === "client" ? "OFFICE" : info.kind === "weapons" || info.kind === "armor" ? "SHOP" : info.kind === "custom" ? "HALL" : "STUDIO"}
            </div>
            {info.alert > 0 && (
              <div className="absolute alert-pop grid place-content-center rounded-full border-[3px]" style={{ left: cx + signW / 2 - 12, top: fy - 4, width: 30, height: 30, background: "#c0392b", borderColor: LINE, color: "#fff", ...display, fontSize: 20 }} title="Staff waiting on setup">
                {info.alert}
              </div>
            )}
            {info.kind === "video" && <Tag left={r.x + r.w - 96} top={r.y - 26} bg="#c0392b" fg="#fffaf0">ON AIR</Tag>}
            {info.kind === "creative" && <Tag left={r.x + 12} top={r.y - 26} bg="#a996d6" fg={LINE}>ADS LAB</Tag>}
            {info.kind === "acquisition" && <Tag left={r.x + 12} top={r.y - 26} bg="#d9703b" fg="#fffaf0">HIRING</Tag>}
            {(info.kind === "weapons" || info.kind === "armor") && <Tag left={r.x + 12} top={r.y - 26} bg="#f4c95d" fg={LINE}>OPEN</Tag>}
          </div>
        );
      })}
      <div className="absolute grid place-content-center text-center" style={{ left: P.x + P.w / 2 - 143, top: P.y + 12, width: 286, height: 42, ...display, fontWeight: 700, fontSize: 32, color: "#fbf1dc", textShadow: "3px 3px 0 #4e2f1d" }}>
        {short(cityName.toUpperCase(), 18)}
      </div>
      <div className="absolute text-center -rotate-3" style={{ left: g.x + g.w / 2 - 76, top: g.h + 20, width: 152, ...display, fontWeight: 700, color: "#c0392b" }}>
        <div style={{ fontSize: 24 }}>DANGER</div>
        <div style={{ fontSize: 14, color: LINE }}>DO NOT ENTER</div>
      </div>
    </div>
  );
});

function Tag({ left, top, bg, fg, children }: { left: number; top: number; bg: string; fg: string; children: ReactNode }) {
  return (
    <div className="absolute px-2 pt-1 pb-0.5 border-[3px]" style={{ left, top, background: bg, color: fg, borderColor: LINE, boxShadow: `3px 3px 0 rgb(40 22 10 / 0.5)`, ...display, fontWeight: 600, fontSize: 18 }}>
      {children}
    </div>
  );
}

/** Light pools for lamps and lit windows after dark. */
export const CityGlow = memo(function CityGlow({ layout, houses }: { layout: CityLayout; houses: HouseInfo[] }) {
  const busy = new Set(houses.filter((h) => h.busy > 0).map((h) => h.id));
  return (
    <svg width={layout.w} height={layout.h} className="absolute inset-0 block pointer-events-none" aria-hidden>
      <defs>
        <radialGradient id="a-glow2">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {layout.lamps.map((l, i) => (
        <circle key={i} cx={l.x + 18} cy={l.y - 50} r="90" fill="url(#a-glow2)" />
      ))}
      {layout.plots
        .filter((p) => busy.has(p.buildingId))
        .map((p) => (
          <ellipse key={p.buildingId} cx={p.house.x + p.house.w / 2} cy={p.house.y + p.house.h * 0.78} rx={p.house.w * 0.6} ry={p.house.h * 0.35} fill="url(#a-glow2)" />
        ))}
    </svg>
  );
});

// ---------- inside ----------

export interface InteriorInfo {
  name: string;
  color: string;
  /** Lines for the results screen */
  screen: { title: string; stats: [string, string][]; pct: number; feed: string[] };
  /** Sticky notes on the mission board */
  notes: { text: string; done: boolean }[];
  rooms: { id: string; name: string }[];
  /** Building kind: studios get their own look inside */
  kind: string;
  desks: { staffId: string; name: string; title: string; role: string; color: string; ready: boolean }[];
  reporter?: { name: string; title: string };
}

export function Bookshelf({ x, y, seed }: { x: number; y: number; seed: number }) {
  const rand = rng(seed);
  const books = ["#e2453c", "#2f8f9a", "#ffd166", "#a78bfa", "#8fbf68", "#f19aa8"];
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <rect x="0" y="0" width="64" height="80" fill="#8a5636" />
      {[0, 1, 2].map((row) => (
        <g key={row}>
          <rect x="5" y={6 + row * 25} width="54" height="20" fill="#5e3a26" strokeWidth="2" />
          {Array.from({ length: 6 }, (_, i) => {
            const h = 13 + rand() * 6;
            return <rect key={i} x={7 + i * 8.5} y={6 + row * 25 + 20 - h} width="7" height={h} fill={books[Math.floor(rand() * books.length)]} strokeWidth="1.8" />;
          })}
        </g>
      ))}
    </g>
  );
}

function WallLamp({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3">
      <circle cx="0" cy="8" r="30" fill="url(#a-glow)" stroke="none" />
      <rect x="-5" y="4" width="10" height="16" fill="#6b5a70" />
      <path d="M-7 4 Q0 -14 7 4 Z" fill="#ffd166" />
    </g>
  );
}

/** Things along the back wall of an office: windows, bookshelves and lamps. */
function OfficeWall({ L, seed }: { L: InteriorLayout; seed: number }) {
  const decor: ReactNode[] = [];
  let k = 0;
  for (let x = T * 0.8; x < L.w - T * 2; x += T * 2.4) {
    if (wallBusy(L, x, 70)) continue;
    const kind = k++ % 3;
    if (kind === 0) decor.push(<WallWindow key={x} x={x} />);
    else if (kind === 1) decor.push(<Bookshelf key={x} x={x} y={L.wall - 84} seed={seed + x} />);
    else decor.push(<WallLamp key={x} x={x + 30} y={30} />);
  }
  return <g>{decor}</g>;
}

/** Keeps decorations clear of the results screen and the mission board. */
const wallBusy = (L: InteriorLayout, x: number, w: number) => (x + w > L.screen.x - 30 && x < L.screen.x + L.screen.w + 30) || (x + w > L.board.x - 30 && x < L.board.x + L.board.w + 30);

function WallWindow({ x }: { x: number }) {
  return (
    <g stroke={LINE} strokeWidth="3.5">
      <rect x={x} y={18} width="64" height="52" rx="4" fill="#9fd3e6" />
      <path d={`M${x + 32} 18 V70 M${x} 44 H${x + 64}`} strokeWidth="2.5" />
      <path d={`M${x + 8} 34 l12 -10 M${x + 40} 60 l10 -8`} stroke="#fff" strokeWidth="4" />
      <rect x={x - 4} y={68} width="72" height="8" rx="2" fill="#a86a43" />
    </g>
  );
}

/** A framed ad poster: a headline bar, a picture and a button, like the studio's own work. */
function AdPoster({ x, y, tone }: { x: number; y: number; tone: number }) {
  const c = [["#ff7a59", "#ffd166"], ["#3fd0ff", "#f19aa8"], ["#5cf28b", "#b388ff"], ["#ffd166", "#ff5fae"]][tone % 4];
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="3">
      <rect x="-3" y="-3" width="50" height="64" rx="3" fill="#6b4226" />
      <rect width="44" height="58" fill="#f6e7cf" strokeWidth="2" />
      <rect x="5" y="5" width="34" height="8" fill={c[0]} strokeWidth="1.8" />
      <circle cx="22" cy="28" r="10" fill={c[1]} strokeWidth="1.8" />
      <rect x="10" y="44" width="24" height="8" rx="4" fill={c[0]} strokeWidth="1.8" />
    </g>
  );
}

/** Coloured bulbs strung along the top of the wall. */
function StringLights({ w, y = 10 }: { w: number; y?: number }) {
  const n = Math.floor(w / 46);
  const bulbs = ["#ffd166", "#f19aa8", "#9ad8d2", "#c5e5a5", "#ffb347"];
  return (
    <g stroke={LINE}>
      {Array.from({ length: n }, (_, i) => {
        const x0 = (i * w) / n;
        const x1 = ((i + 1) * w) / n;
        return <path key={`w${i}`} d={`M${x0} ${y} Q${(x0 + x1) / 2} ${y + 16} ${x1} ${y}`} fill="none" strokeWidth="2" />;
      })}
      {Array.from({ length: n }, (_, i) => {
        const x = ((i + 0.5) * w) / n;
        return (
          <g key={`b${i}`}>
            <circle cx={x} cy={y + 14} r="10" fill="url(#a-glow)" stroke="none" />
            <path d={`M${x - 3} ${y + 7} h6 v4 h-6 z`} fill="#6b5a70" strokeWidth="1.5" />
            <ellipse cx={x} cy={y + 15} rx="4.5" ry="6" fill={bulbs[i % bulbs.length]} strokeWidth="2" />
          </g>
        );
      })}
    </g>
  );
}

/** Ad Creative Studio: wallpaper, string lights, framed ads and a mood board. */
function CreativeWall({ L }: { L: InteriorLayout }) {
  const decor: ReactNode[] = [];
  let k = 0;
  for (let x = T * 0.7; x < L.w - T * 1.8; x += T * 1.9) {
    if (wallBusy(L, x, 56)) continue;
    const kind = k++ % 3;
    if (kind === 1) decor.push(<WallWindow key={x} x={x - 4} />);
    else decor.push(<AdPoster key={x} x={x} y={26 + (k % 2) * 6} tone={k} />);
  }
  return (
    <g>
      <rect width={L.w} height={L.wall - 30} fill="url(#a-wallpaper)" />
      {decor}
      <StringLights w={L.w} />
    </g>
  );
}

/** Video Production House: acoustic foam, film reels and a storyboard wall. */
function VideoWall({ L }: { L: InteriorLayout }) {
  const decor: ReactNode[] = [];
  let k = 0;
  for (let x = T * 0.7; x < L.w - T * 2; x += T * 2.3) {
    if (wallBusy(L, x, 76)) continue;
    const kind = k++ % 2;
    if (kind === 0)
      decor.push(
        <g key={x} stroke={LINE} strokeWidth="3" transform={`translate(${x + 34} 46)`}>
          {[-18, 18].map((dx) => (
            <g key={dx} transform={`translate(${dx} 0)`}>
              <circle r="17" fill="#2b2d42" />
              {[0, 1, 2, 3, 4].map((i) => (
                <circle key={i} cx={Math.cos((i * 2 * Math.PI) / 5) * 8.5} cy={Math.sin((i * 2 * Math.PI) / 5) * 8.5} r="3.6" fill="#9aa0b4" strokeWidth="1.6" />
              ))}
            </g>
          ))}
          <path d="M-18 17 C-10 32 10 32 18 17" fill="none" stroke="#2b2d42" strokeWidth="7" />
        </g>,
      );
    else
      decor.push(
        <g key={x} stroke={LINE} strokeWidth="3">
          {/* a storyboard: six sketched frames pinned to cork */}
          <rect x={x - 4} y={14} width="84" height="62" rx="3" fill="#c99862" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <rect x={x + 2 + (i % 3) * 26} y={20 + Math.floor(i / 3) * 27} width="22" height="22" fill="#f6e7cf" strokeWidth="2" />
              <path d={`M${x + 6 + (i % 3) * 26} ${36 + Math.floor(i / 3) * 27} l5 -7 l4 4 l5 -6`} fill="none" strokeWidth="1.8" />
              <circle cx={x + 13 + (i % 3) * 26} cy={21 + Math.floor(i / 3) * 27} r="2.4" fill="#e2453c" strokeWidth="1.2" />
            </g>
          ))}
        </g>,
      );
  }
  return (
    <g>
      <rect width={L.w} height={L.wall - 30} fill="url(#a-foam)" />
      {decor}
      <StringLights w={L.w} y={6} />
    </g>
  );
}

/** The set piece in the middle of the floor: a green screen with a camera, or a mood-board easel. */
function MiddleSet({ L, kind }: { L: InteriorLayout; kind: string }) {
  const m = L.middle;
  if (m.w < 90) return null;
  const cx = m.x + m.w / 2;
  if (kind === "video") {
    const gw = Math.min(m.w - 20, 170);
    return (
      <g stroke={LINE} strokeWidth="3.5" strokeLinejoin="round">
        {/* green screen hanging from the wall and curving onto the floor */}
        <rect x={cx - gw / 2 - 6} y={L.wall - 96} width={gw + 12} height="12" rx="3" fill="#4a3b4f" />
        <path d={`M${cx - gw / 2} ${L.wall - 86} H${cx + gw / 2} V${m.y + m.h * 0.55} H${cx - gw / 2} Z`} fill="#3cbf5a" />
        <path d={`M${cx - gw / 2 + 10} ${L.wall - 70} V${m.y + m.h * 0.5} M${cx + gw / 2 - 10} ${L.wall - 70} V${m.y + m.h * 0.5}`} stroke="#2f9c48" strokeWidth="3" />
        {/* softbox lights either side */}
        {[-1, 1].map((sd) => (
          <g key={sd} transform={`translate(${cx + sd * (gw / 2 - 4)} ${m.y + m.h - 6})`}>
            <path d="M0 0 V-46 M-12 0 L0 -18 L12 0" strokeWidth="3" />
            <rect x="-16" y="-70" width="32" height="26" rx="3" fill="#fff6dc" />
            <circle cx="0" cy="-57" r="20" fill="url(#a-glow)" stroke="none" />
          </g>
        ))}
        {/* camera on a tripod */}
        <g transform={`translate(${cx} ${m.y + m.h + 6})`}>
          <path d="M0 -26 L-14 0 M0 -26 L14 0 M0 -26 V0" strokeWidth="3" />
          <rect x="-16" y="-44" width="30" height="20" rx="3" fill="#2b2d42" />
          <rect x="14" y="-40" width="10" height="12" rx="2" fill="#4a4e69" />
          <circle cx="-2" cy="-34" r="5" fill="#9ad8d2" strokeWidth="2" />
          <circle cx="-12" cy="-40" r="2.5" fill="#e2453c" strokeWidth="1.2" />
        </g>
      </g>
    );
  }
  if (kind === "creative")
    return (
      <g stroke={LINE} strokeWidth="3.5" strokeLinejoin="round">
        {/* mood board on an easel, a beanbag and a plant */}
        <g transform={`translate(${cx} ${m.y + m.h - 4})`}>
          <path d="M-30 0 L-10 -100 M30 0 L10 -100 M0 -100 V6" strokeWidth="4" stroke="#6b4226" />
          <rect x="-40" y="-104" width="80" height="62" rx="3" fill="#c99862" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-34 + (i % 2) * 36} y={-98 + Math.floor(i / 2) * 28} width="30" height="24" fill={["#f19aa8", "#9ad8d2", "#ffd166", "#c5e5a5"][i]} strokeWidth="2" transform={`rotate(${(i % 2 ? 3 : -3)} ${-19 + (i % 2) * 36} ${-86 + Math.floor(i / 2) * 28})`} />
          ))}
        </g>
        {m.w > 150 && <ellipse cx={m.x + 26} cy={m.y + m.h - 18} rx="24" ry="17" fill="#ff9fc8" />}
        {m.w > 150 && <Plant x={m.x + m.w - 20} y={m.y + m.h - 6} s={1.1} seed={3} />}
      </g>
    );
  return (
    <g stroke={LINE} strokeWidth="3.5" strokeLinejoin="round">
      {/* a water cooler and a plant */}
      <g transform={`translate(${cx} ${m.y + m.h - 6})`}>
        <rect x="-14" y="-34" width="28" height="34" rx="3" fill="#cfd6d3" />
        <path d="M-12 -34 Q-12 -62 0 -62 Q12 -62 12 -34 Z" fill="#9fd3e6" />
        <rect x="-4" y="-22" width="8" height="5" fill="#4f86c6" strokeWidth="1.5" />
      </g>
      {m.w > 150 && <Plant x={m.x + 22} y={m.y + m.h - 6} s={1.1} seed={1} />}
    </g>
  );
}

export const InteriorArt = memo(function InteriorArt({ layout, info }: { layout: InteriorLayout; info: InteriorInfo }) {
  const L = layout;
  const wallC = info.kind === "video" ? "#3c3148" : info.kind === "creative" ? "#cbb3ee" : soft(info.color, 0.7);
  const trim = shade(info.color, -0.25);
  const noteC = ["#ffd166", "#f19aa8", "#9ad8d2", "#c5e5a5", "#ffc078"];
  const rugFill = info.kind === "creative" ? "url(#a-rug-purple)" : info.kind === "video" ? "url(#a-rug-red)" : "url(#a-rug)";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={L.w} height={L.h} viewBox={`0 0 ${L.w} ${L.h}`}>
      <Defs />
      <rect width={L.w} height={L.h} fill={info.kind === "video" ? "url(#a-plank-dark)" : "url(#a-plank)"} />
      {/* back wall over a stone base */}
      <rect width={L.w} height={L.wall} fill={wallC} />
      {info.kind === "creative" ? <CreativeWall L={L} /> : info.kind === "video" ? <VideoWall L={L} /> : <OfficeWall L={L} seed={hashString(info.name)} />}
      <rect y={L.wall - 34} width={L.w} height="34" fill="url(#a-stone)" stroke={LINE} strokeWidth="4" />
      <rect y={L.wall - 4} width={L.w} height="10" fill={trim} stroke={LINE} strokeWidth="3" />
      <MiddleSet L={L} kind={info.kind} />
      {/* Progress Room */}
      <rect x={L.progress.x} y={L.progress.y} width={L.progress.w} height={L.progress.h} rx="12" fill="url(#a-carpet)" stroke={LINE} strokeWidth="4" />
      <rect x={L.progress.x + 6} y={L.progress.y + 6} width={L.progress.w - 12} height={L.progress.h - 12} fill="none" stroke="#f2b866" strokeWidth="8" />
      <rect x={L.progress.x + 14} y={L.progress.y + 14} width={L.progress.w - 28} height={L.progress.h - 28} fill="none" stroke="#93392a" strokeWidth="4" />
      <g transform={`translate(${L.screen.x} ${L.screen.y})`} stroke={LINE} strokeWidth="4">
        <rect x="-10" y="-10" width={L.screen.w + 20} height={L.screen.h + 20} rx="8" fill="#4a3b4f" />
        <rect width={L.screen.w} height={L.screen.h} rx="4" fill="#1d2440" strokeWidth="3" />
      </g>
      {/* Mission Room */}
      <rect x={L.mission.x} y={L.mission.y} width={L.mission.w} height={L.mission.h} rx="12" fill="url(#a-carpet2)" stroke={LINE} strokeWidth="4" />
      <rect x={L.mission.x + 6} y={L.mission.y + 6} width={L.mission.w - 12} height={L.mission.h - 12} fill="none" stroke="#c4ead9" strokeWidth="8" />
      <rect x={L.mission.x + 14} y={L.mission.y + 14} width={L.mission.w - 28} height={L.mission.h - 28} fill="none" stroke="#1f4a52" strokeWidth="4" />
      <g transform={`translate(${L.board.x} ${L.board.y})`} stroke={LINE} strokeWidth="4">
        <rect x="-10" y="-10" width={L.board.w + 20} height={L.board.h + 20} rx="6" fill="#8a5636" />
        <rect width={L.board.w} height={L.board.h} fill="#d6a46b" strokeWidth="3" />
        {info.notes.slice(0, 8).map((n, i) => {
          const x = 8 + (i % 4) * ((L.board.w - 16) / 4);
          const y = 6 + Math.floor(i / 4) * 32;
          return <rect key={i} x={x} y={y} width={(L.board.w - 16) / 4 - 6} height="28" fill={noteC[i % noteC.length]} strokeWidth="2" opacity={n.done ? 0.55 : 1} transform={`rotate(${(i % 3) - 1} ${x} ${y})`} />;
        })}
      </g>
      {/* a big rug under the desks */}
      {L.stations.length > 0 && (() => {
        const xs = L.stations.map((s) => s.desk);
        const x0 = Math.min(...xs.map((d) => d.x)) - 24;
        const x1 = Math.max(...xs.map((d) => d.x + d.w)) + 24;
        const y0 = Math.min(...L.stations.map((s) => s.y)) - 46;
        const y1 = Math.max(...xs.map((d) => d.y + d.h)) + 40;
        return (
          <g stroke={LINE} strokeWidth="4">
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx="10" fill={rugFill} />
            <rect x={x0 + 10} y={y0 + 10} width={x1 - x0 - 20} height={y1 - y0 - 20} rx="6" fill="none" stroke="#f6e7cf" strokeWidth="3" />
          </g>
        );
      })()}
      {L.reporter && <Desk x={L.reporter.x} y={L.reporter.y} color="#ffd166" ready wide />}
      {L.stations.map((s) => {
        const d = info.desks.find((x) => x.staffId === s.staffId);
        return <Desk key={s.staffId} x={s.x} y={s.y} color={d?.color ?? "#7cc6c0"} ready={d?.ready ?? true} role={d?.role} />;
      })}
      {/* extra rooms */}
      {L.rooms.map((r) => (
        <g key={r.id} stroke={LINE} strokeWidth="4">
          <rect x={r.rect.x} y={r.rect.y} width={r.rect.w} height={r.rect.h} rx="12" fill="#c7b3e6" />
          <rect x={r.rect.x + 8} y={r.rect.y + 8} width={r.rect.w - 16} height={r.rect.h - 16} rx="8" fill="none" stroke="#8f74c0" strokeWidth="3" strokeDasharray="10 7" />
          <rect x={r.sign.x} y={r.sign.y} width={r.sign.w} height={r.sign.h} rx="6" fill="#4a3b4f" />
          <g transform={`translate(${r.rect.x + r.rect.w / 2} ${r.rect.y + r.rect.h - 34})`} strokeWidth="3">
            <ellipse rx="56" ry="20" fill="#f6e7cf" />
            <rect x="-38" y="-36" width="12" height="20" fill="#a86a43" />
            <rect x="26" y="-36" width="12" height="20" fill="#a86a43" />
          </g>
        </g>
      ))}
      {[T * 0.7, L.w - T * 0.7].map((x, i) => (
        <Plant key={x} x={x} y={L.wall + 0.6 * T} s={1.3} seed={i} />
      ))}
      {/* exit doormat */}
      <g transform={`translate(${L.exit.x} ${L.exit.y})`} stroke={LINE} strokeWidth="4">
        <rect width={L.exit.w} height={L.exit.h + 6} rx="8" fill="#d62839" />
      </g>
    </svg>
  );
});

function Desk({ x, y, color, ready, wide = false, role }: { x: number; y: number; color: string; ready: boolean; wide?: boolean; role?: string }) {
  const w = wide ? 2.6 * T : 2.4 * T;
  const h = 0.9 * T;
  const screen = ready ? color : "#ff6b6b";
  const monitor = (dx: number, k: string, mw = 48) => (
    <g key={k}>
      <rect x={dx - mw / 2} y="-30" width={mw} height="32" rx="4" fill="#3a3346" />
      <rect x={dx - mw / 2 + 5} y="-25" width={mw - 10} height="22" rx="2" fill={screen} strokeWidth="0" opacity="0.92" />
      <rect x={dx - 6} y="2" width="12" height="5" fill="#3a3346" strokeWidth="0" />
    </g>
  );
  let props: ReactNode;
  if (role === "videoEdit")
    // two screens with an edit timeline, and a jog wheel
    props = (
      <g>
        {monitor(-22, "m1", 40)}
        {monitor(22, "m2", 40)}
        {[0, 1, 2].map((i) => (
          <rect key={i} x={6 + i * 2} y={-22 + i * 6} width={22 - i * 4} height="4" fill={["#ffd166", "#9ad8d2", "#f19aa8"][i]} strokeWidth="0" />
        ))}
        <circle cx={w / 2 - 22} cy="14" r="8" fill="#4a4e69" strokeWidth="2.4" />
      </g>
    );
  else if (role === "videoAI")
    // a render tower with glowing lights next to the screen
    props = (
      <g>
        {monitor(-8, "m")}
        <rect x={w / 2 - 34} y="-36" width="22" height="44" rx="3" fill="#2b2d42" />
        <circle cx={w / 2 - 23} cy="-26" r="3" fill="#5cf28b" strokeWidth="1.2" />
        <circle cx={w / 2 - 23} cy="-16" r="3" fill="#3fd0ff" strokeWidth="1.2" />
        <path d={`M${w / 2 - 30} -4 h14`} stroke="#b388ff" strokeWidth="3" />
      </g>
    );
  else if (role === "imageAI")
    // a drawing tablet with a stylus
    props = (
      <g>
        {monitor(-14, "m")}
        <rect x={w / 2 - 40} y="4" width="30" height="20" rx="3" fill="#3a3346" strokeWidth="2.4" />
        <rect x={w / 2 - 36} y="8" width="22" height="12" rx="1" fill="#f19aa8" strokeWidth="0" />
        <path d={`M${w / 2 - 12} 2 l8 -10`} strokeWidth="3" />
      </g>
    );
  else if (role === "storyboard")
    // a sketch pad with three frames, and a pot of pencils
    props = (
      <g>
        <rect x="-40" y="-12" width="64" height="26" fill="#f6e7cf" strokeWidth="2.4" transform="rotate(-4 -8 1)" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={-36 + i * 20} y="-8" width="16" height="16" fill="none" strokeWidth="1.8" transform="rotate(-4 -8 1)" />
        ))}
        <rect x={w / 2 - 30} y="-14" width="14" height="20" rx="2" fill="#7cc6c0" strokeWidth="2.4" />
        <path d={`M${w / 2 - 27} -14 l-3 -12 M${w / 2 - 23} -14 v-14 M${w / 2 - 19} -14 l3 -12`} stroke="#e2453c" strokeWidth="3" />
      </g>
    );
  else if (role === "videoScript" || role === "scriptWriter")
    // a script with a highlighter
    props = (
      <g>
        {monitor(-16, "m")}
        <rect x={w / 2 - 44} y="-6" width="26" height="30" fill="#f6e7cf" strokeWidth="2.2" transform={`rotate(6 ${w / 2 - 31} 9)`} />
        <path d={`M${w / 2 - 40} 2 h16 M${w / 2 - 40} 8 h12 M${w / 2 - 40} 14 h16`} strokeWidth="1.6" transform={`rotate(6 ${w / 2 - 31} 9)`} />
        <rect x={w / 2 - 16} y="2" width="6" height="18" rx="2" fill="#ffd166" strokeWidth="2" />
      </g>
    );
  else if (role === "imageCopy" || role === "copyWriter")
    // sticky notes stuck round the screen
    props = (
      <g>
        {monitor(0, "m")}
        <rect x="26" y="-30" width="12" height="12" fill="#ffd166" strokeWidth="1.8" />
        <rect x="26" y="-16" width="12" height="12" fill="#f19aa8" strokeWidth="1.8" />
        <rect x="-38" y="-24" width="12" height="12" fill="#9ad8d2" strokeWidth="1.8" />
        <rect x={w / 2 - 26} y="4" width="12" height="14" rx="2" fill="#e2453c" strokeWidth="2.4" />
      </g>
    );
  else
    props = (
      <g>
        {monitor(0, "m")}
        <path d="M-13 -18 h18 M-13 -12 h12" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.5" />
        <rect x={-w / 2 + 10} y="6" width="22" height="16" fill="#f6e7cf" strokeWidth="2.2" transform={`rotate(-8 ${-w / 2 + 21} 14)`} />
        <rect x={w / 2 - 26} y="4" width="12" height="14" rx="2" fill="#e2453c" strokeWidth="2.4" />
        <path d={`M${w / 2 - 14} 8 q6 0 6 4 q0 4 -6 4`} fill="none" strokeWidth="2.4" />
      </g>
    );
  return (
    <g transform={`translate(${x} ${y + 0.15 * T})`} stroke={LINE} strokeWidth="3.5" strokeLinejoin="round">
      <rect x={-w / 2 + 8} y="8" width={w} height={h} rx="5" fill="#000" opacity="0.2" stroke="none" />
      <rect x={-w / 2} y="0" width={w} height={h - 6} rx="5" fill="#a86a43" />
      <rect x={-w / 2} y={h - 16} width={w} height="10" fill="#7d4c2e" strokeWidth="0" />
      <rect x="-20" y="10" width="40" height="8" rx="2" fill="#e8e1d5" strokeWidth="2.4" />
      {props}
    </g>
  );
}

/** Everything you read inside: the results screen, mission notes, room signs, and each desk's nameplate with the person's position. */
/** What a desk's person is doing now, for their nameplate. */
export type DeskStatus = Record<string, { state: "busy" | "idle" | "setup"; line: string }>;

export const InteriorLabels = memo(function InteriorLabels({ layout, info, status }: { layout: InteriorLayout; info: InteriorInfo; status?: DeskStatus }) {
  const L = layout;
  const rooms = new Map(info.rooms.map((r) => [r.id, r.name]));
  const desks = new Map(info.desks.map((d) => [d.staffId, d]));
  const sc = L.screen;
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <div className="absolute overflow-hidden" style={{ left: sc.x + 8, top: sc.y + 4, width: sc.w - 16, height: sc.h - 8 }}>
        <div className="truncate" style={{ ...display, fontSize: 16, color: "#ffd166" }}>{info.screen.title.toUpperCase()}</div>
        <div className="grid grid-cols-3 gap-1.5 mt-0.5">
          {info.screen.stats.slice(0, 3).map(([k, v]) => (
            <div key={k} className="leading-none min-w-0">
              <div style={{ ...display, fontSize: 20, color: "#fff" }}>{v}</div>
              <div className="font-extrabold truncate" style={{ fontSize: 9, color: "#9ad8d2" }}>{k.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div className="absolute left-0 right-0 bottom-1 h-1.5 rounded-full" style={{ background: "#33406b" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.max(3, Math.min(100, info.screen.pct * 100))}%`, background: "#5cf28b" }} />
        </div>
      </div>
      <div className="absolute" style={{ left: L.board.x, top: L.board.y, width: L.board.w, height: L.board.h }}>
        {info.notes.slice(0, 8).map((n, i) => {
          const w = (L.board.w - 16) / 4 - 6;
          return (
            <div key={i} className="absolute font-extrabold leading-tight overflow-hidden" style={{ left: 10 + (i % 4) * ((L.board.w - 16) / 4), top: 8 + Math.floor(i / 4) * 32, width: w - 4, height: 26, fontSize: 9.5, color: LINE, textDecoration: n.done ? "line-through" : undefined }}>
              {short(n.text, 24)}
            </div>
          );
        })}
        {!info.notes.length && (
          <div className="absolute inset-0 grid place-content-center" style={{ ...display, fontSize: 20, color: "#7a4b36" }}>
            NO MISSIONS YET
          </div>
        )}
      </div>
      <Zone r={L.progress} text="PROGRESS ROOM" />
      <Zone r={L.mission} text="MISSION ROOM" right />
      {L.rooms.map((r) => (
        <div key={r.id} className="absolute grid place-content-center text-center" style={{ left: r.sign.x, top: r.sign.y, width: r.sign.w, height: r.sign.h, ...display, fontSize: 19, color: "#f6e7cf" }}>
          {short((rooms.get(r.id) ?? "").toUpperCase(), 14)}
        </div>
      ))}
      {L.reporter && <Plate x={L.reporter.x} y={L.reporter.y} name={info.reporter?.name ?? "Reports"} title={info.reporter?.title ?? "Progress reporter"} color="#ffd166" />}
      {L.stations.map((s) => {
        const d = desks.get(s.staffId);
        return d ? <Plate key={s.staffId} x={s.x} y={s.y} name={d.name} title={d.title} color={d.color} status={status?.[s.staffId]} /> : null;
      })}
      <div className="absolute grid place-content-center" style={{ left: L.exit.x, top: L.exit.y, width: L.exit.w, height: L.exit.h + 6, ...display, fontSize: 22, color: "#fff" }}>
        EXIT
      </div>
    </div>
  );
});

function Zone({ r, text, right = false }: { r: Rect; text: string; right?: boolean }) {
  return (
    <div className="absolute" style={{ left: r.x + 16, top: r.y + 14, width: r.w - 32, textAlign: right ? "right" : "left", ...display, fontSize: 22, color: "#fbf1dc", textShadow: "2px 2px 0 rgb(40 22 10 / 0.6)" }}>
      {text}
    </div>
  );
}

const STATE_DOT = { busy: "#6aa645", idle: "#a3998f", setup: "#c0392b" };
const STATE_WORD = { busy: "Working", idle: "Free", setup: "Needs you" };

/** The nameplate on the front of a desk: who sits here, their job, and whether they're working, free or waiting on you (and on what). */
function Plate({ x, y, name, title, color, status }: { x: number; y: number; name: string; title: string; color: string; status?: DeskStatus[string] }) {
  const done = status?.line.startsWith("Done today");
  const line = status?.line.replace(/^(Working on|Done today|Waiting on you): /, "").replace(/…$/, "");
  return (
    <div className="absolute text-center border-[2.5px] px-1 py-0.5 shadow-[2px_2px_0_rgb(40_22_10/0.5)]" style={{ left: x - 70, top: y + 0.15 * T + 0.9 * T - 4, width: 140, background: "#f3e2c0", borderColor: LINE, color: LINE, zIndex: 2 }} title={status?.line}>
      <div className="leading-none truncate" style={{ ...display, fontSize: 15 }}>{name}</div>
      <div className="mt-0.5 px-1" style={{ ...display, fontSize: 12, lineHeight: "14px", background: snapHex(shade(color, 0.35)) }}>{title}</div>
      {status && (
        <div className="flex items-center justify-center gap-1 mt-0.5 leading-none" style={{ ...display, fontWeight: 500, fontSize: 12 }}>
          <span className="inline-block shrink-0" style={{ width: 8, height: 8, background: done ? "#f4c95d" : STATE_DOT[status.state], border: `1.5px solid ${LINE}` }} />
          <span className="truncate">{done ? "Done" : STATE_WORD[status.state]}{line && status.state !== "idle" ? `: ${line}` : ""}</span>
        </div>
      )}
    </div>
  );
}
