"use client";

// Banner cover art, drawn as wide SVG scenes that crop to any banner size.
// The text on the banner sits on a scrim (see CoverLayer), so every cover stays readable.

import type { ReactNode } from "react";
import { CUSTOM_COVER } from "@/lib/covers";
import { seeded } from "@/lib/items";

const W = 1200;
const H = 320;
const INK = "#0b0a14";

/** n points scattered over the scene, the same every render. */
const scatter = (n: number, seed: number) => {
  const r = seeded(seed);
  return Array.from({ length: n }, () => ({ x: r() * W, y: r() * H, s: r() }));
};

/** Lines bursting out from a point. */
function Burst({ cx, cy, n, color, width = 0.06 }: { cx: number; cy: number; n: number; color: string; width?: number }) {
  return (
    <g fill={color}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const b = a + width;
        const R = 1600;
        return <path key={i} d={`M${cx} ${cy} L${cx + Math.cos(a) * R} ${cy + Math.sin(a) * R} L${cx + Math.cos(b) * R} ${cy + Math.sin(b) * R} Z`} />;
      })}
    </g>
  );
}

function Halftone({ id, color, opacity = 0.25, size = 14 }: { id: string; color: string; opacity?: number; size?: number }) {
  return (
    <>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <circle cx={size / 2} cy={size / 2} r={size / 4.5} fill={color} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} opacity={opacity} />
    </>
  );
}

