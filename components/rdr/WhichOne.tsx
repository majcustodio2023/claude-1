"use client";

import { useState } from "react";

export function WhichOne({ map }: { map: { want: string; offer: string; key: string }[] }) {
  const [on, setOn] = useState<string | null>(null);
  return (
    <ol className="rdr-which">
      {map.map((m) => (
        <li key={m.key} data-on={on === null || on === m.key ? "true" : "false"}>
          <button type="button" onMouseEnter={() => setOn(m.key)} onFocus={() => setOn(m.key)} onClick={() => setOn(m.key)} onMouseLeave={() => setOn(null)} onBlur={() => setOn(null)}>
            {m.want}
          </button>
          <a href={`#offer-${m.key}`}>{m.offer}</a>
        </li>
      ))}
    </ol>
  );
}
