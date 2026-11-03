# aacio-ad-media

- **Type:** static site / serverless functions
- **Vercel project:** `prj_2dg3o36u7RkGGtUpT3vBqNt4j08E` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_BdyjrbrvHEjec5LJf9SD5UbkVMxY`
- **Live URLs:**
- https://aacio-ad-media.vercel.app
- **Source files in deployment:** 22 (0 already in this folder)

## Work on it locally
```bash
cd projects/aacio-ad-media
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs aacio-ad-media
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project aacio-ad-media --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
