"use client";

// The city's scenery, drawn as SVG in the app's comic-ink style: streets, the plaza and
// fountain, trees, lamps and buildings outside; floors, desks, the results screen and the
// mission board inside. Characters are drawn on top by the game (components/city/CityGame).

import { memo } from "react";
import { T, type CityLayout, type InteriorLayout, type Rect } from "@/lib/city";
import { hashString, rng } from "@/lib/avatar";
import { INK, shade } from "../characters";
import { Avatar } from "../avatars";
import { Icon } from "../icons";

export interface HouseInfo {
  id: string;
  name: string;
  color: string;
  kind: string;
  avatar?: string;
  /** Staff waiting on setup: a "!" shows on the sign */
  alert: number;
}

const short = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function Defs() {
  return (
    <defs>
      <pattern id="c-grass" width="96" height="96" patternUnits="userSpaceOnUse">
        <rect width="96" height="96" fill="#4cab56" />
        <path d="M10 20 l3 -7 l3 7 M60 14 l3 -7 l3 7 M34 58 l3 -7 l3 7 M78 70 l3 -7 l3 7 M14 82 l3 -7 l3 7" stroke="#3b8f47" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="48" cy="34" r="2" fill="#7fd67f" />
        <circle cx="86" cy="40" r="1.6" fill="#7fd67f" />
        <circle cx="24" cy="44" r="1.6" fill="#ffe08a" />
        <circle cx="66" cy="88" r="1.8" fill="#7fd67f" />
      </pattern>
      <pattern id="c-lawn" width="48" height="48" patternUnits="userSpaceOnUse">
        <rect width="48" height="48" fill="#5bbd63" />
        <path d="M0 0 L48 48 M-24 24 L24 72 M24 -24 L72 24" stroke="#54b45c" strokeWidth="10" />
      </pattern>
      <pattern id="c-stone" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="#e3dcef" />
        <path d="M0 20 H40 M20 0 V20 M0 0 V40 M10 20 V40 M30 20 V40" stroke="#bdb4d3" strokeWidth="2" />
      </pattern>
      <pattern id="c-wood" width="120" height="40" patternUnits="userSpaceOnUse">
        <rect width="120" height="40" fill="#d39a62" />
        <rect y="20" width="120" height="20" fill="#c98f57" />
        <path d="M0 20 H120 M0 40 H120 M40 0 V20 M100 0 V20 M10 20 V40 M70 20 V40" stroke="#a8713f" strokeWidth="2" />
      </pattern>
      <pattern id="c-roof" width="24" height="16" patternUnits="userSpaceOnUse">
        <path d="M0 15 Q6 6 12 15 Q18 6 24 15" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="2" />
      </pattern>
      <radialGradient id="c-glow">
        <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.9" />
        <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

export function Tree({ x, y, s = 1, tone = 0 }: { x: number; y: number; s?: number; tone?: number }) {
  const leaf = ["#2f9e44", "#2b8a3e", "#37b24d", "#40916c"][tone % 4];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeWidth="3" strokeLinejoin="round">
      <ellipse cx="0" cy="2" rx="22" ry="7" fill="#000" opacity="0.22" stroke="none" />
      <rect x="-5" y="-22" width="10" height="24" rx="3" fill="#7a4a2a" />
      <circle cx="-13" cy="-36" r="16" fill={leaf} />
      <circle cx="13" cy="-36" r="16" fill={leaf} />
      <circle cx="0" cy="-52" r="19" fill={leaf} />
      <path d="M-8 -60 q6 -6 14 -2" stroke="#8ce99a" strokeWidth="4" fill="none" />
    </g>
  );
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="2" rx="8" ry="3" fill="#000" opacity="0.25" />
      <rect x="-2.5" y="-46" width="5" height="48" fill="#2b2d42" stroke={INK} strokeWidth="2" />
      <rect x="-8" y="-58" width="16" height="13" rx="3" fill="#ffe9a8" stroke={INK} strokeWidth="2.5" className="lamp-bulb" />
    </g>
  );
}

