# sarah-recode-workshop

- **Type:** Next.js app
- **Vercel project:** `prj_NLVRFxXbYkL3KZcBPMnWQQqd37m0` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_71k5VjBYC7R7uY81nhEkxttzgjKd`
- **Live URLs:**
- https://sarah.majcustodioph.com
- https://sarah-recode-workshop.vercel.app
- **Source files in deployment:** 165 (0 already in this folder)

## Work on it locally
```bash
cd projects/sarah-recode-workshop
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs sarah-recode-workshop
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project sarah-recode-workshop --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
