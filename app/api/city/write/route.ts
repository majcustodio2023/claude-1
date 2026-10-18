import { NextResponse } from "next/server";
import { WRITER_PROMPTS } from "@/lib/cityPrompts";
import { getAnthropicKey, getData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MODEL = process.env.KIT_MODEL ?? "claude-sonnet-5-5";

// A city writer (ad script, ad copy, image copy) writes from a landing page, following
// its own instructions and samples. Uses the same Claude key as Kit.
export async function POST(req: Request) {
  const { staffId, input, target, more } = (await req.json()) as { staffId: string; input: string; target?: string; more?: string };
  const key = await getAnthropicKey();
  if (!key) return NextResponse.json({ error: "Writers use the same Claude key as Kit. Add it in Kit's chat on HQ first." }, { status: 400 });
  const data = await getData();
  const staff = data.city?.staff.find((s) => s.id === staffId);
  if (!staff || !WRITER_PROMPTS[staff.role]) return NextResponse.json({ error: "That writer isn't in the city any more." }, { status: 404 });
  const page = (input ?? "").trim();
  if (page.length < 40) return NextResponse.json({ error: "Paste the landing page or sales page copy first." }, { status: 400 });

  const instructions = staff.instructions?.trim() || WRITER_PROMPTS[staff.role]!;
  const samples = (staff.samples ?? []).map((s, i) => `Sample ${i + 1}:\n${s.text}`).join("\n\n");
  const system = [
    instructions,
    samples && `Here are samples to study and match:\n\n${samples}`,
    "Reply with the finished writing only, ready to copy. No preamble about what you're about to do.",
  ]
    .filter(Boolean)
    .join("\n\n");
  const parts = [
    `Landing page / sales page copy:\n"""\n${page.slice(0, 40000)}\n"""`,
    target?.trim()
      ? `Target market: ${target.trim()}`
      : staff.role === "imageCopy"
        ? "No target market was given. First suggest the best target market in one or two lines, then write for it."
        : "",
    more?.trim() ? `Extra direction: ${more.trim()}` : "",
  ].filter(Boolean);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 4096, system, messages: [{ role: "user", content: parts.join("\n\n") }] }),
      cache: "no-store",
    });
    const json = (await res.json()) as { content?: { type: string; text?: string }[]; error?: { message: string } };
    if (!res.ok) throw new Error(json.error?.message ?? `Claude API error ${res.status}`);
    const text = (json.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
