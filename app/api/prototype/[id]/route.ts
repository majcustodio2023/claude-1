import { NextResponse } from "next/server";
import { getData, keyedRpc } from "@/lib/store";
import { fireBuilder } from "@/lib/prototype-server";

// Try again (back in the queue, and wake the builder) or remove a prototype (its link stops working).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { action } = (await req.json().catch(() => ({}))) as { action?: string };
  try {
    if (action === "retry") {
      await keyedRpc("prototype_requeue", { p_id: id });
      const fire = await fireBuilder((await getData()).settings.prototype);
      return NextResponse.json({ ok: true, fire });
    }
    if (action === "remove") {
      await keyedRpc("prototype_remove", { p_id: id });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
