# valmora

- **Type:** Vite (React) app
- **Vercel project:** `prj_OyrdU59DTJy8BbiuiAYT9Mj5ingA` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_AsMieRogbwhiipnXbX3kgsadtFAW`
- **Live URLs:**
- https://valmora-ten.vercel.app
- **Source files in deployment:** 233 (0 already in this folder)

## Work on it locally
```bash
cd projects/valmora
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs valmora
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project valmora --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
