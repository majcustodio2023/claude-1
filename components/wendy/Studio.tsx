"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PROTOTYPE_DEADLINE_MIN, buildPercent, modelLabel, type PrototypeJob } from "@/lib/prototype";
import { WIcon } from "./WendyIcons";

// Wendy's studio: the site visibly taking shape while the builder works. Everything it shows is
// driven by the real job (stage, pages saved, plan, progress lines); the motion is decoration.

export const STEPS = [
  { label: "Reading their socials", sub: "Bio, posts, photos and logo" },
  { label: "Calling the builder", sub: "Handing Wendy the brief" },
  { label: "Studying the brand", sub: "Who they are, what they sell, the site map" },
  { label: "Designing the look", sub: "Colours, fonts and layout" },
  { label: "Building the pages", sub: "Each page goes live as it's saved" },
  { label: "Ready to show", sub: "Checkout, booking and final polish" },
] as const;

/** Which step the job is on (STEPS.length when it's finished). */
export function stepOf(j: Pick<PrototypeJob, "status" | "planned" | "styles" | "pages">): number {
  if (j.status === "ready") return STEPS.length;
  if (j.status === "preparing") return 0;
  if (j.status === "queued") return 1;
  if (j.status === "failed") return -1;
  if (!j.planned && !j.styles) return 2;
  if (!j.styles) return 3;
  return 4;
}

/** What that step is doing, said a few ways so the caption isn't static while a step runs. */
const HINTS: string[][] = [
  ["Opening their Instagram and Facebook", "Saving their photos and logo", "Reading their bio and captions"],
  ["Sending the brief to the builder", "Picking up the job"],
  ["Working out what they sell and who buys", "Choosing the pages a customer expects", "Checking prices and the brand voice"],
  ["Pulling colours from their pictures", "Pairing a display font with a text font", "Sketching the hero and the sections"],
  ["Writing the copy in their voice", "Laying out sections and pictures", "Wiring the cart, checkout and booking"],
  ["Every page saved", "Ready for the client"],
];

/** Tool bubbles around the window; each lights up during its step. */
const FLOATERS = [
  { icon: "camera", step: 0, pos: { top: -16, left: -16 } },
  { icon: "sparkle", step: 2, pos: { top: -16, right: -16 } },
  { icon: "palette", step: 3, pos: { top: "44%", left: -20 } },
  { icon: "type", step: 3, pos: { top: "38%", right: -20 } },
  { icon: "cart", step: 4, pos: { bottom: -16, right: 40 } },
] as const;

