"use client";

// Comic / anime avatars drawn as inline SVG on a 100×100 grid, all with the same ink outline.
// Faces share one layout (eyes at y 55, mouth at y 67) so extras like glasses fit every head.

import { useId, type ReactNode } from "react";
import { BG, EMBLEM_ICONS, EYE, FUR, HAIR, METAL, MONSTER, OUTFIT, SKIN, resolveAvatar, type AvatarKind, type AvatarSpec } from "@/lib/avatar";
import { shade } from "./characters";
import { Icon } from "./icons";
import { PixelImg, usePixelStyle } from "./pixelate";

const INK = "#0b0a14";
const SW = 2.2;

export function Avatar({ value, seed = "", kind = "person", size = 56, className = "", spec: specProp, title }: { value?: string; seed?: string; kind?: AvatarKind; size?: number; className?: string; spec?: AvatarSpec; title?: string }) {
  const spec = specProp ?? resolveAvatar(value, seed, kind);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pixel = usePixelStyle();
  const t = spec.t;
  const body =
    spec.kind === "person" ? <Person t={t} /> : spec.kind === "beast" ? <Beast t={t} /> : spec.kind === "monster" ? <Monster t={t} /> : spec.kind === "robot" ? <Robot t={t} /> : <Emblem t={t} />;
  const bgColor = BG[t[0]];
  const pattern = spec.kind === "emblem" ? 1 : t[1];
  const art = (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 ${className}`} role="img" aria-label={title ?? "Avatar"}>
      <defs>
        <clipPath id={`c${uid}`}>
          <circle cx="50" cy="50" r="47" />
        </clipPath>
        <pattern id={`d${uid}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.1" fill="#000" opacity="0.18" />
        </pattern>
      </defs>
      <g clipPath={`url(#c${uid})`}>
        <rect width="100" height="100" fill={bgColor} />
        <Backdrop kind={pattern} color={bgColor} dots={`url(#d${uid})`} />
        {body}
      </g>
      <circle cx="50" cy="50" r="47" fill="none" stroke={INK} strokeWidth="3.5" />
    </svg>
  );
  // Dawnterra pixel style: the same portrait, redrawn as pixel art (about 2 screen px per art pixel).
  if (pixel) return <PixelImg node={art} width={size} height={size} grid={Math.min(48, Math.max(20, size / 2))} className={className} label={title ?? "Avatar"} />;
  return art;
}

function Backdrop({ kind, color, dots }: { kind: number; color: string; dots: string }) {
  const light = shade(color, 0.35);
  if (kind === 1) return <rect width="100" height="100" fill={dots} />;
  if (kind === 2)
    return (
      <g stroke={light} strokeWidth="2.4" opacity="0.8">
        {Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return <line key={i} x1={50 + Math.cos(a) * 22} y1={46 + Math.sin(a) * 22} x2={50 + Math.cos(a) * 70} y2={46 + Math.sin(a) * 70} />;
        })}
      </g>
    );
  if (kind === 3)
    return (
      <g stroke={light} strokeWidth="5" opacity="0.7">
        {Array.from({ length: 10 }, (_, i) => (
          <line key={i} x1={i * 14 - 40} y1="0" x2={i * 14 + 10} y2="100" />
        ))}
      </g>
    );
  if (kind === 4)
    return (
      <g fill={light} opacity="0.75">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const b = a + Math.PI / 12;
          return <path key={i} d={`M50,46 L${50 + Math.cos(a) * 80},${46 + Math.sin(a) * 80} L${50 + Math.cos(b) * 80},${46 + Math.sin(b) * 80} Z`} />;
        })}
      </g>
    );
  return <circle cx="50" cy="44" r="30" fill={light} opacity="0.5" />;
}

// ---------------- shared face parts ----------------

function Shoulders({ color }: { color: string }) {
  return (
    <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
      <path d="M12,104 C14,85 31,77 50,77 C69,77 86,85 88,104 Z" fill={color} />
      <path d="M41,78 L50,89 L59,78" fill={shade(color, -0.25)} />
      <path d="M22,92 C26,88 30,86 34,86" fill="none" stroke={shade(color, 0.4)} strokeWidth="1.6" />
    </g>
  );
}

