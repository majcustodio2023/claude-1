import { assets } from "@/lib/rdr/assets";
import {
  beforeSale,
  believe,
  brands,
  care,
  cinema,
  cmv,
  cta,
  difference,
  door,
  dream,
  ecosystem,
  finalBar,
  goal,
  hero,
  howItWorks,
  invitation,
  letter,
  media,
  mediaSection,
  money,
  numbers,
  objections,
  offerExtras,
  offers,
  offersIntro,
  pablings,
  painful,
  philosophy,
  roiTest,
  socials,
  stats,
  stepForward,
  story,
  videos,
  which,
  whoFor,
  why,
} from "@/lib/rdr/content";
import { Nav } from "@/components/rdr/Nav";
import { ApplyModal } from "@/components/rdr/ApplyModal";
import { ApplyButton, Reveal } from "@/components/rdr/ui";
import { NumberTicker } from "@/components/rdr/NumberTicker";
import { LiteYouTube } from "@/components/rdr/LiteYouTube";
import { Words } from "@/components/rdr/Words";
import { Funnel } from "@/components/rdr/Funnel";
import { Calculator } from "@/components/rdr/Calculator";
import { WhichOne } from "@/components/rdr/WhichOne";
import { NextEvent } from "@/components/rdr/Events";
import { Attempts, Chain, Checklist, Compound, Inquiries, LogoWall, Marquee, OutletGrid, Phone, PlatformBar, TenX } from "@/components/rdr/Diagrams";

export const dynamic = "force-dynamic";

function Section({ id, ground, children, className = "section" }: { id?: string; ground: "dark" | "light"; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} data-ground={ground} className={`rdr-ground-${ground} ${className}`}>
      <div className="wrap">{children}</div>
    </section>
  );
}

const Lines = ({ items, className = "t-body" }: { items: string[]; className?: string }) => (
  <div className={`stack ${className}`}>
    {items.map((t) => (
      <p key={t}>{t}</p>
    ))}
  </div>
);

const List = ({ items, two = false }: { items: string[]; two?: boolean }) => (
  <ul className={`rdr-list ${two ? "rdr-list-2" : ""}`}>
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);

