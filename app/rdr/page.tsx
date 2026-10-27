import { assets } from "@/lib/rdr/assets";
import { photoCredits, photos } from "@/lib/rdr/media";
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
import { NextEvent } from "@/components/rdr/Events";
import { Attempts, Checklist, Compound, Inquiries, LogoWall, Marquee, OutletGrid, PlatformBar, TenX } from "@/components/rdr/Diagrams";
import { GrowthCurve, HeroWall, Letter, Phones, Radial, Serp, Stepper, Tree, VideoWall } from "@/components/rdr/v2server";
import { Bento, Compare, Toggle } from "@/components/rdr/v2";

export const dynamic = "force-dynamic";

function Section({ id, ground, children, className = "section" }: { id?: string; ground: "dark" | "light"; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} data-ground={ground} className={`rdr-ground-${ground} ${className}`}>
      <div className="wrap">{children}</div>
    </section>
  );
}

const Head = ({ title, sub, center = false }: { title: string; sub?: string; center?: boolean }) => (
  <div className={`head2 ${center ? "center" : ""}`}>
    <Reveal as="h2" className="t-display t-h2">
      {title}
    </Reveal>
    {sub && (
      <Reveal as="p" index={1} className="t-sub">
        {sub}
      </Reveal>
    )}
  </div>
);

const Chips = ({ items, hot }: { items: string[]; hot?: RegExp }) => (
  <ul className="rdr-chips">
    {items.map((t) => (
      <li key={t} className={hot?.test(t) ? "hot" : ""}>
        {t}
      </li>
    ))}
  </ul>
);

const List = ({ items, two = false }: { items: string[]; two?: boolean }) => (
  <ul className={`rdr-list ${two ? "rdr-list-2" : ""}`}>
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);

