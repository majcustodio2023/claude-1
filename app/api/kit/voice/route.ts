import { NextResponse } from "next/server";
import { stripActions } from "@/lib/kit";
import { personaVoice } from "@/lib/personas";
import { getData, getOpenAIKey } from "@/lib/store";

export const dynamic = "force-dynamic";

const MODEL = process.env.KIT_VOICE_MODEL ?? "gpt-4o-mini-tts";

// Kit's spoken voice: the reply read by an AI voice acted in the chosen personality.
export async function POST(req: Request) {
  const { text } = (await req.json()) as { text?: string };
  const key = await getOpenAIKey();
  if (!key) return NextResponse.json({ error: "Add an OpenAI key to give Kit a real voice." }, { status: 400 });
  const input = stripActions(text ?? "").replace(/[*_#`>]/g, "").slice(0, 3500);
  if (!input) return NextResponse.json({ error: "Nothing to say" }, { status: 400 });
  const s = (await getData()).settings;
  const { voice, acting } = personaVoice(s.kitPersona, s.kitPersonaCustom);
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, voice, input, instructions: `${acting} Sound like a real person talking, never like a narrator or a robot.`, response_format: "mp3" }),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return NextResponse.json({ error: err?.error?.message ?? `Voice error ${res.status}` }, { status: 502 });
  }
  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
