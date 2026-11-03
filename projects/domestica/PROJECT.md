# domestica

- **Type:** Next.js app
- **Vercel project:** `prj_1sZn86raveD5qzvt8XAhQBOZ0MXJ` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_8dsXN6tGawUf3khsUYfXnLp6hTt5`
- **Live URLs:**
- https://domestica-one.vercel.app
- https://domestica.majcustodioph.com
- **Source files in deployment:** 92 (0 already in this folder)

## Work on it locally
```bash
cd projects/domestica
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs domestica
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project domestica --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
