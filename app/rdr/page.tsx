import { assets } from "@/lib/rdr/assets";
import { photoCredits, photos, yt } from "@/lib/rdr/media";
import { brandMark, mediaMark } from "@/lib/rdr/logos";
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
import { ApplyModal } from "@/components/rdr/ApplyModal";
import { ApplyButton, Reveal } from "@/components/rdr/ui";
import { NumberTicker } from "@/components/rdr/NumberTicker";
import { LiteYouTube } from "@/components/rdr/LiteYouTube";
import { Calculator } from "@/components/rdr/Calculator";
import { MarkItem, Nav, OpenOnHash, Platforms, Rail, Share } from "@/components/rdr/v3";

export const dynamic = "force-dynamic";

/* ---------- small building blocks ---------- */
const Mark = () => (
  <a href="#top" className="mark" aria-label="RDR Business Solutions, home">
    {assets.logo ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={assets.logo} alt="" />
    ) : (
      <span className="ring" aria-hidden="true">
        RDR
      </span>
    )}
    <span className="word">
      <b>RDR</b>
      <span>Business Solutions</span>
    </span>
  </a>
);

function Section({ id, ground = "deep", tight = false, children }: { id?: string; ground?: "deep" | "navy" | "rise"; tight?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`section ground-${ground} ${tight ? "tight" : ""}`}>
      <div className="wrap">{children}</div>
    </section>
  );
}

const Head = ({ eyebrow, title, sub, center = false, read }: { eyebrow?: string; title: string; sub?: string; center?: boolean; read?: string }) => (
  <div className={`head ${center ? "center" : ""}`}>
    {eyebrow && (
      <Reveal as="p" className="eyebrow">
        {eyebrow}
      </Reveal>
    )}
    <Reveal as="h2" index={1} className="serif t-h2">
      {title}
    </Reveal>
    {sub && (
      <Reveal as="p" index={2} className="t-sub">
        {sub}
      </Reveal>
    )}
    {read && (
      <Reveal index={3}>
        <a className="readmore" href={`#${read}`}>
          Read this part of Boss RDR&rsquo;s letter
        </a>
      </Reveal>
    )}
  </div>
);

const P = ({ lines, className }: { lines: string[]; className?: string }) => (
  <>
    {lines.map((l) => (
      <p key={l} className={className}>
        {l}
      </p>
    ))}
  </>
);
const UL = ({ items }: { items: string[] }) => (
  <ul>
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);
const Part = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <details id={id}>
    <summary>{title}</summary>
    <div className="body">{children}</div>
  </details>
);

type Step = { title: string; lines?: string[]; list?: string[]; asks?: string[]; close?: string[]; bold?: string };
const steps = howItWorks.steps as Step[];