const Img = ({ p, className }: { p: { src: string; alt: string }; className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={p.src} alt={p.alt} loading="lazy" className={className} />
);

export default function Page() {
  const wallIds = videos.talks.map((v) => v.id).concat([videos.hero.id, videos.pablings.id]);
  const heroStats = [
    { n: 1.4, d: 1, s: "B+", label: "Combined views" },
    { n: 972.5, d: 1, s: "M", label: "Organic Facebook views" },
    { n: 2.5, d: 1, s: "M", label: "Facebook followers" },
    { n: 100, d: 0, s: "+", label: "Brands accelerated" },
  ];

  return (
    <main id="top">
      <Nav />
      <ApplyModal />

      {/* ───────── 1. Hero: the studio is already live ───────── */}
      <header data-ground="dark" className="rdr-ground-dark rdr-hero2">
        <HeroWall ids={wallIds} />
        <div className="scrim" aria-hidden="true" />
        <div className="light red" aria-hidden="true" />
        <div className="light gold" aria-hidden="true" />
        <div className="wrap grid">
          <div className="stack-lg">
            <p className="pill" data-rise="" style={{ ["--i" as string]: 0 }}>
              <i aria-hidden="true" />
              {hero.sender}
            </p>
            <h1 className="t-display" data-rise="" style={{ ["--i" as string]: 1 }}>
              {hero.title}
            </h1>
            <p className="sub" data-rise="" style={{ ["--i" as string]: 2 }}>
              {hero.claimLead} <b className="t-gold">{hero.claimNumber}</b> {hero.claimTail} {hero.sub}
            </p>
            <div className="actions" data-rise="" style={{ ["--i" as string]: 3 }}>
              <ApplyButton className="rbtn rbtn-lg" source="hero">
                {cta.primary}
              </ApplyButton>
              <a className="rbtn rbtn-quiet" href="#numbers">
                See the numbers
              </a>
              <span className="free">{hero.free}</span>
            </div>
            <ul className="stats" data-rise="" style={{ ["--i" as string]: 4 }} aria-label="RDR platform numbers">
              {heroStats.map((s, i) => (
                <li key={s.label} className="stat">
                  <b>
                    <NumberTicker value={s.n} decimals={s.d} suffix={s.s} delay={400 + i * 120} />
                  </b>
                  <span>{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="player" data-rise="" style={{ ["--i" as string]: 3 }}>
            <span className="tag">Watch Boss RDR</span>
            <LiteYouTube id={videos.hero.id} title={videos.hero.title} />
            <span className="tag2">{hero.ready}</span>
          </div>
        </div>
      </header>

      {/* ───────── 2. Who is already in the room ───────── */}
      <section data-ground="dark" className="rdr-ground-dark rdr-rows" aria-label="Brands and media">
        <Marquee names={brands} logos={assets.brandLogos} />
        <div className="rdr-marquee rev gold" role="img" aria-label={media.join(", ")}>
          <div className="track" aria-hidden="true">
            {media.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          <div className="track" aria-hidden="true">
            {media.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 3. You don't need more content ───────── */}
      <Section id="letter" ground="light">
        <div className="split split-5-7">
          <div className="stack-lg">
            <Reveal as="p" className="t-h3 t-display">
              {letter.intro}
            </Reveal>
            <Reveal as="h2" index={1} className="t-display t-h2 glow-red" style={{ color: "var(--tally)" }}>
              {letter.bold}
            </Reveal>
            <Reveal as="p" index={2} className="t-statement">
              {letter.need}
            </Reveal>
            <Reveal index={3}>
              <Chips items={letter.people} hot={/MONEY|INTENT/} />
            </Reveal>
            <Reveal index={4}>
              <Letter title="Boss RDR on what you don't need" lines={[letter.line1, ...letter.dontNeed, letter.capable]} />
            </Reveal>
          </div>
          <Reveal>
            <Phones quotes={letter.quotes} />
          </Reveal>
        </div>
      </Section>

      {/* ───────── 4. Three truths on TV static ───────── */}
      <Section ground="dark" className="section-tight">
        <div className="stack-lg">
          <Reveal as="p" className="t-statement t-soft">
            {letter.because}
          </Reveal>
          <Reveal className="rdr-static">
            <ul className="rdr-truths">
              {letter.truths.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Reveal>
          <div className="split split-5-7">
            <Reveal as="p" className="t-sub">
              {letter.why}
            </Reveal>
            <div className="stack">
              <Reveal as="p" className="t-soft">
                {letter.notSimply}
              </Reveal>
              <Reveal as="p" index={1} className="t-h3 t-display">
                {letter.built}
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── 5. The numbers ───────── */}
      <Section id="numbers" ground="light">
        <div className="stack-xl">
          <div className="split split-6-6">
            <Head title={numbers.title} sub={numbers.sub} />
            <Reveal index={2}>
              <Letter title="Why Boss RDR shows numbers first" lines={numbers.lines} />
            </Reveal>
          </div>
          <ul className="rdr-board" aria-label="RDR platform numbers">
            {numbers.tiles.map((t, i) => {
              const [num, ...rest] = t.big.split(" ");
              const n = parseFloat(num.replace(/[^0-9.]/g, ""));
              const dec = (num.match(/\.(\d+)/)?.[1] ?? "").length;
              const plus = num.includes("+") ? "+" : "";
              return (
                <Reveal as="li" key={t.label} index={i % 4} className={`tile ${i === 0 ? "hero-tile" : ""}`}>
                  <p className="big">
                    <NumberTicker value={n} decimals={dec} suffix={plus} /> {rest.join(" ")}
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
          <Reveal>
            <VideoWall items={videos.talks.slice(0, 8)} />
          </Reveal>
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
          <p className="t-caption">{stats.proofNote}</p>
        </div>
      </Section>

      {/* ───────── 6. The story ───────── */}
      <Section id="story" ground="dark">
        <div className="stack-xl">
          <Head title={story.title} sub={story.sub} />
          <div className="rdr-story">
            <Reveal className="rdr-still">
              <Img p={photos.studioCamera} />
              <div className="veil" />
              <span className="tally">
                <i aria-hidden="true" />
                On air
              </span>
              <div className="year">
                <b>2021</b>
                <span>{story.studio[0]}</span>
              </div>
            </Reveal>
            <Reveal index={1}>
              <GrowthCurve
                beats={[
                  { label: "Made money" },
                  { label: "Lost money" },
                  { label: "Failure after failure" },
                  { label: "2021: a small studio", hot: true },
                  { label: "Almost nobody watching" },
                  { label: "One video broke through", hot: true },
                  { label: "1.4B+ combined views", hot: true },
                ]}
              />
            </Reveal>
          </div>
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="p" className="t-display t-h3 t-gold glow-gold">
                {story.lessonBig}
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
                <Letter title="The story, in Boss RDR's words" big={story.lead} lines={[story.before, ...story.beats, story.lesson, ...story.mine, ...story.studio, ...story.climb, story.today, ...story.because]} />
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── 7. The painful question ───────── */}
      <Section id="pain" ground="light">
        <div className="stack-xl">
          <Head title={painful.title} sub={painful.sub} />
          <div className="split split-4-8">
            <div className="stack-lg">
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
              <Reveal index={1}>
                <Serp
                  query="your business name"
                  other={{ title: painful.leader[1], poster: painful.compares[1].poster ?? "", items: ["No founder story", "No media credibility", "No proof, no authority"], verdict: painful.compares[3].or ?? "" }}
                  leader={{ title: painful.leader[0], items: [painful.compares[0].ask[0], painful.compares[1].ask[0], painful.compares[2].ask.join(" "), painful.compares[3].ask[0]], verdict: painful.compares[3].feel ?? "" }}
                />
              </Reveal>
            </div>
          </div>
          <div className="split split-4-8">
            <Reveal as="p" className="t-h3 t-display">
              {painful.matters}
            </Reveal>
            <div className="stack-lg">
              <Reveal as="ul" className="rdr-ledger glass" style={{ padding: "8px 22px" }} aria-label="The loss nobody calculates">
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
              <Reveal as="p" index={1} className="t-statement t-soft">
                {painful.never}
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── 8. Before the sale: the funnel ───────── */}
      <Section id="before" ground="dark" className="section-tight">
        <div className="stack-xl">
          <Head title={beforeSale.title} sub={beforeSale.sub} />
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
      <section data-ground="dark" className="rdr-ground-dark">
        <Funnel old={beforeSale.old} words={beforeSale.funnel} isnt={beforeSale.isnt} its={beforeSale.its} game={beforeSale.game} />
      </section>
      <Section ground="dark" className="section-tight">
        <div className="split split-6-6">
          <div className="stack-lg">
            <Reveal as="blockquote" className="t-quote t-soft">
              {beforeSale.quote}
            </Reveal>
            <Reveal as="blockquote" index={1} className="t-display t-h2 t-gold glow-gold">
              {beforeSale.nextQ}
            </Reveal>
            <Reveal as="p" index={2} className="t-display t-h3">
              {beforeSale.care}
            </Reveal>
          </div>
          <div className="stack-lg">
            <Reveal>
              <List items={beforeSale.questions} />
            </Reveal>
            <Reveal index={1}>
              <Letter title="Why one million views does not impress Boss RDR" lines={[beforeSale.notImpressed, beforeSale.quote, beforeSale.next, beforeSale.nextQ, beforeSale.businessman]} />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── 9. The dream ───────── */}
      <Section id="dream" ground="light">
        <div className="stack-xl">
          <Head title={dream.title} sub={dream.sub} />
          <div className="split split-6-6" style={{ alignItems: "center" }}>
            <Reveal>
              <Radial core="Your next sales call" items={dream.seen.map((s) => s.replace(/^They've /, "").replace(/^They /, "").replace(/\.$/, ""))} />
            </Reveal>
            <div className="stack-lg">
              <Reveal as="p" className="t-statement">
                {dream.stranger}
              </Reveal>
              <Reveal as="p" index={1} className="t-display t-h3">
                {dream.zero} <span className="t-gold">{dream.trust}</span>
              </Reveal>
              <Reveal index={2}>
                <Chips items={dream.with} />
              </Reveal>
              <Reveal as="p" index={3} className="t-h3 t-display">
                {dream.asset}
              </Reveal>
              <Reveal index={4}>
                <Letter title="Imagine this, in Boss RDR's words" lines={[dream.imagine, dream.stranger, ...dream.seen, dream.so, dream.zero, dream.trust, dream.now, dream.stops]} />
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── 10. Money ───────── */}
      <Section id="money" ground="dark">
        <div className="stack-xl">
          <Head title={money.title} sub={money.sub} />
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="p" className="t-h3 t-display">
                {money.think}
              </Reveal>
              <Reveal as="p" index={1} className="t-statement">
                {money.one}
              </Reveal>
              <Reveal index={2}>
                <Chips items={money.amounts} />
              </Reveal>
              <Reveal index={3}>
                <List items={money.worths} />
              </Reveal>
              <Reveal index={4}>
                <Letter title="The ROI conversation Boss RDR cares about" lines={[...money.whatIf, money.roi, `${money.not} ${money.notQ}`, `${money.but} ${money.butQ}`]} />
              </Reveal>
            </div>
            <Reveal className="field">
              <Calculator />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── 11. Case studies ───────── */}
      <Section id="results" ground="light">
        <div className="stack-xl">
          <Head title={believe.title} sub={believe.sub} />

          <Reveal as="article" className="rdr-case2">
            <div className="media">
              <Img p={photos.barbershop} />
              <div className="veil" />
              <div className="inner">
                <LiteYouTube id={videos.pablings.id} title={videos.pablings.title} />
              </div>
            </div>
            <div className="body">
              <span className="result">
                <i aria-hidden="true" />
                Reported in RDR's published case study
              </span>
              <h3 className="t-display">{pablings.title}</h3>
              <p className="t-sub">{pablings.sub}</p>
              <div className="kpi">
                <b>
                  ~<NumberTicker value={200} /> outlets
                </b>
                <span>{pablings.reported.replace(/,$/, "")}</span>
              </div>
              <OutletGrid />
              <Chips items={pablings.see} />
              <Letter title="The Pablings lesson, in full" lines={[...pablings.lines, pablings.through, `${pablings.reported} ${pablings.reportedBig}${pablings.reportedTail}`, pablings.lesson, ...pablings.didNot, pablings.did, pablings.and, pablings.worth]} />
              <ApplyButton offer="talks" source="case-pablings">
                {cta.talks}
              </ApplyButton>
            </div>
          </Reveal>

          <Reveal as="article" className="rdr-case2">
            <div className="media">
              <Img p={photos.industrial} />
              <div className="veil" />
              <div className="inner">
                <LiteYouTube id={videos.cmv.id} title={videos.cmv.title} emptyLabel="CMV interview" />
              </div>
            </div>
            <div className="body">
              <span className="result">
                <i aria-hidden="true" />
                Reported in RDR's published case study
              </span>
              <h3 className="t-display">{cmv.title}</h3>
              <p className="t-sub">{cmv.sub}</p>
              <div className="kpi">
                <b>{cmv.big}</b>
                <span>{cmv.along}</span>
              </div>
              <TenX />
              <blockquote className="t-quote t-soft">{cmv.excuse}</blockquote>
              <Chips items={cmv.products} />
              <Letter title="Why a hard-to-market business still has a story" lines={[cmv.fav, cmv.excuse, cmv.really, ...cmv.not, cmv.talking, cmv.exactly, ...cmv.machine, cmv.sell, ...cmv.show, cmv.reported, cmv.big, cmv.along, cmv.think, cmv.sexy, cmv.need]} />
              <div className="stack">
                <p className="t-sub">{cmv.ask}</p>
                <p className="t-soft">{cmv.askSub}</p>
              </div>
              <ApplyButton offer="talks" source="case-cmv">
                {cta.talks}
              </ApplyButton>
            </div>
          </Reveal>

          <Reveal as="article" className="rdr-case2">
            <div className="media">
              <Img p={photos.skincare} />
              <div className="veil" />
              <div className="inner">
                <LiteYouTube id={videos.cinemaSkin.id} title={videos.cinemaSkin.title} emptyLabel="Cinema Skin feature" />
              </div>
            </div>
            <div className="body">
              <span className="result">
                <i aria-hidden="true" />
                Reported in RDR's published case study
              </span>
              <h3 className="t-display">{cinema.title}</h3>
              <p className="t-sub">{cinema.sub}</p>
              <div className="kpi">
                <b>Inquiry surge</b>
                <span>{cinema.reportedBold}</span>
              </div>
              <Inquiries shots={assets.cinemaSkin.inquiries} />
              <Chips items={cinema.thousands} />
              <p className="t-display t-h3">{cinema.big}</p>
              <Letter title="The Cinema Skin story, in full" lines={[...cinema.beauty, cinema.commodity, cinema.goalNot, cinema.look, cinema.goalWas, ...cinema.understand, `${cinema.reported} ${cinema.reportedBold}`, cinema.mean, cinema.notEnt]} />
              <p className="t-sub">{cinema.ask}</p>
              <ApplyButton offer="stories" source="case-cinema">
                {cta.story}
              </ApplyButton>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ───────── 12. Content vs brand acceleration ───────── */}
      <Section id="difference" ground="dark">
        <div className="stack-xl">
          <Head title={difference.title} sub="Drag the handle." />
          <Reveal>
            <Compare a={{ title: difference.contentSays, items: difference.pairs.map((p) => p.content) }} b={{ title: difference.accelSays, items: difference.pairs.map((p) => p.accel) }} />
          </Reveal>
        </div>
      </Section>

      {/* ───────── 13. Why work with me ───────── */}
      <Section id="why" ground="light">
        <div className="stack-xl">
          <Head title={why.title} sub={why.sub} />
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="ul" className="rdr-recap">
                {why.numbers.map((n) => {
                  const [big, ...rest] = n.split(" ");
                  return (
                    <li key={n}>
                      <b>{big}</b>
                      {rest.join(" ").replace(/\.$/, "")}
                    </li>
                  );
                })}
              </Reveal>
              <Reveal as="p" index={1} className="t-h3 t-display">
                {why.attempts}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal>
                <Attempts />
              </Reveal>
              <Reveal index={1}>
                <Chips items={why.list} hot={/worked|shared|travelled/} />
              </Reveal>
              <Reveal as="p" index={2} className="t-statement">
                {why.notHiring} <span className="t-gold">{why.benefit}</span>
              </Reveal>
              <Reveal index={3}>
                <Letter title="Thousands of attempts, in Boss RDR's words" lines={[why.look, why.theory, why.attempts, why.years, why.notHiring, why.already, why.benefit]} />
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── 14. National media ───────── */}
      <Section id="media" ground="dark">
        <div className="stack-xl">
          <Head title={mediaSection.title} sub={mediaSection.lead} />
        </div>
      </Section>
      <section data-ground="dark" className="rdr-ground-dark rdr-rows" aria-label="Media platforms">
        <Marquee names={media} logos={assets.mediaLogos} />
      </section>
      <Section ground="dark" className="section-tight">
        <div className="split split-5-7">
          <div className="stack-lg">
            <Reveal as="p" className="t-display t-h2 t-gold glow-gold">
              {mediaSection.compounds}
            </Reveal>
            <Reveal as="p" index={1} className="t-statement">
              {mediaSection.eventually}
            </Reveal>
          </div>
          <div className="stack-lg">
            <Reveal className="glass" style={{ padding: 24 }}>
              <Compound labels={mediaSection.chain} />
            </Reveal>
            <Reveal index={1}>
              <Letter title="Why authority compounds" lines={[mediaSection.tail, mediaSection.mention, mediaSection.compounds, ...mediaSection.chain, mediaSection.eventually]} />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── 15. The platforms ───────── */}
      <Section id="platforms" ground="light">
        <div className="stack-xl">
          <Head title={offersIntro.title} sub={offersIntro.sub} />
          <Reveal as="p" className="t-display t-h3">
            {which.title} <span className="t-gold">{which.sub}</span>
          </Reveal>
          <Reveal>
            <Bento map={which.map} talksIds={videos.talks.map((v) => v.id)} nextEvent={<NextEvent cta={cta.events} />} />
          </Reveal>
          <div className="split split-7-5">
            <Reveal as="p" className="t-statement">
              {which.still.join(" ")}
            </Reveal>
            <Reveal index={1}>
              <ApplyButton offer="general" source="which" className="rbtn rbtn-gold rbtn-lg">
                {cta.choose}
              </ApplyButton>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── 16. Who it's for ───────── */}
      <Section id="who" ground="dark">
        <div className="stack-xl">
          <Head title={whoFor.title} sub={whoFor.sub} />
          <div className="rdr-fit">
            <Reveal className="field field-3 stack-lg">
              <ul className="rdr-strike">
                {whoFor.ifs.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <p className="t-statement">{whoFor.wont}</p>
              <p className="t-soft">{whoFor.expose}</p>
            </Reveal>
            <Reveal index={1} className="field stack-lg">
              <p className="t-statement">{whoFor.but.join(" ")}</p>
              <p className="t-display t-h3 t-gold">{whoFor.interesting}</p>
              <p style={{ fontWeight: 650 }}>{whoFor.fit}</p>
              <Chips items={whoFor.list} />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── 17. ROI test ───────── */}
      <Section id="roi" ground="light">
        <div className="stack-xl">
          <Head title={roiTest.title} sub={roiTest.sub} />
          <div className="split split-6-6">
            <Reveal as="ul" className="rdr-recap">
              {roiTest.questions.map((q) => (
                <li key={q} style={{ fontSize: 16, color: "var(--fg)" }}>
                  {q}
                </li>
              ))}
            </Reveal>
            <div className="stack-lg">
              <Reveal as="p" className="t-statement">
                {roiTest.compare}
              </Reveal>
              <Reveal index={1}>
                <ul className="rdr-pairs">
                  <li>
                    <div className="a">
                      {roiTest.not} {roiTest.notQ}
                    </div>
                    <div className="b" style={{ background: "var(--gold)", color: "var(--on-gold)" }}>
                      {roiTest.but} {roiTest.butQ}
                    </div>
                  </li>
                </ul>
              </Reveal>
              <Reveal index={2}>
                <Letter title="How a business owner should think" lines={[roiTest.how, ...roiTest.cheap]} />
              </Reveal>
              <Reveal index={3}>
                <a className="rbtn rbtn-quiet" href="#money">
                  Run your own numbers
                </a>
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── 18. Ecosystem ───────── */}
      <Section id="ecosystem" ground="dark">
        <div className="stack-xl">
          <Head title={ecosystem.title} />
          <Reveal>
            <LogoWall names={brands} logos={assets.brandLogos} />
          </Reveal>
          <div className="split split-5-7">
            <Reveal as="p" className="t-soft">
              {ecosystem.more} {ecosystem.different.join(" ")} {ecosystem.same}
            </Reveal>
            <Reveal as="p" className="t-display t-h2 t-gold glow-gold">
              {ecosystem.big}
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── 19. How it works ───────── */}
      <Section id="how" ground="light">
        <div className="stack-xl">
          <Head title={howItWorks.title} />
          <Reveal>
            <Stepper steps={howItWorks.steps} />
          </Reveal>
          <Reveal>
            <ApplyButton className="rbtn rbtn-lg" source="how">
              {cta.primary}
            </ApplyButton>
          </Reveal>
        </div>
      </Section>

      {/* ───────── 20. Questions ───────── */}
      <Section id="questions" ground="dark">
        <div className="rdr-obj">
          {objections.map((o, i) => (
            <Reveal as="details" key={o.q} index={i % 3} open={i === 0 ? true : undefined}>
              <summary>
                <span>{o.q}</span>
                <i aria-hidden="true" />
              </summary>
              <div className="body">
                {o.a && <p className="t-sub t-gold">{o.a}</p>}
                {o.paras.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {o.bold && (
                  <p className="t-statement" style={{ fontWeight: 760 }}>
                    {o.bold}
                  </p>
                )}
                {o.list && <Chips items={o.list} />}
                {o.after?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {o.list2 && <List items={o.list2} />}
                {o.big && <p className="t-display t-h3 t-gold">{o.big}</p>}
                {o.close?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ───────── 21. Philosophy ───────── */}
      <Section id="philosophy" ground="light">
        <div className="stack-xl">
          <Head title={philosophy.title} sub={philosophy.sub} center />
          <Reveal as="p" className="t-statement" style={{ textAlign: "center", marginInline: "auto" }}>
            {philosophy.want} <b className="t-gold">{philosophy.wantBold}</b> {philosophy.diff}
          </Reveal>
          <Reveal>
            <Toggle pairs={philosophy.pairs} />
          </Reveal>
          <Reveal as="p" className="t-display t-h2" style={{ textAlign: "center" }}>
            {philosophy.big}
          </Reveal>
          <Reveal>
            <Letter title="Famous or valuable, in Boss RDR's words" lines={[...philosophy.pairs.flatMap((p) => [p.famous, p.valuable]), ...philosophy.fame, philosophy.big]} />
          </Reveal>
        </div>
      </Section>

      {/* ───────── 22. Why I care, and the goal ───────── */}
      <Section id="care" ground="dark">
        <div className="stack-xl">
          <Reveal className="rdr-photoquote">
            <Img p={photos.audienceScreen} />
            <div className="veil" />
            <div className="stack-lg">
              <h2 className="t-display t-h3 t-gold">{care.title}</h2>
              <div className="stack">
                {care.lines.slice(0, 3).map((l) => (
                  <Words key={l} text={l} className="q" />
                ))}
              </div>
              <p className="t-statement">{care.see}</p>
              <Chips items={care.behind} />
              <p className="t-display t-h3">{care.dont}</p>
            </div>
          </Reveal>
          <Reveal>
            <Letter title="Why Boss RDR cares, in full" lines={[...care.lines, care.look, care.see, ...care.behind, care.so, care.dont, ...care.did]} />
          </Reveal>
          <div className="split split-5-7">
            <Head title={goal.title} sub={goal.sub} />
            <div className="stack-lg">
              <Reveal>
                <List items={goal.wants} />
              </Reveal>
              <Reveal as="p" index={1} className="t-display t-h3 t-gold">
                {goal.because}
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── 23. One door ───────── */}
      <Section id="door" ground="light">
        <div className="stack-xl">
          <div className="head2 center">
            <Reveal as="h2" className="t-display t-h2">
              {door.one.join(" ")}
            </Reveal>
            <Reveal as="p" index={1} className="t-sub">
              {door.can}
            </Reveal>
          </div>
          <Reveal>
            <Tree seed="One piece of content" chain={door.chain} />
          </Reveal>
          <div className="split split-6-6">
            <Reveal as="p" className="t-display t-h3 t-gold glow-gold">
              {door.big}
            </Reveal>
            <div className="stack">
              <Reveal as="p" className="t-statement">
                {door.visibility.join(" ")}
              </Reveal>
              <Reveal index={1}>
                <Letter title="Can Boss RDR promise which door?" lines={[...door.promise, door.big, ...door.visibility]} />
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── 24. Invitation ───────── */}
      <Section id="invitation" ground="dark">
        <div className="stack-xl">
          <Head title={invitation.title} sub={`${invitation.sub1} ${invitation.sub2}`} />
          <div className="split split-5-7">
            <div className="stack-lg">
              <Reveal as="ul" className="rdr-strike">
                {invitation.nots.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </Reveal>
              <Reveal as="p" index={1} className="t-statement">
                {invitation.but} {invitation.to}
              </Reveal>
            </div>
            <div className="stack-lg">
              <Reveal as="ul" className="rdr-recap">
                {invitation.numbers.map((n) => {
                  const [big, ...rest] = n.split(" ");
                  return (
                    <li key={n}>
                      <b>{big}</b>
                      {rest.join(" ")}
                    </li>
                  );
                })}
              </Reveal>
              <Reveal as="p" className="t-soft">
                {invitation.stories}
              </Reveal>
              <Reveal>
                <List items={invitation.cases} />
              </Reveal>
              <Reveal>
                <Letter title="The kind of outcomes that interest Boss RDR" lines={invitation.interest} />
              </Reveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────── 25. Step forward ───────── */}
      <Section id="forward" ground="light">
        <div className="stack-xl">
          <div className="head2 center">
            <Reveal as="h2" className="t-display t-h2">
              {stepForward.title}
            </Reveal>
            <Reveal as="p" index={1} className="t-giant t-accent glow-red" style={{ color: "var(--tally)" }}>
              {stepForward.sub}
            </Reveal>
          </div>
          <div className="split split-6-6">
            <Reveal>
              <List items={stepForward.tell} />
            </Reveal>
            <div className="stack">
              {stepForward.big.map((l, i) => (
                <Reveal as="p" key={l} index={i} className={`t-display t-h2 ${i === 2 ? "t-gold glow-gold" : i === 1 ? "t-soft" : ""}`}>
                  {l}
                </Reveal>
              ))}
            </div>
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
            <Reveal className="rdr-still" style={{ minHeight: 320 }}>
              {assets.heroPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assets.heroPhoto} alt="Boss RDR with entrepreneurs" loading="lazy" />
              ) : (
                <Img p={photos.stageSpeaker} />
              )}
              <div className="veil" />
              <div className="year">
                <span>{hero.ready}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ───────── 26. Final proof bar and close ───────── */}
      <footer data-ground="dark" className="rdr-ground-dark section">
        <div className="wrap stack-xl">
          <ul className="rdr-bar" aria-label="Proof">
            {finalBar.items.map((it, i) => {
              const [n, ...r] = it.split(" ");
              return (
                <Reveal as="li" key={it} index={i % 3}>
                  <b className="t-gold">{n}</b>
                  {r.join(" ")}
                </Reveal>
              );
            })}
          </ul>
          <Reveal>
            <LogoWall names={brands} logos={assets.brandLogos} />
          </Reveal>
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
          <p className="rdr-credits">
            Video stills are from Boss RDR's own YouTube channels. Atmosphere photography on Unsplash by{" "}
            {photoCredits.map((p, i) => (
              <span key={p.link}>
                <a href={p.link} target="_blank" rel="noopener">
                  {p.credit}
                </a>
                {i < photoCredits.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </div>
      </footer>
    </main>
  );
}
