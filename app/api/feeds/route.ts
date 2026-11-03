import { NextResponse } from "next/server";
import { appleApps, checkMetaToken, recheckTokens, syncReports } from "@/lib/feeds-server";
import { getInboxToken, setAppleKey, setBusinessToken } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Data sources that don't expire. { action: "metaBusiness", token } saves one Meta token for every
// ad account and page (checked with Meta first; a System User token never expires). { action: "apple",
// issuerId, keyId, privateKey, vendor } saves an App Store Connect API key (tested first).
// { action: "inbox" } gives the funnel inbox address. { action: "sync" } pulls every source now.
export async function POST(req: Request) {
  const b = (await req.json()) as { action?: string; token?: string | null; issuerId?: string; keyId?: string; privateKey?: string; vendor?: string; clear?: boolean; reset?: boolean };
  try {
    if (b.action === "metaBusiness") {
      if (!b.token) {
        await setBusinessToken(null);
        return NextResponse.json({ ok: true });
      }
      const info = await checkMetaToken(b.token.trim(), "business");
      if (!info.valid) throw new Error(`Meta rejected the token: ${info.error ?? "not valid"}`);
      await setBusinessToken(b.token, info);
      return NextResponse.json({ ok: true, info });
    }
    if (b.action === "apple") {
      if (b.clear) {
        await setAppleKey(null);
        return NextResponse.json({ ok: true });
      }
      if (!b.issuerId?.trim() || !b.keyId?.trim() || !b.privateKey?.trim()) throw new Error("Fill in the issuer ID, key ID and the private key.");
      const key = { issuerId: b.issuerId.trim(), keyId: b.keyId.trim(), privateKey: b.privateKey.trim(), vendor: b.vendor?.trim() || undefined };
      let apps: string[];
      try {
        apps = await appleApps(key);
      } catch (e) {
        throw new Error(`App Store Connect said: ${(e as Error).message}`);
      }
      await setAppleKey(key);
      return NextResponse.json({ ok: true, apps });
    }
    if (b.action === "inbox") {
      const token = await getInboxToken(Boolean(b.reset));
      return NextResponse.json({ url: `${new URL(req.url).origin}/api/inbox/${token}` });
    }
    if (b.action === "recheck") return NextResponse.json({ tokens: await recheckTokens() });
    if (b.action === "sync") return NextResponse.json(await syncReports());
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
