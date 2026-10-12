import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { seedData } from "./seed";
import type { TrackerData } from "./types";

// The whole tracker lives in one JSON document. Meta tokens are kept beside it,
// encrypted, and are never sent to the browser.

interface StoredDoc {
  data: TrackerData;
  secrets?: { tokens?: Record<string, string> };
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

async function loadDoc(): Promise<StoredDoc> {
  const doc = await readDoc();
  if (doc?.data) return doc;
  const fresh: StoredDoc = { data: seedData(), secrets: { tokens: {} } };
  await writeDoc(fresh);
  return fresh;
}

function withTokenFlags(doc: StoredDoc): TrackerData {
  const tokens = doc.secrets?.tokens ?? {};
  return { ...doc.data, adAccounts: doc.data.adAccounts.map((a) => ({ ...a, hasToken: Boolean(tokens[a.id]) })) };
}

export async function getData(): Promise<TrackerData> {
  return withTokenFlags(await loadDoc());
}

export async function saveData(data: TrackerData): Promise<TrackerData> {
  const doc = await loadDoc();
  const tokens = { ...(doc.secrets?.tokens ?? {}) };
  // Drop tokens for ad accounts that were removed.
  for (const id of Object.keys(tokens)) if (!data.adAccounts.some((a) => a.id === id)) delete tokens[id];
  const next: StoredDoc = {
    data: { ...data, adAccounts: data.adAccounts.map(({ hasToken: _h, ...a }) => a), updatedAt: new Date().toISOString() },
    secrets: { tokens },
  };
  await writeDoc(next);
  return withTokenFlags(next);
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
  await writeDoc({ ...doc, secrets: { tokens } });
}

export async function getToken(adAccountRef: string): Promise<string | null> {
  const doc = await loadDoc();
  const blob = doc.secrets?.tokens?.[adAccountRef];
  return blob ? decrypt(blob) : null;
}
