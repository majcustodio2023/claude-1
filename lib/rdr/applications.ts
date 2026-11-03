import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Application, StoredApplication } from "./validate";

export { parseApplication, type Application, type StoredApplication } from "./validate";

// Applications from the /rdr page. Stored in Supabase when the tracker's database is
// configured (table rdr_applications, see supabase/schema.sql), otherwise appended to a
// local JSON file. Optionally forwarded to a webhook (Zapier, Make, a CRM) and emailed
// through Resend when those keys are set.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const LOCAL_FILE = path.join(process.cwd(), ".data", "rdr-applications.json");

async function saveLocal(app: StoredApplication) {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  let list: StoredApplication[] = [];
  try {
    list = JSON.parse(await fs.readFile(LOCAL_FILE, "utf8"));
  } catch {
    list = [];
  }
  list.push(app);
  await fs.writeFile(LOCAL_FILE, JSON.stringify(list, null, 2));
}

async function saveSupabase(app: StoredApplication) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rdr_applications`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY!, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ id: app.id, received_at: app.receivedAt, email: app.email, business: app.business, payload: app }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Database insert failed: ${res.status} ${await res.text()}`);
}

async function notify(app: StoredApplication) {
  const hook = process.env.RDR_APPLY_WEBHOOK;
  const tasks: Promise<unknown>[] = [];
  if (hook) tasks.push(fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(app) }).catch(() => undefined));
  const to = process.env.RDR_NOTIFY_EMAIL;
  const key = process.env.RESEND_API_KEY;
  if (to && key) {
    const lines = Object.entries(app)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("\n");
    tasks.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.RDR_NOTIFY_FROM ?? "RDR Applications <onboarding@resend.dev>", to: [to], reply_to: app.email, subject: `New RDR application: ${app.business}`, text: lines }),
      }).catch(() => undefined),
    );
  }
  await Promise.all(tasks);
}

export async function storeApplication(value: Application): Promise<StoredApplication> {
  const app: StoredApplication = { ...value, id: crypto.randomUUID(), receivedAt: new Date().toISOString() };
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      await saveSupabase(app);
    } catch {
      await saveLocal(app);
    }
  } else {
    await saveLocal(app);
  }
  await notify(app);
  return app;
}
