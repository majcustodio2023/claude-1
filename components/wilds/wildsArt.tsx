"use client";

// The Wilds drawn in Dawnterra's pixel style: the ground as one big picture (grass in three
// greens by zone, the dirt path, the Glimmer River and its bridges, the pond, flowers, tall grass,
// rocks, the camp and the Grove King's altar), and trees as separate sprites so you can walk
// behind them. Monsters are hand-placed pixel sprites, the same in the field and in a fight.

import { memo, type CSSProperties } from "react";
import { T, type Pt } from "@/lib/city";
import type { TreeKind, WildsLayout } from "@/lib/wilds";
import { LINE } from "../city/art";

// ---------- monsters ----------

type Art = { rows: string[]; pal: Record<string, string> };

export const MONSTER_ART: Record<string, Art> = {
  jelly: {
    rows: [
      "................",
      "................",
      ".......ll.......",
      "......lggg......",
      ".....lggggg.....",
      "....lgggggggg...",
      "...lgwwggggwwg..",
      "..lggkwggggkwgg.",
      "..ggggggggggggg.",
      ".ggggggmmmggggggg",
      ".gggggggmggggggg.",
      ".ggggggggggggggg.",
      "..dddddddddddddd.",
      "...dddddddddddd..",
    ],
    pal: { g: "#8cc05a", l: "#d3f0a0", w: "#fbf1dc", k: "#2b1d2e", m: "#3e6b32", d: "#4f8a3a" },
  },
  puff: {
    rows: [
      "....w..w..w.....",
      "..w..wwwwww..w..",
      "...wwwwwwwwww...",
      ".w.wwwyyyywww.w.",
      "..wwwyyyyyyyww..",
      "..wwyykyyykyyw..",
      ".wwwyyyyyyyyyww.",
      "..wwyyymmmyyww..",
      "..wwwyyyyyywww..",
      ".w.wwwyyyywww.w.",
      "...wwwwwwwwww...",
      "......gggg......",
      ".......gg.......",
      "......g..g......",
    ],
    pal: { w: "#fbf1dc", y: "#f4c95d", k: "#2b1d2e", m: "#c0502f", g: "#4f8a3a" },
  },
  bee: {
    rows: [
      "...ww....ww.....",
      "..wwww..wwww....",
      "..wwwww.wwww....",
      "...wwwwwwww.....",
      ".....yyyyy......",
      "...yykyykyy.....",
      "..yyyyyyyyyykk..",
      ".kyyykkkyyykkks.",
      ".kyyyyyyyyyykk..",
      "..yykkkyyykk....",
      "...yyyyyyy......",
      ".....k..k.......",
    ],
    pal: { w: "#c4ead9", y: "#f4c95d", k: "#2b1d2e", s: "#e4dacb" },
  },
  shroom: {
    rows: [
      ".....rrrrrr.....",
      "...rrwwrrrrrr...",
      "..rrwwwrrrwwrr..",
      ".rrrrrrrrrwwwrr.",
      ".rwwrrrrrrrrrrr.",
      "rrwwwrrrwwrrrrrr",
      "rrrrrrrrwwrrrrrr",
      ".cccccccccccccc.",
      "....ssssssss....",
      "....skssssks....",
      "....ssssssss....",
      "....sssmmsss....",
      "....ssssssss....",
      "....ff....ff....",
    ],
    pal: { r: "#c0502f", w: "#fbf1dc", c: "#e8cfa2", s: "#f3e2c0", k: "#2b1d2e", m: "#93392a", f: "#a8743f" },
  },
  bark: {
    rows: [
      "...ll..ll.l.....",
      "..llll.lllll....",
      ".lllllllllllll..",
      "..lllllllllll...",
      "......bbbb......",
      ".bb..bbbbbb..bb.",
      "..bb.bkbbkb.bb..",
      "...bbbbbbbbbb...",
      ".....bmmmmb.....",
      ".....bbbbbb.....",
      ".....bdbbdb.....",
      ".....bbbbbb.....",
      "....bb.bb.bb....",
      "...bb..bb..bb...",
    ],
    pal: { l: "#6aa645", b: "#8a5a32", k: "#f4c95d", m: "#4e2f1d", d: "#6e4425" },
  },
  wolf: {
    rows: [
      "..................",
      "..g..g............",
      "..gggg............",
      ".gfyfgg...........",
      "gffffgg.......mm..",
      "nfffffggggggggmmg.",
      ".ccfggggmmgggggg..",
      "...gggggmmmgggg...",
      "...gggcccccgggg...",
      "...gg.gg...gg.gg..",
      "...gg.gg...gg.gg..",
      "...kk.kk...kk.kk..",
    ],
    pal: { g: "#3e6b32", m: "#6aa645", f: "#7d7574", y: "#f4c95d", n: "#2b1d2e", c: "#c8bdae", k: "#2b1d2e" },
  },
  beetle: {
    rows: [
      "......h.........",
      ".....hh.........",
      "....hhh.........",
      "...ssshhsss.....",
      "..sllssssssss...",
      ".slllsssssssss..",
      "ssssssssmsssssss",
      "kssssssmssssssss",
      "ysssssssmssssssk",
      "ksssssssmsssssss",
      ".ssssssmsssssss.",
      "..ssssssssssss..",
      "..k.k..k..k.k...",
      ".k.k..k..k.k....",
    ],
    pal: { s: "#2a6a6e", l: "#86d0bd", m: "#1f4a52", h: "#e4dacb", k: "#2b1d2e", y: "#f4c95d" },
  },
  treant: {
    rows: [
      "...ll.lll..ll.......",
      "..llllllllllll.l....",
      ".llllldllllllllll...",
      "llllllllllldlllll...",
      ".lllllllllllllll....",
      "...l..bbbbbb..l.....",
      ".b...bbbbbbbb...b...",
      "..bb.bkkbbkkb.bb....",
      "...bbbyybbyybbb.....",
      ".....bbbbbbbb.......",
      ".....bmmmmmmb.......",
      ".....bbbbbbbb.......",
      ".....bbdbbdbb.......",
      ".....bbbbbbbb.......",
      "....bbb.bb.bbb......",
      "...bb...bb...bb.....",
      "..bb....bb....bb....",
    ],
    pal: { l: "#3e6b32", d: "#6aa645", b: "#6e4425", k: "#2b1d2e", y: "#f4c95d", m: "#4e2f1d" },
  },
  king: {
    rows: [
      ".y...y.....y...y.....",
      ".yy.yy.....yy.yy.....",
      "..yyy.......yyy......",
      "...yyy.....yyy.......",
      "....yyyyyyyyy........",
      ".......aaaa..........",
      "......aakaaa.........",
      ".....aaaaaaa.........",
      ".....naaaaaaaaaaaaa..",
      "......aawwaaaaaaaaaa.",
      ".......aaaaaaaaaaaaa.",
      ".......aagggggaaaaa..",
      ".......aa.aa...aa.aa.",
      ".......aa.aa...aa.aa.",
      ".......kk.kk...kk.kk.",
    ],
    pal: { y: "#f4c95d", a: "#a8743f", k: "#2b1d2e", n: "#2b1d2e", w: "#fbf1dc", g: "#6aa645" },
  },
};

