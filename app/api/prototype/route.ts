import { NextResponse } from "next/server";
import { getData } from "@/lib/store";
import { FIRE_TOKEN_KEY, createJob, listJobs } from "@/lib/prototype-server";

// The Prototype maker's list of requests, and new requests.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const [data, jobs] = await Promise.all([getData(), listJobs()]);
    return NextResponse.json({
      jobs,
      settings: data.settings.prototype ?? {},
      fireToken: Boolean(data.integrations?.staffKeys?.includes(FIRE_TOKEN_KEY)),
      appearance: data.settings.appearance ?? {},
      businessName: data.settings.businessName ?? "",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { links?: unknown; description?: unknown; model?: unknown };
  const links = Array.isArray(body.links) ? body.links.filter((l): l is string => typeof l === "string").slice(0, 10) : [];
  const description = typeof body.description === "string" ? body.description : "";
  const model = typeof body.model === "string" ? body.model : undefined;
  try {
    const data = await getData();
    const origin = new URL(req.url).origin;
    const { job, fire } = await createJob({ links, description, model }, data.settings.prototype, origin);
    return NextResponse.json({ job, fire });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
