# ofw-investor-box

- **Type:** Next.js app
- **Vercel project:** `prj_HVu0rK45KRbjSDuzvoB9o0niftbt` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_3iSM6RQPn62dMwTqdGUvfcP2JJmm`
- **Live URLs:**
- https://invest.majcustodioph.com
- https://ofw-investor-box.vercel.app
- **Source files in deployment:** 44 (0 already in this folder)

## Work on it locally
```bash
cd projects/ofw-investor-box
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs ofw-investor-box
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project ofw-investor-box --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
