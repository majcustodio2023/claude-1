"use client";

import { useState } from "react";
import { locale, uid } from "@/lib/finance";
import type { AdRow, CampaignInfo, DatePreset, Metrics, Suggestion, SuggestedAction } from "@/lib/meta";
import type { AdAccount, AutopilotEntry, TrackedCampaign } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Btn, Card, NumInput, Stat, TextInput, money } from "../ui";
import { HELP } from "../help";
import { Icon } from "../icons";

const PRESETS: [DatePreset, string][] = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["last_3d", "Last 3 days"],
  ["last_7d", "Last 7 days"],
  ["last_14d", "Last 14 days"],
  ["last_30d", "Last 30 days"],
  ["this_month", "This month"],
  ["last_month", "Last month"],
];

interface InsightResult {
  campaign: CampaignInfo;
  metrics: Metrics;
  ads: AdRow[];
  suggestions: Suggestion[];
  fetchedAt: string;
}

export default function Ads() {
  const { data, update } = useTracker();
  const [form, setForm] = useState({ label: "", owner: "", accountId: "" });
  const [preset, setPreset] = useState<DatePreset>("last_7d");
  const [results, setResults] = useState<Record<string, InsightResult>>({});

  const loaded = Object.values(results);
  const totalSpend = loaded.reduce((a, r) => a + r.metrics.spend, 0);
  const totalResults = loaded.reduce((a, r) => a + r.metrics.results, 0);

  return (
    <div className="space-y-4">
      <Card icon="◉" title="Ad accounts" help={HELP.adAccounts}>
        <p className="text-sm text-muted mb-3">
          Add each Meta ad account (yours and your team members&apos;). Each needs an access token with <code>ads_read</code> (and <code>ads_management</code> if you want the app to make changes).
          Tokens are encrypted on the server and never shown again.
        </p>
        <ConnectGuide />
        <div className="space-y-3 mb-4">
          {data.adAccounts.map((a) => (
            <AccountRow key={a.id} account={a} />
          ))}
        </div>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.label || !form.accountId) return;
            update((d) => void d.adAccounts.push({ id: uid("acct"), label: form.label, owner: form.owner || "Me", accountId: form.accountId.replace(/\D/g, "") }));
            setForm({ label: "", owner: "", accountId: "" });
          }}
        >
          <input className="flex-1 min-w-36" placeholder="Name (e.g. Main account)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <input className="w-32" placeholder="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <input className="w-44" placeholder="Ad account ID (act_…)" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} />
          <Btn kind="primary">Add account</Btn>
        </form>
      </Card>

      <Card
        icon="📡"
        glow="hero"
        title="Tracked campaigns"
        help={HELP.campaigns}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {data.trackedCampaigns.length > 0 && <SyncSpend />}
            <select value={preset} onChange={(e) => setPreset(e.target.value as DatePreset)}>
              {PRESETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        }
      >
        {data.trackedCampaigns.length === 0 ? (
          <p className="text-sm text-muted">No campaigns selected yet. Use &ldquo;Choose campaigns&rdquo; on an ad account above.</p>
        ) : (
          <>
            {loaded.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat label="Spend (loaded campaigns)" value={money(totalSpend)} />
                <Stat label="Results" value={totalResults} />
                <Stat label="Blended cost per result" value={totalResults ? money(totalSpend / totalResults) : "–"} />
              </div>
            )}
            <div className="space-y-4">
              {data.trackedCampaigns.map((t) => (
                <TrackedCard key={t.id} tracked={t} preset={preset} result={results[t.id]} onResult={(r) => setResults((x) => ({ ...x, [t.id]: r }))} />
              ))}
            </div>
          </>
        )}
      </Card>

      {(data.trackedCampaigns.some((t) => t.mode === "autopilot") || (data.autopilotLog?.length ?? 0) > 0) && <AutopilotCard />}
    </div>
  );
}

