# clinic-front-office

- **Type:** Next.js app
- **Vercel project:** `prj_2GamrbR07giVkBaRS1bVCjvSgMGD` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_sLdpU4jyiurLfEV5HqVpC6Sdiwp4`
- **Live URLs:**
- https://clinic-front-office.vercel.app
- **Source files in deployment:** 51 (0 already in this folder)

## Work on it locally
```bash
cd projects/clinic-front-office
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs clinic-front-office
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project clinic-front-office --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
