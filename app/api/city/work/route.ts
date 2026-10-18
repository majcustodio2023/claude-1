import { NextResponse } from "next/server";
import { doJob, postToDiscord } from "@/lib/cityJobs-server";
import { updateStaffWork } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// A city staff member does a job: { staffId, jobId?, input? }, or { staffId, auto: true } for
// whatever is due today (skipped if they've already worked today). { workId, post: "discord" }
// posts finished work to their Discord channel.
export async function POST(req: Request) {
  const body = (await req.json()) as { staffId?: string; jobId?: string; input?: string; auto?: boolean; workId?: string; post?: string };
  try {
    if (body.workId && body.post === "discord") return NextResponse.json({ work: await postToDiscord(body.workId) });
    if (!body.staffId) return NextResponse.json({ error: "Who should do it?" }, { status: 400 });
    return NextResponse.json(await doJob(body.staffId, body.jobId, body.input, Boolean(body.auto)));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Which one?" }, { status: 400 });
  return NextResponse.json({ work: await updateStaffWork((list) => list.filter((w) => w.id !== id)) });
}
