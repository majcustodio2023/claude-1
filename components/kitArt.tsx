"use client";

import { createContext, useContext } from "react";

// Kit the fox sidekick. Each personality has its own look (fur, eyes, mouth, extras),
// the owner can recolour fur and eyes, and Kit can wear shop items (lib/items.ts, "kit-" slots).

const INK = "#0b0a14";

type Eyes = "normal" | "slit" | "spiral" | "smug" | "closed" | "angry";
type Mouth = "smile" | "fang" | "tongue" | "shout" | "smirk" | "calm";
type Extra = "wisps" | "helmet" | "leaf" | "sweat" | "sparkle" | null;

interface KitStyle {
  fur: string;
  belly: string;
  eyes: string;
  mark: string;
  eyeShape: Eyes;
  mouth: Mouth;
  extra: Extra;
}

export const KIT_LOOKS: Record<string, KitStyle> = {
  kit: { fur: "#ff8a1f", belly: "#fff4e0", eyes: INK, mark: "#4fd2ff", eyeShape: "normal", mouth: "smile", extra: null },
  shadow: { fur: "#2b2140", belly: "#4a3a6a", eyes: "#ff2a4f", mark: "#ff2a4f", eyeShape: "slit", mouth: "fang", extra: "wisps" },
  chaos: { fur: "#ff5fae", belly: "#fff1a8", eyes: INK, mark: "#6ee77a", eyeShape: "spiral", mouth: "tongue", extra: "sweat" },
  sergeant: { fur: "#8a6a3a", belly: "#f1e3c4", eyes: INK, mark: "#ffd23f", eyeShape: "angry", mouth: "shout", extra: "helmet" },
  rival: { fur: "#4f6bff", belly: "#e8ecff", eyes: "#ffd23f", mark: "#ff3b4f", eyeShape: "smug", mouth: "smirk", extra: "sparkle" },
  zen: { fur: "#f4efe4", belly: "#ffffff", eyes: INK, mark: "#6ee77a", eyeShape: "closed", mouth: "calm", extra: "leaf" },
};

/** Personality, colour overrides and worn items for every Kit on screen. */
export const KitStyleContext = createContext<{ persona?: string; fur?: string; eyes?: string; items?: string[] }>({});