function House({ r, info, door }: { r: Rect; info: HouseInfo; door: Rect }) {
  const roofH = r.h * 0.44;
  const wallTop = r.y + roofH;
  const wallH = r.h - roofH;
  const wall = shade(info.color, 0.78);
  const roof = info.color;
  const dark = shade(info.color, -0.3);
  const rand = rng(hashString(info.id));
  const name = short(info.name.toUpperCase(), 18);
  const signW = Math.min(r.w - 30, name.length * 14 + 46);
  const winY = wallTop + 18;
  const wins = [r.x + 30, r.x + 84, r.x + r.w - 84 - 34, r.x + r.w - 30 - 34];
  return (
    <g>
      <rect x={r.x + 10} y={r.y + r.h - 12} width={r.w} height="22" rx="10" fill="#000" opacity="0.22" />
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
        {/* walls */}
        <rect x={r.x + 8} y={wallTop - 4} width={r.w - 16} height={wallH} fill={wall} />
        <rect x={r.x + 8} y={r.y + r.h - 20} width={r.w - 16} height="16" fill={shade(wall, -0.25)} />
        {/* windows */}
        {wins.map((wx, i) => {
          const lit = rand() > 0.3;
          return (
            <g key={i}>
              <rect x={wx} y={winY} width="34" height="34" rx="4" fill={lit ? "#ffe9a8" : "#35457a"} className={lit ? "win-lit" : ""} />
              <path d={`M${wx + 17} ${winY} V${winY + 34} M${wx} ${winY + 17} H${wx + 34}`} strokeWidth="2.5" />
              {!lit && <path d={`M${wx + 5} ${winY + 12} l8 -7`} stroke="#9fb6ff" strokeWidth="3" />}
            </g>
          );
        })}
        {/* door */}
        <rect x={door.x - 6} y={r.y + r.h - 64} width={door.w + 12} height="58" rx="6" fill={shade(dark, -0.2)} />
        <rect x={door.x} y={r.y + r.h - 58} width={door.w} height="52" rx="4" fill="#6b3f22" />
        <circle cx={door.x + door.w - 10} cy={r.y + r.h - 30} r="3" fill="#ffd23f" strokeWidth="2" />
        <rect x={door.x - 12} y={r.y + r.h - 8} width={door.w + 24} height="10" rx="3" fill="#bdb4d3" />
        {/* roof */}
        <path d={`M${r.x - 4} ${wallTop + 8} L${r.x + 22} ${r.y} L${r.x + r.w - 22} ${r.y} L${r.x + r.w + 4} ${wallTop + 8} Z`} fill={roof} />
        <path d={`M${r.x - 4} ${wallTop + 8} L${r.x + 22} ${r.y} L${r.x + r.w - 22} ${r.y} L${r.x + r.w + 4} ${wallTop + 8} Z`} fill="url(#c-roof)" strokeWidth="0" />
        <rect x={r.x - 6} y={wallTop + 4} width={r.w + 12} height="12" rx="3" fill={dark} />
        <path d={`M${r.x + 28} ${r.y + 8} H${r.x + r.w - 28}`} stroke={shade(roof, 0.45)} strokeWidth="5" strokeLinecap="round" />
        {/* chimney */}
        <rect x={r.x + r.w - 62} y={r.y - 18} width="22" height="26" fill={shade(roof, -0.45)} />
      </g>
      <g className="smoke">
        <circle cx={r.x + r.w - 51} cy={r.y - 26} r="7" fill="#fff" opacity="0.5" />
        <circle cx={r.x + r.w - 44} cy={r.y - 40} r="9" fill="#fff" opacity="0.35" />
      </g>
      {/* roof emblem */}
      <circle cx={r.x + r.w / 2} cy={r.y + roofH * 0.5} r="30" fill="#fff8ec" stroke={INK} strokeWidth="4" />
      {info.kind === "client" ? (
        <svg x={r.x + r.w / 2 - 26} y={r.y + roofH * 0.5 - 26} width="52" height="52" overflow="visible">
          <Avatar value={info.avatar} seed={info.id} kind="emblem" size={52} />
        </svg>
      ) : (
        <Icon name={info.kind === "video" ? "film" : info.kind === "acquisition" ? "rocket" : info.kind === "creative" ? "palette" : "home"} size={40} x={r.x + r.w / 2 - 20} y={r.y + roofH * 0.5 - 20} style={{ color: shade(roof, -0.35) }} strokeWidth={2.4} />
      )}
      {/* sign */}
      <g transform={`translate(${r.x + r.w / 2 - signW / 2} ${wallTop + 56})`}>
        <rect width={signW} height="34" rx="6" fill={INK} />
        <rect x="3" y="3" width={signW - 6} height="28" rx="4" fill="#fff8ec" />
        <text x={signW / 2} y="25" textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="23" letterSpacing="1" fill={INK}>
          {name}
        </text>
      </g>
      {info.alert > 0 && (
        <g transform={`translate(${r.x + r.w / 2 + signW / 2 - 4} ${wallTop + 52})`}>
          <g className="alert-pop">
            <circle r="15" fill="#ff4d5e" stroke={INK} strokeWidth="3" />
            <text y="8" textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="22" fill="#fff">
              {info.alert}
            </text>
          </g>
        </g>
      )}
      {info.kind === "video" && (
        <g transform={`translate(${r.x + 18} ${r.y - 22})`}>
          <rect width="86" height="30" rx="6" fill="#7c5cff" stroke={INK} strokeWidth="3" className="neon" />
          <text x="43" y="22" textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="20" fill="#fff">ON AIR</text>
        </g>
      )}
      {info.kind === "creative" && (
        <g transform={`translate(${r.x + 18} ${r.y - 22})`}>
          <rect width="86" height="30" rx="6" fill="#ff9f1c" stroke={INK} strokeWidth="3" className="neon" />
          <text x="43" y="22" textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="20" fill={INK}>ADS LAB</text>
        </g>
      )}
      {info.kind === "acquisition" && (
        <g transform={`translate(${r.x + 18} ${r.y - 22})`}>
          <rect width="86" height="30" rx="6" fill="#ff4d5e" stroke={INK} strokeWidth="3" className="neon" />
          <text x="43" y="22" textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="20" fill="#fff">HIRING</text>
        </g>
      )}
    </g>
  );
}

