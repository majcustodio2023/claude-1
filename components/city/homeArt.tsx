"use client";

// Your home inside: a cosy log-cabin room (plank walls, windows with curtains, a wooden floor)
// and every piece of furniture, drawn in the same thick-outline style as the town. Like the
// other scenery it has no text, so the game turns it into one picture; HomeLabels draws the
// exit sign and the outline of the piece you're moving on top.

import { memo, type ReactNode } from "react";
import type { Rect } from "@/lib/city";
import { FURNITURE, type HomeLayout } from "@/lib/home";
import { Bookshelf, Defs, LINE, Plant } from "./art";

function Piece({ kind, r, id }: { kind: string; r: Rect; id: string }) {
  const cx = r.x + r.w / 2;
  const by = r.y + r.h;
  const shadow = <rect x={r.x + 6} y={by - 10} width={r.w - 4} height="12" rx="6" fill="#000" opacity="0.18" stroke="none" />;
  let body: ReactNode = null;
  switch (kind) {
    case "bed":
      body = (
        <g>
          <rect x={r.x + 4} y={r.y - 14} width={r.w - 8} height="26" rx="6" fill="#7a4b36" />
          <rect x={r.x + 6} y={r.y + 6} width={r.w - 12} height={r.h - 14} rx="6" fill="#f6efe6" />
          <rect x={r.x + 14} y={r.y + 12} width={r.w - 28} height="22" rx="8" fill="#ffffff" />
          <path d={`M${r.x + 6} ${r.y + 44} H${r.x + r.w - 6} V${by - 14} Q${r.x + r.w - 6} ${by - 8} ${r.x + r.w - 12} ${by - 8} H${r.x + 12} Q${r.x + 6} ${by - 8} ${r.x + 6} ${by - 14} Z`} fill="#d9604c" />
          <path d={`M${r.x + 6} ${r.y + 58} H${r.x + r.w - 6} M${r.x + 6} ${r.y + 80} H${r.x + r.w - 6} M${cx} ${r.y + 44} V${by - 8}`} stroke="#f2a07b" strokeWidth="3" />
          <rect x={r.x + 2} y={by - 14} width={r.w - 4} height="12" rx="4" fill="#7a4b36" />
        </g>
      );
      break;
    case "desk":
      body = (
        <g>
          <rect x={r.x + 4} y={r.y + 4} width={r.w - 8} height={r.h - 14} rx="4" fill="#a86a43" />
          <rect x={r.x + 4} y={by - 14} width={r.w - 8} height="8" fill="#7d4c2e" strokeWidth="0" />
          <rect x={r.x + 12} y={r.y + 8} width="24" height="16" fill="#f6e7cf" strokeWidth="2.2" transform={`rotate(-6 ${r.x + 24} ${r.y + 16})`} />
          <rect x={r.x + 44} y={r.y - 6} width="20" height="18" rx="2" fill="#e2453c" strokeWidth="2.4" />
          <path d={`M${r.x + r.w - 20} ${r.y + 16} V${r.y - 8} l10 -6`} fill="none" strokeWidth="3" />
          <path d={`M${r.x + r.w - 16} ${r.y - 20} l12 4 l-4 10 l-12 -4 z`} fill="#ffd166" strokeWidth="2.4" />
        </g>
      );
      break;
    case "chair":
      body = (
        <g>
          <rect x={r.x + 8} y={r.y + 2} width={r.w - 16} height="12" rx="3" fill="#7a4b36" />
          <rect x={r.x + 6} y={r.y + 14} width={r.w - 12} height={r.h - 22} rx="4" fill="#c98050" />
          <path d={`M${r.x + 10} ${by - 8} v6 M${r.x + r.w - 10} ${by - 8} v6`} strokeWidth="4" />
        </g>
      );
      break;
    case "fireplace":
      body = (
        <g>
          <rect x={r.x + 2} y={r.y - 46} width={r.w - 4} height={r.h + 40} rx="4" fill="url(#a-stone)" />
          <rect x={r.x - 4} y={r.y - 52} width={r.w + 8} height="10" rx="3" fill="#7a4b36" />
          <path d={`M${r.x + 16} ${by - 6} V${r.y - 12} Q${cx} ${r.y - 34} ${r.x + r.w - 16} ${r.y - 12} V${by - 6} Z`} fill="#2b1d2e" />
          <circle cx={cx} cy={by - 18} r="30" fill="url(#a-glow)" stroke="none" />
          <path d={`M${cx - 18} ${by - 6} Q${cx - 20} ${by - 26} ${cx - 8} ${by - 34} Q${cx - 6} ${by - 22} ${cx} ${by - 40} Q${cx + 10} ${by - 24} ${cx + 12} ${by - 30} Q${cx + 22} ${by - 18} ${cx + 18} ${by - 6} Z`} fill="#ff9f1c" strokeWidth="2.5" />
          <path d={`M${cx - 8} ${by - 6} Q${cx - 8} ${by - 18} ${cx} ${by - 24} Q${cx + 8} ${by - 16} ${cx + 8} ${by - 6} Z`} fill="#ffd166" strokeWidth="2" />
          <rect x={r.x + 18} y={by - 8} width={r.w - 36} height="6" fill="#7a4b36" strokeWidth="2" />
        </g>
      );
      break;
    case "chest":
      body = (
        <g>
          <rect x={r.x + 3} y={r.y + 4} width={r.w - 6} height={r.h - 10} rx="4" fill="#a86a43" />
          <path d={`M${r.x + 3} ${r.y + 14} H${r.x + r.w - 3}`} strokeWidth="3" />
          <path d={`M${r.x + 10} ${r.y + 4} V${by - 6} M${r.x + r.w - 10} ${r.y + 4} V${by - 6}`} stroke="#d9a73f" strokeWidth="4" />
          <rect x={cx - 5} y={r.y + 12} width="10" height="10" rx="2" fill="#ffd166" strokeWidth="2" />
        </g>
      );
      break;
    case "rug":
      return (
        <g stroke={LINE} strokeWidth="3.5">
          <rect x={r.x + 4} y={r.y + 4} width={r.w - 8} height={r.h - 8} rx="10" fill="url(#a-rug)" />
          <rect x={r.x + 12} y={r.y + 12} width={r.w - 24} height={r.h - 24} rx="6" fill="none" stroke="#f6e7cf" strokeWidth="3" />
        </g>
      );
    case "roundRug":
      return (
        <g stroke={LINE} strokeWidth="3.5">
          <ellipse cx={cx} cy={r.y + r.h / 2} rx={r.w / 2 - 4} ry={r.h / 2 - 6} fill="#7cc6c0" />
          <ellipse cx={cx} cy={r.y + r.h / 2} rx={r.w / 2 - 16} ry={r.h / 2 - 18} fill="none" stroke="#f6e7cf" strokeWidth="3" />
          <ellipse cx={cx} cy={r.y + r.h / 2} rx={r.w / 2 - 28} ry={r.h / 2 - 30} fill="#f19aa8" strokeWidth="2.5" />
        </g>
      );
    case "bookshelf":
      body = <g transform={`translate(${r.x + (r.w - 64 * 1.2) / 2} ${by - 96}) scale(1.2)`}><Bookshelf x={0} y={0} seed={id.length * 31 + r.x} /></g>;
      break;
    case "wardrobe":
      body = (
        <g>
          <rect x={r.x + 4} y={r.y - 54} width={r.w - 8} height={r.h + 48} rx="4" fill="#8a5636" />
          <path d={`M${cx} ${r.y - 50} V${by - 8}`} strokeWidth="3" />
          <rect x={r.x + 10} y={r.y - 46} width={r.w / 2 - 14} height={r.h + 30} rx="2" fill="#a86a43" strokeWidth="2.4" />
          <rect x={cx + 4} y={r.y - 46} width={r.w / 2 - 14} height={r.h + 30} rx="2" fill="#a86a43" strokeWidth="2.4" />
          <circle cx={cx - 6} cy={r.y - 6} r="3" fill="#ffd166" strokeWidth="1.6" />
          <circle cx={cx + 6} cy={r.y - 6} r="3" fill="#ffd166" strokeWidth="1.6" />
        </g>
      );
      break;
    case "stove":
      body = (
        <g>
          <path d={`M${r.x + r.w - 22} ${r.y - 60} V${r.y - 10}`} stroke="#4a3b4f" strokeWidth="10" />
          <path d={`M${r.x + r.w - 22} ${r.y - 60} V${r.y - 10}`} strokeWidth="2" fill="none" />
          <rect x={r.x + 4} y={r.y - 14} width={r.w - 8} height={r.h + 6} rx="4" fill="#4a3b4f" />
          <rect x={r.x + 12} y={r.y + 4} width="26" height="18" rx="3" fill="#ff9f1c" strokeWidth="2.4" />
          <path d={`M${r.x + 46} ${r.y - 20} h22 v12 h-22 z`} fill="#9aa5a2" strokeWidth="2.4" />
          <path d={`M${r.x + 50} ${r.y - 26} q4 -8 8 0 q4 -8 8 0`} fill="none" stroke="#f6efe6" strokeWidth="2.4" />
        </g>
      );
      break;
    case "table":
      body = (
        <g>
          <rect x={r.x + 6} y={r.y + 10} width={r.w - 12} height={r.h - 26} rx="10" fill="#f6efe6" />
          <path d={`M${r.x + 6} ${r.y + 40} Q${cx} ${r.y + 52} ${r.x + r.w - 6} ${r.y + 40} V${by - 18} H${r.x + 6} Z`} fill="#d9604c" strokeWidth="2.5" />
          <path d={`M${r.x + 16} ${by - 18} v12 M${r.x + r.w - 16} ${by - 18} v12`} strokeWidth="5" />
          <path d={`M${cx - 6} ${r.y + 30} h12 l-2 -14 h-8 z`} fill="#7cc6c0" strokeWidth="2.2" />
          <circle cx={cx - 4} cy={r.y + 12} r="5" fill="#f19aa8" strokeWidth="1.8" />
          <circle cx={cx + 5} cy={r.y + 10} r="5" fill="#ffd166" strokeWidth="1.8" />
        </g>
      );
      break;
    case "sofa":
      body = (
        <g>
          <rect x={r.x + 2} y={r.y - 6} width={r.w - 4} height="22" rx="8" fill="#5e8f4e" />
          <rect x={r.x + 2} y={r.y + 10} width={r.w - 4} height={r.h - 16} rx="6" fill="#77a865" />
          <path d={`M${r.x + r.w / 3} ${r.y + 12} V${by - 8} M${r.x + (2 * r.w) / 3} ${r.y + 12} V${by - 8}`} strokeWidth="2.4" />
          <rect x={r.x - 2} y={r.y} width="14" height={r.h - 6} rx="5" fill="#5e8f4e" />
          <rect x={r.x + r.w - 12} y={r.y} width="14" height={r.h - 6} rx="5" fill="#5e8f4e" />
          <rect x={r.x + 18} y={r.y + 2} width="20" height="16" rx="5" fill="#ffd166" strokeWidth="2.2" transform={`rotate(-10 ${r.x + 28} ${r.y + 10})`} />
        </g>
      );
      break;
    case "plant":
      return <Plant x={cx} y={by - 4} s={1.15} seed={id.length} />;
    case "lamp":
      body = (
        <g>
          <circle cx={cx} cy={r.y - 18} r="34" fill="url(#a-glow)" stroke="none" />
          <path d={`M${cx} ${by - 6} V${r.y - 14}`} strokeWidth="4" />
          <ellipse cx={cx} cy={by - 6} rx="12" ry="4" fill="#4a3b4f" strokeWidth="2.4" />
          <path d={`M${cx - 16} ${r.y - 12} L${cx - 9} ${r.y - 34} H${cx + 9} L${cx + 16} ${r.y - 12} Z`} fill="#ffd166" />
        </g>
      );
      break;
  }
  return (
    <g stroke={LINE} strokeWidth="3.5" strokeLinejoin="round">
      {shadow}
      {body}
    </g>
  );
}

