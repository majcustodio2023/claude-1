"use client";

import { useEffect, useState } from "react";
import { locale, moneyIn, uid } from "@/lib/finance";
import type { CampaignInfo, DatePreset, SuggestedAction } from "@/lib/meta";
import CampaignView, { type InsightResult } from "../ads/CampaignView";
import type { AdAccount, AutopilotEntry, TrackedCampaign } from "@/lib/types";
import { NO_GROUP, autoGroupOf, autoGroupOfAccount, groupCampaigns, groupChoices, type ResolvedGroup } from "@/lib/adgroups";
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


export default function Ads() {
  const { data, update } = useTracker();
  const [form, setForm] = useState({ label: "", owner: "", accountId: "" });
  const [preset, setPreset] = useState<DatePreset>("last_7d");
  const [results, setResults] = useState<Record<string, InsightResult>>({});

  const loaded = Object.values(results);
  const totalSpend = loaded.reduce((a, r) => a + r.metrics.spend, 0);
  const totalResults = loaded.reduce((a, r) => a + r.metrics.results, 0);
  const currencies = [...new Set(loaded.map((r) => r.currency))];
  const totalMoney = (n: number) => moneyIn(n, currencies.length === 1 ? currencies[0] : undefined);

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
                <Stat label="Spend (loaded campaigns)" value={totalMoney(totalSpend)} />
                <Stat label="Results" value={totalResults} />
                <Stat label="Blended cost per result" value={totalResults ? totalMoney(totalSpend / totalResults) : "–"} />
              </div>
            )}
            <div className="space-y-4">
              {groupCampaigns(data).map(({ group, campaigns }) => (
                <GroupSection key={group.key} group={group} campaigns={campaigns} preset={preset} results={results} setResult={(id, r) => setResults((x) => ({ ...x, [id]: r }))} />
              ))}
            </div>
            <CustomGroups />
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
                  {e.by === "you" ? "You" : "Autopilot"} · {e.campaign} · {new Date(e.at).toLocaleString(locale())}
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
        <label className="flex items-center gap-1 text-sm text-muted">
          Campaigns go to <GroupPicker value={account.group} auto={autoGroupOfAccount(data, account)} onChange={(group) => update((d) => void (d.adAccounts.find((x) => x.id === account.id)!.group = group))} />
        </label>
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