export function Kit({
  size = 110,
  className = "",
  talking = false,
  persona: personaProp,
  items: itemsProp,
  fur: furProp,
  eyes: eyesProp,
}: {
  size?: number;
  className?: string;
  talking?: boolean;
  persona?: string;
  items?: string[];
  fur?: string;
  eyes?: string;
}) {
  const ctx = useContext(KitStyleContext);
  const base = KIT_LOOKS[personaProp ?? ctx.persona ?? "kit"] ?? KIT_LOOKS.kit;
  const items = itemsProp ?? ctx.items ?? [];
  const fur = furProp ?? ctx.fur ?? base.fur;
  const eyeColor = eyesProp ?? ctx.eyes ?? base.eyes;
  const s = { ...base, fur, eyes: eyeColor };
  const has = (id: string) => items.includes(id);
  const hatOn = items.some((i) => i.startsWith("kit-") && ["kit-bow", "kit-ninja", "kit-headphones", "kit-wizard", "kit-crown"].includes(i));
  const dark = fur === KIT_LOOKS.shadow.fur;
  const earInner = dark ? "#ff2a4f" : "#3a1d0b";

  return (
    <svg viewBox="-10 -26 180 180" width={size} height={size} className={className} role="img" aria-label="Kit the fox sidekick">
      {s.extra === "wisps" && (
        <g className="aura-flicker" opacity="0.8">
          <path d="M80,-18 C66,4 40,0 30,22 C10,34 16,64 4,80 C0,110 14,130 20,150 L140,150 C146,130 160,110 156,80 C144,64 150,34 130,22 C120,0 94,4 80,-18 Z" fill="#7b1fa2" opacity="0.45" />
        </g>
      )}
      {has("kit-ninetails") && (
        <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round" className="tail-swish">
          {[-140, -118, -96, -74, -52, -30, -8, 14].map((a, i) => (
            <g key={i} transform={`rotate(${a} 90 116) translate(90 116) scale(1.35) translate(-90 -116)`}>
              <path d="M96,118 C136,116 158,80 144,52 C150,84 128,100 94,104 Z" fill={fur} />
              <path d="M144,52 C156,66 154,84 148,92 C150,78 146,64 144,52 Z" fill={i % 2 ? "#ffd23f" : "#fff4e0"} strokeWidth="2.5" />
            </g>
          ))}
        </g>
      )}
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {/* tail */}
        <path className="tail-swish" d="M110,120 C150,118 158,80 140,62 C150,90 128,104 104,104 Z" fill={fur} />
        <path d="M140,62 C152,74 150,90 144,98 C146,84 142,72 140,62 Z" fill={s.belly} strokeWidth="3" />
        {/* body */}
        <ellipse cx="80" cy="118" rx="34" ry="24" fill={fur} />
        <ellipse cx="80" cy="124" rx="18" ry="14" fill={s.belly} strokeWidth="3" />
        {/* ears */}
        <path d="M36,58 L30,10 L68,40 Z" fill={fur} />
        <path d="M124,58 L130,10 L92,40 Z" fill={fur} />
        <path d="M40,46 L37,24 L56,40 Z M120,46 L123,24 L104,40 Z" fill={earInner} strokeWidth="2" />
        {/* head */}
        <path d="M24,66 C24,40 50,30 80,30 C110,30 136,40 136,66 C136,92 112,108 80,108 C48,108 24,92 24,66 Z" fill={fur} />
        <path d="M40,78 C52,74 66,82 80,98 C94,82 108,74 120,78 C116,98 100,106 80,106 C60,106 44,98 40,78 Z" fill={s.belly} strokeWidth="3" />
        {/* forehead mark */}
        <path d="M80,40 L74,54 L80,50 L86,54 Z" fill={s.mark} strokeWidth="2.5" />
      </g>
      <KitEyes shape={s.eyeShape} color={s.eyes} />
      <ellipse cx="44" cy="82" rx="7" ry="4" fill="#ff6f91" opacity={dark ? 0.35 : 0.75} />
      <ellipse cx="116" cy="82" rx="7" ry="4" fill="#ff6f91" opacity={dark ? 0.35 : 0.75} />
      <KitMouth mouth={s.mouth} talking={talking} />
      {s.extra === "sweat" && <path d="M126,40 C132,50 134,56 128,60 C122,58 122,50 126,40 Z" fill="#7ff3ff" stroke={INK} strokeWidth="2.5" />}
      {s.extra === "sparkle" && <path d="M140,30 L143,38 L151,40 L143,42 L140,50 L137,42 L129,40 L137,38 Z" fill="#ffd23f" stroke={INK} strokeWidth="2" />}
      {!hatOn && s.extra === "leaf" && (
        <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <path d="M80,30 C70,10 84,-2 98,-6 C98,10 92,24 80,30 Z" fill="#6ee77a" />
          <path d="M80,30 C86,16 92,6 96,0" fill="none" strokeWidth="2" />
        </g>
      )}
      {!hatOn && s.extra === "helmet" && (
        <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
          <path d="M30,52 C30,20 54,10 80,10 C106,10 130,20 130,52 Z" fill="#4b5d2a" />
          <path d="M22,54 L138,54 L136,62 L24,62 Z" fill="#3b4a20" />
          <path d="M56,26 L62,22 M92,20 L100,24 M72,36 L78,32" stroke="#2c3818" strokeWidth="3" />
        </g>
      )}
      <KitItems items={items} />
    </svg>
  );
}

