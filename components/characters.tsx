// Original anime-style mascots drawn as inline SVG, with comic ink outlines.
// Hero: the player (spiky hair, red scarf). Kit: a fox-spirit sidekick who gives briefings.

export type HeroMood = "ready" | "focus" | "hype";

const INK = "#0b0a14";

export function Hero({ mood = "ready", size = 160, className = "" }: { mood?: HeroMood; size?: number; className?: string }) {
  const hype = mood === "hype";
  return (
    <svg viewBox="0 0 200 240" width={size} height={size * 1.2} className={className} role="img" aria-label="Hero mascot">
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {/* scarf tail, waving */}
        <path className="scarf-wave" d="M120,150 C150,140 170,150 192,132 C182,156 170,168 140,166 Z" fill="#ff3b4f" />
        {/* legs */}
        <path d="M84,206 L80,232 L98,232 L98,206 Z" fill="#26265a" />
        <path d="M104,206 L104,232 L122,232 L118,206 Z" fill="#26265a" />
        <path d="M76,232 h24 M102,232 h24" strokeWidth="6" />
        {/* body */}
        <path d="M68,160 C68,148 80,142 100,142 C120,142 132,148 132,160 L128,210 L72,210 Z" fill="#2c2b6b" />
        <path d="M86,150 L114,150 L108,206 L92,206 Z" fill="#ffd23f" strokeWidth="3" />
        {/* emblem: lightning bolt */}
        <path d="M103,160 L92,178 L101,178 L96,194 L110,172 L101,172 Z" fill="#ff3b4f" strokeWidth="3" />
        {/* arms */}
        {hype ? (
          <>
            <path d="M128,158 C142,146 150,126 150,104" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M128,158 C142,146 150,126 150,104" fill="none" strokeWidth="8" stroke="#2c2b6b" />
            <circle cx="151" cy="98" r="11" fill="#ffd9b8" />
            <path d="M72,160 C58,170 54,184 58,196" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M72,160 C58,170 54,184 58,196" fill="none" strokeWidth="8" stroke="#2c2b6b" />
            <circle cx="58" cy="199" r="9" fill="#ffd9b8" />
          </>
        ) : (
          <>
            <path d="M72,160 C60,172 58,186 62,198" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M72,160 C60,172 58,186 62,198" fill="none" strokeWidth="8" stroke="#2c2b6b" />
            <circle cx="62" cy="201" r="9" fill="#ffd9b8" />
            <path d="M128,160 C140,172 142,186 138,198" fill="none" strokeWidth="14" stroke={INK} />
            <path d="M128,160 C140,172 142,186 138,198" fill="none" strokeWidth="8" stroke="#2c2b6b" />
            <circle cx="138" cy="201" r="9" fill="#ffd9b8" />
          </>
        )}
        {/* scarf wrap */}
        <path d="M70,140 C84,152 116,152 130,140 L132,154 C116,164 84,164 68,154 Z" fill="#ff3b4f" />
        {/* face */}
        <ellipse cx="100" cy="96" rx="48" ry="47" fill="#ffd9b8" />
        {/* ears */}
        <ellipse cx="52" cy="102" rx="7" ry="10" fill="#ffd9b8" />
        <ellipse cx="148" cy="102" rx="7" ry="10" fill="#ffd9b8" />
      </g>
      {/* blush */}
      <ellipse cx="72" cy="118" rx="9" ry="5" fill="#ff8fa3" opacity="0.7" />
      <ellipse cx="128" cy="118" rx="9" ry="5" fill="#ff8fa3" opacity="0.7" />
      {/* eyes */}
      {hype ? (
        <g stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M70,104 Q82,90 94,104" />
          <path d="M106,104 Q118,90 130,104" />
        </g>
      ) : (
        <g stroke={INK} strokeWidth="3">
          <ellipse cx="82" cy="104" rx="11" ry="15" fill="#fff" />
          <ellipse cx="118" cy="104" rx="11" ry="15" fill="#fff" />
          <ellipse cx="83" cy="106" rx="8" ry="12" fill="#ffae00" stroke="none" />
          <ellipse cx="117" cy="106" rx="8" ry="12" fill="#ffae00" stroke="none" />
          <ellipse cx="83" cy="108" rx="4.5" ry="7" fill={INK} stroke="none" />
          <ellipse cx="117" cy="108" rx="4.5" ry="7" fill={INK} stroke="none" />
          <circle cx="86" cy="100" r="3.5" fill="#fff" stroke="none" />
          <circle cx="120" cy="100" r="3.5" fill="#fff" stroke="none" />
          <circle cx="80" cy="112" r="1.8" fill="#fff" stroke="none" />
          <circle cx="114" cy="112" r="1.8" fill="#fff" stroke="none" />
          {mood === "focus" && (
            <>
              <path d="M66,86 L96,94" strokeWidth="5" strokeLinecap="round" />
              <path d="M134,86 L104,94" strokeWidth="5" strokeLinecap="round" />
            </>
          )}
        </g>
      )}
      {/* mouth */}
      <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {hype ? (
          <path d="M86,122 Q100,124 114,122 Q110,140 100,140 Q90,140 86,122 Z" fill="#c2253a" />
        ) : mood === "focus" ? (
          <path d="M92,128 L108,126" fill="none" />
        ) : (
          <path d="M90,124 Q100,132 110,124" fill="none" />
        )}
      </g>
      {/* hair */}
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
        <path
          d="M46,96 C40,62 58,36 82,32 L70,10 L96,26 L102,2 L114,28 L138,10 L130,36 C152,44 162,68 154,98 L144,80 L140,100 L128,72 L120,92 L110,66 L98,88 L88,64 L78,90 L70,72 L60,100 Z"
          fill="#2a2f7a"
        />
        <path d="M84,40 L96,30 L100,44 Z M114,36 L126,30 L120,46 Z" fill="#4fd2ff" stroke="none" />
      </g>
    </svg>
  );
}

