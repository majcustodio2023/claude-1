"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PROTOTYPE_MODEL, PROTOTYPE_DEADLINE_MIN, PROTOTYPE_MODELS, modelLabel, normalizeLink, type PrototypeJob } from "@/lib/prototype";
import type { PrototypeSettings } from "@/lib/types";
import { Studio } from "@/components/wendy/Studio";
import { WIcon, WendyMark } from "@/components/wendy/WendyIcons";

// Wendy: the Prototype maker's feminine twin. Same builder and queue, her own look, her own list,
// and a prompt-instructions box that goes straight into the builder's brief.

interface Loaded {
  jobs: PrototypeJob[];
  settings: PrototypeSettings;
}

const LINK_HINTS = ["Instagram, e.g. instagram.com/brand or @brand", "Facebook page", "Website, TikTok, Linktree (optional)"];

/** One tap adds a common instruction to the prompt box. */
const QUICK = [
  "Make it feel luxurious and minimal.",
  "Soft pastel palette, lots of white space.",
  "Bold editorial look with big photography.",
  "Write the copy in Taglish.",
  "Put bookings front and centre.",
  "Add a Messenger chat button on every page.",
  "Include an FAQ and testimonials section.",
];

const live = (j: PrototypeJob) => ["preparing", "queued", "building"].includes(j.status);

