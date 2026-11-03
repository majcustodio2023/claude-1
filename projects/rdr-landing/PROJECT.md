# rdr-landing

- **Type:** static site / serverless functions
- **Vercel project:** `prj_4yaOMvpw7x5mrhZqLmcVfNXWCPJE` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_7oNW67dmjmdpGh7Z6PXyaDVBR71S`
- **Live URLs:**
- https://rdr-landing.vercel.app
- https://rdrlanding.majcustodioph.com
- **Source files in deployment:** 50 (0 already in this folder)

## Work on it locally
```bash
cd projects/rdr-landing
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs rdr-landing
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project rdr-landing --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
