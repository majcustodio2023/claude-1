"use client";

// Banner covers and the boss arena as Dawnterra pixel art. Each scene is drawn straight on the art
// pixel grid (one SVG unit = one art pixel), then rasterised with hard edges and snapped to the
// shared palette (components/city/pixel.ts), so they match the town, the hero and the UI.

import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { pixelGrid } from "./city/pixel";
import { seeded } from "@/lib/items";

/** Cover size in art pixels (about the banner's shape; it crops to fit). */
export const COVER_W = 300;
export const COVER_H = 80;

type R = () => number;

/** Horizontal sky bands, top to bottom, with a dithered row where two bands meet. */
function Sky({ w, h, bands }: { w: number; h: number; bands: string[] }) {
  const bh = h / bands.length;
  return (
    <>
      {bands.map((c, i) => (
        <rect key={i} x={0} y={Math.floor(i * bh)} width={w} height={Math.ceil(bh) + 1} fill={c} />
      ))}
      {bands.slice(1).map((c, i) =>
        Array.from({ length: Math.ceil(w / 2) }, (_, x) => <rect key={`${i}-${x}`} x={x * 2 + (i % 2)} y={Math.floor((i + 1) * bh) - 1} width={1} height={1} fill={c} />),
      )}
    </>
  );
}

/** A rolling ridge line from x=0 to w, filled down to the bottom. */
function Ridge({ w, h, y, amp, seed, fill, step = 4 }: { w: number; h: number; y: number; amp: number; seed: number; fill: string; step?: number }) {
  const r = seeded(seed);
  const a = r() * 6;
  const b = r() * 6;
  const pts: string[] = [];
  for (let x = 0; x <= w; x += step) pts.push(`${x},${Math.round(y + Math.sin(x / 23 + a) * amp + Math.sin(x / 9 + b) * amp * 0.35)}`);
  return <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={fill} />;
}

/** Jagged mountains with snow caps. */
function Peaks({ w, h, y, seed, fill, snow }: { w: number; h: number; y: number; seed: number; fill: string; snow?: string }) {
  const r = seeded(seed);
  const tops: [number, number][] = [];
  for (let x = -10; x < w + 30; x += 26 + Math.floor(r() * 22)) tops.push([x, y - 10 - Math.floor(r() * 22)]);
  const pts = tops.flatMap(([x, t], i) => (i ? [`${x - 13},${y}`, `${x},${t}`] : [`${x},${t}`]));
  return (
    <>
      <polygon points={`0,${h} ${pts.join(" ")} ${w},${y} ${w},${h}`} fill={fill} />
      {snow && tops.map(([x, t], i) => <polygon key={i} points={`${x},${t} ${x - 5},${t + 6} ${x - 2},${t + 5} ${x},${t + 7} ${x + 3},${t + 5} ${x + 5},${t + 6}`} fill={snow} />)}
    </>
  );
}

function Stars({ w, h, n, seed, colors }: { w: number; h: number; n: number; seed: number; colors: string[] }) {
  const r = seeded(seed);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x = Math.floor(r() * w);
        const y = Math.floor(r() * h);
        const c = colors[i % colors.length];
        return i % 7 === 0 ? (
          <g key={i} fill={c}>
            <rect x={x} y={y - 1} width={1} height={3} />
            <rect x={x - 1} y={y} width={3} height={1} />
          </g>
        ) : (
          <rect key={i} x={x} y={y} width={1} height={1} fill={c} />
        );
      })}
    </>
  );
}

function Pine({ x, y, s = 1, fill, dark }: { x: number; y: number; s?: number; fill: string; dark: string }) {
  const h = Math.round(14 * s);
  return (
    <>
      <polygon points={`${x},${y - h} ${x - 5 * s},${y - 2} ${x + 5 * s},${y - 2}`} fill={fill} />
      <polygon points={`${x},${y - h} ${x + 5 * s},${y - 2} ${x},${y - 2}`} fill={dark} />
      <rect x={x - 1} y={y - 2} width={2} height={3} fill="#4e2f1d" />
    </>
  );
}

function RoundTree({ x, y, r, fill, hi }: { x: number; y: number; r: number; fill: string; hi: string }) {
  return (
    <>
      <rect x={x - 1} y={y - 3} width={2} height={4} fill="#4e2f1d" />
      <circle cx={x} cy={y - 3 - r} r={r} fill={fill} />
      <circle cx={x - r / 3} cy={y - 4 - r * 1.3} r={r / 2.2} fill={hi} />
    </>
  );
}

