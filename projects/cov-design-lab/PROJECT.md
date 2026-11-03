# cov-design-lab

- **Type:** static site / serverless functions
- **Vercel project:** `prj_0kHVCmuCAPBZPexi46kpCs0VJK8y` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_CrW5Qeqhgpvd5Y1urswtyi67hUeZ`
- **Live URLs:**
- https://cov-design-lab.vercel.app
- https://covdesignlab.majcustodioph.com
- **Source files in deployment:** 6 (0 already in this folder)

## Work on it locally
```bash
cd projects/cov-design-lab
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs cov-design-lab
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project cov-design-lab --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
