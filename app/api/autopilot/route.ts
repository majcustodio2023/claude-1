import { NextResponse } from "next/server";
import { runAutopilot } from "@/lib/meta-server";

export const dynamic = "force-dynamic";

// "Run now" button in the app (signed-in users only, via the middleware).
export async function POST() {
  try {
    return NextResponse.json({ entries: await runAutopilot() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