export default function Page() {
  return (
    <main id="top">
      <Nav />
      <ApplyModal />

      {/* ───────── Hero: the letter opens, the studio is already lit ───────── */}
      <header data-ground="dark" className="rdr-ground-dark rdr-hero">
        <div className="wrap top">
          <div className="stack-lg">
            <p className="sender" data-rise="" style={{ ["--i" as string]: 0 }}>
              <b>{hero.sender}</b>
            </p>
            <h1 className="t-display t-h1" data-rise="" style={{ ["--i" as string]: 1 }}>
              {hero.title}
            </h1>
            <div className="actions" data-rise="" style={{ ["--i" as string]: 2 }}>
              <ApplyButton className="rbtn rbtn-lg" source="hero">
                {cta.primary}
              </ApplyButton>
              <span className="free">{hero.free}</span>
            </div>
          </div>
          <div data-rise="" style={{ ["--i" as string]: 3 }}>
            <LiteYouTube id={videos.hero.id} title={videos.hero.title} />
          </div>
        </div>
        <div className="wrap claim" data-rise="" style={{ ["--i" as string]: 4 }}>
          <p className="lead">{hero.claimLead}</p>
          <p className="t-giant num" aria-label={`${hero.claimNumber} ${hero.claimTail}`}>
            <NumberTicker value={1.4} decimals={1} delay={500} />
            <small>BILLION</small>
          </p>
          <p className="tail">{hero.claimTail}</p>
        </div>
        <div className="wrap split split-7-5" data-rise="" style={{ ["--i" as string]: 5 }}>
          <h2 className="t-sub">{hero.sub}</h2>
          <p className="ready">{hero.ready}</p>
        </div>
      </header>

      {/* ───────── The letter: what you don't need ───────── */}
      <Section ground="light">
        <div className="split split-5-7">
          <div className="sticky stack">
            <Reveal as="p" className="t-h3 t-display">
              {letter.intro}
            </Reveal>
            <Reveal as="p" index={1} className="t-body">
              {letter.line1}
            </Reveal>
            <Reveal as="p" index={2} className="t-statement" style={{ fontWeight: 760 }}>
              {letter.bold}
            </Reveal>
          </div>
          <div className="stack-lg">
            {letter.dontNeed.map((t) => (
              <Words key={t} text={t} className="t-statement" />
            ))}
          </div>
        </div>
      </Section>

      {/* ───────── The right people ───────── */}
      <Section ground="light" className="section-tight">
        <div className="stack-xl">
          <Reveal as="h2" className="t-display t-h2">
            {letter.need}
          </Reveal>
          <div className="split split-7-5">
            <Reveal as="ul" index={1} className="rdr-chips" aria-label="The right people">
              {letter.people.map((p) => (
                <li key={p} className={/MONEY|INTENT/.test(p) ? "hot" : ""}>
                  {p}
                </li>
              ))}
            </Reveal>
            <div className="stack-lg">
              <Reveal as="p" index={2} className="t-statement">
                {letter.capable}
              </Reveal>
              <Reveal as="ul" index={3} className="rdr-bubbles" aria-label="What they say">
                {letter.quotes.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── Three truths ───────── */}
      <Section ground="dark">
        <div className="stack-xl">
          <Reveal as="p" className="t-statement t-soft">
            {letter.because}
          </Reveal>
          <ul className="rdr-truths">
            {letter.truths.map((t, i) => (
              <Reveal as="li" key={t} index={i + 1}>
                {t}
              </Reveal>
            ))}
          </ul>
          <div className="split split-5-7">
            <Reveal as="p" className="t-sub">
              {letter.why}
            </Reveal>
            <div className="stack-lg">
              <Reveal as="p" index={1} className="t-statement t-soft">
                {letter.notSimply}
              </Reveal>
              <Reveal as="p" index={2} className="t-h3 t-display">
                {letter.built}
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── The numbers ───────── */}
      <Section id="numbers" ground="dark">
        <div className="stack-xl">
          <div className="split split-5-7">
            <div className="stack">
              <Reveal as="h2" className="t-display t-h2">
                {numbers.title}
              </Reveal>
              <Reveal as="p" index={1} className="t-sub t-accent">
                {numbers.sub}
              </Reveal>
            </div>
            <Reveal index={2}>
              <Lines items={numbers.lines} className="t-statement" />
            </Reveal>
          </div>

          <ul className="rdr-board" aria-label="RDR platform numbers">
            {numbers.tiles.map((t, i) => {
              const [num, ...rest] = t.big.split(" ");
              const word = rest.join(" ");
              const n = parseFloat(num.replace(/[^0-9.]/g, ""));
              const dec = (num.match(/\.(\d+)/)?.[1] ?? "").length;
              const plus = num.includes("+") ? "+" : "";
              return (
                <Reveal as="li" key={t.label} index={i % 4} className={`tile ${i === 0 ? "hero-tile" : ""}`}>
                  <p className="big">
                    <NumberTicker value={n} decimals={dec} suffix={plus} /> {word}
                  </p>
                  <div>
                    <p className="label">{t.label}</p>
                    {t.note && <p className="note">{t.note}</p>}
                  </div>
                </Reveal>
              );
            })}
          </ul>

          <div className="split split-5-7">
            <Reveal as="p" className="t-statement">
              {numbers.behind}
            </Reveal>
            <Reveal index={1}>
              <PlatformBar />
            </Reveal>
          </div>

          {assets.proof.length > 0 && (
            <div className="rdr-proofwall">
              {assets.proof.map((p, i) => (
                <Reveal as="figure" key={p.src} index={i % 3}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.caption} loading="lazy" />
                  <figcaption>{p.caption}</figcaption>
                </Reveal>
              ))}
            </div>
          )}

          <Reveal>
            <LogoWall names={brands} logos={assets.brandLogos} />
          </Reveal>
          <p className="t-caption">{stats.proofNote}</p>
        </div>
      </Section>

      {/* ───────── The story ───────── */}
      <Section id="story" ground="light">
        <div className="stack-xl">
          <div className="split split-5-7">
            <div className="stack">
              <Reveal as="h2" className="t-display t-h2">
                {story.title}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal as="p" className="t-sub">
                {story.sub}
              </Reveal>
              <Reveal as="p" index={1} className="t-statement">
                {story.lead}
              </Reveal>
            </div>
          </div>

          <div className="split split-5-7">
            <div className="sticky stack-lg">
              <Reveal as="p" className="t-h3 t-display">
                {story.before}
              </Reveal>
              <Reveal as="p" index={1} className="t-body t-soft">
                {story.lesson}
              </Reveal>
              <Reveal as="p" index={2} className="t-h3 t-display t-accent">
                {story.lessonBig}
              </Reveal>
            </div>
            <ol className="rdr-timeline" aria-label="Before RDR, then the studio">
              {[...story.beats, ...story.mine, ...story.studio, ...story.climb].map((b, i) => (
                <Reveal as="li" key={b} index={i % 4} className={/2021|broke through|billion/.test(b) ? "turn" : ""}>
                  <i aria-hidden="true" />
                  <p>{b}</p>
                </Reveal>
              ))}
            </ol>
          </div>

          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="p" className="t-statement">
                {story.today}
              </Reveal>
              <Reveal as="ul" index={1} className="rdr-strike" aria-label="What media is not">
                {story.nots.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal as="p" className="t-display t-h2">
                {story.is}
              </Reveal>
              <Reveal index={1}>
                <Lines items={story.because} className="t-statement" />
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── The painful question ───────── */}
      <Section id="pain" ground="dark">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {painful.title}
            </Reveal>
            <Reveal as="p" index={1} className="t-sub">
              {painful.sub}
            </Reveal>
          </div>
          <div className="split split-5-7">
            <div className="sticky stack-lg">
              <Reveal as="p" className="t-statement">
                {painful.think}
              </Reveal>
              <Reveal index={1}>
                <Checklist items={painful.haves} />
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal as="p" className="t-h3 t-display">
                {painful.search}
              </Reveal>
              <div className="rdr-compare">
                <Reveal className="col dim" index={1}>
                  <h4>{painful.leader[1]}</h4>
                  <div className="poster">{painful.compares[1].poster}</div>
                  <ul>
                    <li>{painful.compares[3].or}</li>
                  </ul>
                </Reveal>
                <Reveal className="col lit" index={2}>
                  <h4>{painful.leader[0]}</h4>
                  <ul>
                    <li>{painful.compares[0].when}</li>
                    <li>{painful.compares[0].ask[0]}</li>
                    <li>{painful.compares[1].when}</li>
                    <li>{painful.compares[1].ask[0]}</li>
                    <li>{painful.compares[2].when}</li>
                    <li>{painful.compares[2].ask.join(" ")}</li>
                    <li>{painful.compares[3].when}</li>
                    <li>{painful.compares[3].ask[0]}</li>
                  </ul>
                  <p className="t-h3 t-display">{painful.compares[3].feel}</p>
                </Reveal>
              </div>
            </div>
          </div>
          <div className="split split-4-8">
            <Reveal as="p" className="t-h3 t-display">
              {painful.matters}
            </Reveal>
            <div className="stack-lg">
              <Reveal as="ul" index={1} className="rdr-ledger" aria-label="The loss nobody calculates">
                {painful.every.map((e) => (
                  <li key={e}>
                    <span>{e}</span>
                    <span>₱ ______</span>
                  </li>
                ))}
                <li className="sum">
                  <span>{painful.represents}</span>
                  <span aria-hidden="true">₱ ______</span>
                </li>
              </Reveal>
              <Reveal as="p" index={2} className="t-statement t-soft">
                {painful.never}
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── Before the sale + the funnel scene ───────── */}
      <Section id="before" ground="light">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {beforeSale.title}
            </Reveal>
            <Reveal as="p" index={1} className="t-sub">
              {beforeSale.sub}
            </Reveal>
          </div>
          <div className="split split-4-8">
            <Reveal as="p" className="t-statement">
              {beforeSale.before}
            </Reveal>
            <Reveal as="ol" index={1} className="rdr-ladder" aria-label="Before someone buys">
              {beforeSale.steps.map((s, i) => (
                <li key={s} style={{ ["--i" as string]: i }}>
                  {s}
                </li>
              ))}
            </Reveal>
          </div>
        </div>
      </Section>
      <section data-ground="light" className="rdr-ground-light">
        <Funnel old={beforeSale.old} words={beforeSale.funnel} isnt={beforeSale.isnt} its={beforeSale.its} game={beforeSale.game} />
      </section>
      <Section ground="light" className="section-tight">
        <div className="split split-6-6">
          <div className="stack-lg">
            <Reveal as="p" className="t-body">
              {beforeSale.notImpressed}
            </Reveal>
            <Reveal as="blockquote" index={1} className="t-quote t-soft">
              {beforeSale.quote}
            </Reveal>
            <Reveal as="p" index={2} className="t-body">
              {beforeSale.next}
            </Reveal>
            <Reveal as="blockquote" index={3} className="t-display t-h2 t-accent">
              {beforeSale.nextQ}
            </Reveal>
          </div>
          <div className="stack-lg">
            <Reveal>
              <List items={beforeSale.questions} />
            </Reveal>
            <Reveal as="p" index={1} className="t-statement">
              {beforeSale.businessman}
            </Reveal>
            <Reveal as="p" index={2} className="t-display t-h3">
              {beforeSale.care}
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── The dream ───────── */}
      <Section id="dream" ground="dark">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {dream.title}
            </Reveal>
            <Reveal as="p" index={1} className="t-sub">
              {dream.sub}
            </Reveal>
          </div>
          <div className="split split-5-7">
            <div className="sticky stack-lg">
              <Reveal as="p" className="t-h3 t-display">
                {dream.imagine}
              </Reveal>
              <Reveal as="p" index={1} className="t-statement">
                {dream.stranger}
              </Reveal>
            </div>
            <Reveal as="ul" className="rdr-seen" aria-label="What they have already seen">
              {dream.seen.map((s) => (
                <li key={s}>
                  <i aria-hidden="true" />
                  {s}
                </li>
              ))}
            </Reveal>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="p" className="t-body">
                {dream.so}
              </Reveal>
              <Reveal as="p" index={1} className="t-display t-h3">
                {dream.zero}
              </Reveal>
              <Reveal as="p" index={2} className="t-display t-h3 t-accent">
                {dream.trust}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal as="p" className="t-statement">
                {dream.now}
              </Reveal>
              <Reveal as="ul" index={1} className="rdr-chips">
                {dream.with.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </Reveal>
              <Reveal as="p" index={2} className="t-body">
                {dream.stops}
              </Reveal>
              <Reveal as="p" index={3} className="t-h3 t-display">
                {dream.asset}
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── Money: the live calculator ───────── */}
      <Section id="money" ground="light">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {money.title}
            </Reveal>
            <Reveal as="p" index={1} className="t-sub">
              {money.sub}
            </Reveal>
          </div>
          <div className="split split-5-7">
            <div className="sticky stack-lg">
              <Reveal as="p" className="t-h3 t-display">
                {money.think}
              </Reveal>
              <Reveal as="p" index={1} className="t-statement">
                {money.one}
              </Reveal>
              <Reveal as="ul" index={2} className="rdr-chips">
                {money.amounts.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </Reveal>
              <Reveal index={3}>
                <List items={money.worths} />
              </Reveal>
            </div>
            <Reveal className="field">
              <Calculator />
            </Reveal>
          </div>
          <div className="split split-7-5">
            <Reveal>
              <Lines items={money.whatIf} className="t-statement" />
            </Reveal>
            <div className="stack-lg">
              <Reveal as="p" className="t-statement" style={{ fontWeight: 760 }}>
                {money.roi}
              </Reveal>
              <Reveal index={1} className="rdr-pairs">
                <ul className="rdr-pairs">
                  <li>
                    <div className="a">
                      {money.not} {money.notQ}
                    </div>
                    <div className="b">
                      {money.but} {money.butQ}
                    </div>
                  </li>
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── Case studies ───────── */}
      <Section id="results" ground="dark" className="section-tight">
        <div className="split split-5-7">
          <Reveal as="h2" className="t-display t-h2">
            {believe.title}
          </Reveal>
          <Reveal as="p" index={1} className="t-sub t-accent">
            {believe.sub}
          </Reveal>
        </div>
      </Section>

      <Section ground="dark">
        <article className="rdr-case">
          <div className="split split-5-7">
            <div className="stack">
              <Reveal as="h3" className="t-display t-h2">
                {pablings.title}
              </Reveal>
              <Reveal as="p" index={1} className="t-sub">
                {pablings.sub}
              </Reveal>
            </div>
            <Reveal index={2}>
              <LiteYouTube id={videos.pablings.id} title={videos.pablings.title} />
            </Reveal>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal>
                <Lines items={pablings.lines} />
              </Reveal>
              <Reveal as="p" index={1} className="t-body">
                {pablings.through}
              </Reveal>
              <Reveal as="ul" index={2} className="rdr-chips">
                {pablings.see.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal>
                <OutletGrid />
              </Reveal>
              <Reveal as="p" index={1} className="t-statement">
                {pablings.reported} <b className="t-accent">{pablings.reportedBig}</b>
                {pablings.reportedTail}
              </Reveal>
            </div>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="p" className="t-h3 t-display">
                {pablings.lesson}
              </Reveal>
              <Reveal as="ul" index={1} className="rdr-strike">
                {pablings.didNot.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal as="p" className="t-statement">
                {pablings.did}
              </Reveal>
              <Reveal as="p" index={1} className="t-body">
                {pablings.and}
              </Reveal>
              <Reveal as="p" index={2} className="t-display t-h2 t-accent">
                {pablings.worth}
              </Reveal>
              <Reveal index={3} className="stack">
                <p className="t-sub">{pablings.ask}</p>
                <ApplyButton offer="talks" source="case-pablings">
                  {cta.talks}
                </ApplyButton>
              </Reveal>
            </div>
          </div>
        </article>
      </Section>

      <Section ground="light">
        <article className="rdr-case">
          <div className="split split-5-7">
            <div className="stack">
              <Reveal as="h3" className="t-display t-h2">
                {cmv.title}
              </Reveal>
              <Reveal as="p" index={1} className="t-sub">
                {cmv.sub}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal as="p" className="t-body">
                {cmv.fav}
              </Reveal>
              <Reveal as="blockquote" index={1} className="t-quote">
                {cmv.excuse}
              </Reveal>
              <Reveal as="p" index={2} className="t-h3 t-display">
                {cmv.really}
              </Reveal>
            </div>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="ul" className="rdr-strike">
                {cmv.not.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </Reveal>
              <Reveal as="p" index={1} className="t-statement">
                {cmv.talking}
              </Reveal>
              <Reveal as="ul" index={2} className="rdr-chips">
                {cmv.products.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal>
                <LiteYouTube id={videos.cmv.id} title={videos.cmv.title} emptyLabel="CMV interview" />
              </Reveal>
              <Reveal as="p" index={1} className="t-h3 t-display">
                {cmv.exactly}
              </Reveal>
            </div>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal>
                <Lines items={cmv.machine} className="t-statement" />
              </Reveal>
              <Reveal as="p" index={1} className="t-display t-h3 t-accent">
                {cmv.sell}
              </Reveal>
              <Reveal index={2}>
                <List items={cmv.show} />
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal as="p" className="t-body">
                {cmv.reported}
              </Reveal>
              <Reveal index={1}>
                <TenX />
              </Reveal>
              <Reveal as="p" index={2} className="t-giant t-giant-col t-accent">
                {cmv.big}
              </Reveal>
              <Reveal as="p" index={3} className="t-statement">
                {cmv.along}
              </Reveal>
            </div>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="p" className="t-statement">
                {cmv.think}
              </Reveal>
              <Reveal as="p" index={1} className="t-statement t-soft">
                {cmv.sexy}
              </Reveal>
              <Reveal as="p" index={2} className="t-display t-h3">
                {cmv.need}
              </Reveal>
            </div>
            <Reveal className="field stack">
              <p className="t-sub">{cmv.ask}</p>
              <p className="t-body">{cmv.askSub}</p>
              <ApplyButton offer="talks" source="case-cmv">
                {cta.talks}
              </ApplyButton>
            </Reveal>
          </div>
        </article>
      </Section>

      <Section ground="dark">
        <article className="rdr-case">
          <div className="split split-5-7">
            <div className="stack">
              <Reveal as="h3" className="t-display t-h2">
                {cinema.title}
              </Reveal>
              <Reveal as="p" index={1} className="t-sub">
                {cinema.sub}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal>
                <Lines items={cinema.beauty} className="t-h3 t-display" />
              </Reveal>
              <Reveal as="ul" index={1} className="rdr-chips">
                {cinema.thousands.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </Reveal>
              <Reveal as="p" index={2} className="t-statement">
                {cinema.commodity}
              </Reveal>
            </div>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="p" className="t-body">
                {cinema.goalNot}
              </Reveal>
              <Reveal as="blockquote" index={1} className="t-quote t-soft">
                {cinema.look}
              </Reveal>
              <Reveal as="p" index={2} className="t-body">
                {cinema.goalWas}
              </Reveal>
              <Reveal index={3}>
                <List items={cinema.understand} />
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal>
                <LiteYouTube id={videos.cinemaSkin.id} title={videos.cinemaSkin.title} emptyLabel="Cinema Skin feature" />
              </Reveal>
              <Reveal index={1}>
                <Inquiries shots={assets.cinemaSkin.inquiries} />
              </Reveal>
              <Reveal as="p" index={2} className="t-statement">
                {cinema.reported} <b>{cinema.reportedBold}</b>
              </Reveal>
            </div>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="p" className="t-statement">
                {cinema.mean}
              </Reveal>
              <Reveal as="p" index={1} className="t-statement t-soft">
                {cinema.notEnt}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal as="p" className="t-display t-h2">
                {cinema.big}
              </Reveal>
              <Reveal index={1} className="stack">
                <p className="t-sub">{cinema.ask}</p>
                <ApplyButton offer="stories" source="case-cinema">
                  {cta.story}
                </ApplyButton>
              </Reveal>
            </div>
          </div>
        </article>
      </Section>

      {/* ───────── Content vs brand acceleration ───────── */}
      <Section id="difference" ground="light">
        <div className="stack-xl">
          <Reveal as="h2" className="t-display t-h2">
            {difference.title}
          </Reveal>
          <div className="stack">
            <Reveal className="rdr-pairs-head">
              <p className="t-statement t-soft">{difference.contentSays}</p>
              <p className="t-statement">{difference.accelSays}</p>
            </Reveal>
            <ul className="rdr-pairs">
              {difference.pairs.map((p, i) => (
                <Reveal as="li" key={p.content} index={i % 3}>
                  <div className="a">{p.content}</div>
                  <div className="b">{p.accel}</div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ───────── Why work with me ───────── */}
      <Section id="why" ground="dark">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {why.title}
            </Reveal>
            <Reveal as="p" index={1} className="t-sub">
              {why.sub}
            </Reveal>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="p" className="t-statement">
                {why.look}
              </Reveal>
              <Reveal as="ul" index={1} className="rdr-list">
                {why.numbers.map((n) => (
                  <li key={n} style={{ fontWeight: 760, fontStretch: "108%" }}>
                    {n}
                  </li>
                ))}
              </Reveal>
              <Reveal as="p" index={2} className="t-body">
                {why.theory}
              </Reveal>
              <Reveal as="p" index={3} className="t-h3 t-display">
                {why.attempts}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal>
                <Attempts />
              </Reveal>
              <Reveal as="ul" index={1} className="rdr-chips">
                {why.list.map((l) => (
                  <li key={l} className={/worked|shared|travelled/.test(l) ? "hot" : ""}>
                    {l}
                  </li>
                ))}
              </Reveal>
              <Reveal as="p" index={2} className="t-statement">
                {why.years}
              </Reveal>
            </div>
          </div>
          <div className="split split-5-7">
            <Reveal as="p" className="t-h3 t-display">
              {why.notHiring}
            </Reveal>
            <Reveal index={1}>
              <Lines items={[why.already, why.benefit]} className="t-statement" />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── National media ───────── */}
      <Section id="media" ground="light">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {mediaSection.title}
            </Reveal>
            <Reveal as="p" index={1} className="t-statement">
              {mediaSection.lead}
            </Reveal>
          </div>
        </div>
      </Section>
      <section data-ground="light" className="rdr-ground-light" aria-label="Media platforms">
        <Marquee names={media} logos={assets.mediaLogos} />
      </section>
      <Section ground="light" className="section-tight">
        <div className="split split-5-7">
          <div className="stack-lg">
            <Reveal as="p" className="t-soft">
              {mediaSection.tail}
            </Reveal>
            <Reveal as="p" index={1} className="t-body">
              {mediaSection.mention}
            </Reveal>
            <Reveal as="p" index={2} className="t-display t-h2 t-accent">
              {mediaSection.compounds}
            </Reveal>
          </div>
          <div className="stack-lg">
            <Reveal>
              <Compound labels={mediaSection.chain} />
            </Reveal>
            <Reveal as="p" index={1} className="t-statement">
              {mediaSection.eventually}
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── The platforms ───────── */}
      <Section id="platforms" ground="dark" className="section-tight">
        <div className="split split-5-7">
          <Reveal as="h2" className="t-display t-h2">
            {offersIntro.title}
          </Reveal>
          <Reveal as="p" index={1} className="t-sub">
            {offersIntro.sub}
          </Reveal>
        </div>
      </Section>

      <section data-ground="light" className="rdr-ground-light">
        <div className="wrap">
          {offers.map((o) => (
            <article key={o.key} id={`offer-${o.key}`} className="rdr-offer">
              <div className="split split-5-7">
                <div className="head">
                  <Reveal as="p" className="num">
                    {o.number}
                  </Reveal>
                  <Reveal as="h3" index={1} className="t-display t-h2">
                    {o.title.replace(/^OFFER #\d+ — /, "")}
                  </Reveal>
                  <Reveal as="p" index={2} className="t-sub t-accent">
                    {o.sub}
                  </Reveal>
                </div>
                <div className="stack-lg">
                  <Reveal>
                    <Lines items={o.paras} className="t-statement" />
                  </Reveal>
                  {o.key === "talks" && (
                    <Reveal index={1} className="rdr-chips">
                      <ul className="rdr-chips">
                        {offerExtras.talksUncover.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </Reveal>
                  )}
                  {o.key === "n1m" && (
                    <Reveal index={1}>
                      <Phone ones={offerExtras.n1mOne} />
                    </Reveal>
                  )}
                </div>
              </div>

              <div className="split split-5-7">
                <div className="stack-lg">
                  {o.listIntro && (
                    <Reveal as="p" className="t-body" style={{ fontWeight: 650 }}>
                      {o.listIntro}
                    </Reveal>
                  )}
                  {o.list && (
                    <Reveal index={1}>
                      {o.key === "studio" || o.key === "vlog" ? (
                        <ul className="rdr-studio">
                          {o.list.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      ) : (
                        <List items={o.list} two={o.list.length > 6} />
                      )}
                    </Reveal>
                  )}
                </div>
                <div className="stack-lg">
                  {o.afterList && (
                    <Reveal>
                      <Lines items={o.afterList} className="t-statement" />
                    </Reveal>
                  )}
                  {o.key === "vlog" && (
                    <Reveal index={1}>
                      <List items={offerExtras.vlogLet} />
                    </Reveal>
                  )}
                  {o.key === "films" && (
                    <Reveal index={1} className="stack-lg">
                      <ul className="rdr-chips">
                        {offerExtras.filmsMakes.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                      <p className="t-body">{offerExtras.filmsBecause}</p>
                    </Reveal>
                  )}
                  {o.big && (
                    <Reveal as="p" index={2} className="t-display t-h3">
                      {o.big}
                    </Reveal>
                  )}
                  {o.key === "studio" && (
                    <Reveal as="p" index={3} className="t-statement">
                      {offerExtras.studioGive}
                    </Reveal>
                  )}
                  {o.key === "events" && (
                    <Reveal index={3}>
                      <NextEvent cta={o.cta} />
                    </Reveal>
                  )}
                  {o.key !== "events" && (
                    <Reveal index={3}>
                      <ApplyButton offer={o.key} source={`offer-${o.key}`}>
                        {o.cta}
                      </ApplyButton>
                    </Reveal>
                  )}
                </div>
              </div>

              {o.key === "talks" && (
                <Reveal className="rdr-clips" aria-label="RDR Talks clips">
                  {videos.talks.slice(0, 4).map((v) => (
                    <LiteYouTube key={v.id} id={v.id} title={v.title} />
                  ))}
                </Reveal>
              )}
              {o.key === "films" && (
                <Reveal>
                  <LiteYouTube id={videos.talks[1].id} title={videos.talks[1].title} className="rdr-cine" />
                </Reveal>
              )}
              {o.key === "studio" && assets.studio.length > 0 && (
                <Reveal className="rdr-gallery">
                  {assets.studio.map((s) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={s} src={s} alt="Inside the RDR studio" loading="lazy" />
                  ))}
                </Reveal>
              )}
              {o.key === "gci" && assets.gci.length > 0 && (
                <Reveal className="rdr-gallery">
                  {assets.gci.map((s) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={s} src={s} alt="Growth Circle International" loading="lazy" />
                  ))}
                </Reveal>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* ───────── Which one ───────── */}
      <Section id="which" ground="dark">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {which.title}
            </Reveal>
            <Reveal as="p" index={1} className="t-sub t-accent">
              {which.sub}
            </Reveal>
          </div>
          <Reveal>
            <WhichOne map={which.map} />
          </Reveal>
          <div className="split split-7-5">
            <Reveal>
              <Lines items={which.still} className="t-statement" />
            </Reveal>
            <Reveal index={1}>
              <ApplyButton offer="general" source="which" className="rbtn rbtn-lg">
                {cta.choose}
              </ApplyButton>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── Who it's for ───────── */}
      <Section id="who" ground="light">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {whoFor.title}
            </Reveal>
            <Reveal as="p" index={1} className="t-sub">
              {whoFor.sub}
            </Reveal>
          </div>
          <div className="rdr-fit">
            <Reveal className="field field-3 stack-lg">
              <ul className="rdr-strike">
                {whoFor.ifs.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <p className="t-statement">{whoFor.wont}</p>
              <p className="t-body t-soft">{whoFor.expose}</p>
            </Reveal>
            <Reveal index={1} className="field stack-lg">
              <Lines items={whoFor.but} className="t-statement" />
              <p className="t-display t-h3 t-accent">{whoFor.interesting}</p>
              <p className="t-body" style={{ fontWeight: 650 }}>
                {whoFor.fit}
              </p>
              <ul className="rdr-chips">
                {whoFor.list.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── ROI test ───────── */}
      <Section id="roi" ground="dark">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {roiTest.title}
            </Reveal>
            <Reveal as="p" index={1} className="t-sub">
              {roiTest.sub}
            </Reveal>
          </div>
          <div className="split split-5-7">
            <Reveal>
              <List items={roiTest.questions} />
            </Reveal>
            <div className="stack-lg">
              <Reveal as="p" className="t-statement">
                {roiTest.compare}
              </Reveal>
              <Reveal as="p" index={1} className="t-body">
                {roiTest.how}
              </Reveal>
              <Reveal index={2}>
                <ul className="rdr-pairs">
                  <li>
                    <div className="a">
                      {roiTest.not} {roiTest.notQ}
                    </div>
                    <div className="b">
                      {roiTest.but} {roiTest.butQ}
                    </div>
                  </li>
                </ul>
              </Reveal>
              <Reveal index={3}>
                <Lines items={roiTest.cheap} />
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── Ecosystem ───────── */}
      <Section id="ecosystem" ground="light">
        <div className="stack-xl">
          <Reveal as="h2" className="t-display t-h2">
            {ecosystem.title}
          </Reveal>
          <Reveal>
            <LogoWall names={brands} logos={assets.brandLogos} />
          </Reveal>
          <div className="split split-5-7">
            <div className="stack">
              <Reveal as="p" className="t-soft">
                {ecosystem.more}
              </Reveal>
              <Reveal index={1}>
                <Lines items={ecosystem.different} className="t-statement" />
              </Reveal>
              <Reveal as="p" index={2} className="t-body">
                {ecosystem.same}
              </Reveal>
            </div>
            <Reveal as="p" className="t-display t-h2 t-accent">
              {ecosystem.big}
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── How it works ───────── */}
      <Section id="how" ground="dark">
        <div className="stack-xl">
          <Reveal as="h2" className="t-display t-h2">
            {howItWorks.title}
          </Reveal>
          <ol className="rdr-steps">
            {howItWorks.steps.map((s, i) => (
              <Reveal as="li" key={s.title} index={i % 2}>
                <div className="stack">
                  <h3 className="t-display t-h3">{s.title}</h3>
                  {s.lines && <Lines items={s.lines} />}
                  {s.close && <Lines items={s.close} />}
                  {s.bold && (
                    <p className="t-statement" style={{ fontWeight: 760 }}>
                      {s.bold}
                    </p>
                  )}
                </div>
                <div className="stack-lg">
                  {s.list && <List items={s.list} two={s.list.length > 6} />}
                  {s.asks && (
                    <ul className="asks">
                      {s.asks.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </Section>

      {/* ───────── Objections ───────── */}
      <Section id="questions" ground="light">
        <div className="stack-xl">
          <div className="rdr-obj">
            {objections.map((o, i) => (
              <Reveal as="details" key={o.q} index={i % 3} open={i === 0 ? true : undefined}>
                <summary>
                  <span>{o.q}</span>
                  <i aria-hidden="true" />
                </summary>
                <div className="body">
                  {o.a && <p className="t-sub t-accent">{o.a}</p>}
                  <Lines items={o.paras} />
                  {o.bold && (
                    <p className="t-statement" style={{ fontWeight: 760 }}>
                      {o.bold}
                    </p>
                  )}
                  {o.list && <List items={o.list} two={o.list.length > 6} />}
                  {o.after && <Lines items={o.after} />}
                  {o.list2 && <List items={o.list2} />}
                  {o.big && <p className="t-display t-h3">{o.big}</p>}
                  {o.close && <Lines items={o.close} />}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ───────── Philosophy ───────── */}
      <Section id="philosophy" ground="dark">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {philosophy.title}
            </Reveal>
            <div className="stack-lg">
              <Reveal as="p" className="t-display t-h2 t-accent">
                {philosophy.sub}
              </Reveal>
              <Reveal as="p" index={1} className="t-statement">
                {philosophy.want} <b>{philosophy.wantBold}</b>
              </Reveal>
              <Reveal as="p" index={2} className="t-body t-soft">
                {philosophy.diff}
              </Reveal>
            </div>
          </div>
          <ul className="rdr-scale">
            {philosophy.pairs.map((p, i) => (
              <Reveal as="li" key={p.famous} index={i}>
                <div className="f">{p.famous}</div>
                <div className="v">{p.valuable}</div>
              </Reveal>
            ))}
          </ul>
          <div className="split split-5-7">
            <Reveal>
              <Lines items={philosophy.fame} className="t-statement" />
            </Reveal>
            <Reveal as="p" className="t-display t-h2">
              {philosophy.big}
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── Why I care ───────── */}
      <Section id="care" ground="light">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {care.title}
            </Reveal>
            <div className="stack-lg">
              {care.lines.map((l) => (
                <Words key={l} text={l} className="t-statement" />
              ))}
            </div>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="p" className="t-body">
                {care.look}
              </Reveal>
              <Reveal as="p" index={1} className="t-display t-h3">
                {care.see}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal as="ul" className="rdr-chips">
                {care.behind.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </Reveal>
              <Reveal as="p" index={1} className="t-statement">
                {care.so}
              </Reveal>
              <Reveal as="p" index={2} className="t-display t-h2 t-accent">
                {care.dont}
              </Reveal>
              <Reveal index={3}>
                <Lines items={care.did} className="t-statement" />
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── My goal for you ───────── */}
      <Section id="goal" ground="dark">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {goal.title}
            </Reveal>
            <Reveal as="p" index={1} className="t-sub t-accent">
              {goal.sub}
            </Reveal>
          </div>
          <div className="split split-7-5">
            <Reveal>
              <List items={goal.wants} />
            </Reveal>
            <Reveal as="p" index={1} className="t-display t-h3">
              {goal.because}
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── One door ───────── */}
      <Section id="door" ground="light">
        <div className="stack-xl">
          <div className="split split-6-6">
            <div className="stack">
              {door.one.map((l, i) => (
                <Reveal as="p" key={l} index={i} className="t-giant t-giant-col">
                  {l}
                </Reveal>
              ))}
              <Reveal as="h2" index={3} className="t-sub">
                {door.can}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal>
                <Chain items={door.chain} />
              </Reveal>
              <Reveal index={1}>
                <Lines items={door.promise} />
              </Reveal>
            </div>
          </div>
          <div className="split split-7-5">
            <Reveal as="p" className="t-display t-h2 t-accent">
              {door.big}
            </Reveal>
            <Reveal index={1}>
              <Lines items={door.visibility} className="t-statement" />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── Invitation ───────── */}
      <Section id="invitation" ground="dark">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {invitation.title}
            </Reveal>
            <div className="stack">
              <Reveal as="p" className="t-sub t-soft">
                {invitation.sub1}
              </Reveal>
              <Reveal as="p" index={1} className="t-sub">
                {invitation.sub2}
              </Reveal>
            </div>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="ul" className="rdr-strike">
                {invitation.nots.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </Reveal>
              <Reveal as="p" index={1} className="t-body">
                {invitation.but}
              </Reveal>
              <Reveal as="p" index={2} className="t-body">
                {invitation.to}
              </Reveal>
            </div>
            <div className="stack-lg">
              <ul className="rdr-bar" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                {invitation.numbers.map((n, i) => (
                  <Reveal as="li" key={n} index={i % 2}>
                    {n}
                  </Reveal>
                ))}
              </ul>
              <Reveal as="p" className="t-body">
                {invitation.stories}
              </Reveal>
              <ul className="rdr-list">
                {invitation.cases.map((c, i) => (
                  <Reveal as="li" key={c} index={i} style={{ fontWeight: 760, fontStretch: "108%" }}>
                    {c}
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
          <Reveal>
            <Lines items={invitation.interest} className="t-statement" />
          </Reveal>
        </div>
      </Section>

      {/* ───────── Step forward ───────── */}
      <Section id="forward" ground="light">
        <div className="stack-xl">
          <div className="split split-5-7">
            <Reveal as="h2" className="t-display t-h2">
              {stepForward.title}
            </Reveal>
            <Reveal>
              <List items={stepForward.tell} />
            </Reveal>
          </div>
          <Reveal as="p" className="t-giant t-accent">
            {stepForward.sub}
          </Reveal>
          <div className="stack">
            {stepForward.big.map((l, i) => (
              <Reveal as="p" key={l} index={i} className={`t-display t-h1 ${i === 2 ? "t-accent" : i === 1 ? "t-soft" : ""}`}>
                {l}
              </Reveal>
            ))}
          </div>
          <ul className="rdr-ctagrid" aria-label="Apply">
            {stepForward.ctas.map((c, i) => (
              <Reveal as="li" key={c.label} index={i % 3} className={c.primary ? "primary" : ""}>
                <ApplyButton offer={c.key} source="final" className={c.primary ? "rbtn rbtn-lg" : "rbtn rbtn-quiet"}>
                  {c.label}
                </ApplyButton>
              </Reveal>
            ))}
          </ul>
          <div className="split split-5-7">
            <Reveal className="rdr-sign">
              {assets.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assets.signature} alt="Boss RDR's signature" style={{ maxWidth: 280, height: "auto" }} />
              ) : (
                <p className="script">{stepForward.signoff[0]}</p>
              )}
              <p className="name">{stepForward.signoff[1]}</p>
              <p className="t-soft">{stepForward.signoff[2]}</p>
            </Reveal>
            {assets.heroPhoto ? (
              <Reveal>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="rdr-photo" src={assets.heroPhoto} alt="Boss RDR with entrepreneurs" loading="lazy" />
              </Reveal>
            ) : (
              <Reveal>
                <LiteYouTube id={videos.talks[4].id} title={videos.talks[4].title} />
              </Reveal>
            )}
          </div>
        </div>
      </Section>

      {/* ───────── Final proof bar and close ───────── */}
      <footer data-ground="dark" className="rdr-ground-dark section">
        <div className="wrap stack-xl">
          <ul className="rdr-bar" aria-label="Proof">
            {finalBar.items.map((it, i) => {
              const [n, ...r] = it.split(" ");
              return (
                <Reveal as="li" key={it} index={i % 3}>
                  <b>{n}</b>
                  {r.join(" ")}
                </Reveal>
              );
            })}
          </ul>
          <div className="stack-lg">
            <Reveal>
              <LogoWall names={brands} logos={assets.brandLogos} />
            </Reveal>
            <Reveal index={1}>
              <Marquee names={media} logos={assets.mediaLogos} />
            </Reveal>
          </div>
          <div className="split split-7-5">
            <div className="stack">
              <Reveal as="p" className="t-display t-h1">
                {finalBar.title}
              </Reveal>
              <Reveal as="p" index={1} className="t-sub t-soft">
                {finalBar.sub}
              </Reveal>
            </div>
            <Reveal index={2} style={{ alignSelf: "end" }}>
              <ApplyButton className="rbtn rbtn-lg" source="footer">
                {cta.primary}
              </ApplyButton>
            </Reveal>
          </div>
          <div className="rdr-foot">
            <span>RDR Business Solutions Inc. · Founded by Reymond “Boss RDR” delos Reyes</span>
            <span className="socials">
              <a href={socials.facebook} target="_blank" rel="noopener">
                Facebook
              </a>
              <a href={socials.youtube} target="_blank" rel="noopener">
                YouTube
              </a>
              <a href={socials.tiktok} target="_blank" rel="noopener">
                TikTok
              </a>
              <a href={socials.instagram} target="_blank" rel="noopener">
                Instagram
              </a>
              <a href={socials.spotify} target="_blank" rel="noopener">
                Spotify
              </a>
              <a href={socials.site} target="_blank" rel="noopener">
                rdrbsi.com
              </a>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
