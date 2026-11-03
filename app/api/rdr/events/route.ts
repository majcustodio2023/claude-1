import { NextResponse } from "next/server";
import { formatEventDate, nextEvent } from "@/lib/rdr/events";

export const dynamic = "force-dynamic";

/** The next active event with Boss RDR, or null. Expired events are never returned. */
export async function GET() {
  const e = nextEvent();
  return NextResponse.json({ event: e ? { ...e, when: formatEventDate(e) } : null });
}
