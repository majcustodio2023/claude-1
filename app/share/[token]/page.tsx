import type { Metadata } from "next";
import { configureLocale, locale, moneyIn } from "@/lib/finance";
import { analyze, fetchCampaignInsights, toMetrics, type AdRow, type DatePreset, type Metrics, type Suggestion } from "@/lib/meta";
import { resolveTracked } from "@/lib/meta-server";
import { getData } from "@/lib/store";
import { Badge, Stat } from "@/components/ui";

// Read-only campaign report for someone without a login (e.g. an ads expert).
// Anyone with the link can see it; it's turned off from Ad Command. Results come
// live from Meta each time the page opens, so it's always up to date.

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Campaign report", robots: { index: false, follow: false } };

const RANGES: [DatePreset, string][] = [
  ["yesterday", "Yesterday"],
  ["last_7d", "Last 7 days"],
  ["last_14d", "Last 14 days"],
  ["last_30d", "Last 30 days"],
  ["this_month", "This month"],
];
const TONE = { good: "good", info: "accent", warn: "warn", bad: "bad" } as const;
const LABEL = { good: "win", info: "note", warn: "watch", bad: "fix" } as const;
const STATUS_TONE = { done: "good", skipped: "muted", error: "bad" } as const;

export default async function SharedCampaign({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ range?: string }> }) {
  const { token } = await params;
  const { range } = await searchParams;
  const preset: DatePreset = RANGES.some(([r]) => r === range) ? (range as DatePreset) : "last_7d";

  const data = await getData();
  const tracked = token.length >= 20 ? data.trackedCampaigns.find((t) => t.shareToken === token) : undefined;
  if (!tracked) {
    return (
      <Shell>
        <h1 className="font-display text-3xl">Link not found</h1>
        <p className="text-lg text-muted mt-2">This report link was turned off or doesn&apos;t exist. Ask for a new one.</p>
      </Shell>
    );
  }
  configureLocale(data.settings);

  let report: { metrics: Metrics; ads: AdRow[]; suggestions: Suggestion[] } | null = null;
  let currency: string | undefined;
  let error = "";
  try {
    const { token: metaToken } = await resolveTracked(tracked.id);
    const raw = await fetchCampaignInsights(tracked.campaignId, metaToken, preset);
    const metrics = toMetrics(raw.campaign, tracked.resultAction);
    const ads = raw.ads.map((a) => ({ id: a.ad_id!, name: a.ad_name ?? a.ad_id!, adsetId: a.adset_id, adsetName: a.adset_name, m: toMetrics(a, tracked.resultAction) }));
    const suggestions = analyze(metrics, ads, raw.adsets, raw.info, {
      cpl: tracked.targetCpl ?? data.settings.targetCpl,
      roas: tracked.targetRoas ?? data.settings.targetRoas,
    }, raw.currency);
    report = { metrics, ads, suggestions };
    currency = raw.currency;
  } catch (e) {
    error = (e as Error).message;
  }

  const log = (data.autopilotLog ?? []).filter((e) => e.trackedId === tracked.id).slice(0, 20);
  const when = (iso: string) => new Date(iso).toLocaleString(locale(), { timeZone: data.settings.timeZone || undefined, dateStyle: "medium", timeStyle: "short" });
  const m = report?.metrics;
  const money = (n: number) => moneyIn(n, currency);
  const cplTarget = tracked.targetCpl ?? data.settings.targetCpl;

  return (
    <Shell>
      <div className="text-base text-muted font-bold uppercase tracking-wide">{data.settings.businessName || "Campaign report"} · read-only</div>
      <h1 className="font-display text-3xl md:text-4xl mt-1 break-words">{tracked.name}</h1>
      <p className="text-base text-muted mt-1">
        Target cost per result {money(cplTarget)} ·{" "}
        {tracked.mode === "autopilot" ? "Autopilot makes changes daily" : tracked.mode === "manage" ? "Changes are applied by hand" : "Suggestions only"} · Live from Meta, updated{" "}
        {when(new Date().toISOString())}
      </p>

      <nav className="flex flex-wrap gap-2 mt-4">
        {RANGES.map(([r, label]) => (
          <a key={r} href={`?range=${r}`} className={`btn ${r === preset ? "btn-primary" : "btn-ghost"} px-3`}>
            {label}
          </a>
        ))}
      </nav>

      {error && <p className="text-lg text-bad mt-4">Couldn&apos;t load results from Meta right now: {error}</p>}

      {m && report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <Stat label="Spend" value={money(m.spend)} />
            <Stat label="Results" value={m.results} hint={m.resultType} />
            <Stat label="Cost / result" value={m.cpl != null ? money(m.cpl) : "–"} />
            <Stat label="ROAS" value={m.roas != null ? `${m.roas.toFixed(2)}x` : "–"} />
            <Stat label="Link CTR" value={`${m.ctr.toFixed(2)}%`} hint={`${m.linkClicks} clicks · CPC ${money(m.cpc)}`} />
            <Stat label="CPM" value={money(m.cpm)} hint={`Frequency ${m.frequency.toFixed(1)}`} />
            <Stat label="3s video views" value={m.videoViews3s.toLocaleString()} hint={m.hookRate != null ? `Hook ${m.hookRate.toFixed(0)}%` : undefined} />
            <Stat label="ThruPlays" value={m.thruplays.toLocaleString()} hint={m.holdRate != null ? `Hold ${m.holdRate.toFixed(0)}%` : undefined} />
          </div>

          <Section title="What needs doing">
            <div className="space-y-3">
              {report.suggestions.map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <Badge tone={TONE[s.severity]}>{LABEL[s.severity]}</Badge>
                  <div className="flex-1 text-lg">
                    <div className="font-bold">{s.title}</div>
                    <div className="text-muted">{s.detail}</div>
                    {s.action && (
                      <div className="text-base mt-1">
                        Suggested change: {s.action.type === "pause" ? `pause "${s.action.targetName}"` : `set "${s.action.targetName}" to ${money(s.action.newDailyBudget!)} a day`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {report.ads.length > 0 && (
            <Section title={`Ads (${report.ads.length})`}>
              <div className="overflow-x-auto">
                <table className="w-full text-base">
                  <thead className="text-muted text-left">
                    <tr>
                      <th className="py-1 pr-3">Ad</th>
                      <th className="pr-3">Spend</th>
                      <th className="pr-3">Results</th>
                      <th className="pr-3">Cost/result</th>
                      <th className="pr-3">CTR</th>
                      <th className="pr-3">Hook</th>
                      <th>Hold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[...report.ads].sort((a, b) => b.m.spend - a.m.spend).map((a) => (
                      <tr key={a.id}>
                        <td className="py-1.5 pr-3 max-w-72 break-words">{a.name}</td>
                        <td className="pr-3 tabular-nums">{money(a.m.spend)}</td>
                        <td className="pr-3 tabular-nums">{a.m.results}</td>
                        <td className="pr-3 tabular-nums">{a.m.cpl != null ? money(a.m.cpl) : "–"}</td>
                        <td className="pr-3 tabular-nums">{a.m.ctr.toFixed(2)}%</td>
                        <td className="pr-3 tabular-nums">{a.m.hookRate != null ? `${a.m.hookRate.toFixed(0)}%` : "–"}</td>
                        <td className="tabular-nums">{a.m.holdRate != null ? `${a.m.holdRate.toFixed(0)}%` : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </>
      )}

      <Section title="Changes made">
        {log.length ? (
          <div className="space-y-2">
            {log.map((e) => (
              <div key={e.id} className="flex gap-3 items-start text-base">
                <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                <div className="flex-1">
                  <div>{e.action}</div>
                  <div className="text-muted">
                    {when(e.at)}
                    {e.note ? ` · ${e.note}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base text-muted">No automatic changes logged for this campaign yet.</p>
        )}
      </Section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 bg-card border-[3px] border-outline rounded-[10px] p-4 shadow-[4px_4px_0_var(--color-outline)]">
      <h2 className="font-display text-2xl mb-3">{title}</h2>
      {children}
    </section>
  );
}
