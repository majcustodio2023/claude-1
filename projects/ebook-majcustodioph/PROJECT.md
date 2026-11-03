# ebook-majcustodioph

- **Type:** static site / serverless functions
- **Vercel project:** `prj_N3lGP2bIGSOnVufWdKYP8Mvnoyfd` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_5oZEWdhnLARiojnC6suHmMegCREV`
- **Live URLs:**
- https://ebook.majcustodioph.com
- https://ebook-majcustodioph.vercel.app
- **Source files in deployment:** 2 (0 already in this folder)

## Work on it locally
```bash
cd projects/ebook-majcustodioph
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs ebook-majcustodioph
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project ebook-majcustodioph --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
