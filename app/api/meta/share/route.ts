import { NextResponse } from "next/server";
import { setShareToken } from "@/lib/store";

export const dynamic = "force-dynamic";

// Turns a campaign's read-only share link on or off. Signed-in only (see middleware).
export async function POST(req: Request) {
  const { tracked, on } = (await req.json()) as { tracked?: string; on?: boolean };
  try {
    const token = await setShareToken(tracked ?? "", on !== false);
    return NextResponse.json({ token });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
