"use client";

import { useState } from "react";
import { WIcon, WendyMark } from "@/components/wendy/WendyIcons";

// Wendy's own sign-in (same passcode as the tracker).
export default function WendyLogin() {
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
      <form onSubmit={submit} className="wd-card w-full max-w-md p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <WendyMark size={92} />
        </div>
        <div className="space-y-2">
          <h1 className="wd-display text-5xl text-[#3a1e55]">
            Wendy<span className="text-[#d9579a]">.</span>
          </h1>
          <p className="text-lg wd-muted font-semibold">Welcome back. Enter your passcode.</p>
        </div>
        <input type="password" autoFocus className="text-center tracking-[0.3em]" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" aria-label="Passcode" />
        {error && <p className="text-base font-bold text-[#c43c6c]">{error}</p>}
        <button disabled={busy} className="wd-btn wd-btn-primary wd-generate">
          <WIcon name="sparkle" size={24} fill />
          {busy ? "Opening…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
