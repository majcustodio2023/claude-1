import { NextResponse } from "next/server";
import { getData } from "@/lib/store";
import { FIRE_TOKEN_KEY, createJob, listJobs } from "@/lib/prototype-server";
import { brandOf } from "@/lib/prototype";

// The Prototype maker's list of requests, and new requests.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ?brand=wendy gives Wendy's list and settings; anything else is the Prototype maker.
export async function GET(req: Request) {
  const brand = req.headers.get("x-wendy") === "1" ? "wendy" : brandOf(new URL(req.url).searchParams.get("brand"));
  try {
    const [data, jobs] = await Promise.all([getData(), listJobs(brand)]);
    return NextResponse.json({
      jobs,
      settings: (brand === "wendy" ? data.settings.wendy : data.settings.prototype) ?? {},
      fireToken: Boolean(data.integrations?.staffKeys?.includes(FIRE_TOKEN_KEY)),
      appearance: data.settings.appearance ?? {},
      businessName: data.settings.businessName ?? "",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { links?: unknown; description?: unknown; model?: unknown; brand?: unknown; instructions?: unknown };
  // On Wendy's open address every request is a Wendy request.
  const brand = req.headers.get("x-wendy") === "1" ? "wendy" : brandOf(body.brand);
  const instructions = typeof body.instructions === "string" ? body.instructions : "";
  const links = Array.isArray(body.links) ? body.links.filter((l): l is string => typeof l === "string").slice(0, 10) : [];
  const description = typeof body.description === "string" ? body.description : "";
  const model = typeof body.model === "string" ? body.model : undefined;
  try {
    const data = await getData();
    const origin = new URL(req.url).origin;
    const own = brand === "wendy" ? data.settings.wendy : data.settings.prototype;
    // Wendy has her own settings, but the builder's start link is shared with the Prototype maker.
    const { job, fire } = await createJob({ links, description, model, brand, instructions }, own, origin, data.settings.prototype);
    return NextResponse.json({ job, fire });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
