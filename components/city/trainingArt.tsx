"use client";

// The Training Hall drawn from above: a sand floor with three roped sparring rings, a
// practice monster in each, and the weapon rack on the back wall. The monsters are small
// pixel sprites, drawn the same way in the room and in the fight.

import { memo, type CSSProperties } from "react";
import { T } from "@/lib/city";
import { FOES, type PracticeFoe, type TrainingLayout } from "@/lib/training";
import { Defs, LINE, Plant } from "./art";

const SPRITES: Record<PracticeFoe["id"], { rows: string[]; pal: Record<string, string> }> = {
  dummy: {
    rows: [
      "......hhhh......",
      ".....hhhhhh.....",
      ".....hkhhkh.....",
      ".....hhhhhh.....",
      ".....hhrrhh.....",
      "......hhhh......",
      "..ssssbbbbssss..",
      ".s..sbbbbbbs..s.",
      "....bbbbbbbb....",
      "....rrrrrrrr....",
      "....bbbbbbbb....",
      ".....bbbbbb.....",
      ".......ww.......",
      ".......ww.......",
      ".......ww.......",
      ".....wwwwww.....",
    ],
    pal: { h: "#e8cfa2", k: "#3b2416", r: "#93392a", s: "#f4c95d", b: "#c99862", w: "#6e4425" },
  },
  slime: {
    rows: [
      "................",
      "................",
      "................",
      "......gggg......",
      "....gggggggg....",
      "...gllgggggggg..",
      "..gllgggggggggg.",
      "..gggggggggggggg",
      ".gggkkggggkkgggg",
      ".gggkwggggkwgggg",
      ".gggggggggggggg.",
      "gggggggmmggggggg",
      "gggggggggggggggg",
      ".dddddddddddddd.",
      "..dddddddddddd..",
      "................",
    ],
    pal: { g: "#6aa645", l: "#b5d67a", k: "#2b1d2e", w: "#fbf1dc", m: "#3c7a2c", d: "#3c7a2c" },
  },
  wolf: {
    rows: [
      "..................",
      "..a..a............",
      "..aaaa............",
      ".afyfaa...........",
      "affffaa.......tt..",
      "nfffffaaaaaaaatto.",
      ".ccfaaaaaaaaaaaoo.",
      "...aaaaaaaaaaaaa..",
      "...aaaccccccaaaa..",
      "...aa.aa...aa.aa..",
      "...aa.aa...aa.aa..",
      "...kk.kk...kk.kk..",
    ],
    pal: { a: "#4a3b4f", f: "#7d7574", y: "#f4c95d", n: "#2b1d2e", c: "#c8bdae", t: "#d9703b", o: "#f4c95d", k: "#2b1d2e" },
  },
};

/** A pixel sprite as SVG squares, with a dark outline round it. `px` is the size of one pixel. */
export function FoeSprite({ id, px = 6, x = 0, y = 0 }: { id: PracticeFoe["id"]; px?: number; x?: number; y?: number }) {
  const { rows, pal } = SPRITES[id];
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const at = (i: number, j: number) => (j >= 0 && j < h && i >= 0 && i < w ? pal[rows[j][i]] : undefined);
  const out: { i: number; j: number; c: string }[] = [];
  for (let j = -1; j <= h; j++)
    for (let i = -1; i <= w; i++) {
      const c = at(i, j);
      if (c) out.push({ i, j, c });
      else if (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1)) out.push({ i, j, c: LINE });
    }
  return (
    <g transform={`translate(${x} ${y})`} shapeRendering="crispEdges">
      {out.map((p) => (
        <rect key={`${p.i},${p.j}`} x={p.i * px} y={p.j * px} width={px + 0.5} height={px + 0.5} fill={p.c} />
      ))}
    </g>
  );
}

export const spriteSize = (id: PracticeFoe["id"]) => {
  const rows = SPRITES[id].rows;
  return { w: Math.max(...rows.map((r) => r.length)) + 2, h: rows.length + 2 };
};

/** The monster on its own, for the fight screen and the talk box. */
export function FoePortrait({ id, size = 220, className = "" }: { id: PracticeFoe["id"]; size?: number; className?: string }) {
  const s = spriteSize(id);
  return (
    <svg viewBox={`-1 -1 ${s.w} ${s.h}`} width={size} height={(size * s.h) / s.w} className={className} shapeRendering="crispEdges" aria-hidden>
      <FoeSprite id={id} px={1} />
    </svg>
  );
}

