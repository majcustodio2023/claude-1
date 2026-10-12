"use client";

import { useState } from "react";

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
    <main className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className="hud hud-hero w-full max-w-sm p-7 space-y-5">
        <div className="text-center space-y-2">
          <div className="font-display text-[0.65rem] text-hero uppercase">Hero HQ</div>
          <h1 className="font-display text-2xl font-extrabold glow-text-cyan">AGENCY TRACKER</h1>
          <p className="text-sm text-muted">Enter your passcode to start the day.</p>
        </div>
        <input type="password" autoFocus className="w-full text-center tracking-[0.3em]" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" aria-label="Passcode" />
        {error && <p className="text-sm text-bad text-center">{error}</p>}
        <button disabled={busy} className="btn btn-primary w-full py-3">
          {busy ? "Loading…" : "Press start"}
        </button>
      </form>
    </main>
  );
}
