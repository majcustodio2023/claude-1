"use client";

// Wearable items for the hero (see lib/items.ts). Drawn in the hero's 200-wide
// space: head centred at (100,96), body 68–132, feet at y=232.

const INK = "#0b0a14";
const MIRROR = "matrix(-1 0 0 1 200 0)";

type P = { items: string[] };

export function ItemAura({ items }: P) {
  return (
    <>
      {items.includes("galaxy") && (
        <g className="aura-flicker">
          <ellipse cx="100" cy="120" rx="112" ry="124" fill="#1b1046" opacity="0.85" />
          <ellipse cx="100" cy="120" rx="90" ry="100" fill="#3a1f8f" opacity="0.6" />
          {[
            [10, 20], [190, 40], [30, 200], [180, 190], [150, -6], [40, 60], [196, 120], [4, 130], [120, 230], [70, -14],
          ].map(([x, y], i) => (
            <path key={i} d={`M${x},${y - 6} L${x + 2},${y - 2} L${x + 6},${y} L${x + 2},${y + 2} L${x},${y + 6} L${x - 2},${y + 2} L${x - 6},${y} L${x - 2},${y - 2} Z`} fill={i % 3 ? "#fff" : "#ffd23f"} />
          ))}
        </g>
      )}
      {items.includes("shadow") && (
        <g className="aura-flicker">
          <path d="M100,-20 C90,10 60,0 50,30 C20,40 30,80 10,100 C0,140 20,170 20,210 L180,210 C180,170 200,140 190,100 C170,80 180,40 150,30 C140,0 110,10 100,-20 Z" fill="#2b0b3f" opacity="0.8" />
          <path d="M100,0 C92,24 70,18 64,44 C42,56 46,88 32,106 C26,140 40,170 40,200 L160,200 C160,170 174,140 168,106 C154,88 158,56 136,44 C130,18 108,24 100,0 Z" fill="#7b1fa2" opacity="0.5" />
        </g>
      )}
      {items.includes("electric") && (
        <g stroke="#7ff3ff" strokeWidth="5" strokeLinejoin="round" fill="none" className="aura-flicker">
          <path d="M-4,90 L14,104 L2,110 L22,132" />
          <path d="M204,96 L186,112 L198,118 L178,140" />
          <path d="M40,-10 L52,12 L40,14 L54,36" />
          <path d="M164,-6 L150,16 L162,18 L148,40" />
        </g>
      )}
      {items.includes("sakura") && (
        <g className="aura-flicker">
          {[
            [6, 40, 20], [190, 30, -30], [24, 150, 60], [184, 160, 10], [40, 0, -20], [160, 220, 40], [-6, 210, 80], [196, 96, -60], [120, -10, 30],
          ].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="9" ry="5" transform={`rotate(${r} ${x} ${y})`} fill={i % 2 ? "#ffb7d5" : "#ff8fc0"} stroke={INK} strokeWidth="2" />
          ))}
        </g>
      )}
    </>
  );
}

export function ItemBack({ items }: P) {
  return (
    <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
      {items.includes("angel-wings") && (
        <>
          {[0, 1].map((m) => (
            <path
              key={m}
              transform={m ? MIRROR : undefined}
              d="M74,150 C50,110 20,90 -16,70 C-12,96 -18,116 -10,132 C-18,140 -16,156 -6,162 C-12,172 -6,186 6,186 C10,196 24,196 30,188 C44,186 60,176 74,170 Z"
              fill="#ffffff"
            />
          ))}
          <path d="M0,110 C20,118 40,130 60,150 M4,150 C24,152 42,158 62,164" fill="none" stroke="#b8c4ff" strokeWidth="3" />
          <path transform={MIRROR} d="M0,110 C20,118 40,130 60,150 M4,150 C24,152 42,158 62,164" fill="none" stroke="#b8c4ff" strokeWidth="3" />
        </>
      )}
      {items.includes("demon-wings") &&
        [0, 1].map((m) => (
          <path
            key={m}
            transform={m ? MIRROR : undefined}
            d="M76,154 C46,120 16,104 -14,56 C-4,96 -8,124 -18,146 C6,138 16,156 6,180 C26,166 44,170 50,190 C58,170 66,168 76,174 Z"
            fill="#5a0f2e"
          />
        ))}
      {items.includes("jetpack") && (
        <>
          <rect x="48" y="136" width="22" height="56" rx="8" fill="#9aa4c8" />
          <rect x="130" y="136" width="22" height="56" rx="8" fill="#9aa4c8" />
          <path className="aura-flicker" d="M50,194 L59,226 L68,194 Z M132,194 L141,226 L150,194 Z" fill="#ff7a1a" />
        </>
      )}
      {items.includes("red-cape") && <path className="scarf-wave" d="M72,146 C60,190 50,218 36,240 C80,232 120,232 164,240 C150,218 140,190 128,146 Z" fill="#c1121f" />}
    </g>
  );
}

