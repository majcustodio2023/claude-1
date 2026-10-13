"use client";

import { useEffect, useRef, useState } from "react";
import { uid } from "@/lib/finance";
import type { KitAction } from "@/lib/kit";
import type { KitMessage } from "@/lib/types";
import { useTracker } from "./App";
import { Btn } from "./ui";

const KEEP = 30;

// Minimal typing for the browser speech recognizer (Chrome/Edge/Safari).
type Recognizer = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
const getRecognizer = (): (new () => Recognizer) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ""));
  u.rate = 1.05;
  u.pitch = 1.25;
  const voice = window.speechSynthesis.getVoices().find((v) => /en[-_](PH|US|GB)/i.test(v.lang) && /female|samantha|zira|google/i.test(v.name));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export default function KitChat() {
  const { data, update, today } = useTracker();
  const [hasKey, setHasKey] = useState(Boolean(data.integrations?.kit));
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [voice, setVoice] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognizer | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const chat = data.kitChat ?? [];
  const canListen = Boolean(getRecognizer());

  useEffect(() => {
    try {
      setVoice(localStorage.getItem("kit:voice") === "1");
    } catch {}
  }, []);
  useEffect(() => endRef.current?.scrollIntoView({ block: "nearest" }), [chat.length, busy]);

  const toggleVoice = () => {
    const next = !voice;
    setVoice(next);
    if (!next) window.speechSynthesis?.cancel();
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
        body: JSON.stringify({ messages: history.map(({ role, text }) => ({ role, text })), today }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Kit couldn't answer");
      const reply: KitMessage = { role: "assistant", text: json.reply || "Done!", at: new Date().toISOString() };
      update((d) => void (d.kitChat = [...(d.kitChat ?? []), reply].slice(-KEEP)));
      if (json.actions?.length) apply(json.actions);
      if (voice) speak(reply.text);
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
    rec.lang = "en-PH";
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
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="font-display text-xl tracking-wide">Talk to Kit</span>
        <div className="flex gap-2">
          {chat.length > 0 && (
            <button className="text-base text-muted underline" onClick={() => confirm("Clear the chat with Kit?") && update((d) => void (d.kitChat = []))}>
              Clear
            </button>
          )}
          <button className={`btn ${voice ? "btn-primary" : "btn-ghost"} px-3`} onClick={toggleVoice} title="Kit reads replies out loud" aria-pressed={voice}>
            {voice ? "🔊 Voice on" : "🔈 Voice off"}
          </button>
        </div>
      </div>
      {chat.length > 0 && (
        <div className="max-h-80 overflow-y-auto space-y-2.5 mb-3 pr-1">
          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-[12px] border-[3px] border-outline px-3.5 py-2 text-[1.05rem] leading-snug font-semibold ${m.role === "user" ? "bg-accent text-outline" : "bg-[#fffbea] text-[#15132b]"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {busy && <div className="text-lg font-bold text-gold animate-pulse">Kit is thinking…</div>}
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