export function Kit({ size = 110, className = "", talking = false }: { size?: number; className?: string; talking?: boolean }) {
  return (
    <svg viewBox="0 0 160 150" width={size} height={size * 0.94} className={className} role="img" aria-label="Kit the fox sidekick">
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {/* tail */}
        <path className="tail-swish" d="M110,120 C150,118 158,80 140,62 C150,90 128,104 104,104 Z" fill="#ff8a1f" />
        <path d="M140,62 C152,74 150,90 144,98 C146,84 142,72 140,62 Z" fill="#fff4e0" strokeWidth="3" />
        {/* body */}
        <ellipse cx="80" cy="118" rx="34" ry="24" fill="#ff8a1f" />
        <ellipse cx="80" cy="124" rx="18" ry="14" fill="#fff4e0" strokeWidth="3" />
        {/* ears */}
        <path d="M36,58 L30,10 L68,40 Z" fill="#ff8a1f" />
        <path d="M124,58 L130,10 L92,40 Z" fill="#ff8a1f" />
        <path d="M40,46 L37,24 L56,40 Z M120,46 L123,24 L104,40 Z" fill="#3a1d0b" strokeWidth="2" />
        {/* head */}
        <path d="M24,66 C24,40 50,30 80,30 C110,30 136,40 136,66 C136,92 112,108 80,108 C48,108 24,92 24,66 Z" fill="#ff8a1f" />
        <path d="M40,78 C52,74 66,82 80,98 C94,82 108,74 120,78 C116,98 100,106 80,106 C60,106 44,98 40,78 Z" fill="#fff4e0" strokeWidth="3" />
        {/* forehead mark */}
        <path d="M80,40 L74,54 L80,50 L86,54 Z" fill="#4fd2ff" strokeWidth="2.5" />
      </g>
      {/* eyes */}
      <g stroke={INK} strokeWidth="3">
        <ellipse cx="60" cy="68" rx="9" ry="11" fill={INK} />
        <ellipse cx="100" cy="68" rx="9" ry="11" fill={INK} />
        <circle cx="63" cy="64" r="3.5" fill="#fff" stroke="none" />
        <circle cx="103" cy="64" r="3.5" fill="#fff" stroke="none" />
        <circle cx="57" cy="73" r="1.6" fill="#fff" stroke="none" />
        <circle cx="97" cy="73" r="1.6" fill="#fff" stroke="none" />
      </g>
      <ellipse cx="44" cy="82" rx="7" ry="4" fill="#ff6f91" opacity="0.75" />
      <ellipse cx="116" cy="82" rx="7" ry="4" fill="#ff6f91" opacity="0.75" />
      {/* nose + mouth */}
      <g stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="80" cy="84" rx="5" ry="3.5" fill={INK} />
        {talking ? <path d="M72,92 Q80,104 88,92 Z" fill="#c2253a" /> : <path d="M72,92 Q76,97 80,92 Q84,97 88,92" fill="none" />}
      </g>
    </svg>
  );
}

/** Spiky comic "sound effect" burst with text, e.g. KA-CHING! */
export function SfxBurst({ text, className = "", color = "#ffd23f", ink = "#ff3b4f" }: { text: string; className?: string; color?: string; ink?: string }) {
  const pts: string[] = [];
  const n = 18;
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? 96 : 66 + ((i * 7) % 11);
    const a = (Math.PI * i) / n;
    pts.push(`${(120 + Math.cos(a) * r * 1.15).toFixed(1)},${(100 + Math.sin(a) * r * 0.8).toFixed(1)}`);
  }
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden>
      <polygon points={pts.join(" ")} fill={color} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <text
        x="120"
        y="114"
        textAnchor="middle"
        fontFamily="Bangers, Impact, sans-serif"
        fontSize={text.length > 9 ? 34 : 44}
        fill={ink}
        stroke={INK}
        strokeWidth="2.5"
        paintOrder="stroke"
        transform="rotate(-8 120 100)"
        letterSpacing="2"
      >
        {text}
      </text>
    </svg>
  );
}
