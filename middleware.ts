import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

// Hosts whose root is the Boss RDR landing page (e.g. rdr.majcustodioph.com).
const LANDING_HOST = /^(rdr|bossrdr)\./i;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";

  if (LANDING_HOST.test(host)) {
    if (pathname === "/") return NextResponse.rewrite(new URL("/rdr", req.url));
    if (pathname.startsWith("/rdr") || pathname.startsWith("/api/rdr")) return NextResponse.next();
    // Everything else on the landing host goes back to the page.
    if (!pathname.startsWith("/_next") && !pathname.startsWith("/api/")) return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname === "/rdr" || pathname.startsWith("/rdr/") || pathname.startsWith("/api/rdr")) return NextResponse.next();

  if (await isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!login|share/|api/login|api/cron|api/calendar/ics/|_next|favicon.ico|icon.svg|icon-192.png|icon-512.png|apple-icon|manifest.webmanifest|rdr/).*)"],
};
