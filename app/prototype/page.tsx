"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { applyLook } from "@/lib/appearance";
import {
  DEFAULT_PROTOTYPE_MODEL,
  PROTOTYPE_DEADLINE_MIN,
  PROTOTYPE_MODELS,
  buildPercent,
  buildStage,
  modelLabel,
  normalizeLink,
  type PrototypeJob,
} from "@/lib/prototype";
import type { Appearance } from "@/lib/appearance";
import type { PrototypeSettings } from "@/lib/types";

// Prototype maker: paste a client's socials (or describe the business), pick who builds it,
// and watch the website get built live. Finished sites live at /p/<slug>/.

interface Loaded {
  jobs: PrototypeJob[];
  settings: PrototypeSettings;
  fireToken: boolean;
  appearance: Appearance;
}

const LINK_HINTS = ["Instagram, e.g. instagram.com/brand or @brand", "Facebook page", "Website, TikTok, Linktree… (optional)"];

export default function PrototypeMaker() {
  const [state, setState] = useState<Loaded | null>(null);
  const [error, setError] = useState("");
  const [links, setLinks] = useState<string[]>(["", "", ""]);
  const [description, setDescription] = useState("");
  const [model, setModel] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/prototype", { cache: "no-store" });
    if (res.status === 401) return void (window.location.href = "/login");
    const json = await res.json();
    if (!res.ok) return setError(json.error ?? "Couldn't load the Prototype maker");
    setError("");
    setState(json);
  }, []);

  useEffect(() => {
    document.title = "Prototype maker";
    load();
  }, [load]);
  useEffect(() => {
    if (state) applyLook(state.appearance);
  }, [state?.appearance]); // eslint-disable-line react-hooks/exhaustive-deps

  // While anything is being built, keep the list fresh.
  const live = state?.jobs.some((j) => ["preparing", "queued", "building"].includes(j.status));
  useEffect(() => {
    if (!live) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [live, load]);

  const chosenModel = model || state?.settings.defaultModel || DEFAULT_PROTOTYPE_MODEL;
  const cleanLinks = links.map((l) => l.trim()).filter(Boolean);
  const badLink = cleanLinks.find((l) => !normalizeLink(l));
  const canSubmit = !busy && !badLink && (cleanLinks.length > 0 || description.trim().length >= 15);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setNotice("");
    setError("");
    const res = await fetch("/api/prototype", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links: cleanLinks, description, model: chosenModel }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.error ?? "Couldn't start it");
    setLinks(["", "", ""]);
    setDescription("");
    setNotice(
      json.fire
        ? json.fire === "not set up"
          ? "Saved. The builder isn't connected for instant starts yet, so it starts at the next hourly check. Connect it in Settings below to start in seconds."
          : `Saved, but the builder didn't start: ${json.fire}. It will still be picked up at the next hourly check.`
        : "On it. The builder has started; watch it below.",
    );
    await load();
  }

  if (error && !state) return <div className="p-6 text-bad text-lg font-bold">{error}</div>;
  if (!state) return <div className="min-h-screen grid place-content-center font-display text-3xl tracking-wide">Loading…</div>;

  return (
    <main className="max-w-5xl mx-auto px-4 pb-24">
      <header className="hud hud-hero mt-5 mb-6 px-5 sm:px-7 py-6 overflow-hidden">
        <div className="flex items-start gap-4 flex-wrap">
          <span className="grid place-items-center w-16 h-16 rounded-[10px] bg-gold text-outline border-[3px] border-outline shadow-[3px_3px_0_var(--color-outline)] shrink-0">
            <Icon name="wand" size={38} />
          </span>
          <div className="flex-1 min-w-60">
            <h1 className="comic-num text-4xl sm:text-5xl leading-none uppercase">Prototype maker</h1>
            <p className="text-lg text-muted font-bold mt-2 max-w-2xl">
              Paste a client&apos;s social links. Claude studies the business, pulls their pictures and branding, and builds a full website prototype with a working mock checkout or booking, in under {PROTOTYPE_DEADLINE_MIN} minutes.
            </p>
          </div>
          <button type="button" onClick={() => setShowSettings((v) => !v)} className="btn btn-ghost flex items-center gap-2" aria-expanded={showSettings}>
            <Icon name="gear" size={22} />
            Settings
          </button>
        </div>
      </header>

      {showSettings && <SettingsPanel state={state} onSaved={load} />}
      {!state.settings.fireUrl || !state.fireToken ? <ConnectBanner onOpen={() => setShowSettings(true)} /> : null}

      <form onSubmit={submit} className="hud p-5 sm:p-7 space-y-6">
        <span className="caption caption-cyan">New prototype</span>
        <div className="space-y-3">
          <label className="block text-xl font-extrabold">Client&apos;s social media links</label>
          {links.map((l, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Icon name="link" size={24} className="text-muted shrink-0" />
              <input
                className="flex-1 text-lg"
                value={l}
                inputMode="url"
                placeholder={LINK_HINTS[i] ?? "Another link"}
                onChange={(e) => setLinks((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
                aria-label={`Link ${i + 1}`}
              />
              {links.length > 1 && (
                <button type="button" className="btn btn-ghost px-3" onClick={() => setLinks((all) => all.filter((_, j) => j !== i))} aria-label="Remove this link">
                  Remove
                </button>
              )}
            </div>
          ))}
          {badLink && <p className="text-base font-bold text-bad">&ldquo;{badLink}&rdquo; doesn&apos;t look like a link.</p>}
          {links.length < 6 && (
            <button type="button" className="btn btn-ghost text-base" onClick={() => setLinks((all) => [...all, ""])}>
              + Add another link
            </button>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xl font-extrabold" htmlFor="desc">
            What&apos;s the business about? <span className="text-muted font-bold">(optional)</span>
          </label>
          <textarea
            id="desc"
            rows={4}
            className="w-full text-lg"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Use this when there are no links, or to add what the links don't say: what they sell or offer, where they are, price range, the vibe they want."
          />
          <p className="text-base text-muted font-bold">Links work best: the builder uses their real photos, logo and colours.</p>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-xl font-extrabold mb-3">Who builds it?</legend>
          <div className="grid sm:grid-cols-3 gap-3">
            {PROTOTYPE_MODELS.map((m) => (
              <label key={m.id} className={`hud p-4 cursor-pointer flex gap-3 items-start ${chosenModel === m.id ? "hud-gold" : ""}`} style={{ animation: "none" }}>
                <input type="radio" name="model" className="mt-1.5 w-5 h-5" checked={chosenModel === m.id} onChange={() => setModel(m.id)} />
                <span>
                  <span className="block text-xl font-extrabold">{m.label}</span>
                  <span className="block text-base text-muted font-bold">{m.note}</span>
                  {m.id === (state.settings.defaultModel || DEFAULT_PROTOTYPE_MODEL) && <span className="block text-sm text-gold font-extrabold uppercase mt-1">Default</span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-lg font-bold text-bad">{error}</p>}
        <button disabled={!canSubmit} className="btn btn-primary w-full text-2xl py-4 flex items-center justify-center gap-3">
          <Icon name="wand" size={28} />
          {busy ? "Reading their links and saving their pictures…" : "Make the prototype"}
        </button>
        {notice && <p className="text-lg font-bold text-good">{notice}</p>}
      </form>

      <section className="mt-8 space-y-4">
        <span className="caption">Prototypes</span>
        {state.jobs.length === 0 && <p className="text-lg text-muted font-bold">Nothing yet. Your prototypes show up here, with a link to share with the client.</p>}
        {state.jobs.map((j) => (
          <JobCard key={j.id} job={j} onChange={load} />
        ))}
      </section>
    </main>
  );
}

function clock(min: number) {
  const s = Math.max(0, Math.round(min * 60));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  preparing: { label: "Reading links", cls: "bg-accent" },
  queued: { label: "Waiting for the builder", cls: "bg-warn" },
  building: { label: "Building", cls: "bg-hero" },
  ready: { label: "Ready", cls: "bg-good" },
  failed: { label: "Didn't work", cls: "bg-bad" },
};

function JobCard({ job, onChange }: { job: PrototypeJob; onChange: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const running = ["preparing", "queued", "building"].includes(job.status);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  const end = job.finishedAt ? new Date(job.finishedAt).getTime() : now;
  const took = (end - new Date(job.createdAt).getTime()) / 60000;
  const href = `/p/${job.slug}/`;
  const name = job.businessName || job.links[0]?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") || job.description.slice(0, 40) || "Prototype";
  const s = STATUS[job.status] ?? { label: job.status, cls: "bg-card-2" };
  const pct = buildPercent(job);
  const [copied, setCopied] = useState(false);

  async function act(action: "retry" | "remove") {
    if (action === "remove" && !confirm("Remove this prototype? Its link stops working.")) return;
    await fetch(`/api/prototype/${job.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    onChange();
  }

  return (
    <article className="hud p-5 space-y-3">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-52">
          <h2 className="text-2xl font-extrabold leading-tight break-words">{name}</h2>
          <p className="text-base text-muted font-bold">
            {job.businessType ? `${job.businessType} · ` : ""}
            {modelLabel(job.model)} · {new Date(job.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            {job.pictures ? ` · ${job.pictures} picture${job.pictures === 1 ? "" : "s"} pulled from their links` : ""}
          </p>
        </div>
        <span className={`text-sm font-extrabold uppercase px-3 py-1 border-[3px] border-outline rounded-md text-outline ${s.cls}`}>{s.label}</span>
      </div>

      {(running || job.status === "ready") && (
        <div className="space-y-2">
          <div className="flex justify-between items-baseline gap-3 flex-wrap">
            <span className="text-lg font-extrabold">{buildStage(job)}</span>
            <span className="text-2xl font-extrabold tabular-nums">{pct}%</span>
          </div>
          <div className="h-7 border-[3px] border-outline rounded-md bg-card-2 overflow-hidden relative" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Build progress">
            <div className={`h-full transition-[width] duration-700 ${job.status === "ready" ? "bg-good" : "bg-gold"} ${running ? "proto-stripes" : ""}`} style={{ width: `${Math.max(pct, 3)}%` }} />
          </div>
          <div className="flex justify-between gap-3 flex-wrap text-base font-bold">
            <span className={took > PROTOTYPE_DEADLINE_MIN ? "text-bad" : "text-muted"}>
              {job.status === "ready" ? `Built in ${clock(took)}` : `Time: ${clock(took)} of ${PROTOTYPE_DEADLINE_MIN}:00`}
            </span>
            {running && <span className="text-muted">{job.pages.length} page{job.pages.length === 1 ? "" : "s"} saved{job.planned ? ` of ${job.planned}` : ""}</span>}
          </div>
        </div>
      )}

      {job.summary && <p className="text-lg">{job.summary}</p>}
      {job.error && <p className="text-lg font-bold text-bad">{job.error}</p>}

      {job.progress.length > 0 && (running || job.status === "failed") && (
        <ol className="text-base space-y-1 border-l-[3px] border-outline pl-3">
          {job.progress.slice(-6).map((p, i) => (
            <li key={i} className={i === Math.min(job.progress.length, 6) - 1 ? "font-extrabold" : "text-muted font-bold"}>
              <span className="tabular-nums mr-2">{new Date(p.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
              {p.text}
            </li>
          ))}
        </ol>
      )}

      {job.pages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {job.pages.map((p) => (
            <a key={p.path} href={`${href}${p.path === "index" ? "" : p.path}`} target="_blank" rel="noreferrer" className="btn btn-ghost text-base py-1.5">
              {p.title || p.path}
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {(job.status === "ready" || job.pages.length > 0) && (
          <a href={href} target="_blank" rel="noreferrer" className="btn btn-primary flex items-center gap-2">
            <Icon name="browser" size={22} />
            Open prototype
          </a>
        )}
        {job.status === "ready" && (
          <button
            type="button"
            className="btn btn-ghost flex items-center gap-2"
            onClick={async () => {
              await navigator.clipboard.writeText(new URL(href, window.location.href).toString()).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
          >
            <Icon name="link" size={20} />
            {copied ? "Copied" : "Copy link for the client"}
          </button>
        )}
        {(job.status === "failed" || (running && took > 25)) && (
          <button type="button" className="btn btn-hero" onClick={() => act("retry")}>
            Try again
          </button>
        )}
        <button type="button" className="btn btn-ghost ml-auto" onClick={() => act("remove")}>
          Remove
        </button>
      </div>
    </article>
  );
}

function ConnectBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="hud hud-gold p-4 mb-6 flex items-center gap-3 flex-wrap">
      <Icon name="bolt" size={28} className="text-gold" />
      <p className="flex-1 min-w-60 text-lg font-bold">Builds start at the next hourly check until the builder is connected for instant starts. It takes one token, once.</p>
      <button type="button" className="btn btn-primary" onClick={onOpen}>
        Connect
      </button>
    </div>
  );
}

function SettingsPanel({ state, onSaved }: { state: Loaded; onSaved: () => void }) {
  const [s, setS] = useState<PrototypeSettings>(state.settings);
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof PrototypeSettings, v: string) => setS((x) => ({ ...x, [k]: v }));

  async function save(clearToken = false) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/prototype/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, ...(token.trim() ? { fireToken: token.trim() } : clearToken ? { fireToken: null } : {}) }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(json.error ?? "Couldn't save");
    setToken("");
    setMsg("Saved.");
    onSaved();
  }
  async function test() {
    setMsg("Testing…");
    const json = await (await fetch("/api/prototype/settings", { method: "POST" })).json();
    setMsg(json.ok ? "Connected: the builder started (it found nothing new and stopped)." : `Not working yet: ${json.error}`);
  }

  return (
    <section className="hud p-5 sm:p-7 mb-6 space-y-5">
      <span className="caption caption-hero">Settings</span>
      <div className="grid sm:grid-cols-2 gap-5">
        <label className="space-y-1.5 block">
          <span className="block text-lg font-extrabold">Default builder</span>
          <select className="w-full text-lg" value={s.defaultModel || DEFAULT_PROTOTYPE_MODEL} onChange={(e) => set("defaultModel", e.target.value)}>
            {PROTOTYPE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}: {m.note}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 block">
          <span className="block text-lg font-extrabold">Credit in the corner of every prototype</span>
          <input className="w-full text-lg" value={s.badge ?? ""} onChange={(e) => set("badge", e.target.value)} placeholder="e.g. Prototype by Your Agency (blank = none)" />
        </label>
      </div>
      <label className="space-y-1.5 block">
        <span className="block text-lg font-extrabold">Standing instructions for every prototype</span>
        <textarea rows={3} className="w-full text-lg" value={s.extra ?? ""} onChange={(e) => set("extra", e.target.value)} placeholder="e.g. Always add a Messenger chat button. Prefer dark, moody designs for restaurants." />
      </label>
      <label className="space-y-1.5 block">
        <span className="block text-lg font-extrabold">Where the tracker&apos;s Prototype maker button goes</span>
        <input className="w-full text-lg" value={s.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://prototypemaker.yourdomain.com (blank = this app's /prototype page)" />
      </label>

      <div className="hud hud-gold p-4 space-y-3" style={{ animation: "none" }}>
        <h3 className="text-xl font-extrabold flex items-center gap-2">
          <Icon name="bolt" size={24} /> Instant start {state.settings.fireUrl && state.fireToken ? <span className="text-good">: connected</span> : null}
        </h3>
        <p className="text-base font-bold text-muted">
          Without this, a request waits for the hourly check. With it, the builder starts within seconds. One time: open{" "}
          <a className="underline text-ink" href="https://claude.ai/code/routines" target="_blank" rel="noreferrer">
            claude.ai/code/routines
          </a>
          , open <b>Prototype maker builds</b>, choose Edit, press <b>+</b> next to Trigger, pick <b>API</b>, press <b>Generate token</b> and paste the token below.
        </p>
        <label className="space-y-1.5 block">
          <span className="block text-base font-extrabold">Start address (Fire URL)</span>
          <input className="w-full text-base" value={s.fireUrl ?? ""} onChange={(e) => set("fireUrl", e.target.value)} placeholder="https://api.anthropic.com/v1/claude_code/routines/trig_…/fire" />
        </label>
        <label className="space-y-1.5 block">
          <span className="block text-base font-extrabold">Token {state.fireToken && <span className="text-good">(saved)</span>}</span>
          <input className="w-full text-base" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={state.fireToken ? "Saved. Paste a new one to replace it." : "sk-ant-oat01-…"} autoComplete="off" />
        </label>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="btn btn-ghost" disabled={!state.settings.fireUrl || !state.fireToken} onClick={test}>
            Test the connection
          </button>
          {state.fireToken && (
            <button type="button" className="btn btn-danger" onClick={() => save(true)}>
              Remove token
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" disabled={busy} className="btn btn-primary text-xl" onClick={() => save()}>
          {busy ? "Saving…" : "Save settings"}
        </button>
        {msg && <span className="text-lg font-bold">{msg}</span>}
      </div>
    </section>
  );
}
