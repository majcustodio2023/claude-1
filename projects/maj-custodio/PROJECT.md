# maj-custodio

- **Type:** static site / serverless functions
- **Vercel project:** `prj_QTdwBMic3dgI2d69EeCj7tY62ERl` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_GiGUwYdsEb4kuHGTRVV5rPEFbxH1`
- **Live URLs:**
- https://maj-custodio.vercel.app
- **Source files in deployment:** 2 (0 already in this folder)

## Work on it locally
```bash
cd projects/maj-custodio
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs maj-custodio
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project maj-custodio --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