function Cloud({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) {
  return (
    <g fill={c}>
      <rect x={x} y={y + 3 * s} width={24 * s} height={4 * s} />
      <rect x={x + 4 * s} y={y} width={10 * s} height={4 * s} />
      <rect x={x + 12 * s} y={y + 1 * s} width={8 * s} height={3 * s} />
    </g>
  );
}

/** Little town of houses with pitched roofs and lit windows. */
function Town({ x0, y, n, seed, wall, roof, lit }: { x0: number; y: number; n: number; seed: number; wall: string; roof: string; lit?: string }) {
  const r = seeded(seed);
  let x = x0;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const w = 10 + Math.floor(r() * 8);
        const hh = 7 + Math.floor(r() * 6);
        const hx = x;
        x += w + 2 + Math.floor(r() * 4);
        return (
          <g key={i}>
            <rect x={hx} y={y - hh} width={w} height={hh} fill={wall} />
            <polygon points={`${hx - 1},${y - hh} ${hx + w / 2},${y - hh - 6} ${hx + w + 1},${y - hh}`} fill={roof} />
            {lit && <rect x={hx + 3} y={y - hh + 3} width={2} height={2} fill={lit} />}
            {lit && w > 13 && <rect x={hx + w - 5} y={y - hh + 3} width={2} height={2} fill={lit} />}
          </g>
        );
      })}
    </>
  );
}

function Water({ w, y, h, deep, mid, foam, seed }: { w: number; y: number; h: number; deep: string; mid: string; foam: string; seed: number }) {
  const r = seeded(seed);
  return (
    <>
      <rect x={0} y={y} width={w} height={h} fill={deep} />
      <rect x={0} y={y} width={w} height={3} fill={mid} />
      {Array.from({ length: 40 }, (_, i) => (
        <rect key={i} x={Math.floor(r() * w)} y={y + 3 + Math.floor(r() * (h - 4))} width={3 + Math.floor(r() * 5)} height={1} fill={i % 3 ? mid : foam} />
      ))}
    </>
  );
}

const W = COVER_W;
const H = COVER_H;

