"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { offers, offerExtras, cta } from "@/lib/rdr/content";
import { photos, yt } from "@/lib/rdr/media";
import { ApplyButton } from "./ui";
import { icons } from "./v2server";

/** Drag between "content" and "brand acceleration". Keyboard: the hidden range. */
export function Compare({ a, b }: { a: { title: string; items: string[] }; b: { title: string; items: string[] } }) {
  const [x, setX] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const set = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setX(Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={ref}
      className="rdr-cmp"
      style={{ ["--x" as string]: `${x}%` }}
      onPointerDown={(e) => {
        drag.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        set(e.clientX);
      }}
      onPointerMove={(e) => drag.current && set(e.clientX)}
      onPointerUp={() => (drag.current = false)}
      onPointerCancel={() => (drag.current = false)}
    >
      <div className="pane a" aria-hidden={x < 8}>
        <h4>{a.title}</h4>
        <ul>
          {a.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <div className="pane b" aria-hidden={x > 92}>
        <h4>{b.title}</h4>
        <ul>
          {b.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <span className="lbl l">{a.title}</span>
      <span className="lbl r">{b.title}</span>
      <div className="handle" aria-hidden="true" />
      <div className="knob" aria-hidden="true">
        ⇆
      </div>
      <input type="range" min={4} max={96} value={Math.round(x)} onChange={(e) => setX(Number(e.target.value))} aria-label="Drag to compare content with brand acceleration" />
    </div>
  );
}

const offerIcon: Record<string, ReactNode> = {
  talks: icons.mic,
  vlog: icons.camera,
  n1m: icons.bolt,
  films: icons.film,
  stories: icons.heart,
  gci: icons.people,
  studio: icons.studio,
  events: icons.stage,
  coordination: icons.calendar,
};
const offerPhoto: Record<string, string> = {
  talks: photos.interviewMonitor.src,
  vlog: photos.cameraRecording.src,
  n1m: photos.manilaNight.src,
  films: photos.filmSet.src,
  stories: photos.condenserMic.src,
  gci: photos.handshake.src,
  studio: photos.ledLight.src,
  events: photos.stageSpeaker.src,
  coordination: photos.audienceScreen.src,
};
const offerSize: Record<string, string> = { talks: "wide tall", vlog: "", n1m: "", films: "wide", stories: "", gci: "", studio: "", events: "wide", coordination: "" };

/** The nine platforms as a bento; a goal chip lights the one the copy points at; a cell opens the full offer. */
export function Bento({ map, talksIds, nextEvent }: { map: { want: string; offer: string; key: string }[]; talksIds: string[]; nextEvent?: ReactNode }) {
  const [focus, setFocus] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const o = offers.find((x) => x.key === open);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="stack-lg">
      <div className="rdr-pick" role="group" aria-label="What do you want?">
        {map.map((m) => (
          <button key={m.key} type="button" aria-pressed={focus === m.key} onClick={() => setFocus(focus === m.key ? null : m.key)}>
            {m.want}
          </button>
        ))}
      </div>
      <div className="rdr-bento" data-focus={focus ?? undefined}>
        {offers.map((of) => (
          <button key={of.key} type="button" id={`offer-${of.key}`} className={`cell ${offerSize[of.key]} ${focus === of.key ? "on" : ""}`} data-off={focus && focus !== of.key ? "true" : "false"} onClick={() => setOpen(of.key)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={offerPhoto[of.key]} alt="" loading="lazy" />
            <span className="veil" aria-hidden="true" />
            <span className="ico" aria-hidden="true">
              {offerIcon[of.key]}
            </span>
            {of.key === "n1m" && (
              <svg className="ring" viewBox="0 0 74 74" aria-hidden="true">
                <circle className="bg" cx="37" cy="37" r="29" />
                <circle className="fg" cx="37" cy="37" r="29" />
                <text x="37" y="42" textAnchor="middle">
                  1:00
                </text>
              </svg>
            )}
            {of.key === "talks" && (
              <span className="mini" aria-hidden="true">
                {talksIds.slice(0, 3).map((id) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={id} src={yt(id, "mq")} alt="" loading="lazy" />
                ))}
              </span>
            )}
            <span className="in">
              <span className="num">{of.number}</span>
              <h3 className="t-display">{of.name === "GCI" ? "GROWTH CIRCLE INTERNATIONAL" : of.name}</h3>
              <p>{of.sub}</p>
              <span className="go">
                <i aria-hidden="true" />
                See how it works
              </span>
            </span>
          </button>
        ))}
      </div>

      {o && (
        <div className="rdr-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="panel offer" role="dialog" aria-modal="true" aria-labelledby="rdr-offer-title">
            <div className="cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={offerPhoto[o.key]} alt="" />
              <div className="veil" />
              <button type="button" className="close" aria-label="Close" onClick={() => setOpen(null)} />
              <div className="in">
                <span className="num" style={{ color: "var(--gold)", fontWeight: 700, fontSize: 13 }}>
                  {o.number}
                </span>
                <h2 id="rdr-offer-title" className="t-display t-h2">
                  {o.title.replace(/^OFFER #\d+ — /, "")}
                </h2>
                <p className="t-sub" style={{ color: "var(--gold)" }}>
                  {o.sub}
                </p>
              </div>
            </div>
            <div className="content">
              <div className="stack">
                {o.paras.map((p) => (
                  <p key={p} className={p.length < 60 ? "t-statement" : "t-body"}>
                    {p}
                  </p>
                ))}
              </div>
              {o.key === "talks" && (
                <ul className="rdr-chips">
                  {offerExtras.talksUncover.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              <div className="two">
                <div className="stack">
                  {o.listIntro && <p style={{ fontWeight: 650 }}>{o.listIntro}</p>}
                  {o.list && (
                    <ul className="rdr-list">
                      {o.list.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="stack">
                  {o.afterList?.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                  {o.key === "vlog" && offerExtras.vlogLet.map((t) => <p key={t}>{t}</p>)}
                  {o.key === "n1m" && (
                    <ul className="rdr-chips">
                      {offerExtras.n1mOne.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                  {o.key === "films" && (
                    <>
                      <ul className="rdr-chips">
                        {offerExtras.filmsMakes.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                      <p>{offerExtras.filmsBecause}</p>
                    </>
                  )}
                  {o.big && <p className="t-display t-h3 t-gold">{o.big}</p>}
                  {o.key === "studio" && <p>{offerExtras.studioGive}</p>}
                </div>
              </div>
              {o.key === "events" ? nextEvent : (
                <ApplyButton offer={o.key} source={`offer-${o.key}`} className="rbtn rbtn-lg">
                  {o.cta}
                </ApplyButton>
              )}
              {o.key === "events" && (
                <ApplyButton offer="events" source="offer-events" className="rbtn rbtn-quiet">
                  {cta.events}
                </ApplyButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Famous vs valuable: flip the switch and the same three cards change sides. */
export function Toggle({ pairs }: { pairs: { famous: string; valuable: string }[] }) {
  const [side, setSide] = useState<"famous" | "valuable">("valuable");
  return (
    <div className="rdr-toggle" data-side={side}>
      <div className="sw" role="group" aria-label="Famous or valuable">
        <span className="thumb" aria-hidden="true" />
        <button type="button" aria-pressed={side === "famous"} onClick={() => setSide("famous")}>
          Famous
        </button>
        <button type="button" aria-pressed={side === "valuable"} onClick={() => setSide("valuable")}>
          Valuable
        </button>
      </div>
      <ul className="cards" aria-live="polite">
        {pairs.map((p) => (
          <li key={p.famous}>{side === "famous" ? p.famous : p.valuable}</li>
        ))}
      </ul>
    </div>
  );
}
