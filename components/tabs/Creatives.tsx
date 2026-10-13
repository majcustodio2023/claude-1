"use client";

import { useCallback, useEffect, useState } from "react";
import type { Creative } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Btn, Card } from "../ui";

const PROMPTS: [string, string][] = [
  ["AACIO SaaS", "Bright, modern ad image: a Filipino small business owner smiling at a laptop dashboard showing leads coming in, clean office, bold space at the top for a headline, photorealistic, 4:5"],
  ["Interior design", "Luxury Filipino condo living room, warm natural light, modern tropical interior design, wide angle, magazine-quality photo, 4:5"],
  ["Webinar", "Confident Filipino coach on a stage presenting to an online audience, ring light glow, energetic, space for a 'FREE WEBINAR' headline, 4:5"],
  ["Online course", "Young Filipino professional learning on a tablet at a café, course progress bar on screen, hopeful mood, photorealistic, 4:5"],
  ["Ecom", "Product-style flat lay of a best-selling item on a clean pastel background, studio lighting, scroll-stopping, 1:1"],
];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Something went wrong");
  return json as T;
}

export default function Creatives() {
  const { data } = useTracker();
  const [list, setList] = useState<Creative[]>(data.creatives ?? []);
  const [hasKey, setHasKey] = useState(Boolean(data.integrations?.higgsfield));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/creative", { cache: "no-store" });
    const json = await res.json();
    if (res.ok) setList(json.creatives);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const generating = list.some((c) => c.status === "generating");
  useEffect(() => {
    if (!generating) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [generating, refresh]);

  const run = async (url: string, body: unknown) => {
    setError("");
    try {
      const r = await post<{ creatives: Creative[] }>(url, body);
      setList(r.creatives);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="hud hud-gold p-4 text-lg font-bold text-bad">{error}</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Generate hasKey={hasKey} setHasKey={setHasKey} run={run} images={list.filter((c) => c.kind === "image" && c.status === "ready")} />
        <AddLink run={run} />
      </div>
      <Card icon="🎨" title="Creative vault" glow="hero">
        {list.length === 0 ? (
          <p className="text-lg text-muted">Nothing here yet. Generate an image, animate it, or add your own video by link.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <Tile key={c.id} c={c} onDelete={() => run("/api/creative", { op: "delete", id: c.id })} onChange={refresh} setError={setError} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Generate({ hasKey, setHasKey, run, images }: { hasKey: boolean; setHasKey: (v: boolean) => void; run: (url: string, body: unknown) => Promise<boolean>; images: Creative[] }) {
  const [key, setKey] = useState("");
  const [keyMsg, setKeyMsg] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const saveKey = async (value: string | null) => {
    setKeyMsg("");
    try {
      await post("/api/creative/key", { key: value });
      setHasKey(Boolean(value));
      setKey("");
      setKeyMsg(value ? "Saved. It's encrypted and won't be shown again." : "Removed.");
    } catch (e) {
      setKeyMsg((e as Error).message);
    }
  };

  const go = async () => {
    setBusy(true);
    if (await run("/api/creative", { op: "image", prompt })) setPrompt("");
    setBusy(false);
  };

  return (
    <Card icon="⚡" title="Generate with Higgsfield">
      {!hasKey ? (
        <div className="space-y-3">
          <p className="text-lg">
            Paste your Higgsfield API key here (from <span className="font-bold">cloud.higgsfield.ai → API keys</span>). It looks like <code>KEY_ID:KEY_SECRET</code>. Don&apos;t paste it in chat.
          </p>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (key.trim()) saveKey(key);
            }}
          >
            <input type="password" autoComplete="off" className="flex-1 min-w-48" placeholder="KEY_ID:KEY_SECRET" value={key} onChange={(e) => setKey(e.target.value)} />
            <Btn kind="primary">Save key</Btn>
          </form>
          {keyMsg && <p className="text-base font-bold text-muted">{keyMsg}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map(([label, p]) => (
              <Btn key={label} onClick={() => setPrompt(p)}>
                {label}
              </Btn>
            ))}
          </div>
          <textarea className="w-full min-h-28 text-lg" placeholder="Describe the ad image you want…" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <div className="flex flex-wrap items-center gap-3">
            <Btn kind="primary" disabled={busy || !prompt.trim()} onClick={go}>
              {busy ? "Sending…" : "Generate image"}
            </Btn>
            <span className="text-base text-muted">
              {images.length ? "Then press Animate on any image to turn it into a video." : "Images take about a minute."}
            </span>
          </div>
          <div className="flex items-center gap-3 text-base text-muted">
            <Badge tone="good">Key saved</Badge>
            <button className="underline" onClick={() => confirm("Remove the saved Higgsfield key?") && saveKey(null)}>
              Remove key
            </button>
            {keyMsg && <span className="font-bold">{keyMsg}</span>}
          </div>
        </div>
      )}
    </Card>
  );
}

function AddLink({ run }: { run: (url: string, body: unknown) => Promise<boolean> }) {
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<"auto" | "image" | "video">("auto");
  return (
    <Card icon="🎬" title="Add your own video or image">
      <p className="text-lg mb-3">
        Paste a public link to the file: Google Drive (shared as &quot;Anyone with the link&quot;), Dropbox, or a direct .mp4 / .jpg link. Meta downloads it straight from there.
      </p>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (url.trim() && (await run("/api/creative", { op: "link", url, kind: kind === "auto" ? undefined : kind }))) setUrl("");
        }}
      >
        <input className="flex-1 min-w-48" placeholder="https://drive.google.com/file/d/…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="Type">
          <option value="auto">Detect type</option>
          <option value="video">Video</option>
          <option value="image">Image</option>
        </select>
        <Btn kind="primary">Add</Btn>
      </form>
      <p className="text-base text-muted mt-3">Drive links don&apos;t say if they&apos;re a video, so pick &quot;Video&quot; for those.</p>
    </Card>
  );
}

function Tile({ c, onDelete, onChange, setError }: { c: Creative; onDelete: () => void; onChange: () => void; setError: (s: string) => void }) {
  const { data } = useTracker();
  const managed = data.trackedCampaigns.filter((t) => t.mode !== "view");
  const [tracked, setTracked] = useState(managed[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [animating, setAnimating] = useState(false);
  const [motion, setMotion] = useState("Slow cinematic camera push-in, subtle natural movement, ad-ready");
  const [duration, setDuration] = useState(5);

  const makeAd = async () => {
    setBusy(true);
    setMsg("");
    setError("");
    try {
      const r = await post<{ adId: string; template: string; processing?: boolean }>("/api/creative/ad", { creativeId: c.id, trackedId: tracked });
      setMsg(r.processing ? "Meta is still processing the video. Press again in a minute." : `Paused test ad made, copying "${r.template}". Turn it on in Ads Manager when you're happy.`);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const animate = async () => {
    setBusy(true);
    setError("");
    try {
      await post("/api/creative", { op: "video", prompt: motion, imageUrl: c.url, duration });
      setAnimating(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="bg-card-2 border-[3px] border-outline rounded-[12px] overflow-hidden shadow-[4px_4px_0_#0b0a14] flex flex-col">
      <div className="aspect-[4/5] bg-outline grid place-content-center">
        {c.status === "generating" && <div className="font-display text-2xl tracking-wide animate-pulse">Generating…</div>}
        {c.status === "failed" && <div className="p-4 text-lg text-bad font-bold text-center">{c.error ?? "Failed"}</div>}
        {c.status === "ready" && c.url && (c.kind === "video" ? <video src={c.url} controls playsInline className="w-full h-full object-cover" /> : <img src={c.url} alt={c.prompt ?? "Creative"} className="w-full h-full object-cover" />)}
      </div>
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <div className="flex gap-2 flex-wrap">
          <Badge tone={c.kind === "video" ? "hero" : "accent"}>{c.kind}</Badge>
          <Badge>{c.source === "higgsfield" ? "AI" : "Your file"}</Badge>
          {(c.ads?.length ?? 0) > 0 && <Badge tone="good">{c.ads!.length} test ad{c.ads!.length > 1 ? "s" : ""}</Badge>}
        </div>
        {c.prompt && <p className="text-base text-muted line-clamp-2">{c.prompt}</p>}
        {c.status === "ready" && (
          <div className="space-y-2 mt-auto">
            {c.kind === "image" && !animating && (
              <Btn className="w-full" onClick={() => setAnimating(true)}>
                ✨ Animate into video
              </Btn>
            )}
            {animating && (
              <div className="space-y-2">
                <textarea className="w-full min-h-20" value={motion} onChange={(e) => setMotion(e.target.value)} aria-label="Motion prompt" />
                <div className="flex gap-2 items-center">
                  <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} aria-label="Length">
                    {[5, 10, 15].map((d) => (
                      <option key={d} value={d}>
                        {d} seconds
                      </option>
                    ))}
                  </select>
                  <Btn kind="primary" disabled={busy} onClick={animate}>
                    Animate
                  </Btn>
                  <Btn onClick={() => setAnimating(false)}>Cancel</Btn>
                </div>
              </div>
            )}
            {managed.length ? (
              <div className="flex gap-2">
                <select className="flex-1 min-w-0" value={tracked} onChange={(e) => setTracked(e.target.value)} aria-label="Campaign">
                  {managed.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <Btn kind="primary" disabled={busy} onClick={makeAd}>
                  {busy ? "Working…" : "Make test ad"}
                </Btn>
              </div>
            ) : (
              <p className="text-base text-muted">To make test ads, set a campaign to Manage in Ad Command.</p>
            )}
            {msg && <p className="text-base font-bold text-good">{msg}</p>}
          </div>
        )}
        <button className="text-base text-muted underline self-start" onClick={() => confirm("Remove this creative from the vault?") && onDelete()}>
          Remove
        </button>
      </div>
    </div>
  );
}
