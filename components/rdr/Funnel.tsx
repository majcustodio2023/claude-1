"use client";

// The page's signature scene: a pinned screen where CONTENT → VIEWS is struck out and
// STORY → ATTENTION → AUTHORITY → TRUST → BUSINESS OPPORTUNITY → REVENUE lights up word by word
// under the reader's scroll.
import { useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

export function Funnel({ old, words, isnt, its, game }: { old: string[]; words: string[]; isnt: string; its: string; game: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  const total = words.length + 2; // strike, words..., closing line
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const s = Math.min(total, Math.floor(v * (total + 0.5)));
    if (s !== step) setStep(s);
  });
  const segs = words.length;
  return (
    <div ref={ref} className="rdr-funnel">
      <div className="stage wrap">
        <div className="copy">
        <p className="t-statement">{isnt}</p>
        <p className="old" style={{ ["--strike" as string]: step >= 1 ? 1 : 0 }}>
          <span className="w">{old[0]}</span>
          <span className="arrow" aria-hidden="true" />
          <span className="w">{old[1]}</span>
        </p>
        <p className="t-statement">{its}</p>
        <ol className="new" aria-label={words.join(", ")}>
          {words.map((w, i) => (
            <li key={w} className="w" data-on={step >= i + 2 ? "true" : "false"}>
              {w}
            </li>
          ))}
        </ol>
        <p className="game" data-on={step >= total ? "true" : "false"}>
          {game}
        </p>
        </div>
        <div className="shape" data-flow={step >= 2 ? "true" : "false"} aria-hidden="true">
          <svg viewBox="0 0 320 420">
            {Array.from({ length: segs }, (_, i) => {
              const t0 = i / segs;
              const t1 = (i + 1) / segs;
              const w0 = 300 - 220 * t0;
              const w1 = 300 - 220 * t1;
              const y0 = 20 + 360 * t0;
              const y1 = 20 + 360 * t1 - 6;
              const x0 = (320 - w0) / 2;
              const x1 = (320 - w1) / 2;
              return <path key={i} className={`seg ${i === segs - 1 ? "last" : ""}`} data-on={step >= i + 2 ? "true" : "false"} d={`M ${x0} ${y0} H ${x0 + w0} L ${x1 + w1} ${y1} H ${x1} Z`} />;
            })}
            {Array.from({ length: 5 }, (_, i) => (
              <circle key={i} className="drop" cx={110 + i * 25} cy={0} r={4} style={{ ["--i" as string]: i }} />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
