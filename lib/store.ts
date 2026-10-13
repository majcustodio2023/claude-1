import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { seedData } from "./seed";
import type { AutopilotEntry, Creative, TrackerData } from "./types";

// The whole tracker lives in one JSON document. Meta tokens are kept beside it,
// encrypted, and are never sent to the browser.

interface StoredDoc {
  data: TrackerData;
  secrets?: { tokens?: Record<string, string>; higgsfield?: string; anthropic?: string };
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

// Version 2 added the bank balance. Data saved before that gets the Oct 11
// balance from Maj's plan once; it's editable on HQ.
function migrate(doc: StoredDoc): StoredDoc {
  if ((doc.data.version ?? 1) < 2) {
    const settings = { ...doc.data.settings };
    if (settings.cashBalance == null) Object.assign(settings, { cashBalance: 165000, cashAsOf: "2026-10-11" });
    return { ...doc, data: { ...doc.data, version: 2, settings } };
  }
  return doc;
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
    integrations: { higgsfield: Boolean(doc.secrets?.higgsfield), kit: Boolean(process.env.ANTHROPIC_API_KEY || doc.secrets?.anthropic) },
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
