import { NextResponse } from "next/server";

export function GET(req: Request) {
  const u = new URL(req.url);
  const n = (u.searchParams.get("n") || "").trim().toUpperCase();
  const t = (u.searchParams.get("t") || "").trim();
  return NextResponse.redirect(new URL(`/order/${encodeURIComponent(n)}?t=${encodeURIComponent(t)}`, u.origin));
}