/** One scene per cover id (see lib/covers.ts). */
const COVER_ART: Record<string, (r: R) => ReactNode> = {
  speed: () => (
    <>
      <Sky w={W} h={H} bands={["#d9703b", "#e8954a", "#f2b866", "#fbe29a"]} />
      <circle cx={70} cy={58} r={20} fill="#fff4dc" />
      <circle cx={70} cy={58} r={15} fill="#fbe29a" />
      <Cloud x={150} y={12} c="#f5cfc4" />
      <Cloud x={230} y={22} c="#f5cfc4" s={0.8} />
      <Ridge w={W} h={H} y={58} amp={5} seed={3} fill="#a8475e" />
      <Town x0={120} y={66} n={9} seed={4} wall="#e8cfa2" roof="#93392a" lit="#f4c95d" />
      <Ridge w={W} h={H} y={68} amp={3} seed={5} fill="#6aa645" />
      <Ridge w={W} h={H} y={74} amp={2} seed={6} fill="#4f8a3a" />
    </>
  ),
  dojo: () => (
    <>
      <Sky w={W} h={H} bands={["#93392a", "#c0502f", "#e8954a", "#f2b866"]} />
      <circle cx={230} cy={30} r={11} fill="#fbe29a" />
      <Ridge w={W} h={H} y={44} amp={6} seed={11} fill="#7a2f45" />
      <Ridge w={W} h={H} y={55} amp={5} seed={12} fill="#93392a" />
      {[20, 46, 80, 118, 160, 205, 248, 282].map((x, i) => (
        <RoundTree key={x} x={x} y={70 + (i % 2) * 3} r={6 + (i % 3)} fill={i % 2 ? "#d9703b" : "#c0502f"} hi="#f2b866" />
      ))}
      <Ridge w={W} h={H} y={72} amp={2} seed={13} fill="#8a5a32" />
    </>
  ),
  manga: (r) => (
    <>
      <rect width={W} height={H} fill="#f3e2c0" />
      {Array.from({ length: 60 }, (_, i) => (
        <rect key={i} x={Math.floor(r() * W)} y={Math.floor(r() * H)} width={2} height={1} fill="#e0b57a" />
      ))}
      <polygon points="20,70 45,52 80,60 110,40 150,48 170,30 210,36 240,22" fill="none" stroke="#a8743f" strokeWidth={1} strokeDasharray="3 2" />
      <path d="M236,18 l8,8 M244,18 l-8,8" stroke="#c0392b" strokeWidth={2} />
      <Peaks w={W} h={H} y={34} seed={21} fill="#c9955a" />
      <rect x={0} y={34} width={W} height={46} fill="#f3e2c0" opacity={0.85} />
      <g transform="translate(40 24)">
        <circle r={11} fill="#e8cfa2" stroke="#6e4425" strokeWidth={1} />
        <polygon points="0,-10 2,0 0,10 -2,0" fill="#c0392b" />
        <polygon points="-10,0 0,2 10,0 0,-2" fill="#6e4425" />
      </g>
      {[[90, 62], [130, 55], [180, 64], [270, 52]].map(([x, y], i) => (
        <Pine key={i} x={x} y={y} s={0.8} fill="#4f8a3a" dark="#3e6b32" />
      ))}
      <rect x={0} y={0} width={W} height={3} fill="#c9955a" />
      <rect x={0} y={H - 3} width={W} height={3} fill="#c9955a" />
    </>
  ),
  sakura: (r) => (
    <>
      <Sky w={W} h={H} bands={["#cf6f7d", "#e8a0a0", "#f5cfc4", "#fbf1dc"]} />
      <Ridge w={W} h={H} y={52} amp={5} seed={31} fill="#a996d6" />
      {[30, 90, 150, 210, 270].map((x, i) => (
        <g key={x}>
          <rect x={x - 1} y={50} width={3} height={22} fill="#6a4030" />
          <circle cx={x} cy={46} r={13} fill="#e8a0a0" />
          <circle cx={x - 7} cy={42} r={8} fill="#f5cfc4" />
          <circle cx={x + 8} cy={48} r={7} fill="#cf6f7d" />
          {i % 2 === 0 && <circle cx={x + 2} cy={38} r={5} fill="#f5cfc4" />}
        </g>
      ))}
      <Ridge w={W} h={H} y={72} amp={2} seed={32} fill="#6aa645" />
      {Array.from({ length: 50 }, (_, i) => (
        <rect key={i} x={Math.floor(r() * W)} y={Math.floor(r() * H)} width={2} height={1} fill={i % 2 ? "#f5cfc4" : "#cf6f7d"} />
      ))}
    </>
  ),
  neon: () => (
    <>
      <Sky w={W} h={H} bands={["#1c2540", "#23314f", "#2c2148", "#3a2a5a"]} />
      <Stars w={W} h={40} n={50} seed={41} colors={["#fbe29a", "#fffaf0"]} />
      <Town x0={4} y={74} n={18} seed={42} wall="#3b2416" roof="#4e2f1d" lit="#f4c95d" />
      <rect x={0} y={74} width={W} height={6} fill="#2b1d2e" />
      {[0, 1].map((k) => (
        <g key={k}>
          <path d={`M0,${22 + k * 14} Q75,${36 + k * 14} 150,${22 + k * 14} T300,${22 + k * 14}`} fill="none" stroke="#4a3040" strokeWidth={1} />
          {Array.from({ length: 12 }, (_, i) => {
            const x = 12 + i * 25 + k * 12;
            const t = (x % 150) / 150;
            const y = 22 + k * 14 + Math.round(Math.sin(t * Math.PI) * 10) + 1;
            return (
              <g key={i}>
                <rect x={x - 2} y={y} width={5} height={6} fill={i % 3 === 0 ? "#c0502f" : "#e8954a"} />
                <rect x={x - 1} y={y + 1} width={3} height={4} fill="#f4c95d" />
              </g>
            );
          })}
        </g>
      ))}
    </>
  ),
  ocean: () => (
    <>
      <Sky w={W} h={H} bands={["#4f78a8", "#7aa3cc", "#b4d0e6", "#fbf1dc"]} />
      <Cloud x={30} y={10} c="#fffaf0" />
      <Cloud x={170} y={18} c="#fffaf0" s={1.2} />
      <Water w={W} y={50} h={30} deep="#23314f" mid="#34507a" foam="#c4ead9" seed={51} />
      <rect x={250} y={24} width={8} height={28} fill="#fbf1dc" />
      <rect x={250} y={30} width={8} height={4} fill="#c0392b" />
      <rect x={250} y={40} width={8} height={4} fill="#c0392b" />
      <rect x={248} y={20} width={12} height={4} fill="#3d3a40" />
      <rect x={251} y={21} width={6} height={2} fill="#fbe29a" />
      <polygon points="80,46 100,46 96,52 84,52" fill="#6e4425" />
      <rect x={89} y={30} width={1} height={16} fill="#4e2f1d" />
      <polygon points="90,31 90,44 101,44" fill="#fffaf0" />
      <polygon points="230,52 300,52 300,46 270,42" fill="#5a5458" />
    </>
  ),
  thunder: () => (
    <>
      <Sky w={W} h={H} bands={["#1a1218", "#2b1d2e", "#3d3a40", "#5a5458"]} />
      <Cloud x={10} y={4} c="#3d3a40" s={1.6} />
      <Cloud x={120} y={2} c="#3d3a40" s={1.8} />
      <Cloud x={220} y={6} c="#3d3a40" s={1.4} />
      <polyline points="150,10 142,28 152,28 138,50" fill="none" stroke="#fbe29a" strokeWidth={2} />
      <polyline points="250,14 246,26 252,26 244,38" fill="none" stroke="#fffaf0" strokeWidth={1} />
      <Peaks w={W} h={H} y={64} seed={61} fill="#23314f" snow="#b4d0e6" />
      <Ridge w={W} h={H} y={72} amp={2} seed={62} fill="#1c2540" />
    </>
  ),
  synth: () => (
    <>
      <Sky w={W} h={H} bands={["#1c2540", "#23314f", "#34507a", "#4f78a8"]} />
      <Stars w={W} h={55} n={90} seed={71} colors={["#fffaf0", "#fbe29a", "#b4d0e6"]} />
      <circle cx={240} cy={20} r={9} fill="#fbf1dc" />
      <circle cx={244} cy={17} r={8} fill="#23314f" />
      <Ridge w={W} h={H} y={62} amp={4} seed={72} fill="#1c2540" />
      {Array.from({ length: 22 }, (_, i) => (
        <Pine key={i} x={6 + i * 14} y={78 - (i % 3)} s={0.9 + (i % 4) * 0.12} fill="#1f4a52" dark="#253d24" />
      ))}
    </>
  ),
  volcano: (r) => (
    <>
      <Sky w={W} h={H} bands={["#1a1218", "#4a3040", "#6b2a22", "#93392a"]} />
      <polygon points="120,80 165,26 185,26 230,80" fill="#3b2416" />
      <polygon points="160,32 165,26 185,26 190,32" fill="#d9703b" />
      <polygon points="170,26 172,40 168,52 176,44 178,60 182,40 180,26" fill="#e8954a" />
      <ellipse cx={175} cy={20} rx={16} ry={6} fill="#5a5458" />
      <ellipse cx={168} cy={12} rx={10} ry={5} fill="#3d3a40" />
      <Ridge w={W} h={H} y={70} amp={3} seed={81} fill="#2b1d2e" />
      <rect x={0} y={76} width={W} height={4} fill="#c0502f" />
      {Array.from({ length: 40 }, (_, i) => (
        <rect key={i} x={110 + Math.floor(r() * 130)} y={Math.floor(r() * 60)} width={1} height={1} fill={i % 2 ? "#f2b866" : "#e8954a"} />
      ))}
    </>
  ),
  galaxy: () => (
    <>
      <Sky w={W} h={H} bands={["#1c2540", "#1f4a52", "#23314f", "#2c2148"]} />
      <Stars w={W} h={50} n={60} seed={91} colors={["#fffaf0", "#c4ead9"]} />
      {[0, 1, 2].map((k) => (
        <path key={k} d={`M0,${30 + k * 6} C60,${10 + k * 6} 120,${42 + k * 5} 180,${20 + k * 6} S270,${30 + k * 4} 300,${14 + k * 6}`} fill="none" stroke={["#86d0bd", "#4fb0a0", "#a996d6"][k]} strokeWidth={4 - k} opacity={0.9} />
      ))}
      <Peaks w={W} h={H} y={68} seed={92} fill="#34507a" snow="#e4dacb" />
      <Ridge w={W} h={H} y={74} amp={2} seed={93} fill="#e4dacb" />
    </>
  ),
  vault: (r) => (
    <>
      <rect width={W} height={H} fill="#2b1d2e" />
      <Ridge w={W} h={H} y={10} amp={4} seed={101} fill="#3d3a40" />
      <rect width={W} height={10} fill="#1a1218" />
      {Array.from({ length: 140 }, (_, i) => {
        const x = Math.floor(r() * W);
        const y = 54 + Math.floor(r() * 26) - Math.round(Math.sin((x / W) * Math.PI) * 14);
        return <rect key={i} x={x} y={y} width={4} height={2} fill={i % 3 ? "#e8a33d" : "#f4c95d"} />;
      })}
      <g transform="translate(140 46)">
        <rect width={24} height={14} fill="#8a5a32" />
        <rect y={-6} width={24} height={6} fill="#a8743f" />
        <rect y={-1} width={24} height={2} fill="#cf8a1f" />
        <rect x={10} y={-2} width={4} height={5} fill="#f4c95d" />
      </g>
      {[[30, 30], [270, 26], [200, 18], [80, 22]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={2} height={2} fill="#fbe29a" />
      ))}
    </>
  ),
};

