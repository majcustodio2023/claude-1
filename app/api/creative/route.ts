import { NextResponse } from "next/server";
import { directMediaUrl, guessKind } from "@/lib/creative";
import { newCreative, refreshCreatives } from "@/lib/creative-server";
import { getHiggsfieldKey, updateCreatives } from "@/lib/store";
import { submitImage, submitImageToVideo } from "@/lib/higgsfield";

export const dynamic = "force-dynamic";

// GET: the creatives list, after checking on anything Higgsfield is still making.
export async function GET() {
  try {
    return NextResponse.json({ creatives: await refreshCreatives() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

type Body =
  | { op: "link"; url: string; kind?: "image" | "video" }
  | { op: "image"; prompt: string }
  | { op: "video"; prompt: string; imageUrl: string; duration?: number }
  | { op: "delete"; id: string };

// POST: add a creative by link, start a Higgsfield job, or delete one.
export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  try {
    if (body.op === "delete") {
      return NextResponse.json({ creatives: await updateCreatives((l) => l.filter((c) => c.id !== body.id)) });
    }
    if (body.op === "link") {
      const url = directMediaUrl(body.url ?? "");
      if (!/^https:\/\//.test(url)) return NextResponse.json({ error: "Paste a public https link to the file." }, { status: 400 });
      const c = newCreative({ kind: body.kind ?? guessKind(url), source: "link", status: "ready", url });
      return NextResponse.json({ creatives: await updateCreatives((l) => [c, ...l]) });
    }

    const key = await getHiggsfieldKey();
    if (!key) return NextResponse.json({ error: "Save your Higgsfield API key first." }, { status: 400 });
    const prompt = (body.prompt ?? "").trim();
    if (!prompt) return NextResponse.json({ error: "Write a prompt first." }, { status: 400 });

    let requestId: string;
    if (body.op === "image") {
      requestId = await submitImage(key, prompt);
    } else {
      if (!/^https:\/\//.test(body.imageUrl ?? "")) return NextResponse.json({ error: "Pick an image to animate." }, { status: 400 });
      const duration = Math.min(15, Math.max(3, Math.round(body.duration ?? 5)));
      requestId = await submitImageToVideo(key, prompt, body.imageUrl, duration);
    }
    const c = newCreative({ kind: body.op, source: "higgsfield", status: "generating", prompt, requestId });
    return NextResponse.json({ creatives: await updateCreatives((l) => [c, ...l]) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
