"use client";

// Picks which AI paints an ad image: ChatGPT images (an OpenAI key) or Higgsfield. Used by the
// Creatives tab and the city's Ad Image Maker. The last pick is remembered in settings.

import { useState } from "react";
import { useTracker } from "./App";
import { Btn } from "./ui";

export type Engine = "openai" | "higgsfield";
export type Shape = "portrait" | "square" | "landscape";

export const ENGINE_LABEL: Record<Engine, string> = { openai: "ChatGPT images", higgsfield: "Higgsfield" };
const SHAPES: [Shape, string][] = [
  ["portrait", "Tall (feed / story)"],
  ["square", "Square"],
  ["landscape", "Wide"],
];

/** The engine to use now: the saved pick if its key is there, else whichever key exists. */
export function useEngine(): [Engine, (e: Engine) => void, { openai: boolean; higgsfield: boolean }] {
  const { data, update } = useTracker();
  const has = { openai: Boolean(data.integrations?.openai), higgsfield: Boolean(data.integrations?.higgsfield) };
  const saved = data.settings.imageEngine;
  const engine: Engine = saved && (has[saved] || !has[saved === "openai" ? "higgsfield" : "openai"]) ? saved : has.openai ? "openai" : has.higgsfield ? "higgsfield" : saved ?? "openai";
  return [engine, (e) => update((d) => void (d.settings.imageEngine = e)), has];
}

export function EnginePicker({ engine, setEngine, shape, setShape }: { engine: Engine; setEngine: (e: Engine) => void; shape: Shape; setShape: (s: Shape) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center" role="radiogroup" aria-label="Who paints it">
        <span className="text-base font-bold">Paint with:</span>
        {(Object.keys(ENGINE_LABEL) as Engine[]).map((e) => (
          <Btn key={e} kind={engine === e ? "primary" : "ghost"} role="radio" aria-checked={engine === e} onClick={() => setEngine(e)}>
            {ENGINE_LABEL[e]}
          </Btn>
        ))}
      </div>
      {engine === "openai" && (
        <div className="flex flex-wrap gap-2 items-center" role="radiogroup" aria-label="Shape">
          <span className="text-base font-bold">Shape:</span>
          {SHAPES.map(([s, label]) => (
            <Btn key={s} kind={shape === s ? "soft" : "ghost"} className={shape === s ? "ring-2 ring-accent" : ""} role="radio" aria-checked={shape === s} onClick={() => setShape(s)}>
              {label}
            </Btn>
          ))}
        </div>
      )}
    </div>
  );
}

/** Saves the OpenAI key (the same one Kit's voice uses). It's checked, encrypted and never shown again. */
export function OpenAIKeyForm({ onSaved }: { onSaved?: () => void }) {
  const { reload } = useTracker();
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/kit/voice/key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Couldn't save it");
      setKey("");
      await reload();
      onSaved?.();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <p className="text-base">
        ChatGPT images run on your OpenAI account through an API key: <b>platform.openai.com → API keys → Create new secret key</b>. Logging in to the ChatGPT website can&apos;t be used, because the
        staff work on the tracker&apos;s server, not in your browser. Each image is billed to your OpenAI account (a high-quality ad image is roughly US$0.20 to 0.25). The same key also gives Kit a real voice.
      </p>
      <form
        className="flex gap-2 flex-wrap"
        onSubmit={(e) => {
          e.preventDefault();
          if (key.trim()) save();
        }}
      >
        <input type="password" autoComplete="off" className="flex-1 min-w-48" placeholder="sk-…" value={key} onChange={(e) => setKey(e.target.value)} />
        <Btn kind="primary" disabled={busy || !key.trim()}>
          {busy ? "Checking…" : "Save key"}
        </Btn>
      </form>
      {msg && <p className="text-bad font-bold">{msg}</p>}
    </div>
  );
}
