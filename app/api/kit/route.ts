import { NextResponse } from "next/server";
import { configureLocale } from "@/lib/finance";
import { KIT_TOOLS, kitContext, kitSystem, toAction, type KitAction } from "@/lib/kit";
import { getAnthropicKey, getData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.KIT_MODEL ?? "claude-sonnet-5-5";

type Block = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
type Msg = { role: "user" | "assistant"; content: string | unknown[] };

// Chat with Kit. The browser sends the conversation; the server adds a fresh
// status report and returns Kit's reply plus any actions for the app to apply.
export async function POST(req: Request) {
  const { messages, today } = (await req.json()) as { messages: { role: "user" | "assistant"; text: string }[]; today: string };
  const key = await getAnthropicKey();
  if (!key) return NextResponse.json({ error: "Kit needs a Claude API key first." }, { status: 400 });

  const data = await getData();
  configureLocale(data.settings);
  const system = `${kitSystem(data.settings)}\n\nStatus report (live from the tracker):\n${kitContext(data, today)}`;
  const convo: Msg[] = messages.slice(-20).map((m) => ({ role: m.role, content: m.text }));
  while (convo.length && convo[0].role !== "user") convo.shift();

  const actions: KitAction[] = [];
  let reply = "";
  try {
    for (let round = 0; round < 3; round++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 1024, system, tools: KIT_TOOLS, messages: convo }),
        cache: "no-store",
      });
      const json = (await res.json()) as { content?: Block[]; stop_reason?: string; error?: { message: string } };
      if (!res.ok) throw new Error(json.error?.message ?? `Claude API error ${res.status}`);
      const blocks = json.content ?? [];
      reply += blocks.filter((b): b is Extract<Block, { type: "text" }> => b.type === "text").map((b) => b.text).join("\n");
      const uses = blocks.filter((b): b is Extract<Block, { type: "tool_use" }> => b.type === "tool_use");
      if (json.stop_reason !== "tool_use" || !uses.length) break;
      convo.push({ role: "assistant", content: blocks });
      convo.push({
        role: "user",
        content: uses.map((u) => {
          const a = toAction(u.name, u.input);
          if (a) actions.push(a);
          return { type: "tool_result", tool_use_id: u.id, content: a ? "Done." : "Invalid input.", ...(a ? {} : { is_error: true }) };
        }),
      });
    }
    return NextResponse.json({ reply: reply.trim(), actions });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
