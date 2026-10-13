"use client";

import { locale } from "@/lib/finance";
import { useEffect, useRef, useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const label = (m: string) => new Date(m + "-01T00:00:00").toLocaleDateString(locale(), { month: "long", year: "numeric" });

/** Button that opens a pop-up calendar of months (some browsers show type="month" as plain text). */
export default function MonthPicker({ value, onChange, current }: { value: string; onChange: (m: string) => void; current: string }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setYear(Number(value.slice(0, 4)));
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open, value]);

  const shift = (n: number) => {
    const [y, m] = value.split("-").map(Number);
    const d = new Date(y, m - 1 + n, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="relative flex items-center gap-1.5" ref={ref}>
      <button className="btn btn-ghost px-3" onClick={() => shift(-1)} aria-label="Previous month">◀</button>
      <button className="btn btn-primary min-w-48" onClick={() => setOpen((v) => !v)} aria-haspopup="dialog" aria-expanded={open}>
        📅 {label(value)}
      </button>
      <button className="btn btn-ghost px-3" onClick={() => shift(1)} aria-label="Next month">▶</button>
      {open && (
        <div role="dialog" aria-label="Pick a month" className="absolute right-0 top-full mt-2 z-40 w-72 bg-card border-[3px] border-outline rounded-[12px] p-3 shadow-[5px_5px_0_#0b0a14]">
          <div className="flex items-center justify-between mb-3">
            <button className="btn btn-ghost px-3" onClick={() => setYear(year - 1)} aria-label="Previous year">◀</button>
            <span className="font-display text-2xl tracking-wide">{year}</span>
            <button className="btn btn-ghost px-3" onClick={() => setYear(year + 1)} aria-label="Next year">▶</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((name, i) => {
              const m = `${year}-${String(i + 1).padStart(2, "0")}`;
              const selected = m === value;
              return (
                <button
                  key={m}
                  onClick={() => {
                    onChange(m);
                    setOpen(false);
                  }}
                  className={`py-2.5 rounded-[8px] border-[3px] font-display text-lg tracking-wide ${selected ? "bg-gold text-outline border-outline" : m === current ? "border-accent" : "border-transparent hover:border-outline bg-card-2"}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
          {value !== current && (
            <button className="btn btn-ghost w-full mt-3" onClick={() => (onChange(current), setOpen(false))}>
              Back to this month
            </button>
          )}
        </div>
      )}
    </div>
  );
}
