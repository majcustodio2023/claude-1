import { NextResponse } from "next/server";
import { getData, saveData, usingDatabase } from "@/lib/store";
import type { TrackerData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ data: await getData(), persistent: usingDatabase || process.env.NODE_ENV !== "production" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = (await req.json()) as { data?: TrackerData };
  if (!body.data || typeof body.data !== "object" || !Array.isArray(body.data.streams)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  try {
    return NextResponse.json({ data: await saveData(body.data) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
