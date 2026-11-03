# rdr-meta-domination

- **Type:** static site / serverless functions
- **Vercel project:** `prj_dbUWHeDhA8TV5Z0bQbYKC4Z0voDg` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_AD94LdXbVPVgfXjg2r178DjrbmTY`
- **Live URLs:**
- https://rdrmeta.majcustodioph.com
- https://rdr-meta-domination.vercel.app
- **Source files in deployment:** 66 (0 already in this folder)

## Work on it locally
```bash
cd projects/rdr-meta-domination
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs rdr-meta-domination
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project rdr-meta-domination --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
