import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

/** The Prototype maker's own subdomain (prototypemaker.<domain> or prototype.<domain>) opens straight on it. */
const isMakerHost = (host: string | null) => /^(prototypemaker|prototype)\./i.test(host ?? "");

export async function middleware(req: NextRequest) {
  if (await isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    if (req.nextUrl.pathname === "/" && isMakerHost(req.headers.get("host"))) {
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
  matcher: ["/((?!login|share/|p/|proto-kit\\.|api/login|api/cron|api/inbox/|api/calendar/ics/|_next|favicon.ico|icon.svg|icon-192.png|icon-512.png|apple-icon|manifest.webmanifest).*)"],
};
