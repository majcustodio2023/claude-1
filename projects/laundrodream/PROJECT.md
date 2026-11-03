# laundrodream

- **Type:** static site / serverless functions
- **Vercel project:** `prj_W0dK716y6yypg7fGmt8dfmVgheX8` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_EvmU4aDftqFYCBgqUm3dmuRbrwc4`
- **Live URLs:**
- https://laundrodream.vercel.app
- https://laundrodream.majcustodioph.com
- **Source files in deployment:** 75 (0 already in this folder)

## Work on it locally
```bash
cd projects/laundrodream
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs laundrodream
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project laundrodream --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
