# Client funnels (Magica Studio)

Static pitch sites, one folder per client, three pages each: the customer-facing funnel, the ads plan, and the projections page. Plain HTML with a shared stylesheet and chart engine in `shared/`, served by this Next.js app from `public/funnels/`.

```
public/funnels/
  shared/ui.css        design system (tokens overridden per client on :root)
  shared/charts.js     reveal, count-up, sticky CTA, demo forms, SVG bar/line/funnel charts
  hub/index.html       index of every client link
  laundrodream/        index.html · ads/index.html · results/index.html
  keilas/              index.html · ads/index.html · results/index.html
```

## Hosting

`middleware.ts` maps each subdomain to its page when the request is for `/`, and lets every `/funnels/*` path through without a login. The subdomains are attached to the `claude-1` Vercel project:

| Subdomain | Page |
|---|---|
| laundrodream-funnel.majcustodioph.com | laundrodream/index.html |
| laundrodream-ads.majcustodioph.com | laundrodream/ads/index.html |
| laundrodream-results.majcustodioph.com | laundrodream/results/index.html |
| keilasbikes.majcustodioph.com | keilas/index.html |
| keilasbikes-ads.majcustodioph.com | keilas/ads/index.html |
| keilasbikes-results.majcustodioph.com | keilas/results/index.html |
| funnels.majcustodioph.com | hub/index.html |

The domains were added pointing at the `claude/jolly-ritchie-19ewzs` branch, so they serve that branch's preview deployment. After the branch merges, edit each domain in Vercel (Project → Settings → Domains) and clear the branch so it follows production.

Every page is also reachable by path on any of the app's domains, e.g. `/funnels/laundrodream/` and `/funnels/hub/`.

Adding a client: copy a folder, change the `:root` tokens and copy, add a host entry in `middleware.ts`, and add the domain to the project.

Pages carry a "Preview build" ribbon and `noindex` meta; testimonials and results labelled "Sample" are placeholders until the client supplies verified ones.