export function ItemFace({ items }: P) {
  return (
    <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
      {items.includes("scar") && <path d="M66,86 L98,124 M72,96 L80,90 M82,108 L90,102" stroke="#c2253a" strokeWidth="4" fill="none" />}
      {items.includes("oni-mask") && (
        <>
          <path d="M56,112 C70,116 130,116 144,112 C142,132 124,146 100,146 C76,146 58,132 56,112 Z" fill="#d62839" />
          <path d="M74,120 L80,132 L86,120 L92,132 L98,120 L104,132 L110,120 L116,132 L122,120 L128,132" fill="#fff" strokeWidth="2.5" />
          <path d="M64,118 L56,104 M136,118 L144,104" strokeWidth="5" />
        </>
      )}
      {items.includes("shades") && (
        <>
          <path d="M64,94 L98,94 L94,114 C86,118 72,118 68,112 Z" fill="#141022" />
          <path d="M102,94 L136,94 L132,112 C128,118 114,118 106,114 Z" fill="#141022" />
          <path d="M98,98 L102,98 M64,94 L50,98 M136,94 L150,98" />
          <path d="M70,98 L80,98 M108,98 L118,98" stroke="#4fd2ff" strokeWidth="3" />
        </>
      )}
      {items.includes("eyepatch") && (
        <>
          <path d="M52,84 L150,118" strokeWidth="4" />
          <ellipse cx="118" cy="104" rx="15" ry="17" fill="#141022" />
        </>
      )}
    </g>
  );
}

export function ItemHat({ items }: P) {
  return (
    <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
      {items.includes("cat-ears") && (
        <>
          <path d="M56,50 L60,2 L92,34 Z" fill="#2b2140" />
          <path d="M144,50 L140,2 L108,34 Z" fill="#2b2140" />
          <path d="M64,40 L66,16 L82,32 Z M136,40 L134,16 L118,32 Z" fill="#ff8fc0" strokeWidth="2.5" />
        </>
      )}
      {items.includes("devil-horns") && (
        <>
          <path d="M64,40 C52,30 46,14 52,-6 C58,10 68,22 80,30 Z" fill="#d62839" />
          <path d="M136,40 C148,30 154,14 148,-6 C142,10 132,22 120,30 Z" fill="#d62839" />
        </>
      )}
      {items.includes("halo") && (
        <g className="pulse-gold">
          <ellipse cx="100" cy="-10" rx="36" ry="10" fill="none" stroke="#ffd23f" strokeWidth="7" />
          <ellipse cx="100" cy="-10" rx="36" ry="10" fill="none" stroke={INK} strokeWidth="2" />
        </g>
      )}
      {items.includes("wizard-hat") && (
        <>
          <path d="M62,40 C76,10 92,-14 120,-26 C112,-6 126,16 140,40 Z" fill="#5b2a9e" />
          <ellipse cx="100" cy="42" rx="62" ry="11" fill="#5b2a9e" />
          <path d="M104,8 L107,15 L114,15 L108,19 L110,26 L104,22 L98,26 L100,19 L94,15 L101,15 Z" fill="#ffd23f" strokeWidth="2" />
        </>
      )}
      {items.includes("kabuto") && (
        <>
          <path d="M44,84 C40,40 66,22 100,22 C134,22 160,40 156,84 C140,70 122,64 100,64 C78,64 60,70 44,84 Z" fill="#1d1d2e" />
          <path d="M40,84 L28,108 L56,96 Z M160,84 L172,108 L144,96 Z" fill="#c1121f" />
          <path d="M100,30 C80,14 64,-4 60,-18 C78,-6 92,0 100,10 C108,0 122,-6 140,-18 C136,-4 120,14 100,30 Z" fill="#ffd23f" />
          <circle cx="100" cy="40" r="8" fill="#c1121f" />
        </>
      )}
      {items.includes("flame-crown") && (
        <g className="aura-flicker">
          <path d="M66,30 C60,10 74,0 70,-20 C84,-8 84,6 88,10 C88,-6 96,-20 100,-34 C106,-18 112,-6 112,10 C118,2 120,-10 130,-20 C128,0 140,10 134,30 Z" fill="#ff7a1a" />
          <path d="M78,30 C76,16 84,10 84,0 C92,10 94,16 100,18 C104,8 108,0 112,-6 C116,8 122,16 122,30 Z" fill="#ffd23f" strokeWidth="3" />
          <path d="M66,30 L134,30 L130,42 L70,42 Z" fill="#ffd23f" />
        </g>
      )}
    </g>
  );
}