function Rack({ r }: { r: TrainingLayout["rack"] }) {
  const slots = 5;
  return (
    <g stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <rect x={r.x} y={r.y} width={r.w} height={r.h * 0.75} fill="#8a5a32" />
      <rect x={r.x} y={r.y + r.h * 0.75 - 10} width={r.w} height="12" fill="#6e4425" />
      {Array.from({ length: slots }, (_, i) => {
        const cx = r.x + ((i + 0.5) * r.w) / slots;
        const top = r.y + 6;
        // sword, hammer, staff, blaster, scythe, in wood and steel
        if (i === 0) return <g key={i}><path d={`M${cx} ${top} V${top + 38}`} stroke="#c8bdae" strokeWidth="6" /><path d={`M${cx - 8} ${top + 30} h16`} strokeWidth="4" stroke="#e8a33d" /></g>;
        if (i === 1) return <g key={i}><path d={`M${cx} ${top + 8} V${top + 44}`} stroke="#6e4425" strokeWidth="5" /><rect x={cx - 12} y={top} width="24" height="14" fill="#7d7574" /></g>;
        if (i === 2) return <g key={i}><path d={`M${cx} ${top + 6} V${top + 44}`} stroke="#8a5a32" strokeWidth="5" /><circle cx={cx} cy={top + 6} r="6" fill="#4fb0a0" /></g>;
        if (i === 3) return <g key={i}><rect x={cx - 12} y={top + 12} width="24" height="10" fill="#7d7574" /><rect x={cx - 8} y={top + 22} width="7" height="12" fill="#3d3a40" /></g>;
        return <g key={i}><path d={`M${cx + 4} ${top + 2} V${top + 44}`} stroke="#3a2a5a" strokeWidth="4" /><path d={`M${cx + 4} ${top + 4} Q${cx - 14} ${top + 2} ${cx - 16} ${top + 18}`} fill="none" stroke="#a996d6" strokeWidth="5" /></g>;
      })}
    </g>
  );
}

export const TrainingArt = memo(function TrainingArt({ layout: L }: { layout: TrainingLayout }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={L.w} height={L.h} viewBox={`0 0 ${L.w} ${L.h}`}>
      <Defs />
      <rect width={L.w} height={L.h} fill="url(#a-plank)" />
      {/* stone back wall with banners */}
      <rect width={L.w} height={L.wall} fill="url(#a-stone)" />
      {[0.32, 0.5, 0.68, 0.86].map((f, i) => (
        <g key={f} stroke={LINE} strokeWidth="3">
          <path d={`M${L.w * f - 22} 14 h44 v58 l-22 -12 l-22 12 z`} fill={["#c0392b", "#34507a", "#4f9a3a", "#e8a33d"][i]} />
          <circle cx={L.w * f} cy="36" r="8" fill="#f4c95d" />
        </g>
      ))}
      <rect y={L.wall - 4} width={L.w} height="10" fill="#6e4425" stroke={LINE} strokeWidth="3" />
      <Rack r={L.rack} />
      {L.rings.map((r) => (
        <g key={r.id}>
          {/* sand ring with rope and corner posts */}
          <rect x={r.ring.x} y={r.ring.y} width={r.ring.w} height={r.ring.h} fill="#e8cfa2" stroke={LINE} strokeWidth="4" />
          <rect x={r.ring.x + 8} y={r.ring.y + 8} width={r.ring.w - 16} height={r.ring.h - 16} fill="none" stroke="#c99862" strokeWidth="4" strokeDasharray="12 8" />
          {[
            [r.ring.x, r.ring.y],
            [r.ring.x + r.ring.w, r.ring.y],
            [r.ring.x, r.ring.y + r.ring.h],
            [r.ring.x + r.ring.w, r.ring.y + r.ring.h],
          ].map(([x, y], i) => (
            <rect key={i} x={x - 7} y={y - 7} width="14" height="14" fill="#6e4425" stroke={LINE} strokeWidth="3" />
          ))}
          <ellipse cx={r.x} cy={r.y + 10} rx={1.1 * T} ry={0.3 * T} fill="#000" opacity="0.2" />
          {(() => {
            const s = spriteSize(r.id);
            const px = 5;
            return <FoeSprite id={r.id} px={px} x={r.x - (s.w * px) / 2 + px} y={r.y + 12 - s.h * px} />;
          })()}
        </g>
      ))}
      <Plant x={L.w - 0.7 * T} y={L.wall + 0.6 * T} s={1.3} seed={4} />
      <g transform={`translate(${L.exit.x} ${L.exit.y})`} stroke={LINE} strokeWidth="4">
        <rect width={L.exit.w} height={L.exit.h + 6} rx="8" fill="#d62839" />
      </g>
    </svg>
  );
});

const display: CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "0.02em", lineHeight: 1 };

export const TrainingLabels = memo(function TrainingLabels({ layout: L }: { layout: TrainingLayout }) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <div className="absolute text-center border-[2.5px] px-2 py-1" style={{ left: L.rack.x + L.rack.w / 2 - 80, top: L.rack.y + L.rack.h - 6, width: 160, background: "#f3e2c0", borderColor: LINE, color: LINE, ...display, fontSize: 15 }}>
        WEAPON RACK
      </div>
      {L.rings.map((r) => {
        const f = FOES.find((x) => x.id === r.id)!;
        return (
          <div key={r.id} className="absolute text-center border-[2.5px] px-1 py-0.5" style={{ left: r.x - 80, top: r.ring.y + r.ring.h - 46, width: 160, background: "#f3e2c0", borderColor: LINE, color: LINE }}>
            <div style={{ ...display, fontSize: 15 }}>{f.name}</div>
            <div style={{ ...display, fontSize: 12, marginTop: 2, background: f.id === "dummy" ? "#b5d67a" : f.id === "slime" ? "#f4c95d" : "#e8a0a0" }}>{f.level}</div>
          </div>
        );
      })}
      <div className="absolute grid place-content-center" style={{ left: L.exit.x, top: L.exit.y, width: L.exit.w, height: L.exit.h + 6, ...display, fontSize: 22, color: "#fff" }}>
        EXIT
      </div>
    </div>
  );
});
