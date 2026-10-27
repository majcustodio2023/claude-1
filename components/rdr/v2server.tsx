import type { ReactNode } from "react";
import { InViewFlag } from "./ui";
import { LiteYouTube } from "./LiteYouTube";
import { yt } from "@/lib/rdr/media";

/** Boss RDR's full words, folded. Nothing from the letter is cut; it is one tap away. */
export function Letter({ title = "Read Boss RDR's full words", lines, big, children }: { title?: string; lines?: string[]; big?: string; children?: ReactNode }) {
  return (
    <details className="rdr-letter">
      <summary>
        <i aria-hidden="true" />
        {title}
        <span>Tap to open</span>
      </summary>
      <div className="body">
        {big && <p className="big">{big}</p>}
        {lines?.map((l) => (
          <p key={l}>{l}</p>
        ))}
        {children}
      </div>
    </details>
  );
}

/** Real RDR video stills, tiled behind the hero. */
export function HeroWall({ ids }: { ids: string[] }) {
  const list = [...ids, ...ids, ...ids].slice(0, 30);
  return (
    <div className="wall" aria-hidden="true">
      {list.map((id, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={`${id}-${i}`} src={yt(id, "mq")} alt="" loading={i < 12 ? "eager" : "lazy"} />
      ))}
    </div>
  );
}

export function VideoWall({ items }: { items: { id: string; title: string }[] }) {
  return (
    <div className="rdr-vwall">
      {items.map((v) => (
        <LiteYouTube key={v.id} id={v.id} title={v.title} />
      ))}
    </div>
  );
}

/** Two phones: the content calendar nobody remembers, and the inbox that pays. */
export function Phones({ quotes }: { quotes: string[] }) {
  return (
    <div className="rdr-phones">
      <div>
        <InViewFlag className="rdr-ph cal" role="img" aria-label="A 30-day content calendar, every post crossed out">
          <div className="bar2">
            <span>Content calendar</span>
            <em>30 days</em>
          </div>
          <div className="grid">
            {Array.from({ length: 30 }, (_, i) => (
              <i key={i} style={{ ["--i" as string]: i }} />
            ))}
          </div>
          <p className="foot">0 serious inquiries</p>
        </InViewFlag>
        <p className="rdr-ph-cap dim">Posts nobody remembers</p>
      </div>
      <div>
        <InViewFlag className="rdr-ph inbox" role="img" aria-label={`An inbox of buying inquiries: ${quotes.join(" ")}`}>
          <div className="bar2">
            <span>Inquiries</span>
            <em>Today</em>
          </div>
          <span className="badge">{quotes.length}</span>
          <div className="msgs">
            {quotes.map((q, i) => (
              <div key={q} className="msg" style={{ ["--i" as string]: i }}>
                <i aria-hidden="true" />
                <div>
                  <b>{q}</b>
                  <span>Just now</span>
                </div>
              </div>
            ))}
          </div>
        </InViewFlag>
        <p className="rdr-ph-cap">People with money and intent</p>
      </div>
    </div>
  );
}

