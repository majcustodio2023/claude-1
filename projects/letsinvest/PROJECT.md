# letsinvest

- **Type:** Vite (React) app
- **Vercel project:** `prj_9MALmOKC8dUb8uEsRoQVAexeh2e6` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_CnApuTk4ZmcvkVpHFHvDMdWmpU5A`
- **Live URLs:**
- https://letsinvest-sigma.vercel.app
- **Source files in deployment:** 36 (0 already in this folder)

## Work on it locally
```bash
cd projects/letsinvest
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs letsinvest
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project letsinvest --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
