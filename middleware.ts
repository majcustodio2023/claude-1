import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

/** The Prototype maker's own subdomain (prototypemaker.<domain> or prototype.<domain>) opens straight on it. */
const isMakerHost = (host: string | null) => /^(prototypemaker|prototype)\./i.test(host ?? "");
/** Wendy's own addresses (wendy.<domain>, or her own domain such as usewendy.com) open on Wendy, with her own sign-in page. */
const isWendyHost = (host: string | null) => /^(wendy\.|(www\.)?[a-z0-9-]*wendy[a-z0-9-]*\.[a-z.]+(:\d+)?$)/i.test(host ?? "");

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host");
  // The sign-in page is open to everyone; on Wendy's address it's Wendy's own.
  if (req.nextUrl.pathname === "/login") {
    return isWendyHost(host) ? NextResponse.rewrite(new URL("/wendy/login", req.url)) : NextResponse.next();
  }
  if (await isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    if (req.nextUrl.pathname === "/" && isWendyHost(host)) return NextResponse.rewrite(new URL("/wendy", req.url));
    if (req.nextUrl.pathname === "/" && isMakerHost(host)) {
      return NextResponse.rewrite(new URL("/prototype", req.url));
    }
    return NextResponse.next();
  }
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!wendy/login|share/|p/|proto-kit\\.|api/login|api/cron|api/inbox/|api/calendar/ics/|_next|favicon.ico|icon.svg|icon-192.png|icon-512.png|apple-icon|manifest.webmanifest).*)"],
};