/** From almost nobody watching to 1.4 billion: the curve draws itself. */
export function GrowthCurve({ beats }: { beats: { label: string; hot?: boolean }[] }) {
  // A rising curve across a 600x300 box; beats sit along it.
  const pts = [
    [20, 262],
    [120, 250],
    [200, 236],
    [290, 214],
    [370, 168],
    [450, 96],
    [580, 26],
  ];
  const d = `M ${pts[0][0]} ${pts[0][1]} C 70 262, 90 252, 120 250 S 180 240, 200 236 S 270 222, 290 214 S 350 190, 370 168 S 430 120, 450 96 S 540 40, 580 26`;
  const area = `${d} L 580 300 L 20 300 Z`;
  return (
    <InViewFlag className="rdr-curve" role="img" aria-label={beats.map((b) => b.label).join(". ")}>
      <svg viewBox="0 0 600 300" style={{ pathLength: 1 } as React.CSSProperties}>
        <defs>
          <linearGradient id="rdr-curve-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(243,194,79,0.35)" />
            <stop offset="1" stopColor="rgba(243,194,79,0)" />
          </linearGradient>
        </defs>
        <path className="area" d={area} />
        <path className="line" d={d} pathLength={1} />
        {beats.map((b, i) => {
          const [x, y] = pts[Math.min(i, pts.length - 1)];
          const steep = i >= 4;
          const above = i % 2 === 0;
          const lx = steep ? x - 16 : Math.min(Math.max(x, 60), 540);
          const ly = steep ? y + 5 : above ? y - 18 : y + 28;
          return (
            <g key={b.label} style={{ ["--i" as string]: i }}>
              <circle className={`dot ${b.hot ? "hot" : ""}`} cx={x} cy={y} r={b.hot ? 8 : 6} style={{ ["--i" as string]: i }} />
              <text className={`lbl ${b.hot ? "" : "soft"}`} x={lx} y={ly} textAnchor={steep ? "end" : "middle"} style={{ ["--i" as string]: i }}>
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="cap">
        <span>2021: a borrowed-money studio</span>
        <span>Today: more than a billion combined views</span>
      </div>
    </InViewFlag>
  );
}

/** Your next prospect, already surrounded by what they have seen. */
export function Radial({ core, items }: { core: string; items: string[] }) {
  const n = items.length;
  return (
    <InViewFlag className="rdr-radial" role="img" aria-label={`${core}: ${items.join(", ")}`}>
      <div className="ring" aria-hidden="true" />
      {items.map((t, i) => {
        const a = `${(360 / n) * i - 90}deg`;
        return (
          <span key={t} className="spoke" style={{ ["--a" as string]: a, ["--r" as string]: "40%", ["--i" as string]: i }} aria-hidden="true" />
        );
      })}
      {items.map((t, i) => {
        const rad = ((360 / n) * i - 90) * (Math.PI / 180);
        const left = `${(50 + 40 * Math.cos(rad)).toFixed(2)}%`;
        const top = `${(50 + 40 * Math.sin(rad)).toFixed(2)}%`;
        return (
          <div key={t} className="node" style={{ left, top, ["--i" as string]: i }}>
            <i aria-hidden="true" />
            {t}
          </div>
        );
      })}
      <div className="core">{core}</div>
    </InViewFlag>
  );
}

const Ic = {
  search: (
    <svg className="ic" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  star: (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    </svg>
  ),
  tv: (
    <svg className="ic" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  chart: (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  shield: (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  user: (
    <svg className="ic" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  x: (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  mic: (
    <svg className="ic" viewBox="0 0 24 24">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  ),
  camera: (
    <svg className="ic" viewBox="0 0 24 24">
      <rect x="3" y="7" width="13" height="11" rx="2" />
      <path d="m16 11 5-3v9l-5-3" />
    </svg>
  ),
  bolt: (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>
  ),
  film: (
    <svg className="ic" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </svg>
  ),
  heart: (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="M12 21s-7-4.6-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.4-9 9-9 9z" />
    </svg>
  ),
  people: (
    <svg className="ic" viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M15 15.5c3 0 6 1.5 6 4.5" />
    </svg>
  ),
  studio: (
    <svg className="ic" viewBox="0 0 24 24">
      <circle cx="12" cy="10" r="5" />
      <path d="M12 15v6M8 21h8M4 4l3 3M20 4l-3 3" />
    </svg>
  ),
  stage: (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="M3 20h18M5 20v-6h14v6M8 14V9a4 4 0 0 1 8 0v5" />
    </svg>
  ),
  calendar: (
    <svg className="ic" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
};
export const icons = Ic;

/** The leader vs everybody else, as the two results a prospect might find. */
export function Serp({ leader, other, query }: { leader: { title: string; items: string[]; verdict: string }; other: { title: string; poster: string; items: string[]; verdict: string }; query: string }) {
  const li = [Ic.user, Ic.tv, Ic.chart, Ic.shield, Ic.star];
  return (
    <div className="rdr-serp">
      <div className="card dim">
        <div className="search">
          <i aria-hidden="true" />
          {query}
        </div>
        <h4>{other.title}</h4>
        <div className="poster">{other.poster}</div>
        <ul className="res">
          {other.items.map((t) => (
            <li key={t}>
              <i>{Ic.x}</i>
              {t}
            </li>
          ))}
        </ul>
        <p className="verdict">{other.verdict}</p>
      </div>
      <div className="card lit">
        <div className="search">
          <i aria-hidden="true" />
          {query}
        </div>
        <h4>{leader.title}</h4>
        <ul className="res">
          {leader.items.map((t, i) => (
            <li key={t}>
              <i>{li[i % li.length]}</i>
              {t}
            </li>
          ))}
        </ul>
        <p className="verdict">{leader.verdict}</p>
      </div>
    </div>
  );
}

export function Stepper({ steps }: { steps: { title: string; lines?: string[]; list?: string[]; asks?: string[]; close?: string[]; bold?: string }[] }) {
  return (
    <ol className="rdr-stepper">
      {steps.map((s, i) => (
        <li key={s.title} className="step">
          <span className="n" aria-hidden="true">
            {i + 1}
          </span>
          <h3 className="t-display t-h3">{s.title.replace(/^STEP \d+ — /, "")}</h3>
          {s.lines?.map((l) => (
            <p key={l}>{l}</p>
          ))}
          {s.list && (
            <ul className="rdr-list">
              {s.list.slice(0, 5).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          {s.list && s.list.length > 5 && <p>{s.list.slice(5).join(" ")}</p>}
          {s.asks && (
            <ul className="rdr-chips">
              {s.asks.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          {s.close?.map((l) => (
            <p key={l}>{l}</p>
          ))}
          {s.bold && <p style={{ fontWeight: 760, color: "var(--gold)" }}>{s.bold}</p>}
        </li>
      ))}
    </ol>
  );
}

/** One piece of content and everything it can set off. */
export function Tree({ seed, chain }: { seed: string; chain: string[] }) {
  const rows = [chain.slice(0, 3), chain.slice(3, 6), chain.slice(6, 8), chain.slice(8)];
  let i = 0;
  return (
    <InViewFlag className="rdr-tree" role="img" aria-label={`${seed}. ${chain.join(". ")}`}>
      <div className="row">
        <span className="node seed" style={{ ["--i" as string]: i++ }}>
          {seed}
        </span>
      </div>
      {rows.map((r, ri) => (
        <div key={ri}>
          <div className="link" aria-hidden="true" />
          <div className="row">
            {r.map((t) => (
              <span key={t} className={`node ${/deal/i.test(t) ? "deal" : ""}`} style={{ ["--i" as string]: i++ }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </InViewFlag>
  );
}
