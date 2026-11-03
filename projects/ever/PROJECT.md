# ever

- **Type:** static site / serverless functions
- **Vercel project:** `prj_QvP1x64yik68A9CTy7ReTSHh7hOT` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_9neR9GT8a778bvR5L3D2XpYgCt1s`
- **Live URLs:**
- https://ever-nine.vercel.app
- https://ever.majcustodioph.com
- **Source files in deployment:** 10 (0 already in this folder)

## Work on it locally
```bash
cd projects/ever
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs ever
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project ever --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