/** Weapon in the right hand. `at` is the hand; raised when attacking or hyped. */
export function ItemWeapon({ items, at, raised }: P & { at: [number, number]; raised: boolean }) {
  const [x, y] = at;
  const tilt = raised ? 12 : 28;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`} stroke={INK} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
      {items.includes("katana") && (
        <>
          <path d="M-3,-18 C-6,-60 -4,-90 4,-118 C8,-90 6,-60 4,-18 Z" fill="#e6ecff" />
          <path d="M1,-24 C0,-60 2,-90 4,-112" stroke="#9fb0ff" strokeWidth="2" fill="none" />
          <ellipse cx="0" cy="-16" rx="12" ry="4" fill="#ffd23f" />
          <rect x="-4" y="-14" width="8" height="26" rx="2" fill="#2b2140" />
        </>
      )}
      {items.includes("staff") && (
        <>
          <path d="M0,36 L0,-92" strokeWidth="9" />
          <path d="M0,36 L0,-92" strokeWidth="4" stroke="#8a5a2b" />
          <circle cx="0" cy="-102" r="13" fill="#4fd2ff" className="aura-flicker" />
          <circle cx="-4" cy="-106" r="4" fill="#fff" stroke="none" />
        </>
      )}
      {items.includes("hammer") && (
        <>
          <path d="M0,30 L0,-60" strokeWidth="10" />
          <path d="M0,30 L0,-60" strokeWidth="5" stroke="#8a5a2b" />
          <rect x="-30" y="-94" width="60" height="36" rx="6" fill="#9aa4c8" />
          <rect x="-30" y="-94" width="12" height="36" rx="3" fill="#ffd23f" />
          <rect x="18" y="-94" width="12" height="36" rx="3" fill="#ffd23f" />
        </>
      )}
      {items.includes("scythe") && (
        <>
          <path d="M0,40 L0,-104" strokeWidth="9" />
          <path d="M0,40 L0,-104" strokeWidth="4" stroke="#3a2a5e" />
          <path d="M0,-104 C-30,-118 -64,-104 -80,-74 C-56,-92 -30,-96 -2,-88 Z" fill="#b388ff" />
          <path d="M-8,-96 C-30,-102 -52,-96 -66,-82" stroke="#fff" strokeWidth="2" fill="none" />
        </>
      )}
      {items.includes("laser") && (
        <g transform={`rotate(${-tilt - 70})`}>
          <rect x="-6" y="-8" width="44" height="16" rx="5" fill="#ff5fae" />
          <rect x="38" y="-4" width="12" height="8" rx="2" fill="#7ff3ff" />
          <path d="M0,8 L-2,26 L10,26 L12,8 Z" fill="#2b2140" />
        </g>
      )}
    </g>
  );
}

export function ItemPet({ items }: P) {
  return (
    <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round" className="bob">
      {items.includes("slime") && (
        <>
          <path d="M-8,234 C-12,214 2,196 18,196 C34,196 46,214 42,234 Z" fill="#6ee77a" />
          <circle cx="10" cy="216" r="3.5" fill={INK} />
          <circle cx="26" cy="216" r="3.5" fill={INK} />
          <path d="M12,224 Q18,228 24,224" fill="none" />
          <ellipse cx="4" cy="206" rx="5" ry="3" fill="#fff" stroke="none" opacity="0.7" />
        </>
      )}
      {items.includes("ghost") && (
        <>
          <path d="M-6,186 C-8,154 6,140 20,140 C34,140 48,154 46,186 L38,180 L30,188 L22,180 L14,188 L6,180 Z" fill="#f4f1ff" />
          <ellipse cx="12" cy="160" rx="3.5" ry="5" fill={INK} />
          <ellipse cx="28" cy="160" rx="3.5" ry="5" fill={INK} />
          <ellipse cx="20" cy="172" rx="4" ry="3" fill={INK} />
        </>
      )}
      {items.includes("mini-dragon") && (
        <>
          <path d="M6,186 C-14,170 -16,150 -4,140 C-2,156 8,164 16,166 Z" fill="#ff8a1f" />
          <path d="M34,186 C54,170 56,150 44,140 C42,156 32,164 24,166 Z" fill="#ff8a1f" />
          <ellipse cx="20" cy="190" rx="18" ry="16" fill="#e63946" />
          <circle cx="20" cy="166" r="14" fill="#e63946" />
          <path d="M10,154 L6,140 L16,152 Z M30,154 L34,140 L24,152 Z" fill="#ffd23f" strokeWidth="2.5" />
          <circle cx="15" cy="164" r="3" fill={INK} />
          <circle cx="25" cy="164" r="3" fill={INK} />
          <path d="M36,198 C48,204 52,214 46,222" fill="none" strokeWidth="5" />
          <ellipse cx="20" cy="194" rx="9" ry="8" fill="#ffd9a0" strokeWidth="2.5" />
        </>
      )}
    </g>
  );
}
