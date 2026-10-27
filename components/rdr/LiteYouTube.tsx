"use client";

import { useState } from "react";

/** Thumbnail first, player on tap. Keeps the page light and the viewer in control. */
export function LiteYouTube({ id, title, className = "", emptyLabel }: { id: string; title: string; className?: string; emptyLabel?: string }) {
  const [on, setOn] = useState(false);
  if (!id) {
    return (
      <div className={`rdr-yt-empty ${className}`} role="img" aria-label={`${emptyLabel ?? title} (clip to be added)`}>
        <b>{emptyLabel ?? title}</b>
        <span className="t-small">Clip coming from the RDR archive.</span>
      </div>
    );
  }
  if (on) {
    return (
      <div className={`rdr-yt ${className}`}>
        <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      </div>
    );
  }
  return (
    <button type="button" className={`rdr-yt ${className}`} onClick={() => setOn(true)} aria-label={`Play: ${title}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`} alt="" loading="lazy" onError={(e) => { const img = e.currentTarget; if (!img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; }} />
      <span className="scrim" aria-hidden="true" />
      <span className="cap">
        <span className="play" aria-hidden="true" />
        <span>{title}</span>
      </span>
    </button>
  );
}