function Flowers({ r, seed }: { r: Rect; seed: string }) {
  const rand = rng(hashString(seed));
  const colors = ["#ff5fae", "#ffd23f", "#fff8ec", "#ff9f1c", "#7c5cff"];
  return (
    <g>
      {Array.from({ length: 10 }, (_, i) => {
        const left = i % 2 === 0;
        const x = left ? r.x + 6 + rand() * 50 : r.x + r.w - 56 + rand() * 50;
        const y = r.y + 8 + rand() * (r.h - 16);
        return <circle key={i} cx={x} cy={y} r={4 + rand() * 2} fill={colors[Math.floor(rand() * colors.length)]} stroke={INK} strokeWidth="1.5" />;
      })}
    </g>
  );
}

export const CityArt = memo(function CityArt({ layout, houses, cityName }: { layout: CityLayout; houses: HouseInfo[]; cityName: string }) {
  const L = layout;
  const byId = new Map(houses.map((h) => [h.id, h]));
  const f = L.fountain;
  return (
    <svg width={L.w} height={L.h} viewBox={`0 0 ${L.w} ${L.h}`} className="absolute inset-0 block" aria-hidden>
      <Defs />
      <rect width={L.w} height={L.h} fill="url(#c-grass)" />
      {/* lots */}
      {L.plots.map((p) => (
        <g key={p.buildingId}>
          <rect x={p.area.x} y={p.area.y} width={p.area.w} height={p.area.h} rx="14" fill="url(#c-lawn)" />
          <rect x={p.door.x - 4} y={p.house.y + p.house.h} width={p.door.w + 8} height={p.area.y + p.area.h - p.house.y - p.house.h + 6} fill="url(#c-stone)" stroke="#a79ec0" strokeWidth="2" />
          <Flowers r={p.yard} seed={p.buildingId} />
        </g>
      ))}
      {/* streets */}
      {L.roads.map((r, i) => (
        <rect key={`s${i}`} x={r.x - 8} y={r.y - 8} width={r.w + 16} height={r.h + 16} fill="#cfc8e2" />
      ))}
      {L.roads.map((r, i) => (
        <rect key={`r${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill="#454861" />
      ))}
      {L.roads.map((r, i) =>
        r.w > r.h ? (
          <path key={`d${i}`} d={`M${r.x + 10} ${r.y + r.h / 2} H${r.x + r.w - 10}`} stroke="#ffd23f" strokeWidth="4" strokeDasharray="22 20" opacity="0.85" />
        ) : (
          <path key={`d${i}`} d={`M${r.x + r.w / 2} ${r.y + 10} V${r.y + r.h - 10}`} stroke="#ffd23f" strokeWidth="4" strokeDasharray="22 20" opacity="0.85" />
        ),
      )}
      {/* plaza */}
      <rect x={L.plaza.x} y={L.plaza.y} width={L.plaza.w} height={L.plaza.h + T} rx="22" fill="url(#c-stone)" stroke="#a79ec0" strokeWidth="4" />
      <ellipse cx={f.x} cy={f.y + 6} rx={f.r * 2.1} ry={f.r * 1.5} fill="none" stroke="#c7bde0" strokeWidth="10" />
      <g stroke={INK} strokeWidth="4">
        <ellipse cx={f.x} cy={f.y} rx={f.r} ry={f.r * 0.7} fill="#9aa0b4" />
        <ellipse cx={f.x} cy={f.y - 4} rx={f.r - 10} ry={f.r * 0.7 - 10} fill="#5ad1ff" strokeWidth="2.5" />
      </g>
      <ellipse cx={f.x} cy={f.y - 4} rx={f.r * 0.5} ry={f.r * 0.32} fill="none" stroke="#c9f1ff" strokeWidth="3" className="ripple" />
      <ellipse cx={f.x} cy={f.y - 4} rx={f.r * 0.5} ry={f.r * 0.32} fill="none" stroke="#c9f1ff" strokeWidth="3" className="ripple ripple-2" />
      <rect x={f.x - 7} y={f.y - 42} width="14" height="36" rx="4" fill="#c0c7d6" stroke={INK} strokeWidth="3" />
      <g className="spout">
        <path d={`M${f.x} ${f.y - 44} q-18 -22 -34 8 M${f.x} ${f.y - 44} q18 -22 34 8 M${f.x} ${f.y - 46} v-14`} stroke="#9be7ff" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
      <g transform={`translate(${L.plaza.x + L.plaza.w / 2} ${L.plaza.y + 26})`}>
        <rect x={-Math.min(L.plaza.w / 2 - 10, cityName.length * 11 + 40)} y="-24" width={Math.min(L.plaza.w - 20, cityName.length * 22 + 80)} height="46" rx="8" fill={INK} />
        <rect x={-Math.min(L.plaza.w / 2 - 10, cityName.length * 11 + 40) + 4} y="-20" width={Math.min(L.plaza.w - 20, cityName.length * 22 + 80) - 8} height="38" rx="6" fill="#ffd23f" />
        <text y="11" textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="32" letterSpacing="2" fill={INK}>
          {short(cityName.toUpperCase(), 22)}
        </text>
      </g>
      {/* benches */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${f.x + s * f.r * 2.4} ${f.y + 10})`} stroke={INK} strokeWidth="3">
          <rect x="-26" y="-10" width="52" height="12" rx="3" fill="#a8713f" />
          <rect x="-26" y="-22" width="52" height="8" rx="3" fill="#c98f57" />
        </g>
      ))}
      {L.plots.map((p) => {
        const info = byId.get(p.buildingId);
        return info ? <House key={p.buildingId} r={p.house} info={info} door={p.door} /> : null;
      })}
      {L.lamps.map((l, i) => (
        <Lamp key={i} x={l.x} y={l.y} />
      ))}
      {L.trees.map((t, i) => (
        <Tree key={i} x={t.x} y={t.y} s={t.s} tone={i} />
      ))}
    </svg>
  );
});

