# rdr-pursuit

- **Type:** Next.js app
- **Vercel project:** `prj_sNAbGVh1CemmbvkNgdDsLkse5Grn` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_8xBLKb3g1sFYdnMLMPqVAzzmhQaT`
- **Live URLs:**
- https://rdr-pursuit.vercel.app
- https://pursuit.majcustodioph.com
- **Source files in deployment:** 140 (0 already in this folder)

## Work on it locally
```bash
cd projects/rdr-pursuit
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs rdr-pursuit
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project rdr-pursuit --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