const ART: Record<string, (k: string) => ReactNode> = {
  speed: (k) => (
    <>
      <defs>
        <radialGradient id={`${k}g`} cx="0.12" cy="0.6" r="1">
          <stop offset="0" stopColor="#ffd23f" />
          <stop offset="0.35" stopColor="#ff5fae" />
          <stop offset="1" stopColor="#3a1c6e" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${k}g)`} />
      <Burst cx={150} cy={200} n={48} color="#ffffff" width={0.035} />
      <Halftone id={`${k}h`} color={INK} opacity={0.18} />
    </>
  ),
  dojo: (k) => (
    <>
      <defs>
        <linearGradient id={`${k}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b1d6e" />
          <stop offset="0.55" stopColor="#ff5f6d" />
          <stop offset="1" stopColor="#ffc371" />
        </linearGradient>
        <clipPath id={`${k}c`}>
          <circle cx={820} cy={210} r={120} />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill={`url(#${k}s)`} />
      <g clipPath={`url(#${k}c)`}>
        <rect x={680} y={80} width={280} height={260} fill="#ffe66d" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={680} y={226 + i * 18} width={280} height={6 + i * 2} fill="#ff5f6d" />
        ))}
      </g>
      <path d="M0 260 L120 190 L230 250 L380 160 L520 240 L640 200 L760 255 L900 180 L1040 245 L1200 190 L1200 320 L0 320 Z" fill="#2a1240" />
      <path d="M0 290 L160 250 L300 285 L470 240 L640 290 L820 250 L1000 290 L1200 255 L1200 320 L0 320 Z" fill="#170a26" />
      <g fill="#170a26">
        <rect x={1010} y={150} width={16} height={130} />
        <rect x={1108} y={150} width={16} height={130} />
        <path d="M985 140 Q1067 125 1150 140 L1150 152 Q1067 140 985 152 Z" />
        <rect x={998} y={168} width={140} height={10} />
      </g>
    </>
  ),
  manga: (k) => (
    <>
      <rect width={W} height={H} fill="#f5f1e6" />
      <Burst cx={180} cy={190} n={60} color={INK} width={0.02} />
      <Halftone id={`${k}h`} color={INK} opacity={0.3} size={12} />
      <path d="M760 40 L800 110 L880 70 L860 150 L960 160 L880 200 L930 270 L840 240 L810 300 L770 235 L690 270 L720 200 L640 170 L725 145 L700 70 Z" fill="#ff3b4f" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <g stroke={INK} strokeWidth={8} fill="none">
        <rect x={4} y={4} width={W - 8} height={H - 8} />
        <path d="M1000 4 L960 316" />
      </g>
    </>
  ),
  sakura: (k) => (
    <>
      <defs>
        <linearGradient id={`${k}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd6e8" />
          <stop offset="0.6" stopColor="#ff8cc6" />
          <stop offset="1" stopColor="#8a3ab9" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${k}s)`} />
      <path d="M1200 30 C1080 60 980 40 900 90 C840 125 780 120 720 150" stroke="#4a1f2e" strokeWidth={16} fill="none" strokeLinecap="round" />
      <path d="M1000 55 C980 100 940 120 930 160" stroke="#4a1f2e" strokeWidth={9} fill="none" strokeLinecap="round" />
      {scatter(26, 7).map((p, i) => (
        <circle key={`b${i}`} cx={720 + p.x * 0.4} cy={40 + p.y * 0.45} r={14 + p.s * 14} fill={p.s > 0.5 ? "#ffb7d5" : "#ff7eb6"} opacity={0.95} />
      ))}
      {scatter(60, 11).map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={6 + p.s * 6} ry={3 + p.s * 3} fill="#ffffff" opacity={0.75} transform={`rotate(${p.s * 180} ${p.x} ${p.y})`} />
      ))}
    </>
  ),
  neon: (k) => {
    const r = seeded(21);
    const towers = Array.from({ length: 22 }, (_, i) => ({ x: i * 56 - 10, w: 40 + r() * 30, h: 90 + r() * 170 }));
    return (
      <>
        <defs>
          <linearGradient id={`${k}s`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#090820" />
            <stop offset="1" stopColor="#3a1462" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${k}s)`} />
        <circle cx={980} cy={70} r={42} fill="#fff4c2" />
        <circle cx={995} cy={60} r={40} fill="#11102c" />
        {towers.map((t, i) => (
          <g key={i}>
            <rect x={t.x} y={H - t.h} width={t.w} height={t.h} fill={i % 2 ? "#14123a" : "#1d1950"} stroke="#000" strokeWidth={2} />
            {Array.from({ length: Math.floor(t.h / 22) }, (_, j) =>
              r() > 0.45 ? <rect key={j} x={t.x + 8 + (j % 2) * 14} y={H - t.h + 12 + j * 22} width={8} height={10} fill={r() > 0.5 ? "#ffd23f" : "#4fd2ff"} opacity={0.85} /> : null,
            )}
          </g>
        ))}
        <rect x={430} y={150} width={90} height={34} rx={6} fill="none" stroke="#ff5fae" strokeWidth={5} />
        <rect x={760} y={120} width={34} height={90} rx={6} fill="none" stroke="#4fd2ff" strokeWidth={5} />
        <rect x={1060} y={170} width={80} height={28} rx={6} fill="none" stroke="#ffd23f" strokeWidth={5} />
      </>
    );
  },
  ocean: (k) => (
    <>
      <defs>
        <linearGradient id={`${k}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3e3c3" />
          <stop offset="1" stopColor="#e6c99a" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${k}s)`} />
      <circle cx={900} cy={90} r={46} fill="#e8553f" />
      <path d="M0 230 C150 200 230 260 360 230 C470 205 520 120 640 90 C760 60 840 120 800 170 C770 205 720 180 740 150 C690 170 700 230 780 240 C900 255 1000 210 1200 230 L1200 320 L0 320 Z" fill="#1f4e8c" stroke={INK} strokeWidth={5} />
      <path d="M640 90 C700 80 760 95 790 130 L770 140 C750 115 710 105 680 112 Z" fill="#ffffff" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle key={i} cx={660 + i * 22} cy={92 - Math.sin(i / 2) * 14} r={9} fill="#ffffff" stroke={INK} strokeWidth={3} />
      ))}
      <path d="M0 280 C120 260 220 300 340 280 C460 260 560 300 680 280 C800 260 900 300 1020 280 C1100 268 1160 285 1200 280 L1200 320 L0 320 Z" fill="#163a6b" />
      <Halftone id={`${k}h`} color="#7a5a2e" opacity={0.12} />
    </>
  ),
  thunder: (k) => (
    <>
      <defs>
        <linearGradient id={`${k}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e0b2a" />
          <stop offset="1" stopColor="#2b2f6b" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${k}s)`} />
      {[60, 380, 760, 1040].map((x, i) => (
        <g key={i} fill="#3b3f7a" stroke={INK} strokeWidth={3}>
          <ellipse cx={x} cy={40} rx={140} ry={45} />
          <ellipse cx={x + 90} cy={30} rx={100} ry={40} />
        </g>
      ))}
      <path d="M560 50 L520 150 L560 150 L510 290 L620 130 L575 130 L610 50 Z" fill="#ffe14f" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M940 60 L915 140 L945 140 L905 250 L985 120 L952 120 L975 60 Z" fill="#9ff3ff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {scatter(40, 31).map((p, i) => (
        <rect key={i} x={p.x} y={110 + p.y * 0.65} width={2} height={18 + p.s * 18} fill="#9fb2ff" opacity={0.45} transform={`rotate(15 ${p.x} ${p.y})`} />
      ))}
    </>
  ),
  synth: (k) => (
    <>
      <defs>
        <linearGradient id={`${k}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#12062b" />
          <stop offset="0.6" stopColor="#5a1a7a" />
          <stop offset="1" stopColor="#12062b" />
        </linearGradient>
        <linearGradient id={`${k}u`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#ff3b8f" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${k}s)`} />
      <circle cx={800} cy={170} r={110} fill={`url(#${k}u)`} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={680} y={140 + i * 16} width={240} height={3 + i * 2} fill="#5a1a7a" />
      ))}
      <rect y={190} width={W} height={130} fill="#12062b" />
      <g stroke="#ff5fae" strokeWidth={2.5} opacity={0.9}>
        {Array.from({ length: 31 }, (_, i) => (
          <line key={i} x1={800 + (i - 15) * 20} y1={190} x2={800 + (i - 15) * 140} y2={H} />
        ))}
        {[196, 206, 220, 240, 266, 300].map((y) => (
          <line key={y} x1={0} y1={y} x2={W} y2={y} />
        ))}
      </g>
    </>
  ),
  volcano: (k) => (
    <>
      <defs>
        <linearGradient id={`${k}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a0505" />
          <stop offset="1" stopColor="#8a1c0c" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${k}s)`} />
      <path d="M560 320 L760 110 L820 110 L1040 320 Z" fill="#2a0d08" stroke={INK} strokeWidth={4} />
      <path d="M760 110 L820 110 L800 160 L785 130 L770 170 Z" fill="#ff6a1f" />
      <path d="M790 110 C770 60 820 40 790 0 L840 0 C860 50 800 70 820 110 Z" fill="#ff8a1f" opacity={0.8} />
      <path d="M0 320 L0 250 C200 230 300 280 480 250 L520 320 Z" fill="#1a0705" />
      {scatter(50, 41).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.5 + p.s * 3} fill={p.s > 0.5 ? "#ffd23f" : "#ff6a1f"} opacity={0.8} />
      ))}
    </>
  ),
  galaxy: (k) => (
    <>
      <rect width={W} height={H} fill="#06051a" />
      <defs>
        <radialGradient id={`${k}n1`}>
          <stop offset="0" stopColor="#c77dff" stopOpacity={0.8} />
          <stop offset="1" stopColor="#c77dff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${k}n2`}>
          <stop offset="0" stopColor="#4fd2ff" stopOpacity={0.6} />
          <stop offset="1" stopColor="#4fd2ff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={500} cy={160} rx={420} ry={140} fill={`url(#${k}n1)`} />
      <ellipse cx={950} cy={120} rx={300} ry={120} fill={`url(#${k}n2)`} />
      {scatter(140, 51).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.s * 2 + 0.4} fill="#ffffff" opacity={0.4 + p.s * 0.6} />
      ))}
      <circle cx={1020} cy={200} r={56} fill="#ff8a5c" stroke={INK} strokeWidth={4} />
      <ellipse cx={1020} cy={200} rx={100} ry={18} fill="none" stroke="#ffd23f" strokeWidth={6} transform="rotate(-18 1020 200)" />
    </>
  ),
  vault: (k) => (
    <>
      <defs>
        <radialGradient id={`${k}g`} cx="0.6" cy="0.5" r="0.8">
          <stop offset="0" stopColor="#fff2a8" />
          <stop offset="0.5" stopColor="#ffb31f" />
          <stop offset="1" stopColor="#7a3d00" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${k}g)`} />
      <Burst cx={720} cy={160} n={36} color="#fff7cc" width={0.05} />
      {scatter(70, 61).map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${230 + p.s * 90})`}>
          <ellipse rx={22} ry={9} fill="#ffd23f" stroke={INK} strokeWidth={3} />
          <ellipse rx={12} ry={4} fill="none" stroke="#b07000" strokeWidth={2} />
        </g>
      ))}
    </>
  ),
};