/* ---------- the page ---------- */
export default function Page() {
  const platformCards = [
    { key: "n1m", name: "N1M", tag: "Negosyo Isang Minuto", image: yt(videos.talks[6].id), alt: "" },
    { key: "vlog", name: "RDR Vlog", tag: "Behind the business", image: yt(videos.talks[4].id), alt: "" },
    { key: "talks", name: "RDR Talks", tag: "Founder authority", image: yt(videos.talks[0].id), alt: "" },
    { key: "films", name: "RDR Films", tag: "Premium perception", image: photos.filmSet.src, alt: photos.filmSet.alt },
    { key: "stories", name: "RDR Stories", tag: "The human side", image: yt(videos.pablings.id), alt: "" },
  ];
  const restPlatforms = offers.filter((o) => !platformCards.some((c) => c.key === o.key)).map((o) => ({ key: o.key, name: o.name }));
  const covers: Record<string, { src: string; alt: string }> = {
    talks: { src: yt(videos.talks[0].id, "max"), alt: "" },
    vlog: { src: yt(videos.talks[4].id, "max"), alt: "" },
    n1m: { src: yt(videos.talks[6].id, "max"), alt: "" },
    films: photos.filmSet,
    stories: { src: yt(videos.pablings.id, "max"), alt: "" },
    gci: photos.stageSpeaker,
    studio: photos.tvStudio,
    events: photos.audienceScreen,
    coordination: photos.handshake,
  };
  const share = [
    { label: `Facebook ${(stats.facebookViews / 1e6).toFixed(1)}M views`, value: stats.facebookViews },
    { label: `TikTok ${(stats.tiktokViews / 1e6).toFixed(1)}M views`, value: stats.tiktokViews },
    { label: `YouTube ${(stats.youtubeViews / 1e6).toFixed(1)}M views`, value: stats.youtubeViews },
  ];

  return (
    <main id="top">
      <Nav mark={<Mark />} apply="Apply" />
      <ApplyModal />
      <OpenOnHash />

      {/* 1. Hero */}
      <header className="hero">
        <div className="sky" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assets.heroPhoto || photos.manilaNight.src} alt="" />
        </div>
        <div className="wrap grid">
          <div className="copy">
            <Reveal as="p" className="eyebrow">
              {hero.sender}
            </Reveal>
            <Reveal as="h1" index={1} className="serif t-hero">
              {hero.title}
            </Reveal>
            <Reveal as="p" index={2} className="lead">
              {hero.claimLead} <b>{hero.claimNumber}</b> {hero.claimTail} {hero.sub}
            </Reveal>
            <Reveal index={3} className="actions">
              <ApplyButton className="rbtn rbtn-blue rbtn-lg" source="hero">
                {cta.primary}
              </ApplyButton>
              <a className="rbtn rbtn-ghost rbtn-lg" href="#numbers">
                See the numbers
              </a>
            </Reveal>
            <Reveal as="p" index={4} className="note">
              {hero.free}
            </Reveal>
          </div>
          <Reveal index={2} className="frame">
            <LiteYouTube id={videos.hero.id} title={videos.hero.title} />
          </Reveal>
        </div>
      </header>

      {/* 2. Stats */}
      <div className="wrap">
        <ul className="stats" aria-label="RDR in numbers">
          <li>
            <b>
              <NumberTicker value={1.4} decimals={1} suffix="B+" />
            </b>
            <span>Combined views</span>
          </li>
          <li>
            <b>
              <NumberTicker value={972.5} decimals={1} suffix="M" />
            </b>
            <span>Organic Facebook views</span>
          </li>
          <li>
            <b>
              <NumberTicker value={2.5} decimals={1} suffix="M" />
            </b>
            <span>Facebook followers</span>
          </li>
          <li>
            <b>
              <NumberTicker value={500} suffix="K+" />
            </b>
            <span>YouTube subscribers</span>
          </li>
          <li>
            <b>
              <NumberTicker value={100} suffix="+" />
            </b>
            <span>Brands accelerated</span>
          </li>
        </ul>
      </div>

      {/* 3. Platforms */}
      <Section id="platforms" ground="rise">
        <div className="stack-xl">
          <Head center eyebrow="The RDR platforms" title={offersIntro.title} sub={offersIntro.sub} />
          <Reveal>
            <Platforms cards={platformCards} rest={restPlatforms} covers={covers} />
          </Reveal>
          <Reveal as="p" className="t-soft" style={{ textAlign: "center" }}>
            {which.title} {which.sub} Tap a platform to see what it is for.
          </Reveal>
        </div>
      </Section>

      {/* 4. The letter, opened */}
      <Section id="message" ground="deep" tight>
        <div className="split split-5-7">
          <div className="stack">
            <Reveal as="h2" className="serif t-h2">
              {letter.intro}
            </Reveal>
            <Reveal as="p" index={1} className="t-sub">
              {letter.line1}
            </Reveal>
          </div>
          <div className="stack">
            <Reveal as="p" className="serif t-h3 t-gold">
              {letter.bold}
            </Reveal>
            <Reveal as="p" index={1} className="t-statement">
              {letter.need}
            </Reveal>
            <Reveal as="p" index={2} className="t-body">
              {letter.people.join(" ")}
            </Reveal>
            <Reveal index={3}>
              <a className="readmore" href="#l-letter">
                Read this part of Boss RDR&rsquo;s letter
              </a>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* 5. The truths */}
      <Section ground="navy" tight>
        <div className="band">
          <Reveal as="p" className="eyebrow">
            {letter.because}
          </Reveal>
          <ul className="lines">
            {letter.truths.map((t, i) => (
              <Reveal as="li" key={t} index={i + 1}>
                {t}
              </Reveal>
            ))}
          </ul>
        </div>
      </Section>

      {/* 6. The numbers */}
      <Section id="numbers" ground="deep">
        <div className="stack-xl">
          <Head eyebrow="Proof first" title={numbers.title} sub={numbers.sub} read="l-numbers" />
          <ul className="numbers" aria-label="RDR platform numbers">
            {numbers.tiles.map((t, i) => {
              const [num, ...rest] = t.big.split(" ");
              const n = parseFloat(num.replace(/[^0-9.]/g, ""));
              const dec = (num.match(/\.(\d+)/)?.[1] ?? "").length;
              const plus = num.includes("+") ? "+" : "";
              return (
                <Reveal as="li" key={t.label} index={i % 4} className={i === 0 ? "lead" : ""}>
                  <b>
                    <NumberTicker value={n} decimals={dec} suffix={plus} /> {rest.join(" ")}
                  </b>
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
              <Share parts={share} />
            </Reveal>
          </div>
          <Reveal as="p" className="t-soft">
            {stats.proofNote}
          </Reveal>
        </div>
      </Section>

      {/* 7. The path before the sale */}
      <Section id="before" ground="navy">
        <div className="stack-xl">
          <Head eyebrow="Before the sale" title={beforeSale.title} sub={beforeSale.sub} read="l-before" />
          <ol className="path" aria-label={beforeSale.before}>
            {beforeSale.steps.map((s, i) => (
              <Reveal as="li" key={s} index={i}>
                {s}
              </Reveal>
            ))}
          </ol>
          <div className="stack" style={{ justifyItems: "center", textAlign: "center" }}>
            <Reveal as="p" className="t-soft">
              {beforeSale.isnt} <span className="chain" style={{ display: "inline-flex" }}><span className="old">{beforeSale.old.join(" → ")}</span></span> {beforeSale.its}
            </Reveal>
            <Reveal as="ol" index={1} className="chain" aria-label={beforeSale.funnel.join(", ")}>
              {beforeSale.funnel.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </Reveal>
            <Reveal as="p" index={2} className="t-sub">
              {beforeSale.care}
            </Reveal>
          </div>
        </div>
      </Section>

      {/* 8. Money */}
      <Section id="money" ground="deep">
        <div className="split split-5-7" style={{ alignItems: "start" }}>
          <div className="stack-lg">
            <Head eyebrow="Your numbers" title={money.title} sub={money.sub} read="l-money" />
            <Reveal as="p" className="t-statement">
              {money.one}
            </Reveal>
            <Reveal as="p" index={1} className="t-body">
              {money.roi} {money.not} {money.notQ} {money.but} {money.butQ}
            </Reveal>
          </div>
          <Reveal className="card" index={1}>
            <Calculator />
          </Reveal>
        </div>
      </Section>

      {/* 9. Results */}
      <Section id="results" ground="rise">
        <div className="stack-xl">
          <Head eyebrow="Published case studies" title={believe.title} sub={believe.sub} />
          <div className="cases">
            <Reveal as="article" className="case">
              <div className="media">
                <LiteYouTube id={videos.pablings.id} title={videos.pablings.title} />
              </div>
              <div className="body">
                <p className="kicker">Case study</p>
                <h3>Pablings Barbershop</h3>
                <p className="kpi">
                  ~<NumberTicker value={200} /> outlets
                  <small>{pablings.sub}</small>
                </p>
                <p>{pablings.reported} {pablings.reportedBig}{pablings.reportedTail}</p>
                <a className="readmore" href="#l-pablings">
                  The full Pablings story
                </a>
              </div>
            </Reveal>
            <Reveal as="article" className="case" index={1}>
              <div className="media">
                {videos.cmv.id ? (
                  <LiteYouTube id={videos.cmv.id} title={videos.cmv.title} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assets.cmv || photos.industrial.src} alt={photos.industrial.alt} loading="lazy" />
                )}
              </div>
              <div className="body">
                <p className="kicker">Case study</p>
                <h3>CMV</h3>
                <p className="kpi">
                  {cmv.big}
                  <small>{cmv.sub}</small>
                </p>
                <p>{cmv.reported} {cmv.big} {cmv.along}</p>
                <a className="readmore" href="#l-cmv">
                  The full CMV story
                </a>
              </div>
            </Reveal>
            <Reveal as="article" className="case" index={2}>
              <div className="media">
                {videos.cinemaSkin.id ? (
                  <LiteYouTube id={videos.cinemaSkin.id} title={videos.cinemaSkin.title} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assets.cinemaSkin.feature || photos.skincare.src} alt={photos.skincare.alt} loading="lazy" />
                )}
              </div>
              <div className="body">
                <p className="kicker">Case study</p>
                <h3>Cinema Skin Effects</h3>
                <p className="kpi" style={{ fontSize: "clamp(26px, 2.6vw, 36px)" }}>
                  Reseller &amp; distributor inquiries, up
                  <small>{cinema.sub}</small>
                </p>
                <p>{cinema.reported} {cinema.reportedBold}</p>
                <a className="readmore" href="#l-cinema">
                  The full Cinema Skin story
                </a>
              </div>
            </Reveal>
          </div>
          <Reveal className="actions" style={{ justifyContent: "center" }}>
            <ApplyButton className="rbtn rbtn-blue rbtn-lg" source="results">
              {cta.primary}
            </ApplyButton>
          </Reveal>
        </div>
      </Section>

      {/* 10. RDR Talks collection */}
      <Section id="talks" ground="deep">
        <div className="stack-xl">
          <Head eyebrow="From the channel" title="RDR Talks." sub="Founders, CEOs and business owners, on the platform. Tap any episode to watch." read="l-why" />
          <Reveal>
            <Rail label={`${videos.talks.length} episodes`}>
              {videos.talks.map((v) => (
                <LiteYouTube key={v.id} id={v.id} title={v.title} />
              ))}
            </Rail>
          </Reveal>
        </div>
      </Section>

      {/* 11. Media and clients */}
      <Section id="media" ground="navy" tight>
        <div className="stack-xl">
          <div className="stack" style={{ justifyItems: "center", textAlign: "center" }}>
            <Reveal as="p" className="eyebrow">
              {mediaSection.title}
            </Reveal>
            <Reveal as="ul" index={1} className="marks" aria-label="Media platforms">
              {media.map((m) => (
                <MarkItem key={m} mark={mediaMark(m)} />
              ))}
            </Reveal>
          </div>
          <div className="hairline" />
          <div className="stack" style={{ justifyItems: "center", textAlign: "center" }}>
            <Reveal as="p" className="eyebrow">
              Businesses in the RDR ecosystem
            </Reveal>
            <Reveal as="ul" index={1} className="marks clients" aria-label="Brands accelerated">
              {brands.map((b) => (
                <MarkItem key={b} mark={brandMark(b)} />
              ))}
            </Reveal>
            <Reveal as="p" index={2} className="t-soft">
              {ecosystem.more} {ecosystem.different.join(" ")} {ecosystem.same} <span className="t-gold">{ecosystem.big}</span>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* 12. How it works */}
      <Section id="how" ground="deep">
        <div className="stack-xl">
          <Head eyebrow="The process" title={howItWorks.title} read="l-how" />
          <ol className="steps">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} index={i}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title.replace(/^STEP \d — /, "")}</h3>
                <p>{(s.lines ?? s.close ?? s.list?.slice(0, 3))?.join(" ")}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal className="actions">
            <ApplyButton className="rbtn rbtn-blue rbtn-lg" source="how">
              {cta.primary}
            </ApplyButton>
            <span className="t-soft">{hero.free}</span>
          </Reveal>
        </div>
      </Section>

      {/* 13. Questions */}
      <Section id="questions" ground="navy">
        <div className="split split-5-7" style={{ alignItems: "start" }}>
          <Head eyebrow="Straight answers" title="Questions business owners ask me." />
          <div className="faq">
            {objections.map((o) => (
              <details key={o.q}>
                <summary>{o.q}</summary>
                <div className="a">
                  {o.a && <p className="lead">{o.a}</p>}
                  <P lines={o.paras} />
                  {o.bold && <p className="big">{o.bold}</p>}
                  {o.list && <UL items={o.list} />}
                  {o.after && <P lines={o.after} />}
                  {"list2" in o && o.list2 && <UL items={o.list2} />}
                  {o.big && <p className="big">{o.big}</p>}
                  {o.close && <P lines={o.close} />}
                </div>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* 14. Philosophy */}
      <Section id="philosophy" ground="deep">
        <div className="quote">
          <Reveal as="p" className="eyebrow">
            {philosophy.title}
          </Reveal>
          <Reveal as="blockquote" index={1}>
            {philosophy.sub} {philosophy.want} <span className="t-gold">{philosophy.wantBold}</span>
          </Reveal>
          <Reveal as="cite" index={2}>
            {philosophy.big}
          </Reveal>
          <Reveal index={3}>
            <a className="readmore" href="#l-philosophy">
              Read why
            </a>
          </Reveal>
        </div>
      </Section>

      {/* 15. Step forward */}
      <section id="apply" className="section final">
        <div className="sky" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos.manilaCity.src} alt="" loading="lazy" />
        </div>
        <div className="wrap inner">
          <Reveal as="p" className="eyebrow">
            {stepForward.title}
          </Reveal>
          <Reveal as="h2" index={1} className="serif t-hero">
            {stepForward.sub}
          </Reveal>
          <Reveal as="p" index={2} className="t-sub" style={{ maxWidth: "40ch" }}>
            {stepForward.big.join(" ")}
          </Reveal>
          <Reveal index={3}>
            <ApplyButton className="rbtn rbtn-blue rbtn-lg" source="final">
              {cta.primary}
            </ApplyButton>
          </Reveal>
          <Reveal as="ul" index={4} className="ctagrid" aria-label="Apply for a specific platform">
            {stepForward.ctas
              .filter((c) => !c.primary)
              .map((c) => (
                <li key={c.key}>
                  <ApplyButton offer={c.key} source="final-grid" className="rbtn rbtn-ghost">
                    {c.label}
                  </ApplyButton>
                </li>
              ))}
          </Reveal>
          <Reveal index={5} className="sign">
            <b>{stepForward.signoff[0]}</b>
            <span>
              {stepForward.signoff[1]} · {stepForward.signoff[2]}
            </span>
          </Reveal>
        </div>
      </section>

      {/* 16. The full letter, word for word */}
      <Section id="letter" ground="deep">
        <div className="stack-lg">
          <Head eyebrow="The complete letter" title="Every word, as Boss RDR wrote it." sub="The page above is the short version. This is the whole message, section by section." />
          <div className="letter">
            <Part id="l-letter" title={letter.intro}>
              <p>{letter.line1}</p>
              <p className="big">{letter.bold}</p>
              <UL items={letter.dontNeed} />
              <p className="big">{letter.need}</p>
              <UL items={letter.people} />
              <p>{letter.capable}</p>
              <UL items={letter.quotes} />
              <p>{letter.because}</p>
              <P lines={letter.truths} className="gold" />
              <P lines={[letter.why, letter.notSimply, letter.built]} />
            </Part>
            <Part id="l-numbers" title={numbers.title}>
              <p className="big">{numbers.sub}</p>
              <P lines={numbers.lines} />
              <UL items={numbers.tiles.map((t) => `${t.big} ${t.label}${t.note ? ` — ${t.note}` : ""}`)} />
              <p>{numbers.behind}</p>
              <p className="big">{story.title}</p>
              <p>{story.sub}</p>
              <p>{story.lead}</p>
              <p>{story.before}</p>
              <UL items={story.beats} />
              <p>{story.lesson}</p>
              <p className="gold">{story.lessonBig}</p>
              <P lines={[...story.mine, ...story.studio, ...story.climb, story.today]} />
              <UL items={story.nots} />
              <p className="big">{story.is}</p>
              <P lines={story.because} />
            </Part>
            <Part id="l-painful" title={painful.title}>
              <p className="big">{painful.sub}</p>
              <p>{painful.think}</p>
              <UL items={painful.haves} />
              <p>{painful.search}</p>
              <P lines={painful.leader} className="gold" />
              {painful.compares.map((c) => (
                <div key={c.when}>
                  <h4>{c.when}</h4>
                  <UL items={[...c.ask, ...(c.poster ? [c.poster] : []), ...(c.feel ? [c.feel] : []), ...(c.or ? [c.or] : [])]} />
                </div>
              ))}
              <p className="big">{painful.matters}</p>
              <UL items={painful.every} />
              <P lines={[painful.represents, painful.never]} />
            </Part>
            <Part id="l-before" title={beforeSale.title}>
              <p className="big">{beforeSale.sub}</p>
              <p>{beforeSale.before}</p>
              <UL items={beforeSale.steps} />
              <p>{beforeSale.isnt}</p>
              <p>{beforeSale.old.join(" → ")}</p>
              <p>{beforeSale.its}</p>
              <p className="gold">{beforeSale.funnel.join(" → ")}</p>
              <P lines={[beforeSale.game, beforeSale.notImpressed, beforeSale.quote, beforeSale.next, beforeSale.nextQ]} />
              <UL items={beforeSale.questions} />
              <p>{beforeSale.businessman}</p>
              <p className="big">{beforeSale.care}</p>
              <p className="big">{dream.title}</p>
              <p>{dream.sub}</p>
              <P lines={[dream.imagine, dream.stranger]} />
              <UL items={dream.seen} />
              <P lines={[dream.so, dream.zero]} />
              <p className="gold">{dream.trust}</p>
              <p>{dream.now}</p>
              <UL items={dream.with} />
              <P lines={[dream.stops, dream.asset]} />
            </Part>
            <Part id="l-money" title={money.title}>
              <p className="big">{money.sub}</p>
              <P lines={[money.think, money.one, money.amounts.join(" ")]} />
              <UL items={money.worths} />
              <UL items={money.whatIf} />
              <P lines={[money.roi, money.not, money.notQ, money.but, money.butQ]} />
              <p className="big">{roiTest.title}</p>
              <p>{roiTest.sub}</p>
              <UL items={roiTest.questions} />
              <P lines={[roiTest.compare, roiTest.how, roiTest.not, roiTest.notQ, roiTest.but, roiTest.butQ, ...roiTest.cheap]} />
            </Part>
            <Part id="l-pablings" title={pablings.title}>
              <p className="big">{pablings.sub}</p>
              <P lines={pablings.lines} />
              <p>{pablings.through}</p>
              <UL items={pablings.see} />
              <p>
                {pablings.reported} <span className="t-gold">{pablings.reportedBig}</span>
                {pablings.reportedTail}
              </p>
              <p>{pablings.lesson}</p>
              <UL items={pablings.didNot} />
              <P lines={[pablings.did, pablings.and]} />
              <p className="gold">{pablings.worth}</p>
              <p className="big">{pablings.ask}</p>
            </Part>
            <Part id="l-cmv" title={cmv.title}>
              <p className="big">{cmv.sub}</p>
              <P lines={[cmv.fav, cmv.excuse, cmv.really]} />
              <UL items={cmv.not} />
              <p>{cmv.talking}</p>
              <UL items={cmv.products} />
              <P lines={[cmv.exactly, ...cmv.machine]} />
              <p className="gold">{cmv.sell}</p>
              <UL items={cmv.show} />
              <p>{cmv.reported}</p>
              <p className="gold">{cmv.big}</p>
              <P lines={[cmv.along, cmv.think, cmv.sexy, cmv.need]} />
              <p className="big">{cmv.ask}</p>
              <p>{cmv.askSub}</p>
            </Part>
            <Part id="l-cinema" title={cinema.title}>
              <p className="big">{cinema.sub}</p>
              <P lines={cinema.beauty} />
              <UL items={cinema.thousands} />
              <P lines={[cinema.commodity, cinema.goalNot, cinema.look, cinema.goalWas]} />
              <UL items={cinema.understand} />
              <p>
                {cinema.reported} <span className="t-gold">{cinema.reportedBold}</span>
              </p>
              <P lines={[cinema.mean, cinema.notEnt]} />
              <p className="big">{cinema.big}</p>
              <p className="big">{cinema.ask}</p>
              <h4>{difference.title}</h4>
              {difference.pairs.map((p) => (
                <p key={p.content}>
                  <b>{difference.contentSays}</b> {p.content} <b>{difference.accelSays}</b> {p.accel}
                </p>
              ))}
            </Part>
            <Part id="l-why" title={why.title}>
              <p className="big">{why.sub}</p>
              <p>{why.look}</p>
              <UL items={why.numbers} />
              <P lines={[why.theory, why.attempts]} />
              <UL items={why.list} />
              <P lines={[why.years, why.notHiring, why.already]} />
              <p className="gold">{why.benefit}</p>
              <h4>{mediaSection.title}</h4>
              <p>{mediaSection.lead}</p>
              <UL items={[...media, mediaSection.tail]} />
              <P lines={[mediaSection.mention]} />
              <p className="gold">{mediaSection.compounds}</p>
              <UL items={mediaSection.chain} />
              <p>{mediaSection.eventually}</p>
            </Part>
            <Part id="l-offers" title={offersIntro.title}>
              <p className="big">{offersIntro.sub}</p>
              {offers.map((o) => (
                <div key={o.key}>
                  <h4>{o.title}</h4>
                  <p className="gold">{o.sub}</p>
                  <P lines={o.paras} />
                  {o.listIntro && <p>{o.listIntro}</p>}
                  {o.list && <UL items={o.list} />}
                  {o.afterList && <P lines={o.afterList} />}
                  {o.big && <p className="big">{o.big}</p>}
                </div>
              ))}
              <h4>{which.title}</h4>
              <p>{which.sub}</p>
              <UL items={which.map.map((m) => `${m.want} → ${m.offer}`)} />
              <P lines={which.still} />
              <h4>{whoFor.title}</h4>
              <p className="gold">{whoFor.sub}</p>
              <UL items={whoFor.ifs} />
              <P lines={[whoFor.wont, whoFor.expose, ...whoFor.but]} />
              <p className="big">{whoFor.interesting}</p>
              <p>{whoFor.fit}</p>
              <UL items={whoFor.list} />
              <h4>{ecosystem.title}</h4>
              <UL items={brands} />
              <P lines={[ecosystem.more, ...ecosystem.different, ecosystem.same]} />
              <p className="big">{ecosystem.big}</p>
            </Part>
            <Part id="l-how" title={howItWorks.title}>
              {steps.map((s) => (
                <div key={s.title}>
                  <h4>{s.title}</h4>
                  {s.lines && <P lines={s.lines} />}
                  {s.list && <UL items={s.list} />}
                  {s.asks && <UL items={s.asks} />}
                  {s.close && <P lines={s.close} />}
                  {s.bold && <p className="gold">{s.bold}</p>}
                </div>
              ))}
            </Part>
            <Part id="l-philosophy" title={philosophy.title}>
              <p className="big">{philosophy.sub}</p>
              <p>
                {philosophy.want} <span className="t-gold">{philosophy.wantBold}</span> {philosophy.diff}
              </p>
              {philosophy.pairs.map((p) => (
                <p key={p.famous}>
                  {p.famous} <b>{p.valuable}</b>
                </p>
              ))}
              <P lines={philosophy.fame} />
              <p className="big">{philosophy.big}</p>
              <h4>{care.title}</h4>
              <P lines={care.lines} />
              <P lines={[care.look, care.see]} />
              <UL items={care.behind} />
              <P lines={[care.so, care.dont, ...care.did]} />
              <h4>{goal.title}</h4>
              <p className="gold">{goal.sub}</p>
              <UL items={goal.wants} />
              <p>{goal.because}</p>
              <h4>{door.one.join(" ")}</h4>
              <p className="gold">{door.can}</p>
              <UL items={door.chain} />
              <P lines={door.promise} />
              <p className="big">{door.big}</p>
              <P lines={door.visibility} />
            </Part>
            <Part id="l-invitation" title={invitation.title}>
              <p className="big">
                {invitation.sub1} {invitation.sub2}
              </p>
              <UL items={invitation.nots} />
              <P lines={[invitation.but, invitation.to]} />
              <UL items={invitation.numbers} />
              <p>{invitation.stories}</p>
              <UL items={invitation.cases} />
              <P lines={invitation.interest} />
              <h4>{stepForward.title}</h4>
              <p className="gold">{stepForward.sub}</p>
              <UL items={stepForward.tell} />
              <P lines={stepForward.big} className="big" />
              <P lines={stepForward.signoff} />
              <h4>{finalBar.title}</h4>
              <p className="gold">{finalBar.sub}</p>
              <UL items={finalBar.items} />
            </Part>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="wrap foot">
        <div className="row">
          <Mark />
          <p className="tag">Creating success. One content at a time.</p>
        </div>
        <div className="row">
          <ul className="socials">
            <li>
              <a href={socials.facebook} target="_blank" rel="noopener">
                Facebook
              </a>
            </li>
            <li>
              <a href={socials.youtube} target="_blank" rel="noopener">
                YouTube
              </a>
            </li>
            <li>
              <a href={socials.tiktok} target="_blank" rel="noopener">
                TikTok
              </a>
            </li>
            <li>
              <a href={socials.instagram} target="_blank" rel="noopener">
                Instagram
              </a>
            </li>
            <li>
              <a href={socials.spotify} target="_blank" rel="noopener">
                Spotify
              </a>
            </li>
            <li>
              <a href={socials.site} target="_blank" rel="noopener">
                rdrbsi.com
              </a>
            </li>
          </ul>
          <p className="fine">© {new Date().getFullYear()} RDR Business Solutions Inc.</p>
        </div>
        <p className="fine">
          {stats.proofNote} Case-study figures are as reported in RDR&rsquo;s published case studies. Atmosphere photography via Unsplash:{" "}
          {photoCredits.map((p, i) => (
            <span key={p.link}>
              <a href={p.link} target="_blank" rel="noopener">
                {p.credit}
              </a>
              {i < photoCredits.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </footer>
    </main>
  );
}