export const monsterSize = (id: string) => {
  const rows = MONSTER_ART[id].rows;
  return { w: Math.max(...rows.map((r) => r.length)) + 2, h: rows.length + 2 };
};

/** A monster as pixel squares with a dark outline. `px` is one art pixel. */
export function MonsterSprite({ id, px = 1, flash }: { id: string; px?: number; flash?: string }) {
  const { rows, pal } = MONSTER_ART[id];
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const at = (i: number, j: number) => (j >= 0 && j < h && i >= 0 && i < w ? pal[rows[j][i]] : undefined);
  const out: { i: number; j: number; c: string }[] = [];
  for (let j = -1; j <= h; j++)
    for (let i = -1; i <= w; i++) {
      const c = at(i, j);
      if (c) out.push({ i, j, c: flash ?? c });
      else if (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1)) out.push({ i, j, c: LINE });
    }
  return (
    <g shapeRendering="crispEdges">
      {out.map((p) => (
        <rect key={`${p.i},${p.j}`} x={(p.i + 1) * px} y={(p.j + 1) * px} width={px + 0.05} height={px + 0.05} fill={p.c} />
      ))}
    </g>
  );
}

/** The monster on its own, for the fight screen and the bestiary. */
export function MonsterPortrait({ id, size = 220, className = "", style }: { id: string; size?: number; className?: string; style?: CSSProperties }) {
  const s = monsterSize(id);
  return (
    <svg viewBox={`0 0 ${s.w} ${s.h}`} width={size} height={(size * s.h) / s.w} className={className} style={style} shapeRendering="crispEdges" aria-hidden>
      <MonsterSprite id={id} />
    </svg>
  );
}

