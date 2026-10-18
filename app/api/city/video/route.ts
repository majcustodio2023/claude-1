import { NextResponse } from "next/server";
import { VIDEO_PART_BYTES, usingDatabase, videoUploadUrl, videoViewUrl } from "@/lib/store";

// Raw videos for the video editors. POST asks for upload addresses (the browser then sends
// the file straight to storage, in pieces when it's big, so there's no size cap). GET ?path=
// opens an uploaded video; with &parts=N it returns the piece links for the browser to join.

export async function POST(req: Request) {
  if (!usingDatabase) return NextResponse.json({ error: "Uploading needs the online database. Paste a link instead." }, { status: 501 });
  const { name, type, size } = (await req.json()) as { name?: string; type?: string; size?: number };
  if (!name || !type?.startsWith("video/")) return NextResponse.json({ error: "That isn't a video file." }, { status: 400 });
  if (!size || size <= 0) return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  try {
    const parts = Math.ceil(size / VIDEO_PART_BYTES);
    return NextResponse.json({ ...(await videoUploadUrl(name, parts)), partBytes: VIDEO_PART_BYTES });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const path = q.get("path") ?? "";
  const parts = Math.max(1, Math.min(10000, Number(q.get("parts")) || 1));
  if (!usingDatabase || !path) return NextResponse.json({ error: "No such video" }, { status: 404 });
  const urls = await videoViewUrl(path, parts).catch(() => null);
  if (!urls) return NextResponse.json({ error: "No such video" }, { status: 404 });
  return parts > 1 ? NextResponse.json({ urls }) : NextResponse.redirect(urls[0]);
}
