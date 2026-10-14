import type { AdAccount, TrackedCampaign, TrackerData } from "./types";

// Groups tracked campaigns by client (or a custom group like "Personal") so the
// Ads tab reads one client at a time. A campaign's group is, in order: the one
// picked on the campaign, the one picked on its ad account, or the client whose
// name appears in the campaign or account name.

export const NO_GROUP = "none";

export interface ResolvedGroup {
  key: string; // "client:<id>", "group:<id>" or "none"
  name: string;
  kind: "client" | "group" | "none";
  /** true when matched by name rather than picked */
  auto?: boolean;
}

// Words too common to identify a client by.
const STOP = new Set(["local", "ecom", "hero", "agency", "client", "clients", "services", "service", "management", "community", "manager", "commission", "marketing", "media", "digital", "group", "company", "the", "and", "ads"]);

/** The word used to spot a client in a campaign name: its first distinctive word of 4+ letters. */
export function clientKeyword(name: string): string | undefined {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .find((w) => w.length >= 4 && !STOP.has(w));
}

function lookup(data: TrackerData, key: string | undefined): ResolvedGroup | undefined {
  if (!key) return undefined;
  if (key === NO_GROUP) return { key: NO_GROUP, name: "Not grouped", kind: "none" };
  const [kind, id] = key.split(":");
  if (kind === "client") {
    const c = (data.clients ?? []).find((x) => x.id === id);
    return c ? { key, name: c.name, kind: "client" } : undefined;
  }
  if (kind === "group") {
    const g = (data.adGroups ?? []).find((x) => x.id === id);
    return g ? { key, name: g.name, kind: "group" } : undefined;
  }
  return undefined;
}

function matchByName(data: TrackerData, ...names: string[]): ResolvedGroup | undefined {
  const hay = names.join(" ").toLowerCase();
  for (const c of (data.clients ?? []).filter((x) => !x.archived)) {
    const k = clientKeyword(c.name);
    if (k && new RegExp(`(^|[^a-z0-9])${k}`).test(hay)) return { key: `client:${c.id}`, name: c.name, kind: "client", auto: true };
  }
  return undefined;
}

export function groupOfAccount(data: TrackerData, a: AdAccount): ResolvedGroup {
  return lookup(data, a.group) ?? matchByName(data, a.label) ?? { key: NO_GROUP, name: "Not grouped", kind: "none" };
}

export function groupOf(data: TrackerData, t: TrackedCampaign): ResolvedGroup {
  const account = data.adAccounts.find((a) => a.id === t.adAccountRef);
  return lookup(data, t.group) ?? lookup(data, account?.group) ?? matchByName(data, t.name, account?.label ?? "") ?? { key: NO_GROUP, name: "Not grouped", kind: "none" };
}

/** Where a campaign would go if nothing were picked on it (shown as "Auto"). */
export const autoGroupOf = (data: TrackerData, t: TrackedCampaign) => groupOf(data, { ...t, group: undefined });
export const autoGroupOfAccount = (data: TrackerData, a: AdAccount) => groupOfAccount(data, { ...a, group: undefined });

/** Campaigns in their groups: clients A–Z, then custom groups, then ungrouped. Empty groups are left out. */
export function groupCampaigns(data: TrackerData): { group: ResolvedGroup; campaigns: TrackedCampaign[] }[] {
  const by = new Map<string, { group: ResolvedGroup; campaigns: TrackedCampaign[] }>();
  for (const t of data.trackedCampaigns) {
    const g = groupOf(data, t);
    const entry = by.get(g.key) ?? { group: { ...g, auto: undefined }, campaigns: [] };
    entry.campaigns.push(t);
    by.set(g.key, entry);
  }
  const rank = { client: 0, group: 1, none: 2 };
  return [...by.values()].sort((a, b) => rank[a.group.kind] - rank[b.group.kind] || a.group.name.localeCompare(b.group.name));
}

/** Choices for a group picker. */
export function groupChoices(data: TrackerData): { key: string; name: string; kind: "client" | "group" }[] {
  return [
    ...(data.clients ?? []).filter((c) => !c.archived).map((c) => ({ key: `client:${c.id}`, name: c.name, kind: "client" as const })),
    ...(data.adGroups ?? []).map((g) => ({ key: `group:${g.id}`, name: g.name, kind: "group" as const })),
  ];
}