function Eye({ cx, cy, style, color, skin, flip }: { cx: number; cy: number; style: number; color: string; skin: string; flip: boolean }) {
  const d = flip ? -1 : 1;
  const lash = <path d={`M${cx - 5.6 * d},${cy - 3.6} Q${cx},${cy - 8.6} ${cx + 5.8 * d},${cy - 4.6} L${cx + 7.2 * d},${cy - 6.4}`} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />;
  const classic = (big = false) => (
    <>
      <ellipse cx={cx} cy={cy} rx={big ? 5.4 : 4.7} ry={big ? 6.6 : 5.9} fill="#fff" stroke={INK} strokeWidth="1" />
      <ellipse cx={cx} cy={cy + 0.7} rx={big ? 4.4 : 3.7} ry={big ? 5.6 : 4.9} fill={color} stroke={INK} strokeWidth="1" />
      <ellipse cx={cx} cy={cy + 2.6} rx={big ? 3.4 : 2.8} ry="1.8" fill={shade(color, 0.45)} />
      <ellipse cx={cx} cy={cy + 0.8} rx="1.8" ry="2.5" fill={INK} />
      <circle cx={cx - 1.6 * d} cy={cy - 1.8} r={big ? 1.9 : 1.5} fill="#fff" />
      {big && <circle cx={cx + 1.8 * d} cy={cy + 2.6} r="0.9" fill="#fff" />}
      {lash}
    </>
  );
  const closed = <path d={`M${cx - 5},${cy + 1} Q${cx},${cy - 5} ${cx + 5},${cy + 1}`} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />;
  switch (style) {
    case 1:
      return (
        <>
          <path d={`M${cx - 5.8 * d},${cy + 0.5} C${cx - 3 * d},${cy - 4.2} ${cx + 3 * d},${cy - 4.4} ${cx + 6 * d},${cy - 1.6} C${cx + 3 * d},${cy + 3.4} ${cx - 3 * d},${cy + 3.8} ${cx - 5.8 * d},${cy + 0.5} Z`} fill="#fff" stroke={INK} strokeWidth="1" />
          <circle cx={cx} cy={cy} r="2.9" fill={color} stroke={INK} strokeWidth="0.8" />
          <circle cx={cx} cy={cy} r="1.3" fill={INK} />
          <circle cx={cx - 1 * d} cy={cy - 1} r="0.8" fill="#fff" />
          <path d={`M${cx - 6.4 * d},${cy - 0.2} C${cx - 3 * d},${cy - 5} ${cx + 3 * d},${cy - 5} ${cx + 7 * d},${cy - 2.6}`} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        </>
      );
    case 2:
      return (
        <>
          {classic(true)}
          <path d={`M${cx + 3.4 * d},${cy - 4} l0.7,1.5 1.5,0.7 -1.5,0.7 -0.7,1.5 -0.7,-1.5 -1.5,-0.7 1.5,-0.7z`} fill="#fff" />
        </>
      );
    case 3:
      return closed;
    case 4:
      return (
        <>
          {classic()}
          <path d={`M${cx - 6 * d},${cy - 10} L${cx + 6 * d},${cy - 6.5}`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case 5:
      return (
        <>
          {classic()}
          <path d={`M${cx - 5.4},${cy} A5.4,6.2 0 0 1 ${cx + 5.4},${cy} Z`} fill={skin} stroke="none" />
          <path d={`M${cx - 6},${cy} L${cx + 6},${cy}`} stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        </>
      );
    case 6:
      return flip ? closed : classic();
    case 7:
      return (
        <>
          <ellipse cx={cx} cy={cy} rx="5.2" ry="6.2" fill={shade(color, 0.3)} opacity="0.45" />
          <ellipse cx={cx} cy={cy} rx="4.4" ry="5.6" fill={color} stroke={INK} strokeWidth="1" />
          <ellipse cx={cx} cy={cy - 0.5} rx="2" ry="3.2" fill="#fff" opacity="0.85" />
          {lash}
        </>
      );
    case 8:
      return (
        <>
          <ellipse cx={cx} cy={cy + 0.5} rx="2.4" ry="3.2" fill={INK} />
          <circle cx={cx - 0.8} cy={cy - 0.8} r="0.9" fill="#fff" />
        </>
      );
    default:
      return classic();
  }
}

export function Eyes({ style, color, skin }: { style: number; color: string; skin: string }) {
  return (
    <>
      <Eye cx={41} cy={55} style={style} color={color} skin={skin} flip={false} />
      <Eye cx={59} cy={55} style={style} color={color} skin={skin} flip={true} />
    </>
  );
}

export function Mouth({ style, y = 67 }: { style: number; y?: number }) {
  const o = y - 67;
  const g = (d: string, fill = "none", w = 1.8) => <path d={d} fill={fill} stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${o})`} />;
  switch (style) {
    case 1:
      return (
        <>
          {g("M44,65 Q50,65.5 56,65 Q55,73.5 50,73.5 Q45,73.5 44,65 Z", "#6b1b2b", 1.6)}
          {g("M46.8,71.6 Q50,69.4 53.2,71.6 Q50,73.6 46.8,71.6 Z", "#ff7a8a", 0.8)}
        </>
      );
    case 2:
      return g("M46,67.5 L54,67.5");
    case 3:
      return g("M44,66 Q47,69.5 50,66.4 Q53,69.5 56,66");
    case 4:
      return g("M45,68 Q51,68.5 55.5,64.5");
    case 5:
      return g("M48,67.6 a2,2.6 0 1 0 4,0 a2,2.6 0 1 0 -4,0", "#6b1b2b", 1.4);
    case 6:
      return (
        <>
          {g("M44.5,66 Q50,70.5 55.5,66")}
          {g("M46.4,67.4 L47.4,70.2 L48.6,68.2 Z", "#fff", 1)}
        </>
      );
    case 7:
      return (
        <>
          {g("M43,65 L57,65 Q56,72 50,72 Q44,72 43,65 Z", "#fff", 1.6)}
          {g("M43.6,67.8 L56.4,67.8", "none", 0.9)}
        </>
      );
    case 8:
      return g("M45,69 Q50,65.5 55,69");
    default:
      return g("M44.5,66 Q50,70.5 55.5,66");
  }
}

// ---------------- people ----------------

const FACE = "M31,44 C31,27 69,27 69,44 L69,55 C69,66 59,74 50,77 C41,74 31,66 31,55 Z";

const HAIR_FRONT: Record<number, string> = {
  0: "M27,52 L24,37 L30,39 L28,24 L36,30 L38,15 L46,26 L52,11 L56,26 L64,15 L64,30 L72,23 L70,38 L76,36 L73,52 L68,42 L62,46 L58,38 L52,46 L46,38 L40,46 L34,40 Z",
  1: "M27,60 C23,28 36,15 50,15 C64,15 77,28 73,60 L69,60 L68,46 L63,42 L58,47 L52,42 L46,47 L40,42 L35,46 L32,60 Z",
  2: "M27,56 C23,28 37,14 52,14 C67,14 78,27 73,54 L70,45 C66,38 60,33 54,28 C50,35 43,41 34,45 L31,57 Z",
  3: "M26,52 C22,40 26,30 30,28 C30,20 40,14 48,16 C54,10 66,14 68,22 C76,24 78,36 74,52 L70,42 L66,46 L62,38 L56,44 L52,36 L46,44 L42,37 L36,45 L33,40 Z",
  4: "M30.5,45 C29,24 71,24 69.5,45 C66,35 60,31 50,31 C40,31 34,35 30.5,45 Z",
  5: "M42,37 C40,27 42,15 46,8 L50,16 L53,5 L57,16 L61,10 C61,20 60,30 58,37 Z",
  6: "M29,50 C26,26 40,18 50,18 C60,18 74,26 71,50 C66,36 60,30 50,30 C40,30 34,36 29,50 Z",
  7: "M28,58 C24,28 38,16 50,16 C62,16 76,28 72,58 L68,58 C68,44 62,34 50,28 C38,34 32,44 32,58 Z",
  11: "M27,74 C23,28 36,15 50,15 C64,15 77,28 73,74 L67,74 L67,45 L33,45 L33,74 Z",
  12: "M28,46 C25,38 31,33 36,36 C37,29 46,29 48,34 C52,29 60,29 62,35 C68,32 75,38 72,46 C69,40 31,40 28,46 Z",
  14: "M29,48 C27,26 38,12 54,12 C66,12 74,20 72,30 C70,26 64,24 58,25 C68,30 72,38 71,48 C66,36 56,32 46,33 C38,34 32,40 29,48 Z",
};
HAIR_FRONT[8] = HAIR_FRONT[1];
HAIR_FRONT[9] = HAIR_FRONT[1];
HAIR_FRONT[10] = HAIR_FRONT[7];

export function HairBack({ style, color, outfit }: { style: number; color: string; outfit: string }) {
  const p = (d: string, fill = color) => <path d={d} fill={fill} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />;
  switch (style) {
    case 1:
      return p("M26,44 C23,62 25,74 31,78 L69,78 C75,74 77,62 74,44 Z");
    case 6:
      return (
        <>
          <circle cx="50" cy="15" r="9" fill={color} stroke={INK} strokeWidth={SW} />
          <path d="M45,13 Q50,9 55,13" fill="none" stroke={shade(color, 0.4)} strokeWidth="1.6" />
        </>
      );
    case 7:
      return p("M26,46 C21,70 23,90 28,100 L72,100 C77,90 79,70 74,46 Z");
    case 8:
      return (
        <>
          {p("M62,24 C88,24 96,58 84,92 C80,76 78,60 68,46 Z")}
          <circle cx="68" cy="27" r="3.4" fill="#ff3b4f" stroke={INK} strokeWidth="1.6" />
        </>
      );
    case 9:
      return (
        <>
          {p("M32,28 C12,32 6,66 14,92 C18,74 22,58 34,46 Z")}
          {p("M68,28 C88,32 94,66 86,92 C82,74 78,58 66,46 Z")}
          <circle cx="31" cy="30" r="3.6" fill="#ff3b4f" stroke={INK} strokeWidth="1.6" />
          <circle cx="69" cy="30" r="3.6" fill="#ff3b4f" stroke={INK} strokeWidth="1.6" />
        </>
      );
    case 10:
      return p("M26,46 C19,60 27,70 21,80 C18,92 30,98 34,100 L66,100 C70,98 82,92 79,80 C73,70 81,60 74,46 Z");
    case 11:
      return p("M26,46 L25,94 L75,94 L74,46 Z");
    case 12:
      return (
        <g fill={color} stroke={INK} strokeWidth={SW}>
          {[
            [30, 30], [42, 20], [58, 20], [70, 30], [74, 46], [26, 46], [50, 16], [28, 60], [72, 60],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="12" />
          ))}
          <circle cx="50" cy="38" r="22" stroke="none" />
        </g>
      );
    case 13:
      return p("M16,104 C12,60 22,20 50,18 C78,20 88,60 84,104 Z", outfit);
    default:
      return null;
  }
}

export function HairFront({ style, color, outfit }: { style: number; color: string; outfit: string }) {
  if (style === 13) {
    return (
      <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
        <path d="M33,46 L37,37 L41,43 L46,34 L51,42 L56,35 L60,42 L65,37 L67,47 C60,39 40,39 33,46 Z" fill={color} />
        <path d="M24,72 C20,38 32,24 50,24 C68,24 80,38 76,72 L71,70 C73,46 64,32 50,32 C36,32 27,46 29,70 Z" fill={shade(outfit, -0.18)} />
      </g>
    );
  }
  const d = HAIR_FRONT[style] ?? HAIR_FRONT[0];
  return (
    <g>
      {style === 5 && <path d="M31,46 C30,25 70,25 69,46 C64,36 36,36 31,46 Z" fill={color} opacity="0.35" />}
      <path d={d} fill={color} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {style !== 4 && style !== 5 && <path d="M38,25 Q45,20 52,21" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.45" />}
    </g>
  );
}

export function Extra({ n, hair, outfit, top = 40 }: { n: number; hair: string; outfit: string; top?: number }) {
  const s = { stroke: INK, strokeWidth: SW, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (n) {
    case 1:
      return (
        <g {...s} fill="#fff" fillOpacity="0.18">
          <rect x="33.5" y="49" width="14" height="11" rx="2.5" />
          <rect x="52.5" y="49" width="14" height="11" rx="2.5" />
          <path d="M47.5,53.5 L52.5,53.5 M33.5,52 L30,50.5 M66.5,52 L70,50.5" fill="none" />
        </g>
      );
    case 2:
      return (
        <g {...s} fill="#fff" fillOpacity="0.18">
          <circle cx="41" cy="55" r="7" />
          <circle cx="59" cy="55" r="7" />
          <path d="M48,54 Q50,52 52,54 M34,54 L30,52 M66,54 L70,52" fill="none" />
        </g>
      );
    case 3:
      return (
        <g {...s}>
          <path d="M28,52 C25,18 75,18 72,52" fill="none" strokeWidth="3.2" />
          <rect x="24" y="47" width="8" height="13" rx="3" fill="#2b2d42" />
          <rect x="68" y="47" width="8" height="13" rx="3" fill="#2b2d42" />
          <path d="M28,59 Q31,71 43,70" fill="none" strokeWidth="2" />
          <circle cx="44" cy="70" r="2.2" fill="#ff3b4f" strokeWidth="1.4" />
        </g>
      );
    case 4:
      return (
        <g {...s}>
          <path d={`M28,${top + 2} C28,${top - 22} 72,${top - 22} 72,${top + 2} Z`} fill={outfit} />
          <path d={`M26,${top + 1} C40,${top - 4} 60,${top - 4} 74,${top + 1} C75,${top + 6} 70,${top + 7} 66,${top + 6} C56,${top + 3} 44,${top + 3} 34,${top + 6} C30,${top + 7} 25,${top + 6} 26,${top + 1} Z`} fill={shade(outfit, -0.2)} />
          <circle cx="50" cy={top - 18} r="2.2" fill={shade(outfit, 0.3)} strokeWidth="1.4" />
        </g>
      );
    case 5:
      return (
        <g {...s}>
          <path d="M30,38 C40,34 60,34 70,38 L70,44 C60,40 40,40 30,44 Z" fill="#e63946" />
          <path d="M70,40 L82,35 L79,43 L84,48 L71,44 Z" fill="#e63946" />
          <circle cx="50" cy="39" r="2.6" fill="#f5f5f5" strokeWidth="1.4" />
        </g>
      );
    case 6:
      return (
        <g {...s}>
          <path d="M31,47 L69,58" fill="none" strokeWidth="1.8" />
          <ellipse cx="59" cy="55" rx="6.4" ry="6.2" fill={INK} />
        </g>
      );
    case 7:
      return (
        <g {...s} strokeWidth="1.4">
          <rect x="58" y="60" width="11" height="5" rx="1.5" fill="#f5d6b0" transform="rotate(-20 63 62)" />
          <path d="M62,61 L62.6,64 M65,60 L65.6,63" transform="rotate(-20 63 62)" />
        </g>
      );
    case 8:
      return (
        <g fill="#ff6f91" opacity="0.6">
          <ellipse cx="37" cy="63" rx="4.6" ry="2.4" />
          <ellipse cx="63" cy="63" rx="4.6" ry="2.4" />
        </g>
      );
    case 9:
      return (
        <g {...s} fill="#ffd23f" strokeWidth="1.4">
          <circle cx="30.5" cy="61" r="2.4" />
          <circle cx="69.5" cy="61" r="2.4" />
        </g>
      );
    case 10:
      return (
        <g {...s}>
          <path d="M29,34 L26,10 L45,25 Z" fill={hair} />
          <path d="M71,34 L74,10 L55,25 Z" fill={hair} />
          <path d="M31,28 L29.5,16 L40,25 Z M69,28 L70.5,16 L60,25 Z" fill="#ff8fab" strokeWidth="1" />
        </g>
      );
    case 11:
      return (
        <g {...s} fill="#f1e3c4">
          <path d="M36,26 C31,20 31,14 33,9 C37,15 41,19 43,24 Z" />
          <path d="M64,26 C69,20 69,14 67,9 C63,15 59,19 57,24 Z" />
        </g>
      );
    case 12:
      return <path d="M65,28 l2.2,4.4 4.8,0.7 -3.5,3.4 0.8,4.8 -4.3,-2.3 -4.3,2.3 0.8,-4.8 -3.5,-3.4 4.8,-0.7z" fill="#ffd23f" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />;
    case 13:
      return (
        <g {...s}>
          <path d="M32,50 L68,50 L66,59 C61,62 55,61 52,56.5 L48,56.5 C45,61 39,62 34,59 Z" fill={INK} />
          <path d="M36,52.5 L42,52.5" stroke="#fff" strokeWidth="1.6" opacity="0.7" />
        </g>
      );
    case 14:
      return (
        <g {...s}>
          <path d="M27,52 C24,16 76,16 73,52" fill="none" strokeWidth="4" />
          <rect x="21" y="45" width="11" height="17" rx="5" fill={outfit} />
          <rect x="68" y="45" width="11" height="17" rx="5" fill={outfit} />
        </g>
      );
    case 15:
      return (
        <g fill="#a0522d" opacity="0.75">
          {[[36, 62], [39, 64], [34, 64.5], [64, 62], [61, 64], [66, 64.5]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="0.9" />
          ))}
        </g>
      );
    default:
      return null;
  }
}

function Person({ t }: { t: number[] }) {
  const [, , skinI, hairI, hairCI, eyesI, eyeCI, mouthI, extraI, outfitI] = t;
  const skin = SKIN[skinI];
  const hair = HAIR[hairCI];
  const outfit = OUTFIT[outfitI];
  return (
    <g>
      <HairBack style={hairI} color={hair} outfit={outfit} />
      <Shoulders color={outfit} />
      <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
        <path d="M44,66 L44,80 C47,82 53,82 56,80 L56,66 Z" fill={shade(skin, -0.15)} />
        <ellipse cx="31.5" cy="54" rx="3.4" ry="5" fill={skin} />
        <ellipse cx="68.5" cy="54" rx="3.4" ry="5" fill={skin} />
        <path d={FACE} fill={skin} />
      </g>
      <path d="M35,46 Q41,43.5 46,45.5 M54,45.5 Q59,43.5 65,46" fill="none" stroke={shade(hair, -0.3)} strokeWidth="1.8" strokeLinecap="round" />
      <Eyes style={eyesI} color={EYE[eyeCI]} skin={skin} />
      <path d="M50,60.5 L49,62.6 L50.6,62.9" fill="none" stroke={shade(skin, -0.4)} strokeWidth="1.2" strokeLinecap="round" />
      <Mouth style={mouthI} />
      <HairFront style={hairI} color={hair} outfit={outfit} />
      <Extra n={extraI} hair={hair} outfit={outfit} />
    </g>
  );
}

// ---------------- animals ----------------

function Beast({ t }: { t: number[] }) {
  const [, , sp, furI, eyesI, eyeCI, mouthI, extraI, outfitI] = t;
  const fur = FUR[furI];
  const dark = shade(fur, -0.35);
  const light = shade(fur, 0.65);
  const outfit = OUTFIT[outfitI];
  const s = { stroke: INK, strokeWidth: SW, strokeLinejoin: "round" as const };
  const HEAD = "M27,48 C27,27 73,27 73,48 L73,58 C73,71 62,79 50,79 C38,79 27,71 27,58 Z";
  let ears: ReactNode = null;
  let face: ReactNode = null;
  let head = HEAD;
  let mouth = true;
  let nose: ReactNode = <path d="M47.5,61 L52.5,61 L50,63.8 Z" fill={INK} stroke={INK} strokeWidth="1" strokeLinejoin="round" />;
  const muzzle = <ellipse cx="50" cy="66" rx="10" ry="7.5" fill={light} {...s} strokeWidth="1.6" />;
  switch (sp) {
    case 0: // fox
      ears = (
        <g {...s}>
          <path d="M30,40 L25,12 L47,29 Z" fill={fur} />
          <path d="M70,40 L75,12 L53,29 Z" fill={fur} />
          <path d="M31,34 L29,19 L41,29 Z M69,34 L71,19 L59,29 Z" fill={dark} strokeWidth="1" />
        </g>
      );
      head = "M27,46 C27,27 73,27 73,46 L74,58 L82,62 L71,66 C66,74 58,79 50,79 C42,79 34,74 29,66 L18,62 L26,58 Z";
      face = muzzle;
      break;
    case 1: // cat
      ears = (
        <g {...s}>
          <path d="M29,40 L29,15 L46,30 Z" fill={fur} />
          <path d="M71,40 L71,15 L54,30 Z" fill={fur} />
          <path d="M31,33 L31,21 L40,29 Z M69,33 L69,21 L60,29 Z" fill="#ff8fab" strokeWidth="1" />
        </g>
      );
      face = <path d="M22,62 L36,64 M22,68 L36,66 M78,62 L64,64 M78,68 L64,66" stroke={INK} strokeWidth="1.2" />;
      nose = <path d="M48,61 L52,61 L50,63.4 Z" fill="#ff8fab" stroke={INK} strokeWidth="1" strokeLinejoin="round" />;
      break;
    case 2: // wolf
      ears = (
        <g {...s}>
          <path d="M31,36 L28,6 L47,27 Z" fill={fur} />
          <path d="M69,36 L72,6 L53,27 Z" fill={fur} />
          <path d="M32,30 L31,14 L42,27 Z M68,30 L69,14 L58,27 Z" fill={dark} strokeWidth="1" />
        </g>
      );
      head = "M27,46 C27,27 73,27 73,46 L76,60 L70,64 C66,74 58,80 50,80 C42,80 34,74 30,64 L24,60 Z";
      face = (
        <>
          <ellipse cx="50" cy="67" rx="11" ry="9" fill={light} {...s} strokeWidth="1.6" />
          <path d="M33,46 L46,49 M67,46 L54,49" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        </>
      );
      break;
    case 3: // bear
    case 12: // raccoon
    case 7: // tiger
      ears = (
        <g {...s}>
          <circle cx="31" cy="31" r="8.5" fill={fur} />
          <circle cx="69" cy="31" r="8.5" fill={fur} />
          <circle cx="31" cy="31" r="4.2" fill={sp === 7 ? "#fff" : dark} strokeWidth="1" />
          <circle cx="69" cy="31" r="4.2" fill={sp === 7 ? "#fff" : dark} strokeWidth="1" />
        </g>
      );
      face =
        sp === 12 ? (
          <>
            <path d="M28,52 C34,46 46,48 50,52 C54,48 66,46 72,52 C70,62 58,62 50,58 C42,62 30,62 28,52 Z" fill={INK} />
            {muzzle}
          </>
        ) : sp === 7 ? (
          <>
            <path d="M44,32 L46,40 L48,32 M52,32 L54,40 L56,32 M27,52 L35,54 M27,58 L34,58 M73,52 L65,54 M73,58 L66,58" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            {muzzle}
          </>
        ) : (
          muzzle
        );
      break;
    case 4: // panda
      ears = (
        <g {...s} fill={INK}>
          <circle cx="31" cy="31" r="8.5" />
          <circle cx="69" cy="31" r="8.5" />
        </g>
      );
      face = (
        <g fill={INK}>
          <ellipse cx="40" cy="56" rx="7.5" ry="9" transform="rotate(25 40 56)" />
          <ellipse cx="60" cy="56" rx="7.5" ry="9" transform="rotate(-25 60 56)" />
        </g>
      );
      break;
    case 5: // rabbit
      ears = (
        <g {...s}>
          <path d="M36,34 C28,4 40,-2 46,30 Z" fill={fur} />
          <path d="M64,34 C72,4 60,-2 54,30 Z" fill={fur} />
          <path d="M38,28 C34,10 40,6 43,28 Z M62,28 C66,10 60,6 57,28 Z" fill="#ff8fab" strokeWidth="1" />
        </g>
      );
      face = <path d="M48,66 L48,70 M52,66 L52,70" stroke={INK} strokeWidth="1.2" />;
      break;
    case 6: // owl
      ears = (
        <g {...s}>
          <path d="M29,36 L24,14 L42,28 Z" fill={dark} />
          <path d="M71,36 L76,14 L58,28 Z" fill={dark} />
        </g>
      );
      face = (
        <g {...s} strokeWidth="1.4" fill={light}>
          <circle cx="41" cy="55" r="9" />
          <circle cx="59" cy="55" r="9" />
          <path d="M46,64 L54,64 L50,71 Z" fill="#ff9f1c" />
        </g>
      );
      mouth = false;
      nose = null;
      break;
    case 8: // dragon
      ears = (
        <g {...s}>
          <path d="M34,32 C30,22 28,14 30,6 C36,14 40,20 42,28 Z" fill="#f1e3c4" />
          <path d="M66,32 C70,22 72,14 70,6 C64,14 60,20 58,28 Z" fill="#f1e3c4" />
          <path d="M44,28 L47,20 L50,27 L53,20 L56,28 Z" fill={dark} />
        </g>
      );
      face = (
        <>
          <ellipse cx="50" cy="67" rx="12" ry="8.5" fill={shade(fur, 0.3)} {...s} strokeWidth="1.6" />
          <path d="M46,62 L46.5,64 M54,62 L53.5,64" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </>
      );
      nose = null;
      break;
    case 9: // dog
      ears = (
        <g {...s} fill={dark}>
          <path d="M30,34 C16,34 14,58 22,68 C28,60 30,48 37,38 Z" />
          <path d="M70,34 C84,34 86,58 78,68 C72,60 70,48 63,38 Z" />
        </g>
      );
      face = muzzle;
      break;
    case 10: // monkey
      ears = (
        <g {...s}>
          <circle cx="24" cy="55" r="9" fill={fur} />
          <circle cx="76" cy="55" r="9" fill={fur} />
          <circle cx="24" cy="55" r="4.5" fill={light} strokeWidth="1" />
          <circle cx="76" cy="55" r="4.5" fill={light} strokeWidth="1" />
        </g>
      );
      face = <path d="M33,50 C33,40 46,40 50,46 C54,40 67,40 67,50 L67,62 C67,72 59,77 50,77 C41,77 33,72 33,62 Z" fill={light} {...s} strokeWidth="1.6" />;
      break;
    case 11: // penguin
      face = (
        <>
          <path d="M33,50 C33,40 46,40 50,46 C54,40 67,40 67,50 L67,62 C67,72 59,77 50,77 C41,77 33,72 33,62 Z" fill="#fff" {...s} strokeWidth="1.6" />
          <path d="M45,62 L55,62 L50,68 Z" fill="#ff9f1c" {...s} strokeWidth="1.4" />
        </>
      );
      mouth = false;
      nose = null;
      break;
  }
  return (
    <g>
      <Shoulders color={outfit} />
      {ears}
      <path d={head} fill={fur} {...s} />
      {face}
      <Eyes style={eyesI} color={EYE[eyeCI]} skin={fur} />
      {nose}
      {mouth && <Mouth style={mouthI} y={sp === 0 || sp === 2 || sp === 9 || sp === 3 || sp === 7 || sp === 12 || sp === 8 ? 69 : 67} />}
      <Extra n={extraI === 10 || extraI === 11 ? 0 : extraI} hair={fur} outfit={outfit} top={38} />
    </g>
  );
}

// ---------------- bosses ----------------

function Monster({ t }: { t: number[] }) {
  const [, , shapeI, colorI, eyesI, eyeCI, mouthI, hornsI, extraI] = t;
  const body = MONSTER[colorI];
  const glow = EYE[eyeCI];
  const s = { stroke: INK, strokeWidth: 2.6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const SHAPES = [
    "M14,104 C8,64 20,30 50,26 C80,30 92,64 86,104 Z",
    "M12,100 C8,86 16,78 18,66 C20,38 36,24 50,24 C64,24 80,38 82,66 C84,78 92,86 88,100 Z",
    "M18,100 L18,52 C18,30 32,20 50,20 C68,20 82,30 82,52 L82,100 L74,92 L66,100 L58,92 L50,100 L42,92 L34,100 L26,92 Z",
    "M24,52 C24,28 36,18 50,18 C64,18 76,28 76,52 C76,62 70,66 68,70 L66,80 L34,80 L32,70 C30,66 24,62 24,52 Z",
    "M14,104 L18,62 L24,36 L40,24 L62,24 L78,34 L84,60 L88,104 Z",
    "M20,104 C16,80 20,62 26,52 C26,30 38,20 50,20 C62,20 74,30 74,52 C80,62 84,80 80,104 Z",
    "M16,104 C14,74 22,52 28,44 C30,28 40,20 50,20 C60,20 70,28 72,44 C78,52 86,74 84,104 Z",
    "M24,58 C20,30 36,16 50,16 C64,16 80,30 76,58 Z",
    "M24,60 C24,34 36,24 50,24 C64,24 76,34 76,60 C76,74 64,82 50,82 C36,82 24,74 24,60 Z",
  ];
  const eyeY = shapeI === 3 ? 46 : shapeI === 7 ? 42 : 52;
  return (
    <g>
      {extraI === 3 && (
        <path d="M14,100 C6,70 18,60 14,40 C24,48 26,34 30,22 C36,34 42,26 44,10 C50,24 56,20 58,8 C62,24 68,28 72,18 C76,32 82,34 86,40 C82,58 94,70 86,100 Z" fill="#ff9f1c" stroke={INK} strokeWidth="2" opacity="0.9" />
      )}
      {extraI === 4 && <ellipse cx="50" cy="16" rx="20" ry="5" fill="none" stroke={INK} strokeWidth="4" />}
      <Horns n={hornsI} />
      {shapeI === 7 && (
        <g {...s} fill={shade(body, -0.15)}>
          {[18, 32, 46, 60, 74].map((x, i) => (
            <path key={i} d={`M${x},56 C${x - 6},72 ${x + 8},80 ${x + 2},100 L${x + 12},100 C${x + 16},80 ${x + 6},70 ${x + 10},56 Z`} />
          ))}
        </g>
      )}
      {shapeI === 8 && (
        <g {...s} fill={shade(body, -0.2)}>
          <path d="M28,46 L6,30 L10,48 L2,56 L14,60 L26,60 Z" />
          <path d="M72,46 L94,30 L90,48 L98,56 L86,60 L74,60 Z" />
        </g>
      )}
      <path d={SHAPES[shapeI]} fill={shapeI === 3 ? "#f1ead8" : body} {...s} />
      {shapeI === 3 && <path d="M50,58 L46,66 L54,66 Z" fill={INK} />}
      {shapeI === 1 && <path d="M30,46 Q34,36 42,34" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />}
      {shapeI === 4 && <path d="M30,40 L38,46 M66,36 L60,44 M24,74 L34,70 M70,80 L78,72" stroke={shade(body, -0.4)} strokeWidth="2" />}
      {shapeI !== 3 && shapeI !== 1 && shapeI !== 2 && <path d="M66,34 C80,50 84,78 80,104 L66,104 C70,80 70,54 62,38 Z" fill="#000" opacity="0.18" />}
      <MonsterEyes n={shapeI === 5 ? 2 : eyesI} y={eyeY} glow={glow} />
      <MonsterMouth n={mouthI} y={shapeI === 3 ? 72 : shapeI === 7 ? 56 : 70} body={body} />
      <MonsterExtra n={extraI} />
    </g>
  );
}

function Horns({ n }: { n: number }) {
  const s = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: "round" as const, fill: "#f1e3c4" };
  switch (n) {
    case 1:
      return (
        <g {...s}>
          <path d="M34,34 C24,24 16,10 4,8 C16,18 18,32 24,44 Z" />
          <path d="M66,34 C76,24 84,10 96,8 C84,18 82,32 76,44 Z" />
        </g>
      );
    case 2:
      return (
        <g {...s}>
          <path d="M30,34 C14,26 8,44 18,50 C26,54 30,46 24,42" fill="none" strokeWidth="6" stroke="#c9b48a" />
          <path d="M70,34 C86,26 92,44 82,50 C74,54 70,46 76,42" fill="none" strokeWidth="6" stroke="#c9b48a" />
        </g>
      );
    case 3:
      return <path d="M44,28 L50,2 L56,28 Z" {...s} fill="#ffd23f" />;
    case 4:
      return (
        <g stroke={INK} strokeWidth="2.4" fill="none">
          <path d="M42,26 C38,16 30,12 26,6" />
          <path d="M58,26 C62,16 70,12 74,6" />
          <circle cx="26" cy="6" r="4" fill="#ff5f7a" />
          <circle cx="74" cy="6" r="4" fill="#ff5f7a" />
        </g>
      );
    case 5:
      return <path d="M28,34 L30,16 L38,28 L44,10 L50,26 L56,10 L62,28 L70,16 L72,34 Z" {...s} fill="#d9d4e7" />;
    case 6:
      return (
        <g {...s}>
          <path d="M30,38 C18,36 8,26 6,14 C14,24 22,26 32,28 Z" />
          <path d="M70,38 C82,36 92,26 94,14 C86,24 78,26 68,28 Z" />
        </g>
      );
    default:
      return null;
  }
}

function MonsterEyes({ n, y, glow }: { n: number; y: number; glow: string }) {
  const s = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: "round" as const };
  switch (n) {
    case 1:
      return (
        <g {...s}>
          <ellipse cx="38" cy={y} rx="7" ry="5" fill={glow} />
          <ellipse cx="62" cy={y} rx="7" ry="5" fill={glow} />
          <ellipse cx="38" cy={y - 1} rx="3" ry="1.6" fill="#fff" stroke="none" />
          <ellipse cx="62" cy={y - 1} rx="3" ry="1.6" fill="#fff" stroke="none" />
        </g>
      );
    case 2:
      return (
        <g {...s}>
          <circle cx="50" cy={y - 2} r="11" fill="#fff" />
          <circle cx="50" cy={y - 1} r="6.5" fill={glow} />
          <circle cx="50" cy={y - 1} r="3" fill={INK} />
          <circle cx="47.5" cy={y - 4} r="1.8" fill="#fff" stroke="none" />
          <path d={`M37,${y - 12} L63,${y - 9}`} strokeWidth="3.2" strokeLinecap="round" />
        </g>
      );
    case 3:
      return (
        <g {...s}>
          {[[36, y], [64, y], [50, y - 10]].map(([x, yy], i) => (
            <g key={i}>
              <ellipse cx={x} cy={yy} rx="5" ry="4" fill="#fff" />
              <circle cx={x} cy={yy} r="2.2" fill={glow} />
            </g>
          ))}
        </g>
      );
    case 4:
      return (
        <g>
          <circle cx="40" cy={y} r="3" fill={glow} stroke={INK} strokeWidth="1.6" />
          <circle cx="60" cy={y} r="3" fill={glow} stroke={INK} strokeWidth="1.6" />
          <path d={`M32,${y - 7} L45,${y - 3} M68,${y - 7} L55,${y - 3}`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 5:
      return (
        <g>
          <ellipse cx="38" cy={y} rx="7" ry="8" fill={INK} />
          <ellipse cx="62" cy={y} rx="7" ry="8" fill={INK} />
          <circle cx="38" cy={y + 1} r="2" fill={glow} />
          <circle cx="62" cy={y + 1} r="2" fill={glow} />
        </g>
      );
    default:
      return (
        <g {...s}>
          <path d={`M27,${y - 6} L46,${y} L44,${y + 5} L27,${y + 1} Z`} fill="#fff" />
          <path d={`M73,${y - 6} L54,${y} L56,${y + 5} L73,${y + 1} Z`} fill="#fff" />
          <circle cx="39" cy={y + 0.5} r="2.4" fill={glow} />
          <circle cx="61" cy={y + 0.5} r="2.4" fill={glow} />
          <path d={`M25,${y - 11} L46,${y - 4} M75,${y - 11} L54,${y - 4}`} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
  }
}

function MonsterMouth({ n, y, body }: { n: number; y: number; body: string }) {
  const s = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (n) {
    case 1:
      return (
        <g {...s}>
          <path d={`M28,${y - 4} C40,${y + 2} 60,${y + 2} 72,${y - 4} C66,${y + 10} 34,${y + 10} 28,${y - 4} Z`} fill="#fff" />
          <path d={`M34,${y - 1} L34,${y + 5} M42,${y + 1} L42,${y + 7} M50,${y + 1.5} L50,${y + 8} M58,${y + 1} L58,${y + 7} M66,${y - 1} L66,${y + 5} M30,${y + 1} C42,${y + 5} 58,${y + 5} 70,${y + 1}`} fill="none" strokeWidth="1.4" />
        </g>
      );
    case 2:
      return (
        <g {...s}>
          <path d={`M38,${y + 2} Q50,${y + 6} 62,${y + 2}`} fill="none" />
          <path d={`M36,${y + 3} C34,${y - 4} 34,${y - 8} 36,${y - 12} C39,${y - 6} 40,${y - 2} 40,${y + 3} Z`} fill="#f1ead8" />
          <path d={`M64,${y + 3} C66,${y - 4} 66,${y - 8} 64,${y - 12} C61,${y - 6} 60,${y - 2} 60,${y + 3} Z`} fill="#f1ead8" />
        </g>
      );
    case 3:
      return <path d={`M36,${y} L64,${y} M40,${y - 3} L40,${y + 3} M46,${y - 3} L46,${y + 3} M52,${y - 3} L52,${y + 3} M58,${y - 3} L58,${y + 3}`} {...s} fill="none" />;
    case 4:
      return (
        <g {...s}>
          <path d={`M36,${y - 4} C40,${y - 7} 60,${y - 7} 64,${y - 4} C64,${y + 10} 36,${y + 10} 36,${y - 4} Z`} fill="#2b0b1f" />
          <path d={`M42,${y + 4} C46,${y} 54,${y} 58,${y + 4} C54,${y + 8} 46,${y + 8} 42,${y + 4} Z`} fill="#ff5f7a" strokeWidth="1.4" />
          <path d={`M39,${y - 4} L41,${y + 1} L43,${y - 5} M57,${y - 5} L59,${y + 1} L61,${y - 4}`} fill="#fff" strokeWidth="1.2" />
        </g>
      );
    case 5:
      return (
        <g {...s}>
          <path d={`M40,${y} Q50,${y + 4} 60,${y}`} fill="none" />
          <path d={`M43,${y + 1} L44.5,${y + 5} L46,${y + 1.6} M54,${y + 1.6} L55.5,${y + 5} L57,${y + 1}`} fill="#fff" strokeWidth="1.4" />
        </g>
      );
    default:
      return (
        <g {...s}>
          <path d={`M32,${y - 4} C44,${y - 10} 56,${y - 10} 68,${y - 4} C62,${y + 12} 38,${y + 12} 32,${y - 4} Z`} fill={shade(body, -0.6)} />
          <path d={`M36,${y - 4} L40,${y + 3} L44,${y - 6} L48,${y + 3} L52,${y - 6.5} L56,${y + 3} L60,${y - 6} L64,${y - 4}`} fill="#fff" strokeWidth="1.6" />
        </g>
      );
  }
}

function MonsterExtra({ n }: { n: number }) {
  const s = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (n) {
    case 1:
      return (
        <g {...s}>
          <path d="M34,26 L34,10 L42,18 L50,6 L58,18 L66,10 L66,26 Z" fill="#ffd23f" />
          <circle cx="50" cy="20" r="2.6" fill="#e63946" strokeWidth="1.4" />
        </g>
      );
    case 2:
      return <path d="M58,38 L70,62 M60,46 L66,44 M63,52 L69,50 M66,58 L72,56" {...s} stroke="#fff" strokeWidth="2.4" fill="none" />;
    case 5:
      return (
        <g {...s} strokeWidth="1.6">
          <path d="M26,36 L70,30 L71,37 L27,43 Z" fill="#f5f5f5" />
          <path d="M40,34 L41,40 M54,32 L55,38" />
        </g>
      );
    case 6:
      return <path d="M50,28 L56,35 L50,42 L44,35 Z" fill="#5ad1ff" {...s} />;
    default:
      return null;
  }
}

// ---------------- robots ----------------

function Robot({ t }: { t: number[] }) {
  const [, , headI, colorI, visorI, glowI, antennaI, mouthI] = t;
  const plate = METAL[colorI];
  const glow = EYE[glowI];
  const s = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const HEADS = [
    <rect key="0" x="24" y="26" width="52" height="48" rx="5" />,
    <rect key="1" x="24" y="26" width="52" height="48" rx="16" />,
    <path key="2" d="M24,74 L24,48 C24,30 36,22 50,22 C64,22 76,30 76,48 L76,74 Z" />,
    <path key="3" d="M20,28 L80,28 L72,76 L28,76 Z" />,
    <path key="4" d="M36,22 L64,22 L80,48 L64,76 L36,76 L20,48 Z" />,
    <rect key="5" x="20" y="28" width="60" height="46" rx="8" />,
  ];
  return (
    <g>
      <g {...s}>
        <path d="M10,104 C12,88 26,80 50,80 C74,80 88,88 90,104 Z" fill={shade(plate, -0.25)} />
        <rect x="42" y="72" width="16" height="10" fill={shade(plate, -0.4)} />
        <circle cx="50" cy="94" r="5" fill={glow} />
      </g>
      <RobotTop n={antennaI} plate={plate} glow={glow} />
      <g {...s} fill={plate}>
        {HEADS[headI]}
      </g>
      <path d="M30,32 L44,32" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      {headI === 5 && (
        <g {...s}>
          <circle cx="73" cy="64" r="2.6" fill={shade(plate, -0.4)} strokeWidth="1.4" />
          <circle cx="73" cy="56" r="2.6" fill={shade(plate, -0.4)} strokeWidth="1.4" />
        </g>
      )}
      <circle cx="27" cy="40" r="1.6" fill={INK} />
      <circle cx="73" cy="40" r="1.6" fill={INK} />
      <RobotEyes n={visorI} glow={glow} />
      <RobotMouth n={mouthI} glow={glow} plate={plate} />
    </g>
  );
}

function RobotTop({ n, plate, glow }: { n: number; plate: string; glow: string }) {
  const s = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (n) {
    case 1:
      return (
        <g {...s}>
          <path d="M50,26 L50,10" />
          <circle cx="50" cy="8" r="4.5" fill={glow} />
        </g>
      );
    case 2:
      return (
        <g {...s}>
          <path d="M40,28 L32,8 M60,28 L68,8" />
          <circle cx="32" cy="8" r="3.6" fill={glow} />
          <circle cx="68" cy="8" r="3.6" fill={glow} />
        </g>
      );
    case 3:
      return (
        <g {...s} fill={shade(plate, -0.2)}>
          <path d="M24,40 L12,30 L10,54 Z" />
          <path d="M76,40 L88,30 L90,54 Z" />
        </g>
      );
    case 4:
      return <ellipse cx="50" cy="14" rx="18" ry="5" fill="none" stroke={glow} strokeWidth="4" />;
    case 5:
      return <path d="M38,28 L44,6 L50,24 L56,6 L62,28 Z" {...s} fill={shade(plate, -0.2)} />;
    default:
      return null;
  }
}

function RobotEyes({ n, glow }: { n: number; glow: string }) {
  const s = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (n) {
    case 1:
      return (
        <g {...s}>
          <circle cx="39" cy="49" r="7.5" fill={INK} />
          <circle cx="61" cy="49" r="7.5" fill={INK} />
          <circle cx="39" cy="49" r="4" fill={glow} stroke="none" />
          <circle cx="61" cy="49" r="4" fill={glow} stroke="none" />
          <circle cx="37.5" cy="47.5" r="1.4" fill="#fff" stroke="none" />
          <circle cx="59.5" cy="47.5" r="1.4" fill="#fff" stroke="none" />
        </g>
      );
    case 2:
      return (
        <g {...s}>
          <rect x="28" y="42" width="44" height="14" rx="7" fill={INK} />
          <circle cx="50" cy="49" r="5.5" fill={glow} />
          <circle cx="50" cy="49" r="2" fill="#fff" stroke="none" />
        </g>
      );
    case 3:
      return (
        <g>
          <rect x="29" y="41" width="42" height="17" rx="3" fill={INK} stroke={INK} strokeWidth="2" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) =>
            [0, 1, 2].map((j) => <circle key={`${i}-${j}`} cx={33 + i * 5.7} cy={45 + j * 4.5} r="1.5" fill={(i === 1 || i === 5) && j < 2 ? glow : shade(glow, -0.7)} />),
          )}
        </g>
      );
    case 4:
      return <path d="M33,43 L45,55 M45,43 L33,55 M55,43 L67,55 M67,43 L55,55" stroke={glow} strokeWidth="4" strokeLinecap="round" />;
    case 5:
      return (
        <g {...s}>
          <path d="M30,44 L46,48 L46,53 L30,51 Z" fill={glow} />
          <path d="M70,44 L54,48 L54,53 L70,51 Z" fill={glow} />
        </g>
      );
    case 6:
      return <path d="M32,52 Q38.5,42 45,52 M55,52 Q61.5,42 68,52" fill="none" stroke={glow} strokeWidth="4" strokeLinecap="round" />;
    default:
      return (
        <g {...s}>
          <rect x="27" y="42" width="46" height="13" rx="6.5" fill={glow} />
          <path d="M32,46 L46,46" stroke="#fff" strokeWidth="2.4" opacity="0.8" />
        </g>
      );
  }
}

function RobotMouth({ n, glow, plate }: { n: number; glow: string; plate: string }) {
  const s = { stroke: INK, strokeWidth: 2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (n) {
    case 1:
      return <path d="M40,63 Q50,71 60,63" fill="none" stroke={glow} strokeWidth="3.4" strokeLinecap="round" />;
    case 2:
      return null;
    case 3:
      return (
        <g {...s}>
          <circle cx="50" cy="66" r="5.5" fill={shade(plate, -0.35)} />
          <circle cx="50" cy="66" r="2" fill={INK} />
        </g>
      );
    case 4:
      return (
        <g {...s} fill={shade(plate, -0.3)}>
          {[38, 46, 54, 62].map((x) => (
            <circle key={x} cx={x} cy="66" r="2.6" />
          ))}
        </g>
      );
    default:
      return (
        <g {...s}>
          <rect x="38" y="61" width="24" height="10" rx="2" fill={shade(plate, -0.35)} />
          <path d="M44,61 L44,71 M50,61 L50,71 M56,61 L56,71" />
        </g>
      );
  }
}

// ---------------- emblems ----------------

function Emblem({ t }: { t: number[] }) {
  const [, shapeI, iconI, colorI, accentI] = t;
  const color = MONSTER[colorI];
  const accent = BG[accentI];
  const s = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const };
  const SHAPES = [
    "M50,10 L82,22 C82,54 72,76 50,90 C28,76 18,54 18,22 Z",
    "M50,12 A38,38 0 1 1 49.9,12 Z",
    "M50,10 L84,30 L84,70 L50,90 L16,70 L16,30 Z",
    "M50,8 L61,36 L91,37 L67,55 L76,85 L50,67 L24,85 L33,55 L9,37 L39,36 Z",
    "M50,8 L88,50 L50,92 L12,50 Z",
    "M22,12 L78,12 L78,86 L50,72 L22,86 Z",
    "M50,18 A26,26 0 1 1 49.9,18 Z",
  ];
  return (
    <g>
      {shapeI === 6 && (
        <g {...s} fill={shade(accent, 0.2)}>
          <path d="M28,40 C16,30 6,32 2,36 C10,40 6,46 4,50 C12,50 10,56 8,60 C16,60 20,62 26,58 Z" />
          <path d="M72,40 C84,30 94,32 98,36 C90,40 94,46 96,50 C88,50 90,56 92,60 C84,60 80,62 74,58 Z" />
        </g>
      )}
      <path d={SHAPES[shapeI]} fill={color} {...s} />
      <path d={SHAPES[shapeI]} fill="none" stroke={accent} strokeWidth="2.4" transform="translate(50 50) scale(0.82) translate(-50 -50)" />
      <g style={{ color: "#fff" }}>
        <Icon name={EMBLEM_ICONS[iconI]} size={shapeI === 3 ? 30 : 40} x={shapeI === 3 ? 35 : 30} y={shapeI === 3 ? 38 : shapeI === 5 ? 24 : 30} strokeWidth={2.2} />
      </g>
    </g>
  );
}

