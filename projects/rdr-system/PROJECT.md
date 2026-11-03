# rdr-system

- **Type:** Next.js app
- **Vercel project:** `prj_iRMBuz9I6c9oCiy4S3GmHFkWKbGd` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_84sQHizP2EXE85PWc9QTHhQyUQSo`
- **Live URLs:**
- https://rdr-system.vercel.app
- https://rdr.majcustodioph.com
- **Source files in deployment:** 117 (0 already in this folder)

## Work on it locally
```bash
cd projects/rdr-system
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs rdr-system
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project rdr-system --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