export const HomeArt = memo(function HomeArt({ layout }: { layout: HomeLayout }) {
  const L = layout;
  // Rugs first so furniture stands on them; then back to front.
  const order = [...L.items].sort((a, b) => Number(!FURNITURE[a.kind].walk) - Number(!FURNITURE[b.kind].walk) || a.rect.y + a.rect.h - (b.rect.y + b.rect.h));
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={L.w} height={L.h} viewBox={`0 0 ${L.w} ${L.h}`}>
      <Defs />
      <rect width={L.w} height={L.h} fill="url(#a-plank)" />
      {/* log-cabin back wall with two curtained windows and a painting */}
      <rect width={L.w} height={L.wall} fill="#b07a4f" />
      {Array.from({ length: Math.ceil(L.wall / 22) }, (_, i) => (
        <g key={i} stroke={LINE} strokeWidth="2.5">
          <rect x="-4" y={i * 22} width={L.w + 8} height="22" rx="10" fill={i % 2 ? "#b98458" : "#a9744a"} />
        </g>
      ))}
      {[L.w * 0.22, L.w * 0.78].map((x) => (
        <g key={x} stroke={LINE} strokeWidth="3.5">
          <rect x={x - 34} y={16} width="68" height="56" rx="4" fill="#bfe3ef" />
          <path d={`M${x} 16 V72 M${x - 34} 44 H${x + 34}`} strokeWidth="2.5" />
          <path d={`M${x - 26} 32 l12 -10 M${x + 8} 62 l10 -8`} stroke="#fff" strokeWidth="4" />
          <path d={`M${x - 40} 10 H${x + 40}`} strokeWidth="4" />
          <path d={`M${x - 40} 12 Q${x - 30} 40 ${x - 38} 76 H${x - 26} Q${x - 22} 40 ${x - 30} 12 Z`} fill="#e8845f" strokeWidth="2.5" />
          <path d={`M${x + 40} 12 Q${x + 30} 40 ${x + 38} 76 H${x + 26} Q${x + 22} 40 ${x + 30} 12 Z`} fill="#e8845f" strokeWidth="2.5" />
          <rect x={x - 38} y={72} width="76" height="8" rx="2" fill="#7a4b36" />
        </g>
      ))}
      <g stroke={LINE} strokeWidth="3.5">
        <rect x={L.w / 2 - 30} y={20} width="60" height="44" rx="2" fill="#d9a73f" />
        <rect x={L.w / 2 - 24} y={26} width="48" height="32" fill="#9fd3e6" strokeWidth="2.4" />
        <path d={`M${L.w / 2 - 24} 52 l14 -14 l10 8 l10 -10 l14 16 v6 h-48 z`} fill="#8fbf68" strokeWidth="2" />
        <circle cx={L.w / 2 + 12} cy={34} r="4" fill="#ffd166" strokeWidth="1.6" />
      </g>
      <rect y={L.wall - 10} width={L.w} height="12" fill="#6b4226" stroke={LINE} strokeWidth="3" />
      {order.map((f) => (
        <Piece key={f.id} kind={f.kind} r={f.rect} id={f.id} />
      ))}
      <g transform={`translate(${L.exit.x} ${L.exit.y})`} stroke={LINE} strokeWidth="4">
        <rect width={L.exit.w} height={L.exit.h + 6} rx="8" fill="#5e8f4e" />
      </g>
    </svg>
  );
});

const display = { fontFamily: "var(--font-display)", letterSpacing: "0.04em", lineHeight: 1 } as const;

/** The exit mat's word, and the outline of the piece you're moving. */
export const HomeLabels = memo(function HomeLabels({ layout, selected, problem }: { layout: HomeLayout; selected?: string; problem?: boolean }) {
  const L = layout;
  const sel = L.items.find((f) => f.id === selected);
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <div className="absolute grid place-content-center" style={{ left: L.exit.x, top: L.exit.y, width: L.exit.w, height: L.exit.h + 6, ...display, fontSize: 22, color: "#fff" }}>
        EXIT
      </div>
      {sel && (
        <div className="absolute rounded-md city-blink" style={{ left: sel.rect.x - 3, top: sel.rect.y - 3, width: sel.rect.w + 6, height: sel.rect.h + 6, border: `4px dashed ${problem ? "#e2453c" : "#ffd166"}`, zIndex: 100002 }}>
          <div className="absolute left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap px-2 pt-1 pb-0.5 rounded-md border-[3px]" style={{ background: "#ffd166", borderColor: LINE, color: LINE, ...display, fontSize: 16 }}>
            {FURNITURE[sel.kind].label.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
});
