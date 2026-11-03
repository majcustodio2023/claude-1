# Client funnels (Magica Studio)

Static pitch sites, one folder per client, three pages each: the customer-facing funnel, the ads plan, and the projections page. Everything is plain HTML with a shared stylesheet and chart engine in `shared/`.

```
funnels/
  shared/ui.css        design system (tokens overridden per client on :root)
  shared/charts.js     reveal, count-up, sticky CTA, demo forms, SVG bar/line/funnel charts
  hub/index.html       index of every client link
  laundrodream/        index.html · ads/index.html · results/index.html
  keilas/              index.html · ads/index.html · results/index.html
  vercel.json          host → page rewrites for the majcustodioph.com subdomains
```

## Hosting

One Vercel project (`magica-funnels`, root directory `funnels`, no build step). `vercel.json` rewrites `/` by hostname, so each subdomain opens its page while `/shared/*` is served from the same deployment:

| Subdomain | Page |
|---|---|
| laundrodream-funnel.majcustodioph.com | laundrodream/index.html |
| laundrodream-ads.majcustodioph.com | laundrodream/ads/index.html |
| laundrodream-results.majcustodioph.com | laundrodream/results/index.html |
| keilasbikes.majcustodioph.com | keilas/index.html |
| keilasbikes-ads.majcustodioph.com | keilas/ads/index.html |
| keilasbikes-results.majcustodioph.com | keilas/results/index.html |
| funnels.majcustodioph.com (and the .vercel.app URL) | hub/index.html |

Adding a client: copy a folder, change the `:root` tokens and copy, add three rewrites and three domains.

## Preview locally

```bash
npx serve funnels   # then open /laundrodream/, /keilas/, /hub/
```

Pages are marked `noindex` and carry a "Preview build" ribbon; testimonials and results labelled "Sample" are placeholders until the client supplies verified ones.
