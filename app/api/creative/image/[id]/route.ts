import { getData, readImage } from "@/lib/store";

export const dynamic = "force-dynamic";

// Shows a picture the app made (ChatGPT images). They sit in private storage; this route is
// behind the tracker's login like the rest of the app.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = (await getData()).creatives?.find((x) => x.id === id);
  const img = c?.storagePath ? await readImage(c.storagePath) : null;
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(img.bytes, { headers: { "Content-Type": img.type, "Cache-Control": "private, max-age=86400" } });
}
