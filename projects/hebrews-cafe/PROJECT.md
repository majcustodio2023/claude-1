# hebrews-cafe

- **Type:** static site / serverless functions
- **Vercel project:** `prj_wEtS81poaAWma2G3RYyqBEZfUIV5` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_CiYzrhVyzX6XruZSxKUKZooECrdC`
- **Live URLs:**
- https://hebrews-cafe-eosin.vercel.app
- **Source files in deployment:** 44 (0 already in this folder)

## Work on it locally
```bash
cd projects/hebrews-cafe
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs hebrews-cafe
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project hebrews-cafe --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