export default function Wendy() {
  const [state, setState] = useState<Loaded | null>(null);
  const [error, setError] = useState("");
  const [links, setLinks] = useState<string[]>(["", "", ""]);
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  /** The job shown in the big studio pop-up ("pending" while the links are being read). */
  const [watching, setWatching] = useState<string | null>(null);
  const [pending, setPending] = useState<PrototypeJob | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/prototype?brand=wendy", { cache: "no-store" });
    if (res.status === 401) return void (window.location.href = "/login");
    const json = await res.json();
    if (!res.ok) return setError(json.error ?? "Couldn't load Wendy");
    setError("");
    setState({ jobs: json.jobs, settings: json.settings ?? {} });
  }, []);

  useEffect(() => {
    document.title = "Wendy";
    load();
  }, [load]);

  const anyLive = state?.jobs.some(live);
  useEffect(() => {
    if (!anyLive) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [anyLive, load]);

  const chosenModel = model || state?.settings.defaultModel || DEFAULT_PROTOTYPE_MODEL;
  const cleanLinks = links.map((l) => l.trim()).filter(Boolean);
  const badLink = cleanLinks.find((l) => !normalizeLink(l));
  const canSubmit = !busy && !badLink && (cleanLinks.length > 0 || description.trim().length >= 15 || instructions.trim().length >= 15);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    // Open the studio straight away; it shows the real job as soon as it exists.
    setPending({
      id: "pending",
      slug: "reading-their-socials",
      status: "preparing",
      model: chosenModel,
      links: cleanLinks,
      description,
      createdAt: new Date().toISOString(),
      progress: [{ at: new Date().toISOString(), text: "Reading the links and saving the pictures." }],
      pictures: 0,
      pages: [],
    });
    setWatching("pending");
    const res = await fetch("/api/prototype", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: "wendy", links: cleanLinks, description, instructions, model: chosenModel }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setPending(null);
    if (!res.ok) {
      setWatching(null);
      return setError(json.error ?? "Couldn't start it");
    }
    setLinks(["", "", ""]);
    setDescription("");
    setInstructions("");
    setWatching(json.job?.id ?? null);
    await load();
  }

  if (error && !state)
    return (
      <div className="min-h-screen grid place-content-center p-6 text-xl font-bold text-[#c43c6c]">
        {error}
      </div>
    );
  if (!state)
    return (
      <div className="min-h-screen grid place-content-center gap-4 justify-items-center">
        <span className="animate-pulse">
          <WendyMark size={84} />
        </span>
        <span className="wd-script text-3xl text-[#5e2b97]">Wendy is getting ready…</span>
      </div>
    );

  const watched = watching === "pending" ? pending : state.jobs.find((j) => j.id === watching) ?? null;

  return (
    <main className="max-w-6xl mx-auto px-4 pb-24">
      <header className="pt-8 pb-8 flex items-center gap-4 flex-wrap">
        <WendyMark size={72} />
        <div className="flex-1 min-w-60">
          <h1 className="wd-display text-5xl sm:text-6xl leading-none text-[#3a1e55]">
            Wendy<span className="text-[#d9579a]">.</span>
          </h1>
          <p className="text-lg sm:text-xl wd-muted font-semibold mt-1.5">Beautiful website prototypes from a client&apos;s socials.</p>
        </div>
        <button type="button" onClick={() => setShowSettings((v) => !v)} className="wd-btn" aria-expanded={showSettings}>
          <WIcon name="gear" size={22} />
          Settings
        </button>
      </header>

      {showSettings && <SettingsPanel settings={state.settings} onSaved={load} />}

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <form onSubmit={submit} className="wd-card p-5 sm:p-8 space-y-7">
          <div className="space-y-1">
            <span className="wd-chip-label">
              <WIcon name="sparkle" size={16} fill /> New prototype
            </span>
            <h2 className="wd-display text-3xl sm:text-4xl pt-2">Who are we designing for?</h2>
          </div>

          <div className="space-y-3">
            <label className="block text-xl font-bold">Client&apos;s social media links</label>
            {links.map((l, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="grid place-items-center w-11 h-11 rounded-full bg-[#fdeef5] text-[#d9579a] shrink-0">
                  <WIcon name="link" size={20} />
                </span>
                <input
                  value={l}
                  inputMode="url"
                  placeholder={LINK_HINTS[i] ?? "Another link"}
                  onChange={(e) => setLinks((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
                  aria-label={`Link ${i + 1}`}
                />
                {links.length > 1 && (
                  <button type="button" className="wd-btn wd-btn-soft px-3 py-2.5" onClick={() => setLinks((all) => all.filter((_, j) => j !== i))} aria-label="Remove this link">
                    <WIcon name="close" size={18} />
                  </button>
                )}
              </div>
            ))}
            {badLink && <p className="text-base font-bold text-[#c43c6c]">&ldquo;{badLink}&rdquo; doesn&apos;t look like a link.</p>}
            {links.length < 6 && (
              <button type="button" className="wd-btn wd-btn-soft text-base" onClick={() => setLinks((all) => [...all, ""])}>
                <WIcon name="plus" size={18} /> Add another link
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xl font-bold" htmlFor="wd-desc">
              About the business <span className="wd-muted font-semibold">(optional)</span>
            </label>
            <textarea
              id="wd-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What they sell or offer, where they are, price range. Handy when there are no links, or to add what the links don't say."
            />
          </div>

          <div className="space-y-3 rounded-[24px] p-4 sm:p-5" style={{ background: "linear-gradient(135deg, #faf5ff, #fff3f9)" }}>
            <label className="flex items-center gap-2 text-xl font-bold text-[#5e2b97]" htmlFor="wd-instr">
              <WIcon name="pen" size={22} /> Prompt instructions for Wendy
            </label>
            <p className="text-base wd-muted font-semibold -mt-1">Tell her exactly what you want before she starts. She follows these over her defaults.</p>
            <textarea
              id="wd-instr"
              rows={5}
              className="wd-instr"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Make it feel like a high-end boutique. Use their pink and gold. Put the booking button in the hero. Add a gift card page. Keep the copy short and warm."
            />
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="wd-tag"
                  onClick={() => setInstructions((t) => (t.includes(q) ? t : `${t.trim()}${t.trim() ? "\n" : ""}${q}`))}
                >
                  <WIcon name="plus" size={14} /> {q}
                </button>
              ))}
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-xl font-bold mb-3">Who builds it?</legend>
            <div className="grid sm:grid-cols-3 gap-3">
              {PROTOTYPE_MODELS.map((m) => (
                <label key={m.id} className="wd-pick flex gap-3 items-start" data-on={chosenModel === m.id}>
                  <input type="radio" name="model" className="wd-radio" checked={chosenModel === m.id} onChange={() => setModel(m.id)} />
                  <span>
                    <span className="block text-xl font-bold">{m.label}</span>
                    <span className="block text-base wd-muted font-semibold">{m.note}</span>
                    {m.id === (state.settings.defaultModel || DEFAULT_PROTOTYPE_MODEL) && <span className="block text-sm text-[#d9579a] font-extrabold uppercase tracking-wider mt-1">Default</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-lg font-bold text-[#c43c6c]">{error}</p>}
          <button disabled={!canSubmit} className="wd-btn wd-btn-primary wd-generate">
            <WIcon name="wand" size={28} />
            {busy ? "Wendy is reading their socials…" : "Generate"}
          </button>
          <p className="text-base wd-muted font-semibold text-center -mt-3">Ready in about {PROTOTYPE_DEADLINE_MIN} minutes, with a working mock checkout and booking.</p>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="wd-card p-6 space-y-4">
            <span className="wd-chip-label">How Wendy works</span>
            {[
              ["camera", "Reads their socials", "Their photos, logo, bio and colours."],
              ["palette", "Designs the look", "A palette and fonts that fit the brand."],
              ["browser", "Builds every page", "Copy in their voice, live as each page saves."],
              ["cart", "Adds checkout and booking", "GCash, Maya, cards, a booking calendar. All mock."],
            ].map(([icon, title, sub]) => (
              <div key={title} className="flex gap-3 items-start">
                <span className="grid place-items-center w-11 h-11 rounded-2xl bg-[#ece2fb] text-[#5e2b97] shrink-0">
                  <WIcon name={icon as "camera"} size={22} />
                </span>
                <span>
                  <span className="block text-lg font-bold">{title}</span>
                  <span className="block text-base wd-muted font-semibold">{sub}</span>
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="mt-12 space-y-5">
        <div className="flex items-end gap-3 flex-wrap">
          <h2 className="wd-display text-4xl">Her work</h2>
          <span className="wd-muted font-semibold text-lg pb-1">{state.jobs.length ? `${state.jobs.length} prototype${state.jobs.length === 1 ? "" : "s"}` : ""}</span>
        </div>
        {state.jobs.length === 0 && (
          <div className="wd-card p-8 text-center space-y-2">
            <WIcon name="heart" size={34} className="mx-auto text-[#d9579a]" />
            <p className="text-xl font-bold">Nothing yet.</p>
            <p className="text-lg wd-muted font-semibold">Your prototypes show up here, each with a link to share with the client.</p>
          </div>
        )}
        {state.jobs.map((j) => (
          <JobCard key={j.id} job={j} onChange={load} onWatch={() => setWatching(j.id)} />
        ))}
      </section>

      {watched && (
        <div className="wd-overlay" role="dialog" aria-modal="true" aria-label="Wendy is building">
          <div className="wd-modal space-y-3">
            <div className="flex items-center gap-3 flex-wrap px-1">
              <h2 className="wd-display text-3xl sm:text-4xl text-white drop-shadow-[0_2px_10px_rgb(58_30_85_/_0.5)] flex-1 min-w-52">
                {watched.status === "ready" ? "She's done" : watched.status === "failed" ? "That one didn't work" : "Wendy is building"}
                <span className="text-[#f8cfe0]">.</span>
              </h2>
              {watched.status === "ready" && (
                <a href={`/p/${watched.slug}/`} target="_blank" rel="noreferrer" className="wd-btn wd-btn-primary">
                  <WIcon name="eye" size={20} /> Open prototype
                </a>
              )}
              <button type="button" className="wd-btn" onClick={() => setWatching(null)}>
                <WIcon name="close" size={18} /> {live(watched) ? "Watch from the list" : "Close"}
              </button>
            </div>
            <Studio job={watched} name={nameOf(watched)} />
            {watched.status === "failed" && watched.error && <p className="wd-card p-4 text-lg font-bold text-[#c43c6c]">{watched.error}</p>}
          </div>
        </div>
      )}
    </main>
  );
}

function nameOf(j: PrototypeJob) {
  return j.businessName || j.links[0]?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").replace(/^(instagram|facebook)\.com\//, "@") || j.description.slice(0, 40) || "Prototype";
}

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  preparing: { label: "Reading links", bg: "#ece2fb", fg: "#5e2b97" },
  queued: { label: "Starting", bg: "#fff1d6", fg: "#9a5b00" },
  building: { label: "Building", bg: "#fde0ee", fg: "#b2306f" },
  ready: { label: "Ready", bg: "#d9f4ea", fg: "#1f7a5b" },
  failed: { label: "Didn't work", bg: "#fde2e8", fg: "#c43c6c" },
};

function JobCard({ job, onChange, onWatch }: { job: PrototypeJob; onChange: () => void; onWatch: () => void }) {
  const href = `/p/${job.slug}/`;
  const s = STATUS[job.status] ?? { label: job.status, bg: "#f3eaf2", fg: "#876f9c" };
  const running = live(job);
  const took = ((job.finishedAt ? new Date(job.finishedAt).getTime() : Date.now()) - new Date(job.createdAt).getTime()) / 60000;
  const [copied, setCopied] = useState(false);

  async function act(action: "retry" | "remove") {
    if (action === "remove" && !confirm("Remove this prototype? Its link stops working.")) return;
    await fetch(`/api/prototype/${job.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    onChange();
  }

  return (
    <article className="wd-card p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-52">
          <h3 className="wd-display text-2xl sm:text-3xl leading-tight break-words">{nameOf(job)}</h3>
          <p className="text-base wd-muted font-semibold mt-0.5">
            {job.businessType ? `${job.businessType} · ` : ""}
            {modelLabel(job.model)} · {new Date(job.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            {job.pictures ? ` · ${job.pictures} picture${job.pictures === 1 ? "" : "s"} from their links` : ""}
            {job.status === "ready" ? ` · built in ${Math.max(1, Math.round(took))} min` : ""}
          </p>
        </div>
        <span className="wd-status" style={{ background: s.bg, color: s.fg }}>
          {s.label}
        </span>
      </div>

      {job.instructions?.trim() && (
        <p className="text-base font-semibold rounded-2xl px-4 py-3 bg-[#faf5ff] text-[#5e2b97] whitespace-pre-line">
          <span className="font-extrabold">Your instructions: </span>
          {job.instructions.trim()}
        </p>
      )}

      {running && <Studio job={job} compact name={nameOf(job)} />}

      {job.summary && <p className="text-lg">{job.summary}</p>}
      {job.error && <p className="text-lg font-bold text-[#c43c6c]">{job.error}</p>}

      {job.pages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {job.pages.map((p) => (
            <a key={p.path} href={`${href}${p.path === "index" ? "" : p.path}`} target="_blank" rel="noreferrer" className="wd-tag">
              {p.title || p.path}
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {(job.status === "ready" || job.pages.length > 0) && (
          <a href={href} target="_blank" rel="noreferrer" className="wd-btn wd-btn-primary">
            <WIcon name="eye" size={20} /> Open prototype
          </a>
        )}
        {job.status === "ready" && (
          <button
            type="button"
            className="wd-btn"
            onClick={async () => {
              await navigator.clipboard.writeText(new URL(href, window.location.href).toString()).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
          >
            <WIcon name="copy" size={20} /> {copied ? "Copied" : "Copy link for the client"}
          </button>
        )}
        {running && (
          <button type="button" className="wd-btn" onClick={onWatch}>
            <WIcon name="sparkle" size={18} fill /> Watch her build
          </button>
        )}
        {(job.status === "failed" || (running && took > 25)) && (
          <button type="button" className="wd-btn" onClick={() => act("retry")}>
            <WIcon name="refresh" size={18} /> Try again
          </button>
        )}
        <button type="button" className="wd-btn wd-btn-soft ml-auto" onClick={() => act("remove")}>
          <WIcon name="trash" size={18} /> Remove
        </button>
      </div>
    </article>
  );
}

function SettingsPanel({ settings, onSaved }: { settings: PrototypeSettings; onSaved: () => void }) {
  const [s, setS] = useState<PrototypeSettings>(settings);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof PrototypeSettings, v: string) => setS((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/prototype/settings?brand=wendy", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(json.error ?? "Couldn't save");
    setMsg("Saved.");
    onSaved();
  }

  return (
    <section className="wd-card p-5 sm:p-8 mb-6 space-y-5">
      <span className="wd-chip-label">
        <WIcon name="gear" size={16} /> Wendy&apos;s settings
      </span>
      <div className="grid sm:grid-cols-2 gap-5">
        <label className="space-y-1.5 block">
          <span className="block text-lg font-bold">Default builder</span>
          <select value={s.defaultModel || DEFAULT_PROTOTYPE_MODEL} onChange={(e) => set("defaultModel", e.target.value)}>
            {PROTOTYPE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}: {m.note}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 block">
          <span className="block text-lg font-bold">Credit in the corner of every prototype</span>
          <input value={s.badge ?? ""} onChange={(e) => set("badge", e.target.value)} placeholder="e.g. Designed by Wendy (blank = none)" />
        </label>
      </div>
      <label className="space-y-1.5 block">
        <span className="block text-lg font-bold">Standing instructions for every prototype</span>
        <textarea rows={3} value={s.extra ?? ""} onChange={(e) => set("extra", e.target.value)} placeholder="e.g. Always add a Messenger chat button. Prefer soft, airy designs." />
      </label>
      <p className="text-base wd-muted font-semibold">Builds start on their own within a couple of minutes of pressing Generate. Nothing to connect.</p>
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" disabled={busy} className="wd-btn wd-btn-primary text-lg" onClick={save}>
          {busy ? "Saving…" : "Save settings"}
        </button>
        {msg && <span className="text-lg font-bold text-[#2f9e78]">{msg}</span>}
      </div>
    </section>
  );
}
