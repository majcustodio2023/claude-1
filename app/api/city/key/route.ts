import { NextResponse } from "next/server";
import { setStaffSecret } from "@/lib/store";

// Saves (or clears) a key or password a city staff member needs, e.g. a Discord bot token.
// It's encrypted and never sent back; the app only learns that it's saved.
export async function POST(req: Request) {
  const { key, value } = (await req.json()) as { key?: string; value?: string | null };
  if (!key || !/^[\w-]+:[\w-]+$/.test(key)) return NextResponse.json({ error: "Unknown staff key" }, { status: 400 });
  if (value != null && (typeof value !== "string" || value.length > 4000)) return NextResponse.json({ error: "That doesn't look right" }, { status: 400 });
  return NextResponse.json({ staffKeys: await setStaffSecret(key, value?.trim() || null) });
}
