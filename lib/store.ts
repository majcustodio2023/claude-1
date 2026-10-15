import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { foldOneTimeIntoDeals, upgradeBillPayments } from "./finance";
import { upgradeTeamPay } from "./clients";
import { seedData } from "./seed";
import type { AutopilotEntry, Creative, TrackerData } from "./types";

// The whole tracker lives in one JSON document. Meta tokens are kept beside it,
// encrypted, and are never sent to the browser.

interface StoredDoc {
  data: TrackerData;
  secrets?: { tokens?: Record<string, string>; higgsfield?: string; anthropic?: string; openai?: string; calendar?: string; feed?: string };
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const DB_KEY = process.env.TRACKER_DB_KEY;
const LOCAL_FILE = path.join(process.cwd(), ".data", "tracker.json");

export const usingDatabase = Boolean(SUPABASE_URL && SUPABASE_KEY && DB_KEY);

async function rpc(fn: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY!, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Database ${fn} failed: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function readDoc(): Promise<StoredDoc | null> {
  if (usingDatabase) return (await rpc("tracker_get", { p_key: DB_KEY })) as StoredDoc | null;
  try {
    return JSON.parse(await fs.readFile(LOCAL_FILE, "utf8"));
  } catch {
    return null;
  }
}

async function writeDoc(doc: StoredDoc): Promise<void> {
  if (usingDatabase) {
    await rpc("tracker_put", { p_key: DB_KEY, p_doc: doc });
    return;
  }
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(doc, null, 2));
}

// Older saved data is upgraded once on load:
// v3 folded one-time income into deals, so one-offs show as collected or still to collect.
// v4 made the app generic: settings now hold the name, currency, locale and verse toggle.
// Installs from before v4 used pesos, Manila time and showed the daily verse, so they keep that.
// v5 turned bills ticked as paid into dated payments (bills can now be paid in parts).
// v6 moved team base pay onto a payroll bill (linking an existing matching bill) so it's counted once.
function migrate(doc: StoredDoc): StoredDoc {
  let data = doc.data;
  if ((data.version ?? 1) < 3) data = { ...foldOneTimeIntoDeals(data), version: 3 };
  if (data.version < 4) {
    const s = data.settings;
    data = {
      ...data,
      version: 4,
      settings: { ...s, currency: s.currency || "PHP", locale: s.locale ?? "en-PH", timeZone: s.timeZone ?? "Asia/Manila", dailyVerse: s.dailyVerse ?? true },
    };
  }
  if (data.version < 5) data = { ...upgradeBillPayments(data), version: 5 };
  if (data.version < 6) data = { ...upgradeTeamPay(data), version: 6 };
  return data === doc.data ? doc : { ...doc, data };
}

async function loadDoc(): Promise<StoredDoc> {
  const doc = await readDoc();
  if (doc?.data) return migrate(doc);
  const fresh: StoredDoc = { data: seedData(), secrets: { tokens: {} } };
  await writeDoc(fresh);
  return fresh;
}

function withTokenFlags(doc: StoredDoc): TrackerData {
  const tokens = doc.secrets?.tokens ?? {};
  return {
    ...doc.data,
    adAccounts: doc.data.adAccounts.map((a) => ({ ...a, hasToken: Boolean(tokens[a.id]) })),
    integrations: {
      higgsfield: Boolean(doc.secrets?.higgsfield),
      kit: Boolean(process.env.ANTHROPIC_API_KEY || doc.secrets?.anthropic),
      voice: Boolean(process.env.OPENAI_API_KEY || doc.secrets?.openai),
      calendar: Boolean(doc.secrets?.calendar),
    },
  };
}

export async function getData(): Promise<TrackerData> {
  return withTokenFlags(await loadDoc());
}

export async function saveData(data: TrackerData): Promise<TrackerData> {
  const doc = await loadDoc();
  const tokens = { ...(doc.secrets?.tokens ?? {}) };
  // Drop tokens for ad accounts that were removed.
  for (const id of Object.keys(tokens)) if (!data.adAccounts.some((a) => a.id === id)) delete tokens[id];
  const { integrations: _i, ...rest } = data;
  const next: StoredDoc = {
    data: {
      ...rest,
      adAccounts: data.adAccounts.map(({ hasToken: _h, ...a }) => a),
      // Share links are made and revoked by the server; keep its copy.
      trackedCampaigns: data.trackedCampaigns.map(({ shareToken: _s, ...t }) => {
        const token = doc.data.trackedCampaigns.find((x) => x.id === t.id)?.shareToken;
        return token ? { ...t, shareToken: token } : t;
      }),
      // The server owns the Autopilot log and creatives; a browser tab with older data mustn't overwrite them.
      autopilotLog: doc.data.autopilotLog,
      creatives: doc.data.creatives,
      updatedAt: new Date().toISOString(),
    },
    secrets: { ...doc.secrets, tokens },
  };
  await writeDoc(next);
  return withTokenFlags(next);
}

/** Daily snapshots the database keeps on every save (one per day). Empty without a database. */
export async function listBackups(): Promise<{ day: string; savedAt: string }[]> {
  if (!usingDatabase) return [];
  const rows = (await rpc("tracker_backup_list", { p_key: DB_KEY })) as { day: string; saved_at: string }[] | null;
  return (rows ?? []).map((r) => ({ day: r.day, savedAt: r.saved_at }));
}

/** Puts a day's snapshot back as the current data. Keys and server-owned lists stay as they are now. */
export async function restoreBackup(day: string): Promise<TrackerData> {
  if (!usingDatabase) throw new Error("Daily snapshots need the database");
  const snap = (await rpc("tracker_backup_get", { p_key: DB_KEY, p_day: day })) as StoredDoc | null;
  if (!snap?.data) throw new Error("No snapshot for that day");
  return saveData(migrate(snap).data);
}

/** Creates (or with null, revokes) the read-only share link for a tracked campaign. Returns the token. */
export async function setShareToken(trackedId: string, on: boolean): Promise<string | null> {
  const doc = await loadDoc();
  const t = doc.data.trackedCampaigns.find((x) => x.id === trackedId);
  if (!t) throw new Error("Campaign is not being tracked");
  if (on) t.shareToken ??= randomBytes(24).toString("base64url");
  else delete t.shareToken;
  await writeDoc(doc);
  return t.shareToken ?? null;
}

export async function appendAutopilotLog(entries: AutopilotEntry[], limit = 200): Promise<void> {
  const doc = await loadDoc();
  const autopilotLog = [...entries, ...(doc.data.autopilotLog ?? [])].slice(0, limit);
  await writeDoc({ ...doc, data: { ...doc.data, autopilotLog } });
}

function cryptoKey(): Buffer {
  return createHash("sha256").update(process.env.APP_SECRET ?? "local-dev-secret").digest();
}

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cryptoKey(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

function decrypt(blob: string): string {
  const [iv, tag, enc] = blob.split(".").map((s) => Buffer.from(s, "base64"));
  const d = createDecipheriv("aes-256-gcm", cryptoKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}

export async function setToken(adAccountRef: string, token: string | null): Promise<void> {
  const doc = await loadDoc();
  const tokens = { ...(doc.secrets?.tokens ?? {}) };
  if (token) tokens[adAccountRef] = encrypt(token.trim());
  else delete tokens[adAccountRef];
  await writeDoc({ ...doc, secrets: { ...doc.secrets, tokens } });
}

export async function getToken(adAccountRef: string): Promise<string | null> {
  const doc = await loadDoc();
  const blob = doc.secrets?.tokens?.[adAccountRef];
  return blob ? decrypt(blob) : null;
}

/** Higgsfield API key, stored as "keyId:secret", encrypted like the Meta tokens. */
export async function setHiggsfieldKey(key: string | null): Promise<void> {
  const doc = await loadDoc();
  const secrets = { ...doc.secrets };
  if (key) secrets.higgsfield = encrypt(key.trim());
  else delete secrets.higgsfield;
  await writeDoc({ ...doc, secrets });
}

export async function getHiggsfieldKey(): Promise<string | null> {
  const doc = await loadDoc();
  return doc.secrets?.higgsfield ? decrypt(doc.secrets.higgsfield) : null;
}

/** Applies a change to the creatives list on the server's copy of the data. */
export async function updateCreatives(fn: (list: Creative[]) => Creative[]): Promise<Creative[]> {
  const doc = await loadDoc();
  const creatives = fn([...(doc.data.creatives ?? [])]);
  await writeDoc({ ...doc, data: { ...doc.data, creatives } });
  return creatives;
}

/** Claude API key for Kit chat: the ANTHROPIC_API_KEY env var, else one saved in the app (encrypted). */
export async function setAnthropicKey(key: string | null): Promise<void> {
  const doc = await loadDoc();
  const secrets = { ...doc.secrets };
  if (key) secrets.anthropic = encrypt(key.trim());
  else delete secrets.anthropic;
  await writeDoc({ ...doc, secrets });
}

export async function getAnthropicKey(): Promise<string | null> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const doc = await loadDoc();
  return doc.secrets?.anthropic ? decrypt(doc.secrets.anthropic) : null;
}

export async function setOpenAIKey(key: string | null): Promise<void> {
  const doc = await loadDoc();
  const secrets = { ...doc.secrets };
  if (key) secrets.openai = encrypt(key.trim());
  else delete secrets.openai;
  await writeDoc({ ...doc, secrets });
}

export async function getOpenAIKey(): Promise<string | null> {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const doc = await loadDoc();
  return doc.secrets?.openai ? decrypt(doc.secrets.openai) : null;
}

/** Private iCal address of the owner's calendar (e.g. Google Calendar's secret address). Encrypted; never sent to the browser. */
export async function setCalendarUrl(url: string | null): Promise<void> {
  const doc = await loadDoc();
  const secrets = { ...doc.secrets };
  if (url) secrets.calendar = encrypt(url.trim());
  else delete secrets.calendar;
  await writeDoc({ ...doc, secrets });
}

export async function getCalendarUrl(): Promise<string | null> {
  const doc = await loadDoc();
  return doc.secrets?.calendar ? decrypt(doc.secrets.calendar) : null;
}

/** Secret token in the address calendar apps use to subscribe to the missions feed. Made on first use; `reset` makes a new one. */
export async function getFeedToken(reset = false): Promise<string> {
  const doc = await loadDoc();
  if (doc.secrets?.feed && !reset) return decrypt(doc.secrets.feed);
  const token = randomBytes(24).toString("base64url");
  await writeDoc({ ...doc, secrets: { ...doc.secrets, feed: encrypt(token) } });
  return token;
}

/** The data, if `token` matches the feed token (compared in constant time). */
export async function dataForFeed(token: string): Promise<TrackerData | null> {
  const doc = await loadDoc();
  if (!doc.secrets?.feed || !token) return null;
  const a = createHash("sha256").update(decrypt(doc.secrets.feed)).digest();
  const b = createHash("sha256").update(token).digest();
  return timingSafeEqual(a, b) ? doc.data : null;
}