/** Small preview of a cover, for the shop and the picker. */
export function CoverArt({ id, image, className = "" }: { id: string; image?: string; className?: string }) {
  if (id === CUSTOM_COVER && image) return <img src={image} alt="" className={`object-cover ${className}`} />;
  const art = ART[id];
  if (!art) return <div className={`hud-hero ${className}`} />;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      {art(`cv-${id}-`)}
    </svg>
  );
}

/** The cover behind the banner, with a scrim on top so the name, XP and stats stay readable. */
export function CoverLayer({ id, image }: { id: string; image?: string }) {
  if (id === "classic" || (id === CUSTOM_COVER && !image)) return null;
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <CoverArt id={id} image={image} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--color-card) 55%, transparent) 22%, color-mix(in srgb, var(--color-card) 45%, transparent) 62%, color-mix(in srgb, var(--color-card) 10%, transparent) 100%)" }} />
    </div>
  );
}

/** Shrinks an uploaded picture to a banner-sized JPEG (under ~150 KB) so it saves with your data. */
export async function shrinkCover(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => fail(new Error("That file isn't a picture we can read."));
      i.src = url;
    });
    const scale = Math.min(1, 1400 / img.width, 900 / img.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.8, 0.7, 0.6, 0.5, 0.4]) {
      const out = canvas.toDataURL("image/jpeg", q);
      if (out.length < 200_000) return out;
    }
    throw new Error("That picture is too detailed to save. Try a smaller one.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
