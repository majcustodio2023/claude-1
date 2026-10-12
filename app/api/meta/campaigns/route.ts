import { NextResponse } from "next/server";
import { listCampaigns } from "@/lib/meta";
import { getData, getToken } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get("account") ?? "";
  const data = await getData();
  const account = data.adAccounts.find((a) => a.id === ref);
  if (!account) return NextResponse.json({ error: "Ad account not found" }, { status: 404 });
  const token = await getToken(account.id);
  if (!token) return NextResponse.json({ error: "Add an access token for this ad account first" }, { status: 400 });
  try {
    return NextResponse.json({ campaigns: await listCampaigns(account.accountId, token) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
