import { NextResponse } from "next/server";
import { parseApplication, storeApplication } from "@/lib/rdr/applications";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send the application as JSON." }, { status: 400 });
  }
  const parsed = parseApplication(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const saved = await storeApplication(parsed.value);
    return NextResponse.json({ ok: true, id: saved.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
