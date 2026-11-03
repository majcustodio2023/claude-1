# rdr-nexus

- **Type:** static site / serverless functions
- **Vercel project:** `prj_pgkAQXpqm4w9yXdjrhfO8xVNaktg` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_DK87g5FxdCvWpXZYPAxLjkVqinii`
- **Live URLs:**
- https://rdr-nexus.vercel.app
- https://nexus.majcustodioph.com
- **Source files in deployment:** 9 (0 already in this folder)

## Work on it locally
```bash
cd projects/rdr-nexus
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs rdr-nexus
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project rdr-nexus --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
