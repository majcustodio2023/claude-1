"use client";

// Settings > Data sources: connections that don't expire, and the stored reports the AI staff read.
// Meta: one Business Manager System User token (never expires) covers every ad account and page.
// App Store: an API key (.p8) never expires. Funnels: your funnel tools send events to a private
// address, so there's nothing to expire. Everything is pulled into stored reports every morning.

import { useState } from "react";
import { useTracker } from "./App";
import { Badge, Btn, Card, toast } from "./ui";
import { Icon } from "./icons";
import { daysLeft } from "@/lib/feeds";
import type { TokenInfo } from "@/lib/types";

const post = async (body: Record<string, unknown>) => {
  const r = await fetch("/api/feeds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error);
  return j;
};

/** "Never expires", "Ends in 12 days"… for a token Meta told us about. */
export function TokenBadge({ info }: { info?: TokenInfo }) {
  if (!info) return null;
  if (!info.valid) return <Badge tone="bad">Not working: {info.error ?? "check the token"}</Badge>;
  if (info.expires === "never") return <Badge tone="good">Never expires</Badge>;
  if (!info.expires) return <Badge tone="muted">Works · end date unknown</Badge>;
  const d = daysLeft(info.expires) ?? 0;
  return <Badge tone={d < 0 ? "bad" : d <= 14 ? "warn" : "muted"}>{d < 0 ? "Expired" : `Ends in ${d} day${d === 1 ? "" : "s"}`} · use a System User token</Badge>;
}

export default function DataSources() {
  const { data, reload } = useTracker();
  const [busy, setBusy] = useState("");
  const [meta, setMeta] = useState("");
  const [apple, setApple] = useState({ issuerId: "", keyId: "", privateKey: "", vendor: "" });
  const [inbox, setInbox] = useState("");
  const [appleOpen, setAppleOpen] = useState(false);
  const biz = data.integrations?.metaBusiness;
  const run = async (what: string, fn: () => Promise<unknown>) => {
    setBusy(what);
    try {
      await fn();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy("");
    }
  };
  const reports = data.reports ?? [];
  const recent = data.funnelStats?.recent ?? [];

  return (
    <Card icon={<Icon name="chart" size={24} />} title="Data sources">
      <p className="text-base mb-3">
        Your AI staff read these in meetings and jobs. They run on the tracker&apos;s server, not in your browser, so they can&apos;t read pages open in your Chrome; these connections keep the
        numbers coming without it, and nothing here needs re-pasting.
      </p>

      {/* Meta */}
      <section className="border-2 border-line rounded-md p-3 mb-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-display text-xl tracking-wide flex-1">Meta (ads and pages)</h4>
          {biz ? <TokenBadge info={biz} /> : <Badge tone="warn">No business token</Badge>}
        </div>
        <p className="text-base">
          Normal Meta tokens stop after an hour or 60 days. A <b>System User token</b> from Business Manager never expires and covers every ad account and page you give it, so paste one here
          instead of a token per account.
        </p>
        <ol className="text-base list-decimal pl-5 space-y-0.5">
          <li>business.facebook.com → Settings → Users → <b>System users</b> → Add (role Admin).</li>
          <li><b>Assign assets</b>: tick your ad accounts and Pages (full control).</li>
          <li><b>Generate new token</b>, pick your app, set expiry to <b>Never</b>, tick ads_read, ads_management, pages_read_engagement, read_insights and business_management.</li>
          <li>Paste it below. The app checks it with Meta and shows when (if ever) it ends.</li>
        </ol>
        <form
          className="flex gap-2 flex-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            run("meta", async () => {
              const j = await post({ action: "metaBusiness", token: meta });
              setMeta("");
              toast(j.info?.expires === "never" ? "Saved. Meta says it never expires." : "Saved.");
              await reload();
            });
          }}
        >
          <input type="password" autoComplete="off" className="flex-1 min-w-48" placeholder={biz ? "Replace the business token" : "Paste the System User token"} value={meta} onChange={(e) => setMeta(e.target.value)} />
          <Btn kind="primary" disabled={busy === "meta" || !meta.trim()}>Save token</Btn>
          {biz && <Btn type="button" onClick={() => run("meta", async () => (await post({ action: "metaBusiness", token: null }), await reload()))}>Remove</Btn>}
        </form>
        {data.adAccounts.length > 0 && (
          <ul className="text-base space-y-1">
            {data.adAccounts.map((a) => (
              <li key={a.id} className="flex items-center gap-2 flex-wrap">
                <span className="font-bold">{a.label}</span>
                {a.tokenInfo ? <TokenBadge info={a.tokenInfo} /> : a.hasToken ? <Badge tone="muted">Token saved · not checked yet</Badge> : <Badge tone="warn">No token</Badge>}
                {a.tokenInfo?.source === "business" && <span className="text-muted text-sm">via the business token</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* App Store */}
      <section className="border-2 border-line rounded-md p-3 mb-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-display text-xl tracking-wide flex-1">App Store (Apple)</h4>
          {data.integrations?.apple ? <Badge tone="good">Connected · never expires</Badge> : <Badge tone="warn">Not connected</Badge>}
          <Btn className="text-sm py-1" onClick={() => setAppleOpen((v) => !v)}>{data.integrations?.apple ? "Replace key" : "Connect"}</Btn>
        </div>
        <p className="text-base">Daily downloads and proceeds per app, from an App Store Connect API key. The key doesn&apos;t expire; the app signs a fresh pass with it on every pull.</p>
        {appleOpen && (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              run("apple", async () => {
                const j = await post({ action: "apple", ...apple });
                setApple({ issuerId: "", keyId: "", privateKey: "", vendor: "" });
                setAppleOpen(false);
                toast(`Connected. Apps: ${(j.apps as string[]).join(", ") || "none found"}`);
                await reload();
              });
            }}
          >
            <ol className="text-base list-decimal pl-5 space-y-0.5">
              <li>appstoreconnect.apple.com → Users and Access → <b>Integrations</b> → App Store Connect API → Team Keys → add a key with the <b>Sales</b> (or Finance) role.</li>
              <li>Copy the <b>Issuer ID</b> and <b>Key ID</b>, download the .p8 file and paste its text below.</li>
              <li>Your <b>vendor number</b> is in Payments and Financial Reports (top left).</li>
            </ol>
            <div className="grid sm:grid-cols-3 gap-2">
              <input placeholder="Issuer ID" value={apple.issuerId} onChange={(e) => setApple({ ...apple, issuerId: e.target.value })} />
              <input placeholder="Key ID" value={apple.keyId} onChange={(e) => setApple({ ...apple, keyId: e.target.value })} />
              <input placeholder="Vendor number" value={apple.vendor} onChange={(e) => setApple({ ...apple, vendor: e.target.value })} />
            </div>
            <textarea className="w-full font-mono text-sm" rows={4} autoComplete="off" placeholder="-----BEGIN PRIVATE KEY----- …" value={apple.privateKey} onChange={(e) => setApple({ ...apple, privateKey: e.target.value })} />
            <div className="flex gap-2">
              <Btn kind="primary" disabled={busy === "apple"}>{busy === "apple" ? "Checking…" : "Test and save"}</Btn>
              {data.integrations?.apple && <Btn type="button" onClick={() => run("apple", async () => (await post({ action: "apple", clear: true }), await reload()))}>Disconnect</Btn>}
            </div>
          </form>
        )}
      </section>

      {/* Funnel inbox */}
      <section className="border-2 border-line rounded-md p-3 mb-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-display text-xl tracking-wide flex-1">Funnels (inbox)</h4>
          {data.integrations?.inbox ? <Badge tone="good">Address made · never expires</Badge> : <Badge tone="muted">No address yet</Badge>}
        </div>
        <p className="text-base">
          Give your funnel tool (GoHighLevel, ClickFunnels, Systeme, or Zapier/Make for anything else) this private address as a webhook. Each opt-in, booking or sale it sends is counted per
          funnel, with no login and nothing to expire. Send <code>funnel</code>, <code>event</code> (optin, booked, purchase…) and optionally <code>value</code>.
        </p>
        <div className="flex gap-2 flex-wrap items-center">
          {inbox ? (
            <>
              <code className="flex-1 min-w-48 text-sm bg-card-2 border-2 border-line rounded px-2 py-1 [overflow-wrap:anywhere]">{inbox}</code>
              <Btn onClick={() => navigator.clipboard.writeText(inbox).then(() => toast("Copied"))}>Copy</Btn>
              <Btn onClick={() => confirm("Make a new address? The old one stops working, so update your funnel tools.") && run("inbox", async () => (setInbox((await post({ action: "inbox", reset: true })).url), await reload()))}>New address</Btn>
            </>
          ) : (
            <Btn kind="primary" disabled={busy === "inbox"} onClick={() => run("inbox", async () => (setInbox((await post({ action: "inbox" })).url), await reload()))}>Show my funnel address</Btn>
          )}
        </div>
        {recent.length > 0 && (
          <ul className="text-base">
            {recent.slice(0, 5).map((r, i) => (
              <li key={i}>
                <b>{r.funnel}</b> · {r.event}
                {r.value ? ` · ${r.value}` : ""} <span className="text-muted text-sm">{new Date(r.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Stored */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-display text-xl tracking-wide flex-1">Stored reports ({reports.length})</h4>
          <Btn
            disabled={busy === "sync"}
            onClick={() =>
              run("sync", async () => {
                const j = await post({ action: "sync" });
                toast(j.failed?.length ? `Pulled ${j.saved}. Problems: ${j.failed.join(" · ")}` : `Pulled ${j.saved} report${j.saved === 1 ? "" : "s"}.`);
                await reload();
              })
            }
          >
            {busy === "sync" ? "Pulling…" : "Pull now"}
          </Btn>
        </div>
        <p className="text-sm text-muted">Pulled every morning with Autopilot. Staff read the stored copy, so a source that's down for a day doesn't leave them blind.</p>
        {reports.length === 0 ? (
          <p className="text-base text-muted">Nothing stored yet. Connect a source above, then pull.</p>
        ) : (
          <ul className="space-y-1 max-h-64 overflow-y-auto">
            {reports.map((r) => (
              <li key={r.key} className="text-base">
                <b>{r.label}</b> <span className="text-muted text-sm">· {r.period} · {new Date(r.at).toLocaleDateString()}</span>
                <div>{r.summary}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Card>
  );
}
