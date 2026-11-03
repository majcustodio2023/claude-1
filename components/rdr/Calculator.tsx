"use client";

// The live thing: the reader's own numbers. "What is ONE new customer worth to you?"
import { useState } from "react";

const kinds = [
  { key: "customer", label: "One new customer", plural: "customers" },
  { key: "franchisee", label: "One qualified franchisee", plural: "franchisees" },
  { key: "dealer", label: "One dealership agreement", plural: "dealership agreements" },
  { key: "distributor", label: "One distributor", plural: "distributors" },
  { key: "corporate", label: "One corporate account", plural: "corporate accounts" },
  { key: "partner", label: "One strategic partnership over three years", plural: "partnerships" },
];

// Slider stops follow the copy: ₱5,000 … ₱1,000,000, then up to ₱10,000,000 for franchise and B2B deals.
const stops = [5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 350_000, 500_000, 750_000, 1_000_000, 2_000_000, 3_500_000, 5_000_000, 10_000_000];

export function peso(n: number) {
  return `₱${new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(n)}`;
}

export function Calculator() {
  const [kind, setKind] = useState(kinds[0]);
  const [stop, setStop] = useState(4);
  const [extra, setExtra] = useState(3);
  const worth = stops[stop];
  const year = worth * extra;
  return (
    <div className="rdr-calc">
      <div className="opts" role="group" aria-label="What kind of opportunity">
        {kinds.map((k) => (
          <button key={k.key} type="button" className="opt" aria-pressed={k.key === kind.key} onClick={() => setKind(k)}>
            {k.label}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="rdr-worth">{kind.label} is worth</label>
        <div className="readout" aria-live="polite">
          <span className="val">{peso(worth)}</span>
        </div>
        <input id="rdr-worth" type="range" min={0} max={stops.length - 1} step={1} value={stop} onChange={(e) => setStop(Number(e.target.value))} aria-valuetext={peso(worth)} />
      </div>
      <div>
        <label htmlFor="rdr-extra">If stronger positioning helps your team close just a few more qualified opportunities a year</label>
        <div className="readout">
          <span className="val" style={{ fontSize: "clamp(32px, 4.5vw, 64px)" }}>
            {extra} more {extra === 1 ? kind.plural.replace(/s$/, "") : kind.plural}
          </span>
        </div>
        <input id="rdr-extra" type="range" min={1} max={24} step={1} value={extra} onChange={(e) => setExtra(Number(e.target.value))} aria-valuetext={`${extra} more`} />
      </div>
      <div className="result" aria-live="polite">
        <span className="sub">What stronger market authority could be worth to your company, per year</span>
        <span className="val">{peso(year)}</span>
        <span className="sub">Your numbers, your math. Nothing here is a promise; it is the conversation Boss RDR wants to have with you.</span>
      </div>
    </div>
  );
}
