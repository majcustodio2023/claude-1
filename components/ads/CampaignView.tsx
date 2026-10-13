"use client";

import { useState, type ReactNode } from "react";
import { locale, moneyIn } from "@/lib/finance";
import { EVENTS, type AdRow, type AdSetRow, type CampaignReport, type FunnelStep, type SliceRow, type Suggestion, type SuggestedAction } from "@/lib/meta";
import type { TrackedCampaign } from "@/lib/types";
import { Badge, Btn, Stat } from "../ui";
import { Icon, type IconName } from "../icons";

export type InsightResult = CampaignReport & { suggestions: Suggestion[]; fetchedAt: string };

const TONE = { good: "good", info: "accent", warn: "warn", bad: "bad" } as const;
const LABEL = { good: "win", info: "note", warn: "watch", bad: "fix" } as const;
const AREA: Record<NonNullable<Suggestion["area"]>, string> = { results: "Results", creative: "Creative", funnel: "Funnel", pixel: "Pixel", audience: "Audience", trend: "Trend", structure: "Ad sets" };

type View = "overview" | "funnel" | "audience" | "trend" | "manage";
const VIEWS: [View, string, IconName][] = [
  ["overview", "Overview", "radar"],
  ["funnel", "Funnel & pixel", "target"],
  ["audience", "Audience & placements", "squad"],
  ["trend", "Day by day", "chart"],
  ["manage", "Ads & ad sets", "gear"],
];

const pct = (n: number | null | undefined, d = 1) => (n == null ? "–" : `${n.toFixed(n >= 10 ? 0 : d)}%`);
const num = (n: number) => n.toLocaleString(locale());

