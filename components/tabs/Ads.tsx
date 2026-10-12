"use client";

import { useState } from "react";
import { uid } from "@/lib/finance";
import type { AdRow, CampaignInfo, DatePreset, Metrics, Suggestion, SuggestedAction } from "@/lib/meta";
import type { AdAccount, TrackedCampaign } from "@/lib/types";
import { useTracker } from "../App";
import { Badge, Btn, Card, NumInput, Stat, TextInput, peso } from "../ui";

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
      <Card icon="◉" title="Ad accounts">
        <p className="text-sm text-muted mb-3">
          Add each Meta ad account (yours and your team members&apos;). Each needs an access token with <code>ads_read</code> (and <code>ads_management</code> if you want the app to make changes).
          Tokens are encrypted on the server and never shown again.
        </p>
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
            update((d) => void d.adAccounts.push({ id: uid("acct"), label: form.label, owner: form.owner || "Me", accountId: form.accountId.trim() }));
            setForm({ label: "", owner: "", accountId: "" });
          }}
        >
          <input className="flex-1 min-w-36" placeholder="Name (e.g. AACIO main)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <input className="w-32" placeholder="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <input className="w-44" placeholder="Ad account ID (act_…)" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} />
          <Btn kind="primary">Add account</Btn>
        </form>
      </Card>

      <Card
        icon="📡"
        glow="hero"
        title="Tracked campaigns"
        actions={
          <select value={preset} onChange={(e) => setPreset(e.target.value as DatePreset)}>
            {PRESETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        }
      >
        {data.trackedCampaigns.length === 0 ? (
          <p className="text-sm text-muted">No campaigns selected yet. Use &ldquo;Choose campaigns&rdquo; on an ad account above.</p>
        ) : (
          <>
            {loaded.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat label="Spend (loaded campaigns)" value={peso(totalSpend)} />
                <Stat label="Results" value={totalResults} />
                <Stat label="Blended cost per result" value={totalResults ? peso(totalSpend / totalResults) : "–"} />
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
    </div>
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
    const what = action.type === "pause" ? `Pause "${action.targetName}"` : `Set daily budget of "${action.targetName}" to ${peso(action.newDailyBudget!)}`;
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
          {(["view", "manage"] as const).map((mode) => (
            <button key={mode} onClick={() => set({ mode })} className={`px-2 py-1 ${tracked.mode === mode ? "bg-accent text-[#031018]" : ""}`}>
              {mode === "view" ? "View only" : "Manage"}
            </button>
          ))}
        </div>
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
        <label className="flex items-center gap-1">
          Result event <TextInput className="w-48" value={tracked.resultAction} placeholder="auto (leads)" onChange={(v) => set({ resultAction: v || undefined })} />
        </label>
      </div>
      {err && <p className="text-sm text-bad">{err}</p>}
      {m && result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <Stat label="Spend" value={peso(m.spend)} />
            <Stat label="Results" value={m.results} hint={m.resultType} />
            <Stat label="Cost / result" value={m.cpl != null ? peso(m.cpl) : "–"} />
            <Stat label="ROAS" value={m.roas != null ? `${m.roas.toFixed(2)}x` : "–"} />
            <Stat label="Link CTR" value={`${m.ctr.toFixed(2)}%`} hint={`${m.linkClicks} clicks · CPC ${peso(m.cpc)}`} />
            <Stat label="CPM" value={peso(m.cpm)} hint={`Freq ${m.frequency.toFixed(1)}`} />
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
                    (tracked.mode === "manage" ? (
                      applied[key] ? (
                        <span className="text-sm text-muted">{applied[key]}</span>
                      ) : (
                        <Btn onClick={() => apply(key, s.action!)}>
                          {s.action.type === "pause" ? "Pause ad" : `Budget → ${peso(s.action.newDailyBudget!)}/day`}
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
                        <td className="pr-2 tabular-nums">{peso(a.m.spend)}</td>
                        <td className="pr-2 tabular-nums">{a.m.results}</td>
                        <td className="pr-2 tabular-nums">{a.m.cpl != null ? peso(a.m.cpl) : "–"}</td>
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
          <p className="text-sm text-muted">Updated {new Date(result.fetchedAt).toLocaleString("en-PH")}</p>
        </>
      )}
    </div>
  );
}
