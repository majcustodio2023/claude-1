import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

/* Client pitch sites in public/funnels/, each served from its own subdomain.
   The host decides which page "/" opens; every other /funnels/* path is public. */
const FUNNEL_HOSTS: Record<string, string> = {
  "laundrodream-funnel.majcustodioph.com": "/funnels/laundrodream/index.html",
  "laundrodream-ads.majcustodioph.com": "/funnels/laundrodream/ads/index.html",
  "laundrodream-results.majcustodioph.com": "/funnels/laundrodream/results/index.html",
  "keilasbikes.majcustodioph.com": "/funnels/keilas/index.html",
  "keilasbikes-ads.majcustodioph.com": "/funnels/keilas/ads/index.html",
  "keilasbikes-results.majcustodioph.com": "/funnels/keilas/results/index.html",
  "funnels.majcustodioph.com": "/funnels/hub/index.html",
};

/** The Prototype maker's own subdomain (prototypemaker.<domain> or prototype.<domain>) opens straight on it. */
const isMakerHost = (host: string | null) => /^(prototypemaker|prototype)\./i.test(host ?? "");

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const { pathname } = req.nextUrl;
  const funnelPage = FUNNEL_HOSTS[host];
  if (funnelPage && pathname === "/") return NextResponse.rewrite(new URL(funnelPage, req.url));
  if (pathname.startsWith("/funnels/")) {
    if (pathname.endsWith("/")) return NextResponse.rewrite(new URL(`${pathname}index.html`, req.url));
    if (!pathname.slice(pathname.lastIndexOf("/")).includes(".")) return NextResponse.rewrite(new URL(`${pathname}/index.html`, req.url));
    return NextResponse.next();
  }

  if (await isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    if (pathname === "/" && isMakerHost(req.headers.get("host"))) {
      return NextResponse.rewrite(new URL("/prototype", req.url));
    }
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!login|share/|p/|proto-kit\\.|api/login|api/cron|api/inbox/|api/calendar/ics/|_next|favicon.ico|icon.svg|icon-192.png|icon-512.png|apple-icon|manifest.webmanifest).*)"],
};
