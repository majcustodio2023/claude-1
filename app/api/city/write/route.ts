import { NextResponse } from "next/server";
import { WRITER_PROMPTS } from "@/lib/cityPrompts";
import { ROLES } from "@/lib/city";
import { businessDay, finishOrQueue } from "@/lib/cityJobs-server";
import { getData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// A city writer (ad script, ad copy, image copy) writes from a landing page, following
// its own instructions and samples. With Kit's API key it writes straight away; without
// one the job is queued for Claude in the project, which writes it within the hour.
export async function POST(req: Request) {
  const { staffId, input, target, more } = (await req.json()) as { staffId: string; input: string; target?: string; more?: string };
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
    const label = ROLES[staff.role]?.action ?? "Writing";
    const day = businessDay(data);
    const r = await finishOrQueue({ staffId: staff.id, buildingId: staff.buildingId, jobId: "write", label, input: page.slice(0, 300), day }, system, parts.join("\n\n"));
    return NextResponse.json({ text: r.entry.text, queued: r.queued, work: r.work });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