function TrackedCard({ tracked, preset, result, onResult, signal }: { tracked: TrackedCampaign; preset: DatePreset; result?: InsightResult; onResult: (r: InsightResult) => void; signal: number }) {
  const { data, update, reload } = useTracker();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const account = data.adAccounts.find((a) => a.id === tracked.adAccountRef);
  // Meta reports money in the ad account's currency.
  const cur = (n: number) => moneyIn(n, result?.currency);
  const set = (patch: Partial<TrackedCampaign>) => update((d) => void Object.assign(d.trackedCampaigns.find((x) => x.id === tracked.id)!, patch));

  const load = async () => {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/meta/insights?tracked=${tracked.id}&preset=${preset}`);
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(json.error);
    onResult(json);
  };
  // "Analyze all" on the group bumps the signal.
  useEffect(() => {
    if (signal) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal]);

  const apply = async (action: SuggestedAction): Promise<string | null> => {
    const res = await fetch("/api/meta/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tracked: tracked.id, action }) });
    const json = await res.json();
    if (res.ok) void reload();
    return res.ok ? null : json.error;
  };

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
          Group <GroupPicker value={tracked.group} auto={autoGroupOf(data, tracked)} onChange={(group) => set({ group })} />
        </label>
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
          Budget step % <NumInput className="w-16" value={tracked.scaleStep} placeholder="20" onChange={(v) => set({ scaleStep: v && v > 0 && v <= 100 ? v : undefined })} />
        </label>
        <label className="flex items-center gap-1">
          Pause ads after <NumInput className="w-16" value={tracked.killAt} placeholder="1.5" onChange={(v) => set({ killAt: v && v > 0 ? v : undefined })} />× target with no results
        </label>
        <label className="flex items-center gap-1">
          Result event <TextInput className="w-48" value={tracked.resultAction} placeholder="auto (leads)" onChange={(v) => set({ resultAction: v || undefined })} />
        </label>
      </div>
      {err && <p className="text-sm text-bad">{err}</p>}
      {result && <CampaignView key={result.fetchedAt} tracked={tracked} result={result} onApply={apply} />}
    </div>
  );
}

/** One client's (or group's) campaigns, with totals and "Analyze all". */
function GroupSection({ group, campaigns, preset, results, setResult }: { group: ResolvedGroup; campaigns: TrackedCampaign[]; preset: DatePreset; results: Record<string, InsightResult>; setResult: (id: string, r: InsightResult) => void }) {
  const [signal, setSignal] = useState(0);
  const loaded = campaigns.map((t) => results[t.id]).filter(Boolean);
  const spend = loaded.reduce((a, r) => a + r.metrics.spend, 0);
  const res = loaded.reduce((a, r) => a + r.metrics.results, 0);
  const currencies = [...new Set(loaded.map((r) => r.currency))];
  const cur = (n: number) => moneyIn(n, currencies.length === 1 ? currencies[0] : undefined);
  return (
    <details open className="border-[3px] border-outline rounded-[12px] bg-card-2/40">
      <summary className="cursor-pointer list-none p-3 flex items-center gap-2 flex-wrap">
        <Icon name={group.kind === "client" ? "briefcase" : group.kind === "group" ? "box" : "radar"} size={22} />
        <span className="font-display text-xl tracking-wide">{group.name}</span>
        <Badge tone={group.kind === "client" ? "accent" : group.kind === "group" ? "gold" : "muted"}>{group.kind === "client" ? "client" : group.kind === "group" ? "group" : "no group"}</Badge>
        <span className="text-sm text-muted">
          {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
          {loaded.length > 0 && ` · ${cur(spend)} spent · ${res} results${res ? ` · ${cur(spend / res)} each` : ""}`}
        </span>
        <div className="flex-1" />
        <Btn
          onClick={(e) => {
            e.preventDefault();
            setSignal((x) => x + 1);
          }}
        >
          Analyze all
        </Btn>
      </summary>
      <div className="px-3 pb-3 space-y-4">
        {campaigns.map((t) => (
          <TrackedCard key={t.id} tracked={t} preset={preset} result={results[t.id]} onResult={(r) => setResult(t.id, r)} signal={signal} />
        ))}
      </div>
    </details>
  );
}

/** Picks a client or custom group. Blank means automatic (the account's group, or matched by name). */
function GroupPicker({ value, auto, onChange }: { value?: string; auto: ResolvedGroup; onChange: (v: string | undefined) => void }) {
  const { data, update } = useTracker();
  const choices = groupChoices(data);
  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "__new") {
          const name = prompt("Name the new group (e.g. Personal, Agency brand)")?.trim();
          if (!name) return;
          const id = uid("grp");
          update((d) => void (d.adGroups = [...(d.adGroups ?? []), { id, name }]));
          onChange(`group:${id}`);
        } else onChange(v || undefined);
      }}
    >
      <option value="">Auto{auto.kind !== "none" ? ` (${auto.name})` : ""}</option>
      {choices.some((c) => c.kind === "client") && (
        <optgroup label="Clients">
          {choices.filter((c) => c.kind === "client").map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
        </optgroup>
      )}
      {choices.some((c) => c.kind === "group") && (
        <optgroup label="Your groups">
          {choices.filter((c) => c.kind === "group").map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
        </optgroup>
      )}
      <option value={NO_GROUP}>No group</option>
      <option value="__new">+ New group…</option>
    </select>
  );
}

/** Add, rename and remove custom groups. */
function CustomGroups() {
  const { data, update } = useTracker();
  const [name, setName] = useState("");
  const groups = data.adGroups ?? [];
  const remove = (id: string) =>
    update((d) => {
      d.adGroups = (d.adGroups ?? []).filter((g) => g.id !== id);
      for (const t of d.trackedCampaigns) if (t.group === `group:${id}`) delete t.group;
      for (const a of d.adAccounts) if (a.group === `group:${id}`) delete a.group;
    });
  return (
    <details className="mt-4">
      <summary className="cursor-pointer font-extrabold">Your groups ({groups.length})</summary>
      <p className="text-sm text-muted mt-1">Clients already have a group each. Make extra ones for ads that aren&apos;t for a client, like &ldquo;Personal&rdquo; or &ldquo;Agency brand&rdquo;.</p>
      <div className="space-y-2 mt-2">
        {groups.map((g) => (
          <div key={g.id} className="flex items-center gap-2">
            <TextInput className="flex-1 max-w-xs" value={g.name} onChange={(v) => update((d) => void (d.adGroups!.find((x) => x.id === g.id)!.name = v || g.name))} />
            <Btn kind="danger" onClick={() => confirm(`Remove the group "${g.name}"? Its campaigns go back to automatic grouping.`) && remove(g.id)}>Remove</Btn>
          </div>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            update((d) => void (d.adGroups = [...(d.adGroups ?? []), { id: uid("grp"), name: name.trim() }]));
            setName("");
          }}
        >
          <input className="flex-1 max-w-xs" placeholder="New group name" value={name} onChange={(e) => setName(e.target.value)} />
          <Btn kind="primary">Add group</Btn>
        </form>
      </div>
    </details>
  );
}
