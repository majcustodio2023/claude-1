# enrollment-engine

- **Type:** Next.js app
- **Vercel project:** `prj_roEDk5BaWR8gCJiILuEKmdg9B7Dj` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_WXC1ChDXhUTNc9nX74JUD78nFcZP`
- **Live URLs:**
- https://enroll.majcustodioph.com
- https://enrollment-engine-kappa.vercel.app
- **Source files in deployment:** 46 (0 already in this folder)

## Work on it locally
```bash
cd projects/enrollment-engine
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs enrollment-engine
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project enrollment-engine --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
