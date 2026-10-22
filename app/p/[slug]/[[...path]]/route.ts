import { publicRpc } from "@/lib/store";

// Serves a generated prototype: its pages, its stylesheet and the pictures pulled from the client's socials.
// Pages run sandboxed (their own origin), so nothing on them can reach the tracker or its sign-in.

export const dynamic = "force-dynamic";

const SANDBOX = "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-top-navigation-by-user-activation";

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Adds the base address, the kit and the motion switch to a page the builder wrote. */
function withKit(html: string, slug: string, name: string | null, badge: string | null): string {
  const proto = JSON.stringify({ slug, name: name ?? undefined, badge: badge ?? undefined }).replace(/</g, "\\u003c");
  const head = `<base href="/p/${slug}/"><script>document.documentElement.classList.add("pk-js");window.PROTO=${proto};</script><link rel="stylesheet" href="/proto-kit.css">`;
  const tail = `<script src="/proto-kit.js" defer></script>`;
  let out = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + head) : head + html;
  out = /<\/body>/i.test(out) ? out.replace(/<\/body>(?![\s\S]*<\/body>)/i, tail + "</body>") : out + tail;
  return out;
}

function waitingPage(slug: string, status: string | undefined, pages: string[]): string {
  const msg =
    status === "failed"
      ? "This prototype couldn't be built. Open the Prototype maker to try again."
      : status
        ? "This website is being designed right now. This page refreshes on its own as soon as the home page is ready."
        : "There's no prototype at this address.";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Building your website…</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 30% 20%,#2b2140,#0d0b14 70%);color:#f4efe6;font:18px/1.6 system-ui,sans-serif;text-align:center;padding:24px}
.o{width:72px;height:72px;margin:0 auto 24px;border-radius:50%;border:4px solid #f4efe633;border-top-color:#f6c35b;animation:r 1s linear infinite}@keyframes r{to{transform:rotate(360deg)}}
h1{font-size:28px;margin:0 0 8px}p{max-width:30rem;margin:0 auto;opacity:.8}small{display:block;margin-top:18px;opacity:.6}</style>
${status && status !== "failed" ? `<meta http-equiv="refresh" content="15">` : ""}</head><body><main>${status && status !== "failed" ? '<div class="o"></div>' : ""}<h1>${status && status !== "failed" ? "Building your website…" : "Not here"}</h1><p>${escapeHtml(msg)}</p>${pages.length ? `<small>${pages.length} file${pages.length === 1 ? "" : "s"} saved so far</small>` : ""}</main></body></html>`;
}

const HTML_HEADERS = { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": SANDBOX, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string; path?: string[] }> }) {
  const { slug, path = [] } = await ctx.params;
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return new Response("Not found", { status: 404 });

  if (path[0] === "img" && path.length === 2) {
    const asset = (await publicRpc("prototype_asset", { p_slug: slug, p_name: path[1] })) as { type: string; data: string } | null;
    if (!asset) return new Response("Not found", { status: 404 });
    return new Response(Buffer.from(asset.data, "base64"), { headers: { "Content-Type": asset.type, "Cache-Control": "public, max-age=31536000, immutable" } });
  }

  const name = (path.join("/") || "index").replace(/\.html?$/i, "");
  if (path.length > 1 || !/^[a-z0-9][a-z0-9-]*(\.(css|js))?$/.test(name)) return new Response("Not found", { status: 404 });
  const page = (await publicRpc("prototype_page", { p_slug: slug, p_path: name })) as { body: string; name: string | null; badge: string | null; status: string } | null;

  if (page && name.endsWith(".css")) return new Response(page.body, { headers: { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "no-store" } });
  if (page && name.endsWith(".js")) return new Response(page.body, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" } });
  if (page) return new Response(withKit(page.body, slug, page.name, page.badge), { headers: HTML_HEADERS });

  const status = (await publicRpc("prototype_status", { p_slug: slug })) as { status: string; pages: string[] } | null;
  return new Response(waitingPage(slug, status?.status, status?.pages ?? []), { status: status ? 200 : 404, headers: HTML_HEADERS });
}
