# fundraising-autopilot

- **Type:** Next.js app
- **Vercel project:** `prj_VhMLcssMC1tNSKUgLOakCb6HaTIf` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_8uWrhsG5kGcNFN4oyStuToCynywv`
- **Live URLs:**
- https://fundraising-autopilot.vercel.app
- **Source files in deployment:** 46 (0 already in this folder)

## Work on it locally
```bash
cd projects/fundraising-autopilot
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs fundraising-autopilot
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project fundraising-autopilot --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