/** Light pools for lamps and windows, drawn above the night tint. */
export const CityGlow = memo(function CityGlow({ layout }: { layout: CityLayout }) {
  return (
    <svg width={layout.w} height={layout.h} className="absolute inset-0 block pointer-events-none mix-blend-screen" aria-hidden>
      <defs>
        <radialGradient id="c-glow2">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {layout.lamps.map((l, i) => (
        <circle key={i} cx={l.x} cy={l.y - 40} r="90" fill="url(#c-glow2)" className="lamp-glow" />
      ))}
      {layout.plots.map((p) => (
        <ellipse key={p.buildingId} cx={p.house.x + p.house.w / 2} cy={p.house.y + p.house.h * 0.7} rx={p.house.w * 0.6} ry={p.house.h * 0.45} fill="url(#c-glow2)" opacity="0.6" />
      ))}
    </svg>
  );
});

export interface InteriorInfo {
  name: string;
  color: string;
  /** Lines for the results screen */
  screen: { title: string; stats: [string, string][]; pct: number; feed: string[] };
  /** Sticky notes on the mission board */
  notes: { text: string; done: boolean }[];
  rooms: { id: string; name: string }[];
  desks: { staffId: string; name: string; color: string; ready: boolean }[];
}

export const InteriorArt = memo(function InteriorArt({ layout, info }: { layout: InteriorLayout; info: InteriorInfo }) {
  const L = layout;
  const wallC = shade(info.color, 0.62);
  const rooms = new Map(info.rooms.map((r) => [r.id, r.name]));
  const desks = new Map(info.desks.map((d) => [d.staffId, d]));
  const noteC = ["#ffd23f", "#ff9fc8", "#9be7ff", "#b6f5c8", "#ffc078"];
  return (
    <svg width={L.w} height={L.h} viewBox={`0 0 ${L.w} ${L.h}`} className="absolute inset-0 block" aria-hidden>
      <Defs />
      <rect width={L.w} height={L.h} fill="url(#c-wood)" />
      {/* back wall */}
      <rect width={L.w} height={L.wall} fill={wallC} />
      <rect y={L.wall - 26} width={L.w} height="26" fill={shade(info.color, -0.15)} stroke={INK} strokeWidth="4" />
      {Array.from({ length: Math.floor(L.w / (3 * T)) }, (_, i) => {
        const x = i * 3 * T + T * 1.2;
        if ((x > L.screen.x - 60 && x < L.screen.x + L.screen.w + 20) || (x > L.board.x - 60 && x < L.board.x + L.board.w + 20)) return null;
        return (
          <g key={i} stroke={INK} strokeWidth="3.5">
            <rect x={x} y={18} width="62" height="50" rx="4" fill="#9be7ff" />
            <path d={`M${x + 31} 18 V68 M${x} 43 H${x + 62}`} strokeWidth="2.5" />
            <path d={`M${x + 8} 34 l12 -10`} stroke="#fff" strokeWidth="4" />
          </g>
        );
      })}
      {/* Progress Room */}
      <rect x={L.progress.x} y={L.progress.y} width={L.progress.w} height={L.progress.h} rx="16" fill="#ffd23f" opacity="0.32" stroke="#e0a800" strokeWidth="4" strokeDasharray="14 10" />
      <text x={L.progress.x + 14} y={L.progress.y + L.progress.h - 14} fontFamily="Bangers, Impact, sans-serif" fontSize="24" fill={INK} opacity="0.75">PROGRESS ROOM</text>
      <g transform={`translate(${L.screen.x} ${L.screen.y})`}>
        <rect x="-8" y="-8" width={L.screen.w + 16} height={L.screen.h + 16} rx="8" fill={INK} />
        <rect width={L.screen.w} height={L.screen.h} rx="4" fill="#101a3a" className="screen-glow" />
        <text x="10" y="22" fontFamily="Bangers, Impact, sans-serif" fontSize="19" fill="#ffd23f" letterSpacing="1">{short(info.screen.title.toUpperCase(), 24)}</text>
        {info.screen.stats.slice(0, 3).map(([k, v], i) => (
          <g key={k} transform={`translate(${10 + i * (L.screen.w - 20) / 3} 34)`}>
            <text y="18" fontFamily="Bangers, Impact, sans-serif" fontSize="22" fill="#fff">{v}</text>
            <text y="32" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="10" fill="#9be7ff">{k.toUpperCase()}</text>
          </g>
        ))}
        <rect x="10" y={L.screen.h - 12} width={L.screen.w - 20} height="6" rx="3" fill="#2a3466" />
        <rect x="10" y={L.screen.h - 12} width={Math.max(4, (L.screen.w - 20) * Math.min(1, info.screen.pct))} height="6" rx="3" fill="#5cf28b" />
      </g>
      {/* Mission Room */}
      <rect x={L.mission.x} y={L.mission.y} width={L.mission.w} height={L.mission.h} rx="16" fill="#3fd0ff" opacity="0.25" stroke="#1c9bc4" strokeWidth="4" strokeDasharray="14 10" />
      <text x={L.mission.x + L.mission.w - 14} y={L.mission.y + L.mission.h - 14} textAnchor="end" fontFamily="Bangers, Impact, sans-serif" fontSize="24" fill={INK} opacity="0.75">MISSION ROOM</text>
      <g transform={`translate(${L.board.x} ${L.board.y})`}>
        <rect x="-8" y="-8" width={L.board.w + 16} height={L.board.h + 16} rx="6" fill="#7a4a2a" stroke={INK} strokeWidth="4" />
        <rect width={L.board.w} height={L.board.h} fill="#d6a46b" />
        {info.notes.slice(0, 8).map((n, i) => {
          const x = 8 + (i % 4) * ((L.board.w - 16) / 4);
          const y = 6 + Math.floor(i / 4) * 32;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${(i % 3) - 1} )`}>
              <rect width={(L.board.w - 16) / 4 - 6} height="28" fill={noteC[i % noteC.length]} stroke={INK} strokeWidth="1.5" opacity={n.done ? 0.55 : 1} />
              <text x="4" y="17" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="9.5" fill={INK}>{short(n.text, 11)}</text>
              {n.done && <path d="M6 22 l5 4 l9 -12" stroke="#2b8a3e" strokeWidth="3" fill="none" />}
            </g>
          );
        })}
        {!info.notes.length && (
          <text x={L.board.w / 2} y={L.board.h / 2 + 6} textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="20" fill="#7a4a2a">NO MISSIONS YET</text>
        )}
      </g>
      {/* reporter's desk */}
      {L.reporter && <Desk x={L.reporter.x} y={L.reporter.y} name="Reports" color="#ffd23f" ready wide />}
      {/* staff desks */}
      {L.stations.map((s) => {
        const d = desks.get(s.staffId);
        return <Desk key={s.staffId} x={s.x} y={s.y} name={d?.name ?? ""} color={d?.color ?? "#3fd0ff"} ready={d?.ready ?? true} />;
      })}
      {/* extra rooms */}
      {L.rooms.map((r) => (
        <g key={r.id}>
          <rect x={r.rect.x} y={r.rect.y} width={r.rect.w} height={r.rect.h} rx="14" fill="#7c5cff" opacity="0.2" stroke="#7c5cff" strokeWidth="4" strokeDasharray="12 9" />
          <g transform={`translate(${r.sign.x} ${r.sign.y})`}>
            <rect width={r.sign.w} height={r.sign.h} rx="6" fill={INK} />
            <text x={r.sign.w / 2} y={r.sign.h / 2 + 8} textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="20" fill="#fff8ec">{short((rooms.get(r.id) ?? "").toUpperCase(), 12)}</text>
          </g>
          <g transform={`translate(${r.rect.x + r.rect.w / 2} ${r.rect.y + r.rect.h - 30})`} stroke={INK} strokeWidth="3">
            <ellipse rx="54" ry="20" fill="#f1e3ff" />
            <rect x="-34" y="-34" width="10" height="20" fill="#a8713f" />
            <rect x="24" y="-34" width="10" height="20" fill="#a8713f" />
          </g>
        </g>
      ))}
      {/* plants */}
      {[T * 0.6, L.w - T * 0.6].map((x) => (
        <g key={x} transform={`translate(${x} ${L.wall + 0.2 * T})`} stroke={INK} strokeWidth="3">
          <rect x="-12" y="-6" width="24" height="22" rx="3" fill="#c0573e" />
          <circle cx="-8" cy="-14" r="11" fill="#37b24d" />
          <circle cx="8" cy="-16" r="11" fill="#2f9e44" />
          <circle cx="0" cy="-26" r="11" fill="#40c057" />
        </g>
      ))}
      {/* exit */}
      <g transform={`translate(${L.exit.x} ${L.exit.y})`}>
        <rect width={L.exit.w} height={L.exit.h + 6} rx="8" fill="#e63946" stroke={INK} strokeWidth="4" />
        <text x={L.exit.w / 2} y={L.exit.h / 2 + 9} textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="22" fill="#fff">EXIT</text>
      </g>
      <text x={L.w / 2} y={L.wall - 34} textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="30" fill={INK} opacity="0.5" letterSpacing="2">{short(info.name.toUpperCase(), 26)}</text>
    </svg>
  );
});

function Desk({ x, y, name, color, ready, wide = false }: { x: number; y: number; name: string; color: string; ready: boolean; wide?: boolean }) {
  const w = wide ? 2.6 * T : 2.4 * T;
  return (
    <g transform={`translate(${x} ${y + 0.15 * T})`} stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
      <rect x={-w / 2 + 6} y="30" width={w} height="14" rx="5" fill="#000" opacity="0.2" stroke="none" />
      <rect x={-w / 2} y="0" width={w} height={0.9 * T - 6} rx="5" fill="#8b5a2b" />
      <rect x={-w / 2} y={0.9 * T - 14} width={w} height="8" fill="#6b4120" strokeWidth="0" />
      {/* monitor */}
      <rect x="-22" y="-26" width="44" height="30" rx="4" fill="#1b1b2f" />
      <rect x="-18" y="-22" width="36" height="22" rx="2" fill={ready ? color : "#ff4d5e"} opacity="0.9" className="screen-glow" strokeWidth="0" />
      <rect x="-4" y="4" width="8" height="6" fill="#1b1b2f" strokeWidth="0" />
      {name && (
        <g transform={`translate(0 ${0.9 * T - 2})`}>
          <rect x={-name.length * 4.6 - 8} y="0" width={name.length * 9.2 + 16} height="18" rx="4" fill="#fff8ec" strokeWidth="2.5" />
          <text y="13.5" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="12" fill={INK} stroke="none">{name}</text>
        </g>
      )}
    </g>
  );
}