export const hasPixelCover = (id: string) => id in COVER_ART;

/** The boss arena: torch-lit stone ruins at night. */
function Arena({ w, h }: { w: number; h: number }) {
  const r = seeded(7);
  return (
    <>
      <Sky w={w} h={h} bands={["#1a1218", "#2b1d2e", "#2c2148", "#3a2a5a"]} />
      <Stars w={w} h={h * 0.45} n={70} seed={8} colors={["#fffaf0", "#a996d6"]} />
      <circle cx={w * 0.78} cy={h * 0.18} r={10} fill="#fbf1dc" />
      <Peaks w={w} h={h} y={h * 0.55} seed={9} fill="#23314f" />
      {/* broken stone arches */}
      {[0.12, 0.42, 0.72].map((fx, i) => {
        const x = Math.round(w * fx);
        const top = Math.round(h * 0.38);
        return (
          <g key={i}>
            <rect x={x} y={top} width={10} height={h * 0.62} fill="#5a5458" />
            <rect x={x + 40} y={top + (i === 1 ? 8 : 0)} width={10} height={h * 0.62} fill="#5a5458" />
            {i !== 1 && <rect x={x} y={top - 8} width={50} height={8} fill="#7d7574" />}
            <rect x={x + 2} y={top} width={2} height={h * 0.62} fill="#7d7574" />
            <rect x={x + 42} y={top} width={2} height={h * 0.62} fill="#7d7574" />
          </g>
        );
      })}
      {/* torches */}
      {[0.05, 0.95].map((fx) => {
        const x = Math.round(w * fx);
        const y = Math.round(h * 0.6);
        return (
          <g key={fx}>
            <circle cx={x} cy={y - 6} r={12} fill="#93392a" opacity={0.5} />
            <rect x={x - 1} y={y} width={3} height={14} fill="#4e2f1d" />
            <rect x={x - 2} y={y - 6} width={5} height={6} fill="#e8954a" />
            <rect x={x - 1} y={y - 9} width={3} height={4} fill="#f4c95d" />
          </g>
        );
      })}
      {/* stone floor */}
      <rect x={0} y={h * 0.78} width={w} height={h * 0.22} fill="#3d3a40" />
      {Array.from({ length: Math.ceil(w / 16) * 3 }, (_, i) => {
        const row = i % 3;
        const x = Math.floor(i / 3) * 16 + (row % 2) * 8;
        return <rect key={i} x={x} y={h * 0.78 + row * 7} width={15} height={1} fill="#2b1d2e" />;
      })}
      {Array.from({ length: 40 }, (_, i) => (
        <rect key={`p${i}`} x={Math.floor(r() * w)} y={h * 0.8 + Math.floor(r() * h * 0.2)} width={2} height={1} fill="#5a5458" />
      ))}
    </>
  );
}

