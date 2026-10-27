import { InViewFlag } from "./ui";
import { stats } from "@/lib/rdr/content";

/** The 1.4 billion split by platform, from RDR's own figures. */
export function PlatformBar() {
  const parts = [
    { name: "Facebook", v: stats.facebookViews },
    { name: "TikTok", v: stats.tiktokViews },
    { name: "YouTube", v: stats.youtubeViews },
  ];
  const total = parts.reduce((a, p) => a + p.v, 0);
  const m = (n: number) => `${(n / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
  return (
    <InViewFlag className="rdr-platbar" role="img" aria-label={`Views by platform: ${parts.map((p) => `${p.name} ${m(p.v)}`).join(", ")}`}>
      <div className="pbar">
        {parts.map((p) => (
          <div key={p.name} className="seg" style={{ width: `${(p.v / total) * 100}%` }} />
        ))}
      </div>
      <div className="legend">
        {parts.map((p) => (
          <span key={p.name}>
            <i aria-hidden="true" />
            {p.name} {m(p.v)} views
          </span>
        ))}
      </div>
    </InViewFlag>
  );
}

/** Each line ticks itself as the reader reaches it. */
export function Checklist({ items }: { items: string[] }) {
  return (
    <InViewFlag as="ul" className="rdr-check">
      {items.map((t, i) => (
        <li key={t} style={{ ["--i" as string]: i }}>
          <i aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </InViewFlag>
  );
}

/** Pablings: from a handful of branches to nearly 200 outlets (reported). 200 cells; the first few are the start. */
export function OutletGrid({ seed = 6, total = 200 }: { seed?: number; total?: number }) {
  return (
    <div>
      <InViewFlag className="rdr-outlets" role="img" aria-label={`From a small number of branches to nearly ${total} outlets, as reported in RDR's case study`}>
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i < seed ? "seed" : ""} style={{ ["--i" as string]: i }} />
        ))}
      </InViewFlag>
      <div className="rdr-outlets-cap">
        <span>A relatively small number of branches</span>
        <span>Nearly 200 outlets, as reported</span>
      </div>
    </div>
  );
}

/** CMV: 1X to 10X. */
export function TenX() {
  return (
    <InViewFlag className="rdr-tenx" role="img" aria-label="Reported growth from 1X to 10X">
      <div className="col before">
        <div className="bar" />
        <p className="cap">
          <b>1X</b>Before the RDR strategy
        </p>
      </div>
      <div className="col after">
        <div className="bar" />
        <p className="cap">
          <b>10X</b>Reported after
        </p>
      </div>
    </InViewFlag>
  );
}

/** Cinema Skin: the reported surge of reseller and distributor inquiries. Real screenshots replace this
 *  when the team adds them to assets.cinemaSkin.inquiries; until then the stack shows the kinds of
 *  inquiries the case study describes, not invented messages. */
export function Inquiries({ shots = [] }: { shots?: string[] }) {
  if (shots.length) {
    return (
      <div className="rdr-proofwall" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {shots.map((s) => (
          <figure key={s}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s} alt="Reseller or distributor inquiry" loading="lazy" />
          </figure>
        ))}
      </div>
    );
  }
  const items = ["Reseller inquiry", "Distributor inquiry", "Reseller inquiry", "Reseller inquiry", "Distributor inquiry", "Reseller inquiry", "Distributor inquiry", "Reseller inquiry"];
  return (
    <InViewFlag as="ul" className="rdr-inquiries" aria-label="A surge in inquiries from prospective resellers and distributors, as the case study reports">
      {items.map((t, i) => (
        <li key={i} style={{ ["--i" as string]: i }}>
          {t}
        </li>
      ))}
    </InViewFlag>
  );
}

/** Thousands of attempts: a field where only some hooks hit. Pattern is fixed, not random, so it renders the same on server and client. */
export function Attempts() {
  const cells = Array.from({ length: 400 }, (_, i) => (i * 7919) % 23 === 0 || (i * 104729) % 31 === 0);
  return (
    <div className="rdr-attempts" role="img" aria-label="Thousands of attempts; a few hooks and stories travelled">
      {cells.map((hit, i) => (
        <i key={i} className={hit ? "hit" : ""} />
      ))}
    </div>
  );
}

/** Authority compounds: each signal taller than the last. */
export function Compound({ labels }: { labels: string[] }) {
  const heights = ["28%", "46%", "70%", "100%"];
  return (
    <InViewFlag as="ol" className="rdr-compound" aria-label={labels.join(". ")}>
      {labels.map((l, i) => (
        <li key={l} style={{ ["--i" as string]: i }}>
          <i style={{ ["--h" as string]: heights[i] ?? "100%" }} aria-hidden="true" />
          <span>{l}</span>
        </li>
      ))}
    </InViewFlag>
  );
}

/** One business, one story: the chain of what one piece of content can set off. */
export function Chain({ items }: { items: string[] }) {
  return (
    <InViewFlag as="ol" className="rdr-chain">
      {items.map((t, i) => (
        <li key={t} style={{ ["--i" as string]: i }}>
          <i aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </InViewFlag>
  );
}

/** N1M: one minute on a phone. */
export function Phone({ ones }: { ones: string[] }) {
  return (
    <InViewFlag className="rdr-phone" role="img" aria-label="Negosyo Isang Minuto: one sharp idea, one clear lesson, one strong hook, one minute">
      <svg className="ring" viewBox="0 0 150 150" aria-hidden="true">
        <circle className="bg" cx="75" cy="75" r="65" />
        <circle className="fg" cx="75" cy="75" r="65" />
      </svg>
      <p className="sec" aria-hidden="true">
        1:00
      </p>
      <ul className="ones">
        {ones.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
    </InViewFlag>
  );
}

/** Wordmarks until the real logos land in /public/rdr. */
export function LogoWall({ names, logos }: { names: string[]; logos: Record<string, string> }) {
  return (
    <ul className="rdr-logos" aria-label="Brands">
      {names.map((n) => (
        <li key={n} className="logo">
          {logos[n] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logos[n]} alt={n} loading="lazy" />
          ) : (
            <span>{n}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Marquee({ names, logos }: { names: string[]; logos: Record<string, string> }) {
  const Track = () => (
    <div className="track" aria-hidden="true">
      {names.map((n) =>
        logos[n] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={n} src={logos[n]} alt="" />
        ) : (
          <span key={n}>{n}</span>
        ),
      )}
    </div>
  );
  return (
    <div className="rdr-marquee" role="img" aria-label={names.join(", ")}>
      <Track />
      <Track />
    </div>
  );
}
