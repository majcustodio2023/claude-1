import { NextResponse } from "next/server";
import { setHiggsfieldKey } from "@/lib/store";

// Saves (or clears) the Higgsfield API key. It's encrypted and never sent back.
export async function POST(req: Request) {
  const { key } = (await req.json()) as { key: string | null };
  if (key && !/^[^:\s]+:[^:\s]+$/.test(key.trim())) {
    return NextResponse.json({ error: "The key should look like KEY_ID:KEY_SECRET (both parts, with the colon)." }, { status: 400 });
  }
  await setHiggsfieldKey(key);
  return NextResponse.json({ ok: true });
}
