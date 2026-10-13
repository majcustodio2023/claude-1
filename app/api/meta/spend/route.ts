import { NextResponse } from "next/server";
import { todayISO } from "@/lib/finance";
import { fetchSpend } from "@/lib/meta";
import { resolveTracked } from "@/lib/meta-server";
import { getData } from "@/lib/store";

export const dynamic = "force-dynamic";

// Spend per tracked campaign for one month (YYYY-MM), so the app can record it as ad spend.
export async function GET(req: Request) {
  const month = new URL(req.url).searchParams.get("month") ?? "";
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "Bad month" }, { status: 400 });
  const today = todayISO();
  if (month > today.slice(0, 7)) return NextResponse.json({ spend: [] });
  const [y, m] = month.split("-").map(Number);
  const lastDay = `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
  const until = lastDay < today ? lastDay : today;

  const data = await getData();
  const spend = await Promise.all(
    data.trackedCampaigns.map(async (t) => {
      try {
        const { token } = await resolveTracked(t.id);
        return { trackedId: t.id, name: t.name, amount: await fetchSpend(t.campaignId, token, `${month}-01`, until) };
      } catch (e) {
        return { trackedId: t.id, name: t.name, error: (e as Error).message };
      }
    }),
  );
  return NextResponse.json({ spend, until });
}
