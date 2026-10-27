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
  return (
    <div ref={ref} className="rdr-funnel">
      <div className="stage wrap">
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
    </div>
  );
}