/** A few lines of the kind of code the builder writes at this step, typed out one character at a time. */
function CodeTicker({ step, title, swatches, page }: { step: number; title: string; swatches: string[]; page: string }) {
  const lines = useMemo(() => {
    const t = title.replace(/[<>"]/g, "");
    const p = page.replace(/[<>"]/g, "");
    if (step <= 1) return ["// reading their socials", `fetch("instagram.com/…")  → bio, posts, logo`, "save(photos)  → img/post-1.jpg …"];
    if (step === 2) return ["// planning the site", `brand = "${t}"`, `pages = ["Home", "Services", "Book", "About", "Contact"]`];
    if (step === 3) return [":root {", `  --proto-accent: ${swatches[0]};`, `  --proto-bg: ${swatches[3] ?? "#fff"};`, '  --font-display: "Playfair Display";', "}"];
    return [`<!-- ${p} -->`, '<section class="hero" data-reveal>', `  <h1>${t}</h1>`, '  <button data-book-open>Book now</button>', "</section>"];
  }, [step, title, swatches, page]);
  const full = lines.join("\n");
  const [n, setN] = useState(0);
  useEffect(() => setN(0), [full]);
  useEffect(() => {
    const t = setTimeout(() => setN((x) => (x >= full.length + 40 ? 0 : x + 1)), n >= full.length ? 60 : 32);
    return () => clearTimeout(t);
  }, [n, full]);
  const shown = full.slice(0, n);
  return (
    <pre className="wd-code mt-3 whitespace-pre-wrap break-words" aria-hidden="true">
      {shown.split("\n").map((l, i, a) => (
        <span key={i} className="block">
          <span className={l.trim().startsWith("//") || l.trim().startsWith("<!--") ? "c" : /^\s*--|^:root|^\s*</.test(l) ? "k" : "v"}>{l}</span>
          {i === a.length - 1 && <span className="wd-type ml-0.5" />}
        </span>
      ))}
    </pre>
  );
}

const DEFAULT_SWATCHES = ["#5e2b97", "#d9579a", "#f8cfe0", "#ece2fb", "#3a1e55"];

function clock(min: number) {
  const s = Math.max(0, Math.round(min * 60));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** The blocks of the mock page, top to bottom (grid columns of 6). */
const BLOCKS = [
  { span: 6, h: 92, kind: "hero" },
  { span: 3, h: 54, kind: "text" },
  { span: 3, h: 54, kind: "pic" },
  { span: 2, h: 64, kind: "card" },
  { span: 2, h: 64, kind: "card" },
  { span: 2, h: 64, kind: "card" },
  { span: 4, h: 46, kind: "buy" },
  { span: 2, h: 46, kind: "pic" },
  { span: 6, h: 34, kind: "foot" },
] as const;

export function Studio({ job, compact = false, name }: { job: PrototypeJob; compact?: boolean; name?: string }) {
  const [now, setNow] = useState(() => Date.now());
  const running = ["preparing", "queued", "building"].includes(job.status);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const step = stepOf(job);
  const pct = buildPercent(job);
  const end = job.finishedAt ? new Date(job.finishedAt).getTime() : now;
  const took = (end - new Date(job.createdAt).getTime()) / 60000;

  // How much of the mock page is "built": tracks the real percentage.
  const doneBlocks = job.status === "ready" ? BLOCKS.length : Math.min(BLOCKS.length - 1, Math.floor((pct / 100) * BLOCKS.length));
  const working = job.status === "ready" ? -1 : doneBlocks;

  const swatches = useMemo(() => {
    const theme = job.scraped?.sources.map((s) => s.themeColor).filter((c): c is string => Boolean(c && /^#[0-9a-f]{3,8}$/i.test(c))) ?? [];
    return Array.from(new Set([...theme, ...DEFAULT_SWATCHES])).slice(0, 5);
  }, [job.scraped]);
  const showColour = step >= 3;

  // The caption under the step rotates through what that step does.
  const [hint, setHint] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setHint((h) => h + 1), 3200);
    return () => clearInterval(t);
  }, [running]);
  const hints = HINTS[Math.max(0, Math.min(step, HINTS.length - 1))];
  const caption = job.status === "failed" ? "The build stopped" : hints[hint % hints.length];

  // Type the business name into the hero.
  const title = (name || job.businessName || "Your client's new site").slice(0, 34);
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (step < 3) return setTyped(0);
    if (typed >= title.length) return;
    const t = setTimeout(() => setTyped((n) => n + 1), 70);
    return () => clearTimeout(t);
  }, [step, typed, title.length]);

  // The wand hops onto the block being worked on.
  const canvas = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [wand, setWand] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const place = () => {
      const target = blockRefs.current[working >= 0 ? working : BLOCKS.length - 1];
      if (!target || !canvas.current) return;
      const c = canvas.current.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      const jitter = (now / 1000) % 3; // drifts across the block while it works
      setWand({ x: r.left - c.left + r.width * (0.3 + 0.2 * jitter), y: r.top - c.top + r.height * 0.35 });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [working, now]);

  const planned = Math.max(job.planned ?? 0, job.pages.length);
  const ghostTabs = Math.max(0, (planned || (step >= 2 ? 5 : 3)) - job.pages.length);

  // A little confetti when it finishes while being watched.
  const [burst, setBurst] = useState(false);
  const wasRunning = useRef(running);
  useEffect(() => {
    if (wasRunning.current && job.status === "ready") setBurst(true);
    wasRunning.current = running;
  }, [job.status, running]);

  const sparks = useMemo(
    () =>
      Array.from({ length: compact ? 7 : 16 }, (_, i) => ({
        left: `${(i * 61) % 100}%`,
        size: 8 + ((i * 7) % 14),
        dur: 5 + ((i * 13) % 7),
        delay: -((i * 11) % 9),
        purple: i % 3 === 0,
      })),
    [compact],
  );

  return (
    <div className={`wd-studio ${compact ? "p-4" : "p-5 sm:p-7"}`}>
      <span className="wd-blob b1" />
      <span className="wd-blob b2" />
      <span className="wd-blob b3" />
      {running &&
        sparks.map((s, i) => (
          <span key={i} className={`wd-spark ${s.purple ? "p" : ""}`} style={{ left: s.left, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}>
            <WIcon name="sparkle" size={s.size} fill />
          </span>
        ))}
      {burst &&
        Array.from({ length: 36 }, (_, i) => (
          <span
            key={i}
            className="wd-confetti"
            style={{ left: `${(i * 37) % 100}%`, background: ["#5e2b97", "#d9579a", "#f8cfe0", "#7a45b8", "#ffd166"][i % 5], animationDelay: `${(i % 9) * 0.07}s` }}
          />
        ))}

      <div className={`relative grid gap-6 ${compact ? "md:grid-cols-[1.25fr_1fr]" : "lg:grid-cols-[1.35fr_1fr]"} items-start`}>
        {/* The site taking shape */}
        <div className="relative">
          <div className="relative">
          {!compact &&
            running &&
            FLOATERS.map((f, i) => (
              <span key={f.icon} className={`wd-floater max-sm:hidden ${f.step === Math.min(step, 4) ? "on" : ""}`} style={{ ...f.pos, animationDelay: `${-i * 0.7}s` }} aria-hidden="true">
                <WIcon name={f.icon} size={20} />
              </span>
            ))}
          <div className="wd-window">
            <div className="wd-window-bar">
              <span className="wd-dot" style={{ background: "#f6a5c4" }} />
              <span className="wd-dot" style={{ background: "#d9b8f0" }} />
              <span className="wd-dot" style={{ background: "#f8d9e6" }} />
              <span className="wd-url">{job.id === "pending" ? "Making their private link…" : `/p/${job.slug}/`}</span>
            </div>
            <div className="wd-tabs">
              {job.pages.map((p) => (
                <span key={p.path} className="wd-tab done">
                  {p.title || p.path}
                </span>
              ))}
              {running &&
                Array.from({ length: ghostTabs }, (_, i) => (
                  <span key={`g${i}`} className="wd-tab ghost">
                    Page {job.pages.length + i + 1}
                  </span>
                ))}
            </div>
            <div ref={canvas} className="wd-canvas relative" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
              {BLOCKS.map((b, i) => {
                const state = i < doneBlocks ? "done" : i === working ? "work" : "wait";
                const c1 = swatches[i % swatches.length];
                const c2 = swatches[(i + 1) % swatches.length];
                const fill =
                  state === "done"
                    ? b.kind === "hero"
                      ? `linear-gradient(120deg, ${swatches[0]}, ${swatches[1]})`
                      : b.kind === "pic"
                        ? `radial-gradient(circle at 30% 30%, ${c2}, ${c1})`
                        : b.kind === "foot"
                          ? swatches[4] ?? "#3a1e55"
                          : `linear-gradient(180deg, #fff, ${c2}55)`
                    : undefined;
                return (
                  <div
                    key={i}
                    ref={(el) => {
                      blockRefs.current[i] = el;
                    }}
                    className={`wd-block ${state}`}
                    style={{ gridColumn: `span ${b.span}`, height: compact ? b.h * 0.75 : b.h, background: fill, border: state === "done" && b.kind !== "hero" && b.kind !== "pic" && b.kind !== "foot" ? "1px solid #f1dfea" : undefined }}
                  >
                    {b.kind === "hero" && (
                      <div className="absolute inset-0 p-3 flex flex-col justify-center gap-1.5">
                        <span className={`wd-display text-lg sm:text-xl leading-tight ${state === "done" ? "text-white" : "text-[#b9a2c9]"}`}>
                          {step >= 3 ? <span className="wd-type inline-block max-w-full">{title.slice(0, typed) || " "}</span> : <span className="wd-line inline-block w-2/3 h-3" />}
                        </span>
                        <span className="wd-line w-1/2" />
                        {state === "done" && <span className="mt-1 inline-block w-20 h-5 rounded-full bg-white/90" />}
                      </div>
                    )}
                    {state === "done" && b.kind === "card" && (
                      <div className="absolute inset-0 p-2 flex flex-col gap-1.5">
                        <span className="flex-1 rounded-lg" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
                        <span className="h-1.5 rounded-full w-3/4" style={{ background: `${c1}66` }} />
                      </div>
                    )}
                    {state === "done" && b.kind === "text" && (
                      <div className="absolute inset-0 p-2.5 flex flex-col gap-1.5 justify-center">
                        <span className="h-2 rounded-full w-4/5" style={{ background: `${swatches[0]}aa` }} />
                        <span className="h-1.5 rounded-full w-full bg-[#ead9e6]" />
                        <span className="h-1.5 rounded-full w-2/3 bg-[#ead9e6]" />
                      </div>
                    )}
                    {state === "done" && b.kind === "buy" && (
                      <div className="absolute inset-0 px-3 flex items-center gap-2 text-[#5e2b97]">
                        <WIcon name="cart" size={18} />
                        <WIcon name="calendar" size={18} />
                        <span className="ml-auto rounded-full px-3 py-1 text-xs font-extrabold text-white" style={{ background: swatches[0] }}>
                          Checkout
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              {running && wand && (
                <span className="wd-wand" style={{ left: wand.x, top: wand.y - 6 }}>
                  <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
                    <path d="M8 30 24 14" stroke="#5e2b97" strokeWidth="3.4" strokeLinecap="round" />
                    <path d="M8 30 12 26" stroke="#f8cfe0" strokeWidth="3.4" strokeLinecap="round" />
                    <g className="tip" transform="translate(23 4)">
                      <path d="M4 0c.4 2.6 1.4 3.6 4 4-2.6.4-3.6 1.4-4 4-.4-2.6-1.4-3.6-4-4 2.6-.4 3.6-1.4 4-4Z" fill="#d9579a" />
                    </g>
                  </svg>
                </span>
              )}
            </div>
          </div>
          </div>
          {showColour && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-sm font-bold wd-muted mr-1">Palette</span>
              {swatches.map((c, i) => (
                <span key={c} className="wd-swatch" style={{ background: c, animationDelay: `${i * 0.12}s` }} />
              ))}
              <span className="ml-auto wd-script text-lg text-[#5e2b97]">Aa</span>
            </div>
          )}
          {!compact && running && <CodeTicker step={step} title={title} swatches={swatches} page={job.pages.at(-1)?.title ?? "Home"} />}
        </div>

        {/* The steps, the real numbers and the builder's own notes */}
        <div className="relative space-y-4">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className={`wd-display ${compact ? "text-4xl" : "text-5xl"} text-[#5e2b97] tabular-nums`}>{pct}%</span>
              <span className={`text-lg font-bold tabular-nums ${took > PROTOTYPE_DEADLINE_MIN && running ? "text-[#c43c6c]" : "wd-muted"}`}>
                {job.status === "ready" ? `Built in ${clock(took)}` : `${clock(took)} of ${PROTOTYPE_DEADLINE_MIN}:00`}
              </span>
            </div>
            <div className="wd-ribbon mt-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Build progress">
              <i style={{ width: `${Math.max(pct, 3)}%` }} />
            </div>
            <p key={caption} className="wd-log mt-2 text-lg font-bold text-[#3a1e55]">
              <span className="inline-block" style={{ animation: "wd-slide 0.5s ease both" }}>
                {caption}
                {running ? "…" : ""}
              </span>
            </p>
          </div>

          <ol className={compact ? "grid grid-cols-2 gap-x-3 gap-y-2" : "space-y-2.5"}>
            {STEPS.map((s, i) => {
              const st = step === -1 ? "wait" : i < step ? "done" : i === step ? "now" : "wait";
              const extra = i === 4 && planned ? ` (${job.pages.length} of ${planned})` : i === 4 && job.pages.length ? ` (${job.pages.length})` : "";
              return (
                <li key={s.label} className={`wd-step ${st}`}>
                  <span className="bead">{st === "done" ? <WIcon name="check" size={16} /> : <span className="text-sm font-extrabold">{i + 1}</span>}</span>
                  <span className="leading-tight">
                    <span className={compact ? "text-base" : ""}>
                      {s.label}
                      {extra}
                    </span>
                    {!compact && <span className="block text-sm font-semibold wd-muted">{s.sub}</span>}
                  </span>
                </li>
              );
            })}
          </ol>

          {job.progress.length > 0 && (
            <ol className="wd-log space-y-1 border-l-2 border-[#ead4f3] pl-3" aria-live="polite">
              {job.progress.slice(compact ? -3 : -5).map((p, i, arr) => (
                <li key={`${p.at}-${i}`} className={`text-base ${i === arr.length - 1 ? "font-bold text-[#3a1e55]" : "font-semibold wd-muted"}`}>
                  <span className="tabular-nums mr-2 text-sm">{new Date(p.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                  {p.text}
                </li>
              ))}
            </ol>
          )}
          {!compact && <p className="text-sm font-semibold wd-muted">Built by {modelLabel(job.model)}. Pages open as soon as they are saved.</p>}
        </div>
      </div>
    </div>
  );
}
