"use client";

import { useEffect, useState } from "react";
import { AVATAR_KINDS, AVATAR_TRAITS, avatarCount, avatarPage, encodeAvatar, randomAvatar, resolveAvatar, type AvatarKind, type AvatarSpec } from "@/lib/avatar";
import { Avatar } from "./avatars";
import { Btn } from "./ui";
import { Icon } from "./icons";

/** An avatar you can tap to change. */
export function AvatarButton({ value, seed, kind, size = 64, onChange, name }: { value?: string; seed: string; kind: AvatarKind; size?: number; onChange: (v: string | undefined) => void; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="relative shrink-0 rounded-full hover:scale-105 transition-transform" title={`Change ${name}'s picture`} aria-label={`Change ${name}'s picture`}>
        <Avatar value={value} seed={seed} kind={kind} size={size} title={name} />
        <span className="absolute -bottom-0.5 -right-0.5 bg-gold text-outline border-2 border-outline rounded-full p-[3px] leading-none">
          <Icon name="pencil" size={Math.max(12, Math.round(size / 5))} />
        </span>
      </button>
      {open && (
        <AvatarPicker
          value={value}
          seed={seed}
          kind={kind}
          name={name}
          onClose={() => setOpen(false)}
          onPick={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

export function AvatarPicker({ value, seed, kind, name, onPick, onClose }: { value?: string; seed: string; kind: AvatarKind; name: string; onPick: (v: string | undefined) => void; onClose: () => void }) {
  const [spec, setSpec] = useState<AvatarSpec>(() => resolveAvatar(value, seed, kind));
  const [page, setPage] = useState(0);
  const tab = spec.kind;
  const traits = AVATAR_TRAITS[tab];
  const presets = avatarPage(tab, page, 40);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setTrait = (i: number, v: number) => setSpec((s) => ({ ...s, t: s.t.map((x, j) => (j === i ? (v + traits[i].count) % traits[i].count : x)) }));
  const switchKind = (k: AvatarKind) => {
    if (k === tab) return;
    setSpec(avatarPage(k, 0, 1)[0]);
    setPage(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Pick a picture for ${name}`}>
      <div className="hud w-full max-w-4xl p-4 sm:p-5 my-4 space-y-4 !animate-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="caption">Pick a look for {name}</h2>
          <button type="button" className="text-2xl font-bold px-2" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <Avatar spec={spec} size={150} />
            <div className="flex gap-2 flex-wrap justify-center">
              <Btn type="button" kind="primary" onClick={() => onPick(encodeAvatar(spec))}>
                <Icon name="check" size={20} /> Save look
              </Btn>
              <Btn type="button" onClick={() => setSpec(randomAvatar(tab, Date.now() + Math.random()))}>
                <Icon name="sparkles" size={20} /> Random
              </Btn>
            </div>
            {value && (
              <button type="button" className="text-sm underline text-muted" onClick={() => onPick(undefined)}>
                Go back to the automatic one
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 w-full space-y-3">
            <div className="flex gap-1.5 flex-wrap" role="tablist">
              {AVATAR_KINDS.map((k) => (
                <button key={k.kind} type="button" role="tab" aria-selected={tab === k.kind} onClick={() => switchKind(k.kind)} className={`btn px-3 py-1.5 ${tab === k.kind ? "btn-primary" : "btn-ghost"}`}>
                  {k.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted font-bold">{avatarCount(tab).toLocaleString()} possible looks. Tap one below, then fine-tune it.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {traits.map((tr, i) => (
                <div key={tr.key} className="flex items-center gap-2 min-w-0">
                  <span className="w-24 shrink-0 text-sm font-extrabold uppercase text-muted">{tr.label}</span>
                  {tr.colors ? (
                    <div className="flex flex-wrap gap-1">
                      {tr.colors.map((c, j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => setTrait(i, j)}
                          aria-label={`${tr.label} ${j + 1}`}
                          className={`w-6 h-6 rounded-full border-2 ${spec.t[i] === j ? "border-ink ring-2 ring-gold" : "border-outline"}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 min-w-0">
                      <button type="button" className="btn btn-ghost px-2.5 py-1" onClick={() => setTrait(i, spec.t[i] - 1)} aria-label={`Previous ${tr.label}`}>
                        ‹
                      </button>
                      <span className="w-28 text-center font-bold truncate capitalize">{tr.names?.[spec.t[i]] ?? spec.t[i] + 1}</span>
                      <button type="button" className="btn btn-ghost px-2.5 py-1" onClick={() => setTrait(i, spec.t[i] + 1)} aria-label={`Next ${tr.label}`}>
                        ›
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
            {presets.map((p, i) => (
              <button key={`${page}-${i}`} type="button" onClick={() => setSpec(p)} className={`rounded-full ${encodeAvatar(p) === encodeAvatar(spec) ? "ring-4 ring-gold" : "hover:scale-105 transition-transform"}`} aria-label={`Look ${i + 1}`}>
                <Avatar spec={p} size={64} className="w-full h-auto" />
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-center mt-3">
            {page > 0 && (
              <Btn type="button" onClick={() => setPage(page - 1)}>
                ‹ Back
              </Btn>
            )}
            <Btn type="button" kind="soft" onClick={() => setPage(page + 1)}>
              More looks ›
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
