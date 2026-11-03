# maj-insurance-funnel

- **Type:** Express server
- **Vercel project:** `prj_OO9b3hvlaDAaFU9Uq6Tqzz8Y3huz` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_BuRPRL1sYZuQK31pHmHVNZZwimmJ`
- **Live URLs:**
- https://insurance.majcustodioph.com
- https://maj-insurance-funnel.vercel.app
- **Source files in deployment:** 3 (0 already in this folder)

## Work on it locally
```bash
cd projects/maj-insurance-funnel
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs maj-insurance-funnel
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project maj-insurance-funnel --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