function ConnectGuide() {
  return (
    <details className="mb-4 bg-card-2 border-[3px] border-outline rounded-[10px] p-4 text-lg">
      <summary className="cursor-pointer font-display text-xl tracking-wide">How to connect an ad account (step by step)</summary>
      <div className="mt-3 space-y-4">
        <div>
          <p className="font-extrabold">1. Find the ad account ID</p>
          <p>Open Ads Manager and pick the account. The ID is the number after <code>act=</code> in the address bar. You can paste it with or without <code>act_</code>.</p>
        </div>
        <div>
          <p className="font-extrabold">2. Get a token (pick one)</p>
          <p className="mt-1"><span className="font-bold text-gold">Quick, lasts about 60 days:</span> works for every ad account your Facebook profile can open, in any business portfolio, so you can paste the same token on each account.</p>
          <ol className="list-decimal ml-6 space-y-1">
            <li>Go to developers.facebook.com, open My Apps and create an app (type: Business) if you don&apos;t have one.</li>
            <li>Open Tools → Graph API Explorer, choose your app, then &quot;Get User Access Token&quot;.</li>
            <li>Tick <code>ads_read</code> and <code>ads_management</code>, then Generate Access Token and approve.</li>
            <li>Click the ⓘ next to the token → Open in Access Token Tool → Extend Access Token. Copy the long one.</li>
          </ol>
          <p className="mt-2"><span className="font-bold text-good">Best, never expires:</span> do this once in each business portfolio.</p>
          <ol className="list-decimal ml-6 space-y-1">
            <li>Business Settings → Users → System users → Add (role: Admin).</li>
            <li>Assign assets → Ad accounts → pick the accounts → turn on &quot;Manage campaigns&quot;.</li>
            <li>Generate new token → pick your app → tick <code>ads_read</code> and <code>ads_management</code>, set expiry to Never → copy it.</li>
          </ol>
          <p className="mt-2">Want one token for all portfolios? Have the other portfolios share their ad accounts with yours as a partner, then assign them to your system user. Teammate&apos;s account in their own portfolio? Have them add you as a person on the ad account (then your token covers it), or have them make a system user token and paste it here themselves.</p>
        </div>
        <div>
          <p className="font-extrabold">3. Add it here</p>
          <p>Fill in the form below and click Add account, paste the token on the account&apos;s row, then click Choose campaigns and tick the ones to track. New campaigns start as View only.</p>
        </div>
      </div>
    </details>
  );
}

