# dist

- **Type:** static site / serverless functions
- **Vercel project:** `prj_L4J5aHb2mqsEJ29WCVfcv9Ivd5uf` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_9gHggRRR8bnxoDoLffe3wAEa2qjp`
- **Live URLs:**
- https://dist-nine-eta-24.vercel.app
- **Source files in deployment:** 220 (0 already in this folder)

> Note: this deployment was uploaded as a **built bundle** (compiled assets, no original source). The original source project lives on the machine it was built on.

## Work on it locally
```bash
cd projects/dist
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs dist
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project dist --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
