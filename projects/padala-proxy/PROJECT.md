# padala-proxy

- **Type:** static site / serverless functions
- **Vercel project:** `prj_uxbVROeI3p94C0Ysv7qTd8dAKtLA` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_2Udm6bMdoH3kqbwg32inSnkc1roS`
- **Live URLs:**
- https://padala-proxy.vercel.app
- **Source files in deployment:** 2 (0 already in this folder)

## Work on it locally
```bash
cd projects/padala-proxy
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs padala-proxy
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project padala-proxy --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
