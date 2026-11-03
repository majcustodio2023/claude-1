import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

/** The Prototype maker's own subdomain (prototypemaker.<domain> or prototype.<domain>) opens straight on it. */
const isMakerHost = (host: string | null) => /^(prototypemaker|prototype)\./i.test(host ?? "");
/** Wendy's own addresses (wendy.<domain>, or her own domain such as wendyapp.io). Maj asked (2026-11-03) for Wendy to
 *  open with no password, so on these hosts only Wendy and her own API calls are served, always limited to Wendy's jobs
 *  (the routes read the x-wendy header this sets); the rest of the tracker stays out of reach. */
const isWendyHost = (host: string | null) => /^(wendy\.|(www\.)?[a-z0-9-]*wendy[a-z0-9-]*\.[a-z.]+(:\d+)?$)/i.test(host ?? "");

const WENDY_API = /^\/api\/prototype(\/settings|\/[\w-]+)?$/;

function wendy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const headers = new Headers(req.headers);
  headers.set("x-wendy", "1");
  if (path === "/" || path === "/login" || path === "/wendy/login") return NextResponse.rewrite(new URL("/wendy", req.url), { request: { headers } });
  if (path === "/wendy" || path === "/wendy-icon.svg" || WENDY_API.test(path)) return NextResponse.next({ request: { headers } });
  if (path.startsWith("/api/")) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.redirect(new URL("/", req.url));
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host");
  if (isWendyHost(host)) return wendy(req);
  // Only the middleware may say a request came through Wendy's address.
  if (req.headers.has("x-wendy")) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  // The sign-in page is open to everyone.
  if (req.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }
  if (await isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
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