// ---------- trees (one picture per kind) ----------

export const TREE_BOX = { w: 120, h: 150, footX: 60, footY: 140 };

const TREE_SETS: Record<TreeKind, { leaf: string; dark: string; light: string; trunk: string }> = {
  oak: { leaf: "#4f8a3a", dark: "#3e6b32", light: "#8cc05a", trunk: "#6e4425" },
  pine: { leaf: "#2f4a2a", dark: "#253d24", light: "#4f8a3a", trunk: "#4e2f1d" },
  birch: { leaf: "#8cc05a", dark: "#6aa645", light: "#b5d67a", trunk: "#e4dacb" },
  bush: { leaf: "#6aa645", dark: "#4f8a3a", light: "#b5d67a", trunk: "#6e4425" },
  ancient: { leaf: "#3e6b32", dark: "#2f4a2a", light: "#6aa645", trunk: "#4e2f1d" },
  willow: { leaf: "#86d0bd", dark: "#4fb0a0", light: "#c4ead9", trunk: "#6e4425" },
};

export function TreeSvg({ kind }: { kind: TreeKind }) {
  const c = TREE_SETS[kind];
  const B = TREE_BOX;
  const fx = B.footX;
  const fy = B.footY;
  let body: React.ReactNode;
  if (kind === "pine")
    body = (
      <>
        <rect x={fx - 6} y={fy - 26} width="12" height="26" fill={c.trunk} />
        <path d={`M${fx} ${fy - 136} L${fx + 30} ${fy - 92} H${fx + 16} L${fx + 42} ${fy - 56} H${fx + 22} L${fx + 50} ${fy - 20} H${fx - 50} L${fx - 22} ${fy - 56} H${fx - 42} L${fx - 16} ${fy - 92} H${fx - 30} Z`} fill={c.leaf} />
        <path d={`M${fx} ${fy - 128} L${fx - 18} ${fy - 96} M${fx - 4} ${fy - 86} L${fx - 28} ${fy - 60} M${fx - 6} ${fy - 50} L${fx - 36} ${fy - 24}`} stroke={c.light} strokeWidth="5" fill="none" />
        <path d={`M${fx + 8} ${fy - 60} L${fx + 34} ${fy - 26}`} stroke={c.dark} strokeWidth="6" fill="none" />
      </>
    );
  else if (kind === "bush")
    body = (
      <>
        <path d={`M${fx - 44} ${fy - 4} Q${fx - 54} ${fy - 30} ${fx - 30} ${fy - 40} Q${fx - 20} ${fy - 62} ${fx + 2} ${fy - 54} Q${fx + 26} ${fy - 66} ${fx + 34} ${fy - 40} Q${fx + 54} ${fy - 30} ${fx + 44} ${fy - 4} Z`} fill={c.leaf} />
        <path d={`M${fx - 28} ${fy - 36} Q${fx - 14} ${fy - 50} ${fx + 2} ${fy - 44}`} stroke={c.light} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d={`M${fx - 36} ${fy - 10} Q${fx} ${fy - 2} ${fx + 36} ${fy - 12}`} stroke={c.dark} strokeWidth="6" fill="none" />
        <circle cx={fx - 14} cy={fy - 24} r="4" fill="#e8a0a0" stroke="none" />
        <circle cx={fx + 18} cy={fy - 32} r="4" fill="#e8a0a0" stroke="none" />
        <circle cx={fx + 4} cy={fy - 14} r="4" fill="#fbe29a" stroke="none" />
      </>
    );
  else if (kind === "willow")
    body = (
      <>
        <rect x={fx - 7} y={fy - 40} width="14" height="40" fill={c.trunk} />
        <path d={`M${fx - 46} ${fy - 14} Q${fx - 58} ${fy - 80} ${fx - 20} ${fy - 104} Q${fx} ${fy - 118} ${fx + 22} ${fy - 104} Q${fx + 58} ${fy - 80} ${fx + 46} ${fy - 14} L${fx + 34} ${fy - 30} L${fx + 24} ${fy - 10} L${fx + 12} ${fy - 30} L${fx} ${fy - 12} L${fx - 12} ${fy - 30} L${fx - 24} ${fy - 10} L${fx - 34} ${fy - 30} Z`} fill={c.leaf} />
        {[-32, -16, 0, 16, 32].map((dx) => (
          <path key={dx} d={`M${fx + dx} ${fy - 96} Q${fx + dx - 4} ${fy - 60} ${fx + dx} ${fy - 30}`} stroke={c.dark} strokeWidth="4" fill="none" />
        ))}
        <path d={`M${fx - 24} ${fy - 98} Q${fx} ${fy - 112} ${fx + 18} ${fy - 100}`} stroke={c.light} strokeWidth="6" fill="none" />
      </>
    );
  else {
    const big = kind === "ancient";
    const k = big ? 1.12 : 1;
    body = (
      <g transform={`translate(${fx} ${fy}) scale(${k}) translate(${-fx} ${-fy})`}>
        <path d={`M${fx - (big ? 13 : 8)} ${fy} V${fy - 44} Q${fx} ${fy - 52} ${fx + (big ? 13 : 8)} ${fy - 44} V${fy} Z`} fill={c.trunk} />
        {big && <path d={`M${fx - 13} ${fy} Q${fx - 26} ${fy + 2} ${fx - 30} ${fy - 4} M${fx + 13} ${fy} Q${fx + 26} ${fy + 2} ${fx + 30} ${fy - 4}`} stroke={c.trunk} strokeWidth="8" fill="none" />}
        {kind === "birch" && <path d={`M${fx - 8} ${fy - 14} h6 M${fx + 2} ${fy - 28} h6 M${fx - 8} ${fy - 38} h5`} stroke="#3d3a40" strokeWidth="3" />}
        <path d={`M${fx - 48} ${fy - 50} Q${fx - 58} ${fy - 86} ${fx - 30} ${fy - 98} Q${fx - 20} ${fy - 128} ${fx + 8} ${fy - 122} Q${fx + 40} ${fy - 130} ${fx + 46} ${fy - 98} Q${fx + 62} ${fy - 80} ${fx + 50} ${fy - 50} Q${fx + 42} ${fy - 30} ${fx + 16} ${fy - 34} Q${fx} ${fy - 24} ${fx - 16} ${fy - 34} Q${fx - 42} ${fy - 28} ${fx - 48} ${fy - 50} Z`} fill={c.leaf} />
        <path d={`M${fx - 38} ${fy - 44} Q${fx - 10} ${fy - 30} ${fx + 12} ${fy - 40} Q${fx + 36} ${fy - 34} ${fx + 46} ${fy - 54}`} fill="none" stroke={c.dark} strokeWidth="7" strokeLinecap="round" />
        <path d={`M${fx - 24} ${fy - 96} Q${fx - 6} ${fy - 112} ${fx + 14} ${fy - 106}`} fill="none" stroke={c.light} strokeWidth="8" strokeLinecap="round" />
        <circle cx={fx + 28} cy={fy - 80} r="6" fill={c.light} stroke="none" />
        {big && <circle cx={fx - 26} cy={fy - 70} r="5" fill="#86d0bd" stroke="none" />}
        {kind === "oak" && <circle cx={fx - 20} cy={fy - 64} r="4" fill="#d9703b" stroke="none" />}
      </g>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={B.w} height={B.h} viewBox={`0 0 ${B.w} ${B.h}`}>
      <ellipse cx={fx + 4} cy={fy - 2} rx={kind === "ancient" ? 46 : 36} ry="10" fill="#000" opacity="0.22" />
      <g stroke={LINE} strokeWidth="4" strokeLinejoin="round">
        {body}
      </g>
    </svg>
  );
}

// ---------- the ground ----------

const pathD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");

const FLOWERS = ["#fbf1dc", "#f4c95d", "#e8a0a0", "#a996d6", "#e8954a"];

export const WildsGround = memo(function WildsGround({ layout: L }: { layout: WildsLayout }) {
  const [grove, moss, meadow] = L.zones;
  const cx = L.w / 2;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={L.w} height={L.h} viewBox={`0 0 ${L.w} ${L.h}`}>
      <defs>
        <pattern id="w-meadow" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="#8cc05a" />
          <path d="M8 22 q3 -8 5 0 q2 -7 4 0 M70 12 q3 -8 5 0 q2 -7 4 0 M38 70 q3 -8 5 0 q2 -7 4 0 M92 84 q3 -8 5 0 q2 -7 4 0 M14 100 q3 -8 5 0" stroke="#6aa645" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="54" y="36" width="5" height="5" fill="#b5d67a" />
          <rect x="100" y="104" width="5" height="5" fill="#b5d67a" />
        </pattern>
        <pattern id="w-moss" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="#6aa645" />
          <path d="M8 22 q3 -8 5 0 q2 -7 4 0 M70 12 q3 -8 5 0 q2 -7 4 0 M38 70 q3 -8 5 0 q2 -7 4 0 M92 84 q3 -8 5 0 q2 -7 4 0" stroke="#4f8a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="20" y="50" width="16" height="8" fill="#4f8a3a" />
          <rect x="80" y="100" width="12" height="6" fill="#8cc05a" />
        </pattern>
        <pattern id="w-grove" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="#4f8a3a" />
          <path d="M8 22 q3 -8 5 0 q2 -7 4 0 M70 12 q3 -8 5 0 q2 -7 4 0 M38 70 q3 -8 5 0 q2 -7 4 0 M92 84 q3 -8 5 0" stroke="#3e6b32" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="60" y="40" width="10" height="6" fill="#86d0bd" />
          <rect x="16" y="96" width="18" height="8" fill="#3e6b32" />
        </pattern>
        <pattern id="w-tall" width="24" height="20" patternUnits="userSpaceOnUse">
          <path d="M2 20 L6 4 L10 20 M12 20 L16 2 L20 20" fill="#3e6b32" stroke="#2f4a2a" strokeWidth="2" />
          <path d="M6 8 L7 16 M16 6 L17 16" stroke="#8cc05a" strokeWidth="2" />
        </pattern>
        <pattern id="w-water" width="80" height="40" patternUnits="userSpaceOnUse">
          <rect width="80" height="40" fill="#4f78a8" />
          <path d="M6 12 h16 M46 28 h20 M30 6 h8" stroke="#b4d0e6" strokeWidth="4" />
          <path d="M10 30 h10 M56 10 h12" stroke="#34507a" strokeWidth="4" />
        </pattern>
        <pattern id="w-plank" width="20" height="40" patternUnits="userSpaceOnUse">
          <rect width="20" height="40" fill="#a8743f" />
          <path d="M0.5 0 V40" stroke="#6e4425" strokeWidth="3" />
          <rect x="4" y="6" width="10" height="4" fill="#c9955a" />
        </pattern>
      </defs>
      <rect x="0" y={meadow.rect.y} width={L.w} height={meadow.rect.h} fill="url(#w-meadow)" />
      <rect x="0" y={moss.rect.y} width={L.w} height={moss.rect.h} fill="url(#w-moss)" />
      <rect x="0" y="0" width={L.w} height={grove.rect.h} fill="url(#w-grove)" />
      {/* soft edges between the zones */}
      {[moss.rect.y, meadow.rect.y].map((y, i) => (
        <path key={i} d={Array.from({ length: Math.ceil(L.w / 40) + 1 }, (_, k) => `${k ? "L" : "M"}${k * 40} ${y + ((k * 37) % 3) * 12 - 12}`).join(" ") + ` L${L.w} ${y + 24} L0 ${y + 24} Z`} fill={i ? "url(#w-meadow)" : "url(#w-moss)"} />
      ))}
      {/* tall grass */}
      {L.grass.map((g, i) => (
        <rect key={i} x={g.x} y={g.y} width={g.w} height={g.h} rx="16" fill="url(#w-tall)" />
      ))}
      {/* dirt paths */}
      {[L.path, L.trail].map((p, i) => (
        <g key={i} fill="none" strokeLinejoin="round" strokeLinecap="round">
          <path d={pathD(p)} stroke={LINE} strokeWidth={i ? 70 : 96} opacity="0.35" />
          <path d={pathD(p)} stroke="#c9955a" strokeWidth={i ? 62 : 88} />
          <path d={pathD(p)} stroke="#e0b57a" strokeWidth={i ? 30 : 46} />
        </g>
      ))}
      {/* the river */}
      {L.water.map((r, i) => (
        <g key={i}>
          <rect x={r.x - 1} y={r.y - 8} width={r.w + 2} height={r.h + 16} fill="#a8743f" />
          <rect x={r.x - 1} y={r.y - 4} width={r.w + 2} height={r.h + 8} fill="#2a6a6e" />
          <rect x={r.x - 1} y={r.y + 4} width={r.w + 2} height={r.h - 8} fill="url(#w-water)" />
        </g>
      ))}
      {L.bridges.map((b, i) => (
        <g key={i} stroke={LINE} strokeWidth="4">
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="url(#w-plank)" />
          <rect x={b.x - 8} y={b.y} width="10" height={b.h} fill="#6e4425" />
          <rect x={b.x + b.w - 2} y={b.y} width="10" height={b.h} fill="#6e4425" />
          {[0, 1, 2, 3].map((k) => (
            <g key={k}>
              <rect x={b.x - 12} y={b.y + (k * b.h) / 3 - 8} width="18" height="18" fill="#8a5a32" />
              <rect x={b.x + b.w - 6} y={b.y + (k * b.h) / 3 - 8} width="18" height="18" fill="#8a5a32" />
            </g>
          ))}
        </g>
      ))}
      {/* the pond */}
      <ellipse cx={L.pond.x} cy={L.pond.y} rx={L.pond.rx + 14} ry={L.pond.ry + 12} fill="#c9955a" stroke={LINE} strokeWidth="4" />
      <ellipse cx={L.pond.x} cy={L.pond.y} rx={L.pond.rx} ry={L.pond.ry} fill="url(#w-water)" stroke="#2a6a6e" strokeWidth="10" />
      {[[-60, -20], [40, 30], [90, -40]].map(([dx, dy], i) => (
        <g key={i} transform={`translate(${L.pond.x + dx} ${L.pond.y + dy})`} stroke={LINE} strokeWidth="3">
          <ellipse rx="22" ry="12" fill="#6aa645" />
          <circle cx="8" cy="-4" r="5" fill="#e8a0a0" />
        </g>
      ))}
      {/* flowers */}
      {L.flowers.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y})`}>
          <rect x="-2" y="0" width="4" height="10" fill="#3e6b32" />
          <rect x="-7" y="-6" width="14" height="8" fill={FLOWERS[f.c]} stroke={LINE} strokeWidth="2" />
          <rect x="-2" y="-4" width="4" height="4" fill="#cf8a1f" />
        </g>
      ))}
      {L.mushrooms.map((m, i) => (
        <g key={i} transform={`translate(${m.x} ${m.y})`} stroke={LINE} strokeWidth="2.5">
          <rect x="-3" y="-4" width="6" height="8" fill="#f3e2c0" />
          <path d="M-9 -3 Q0 -16 9 -3 Z" fill={i % 3 ? "#c0502f" : "#a996d6"} />
        </g>
      ))}
      {L.rocks.map((r, i) => (
        <g key={i} transform={`translate(${r.x} ${r.y}) scale(${r.s})`} stroke={LINE} strokeWidth="3.5">
          <path d="M-18 4 Q-22 -10 -8 -16 Q6 -22 16 -10 Q24 0 14 6 Z" fill="#a3998f" />
          <path d="M-8 -10 Q2 -16 10 -8" fill="none" stroke="#e4dacb" strokeWidth="4" />
          {i % 2 === 0 && <path d="M-16 2 Q-6 -2 4 4" fill="none" stroke="#6aa645" strokeWidth="5" />}
        </g>
      ))}
      {/* the Grove King's altar inside a ring of standing stones */}
      <ellipse cx={L.altar.x + L.altar.w / 2} cy={L.altar.y + L.altar.h / 2} rx={7.2 * T} ry={4.6 * T} fill="#3e6b32" stroke="#2f4a2a" strokeWidth="10" />
      <g stroke={LINE} strokeWidth="4">
        <rect x={L.altar.x} y={L.altar.y + 0.6 * T} width={L.altar.w} height={L.altar.h - 0.6 * T} fill="#7d7574" />
        <rect x={L.altar.x + 10} y={L.altar.y + 0.6 * T + 10} width={L.altar.w - 20} height="18" fill="#a3998f" />
        <rect x={L.altar.x + L.altar.w / 2 - 24} y={L.altar.y} width="48" height={0.9 * T} fill="#c8bdae" />
        <path d={`M${L.altar.x + L.altar.w / 2 - 10} ${L.altar.y + 10} h20 v14 h-20 z`} fill="#f4c95d" />
        <path d={`M${L.altar.x + 20} ${L.altar.y + L.altar.h - 20} h${L.altar.w - 40}`} stroke="#4fb0a0" strokeWidth="6" />
      </g>
      {L.stones.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y}) scale(${s.s})`} stroke={LINE} strokeWidth="3.5">
          <ellipse cx="2" cy="4" rx="18" ry="6" fill="#000" opacity="0.25" stroke="none" />
          <path d="M-12 4 V-44 Q0 -56 12 -44 V4 Z" fill="#7d7574" />
          <path d="M-4 -36 v10 M2 -20 v8" stroke="#4fb0a0" strokeWidth="4" />
        </g>
      ))}
      {/* camp */}
      <Camp L={L} />
      {/* Dawnterra's north gate, seen from the outside */}
      <g stroke={LINE} strokeWidth="4">
        <rect x={cx - 4 * T} y={L.h - 1.6 * T} width={8 * T} height={1.6 * T} fill="#7d7574" />
        <rect x={cx - 1.7 * T} y={L.h - 1.5 * T} width={3.4 * T} height={1.5 * T} fill="#3d3a40" />
        {[-1.2, -0.4, 0.4, 1.2].map((k) => (
          <rect key={k} x={cx + k * T - 4} y={L.h - 1.5 * T} width="8" height={1.5 * T} fill="#a3998f" />
        ))}
        <rect x={cx - 4.4 * T} y={L.h - 2.2 * T} width={1 * T} height={2.2 * T} fill="#a3998f" />
        <rect x={cx + 3.4 * T} y={L.h - 2.2 * T} width={1 * T} height={2.2 * T} fill="#a3998f" />
      </g>
    </svg>
  );
});

