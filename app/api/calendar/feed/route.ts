import { NextResponse } from "next/server";
import { getFeedToken } from "@/lib/store";

export const dynamic = "force-dynamic";

// The private address calendar apps subscribe to. POST {reset:true} makes a new one (the old stops working).
export async function POST(req: Request) {
  const { reset } = (await req.json().catch(() => ({}))) as { reset?: boolean };
  const token = await getFeedToken(Boolean(reset));
  const origin = new URL(req.url).origin;
  return NextResponse.json({ url: `${origin}/api/calendar/ics/${token}` });
}
