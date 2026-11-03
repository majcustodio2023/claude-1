# temporary-agile-celesta-jx4zwfh

- **Type:** static site / serverless functions
- **Vercel project:** `prj_N2WJIMtmB0hfLw7tdXryklhXbR6V` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_GkJnNPdQA8FS9XzxKZNhfUeFQwCt`
- **Live URLs:**
- https://temporary-agile-celesta-jx4zwfh.vercel.app
- **Source files in deployment:** 28 (0 already in this folder)

> Note: this deployment was uploaded as a **built bundle** (compiled assets, no original source). The original source project lives on the machine it was built on.

## Work on it locally
```bash
cd projects/temporary-agile-celesta-jx4zwfh
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs temporary-agile-celesta-jx4zwfh
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project temporary-agile-celesta-jx4zwfh --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
