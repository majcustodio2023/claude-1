import { NextResponse } from "next/server";
import { saveFunnelEvent } from "@/lib/feeds-server";
import { isInboxToken } from "@/lib/store";

export const dynamic = "force-dynamic";

// The funnel inbox. Funnel tools (GoHighLevel, ClickFunnels, Systeme, Zapier, Make…) send each
// opt-in, booking or sale here as JSON or a form post, e.g. { "funnel": "Webinar", "event": "optin" }
// or { "funnel": "Webinar", "event": "purchase", "value": 997 }. The secret address is the only key,
// so nothing expires; a new address can be made in Settings.
async function body(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return ((await req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  if (type.includes("form")) return Object.fromEntries((await req.formData()).entries()) as Record<string, unknown>;
  const text = await req.text();
  try {
    return JSON.parse(text);
  } catch {
    return Object.fromEntries(new URLSearchParams(text));
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await isInboxToken(token))) return NextResponse.json({ error: "Unknown address" }, { status: 404 });
  const b = await body(req);
  // Funnel tools often nest the contact under a key; read the top level and one level down.
  const flat: Record<string, unknown> = { ...b };
  for (const v of Object.values(b)) if (v && typeof v === "object" && !Array.isArray(v)) for (const [k, x] of Object.entries(v)) flat[k] ??= x;
  await saveFunnelEvent(flat);
  return NextResponse.json({ ok: true });
}

/** A quick check from a browser or the funnel tool's "test" button: ?funnel=&event= also records one. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await isInboxToken(token))) return NextResponse.json({ error: "Unknown address" }, { status: 404 });
  const q = Object.fromEntries(new URL(req.url).searchParams);
  if (q.event || q.funnel) await saveFunnelEvent(q);
  return NextResponse.json({ ok: true, recorded: Boolean(q.event || q.funnel) });
}
