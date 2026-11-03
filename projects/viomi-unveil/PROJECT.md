# viomi-unveil

- **Type:** static site / serverless functions
- **Vercel project:** `prj_V0GvJ7XxWtKGuEA8ZSYYX7jhhGHo` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_F21nt8c6G16Q1H22txtaxR59M6KT`
- **Live URLs:**
- https://viomi-unveil.vercel.app
- https://viomiunveil.majcustodioph.com
- **Source files in deployment:** 220 (0 already in this folder)

> Note: this deployment was uploaded as a **built bundle** (compiled assets, no original source). The original source project lives on the machine it was built on.

## Work on it locally
```bash
cd projects/viomi-unveil
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs viomi-unveil
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project viomi-unveil --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
