# dhs-rise

- **Type:** static site / serverless functions
- **Vercel project:** `prj_ioykLPtgRmaC3hwckeJVxkv96zXc` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_DMQ17QZv9gErcBu1WPoFDxzSRmfx`
- **Live URLs:**
- https://dhs-rise.vercel.app
- https://dhs.majcustodioph.com
- **Source files in deployment:** 45 (0 already in this folder)

## Work on it locally
```bash
cd projects/dhs-rise
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs dhs-rise
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project dhs-rise --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
