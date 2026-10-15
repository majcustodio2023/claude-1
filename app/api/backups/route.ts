import { NextResponse } from "next/server";
import { listBackups, restoreBackup } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ backups: await listBackups() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** Restores the snapshot for { day: "YYYY-MM-DD" }. */
export async function POST(req: Request) {
  const { day } = (await req.json().catch(() => ({}))) as { day?: string };
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return NextResponse.json({ error: "Pick a day" }, { status: 400 });
  try {
    return NextResponse.json({ data: await restoreBackup(day) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