function Camp({ L }: { L: WildsLayout }) {
  const { fire, tent, merchant, sign } = L.camp;
  return (
    <g stroke={LINE} strokeWidth="4" strokeLinejoin="round">
      <ellipse cx={fire.x - 2 * T} cy={fire.y - 0.5 * T} rx={7 * T} ry={4 * T} fill="#c9955a" stroke="none" opacity="0.55" />
      {/* tent */}
      <path d={`M${tent.x} ${tent.y + tent.h} L${tent.x + tent.w / 2} ${tent.y - 10} L${tent.x + tent.w} ${tent.y + tent.h} Z`} fill="#c0502f" />
      <path d={`M${tent.x + tent.w / 2} ${tent.y - 10} L${tent.x + tent.w / 2 - 18} ${tent.y + tent.h} H${tent.x + tent.w / 2 + 18} Z`} fill="#4e2f1d" />
      <path d={`M${tent.x + 20} ${tent.y + tent.h - 20} L${tent.x + tent.w / 2} ${tent.y + 10}`} stroke="#e8954a" strokeWidth="5" fill="none" />
      {/* logs and fire */}
      <rect x={fire.x - 46} y={fire.y + 16} width="36" height="14" fill="#8a5a32" />
      <rect x={fire.x + 10} y={fire.y + 16} width="36" height="14" fill="#8a5a32" />
      <ellipse cx={fire.x} cy={fire.y + 6} rx="22" ry="10" fill="#7d7574" />
      <path d={`M${fire.x - 14} ${fire.y + 6} Q${fire.x - 18} ${fire.y - 20} ${fire.x - 4} ${fire.y - 32} Q${fire.x} ${fire.y - 14} ${fire.x + 6} ${fire.y - 36} Q${fire.x + 22} ${fire.y - 16} ${fire.x + 14} ${fire.y + 6} Z`} fill="#d9703b" />
      <path d={`M${fire.x - 6} ${fire.y + 4} Q${fire.x - 6} ${fire.y - 12} ${fire.x + 2} ${fire.y - 18} Q${fire.x + 10} ${fire.y - 6} ${fire.x + 6} ${fire.y + 4} Z`} fill="#f4c95d" />
      {/* merchant's stall */}
      <rect x={merchant.x - 50} y={merchant.y - 70} width="100" height="16" fill="#2f8f83" />
      <path d={`M${merchant.x - 50} ${merchant.y - 54} h100 l-8 12 h-84 z`} fill="#86d0bd" />
      <rect x={merchant.x - 46} y={merchant.y - 54} width="8" height="60" fill="#6e4425" />
      <rect x={merchant.x + 38} y={merchant.y - 54} width="8" height="60" fill="#6e4425" />
      <rect x={merchant.x - 54} y={merchant.y - 8} width="108" height="22" fill="#a8743f" />
      <rect x={merchant.x - 40} y={merchant.y - 20} width="14" height="12" fill="#c0502f" />
      <rect x={merchant.x - 18} y={merchant.y - 22} width="12" height="14" fill="#4f78a8" />
      <rect x={merchant.x + 6} y={merchant.y - 20} width="14" height="12" fill="#6aa645" />
      {/* signpost */}
      <rect x={sign.x - 4} y={sign.y - 50} width="8" height="54" fill="#6e4425" />
      <path d={`M${sign.x - 40} ${sign.y - 60} h70 l12 10 l-12 10 h-70 z`} fill="#c9955a" />
    </g>
  );
}
