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
      <form onSubmit={submit} className="w-full max-w-sm bg-card border border-line rounded-2xl p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Agency Tracker</h1>
          <p className="text-sm text-muted">Enter your passcode to continue.</p>
        </div>
        <input type="password" autoFocus className="w-full" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passcode" />
        {error && <p className="text-sm text-bad">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-accent text-white dark:text-black py-2 font-medium disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
