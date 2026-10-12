import { NextResponse } from "next/server";
import { graphGet } from "@/lib/meta";
import { getData, setToken } from "@/lib/store";

// Saves (or clears) a Meta access token for one ad account. The token is
// checked against Meta first and never returned to the browser.
export async function POST(req: Request) {
  const { adAccountRef, token } = (await req.json()) as { adAccountRef: string; token: string | null };
  const data = await getData();
  if (!data.adAccounts.some((a) => a.id === adAccountRef)) {
    return NextResponse.json({ error: "Save the ad account first" }, { status: 400 });
  }
  if (token) {
    try {
      await graphGet("me?fields=id", token.trim());
    } catch (e) {
      return NextResponse.json({ error: `Meta rejected the token: ${(e as Error).message}` }, { status: 400 });
    }
  }
  await setToken(adAccountRef, token);
  return NextResponse.json({ ok: true });
}
