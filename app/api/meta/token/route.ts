import { NextResponse } from "next/server";
import { checkMetaToken } from "@/lib/feeds-server";
import { getData, setToken, setTokenInfo } from "@/lib/store";

// Saves (or clears) a Meta access token for one ad account. The token is
// checked against Meta first and never returned to the browser.
export async function POST(req: Request) {
  const { adAccountRef, token } = (await req.json()) as { adAccountRef: string; token: string | null };
  const data = await getData();
  if (!data.adAccounts.some((a) => a.id === adAccountRef)) {
    return NextResponse.json({ error: "Save the ad account first" }, { status: 400 });
  }
  // Asks Meta what the token is and when it ends, so the app can warn before it stops working.
  const info = token ? await checkMetaToken(token.trim(), "account") : null;
  if (info && !info.valid) return NextResponse.json({ error: `Meta rejected the token: ${info.error ?? "not valid"}` }, { status: 400 });
  await setToken(adAccountRef, token);
  await setTokenInfo({ [adAccountRef]: info });
  return NextResponse.json({ ok: true, info });
}
