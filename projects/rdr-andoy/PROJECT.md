# rdr-andoy

- **Type:** static site / serverless functions
- **Vercel project:** `prj_oYBlprUuN85Y0GYiZgw92Dch1zq1` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_ACvBzVptLHvamtbMAXSdwHbVAZY6`
- **Live URLs:**
- https://rdr-andoy.vercel.app
- https://andoy.majcustodioph.com
- **Source files in deployment:** 38 (0 already in this folder)

## Work on it locally
```bash
cd projects/rdr-andoy
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs rdr-andoy
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project rdr-andoy --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
