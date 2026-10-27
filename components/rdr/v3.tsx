"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { offerExtras, offers, type Offer } from "@/lib/rdr/content";
import { nextEvent, formatEventDate, events } from "@/lib/rdr/events";
import { ApplyButton, InViewFlag } from "./ui";
import { monogram, type Mark } from "@/lib/rdr/logos";

/* ---------- nav ---------- */
export function Nav({ mark, apply }: { mark: ReactNode; apply: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  useMotionValueEvent(scrollYProgress, "change", (v) => ref.current?.style.setProperty("--p", String(v)));
  return (
    <nav className="nav" ref={ref} aria-label="Page">
      <div className="wrap">
        {mark}
        <div className="links">
          <a href="#platforms">Platforms</a>
          <a href="#numbers">The numbers</a>
          <a href="#results">Results</a>
          <a href="#talks">RDR Talks</a>
          <a href="#how">How it works</a>
          <a href="#letter">The letter</a>
        </div>
        <ApplyButton className="rbtn rbtn-blue" source="nav">
          {apply}
        </ApplyButton>
      </div>
      <span className="progress" aria-hidden="true" />
    </nav>
  );
}

/* ---------- platforms: letter-cut cards + an offer sheet ---------- */
export interface PlatformCard {
  key: string;
  name: string;
  tag: string;
  image: string;
  alt: string;
}

export function Platforms({ cards, rest, covers }: { cards: PlatformCard[]; rest: { key: string; name: string }[]; covers: Record<string, { src: string; alt: string }> }) {
  const [open, setOpen] = useState<Offer | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  const show = (key: string) => {
    opener.current = document.activeElement;
    setOpen(offers.find((o) => o.key === key) ?? null);
  };

  const ev = nextEvent(events);

  return (
    <>
      <ul className="platforms">
        {cards.map((c) => (
          <li key={c.key}>
            <button type="button" className="dcard" onClick={() => show(c.key)} aria-haspopup="dialog">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt={c.alt} loading="lazy" />
              <span className="label">
                <b>{c.name}</b>
                <span>{c.tag}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="more-platforms">
        {rest.map((r) => (
          <button key={r.key} type="button" onClick={() => show(r.key)}>
            {r.name}
          </button>
        ))}
      </div>

      {open && (
        <div className="sheet" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="panel" role="dialog" aria-modal="true" aria-labelledby="rdr-sheet-title" ref={panel}>
            <div className="cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={covers[open.key]?.src} alt={covers[open.key]?.alt ?? ""} />
              <button type="button" className="close" aria-label="Close" onClick={() => setOpen(null)}>
                ×
              </button>
            </div>
            <div className="stack">
              <p className="eyebrow">{open.number}</p>
              <h3 id="rdr-sheet-title" className="serif t-h3">
                {open.name}
              </h3>
              <p className="t-sub">{open.sub}</p>
            </div>
            <div className="stack" style={{ gap: 12 }}>
              {open.paras.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {open.key === "talks" && (
                <ul>
                  {offerExtras.talksUncover.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              {open.listIntro && <p>{open.listIntro}</p>}
              {open.list && (
                <ul>
                  {open.list.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              {open.afterList?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {open.key === "vlog" && offerExtras.vlogLet.map((p) => <p key={p}>{p}</p>)}
              {open.key === "n1m" && <p>{offerExtras.n1mOne.join(" ")}</p>}
              {open.key === "films" && (
                <>
                  <ul>
                    {offerExtras.filmsMakes.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <p>{offerExtras.filmsBecause}</p>
                </>
              )}
              {open.big && <p className="big">{open.big}</p>}
              {open.key === "studio" && <p>{offerExtras.studioGive}</p>}
              {open.key === "events" && (
                <p>
                  {ev ? `${formatEventDate(ev)} — ${ev.title}, ${ev.city}.` : "The next live event with Boss RDR has not been announced yet. Apply and the team will tell you the next date before it goes public."}
                </p>
              )}
            </div>
            {open.key === "events" && ev ? (
              <a className="rbtn rbtn-blue rbtn-block" href={ev.url} target="_blank" rel="noopener">
                {open.cta}
              </a>
            ) : (
              <ApplyButton offer={open.key} source={`sheet-${open.key}`} className="rbtn rbtn-blue rbtn-block">
                {open.cta}
              </ApplyButton>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- a scroll rail with arrows ---------- */
export function Rail({ children, label }: { children: ReactNode; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const go = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="rail">
      <div className="rowhead" style={{ marginBottom: 18 }}>
        <span className="t-soft">{label}</span>
        <div className="arrows">
          <button type="button" aria-label="Scroll back" onClick={() => go(-1)}>
            ←
          </button>
          <button type="button" aria-label="Scroll forward" onClick={() => go(1)}>
            →
          </button>
        </div>
      </div>
      <div className="track" ref={track}>
        {children}
      </div>
    </div>
  );
}

/* ---------- a press or client mark with a clean fallback ---------- */
export function MarkItem({ mark }: { mark: Mark }) {
  const [failed, setFailed] = useState(false);
  const mono = mark.kind === "mono" || failed;
  return (
    <li>
      {mono ? (
        <span className="mono" aria-hidden="true">
          {monogram(mark.name)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mark.src} alt="" className={mark.kind} loading="lazy" onError={() => setFailed(true)} />
      )}
      <span>{mark.name}</span>
    </li>
  );
}

/* ---------- platform share bar ---------- */
export function Share({ parts }: { parts: { label: string; value: number }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  return (
    <InViewFlag className="share" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
      <div className="bar">
        {parts.map((p, i) => (
          <i key={p.label} style={{ ["--w" as string]: `${(p.value / total) * 100}%`, ["--i" as string]: i }} />
        ))}
      </div>
      <ul className="key">
        {parts.map((p) => (
          <li key={p.label}>
            <i aria-hidden="true" />
            {p.label}
          </li>
        ))}
      </ul>
    </InViewFlag>
  );
}

/* ---------- opens the matching part of the letter when a "read" link is followed ---------- */
export function OpenOnHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) el.open = true;
      else el?.querySelectorAll("details").forEach((d) => (d.open = true));
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
