# aacio-services

- **Type:** static site / serverless functions
- **Vercel project:** `prj_A4z7Rrm9uCdZxvITOgDISOb0MblU` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_6bmLcbj5td6nu6zEta1CJUHtYx63`
- **Live URLs:**
- https://majcustodioservices.com
- https://aacio-services.vercel.app
- https://services.majcustodioph.com
- **Source files in deployment:** 170 (0 already in this folder)

## Work on it locally
```bash
cd projects/aacio-services
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs aacio-services
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project aacio-services --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
