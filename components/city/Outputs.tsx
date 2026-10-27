"use client";

// The Outputs cabinet: everything the city's staff have made, newest first, by worker.
// Each piece can be read, copied or saved as a text file. Work still being written shows
// at the top so you know it's coming.

import { useEffect, useMemo, useState } from "react";
import { useTracker } from "../App";
import { Icon } from "../icons";
import { Badge, Btn } from "../ui";
import { buildingName, roleOf, titleOf } from "@/lib/city";
import { allOutputs, type Output } from "@/lib/cityOutputs";

const fileName = (o: Output) => `${o.staffName}-${o.label}-${o.day}`.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() + ".txt";

function save(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Outputs({ staffId, onClose }: { staffId?: string; onClose: () => void }) {
  const { data, update } = useTracker();
  const list = useMemo(() => allOutputs(data), [data]);
  const [who, setWho] = useState(staffId ?? "");
  const [open, setOpen] = useState(list.find((o) => !o.queued && (!staffId || o.staffId === staffId))?.id ?? "");
  const [copied, setCopied] = useState("");
  // What was already seen when the cabinet opened, so this visit still shows which are new.
  const [seen] = useState(data.city?.outputsSeen ?? "");

  // Opening the cabinet marks everything in it as seen (clears the badge).
  useEffect(() => {
    const newest = list.find((o) => !o.queued)?.at ?? "";
    if (newest && newest > seen) update((d) => void (d.city!.outputsSeen = newest));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const people = [...new Map(list.map((o) => [o.staffId, o])).values()];
  const shown = list.filter((o) => !who || o.staffId === who);
  const staff = data.city?.staff ?? [];
  const copy = async (o: Output) => {
    try {
      await navigator.clipboard.writeText(o.text);
      setCopied(o.id);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-[rgba(11,10,20,0.55)]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hud city-pop w-full max-w-3xl max-h-[88vh] flex flex-col p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="scroll" size={28} className="text-gold" />
          <h3 className="font-display text-2xl sm:text-3xl tracking-wide flex-1">Outputs</h3>
          <Btn onClick={onClose}>Close</Btn>
        </div>
        {people.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-3">
            <button type="button" className={`btn text-base ${!who ? "btn-primary" : "btn-ghost"}`} onClick={() => setWho("")}>
              Everyone ({list.length})
            </button>
            {people.map((p) => (
              <button key={p.staffId} type="button" className={`btn text-base ${who === p.staffId ? "btn-primary" : "btn-ghost"}`} onClick={() => setWho(p.staffId)}>
                {p.staffName} ({list.filter((o) => o.staffId === p.staffId).length})
              </button>
            ))}
          </div>
        )}
        <div className="overflow-y-auto flex-1 -mx-1 px-1">
          {!shown.length && (
            <p className="text-lg font-bold">
              Nothing here yet. Ask a worker for something (talk to them, then pick their job) and what they make lands in this cabinet.
            </p>
          )}
          <ul className="space-y-2">
            {shown.map((o) => {
              const s = staff.find((x) => x.id === o.staffId);
              const b = data.city?.buildings.find((x) => x.id === o.buildingId);
              const isNew = !o.queued && o.at > seen;
              return (
                <li key={o.id} className="bg-card-2 border-[3px] border-outline p-3">
                  <button type="button" className="w-full flex items-center gap-2 text-left" onClick={() => setOpen(open === o.id ? "" : o.id)} disabled={o.queued}>
                    <span className="w-3 h-3 shrink-0 border-2 border-outline" style={{ background: s ? roleOf(s).color : "#a3998f" }} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-lg truncate">{o.label}</span>
                      <span className="block text-sm font-bold text-muted truncate">
                        {o.staffName}
                        {s ? `, ${titleOf(s)}` : ""}
                        {b ? ` · ${buildingName(data, b)}` : ""} · {o.day}
                      </span>
                    </span>
                    {o.queued ? <Badge tone="accent">Being made</Badge> : isNew ? <Badge tone="gold">New</Badge> : null}
                  </button>
                  {o.queued && <p className="text-base mt-2">{o.staffName} is working on this now. It lands here within the hour.</p>}
                  {open === o.id && !o.queued && (
                    <>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Btn className="text-base py-1" onClick={() => copy(o)}>
                          <Icon name="check" size={18} /> {copied === o.id ? "Copied" : "Copy"}
                        </Btn>
                        <Btn className="text-base py-1" onClick={() => save(fileName(o), o.text)}>
                          <Icon name="box" size={18} /> Download file
                        </Btn>
                      </div>
                      {o.input && <p className="text-sm text-muted font-bold mt-2 truncate">From: {o.input}</p>}
                      <div className="text-base whitespace-pre-wrap leading-relaxed mt-2 max-h-[45vh] overflow-y-auto bg-field border-2 border-outline p-3">{o.text}</div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
