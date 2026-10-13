import { NextResponse } from "next/server";
import { setOpenAIKey } from "@/lib/store";

// Saves (or clears) the OpenAI key used for Kit's real voice. It's checked, encrypted, and never sent back.
export async function POST(req: Request) {
  const { key } = (await req.json()) as { key: string | null };
  if (key) {
    const res = await fetch("https://api.openai.com/v1/models/gpt-4o-mini-tts", { headers: { Authorization: `Bearer ${key.trim()}` }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "OpenAI rejected that key. Check you copied all of it." }, { status: 400 });
  }
  await setOpenAIKey(key);
  return NextResponse.json({ ok: true });
}