// Records each tracked campaign's Meta spend for the selected month as an "ads"
// expense. Re-syncing updates the same entries instead of adding new ones.
function SyncSpend() {
  const { update, month } = useTracker();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const sync = async () => {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/meta/spend?month=${month}`);
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(json.error);
    const rows = json.spend as { trackedId: string; name: string; amount?: number; error?: string }[];
    const ok = rows.filter((r) => r.amount != null);
    update((d) => {
      for (const r of ok) {
        const id = `meta-${month}-${r.trackedId}`;
        const entry = { id, date: json.until as string, label: `Meta ads: ${r.name}`, amount: Math.round(r.amount!), category: "ads" as const };
        const i = d.adHocExpenses.findIndex((e) => e.id === id);
        if (i >= 0) d.adHocExpenses[i] = { ...d.adHocExpenses[i], ...entry };
        else if (entry.amount > 0) d.adHocExpenses.push(entry);
      }
    });
    const total = ok.reduce((a, r) => a + r.amount!, 0);
    const failed = rows.filter((r) => r.error);
    setMsg(`${money(total)} recorded as ${month} ad spend${failed.length ? ` · ${failed.length} failed: ${failed[0].error}` : ""}`);
  };

  return (
    <span className="flex items-center gap-2">
      {msg && <span className="text-sm text-muted">{msg}</span>}
      <Btn onClick={sync} disabled={busy}>{busy ? "Syncing…" : "Sync spend to expenses"}</Btn>
    </span>
  );
}

const STATUS_TONE = { done: "good", skipped: "muted", error: "bad" } as const;

function AutopilotCard() {
  const { data, reload } = useTracker();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const log: AutopilotEntry[] = data.autopilotLog ?? [];
  const on = data.trackedCampaigns.filter((t) => t.mode === "autopilot");

  const runNow = async () => {
    if (!confirm(`Run Autopilot now on ${on.length} campaign${on.length === 1 ? "" : "s"}? It may pause ads or change budgets in Meta.`)) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/autopilot", { method: "POST" });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(json.error);
    setMsg(`Done. ${json.entries.filter((e: AutopilotEntry) => e.status === "done").length} change(s) made.`);
    await reload();
  };

  return (
    <Card
      icon="🤖"
      title="Autopilot"
      help={HELP.autopilot}
      actions={on.length > 0 && <Btn kind="primary" onClick={runNow} disabled={busy}>{busy ? "Running…" : "Run now"}</Btn>}
    >
      <p className="text-sm text-muted mb-3">
        Runs every morning at 9:00 on campaigns set to Autopilot, using the last 7 days. It pauses ads that spend without results (up to 3 a run, never the best one),
        cuts budget when cost per result is far over target, and raises it 20% when results beat target, never above the max daily budget you set.
        Budgets change at most once every 3 days.
      </p>
      {msg && <p className="text-sm mb-2">{msg}</p>}
      {log.length === 0 ? (
        <p className="text-sm text-muted">Nothing has run yet.</p>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {log.slice(0, 30).map((e) => (
            <li key={e.id} className="flex gap-3 items-start text-sm">
              <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
              <div className="flex-1">
                <div className="font-medium">{e.action}</div>
                <div className="text-muted">
                  {e.campaign} · {new Date(e.at).toLocaleString(locale())}
                  {e.note ? ` · ${e.note}` : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AccountRow({ account }: { account: AdAccount }) {
  const { data, update, reload } = useTracker();
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignInfo[] | null>(null);
  const [busy, setBusy] = useState(false);

  const saveToken = async (value: string | null) => {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/meta/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adAccountRef: account.id, token: value }) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(json.error);
    setToken("");
    setMsg(value ? "Token saved." : "Token removed.");
    await reload();
  };

  const loadCampaigns = async () => {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/meta/campaigns?account=${account.id}`);
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(json.error);
    setCampaigns(json.campaigns);
  };

  const tracked = new Set(data.trackedCampaigns.filter((t) => t.adAccountRef === account.id).map((t) => t.campaignId));
  const toggle = (c: CampaignInfo) =>
    update((d) => {
      if (tracked.has(c.id)) d.trackedCampaigns = d.trackedCampaigns.filter((t) => !(t.adAccountRef === account.id && t.campaignId === c.id));
      else d.trackedCampaigns.push({ id: uid("trk"), adAccountRef: account.id, campaignId: c.id, name: c.name, mode: "view" });
    });

  return (
    <div className="border border-line bg-card-2/50 rounded-[3px] p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium">{account.label}</span>
        <span className="text-sm text-muted">{account.owner} · {account.accountId}</span>
        {account.hasToken ? <Badge tone="good">Token saved</Badge> : <Badge tone="warn">No token</Badge>}
        <div className="flex-1" />
        {account.hasToken && <Btn onClick={loadCampaigns} disabled={busy}>Choose campaigns</Btn>}
        <Btn
          kind="danger"
          onClick={() =>
            confirm(`Remove ${account.label}? Its tracked campaigns are removed too.`) &&
            update((d) => {
              d.adAccounts = d.adAccounts.filter((x) => x.id !== account.id);
              d.trackedCampaigns = d.trackedCampaigns.filter((t) => t.adAccountRef !== account.id);
            })
          }
        >
          Remove
        </Btn>
      </div>
      <form
        className="flex gap-2 flex-wrap"
        onSubmit={(e) => {
          e.preventDefault();
          if (token.trim()) saveToken(token);
        }}
      >
        <input type="password" autoComplete="off" className="flex-1 min-w-48" placeholder={account.hasToken ? "Replace access token" : "Paste access token"} value={token} onChange={(e) => setToken(e.target.value)} />
        <Btn kind="primary" disabled={busy || !token.trim()}>Save token</Btn>
        {account.hasToken && <Btn type="button" onClick={() => saveToken(null)} disabled={busy}>Remove token</Btn>}
      </form>
      {msg && <p className="text-sm text-muted">{msg}</p>}
      {campaigns && (
        <div className="border-t border-line pt-2">
          <p className="text-sm text-muted mb-2">Tick the campaigns to track. Only these are read.</p>
          <ul className="space-y-1 max-h-72 overflow-y-auto">
            {campaigns.map((c) => (
              <li key={c.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={tracked.has(c.id)} onChange={() => toggle(c)} />
                  <span className="flex-1">{c.name}</span>
                  <Badge tone={c.effective_status === "ACTIVE" ? "good" : "muted"}>{c.effective_status.toLowerCase()}</Badge>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const TONE = { good: "good", info: "accent", warn: "warn", bad: "bad" } as const;

/** Copies a read-only link to this campaign's live results, for an ads expert or client. */
function ShareLink({ tracked }: { tracked: TrackedCampaign }) {
  const { update } = useTracker();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const url = (t: string) => `${location.origin}/share/${t}`;
  const call = async (on: boolean) => {
    setBusy(true);
    const res = await fetch("/api/meta/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tracked: tracked.id, on }) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(json.error), null;
    // Keep this tab in step with the server, which owns the link.
    update((d) => {
      const t = d.trackedCampaigns.find((x) => x.id === tracked.id);
      if (t) t.shareToken = json.token ?? undefined;
    });
    return json.token as string | null;
  };
  const copy = async () => {
    const token = tracked.shareToken ?? (await call(true));
    if (!token) return;
    try {
      await navigator.clipboard.writeText(url(token));
      setMsg("Link copied");
    } catch {
      prompt("Copy this link:", url(token));
    }
    setTimeout(() => setMsg(""), 2500);
  };
  return (
    <span className="flex items-center gap-2">
      <Btn onClick={copy} disabled={busy} title="A read-only page with this campaign's live results, suggestions and changes. Anyone with the link can see it.">
        <Icon name="link" size={20} /> {tracked.shareToken ? "Copy share link" : "Share results"}
      </Btn>
      {tracked.shareToken && (
        <button
          className="text-sm underline text-muted"
          disabled={busy}
          onClick={() => confirm("Turn off this link? Anyone you sent it to won't be able to open it any more.") && call(false).then(() => setMsg("Link turned off"))}
        >
          Turn off link
        </button>
      )}
      {msg && <span className="text-sm text-good">{msg}</span>}
    </span>
  );
}

function TrackedCard({ tracked, preset, result, onResult }: { tracked: TrackedCampaign; preset: DatePreset; result?: InsightResult; onResult: (r: InsightResult) => void }) {
  const { data, update } = useTracker();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [applied, setApplied] = useState<Record<string, string>>({});
  const account = data.adAccounts.find((a) => a.id === tracked.adAccountRef);
  const set = (patch: Partial<TrackedCampaign>) => update((d) => void Object.assign(d.trackedCampaigns.find((x) => x.id === tracked.id)!, patch));

  const load = async () => {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/meta/insights?tracked=${tracked.id}&preset=${preset}`);
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(json.error);
    setApplied({});
    onResult(json);
  };

  const apply = async (key: string, action: SuggestedAction) => {
    const what = action.type === "pause" ? `Pause "${action.targetName}"` : `Set daily budget of "${action.targetName}" to ${money(action.newDailyBudget!)}`;
    if (!confirm(`${what} in Meta now?`)) return;
    setApplied((x) => ({ ...x, [key]: "Applying…" }));
    const res = await fetch("/api/meta/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tracked: tracked.id, action }) });
    const json = await res.json();
    setApplied((x) => ({ ...x, [key]: res.ok ? "Done" : json.error }));
  };

  const m = result?.metrics;

  return (
    <div className="border border-line bg-card-2/50 rounded-[3px] p-3 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium">{tracked.name}</span>
        <span className="text-sm text-muted">{account?.label}</span>
        <div className="flex-1" />
        <div className="flex rounded-[3px] border border-line overflow-hidden text-sm">
          {(["view", "manage", "autopilot"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                if (mode === "autopilot" && tracked.mode !== "autopilot" && !confirm("Autopilot will pause losing ads and change this campaign's budget once a day without asking you first. Turn it on?")) return;
                set({ mode });
              }}
              className={`px-2 py-1 ${tracked.mode === mode ? "bg-accent text-[#031018]" : ""}`}
            >
              {mode === "view" ? "View only" : mode === "manage" ? "Manage" : "Autopilot"}
            </button>
          ))}
        </div>
        <ShareLink tracked={tracked} />
        <Btn kind="primary" onClick={load} disabled={busy}>{busy ? "Loading…" : result ? "Refresh" : "Analyze"}</Btn>
        <button className="text-muted text-sm" onClick={() => update((d) => void (d.trackedCampaigns = d.trackedCampaigns.filter((x) => x.id !== tracked.id)))}>✕</button>
      </div>
      <div className="flex gap-3 flex-wrap text-sm text-muted items-center">
        <label className="flex items-center gap-1">
          Target cost per result <NumInput className="w-24" value={tracked.targetCpl} placeholder={String(data.settings.targetCpl)} onChange={(v) => set({ targetCpl: v })} />
        </label>
        <label className="flex items-center gap-1">
          Target ROAS <NumInput className="w-16" value={tracked.targetRoas} placeholder={String(data.settings.targetRoas)} onChange={(v) => set({ targetRoas: v })} />
        </label>
        {tracked.mode === "autopilot" && (
          <label className="flex items-center gap-1">
            Max daily budget <NumInput className="w-24" value={tracked.maxDailyBudget} placeholder="none" onChange={(v) => set({ maxDailyBudget: v })} />
          </label>
        )}
        <label className="flex items-center gap-1">
          Result event <TextInput className="w-48" value={tracked.resultAction} placeholder="auto (leads)" onChange={(v) => set({ resultAction: v || undefined })} />
        </label>
      </div>
      {err && <p className="text-sm text-bad">{err}</p>}
      {m && result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <Stat label="Spend" value={money(m.spend)} />
            <Stat label="Results" value={m.results} hint={m.resultType} />
            <Stat label="Cost / result" value={m.cpl != null ? money(m.cpl) : "–"} />
            <Stat label="ROAS" value={m.roas != null ? `${m.roas.toFixed(2)}x` : "–"} />
            <Stat label="Link CTR" value={`${m.ctr.toFixed(2)}%`} hint={`${m.linkClicks} clicks · CPC ${money(m.cpc)}`} />
            <Stat label="CPM" value={money(m.cpm)} hint={`Freq ${m.frequency.toFixed(1)}`} />
            <Stat label="3s video views" value={m.videoViews3s.toLocaleString()} hint={m.hookRate != null ? `Hook ${m.hookRate.toFixed(0)}%` : undefined} />
            <Stat label="ThruPlays" value={m.thruplays.toLocaleString()} hint={m.holdRate != null ? `Hold ${m.holdRate.toFixed(0)}%` : undefined} />
          </div>
          <div className="space-y-2">
            {result.suggestions.map((s, i) => {
              const key = `${i}-${s.title}`;
              return (
                <div key={key} className="flex gap-3 items-start text-sm">
                  <Badge tone={TONE[s.severity]}>{s.severity === "bad" ? "fix" : s.severity === "warn" ? "watch" : s.severity === "good" ? "win" : "note"}</Badge>
                  <div className="flex-1">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-muted">{s.detail}</div>
                  </div>
                  {s.action &&
                    (tracked.mode !== "view" ? (
                      applied[key] ? (
                        <span className="text-sm text-muted">{applied[key]}</span>
                      ) : (
                        <Btn onClick={() => apply(key, s.action!)}>
                          {s.action.type === "pause" ? "Pause ad" : `Budget → ${money(s.action.newDailyBudget!)}/day`}
                        </Btn>
                      )
                    ) : (
                      <span className="text-sm text-muted">Switch to Manage to apply</span>
                    ))}
                </div>
              );
            })}
          </div>
          {result.ads.length > 0 && (
            <details>
              <summary className="text-sm cursor-pointer">Ads in this campaign ({result.ads.length})</summary>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm">
                  <thead className="text-muted text-left">
                    <tr>
                      <th className="py-1 pr-2">Ad</th>
                      <th className="pr-2">Spend</th>
                      <th className="pr-2">Results</th>
                      <th className="pr-2">Cost/result</th>
                      <th className="pr-2">CTR</th>
                      <th className="pr-2">Hook</th>
                      <th>Hold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[...result.ads].sort((a, b) => b.m.spend - a.m.spend).map((a) => (
                      <tr key={a.id}>
                        <td className="py-1 pr-2 max-w-64 truncate">{a.name}</td>
                        <td className="pr-2 tabular-nums">{money(a.m.spend)}</td>
                        <td className="pr-2 tabular-nums">{a.m.results}</td>
                        <td className="pr-2 tabular-nums">{a.m.cpl != null ? money(a.m.cpl) : "–"}</td>
                        <td className="pr-2 tabular-nums">{a.m.ctr.toFixed(2)}%</td>
                        <td className="pr-2 tabular-nums">{a.m.hookRate != null ? `${a.m.hookRate.toFixed(0)}%` : "–"}</td>
                        <td className="tabular-nums">{a.m.holdRate != null ? `${a.m.holdRate.toFixed(0)}%` : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
          <p className="text-sm text-muted">Updated {new Date(result.fetchedAt).toLocaleString(locale())}</p>
        </>
      )}
    </div>
  );
}
