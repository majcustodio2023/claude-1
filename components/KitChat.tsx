"use client";

import { useEffect, useRef, useState } from "react";
import { uid } from "@/lib/finance";
import { stripActions, type KitAction } from "@/lib/kit";
import { CUSTOM_PERSONA, PERSONAS, personaFor, type Persona } from "@/lib/personas";
import type { KitMessage } from "@/lib/types";
import { useTracker } from "./App";
import { Btn } from "./ui";
import { Kit } from "./characters";

const KEEP = 30;

// Minimal typing for the browser speech recognizer (Chrome/Edge/Safari).
type Recognizer = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
const getRecognizer = (): (new () => Recognizer) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** Browser voice, used when no AI voice is set up. Picks the most natural-sounding English voice available. */
function speakInBrowser(text: string, persona: Persona) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripActions(text).replace(/[*_#`]/g, ""));
  u.rate = persona.rate;
  u.pitch = persona.pitch;
  const english = window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  const voice = english.find((v) => /natural|neural|online|premium|enhanced/i.test(v.name)) ?? english.find((v) => /google|samantha|aria|jenny/i.test(v.name)) ?? english[0];
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

let current: HTMLAudioElement | null = null;

/** Kit's real voice (AI text-to-speech acted in the personality); falls back to the browser voice. */
async function speak(text: string, persona: Persona, aiVoice: boolean, onError: (msg: string) => void) {
  current?.pause();
  window.speechSynthesis?.cancel();
  if (!aiVoice) return speakInBrowser(text, persona);
  try {
    const res = await fetch("/api/kit/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Voice failed");
    const url = URL.createObjectURL(await res.blob());
    current = new Audio(url);
    current.onended = () => URL.revokeObjectURL(url);
    await current.play();
  } catch (e) {
    onError(`${(e as Error).message}. Using the browser voice instead.`);
    speakInBrowser(text, persona);
  }
}

export default function KitChat() {
  const { data, update, today } = useTracker();
  const [hasKey, setHasKey] = useState(Boolean(data.integrations?.kit));
  const [aiVoice, setAiVoice] = useState(Boolean(data.integrations?.voice));
  const [voiceSetup, setVoiceSetup] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [voice, setVoice] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognizer | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const chat = data.kitChat ?? [];
  const canListen = Boolean(getRecognizer());
  const personaId = data.settings.kitPersona ?? "kit";
  const persona = personaFor(personaId);
  const kitName = personaId === CUSTOM_PERSONA ? "Kit" : persona.name;

  useEffect(() => {
    try {
      setVoice(localStorage.getItem("kit:voice") === "1");
    } catch {}
  }, []);
  useEffect(() => endRef.current?.scrollIntoView({ block: "nearest" }), [chat.length, busy]);

  const toggleVoice = () => {
    const next = !voice;
    setVoice(next);
    if (!next) {
      window.speechSynthesis?.cancel();
      current?.pause();
    }
    try {
      localStorage.setItem("kit:voice", next ? "1" : "0");
    } catch {}
  };

  const apply = (actions: KitAction[]) =>
    update((d) => {
      for (const a of actions) {
        if (a.type === "set_briefing") d.briefing = { date: today, headline: a.headline, points: a.points, inspiration: a.inspiration };
        if (a.type === "add_quest") d.todos[today] = [...(d.todos[today] ?? []), { id: uid("todo"), text: a.text, done: false, source: "manual" }];
      }
    });

  const send = async (raw: string) => {
    const msg = raw.trim();
    if (!msg || busy) return;
    setText("");
    setError("");
    const mine: KitMessage = { role: "user", text: msg, at: new Date().toISOString() };
    const history = [...chat, mine];
    update((d) => void (d.kitChat = history.slice(-KEEP)));
    setBusy(true);
    try {
      const res = await fetch("/api/kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, text }) => ({ role, text: role === "assistant" ? stripActions(text) : text })), today }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Kit couldn't answer");
      const reply: KitMessage = { role: "assistant", text: json.reply || "Done!", at: new Date().toISOString() };
      update((d) => void (d.kitChat = [...(d.kitChat ?? []), reply].slice(-KEEP)));
      if (json.actions?.length) apply(json.actions);
      if (voice) speak(reply.text, persona, aiVoice, setError);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const listen = () => {
    const R = getRecognizer();
    if (!R) return;
    if (listening) return recRef.current?.stop();
    const rec = new R();
    rec.lang = data.settings.locale || navigator.language;
    rec.interimResults = false;
    rec.onresult = (e) => send(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  if (!hasKey) return <KeyForm onSaved={() => setHasKey(true)} />;

  return (
    <div className="mt-5 border-t-[3px] border-outline pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="font-display text-xl tracking-wide">Talk to {kitName}</span>
        <div className="flex gap-2 flex-wrap justify-end items-center">
          <select
            className="text-base max-w-full"
            aria-label="Kit's personality"
            title="Kit's personality"
            value={personaId}
            onChange={(e) => {
              const id = e.target.value;
              update((d) => void (d.settings.kitPersona = id));
            }}
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
            <option value={CUSTOM_PERSONA}>✍️ Your own</option>
          </select>
          {chat.length > 0 && (
            <button className="text-base text-muted underline" onClick={() => confirm("Clear the chat with Kit?") && update((d) => void (d.kitChat = []))}>
              Clear
            </button>
          )}
          <button className={`btn ${voice ? "btn-primary" : "btn-ghost"} px-3`} onClick={toggleVoice} title="Kit reads replies out loud" aria-pressed={voice}>
            {voice ? "🔊 Voice on" : "🔈 Voice off"}
          </button>
          <button className="text-base text-muted underline" onClick={() => setVoiceSetup(!voiceSetup)}>
            {aiVoice ? "Voice settings" : "Make the voice real"}
          </button>
        </div>
      </div>
      {personaId !== CUSTOM_PERSONA && <p className="text-base text-muted -mt-1 mb-3">{persona.emoji} {persona.tagline}</p>}
      {personaId === CUSTOM_PERSONA && (
        <label className="block text-base text-muted mb-3">
          Describe Kit&apos;s personality (e.g. &ldquo;a sarcastic pirate who calls money doubloons&rdquo;)
          <CustomPersona value={data.settings.kitPersonaCustom ?? ""} onSave={(v) => update((d) => void (d.settings.kitPersonaCustom = v))} />
        </label>
      )}
      {voiceSetup && <VoiceSetup hasVoice={aiVoice} onChange={setAiVoice} onTest={() => speak(`${kitName} here. Let's get you paid.`, persona, aiVoice, setError)} />}
      {chat.length > 0 && (
        <div className="max-h-80 overflow-y-auto space-y-2.5 mb-3 pr-1">
          {chat.map((m, i) => (
            <div key={i} className={`flex items-end gap-1.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && <Kit size={38} className="shrink-0" />}
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-[12px] border-[3px] border-outline px-3.5 py-2 text-[1.05rem] leading-snug font-semibold ${m.role === "user" ? "bg-accent text-outline" : "bg-[#fffbea] text-[#15132b]"}`}>
                {m.role === "assistant" ? stripActions(m.text) : m.text}
              </div>
              {m.role === "assistant" && (
                <button className="shrink-0 text-xl" title="Play this reply" aria-label="Play this reply" onClick={() => speak(m.text, persona, aiVoice, setError)}>
                  🔊
                </button>
              )}
            </div>
          ))}
          {busy && <div className="text-lg font-bold text-gold animate-pulse">{kitName} is thinking…</div>}
          <div ref={endRef} />
        </div>
      )}
      {error && <p className="text-base font-bold text-bad mb-2">{error}</p>}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <input className="flex-1 min-w-0 text-lg" placeholder={chat.length ? "Reply to Kit…" : "Ask Kit anything, or say “rewrite my briefing for today”"} value={text} onChange={(e) => setText(e.target.value)} />
        {canListen && (
          <button type="button" className={`btn ${listening ? "btn-hero animate-pulse" : "btn-ghost"} px-3`} onClick={listen} aria-label={listening ? "Stop listening" : "Talk"} title="Talk to Kit">
            🎤
          </button>
        )}
        <Btn kind="primary" disabled={busy || !text.trim()}>Send</Btn>
      </form>
    </div>
  );
}

function VoiceSetup({ hasVoice, onChange, onTest }: { hasVoice: boolean; onChange: (on: boolean) => void; onTest: () => void }) {
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (value: string | null) => {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/kit/voice/key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: value }) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(json.error);
    setKey("");
    onChange(Boolean(value));
    setMsg(value ? "Real voice on. Press Test." : "Back to the browser voice.");
  };
  return (
    <div className="mb-3 rounded-[12px] border-[3px] border-outline bg-card-2 p-3 space-y-2">
      {hasVoice ? (
        <p className="text-base">Kit speaks with a real AI voice, acted in the personality you pick (Shadow Kit is deep and menacing, Chaos Kit is manic, and so on).</p>
      ) : (
        <p className="text-base">
          The robotic sound is your browser&apos;s built-in voice. For a real voice acted in Kit&apos;s personality, paste an OpenAI API key (platform.openai.com → API keys). It&apos;s encrypted, never shown again, and costs well under a peso per reply.
        </p>
      )}
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (key.trim()) save(key);
        }}
      >
        {!hasVoice && <input type="password" autoComplete="off" className="flex-1 min-w-48" placeholder="sk-…" value={key} onChange={(e) => setKey(e.target.value)} />}
        {!hasVoice && <Btn kind="primary" disabled={busy}>{busy ? "Checking…" : "Save key"}</Btn>}
        <Btn type="button" onClick={onTest}>▶ Test voice</Btn>
        {hasVoice && (
          <Btn type="button" disabled={busy} onClick={() => confirm("Remove the voice key and go back to the browser voice?") && save(null)}>
            Remove key
          </Btn>
        )}
      </form>
      {msg && <p className="text-base font-bold">{msg}</p>}
    </div>
  );
}

function CustomPersona({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return <textarea className="w-full mt-1 text-lg" rows={2} maxLength={600} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onSave(v)} />;
}

function KeyForm({ onSaved }: { onSaved: () => void }) {
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-5 border-t-[3px] border-outline pt-4 space-y-2">
      <p className="text-lg">
        <span className="font-display text-xl tracking-wide">Wake Kit up:</span> to chat, Kit needs a Claude API key. Get one at console.anthropic.com → API keys, then paste it here (not in chat). It&apos;s encrypted and never shown again.
      </p>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!key.trim()) return;
          setBusy(true);
          setMsg("");
          const res = await fetch("/api/kit/key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
          const json = await res.json();
          setBusy(false);
          if (!res.ok) return setMsg(json.error);
          setKey("");
          onSaved();
        }}
      >
        <input type="password" autoComplete="off" className="flex-1 min-w-48" placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value)} />
        <Btn kind="primary" disabled={busy}>{busy ? "Checking…" : "Save key"}</Btn>
      </form>
      {msg && <p className="text-base font-bold text-bad">{msg}</p>}
    </div>
  );
}
