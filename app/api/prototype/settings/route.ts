import { NextResponse } from "next/server";
import { getData, setPrototypeSettings, setStaffSecret } from "@/lib/store";
import { FIRE_TOKEN_KEY, fireBuilder } from "@/lib/prototype-server";
import { PROTOTYPE_MODELS } from "@/lib/prototype";
import type { PrototypeSettings } from "@/lib/types";

// Saves the Prototype maker's settings. The builder's token is encrypted and never sent back.
export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as PrototypeSettings & { fireToken?: string | null };
  const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) || undefined : undefined);
  const fireUrl = clean(body.fireUrl, 300);
  if (fireUrl && !/^https:\/\/api\.anthropic\.com\/v1\/claude_code\/routines\/trig_\w+\/fire$/.test(fireUrl)) {
    return NextResponse.json({ error: "The start address should look like https://api.anthropic.com/v1/claude_code/routines/trig_…/fire" }, { status: 400 });
  }
  const url = clean(body.url, 300);
  if (url && !/^(https:\/\/|\/)/.test(url)) return NextResponse.json({ error: "The button link should start with https://" }, { status: 400 });
  const settings: PrototypeSettings = {
    url,
    defaultModel: PROTOTYPE_MODELS.some((m) => m.id === body.defaultModel) ? body.defaultModel : undefined,
    fireUrl,
    badge: clean(body.badge, 80),
    extra: clean(body.extra, 3000),
  };
  try {
    await setPrototypeSettings(settings);
    let keys: string[] | undefined;
    if (body.fireToken !== undefined) keys = await setStaffSecret(FIRE_TOKEN_KEY, body.fireToken?.trim() || null);
    return NextResponse.json({ settings, fireToken: keys ? keys.includes(FIRE_TOKEN_KEY) : undefined });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// Test the builder link: fires the scheduled task once (it finds nothing new and stops).
export async function POST() {
  const why = await fireBuilder((await getData()).settings.prototype);
  return NextResponse.json(why ? { ok: false, error: why } : { ok: true });
}
