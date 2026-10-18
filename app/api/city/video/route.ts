import { NextResponse } from "next/server";
import { MAX_VIDEO_BYTES, usingDatabase, videoUploadUrl, videoViewUrl } from "@/lib/store";

// Raw videos for the video editors. POST asks for an upload address (the browser then sends
// the file straight to storage); GET ?path= opens an uploaded video.

export async function POST(req: Request) {
  if (!usingDatabase) return NextResponse.json({ error: "Uploading needs the online database. Paste a link instead." }, { status: 501 });
  const { name, type, size } = (await req.json()) as { name?: string; type?: string; size?: number };
  if (!name || !type?.startsWith("video/")) return NextResponse.json({ error: "That isn't a video file." }, { status: 400 });
  if (!size || size > MAX_VIDEO_BYTES) return NextResponse.json({ error: "Videos up to 50 MB can be uploaded. For bigger ones, paste a Drive or Dropbox link." }, { status: 400 });
  try {
    return NextResponse.json(await videoUploadUrl(name));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path") ?? "";
  if (!usingDatabase || !path) return NextResponse.json({ error: "No such video" }, { status: 404 });
  const url = await videoViewUrl(path).catch(() => null);
  if (!url) return NextResponse.json({ error: "No such video" }, { status: 404 });
  return NextResponse.redirect(url);
}
