"use client";

import { useState } from "react";
import { Hero } from "@/components/characters";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    setBusy(false);
    if (res.ok) window.location.href = "/";
    else setError((await res.json()).error ?? "Could not sign in");
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-end justify-center gap-2 mb-[-6px] relative z-10">
          <Hero mood="ready" size={190} className="bob drop-shadow-[5px_5px_0_#0b0a14]" />
          <div className="bubble px-4 py-3 mb-28 max-w-52">
            <p className="font-display text-xl leading-tight tracking-wide text-[#15132b]">Ready to get that bag today?</p>
          </div>
        </div>
        <form onSubmit={submit} className="hud hud-hero p-7 space-y-5">
          <div className="text-center space-y-2">
            <span className="caption caption-hero">Hero HQ</span>
            <h1 className="comic-num text-5xl text-gold pt-2">AGENCY TRACKER</h1>
            <p className="text-lg text-muted font-bold">Enter your passcode to start the day.</p>
          </div>
          <input type="password" autoFocus className="w-full text-center text-xl tracking-[0.3em]" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" aria-label="Passcode" />
          {error && <p className="text-base font-bold text-bad text-center">{error}</p>}
          <button disabled={busy} className="btn btn-primary w-full text-2xl py-3">
            {busy ? "Loading…" : "Press start!"}
          </button>
        </form>
      </div>
    </main>
  );
}