function KitEyes({ shape, color }: { shape: Eyes; color: string }) {
  if (shape === "closed")
    return (
      <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M50,70 Q60,78 70,70" />
        <path d="M90,70 Q100,78 110,70" />
      </g>
    );
  if (shape === "spiral")
    return (
      <g stroke={INK} strokeWidth="3" fill="#fff">
        <circle cx="60" cy="68" r="11" />
        <circle cx="100" cy="68" r="11" />
        <path d="M60,68 m-1,0 a2,2 0 1,1 3,1 a5,5 0 1,1 -7,-4 a8,8 0 1,1 11,9" fill="none" strokeWidth="2.5" />
        <path d="M100,68 m-1,0 a2,2 0 1,1 3,1 a5,5 0 1,1 -7,-4 a8,8 0 1,1 11,9" fill="none" strokeWidth="2.5" />
      </g>
    );
  if (shape === "slit")
    return (
      <g stroke={INK} strokeWidth="3">
        <path d="M46,64 L74,70 L70,76 C60,78 52,74 46,64 Z" fill={color} />
        <path d="M114,64 L86,70 L90,76 C100,78 108,74 114,64 Z" fill={color} />
        <path d="M61,68 L61,76 M99,68 L99,76" strokeWidth="2.5" />
        <path d="M42,56 L72,64 M118,56 L88,64" strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  if (shape === "smug")
    return (
      <g stroke={INK} strokeWidth="3">
        <ellipse cx="60" cy="70" rx="9" ry="8" fill={color} />
        <ellipse cx="100" cy="70" rx="9" ry="8" fill={color} />
        <circle cx="60" cy="72" r="4" fill={INK} stroke="none" />
        <circle cx="100" cy="72" r="4" fill={INK} stroke="none" />
        <path d="M48,66 L72,66 M88,66 L112,66" strokeWidth="5" strokeLinecap="round" />
        <path d="M88,54 Q100,48 112,56" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </g>
    );
  return (
    <g stroke={INK} strokeWidth="3">
      <ellipse cx="60" cy="68" rx="9" ry="11" fill={color} />
      <ellipse cx="100" cy="68" rx="9" ry="11" fill={color} />
      <circle cx="63" cy="64" r="3.5" fill="#fff" stroke="none" />
      <circle cx="103" cy="64" r="3.5" fill="#fff" stroke="none" />
      <circle cx="57" cy="73" r="1.6" fill="#fff" stroke="none" />
      <circle cx="97" cy="73" r="1.6" fill="#fff" stroke="none" />
      {shape === "angry" && <path d="M46,52 L72,60 M114,52 L88,60" strokeWidth="5" strokeLinecap="round" />}
    </g>
  );
}

function KitMouth({ mouth, talking }: { mouth: Mouth; talking: boolean }) {
  return (
    <g stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="80" cy="84" rx="5" ry="3.5" fill={INK} />
      {mouth === "shout" ? (
        <path d="M68,90 Q80,88 92,90 Q90,108 80,108 Q70,108 68,90 Z" fill="#c2253a" />
      ) : mouth === "tongue" ? (
        <>
          <path d="M70,91 Q80,102 90,91 Z" fill="#c2253a" />
          <path d="M78,96 Q80,108 86,104 Q88,98 84,96 Z" fill="#ff8fa3" />
        </>
      ) : mouth === "fang" ? (
        <>
          <path d="M70,92 Q80,98 90,90" fill="none" />
          <path d="M84,93 L86,100 L89,92 Z" fill="#fff" strokeWidth="2" />
        </>
      ) : mouth === "smirk" ? (
        <path d="M72,94 Q82,96 90,88" fill="none" />
      ) : mouth === "calm" ? (
        <path d="M74,93 Q80,97 86,93" fill="none" />
      ) : talking ? (
        <path d="M72,92 Q80,104 88,92 Z" fill="#c2253a" />
      ) : (
        <path d="M72,92 Q76,97 80,92 Q84,97 88,92" fill="none" />
      )}
    </g>
  );
}

function KitItems({ items }: { items: string[] }) {
  const has = (id: string) => items.includes(id);
  return (
    <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
      {has("kit-bell") && (
        <>
          <path d="M50,104 C64,112 96,112 110,104 L110,112 C96,120 64,120 50,112 Z" fill="#d62839" />
          <circle cx="80" cy="120" r="8" fill="#ffd23f" />
          <path d="M76,122 L84,122" strokeWidth="2.5" />
        </>
      )}
      {has("kit-bandana") && <path d="M48,102 C64,110 96,110 112,102 L96,128 L80,136 L64,128 Z" fill="#d62839" />}
      {has("kit-chain") && (
        <>
          <path d="M50,104 C60,124 100,124 110,104" fill="none" stroke="#ffd23f" strokeWidth="6" />
          <path d="M50,104 C60,124 100,124 110,104" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="3 4" />
          <circle cx="80" cy="124" r="10" fill="#ffd23f" />
          <text x="80" y="129" textAnchor="middle" fontFamily="Bangers, Impact, sans-serif" fontSize="14" fill={INK} stroke="none">$</text>
        </>
      )}
      {has("kit-shades") && (
        <>
          <path d="M44,60 L74,62 L70,78 C62,82 50,80 46,74 Z" fill="#141022" />
          <path d="M116,60 L86,62 L90,78 C98,82 110,80 114,74 Z" fill="#141022" />
          <path d="M74,64 L86,64" />
          <path d="M52,66 L60,66 M94,66 L102,66" stroke="#4fd2ff" strokeWidth="2.5" />
        </>
      )}
      {has("kit-monocle") && (
        <>
          <circle cx="100" cy="68" r="14" fill="#7ff3ff" fillOpacity="0.25" stroke="#ffd23f" strokeWidth="4" />
          <path d="M114,72 C120,86 118,100 112,110" fill="none" stroke="#ffd23f" strokeWidth="2" />
        </>
      )}
      {has("kit-ninja") && (
        <>
          <path d="M26,52 C50,42 110,42 134,52 L134,60 C110,50 50,50 26,60 Z" fill="#16131f" />
          <rect x="68" y="44" width="24" height="10" rx="2" fill="#c9d2ff" strokeWidth="2.5" />
          <path d="M134,54 C146,52 154,60 162,56 C158,66 146,66 136,62 Z" fill="#16131f" />
        </>
      )}
      {has("kit-headphones") && (
        <>
          <path d="M28,58 C26,8 134,8 132,58" fill="none" strokeWidth="7" />
          <path d="M28,58 C26,8 134,8 132,58" fill="none" stroke="#ff5fae" strokeWidth="3" />
          <rect x="16" y="50" width="18" height="28" rx="7" fill="#ff5fae" />
          <rect x="126" y="50" width="18" height="28" rx="7" fill="#ff5fae" />
        </>
      )}
      {has("kit-bow") && (
        <>
          <path d="M80,30 L56,16 L54,42 Z" fill="#ff5fae" />
          <path d="M80,30 L104,16 L106,42 Z" fill="#ff5fae" />
          <circle cx="80" cy="30" r="7" fill="#ff8fc0" />
        </>
      )}
      {has("kit-wizard") && (
        <>
          <path d="M50,34 C62,10 76,-10 104,-22 C96,-4 106,16 112,34 Z" fill="#5b2a9e" />
          <ellipse cx="80" cy="36" rx="46" ry="9" fill="#5b2a9e" />
          <path d="M84,4 L87,11 L94,11 L88,15 L90,22 L84,18 L78,22 L80,15 L74,11 L81,11 Z" fill="#ffd23f" strokeWidth="2" />
        </>
      )}
      {has("kit-crown") && (
        <g className="pulse-gold">
          <path d="M52,32 L56,6 L68,20 L80,0 L92,20 L104,6 L108,32 Z" fill="#ffd23f" />
          <circle cx="80" cy="22" r="4" fill="#d62839" strokeWidth="2" />
        </g>
      )}
    </g>
  );
}