/** The full analysis and controls for one tracked campaign. */
export default function CampaignView({ tracked, result, onApply }: { tracked: TrackedCampaign; result: InsightResult; onApply: (action: SuggestedAction) => Promise<string | null> }) {
  const [view, setView] = useState<View>("overview");
  const [status, setStatus] = useState<Record<string, string>>({});
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<Record<string, string>>({});
  const cur = (n: number) => moneyIn(n, result.currency);
  const canManage = tracked.mode !== "view";

  /** Runs one change and remembers its outcome so the panel updates without reloading. */
  const run = async (key: string, action: SuggestedAction, ask = true) => {
    if (ask) {
      const what = action.type === "budget" ? `Set the daily budget of "${action.targetName}" to ${cur(action.newDailyBudget!)}` : `${action.type === "pause" ? "Pause" : "Turn on"} "${action.targetName}"`;
      if (!confirm(`${what} in Meta now?`)) return false;
    }
    setBusy((x) => ({ ...x, [key]: "Working…" }));
    const err = await onApply({ ...action, currency: result.currency });
    setBusy((x) => ({ ...x, [key]: err ?? "Done" }));
    if (!err) {
      if (action.type === "budget") setBudgets((x) => ({ ...x, [action.targetId]: action.newDailyBudget! }));
      else setStatus((x) => ({ ...x, [action.targetId]: action.type === "pause" ? "PAUSED" : "ACTIVE" }));
    }
    return !err;
  };

  const fixes = result.suggestions.filter((s) => s.action?.type === "pause" && s.severity === "bad");
  const applyAllFixes = async () => {
    if (!confirm(`Pause all ${fixes.length} flagged item${fixes.length === 1 ? "" : "s"}?\n\n${fixes.map((s) => `• ${s.action!.targetName}`).join("\n")}`)) return;
    for (const s of fixes) await run(`s-${s.action!.targetId}`, s.action!, false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 flex-wrap" role="tablist">
        {VIEWS.map(([id, label, icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border-2 text-sm font-extrabold ${view === id ? "bg-gold text-outline border-outline" : "border-line text-muted hover:text-ink"}`}
          >
            <Icon name={icon} size={18} />
            {label}
          </button>
        ))}
      </div>

      {view === "overview" && (
        <>
          <Numbers r={result} cur={cur} />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-display text-lg tracking-wide flex-1">What to do</div>
            {canManage && fixes.length > 1 && <Btn onClick={applyAllFixes}>Pause all {fixes.length} flagged</Btn>}
          </div>
          <Suggestions list={result.suggestions} cur={cur} canManage={canManage} busy={busy} run={run} />
        </>
      )}
      {view === "funnel" && <FunnelView r={result} cur={cur} />}
      {view === "audience" && <AudienceView r={result} cur={cur} />}
      {view === "trend" && <TrendView r={result} cur={cur} />}
      {view === "manage" && <ManageView r={result} cur={cur} tracked={tracked} canManage={canManage} status={status} budgets={budgets} busy={busy} run={run} />}

      <p className="text-sm text-muted">Updated {new Date(result.fetchedAt).toLocaleString(locale())}</p>
    </div>
  );
}

function Numbers({ r, cur }: { r: InsightResult; cur: (n: number) => string }) {
  const m = r.metrics;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
      <Stat label="Spend" value={cur(m.spend)} hint={`Reach ${num(m.reach)}`} />
      <Stat label="Results" value={num(m.results)} hint={m.resultType} />
      <Stat label="Cost / result" value={m.cpl != null ? cur(m.cpl) : "–"} />
      <Stat label="ROAS" value={m.roas != null ? `${m.roas.toFixed(2)}x` : "–"} hint={m.revenue ? `${cur(m.revenue)} sales${m.aov ? ` · AOV ${cur(m.aov)}` : ""}` : undefined} />
      <Stat label="Link CTR" value={pct(m.ctr, 2)} hint={`All clicks ${pct(m.ctrAll, 2)}`} />
      <Stat label="Cost per click" value={m.linkClicks ? cur(m.cpc) : "–"} hint={`${num(m.linkClicks)} link clicks`} />
      <Stat label="CPM" value={cur(m.cpm)} hint={`${num(m.impressions)} impressions`} />
      <Stat label="Frequency" value={m.frequency.toFixed(2)} tone={m.frequency > 3 ? "bad" : undefined} />
      <Stat label="Page views" value={m.lpv ? num(m.lpv) : "–"} hint={m.lpvRate != null ? `${pct(m.lpvRate)} of clicks` : undefined} />
      <Stat label="Conversion rate" value={pct(m.cvr)} hint={m.lpv ? "results ÷ page views" : "results ÷ clicks"} />
      <Stat label="Hook rate" value={pct(m.hookRate)} hint={m.videoViews3s ? `${num(m.videoViews3s)} 3s views` : "no video"} />
      <Stat label="Hold rate" value={pct(m.holdRate)} hint={m.thruplays ? `${num(m.thruplays)} ThruPlays` : undefined} />
    </div>
  );
}

function Suggestions({ list, cur, canManage, busy, run }: { list: Suggestion[]; cur: (n: number) => string; canManage: boolean; busy: Record<string, string>; run: (key: string, a: SuggestedAction) => Promise<boolean> }) {
  return (
    <div className="space-y-2.5">
      {list.map((s, i) => {
        const key = s.action ? `s-${s.action.targetId}` : `i-${i}`;
        return (
          <div key={`${i}-${s.title}`} className="flex gap-3 items-start">
            <Badge tone={TONE[s.severity]}>{LABEL[s.severity]}</Badge>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold leading-snug">
                {s.title}
                {s.area && <span className="ml-2 text-xs font-extrabold uppercase tracking-wide text-muted">{AREA[s.area]}</span>}
              </div>
              <div className="text-muted">{s.detail}</div>
            </div>
            {s.action &&
              (canManage ? (
                busy[key] ? (
                  <span className="text-sm text-muted">{busy[key]}</span>
                ) : (
                  <Btn onClick={() => run(key, s.action!)}>
                    {s.action.type === "pause" ? `Pause ${s.action.level === "adset" ? "ad set" : s.action.level}` : s.action.type === "resume" ? "Turn on" : `Budget → ${cur(s.action.newDailyBudget!)}/day`}
                  </Btn>
                )
              ) : (
                <span className="text-sm text-muted max-sm:hidden">Switch to Manage to apply</span>
              ))}
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <div className="font-display text-lg tracking-wide">{title}</div>
        {note && <p className="text-sm text-muted">{note}</p>}
      </div>
      {children}
    </div>
  );
}

function rateTone(s: FunnelStep): "good" | "warn" | "bad" | "muted" {
  if (!s.bench || s.rate == null) return "muted";
  return s.rate >= s.bench.good ? "good" : s.rate >= s.bench.low ? "warn" : "bad";
}

function FunnelView({ r, cur }: { r: InsightResult; cur: (n: number) => string }) {
  const m = r.metrics;
  const steps = r.funnel;
  const max = Math.max(1, ...steps.slice(1).map((s) => s.count));
  const known = new Set(EVENTS.flatMap((e) => e.types as readonly string[]));
  const other = m.actions.filter((a) => !known.has(a.type)).sort((a, b) => b.value - a.value);
  const tracked = EVENTS.filter((e) => (m.events[e.id] ?? 0) > 0);
  return (
    <div className="space-y-5">
      <Section title="Funnel" note="Each step shows how many made it from the step before. Green is healthy, yellow is so-so, red is where you lose people.">
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={s.id} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] sm:grid-cols-[12rem_1fr_auto] gap-2 items-center">
              <div className="font-extrabold text-sm leading-tight">{s.label}</div>
              <div className="h-7 bg-field rounded-[6px] overflow-hidden relative">
                <div className="h-full bg-accent/70" style={{ width: `${i === 0 ? 100 : Math.max(2, (s.count / max) * 100)}%` }} />
                <span className="absolute inset-y-0 left-2 flex items-center text-sm font-extrabold">{num(s.count)}</span>
              </div>
              <div className="flex items-center gap-2 justify-end min-w-[7rem]">
                {s.rate != null && <Badge tone={rateTone(s)}>{pct(s.rate, s.id === "link_click" ? 2 : 1)}</Badge>}
                {s.cost != null && <span className="text-sm text-muted tabular-nums max-sm:hidden">{cur(s.cost)} each</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pixel and events" note="What Meta's pixel and forms reported for this campaign. If an event you expect is missing, check it in Events Manager.">
        {tracked.length === 0 ? (
          <p className="text-muted">No conversion events were reported in this period.</p>
        ) : (
          <Table head={["Event", "Count", "Cost each", "Rate vs clicks"]}>
            {tracked.map((e) => {
              const c = m.events[e.id]!;
              return (
                <tr key={e.id}>
                  <td className="py-1.5 pr-3 font-extrabold">{e.label}</td>
                  <td className="pr-3 tabular-nums">{num(c)}</td>
                  <td className="pr-3 tabular-nums">{cur(m.spend / c)}</td>
                  <td className="tabular-nums">{m.linkClicks ? pct((c / m.linkClicks) * 100) : "–"}</td>
                </tr>
              );
            })}
          </Table>
        )}
        {other.length > 0 && (
          <details>
            <summary className="text-sm cursor-pointer text-muted">All other actions Meta counted ({other.length})</summary>
            <Table head={["Action", "Count"]}>
              {other.map((a) => (
                <tr key={a.type}>
                  <td className="py-1 pr-3 break-all">{a.type}</td>
                  <td className="tabular-nums">{num(a.value)}</td>
                </tr>
              ))}
            </Table>
          </details>
        )}
      </Section>

      {m.watched && (
        <Section title="Video watch-through" note="Share of people who watched 3 seconds that kept watching.">
          <div className="grid grid-cols-4 gap-2">
            {(["25%", "50%", "75%", "100%"] as const).map((l, i) => (
              <div key={l} className="text-center">
                <div className="h-24 bg-field rounded-[6px] flex items-end overflow-hidden">
                  <div className="w-full bg-hero/80" style={{ height: `${Math.min(100, m.watched![i])}%` }} />
                </div>
                <div className="font-extrabold mt-1">{pct(m.watched![i])}</div>
                <div className="text-sm text-muted">watched {l}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function SliceTable({ rows, cur, campaignCpl }: { rows: SliceRow[]; cur: (n: number) => string; campaignCpl: number | null }) {
  const best = rows.filter((x) => x.results >= 3 && x.cpl != null).sort((a, b) => a.cpl! - b.cpl!)[0];
  return (
    <Table head={["", "Spend", "Share", "CTR", "CPM", "Results", "Cost/result"]}>
      {rows.map((x) => {
        const tone = x === best ? "text-good" : x.results === 0 && x.share >= 15 ? "text-bad" : campaignCpl && x.cpl && x.cpl > campaignCpl * 2 ? "text-warn" : "";
        return (
          <tr key={x.key}>
            <td className={`py-1.5 pr-3 font-extrabold ${tone}`}>{x.label}</td>
            <td className="pr-3 tabular-nums">{cur(x.spend)}</td>
            <td className="pr-3 tabular-nums">{pct(x.share)}</td>
            <td className="pr-3 tabular-nums">{pct(x.ctr, 2)}</td>
            <td className="pr-3 tabular-nums">{cur(x.cpm)}</td>
            <td className="pr-3 tabular-nums">{num(x.results)}</td>
            <td className={`tabular-nums ${tone}`}>{x.cpl != null ? cur(x.cpl) : "–"}</td>
          </tr>
        );
      })}
    </Table>
  );
}

function AudienceView({ r, cur }: { r: InsightResult; cur: (n: number) => string }) {
  return (
    <div className="space-y-5">
      <Section title="Placements" note="Where the ads ran. Green is the cheapest results, red spent a big share with nothing back.">
        {r.placements.length ? <SliceTable rows={r.placements} cur={cur} campaignCpl={r.metrics.cpl} /> : <p className="text-muted">Meta didn&apos;t return placement data for this period.</p>}
      </Section>
      <Section title="Age and gender">
        {r.demographics.length ? <SliceTable rows={r.demographics} cur={cur} campaignCpl={r.metrics.cpl} /> : <p className="text-muted">Meta didn&apos;t return age and gender data for this period.</p>}
      </Section>
    </div>
  );
}

function TrendView({ r, cur }: { r: InsightResult; cur: (n: number) => string }) {
  const days = r.trend;
  if (days.length < 2) return <p className="text-muted">Pick a longer date range (7 days or more) to see the day-by-day trend.</p>;
  const maxSpend = Math.max(1, ...days.map((d) => d.spend));
  const cpls = days.map((d) => d.cpl).filter((x): x is number => x != null);
  const maxCpl = Math.max(1, ...cpls);
  const maxCtr = Math.max(0.1, ...days.map((d) => d.ctr));
  const W = 100 / days.length;
  const line = (val: (d: (typeof days)[number]) => number | null, top: number) =>
    days
      .map((d, i) => {
        const v = val(d);
        return v == null ? null : `${i * W + W / 2},${100 - (v / top) * 92}`;
      })
      .filter(Boolean)
      .join(" ");
  const short = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { month: "short", day: "numeric" });
  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap text-sm font-extrabold">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-accent/60" /> Spend</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-1 bg-hero" /> Cost per result</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-1 bg-gold" /> Link CTR</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-56 bg-field rounded-[8px]" role="img" aria-label="Daily spend, cost per result and CTR">
        {days.map((d, i) => (
          <rect key={d.date} x={i * W + W * 0.15} width={W * 0.7} y={100 - (d.spend / maxSpend) * 92} height={(d.spend / maxSpend) * 92} fill="var(--color-accent)" opacity={0.45} />
        ))}
        <polyline points={line((d) => d.cpl, maxCpl)} fill="none" stroke="var(--color-hero)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <polyline points={line((d) => d.ctr, maxCtr)} fill="none" stroke="var(--color-gold)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeDasharray="4 3" />
      </svg>
      <Table head={["Day", "Spend", "Results", "Cost/result", "CTR", "CPM"]}>
        {[...days].reverse().map((d) => (
          <tr key={d.date}>
            <td className="py-1 pr-3 font-extrabold whitespace-nowrap">{short(d.date)}</td>
            <td className="pr-3 tabular-nums">{cur(d.spend)}</td>
            <td className="pr-3 tabular-nums">{num(d.results)}</td>
            <td className="pr-3 tabular-nums">{d.cpl != null ? cur(d.cpl) : "–"}</td>
            <td className="pr-3 tabular-nums">{pct(d.ctr, 2)}</td>
            <td className="tabular-nums">{cur(d.cpm)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function StatusBadge({ s }: { s?: string }) {
  const on = s === "ACTIVE";
  return <Badge tone={on ? "good" : s?.includes("PAUSED") ? "muted" : "warn"}>{on ? "on" : (s ?? "unknown").toLowerCase().replace(/_/g, " ")}</Badge>;
}

interface ManageProps {
  r: InsightResult;
  cur: (n: number) => string;
  tracked: TrackedCampaign;
  canManage: boolean;
  status: Record<string, string>;
  budgets: Record<string, number>;
  busy: Record<string, string>;
  run: (key: string, a: SuggestedAction, ask?: boolean) => Promise<boolean>;
}

function ManageView(p: ManageProps) {
  const { r, canManage, status } = p;
  const c = r.campaign;
  const campaignStatus = status[c.id] ?? c.effective_status;
  const adsBySet = new Map<string, AdRow[]>();
  for (const a of r.ads) adsBySet.set(a.adsetId ?? "", [...(adsBySet.get(a.adsetId ?? "") ?? []), a]);
  const orphan = adsBySet.get("") ?? [];
  return (
    <div className="space-y-4">
      {!canManage && <p className="text-warn font-extrabold">This campaign is View only. Switch it to Manage above to pause, turn on or change budgets here.</p>}
      <div className="border-2 border-line rounded-[10px] p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon name="flame" size={20} />
          <span className="font-extrabold">Campaign</span>
          <StatusBadge s={campaignStatus} />
          <div className="flex-1" />
          <Toggle {...p} level="campaign" id={c.id} name={c.name} current={campaignStatus} />
        </div>
        {r.dailyBudget != null ? (
          <BudgetEditor {...p} level="campaign" id={c.id} name={c.name} budget={p.budgets[c.id] ?? r.dailyBudget} />
        ) : (
          <p className="text-sm text-muted">Budgets are set on each ad set below.</p>
        )}
      </div>

      {r.adsets.map((s) => (
        <AdSetBlock key={s.id} s={s} ads={adsBySet.get(s.id) ?? []} cbo={r.dailyBudget != null} {...p} />
      ))}
      {orphan.length > 0 && <AdList ads={orphan} {...p} />}
      {canManage && <p className="text-sm text-muted">Every change here is sent to Meta right away and saved in the Autopilot log as yours.</p>}
    </div>
  );
}

function AdSetBlock(p: ManageProps & { s: AdSetRow; ads: AdRow[]; cbo: boolean }) {
  const { s, ads, cur, status, budgets, cbo } = p;
  const st = status[s.id] ?? s.status;
  return (
    <div className="border-2 border-line rounded-[10px] p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Icon name="box" size={20} />
        <span className="font-extrabold min-w-0 break-words">{s.name}</span>
        <StatusBadge s={st} />
        <div className="flex-1" />
        <Toggle {...p} level="adset" id={s.id} name={s.name} current={st} />
      </div>
      <div className="text-sm text-muted flex gap-x-4 gap-y-1 flex-wrap">
        <span>Spend {cur(s.m.spend)}</span>
        <span>Results {num(s.m.results)}</span>
        <span>Cost/result {s.m.cpl != null ? cur(s.m.cpl) : "–"}</span>
        <span>CTR {pct(s.m.ctr, 2)}</span>
        {s.goal && <span>Optimizing for {s.goal.toLowerCase().replace(/_/g, " ")}</span>}
      </div>
      {!cbo && s.dailyBudget != null && <BudgetEditor {...p} level="adset" id={s.id} name={s.name} budget={budgets[s.id] ?? s.dailyBudget} />}
      {!cbo && s.dailyBudget == null && s.lifetimeBudget != null && <p className="text-sm text-muted">Lifetime budget {cur(s.lifetimeBudget)} (edit it in Ads Manager).</p>}
      {ads.length > 0 && <AdList {...p} ads={ads} />}
    </div>
  );
}

function AdList(p: ManageProps & { ads: AdRow[] }) {
  const { ads, cur, status } = p;
  return (
    <div className="overflow-x-auto">
      <Table head={["Ad", "", "Spend", "Results", "Cost/result", "CTR", "Hook", ""]}>
        {[...ads]
          .sort((a, b) => b.m.spend - a.m.spend)
          .map((a) => {
            const st = status[a.id] ?? a.status;
            return (
              <tr key={a.id}>
                <td className="py-1.5 pr-3 max-w-64 truncate font-extrabold" title={a.name}>{a.name}</td>
                <td className="pr-3"><StatusBadge s={st} /></td>
                <td className="pr-3 tabular-nums">{cur(a.m.spend)}</td>
                <td className="pr-3 tabular-nums">{num(a.m.results)}</td>
                <td className="pr-3 tabular-nums">{a.m.cpl != null ? cur(a.m.cpl) : "–"}</td>
                <td className="pr-3 tabular-nums">{pct(a.m.ctr, 2)}</td>
                <td className="pr-3 tabular-nums">{pct(a.m.hookRate)}</td>
                <td className="text-right"><Toggle {...p} level="ad" id={a.id} name={a.name} current={st} small /></td>
              </tr>
            );
          })}
      </Table>
    </div>
  );
}

function Toggle({ canManage, busy, run, level, id, name, current, small }: ManageProps & { level: SuggestedAction["level"]; id: string; name: string; current?: string; small?: boolean }) {
  const key = `t-${id}`;
  if (!canManage) return null;
  if (busy[key] && busy[key] !== "Done") return <span className="text-sm text-muted">{busy[key]}</span>;
  const on = current === "ACTIVE";
  const canResume = current === "PAUSED" || current === "CAMPAIGN_PAUSED" || current === "ADSET_PAUSED" || current === "AD_PAUSED";
  if (!on && !canResume) return null;
  return (
    <Btn className={small ? "!py-1 !px-2 text-sm" : ""} kind={on ? "ghost" : "primary"} onClick={() => run(key, { type: on ? "pause" : "resume", level, targetId: id, targetName: name })}>
      {on ? "Pause" : "Turn on"}
    </Btn>
  );
}

function BudgetEditor({ tracked, canManage, busy, run, cur, level, id, name, budget }: ManageProps & { level: "campaign" | "adset"; id: string; name: string; budget: number }) {
  const [value, setValue] = useState(String(Math.round(budget)));
  const step = (tracked.scaleStep ?? 20) / 100;
  const key = `b-${id}`;
  const save = async (next: number) => {
    if (!(next > 0)) return;
    const change = ((next - budget) / budget) * 100;
    const big = Math.abs(change) > 50 ? "\n\nThat's a big jump. Changes over 50% can restart Meta's learning phase." : "";
    if (!confirm(`Set the daily budget of "${name}" from ${cur(budget)} to ${cur(next)} (${change >= 0 ? "+" : ""}${change.toFixed(0)}%)?${big}`)) return;
    if (await run(key, { type: "budget", level, targetId: id, targetName: name, newDailyBudget: Math.round(next) }, false)) setValue(String(Math.round(next)));
  };
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-extrabold">Daily budget {cur(budget)}</span>
      {canManage && (
        <>
          <Btn className="!py-1 !px-2 text-sm" onClick={() => save(budget * (1 - step))}>−{Math.round(step * 100)}%</Btn>
          <Btn className="!py-1 !px-2 text-sm" onClick={() => save(budget * (1 + step))}>+{Math.round(step * 100)}%</Btn>
          <input className="w-28" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} aria-label={`New daily budget for ${name}`} />
          <Btn className="!py-1 !px-2 text-sm" kind="primary" onClick={() => save(Number(value.replace(/[^\d.]/g, "")))}>Set</Btn>
          {busy[key] && <span className="text-sm text-muted">{busy[key]}</span>}
        </>
      )}
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-muted text-left">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="py-1 pr-3 font-extrabold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
