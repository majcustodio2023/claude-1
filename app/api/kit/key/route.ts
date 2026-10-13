import { NextResponse } from "next/server";
import { setAnthropicKey } from "@/lib/store";

// Saves (or clears) the Claude API key Kit uses. It's checked, encrypted, and never sent back.
export async function POST(req: Request) {
  const { key } = (await req.json()) as { key: string | null };
  if (key) {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
      headers: { "x-api-key": key.trim(), "anthropic-version": "2023-06-01" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: "Claude rejected that key. Check you copied all of it." }, { status: 400 });
  }
  await setAnthropicKey(key);
  return NextResponse.json({ ok: true });
}