const urls = new Map<string, Promise<string>>();

/** Rasterises a scene once and returns its picture URL ("" until it's ready). */
function useScene(key: string, node: () => ReactElement, w: number, h: number) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let live = true;
    let p = urls.get(key);
    if (!p) {
      p = pixelGrid(node(), w, h);
      urls.set(key, p);
    }
    p.then((u) => live && setUrl(u)).catch(() => {});
    return () => {
      live = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return url;
}

/** A cover as pixel art, cropped to fill its box. */
export function PixelCover({ id, className = "" }: { id: string; className?: string }) {
  const url = useScene(`cover:${id}`, () => {
    const r = seeded(id.length * 97 + id.charCodeAt(0));
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {COVER_ART[id]?.(r)}
      </svg>
    );
  }, W, H);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={`pixelated object-cover ${className}`} draggable={false} />
  ) : (
    <div className={`bg-card-2 ${className}`} />
  );
}

/** The boss arena, filling its parent behind the fight. */
export function PixelArena({ className = "" }: { className?: string }) {
  const AW = 320;
  const AH = 180;
  const url = useScene("arena", () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${AW} ${AH}`} width={AW} height={AH}>
      <Arena w={AW} h={AH} />
    </svg>
  ), AW, AH);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" aria-hidden className={`pixelated object-cover ${className}`} draggable={false} />
  ) : null;
}
