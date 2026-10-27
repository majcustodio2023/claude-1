"use client";

// Decorating your home: pick a piece, move it with the arrows (on screen or the keyboard),
// put it away, or add something new. Every change is checked against the room (walls, other
// furniture, the doorway) and saved with the rest of your data.

import { useEffect, useState } from "react";
import { useTracker } from "../App";
import { Icon } from "../icons";
import { Btn } from "../ui";
import { uid } from "@/lib/finance";
import { FURNITURE, cantPlace, freeSpot, furnitureOf } from "@/lib/home";
import { sfx } from "@/lib/sound";
import type { PlacedFurniture } from "@/lib/types";

export default function Decorate({ buildingId, selected, onSelect, onProblem, onClose }: { buildingId: string; selected: string; onSelect: (id: string) => void; onProblem: (bad: boolean) => void; onClose: () => void }) {
  const { data, update } = useTracker();
  const home = data.city?.buildings.find((b) => b.id === buildingId);
  const items = home ? furnitureOf(home) : [];
  const [msg, setMsg] = useState("");
  const [adding, setAdding] = useState(false);
  const sel = items.find((f) => f.id === selected);

  const save = (next: PlacedFurniture[]) =>
    update((d) => {
      const b = d.city?.buildings.find((x) => x.id === buildingId);
      if (b) b.furniture = next;
    });
  const say = (text: string, bad = false) => {
    setMsg(text);
    onProblem(bad);
    if (bad) sfx("hit");
  };

  const move = (dx: number, dy: number) => {
    if (!sel) return;
    const moved = { ...sel, x: sel.x + dx, y: sel.y + dy };
    const why = cantPlace(items, moved);
    if (why) return say(why, true);
    say("");
    save(items.map((f) => (f.id === sel.id ? moved : f)));
  };
  const putAway = () => {
    if (!sel) return;
    save(items.filter((f) => f.id !== sel.id));
    onSelect("");
    say(`${FURNITURE[sel.kind].label} put away.`);
  };
  const add = (kind: string) => {
    const at = freeSpot(items, kind);
    if (!at) return say(`There's no room left for a ${FURNITURE[kind].label.toLowerCase()}. Put something away first.`, true);
    const f = { id: uid("furn"), kind, ...at };
    save([...items, f]);
    onSelect(f.id);
    setAdding(false);
    sfx("loot");
    say(`${FURNITURE[kind].label} added. Move it where you like.`);
  };

  // Arrow keys move the chosen piece instead of you while you decorate.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      const dir: Record<string, [number, number]> = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1] };
      if (dir[k]) move(...dir[k]);
      else if (k === "escape") onClose();
      else if (k === "delete" || k === "backspace") putAway();
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", down, true);
    return () => window.removeEventListener("keydown", down, true);
  });

  if (!home) return null;
  const arrow = (dx: number, dy: number, rot: number, label: string) => (
    <button type="button" aria-label={label} disabled={!sel} onClick={() => move(dx, dy)} className="w-12 h-12 grid place-content-center bg-card-2 border-[3px] border-outline rounded-xl active:bg-gold disabled:opacity-40">
      <svg width="20" height="20" viewBox="0 0 24 24" style={{ transform: `rotate(${rot}deg)` }} aria-hidden>
        <path d="M12 4 L20 16 H4 Z" fill="currentColor" />
      </svg>
    </button>
  );
  return (
    <div className="absolute inset-x-0 bottom-0 z-40 p-2 pointer-events-none sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-20 sm:w-[380px] sm:p-0">
      <div className="hud p-3 sm:p-4 pointer-events-auto max-h-[43vh] sm:max-h-[calc(100vh-7rem)] overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="home" size={26} className="text-gold" />
          <h3 className="font-display text-2xl tracking-wide flex-1">Decorate your home</h3>
          <Btn kind="primary" onClick={onClose}>
            Done
          </Btn>
        </div>
        {adding ? (
          <div>
            <p className="text-base font-bold text-muted mb-2">Pick something to add. Furniture is free for now.</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FURNITURE).map(([k, f]) => (
                <button key={k} type="button" onClick={() => add(k)} className="btn btn-ghost text-base justify-start">
                  {f.label}
                  <span className="text-sm text-muted ml-auto">
                    {f.w}x{f.h}
                  </span>
                </button>
              ))}
            </div>
            <Btn className="mt-2" onClick={() => setAdding(false)}>
              Back
            </Btn>
          </div>
        ) : (
          <div className="flex gap-4 flex-wrap items-start">
            <div className="flex-1 min-w-56">
              <p className="text-base font-bold text-muted mb-2">Tap a piece, then move it with the arrows.</p>
              <div className="flex gap-2 flex-wrap">
                {items.map((f) => (
                  <button key={f.id} type="button" onClick={() => (onSelect(f.id === selected ? "" : f.id), say(""))} className={`btn text-base ${f.id === selected ? "btn-primary" : "btn-ghost"}`}>
                    {FURNITURE[f.kind]?.label ?? f.kind}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Btn kind="primary" onClick={() => setAdding(true)}>
                  <Icon name="sparkles" size={20} /> Add furniture
                </Btn>
                <Btn disabled={!sel} onClick={putAway}>
                  <Icon name="box" size={20} /> Put away
                </Btn>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 w-fit">
              <span />
              {arrow(0, -1, 0, "Move up")}
              <span />
              {arrow(-1, 0, -90, "Move left")}
              {arrow(0, 1, 180, "Move down")}
              {arrow(1, 0, 90, "Move right")}
            </div>
          </div>
        )}
        {msg && <p className="text-base font-extrabold mt-2">{msg}</p>}
      </div>
    </div>
  );
}
