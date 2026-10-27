import { NextResponse } from "next/server";
import { businessDay, claude } from "@/lib/cityJobs-server";
import { addReplies, attendees, keepMeetings, meetingBrief, meetingTitle, msgId, parseReplies } from "@/lib/meetings";
import { getAnthropicKey, getData, updateServerData } from "@/lib/store";
import type { Meeting } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// City meetings. { action: "start", kind, buildingId? } calls the team in; { action: "say", id, text, to? }
// adds your message and asks the staff to answer; { action: "end", id } closes it (the transcript stays).
// Without an API key the answer is written by Claude in the project, which picks waiting meetings up
// on a schedule (supabase tracker_meeting_queue / tracker_meeting_reply). Nothing is faked meanwhile.
export async function POST(req: Request) {
  const body = (await req.json()) as { action?: string; kind?: Meeting["kind"]; buildingId?: string; id?: string; text?: string; to?: string[] };
  try {
    if (body.action === "start") {
      const data = await getData();
      const kind = body.kind === "townhall" ? "townhall" : "building";
      const people = attendees(data, kind, body.buildingId);
      if (!people.length) throw new Error(kind === "townhall" ? "There's nobody in town to call in yet." : "Nobody works in this building yet.");
      const m: Meeting = { id: `meet-${Date.now().toString(36)}`, kind, buildingId: kind === "building" ? body.buildingId : undefined, title: meetingTitle(data, kind, body.buildingId), staffIds: people.map((p) => p.id), messages: [], status: "open", startedAt: new Date().toISOString() };
      const meetings = await updateServerData((d) => (d.meetings = keepMeetings([m, ...(d.meetings ?? [])])));
      return NextResponse.json({ meeting: m, meetings });
    }
    if (body.action === "say") {
      const text = (body.text ?? "").trim().slice(0, 6000);
      if (!text) throw new Error("Type something first.");
      const askedAt = new Date().toISOString();
      const meeting = await updateServerData((d) => {
        const m = d.meetings?.find((x) => x.id === body.id);
        if (!m) throw new Error("That meeting isn't there any more.");
        if (m.status === "ended") throw new Error("This meeting has ended. Start a new one.");
        m.messages = [...m.messages, { id: msgId(), from: "you", name: d.settings.playerName || "You", text, at: askedAt }];
        const to = (body.to ?? []).filter((id) => m.staffIds.includes(id));
        m.prompt = { ...meetingBrief(d, m, businessDay(d), to), askedAt };
        m.status = "waiting";
        return { ...m };
      });
      // With a Claude API key saved, answer straight away; otherwise the project answers it.
      const key = await getAnthropicKey();
      if (key && meeting.prompt) {
        const replies = parseReplies(await claude(key, meeting.prompt.system, meeting.prompt.user), meeting);
        if (replies.length) {
          const done = await updateServerData((d) => {
            const i = (d.meetings ?? []).findIndex((x) => x.id === meeting.id);
            if (i >= 0) d.meetings![i] = addReplies(d, d.meetings![i], replies, askedAt);
            return d.meetings![i];
          });
          return NextResponse.json({ meeting: done });
        }
      }
      return NextResponse.json({ meeting: { ...meeting, prompt: undefined }, waiting: true });
    }
    if (body.action === "end") {
      const meeting = await updateServerData((d) => {
        const m = d.meetings?.find((x) => x.id === body.id);
        if (!m) throw new Error("That meeting isn't there any more.");
        Object.assign(m, { status: "ended", endedAt: new Date().toISOString(), prompt: undefined });
        return { ...m };
      });
      return NextResponse.json({ meeting });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

/** Meetings (to see replies come in). ?id= returns just that one. Briefs stay on the server. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  const list = ((await getData()).meetings ?? []).map((m) => ({ ...m, prompt: undefined }));
  return NextResponse.json(id ? { meeting: list.find((m) => m.id === id) ?? null } : { meetings: list });
}
