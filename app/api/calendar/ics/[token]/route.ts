import { missionsFeed } from "@/lib/icsWrite";
import { dataForFeed } from "@/lib/store";

export const dynamic = "force-dynamic";

// Missions as an .ics feed for Google Calendar and other calendar apps. No login: the secret token is the key.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await dataForFeed(token.replace(/\.ics$/, ""));
  if (!data) return new Response("Not found", { status: 404 });
  const tz = data.settings.timeZone || "UTC";
  return new Response(missionsFeed(data, tz), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" },
  });
}
