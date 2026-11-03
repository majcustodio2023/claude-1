# viomi-plan

- **Type:** static site / serverless functions
- **Vercel project:** `prj_bKnKdkk3LNazhCpycOBeWrvPxoZL` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_2MCKRideum6MqzdsrEhinAHy1vGS`
- **Live URLs:**
- https://viomi-plan.vercel.app
- https://viomipresentation.majcustodioph.com
- **Source files in deployment:** 14 (0 already in this folder)

## Work on it locally
```bash
cd projects/viomi-plan
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs viomi-plan
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project viomi-plan --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
