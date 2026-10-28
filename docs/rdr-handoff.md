# Boss RDR landing page: local handoff

Paste the brief below into Claude Code on your machine, started inside your clone of
`majcustodio2023/claude-1`. First:

```bash
git fetch origin
git checkout claude/peaceful-clarke-k1zp68
npm install
npm run dev          # http://localhost:3000/rdr
```

---

## Brief for the local session

You are continuing work started in a cloud session that could not reach rdrbsi.com, bossrdr.com,
Facebook or YouTube, and whose Vercel connector had no project access. You are on the user's machine
now, so both limits are gone. Work on branch `claude/peaceful-clarke-k1zp68`.

### What exists

The Boss RDR landing page lives inside the tracker app at `/rdr`:

- `app/rdr/page.tsx`, `app/rdr/layout.tsx`, `app/rdr/rdr3.css` — the brand stylesheet: midnight navy,
  white serif display (Cormorant), Inter body, silver, gold accent, letter-cut platform cards that echo
  the RDR Facebook cover.
- `components/rdr/` — `v3.tsx` (nav, platform cards + offer sheet, rail, marks, share bar),
  `ApplyModal.tsx`, `Calculator.tsx`, `LiteYouTube.tsx`, `NumberTicker.tsx`, `ui.tsx`.
- `lib/rdr/` — `content.ts` (ALL copy, verbatim; never change wording), `media.ts` (Unsplash atmosphere
  photos + YouTube thumbnail helper), `logos.ts` (press/client mark resolution), `assets.ts` (slots for
  supplied files), `events.ts`, `validate.ts`, `applications.ts`.
- `app/api/rdr/apply/route.ts`, `app/api/rdr/events/route.ts`.
- `middleware.ts` — hosts starting with `rdr.` or `bossrdr.` serve the page at `/`; `/rdr` and
  `/api/rdr` are public.
- `supabase/schema.sql` (table `rdr_applications`), `.env.example` (RDR_* keys), `public/rdr/README.md`.
- `tests/rdr.test.ts`.

### Step 1 — real brand assets (now reachable)

1. Open https://rdrbsi.com and https://bossrdr.com. Download the RDR crest (the circular emblem with
   "RDR / BUSINESS SOLUTIONS"), the sub-brand wordmarks (RDR Talks, RDR Vlog, RDR Films, RDR Stories,
   N1M / Negosyo Isang Minuto, GCI), and read the site's CSS for the exact brand colours and fonts.
   Match the tokens at the top of `app/rdr/rdr3.css` to them.
2. From https://www.facebook.com/RDRBusinesssolutionsinc/ and https://www.youtube.com/@BossRDRofficial
   collect: the cover image, a strong portrait of Boss RDR for the hero, and real episode IDs for RDR
   Talks with CMV and Cinema Skin Effects (`videos.cmv` and `videos.cinemaSkin` in `lib/rdr/content.ts`
   are empty; Pablings is `cnptvqzho9c`), plus client episodes (Brilliant Skin, Jhaena Jewels, Aircon
   Boss, Salveowell, Cygnal Rewards, Wendy Antonio) for a testimonials rail.
3. Client logos for the ten brands in `brands` and the outlets in `media` (both in `lib/rdr/content.ts`).
   Save files under `public/rdr/logos/` and map them in `lib/rdr/assets.ts` (`logo`, `brandLogos`,
   `mediaLogos`, `heroPhoto`). Replace the Unsplash photos in `lib/rdr/media.ts` with RDR's own where found.
4. Screenshot at 1440 and 390 and fix anything off. Keep it sparse: one headline, one picture, one line,
   one action per section. Do not change the copy.

### Step 2 — extract into its own project for the subaccount

Create a standalone Next.js 15 app (App Router, TypeScript) in a new repo for the RDR subaccount and
move over: `app/rdr/*` as the root `/` page, `components/rdr/*`, `lib/rdr/*`, `app/api/rdr/*` (as
`/api/apply` and `/api/events`), `public/rdr/*`, the `rdr_applications` schema, the RDR env keys and
`tests/rdr.test.ts`. Drop the host-rewrite middleware (the page is the root there). Install `motion`,
`@fontsource-variable/cormorant`, `@fontsource-variable/inter`. `npm run build` and the tests must pass.

### Step 3 — deploy and domain

Log in to Vercel as the subaccount (`npx vercel login`), create the project from the new repo, set
`SUPABASE_URL` / `SUPABASE_ANON_KEY` (or leave unset to store applications in the local JSON file),
`RDR_APPLY_WEBHOOK`, `RESEND_API_KEY`, `RDR_NOTIFY_EMAIL` as needed, deploy, then attach the subdomain.
`rdr.majcustodioph.com` is already used by another project in the Aacio team, so use
`bossrdr.majcustodioph.com`. DNS for majcustodioph.com is a Vercel wildcard in team Aacio; if the
subaccount is a different Vercel team, add a CNAME `bossrdr` → `cname.vercel-dns.com` in the Aacio DNS
zone and verify the domain with the TXT record Vercel gives you.

### Done means

The standalone repo builds and tests green, it is deployed under the subaccount,
`bossrdr.majcustodioph.com` serves it with the real RDR crest, client logos and episode videos, and
PR majcustodio2023/claude-1#54 is merged or closed with a note pointing to the new repo.
