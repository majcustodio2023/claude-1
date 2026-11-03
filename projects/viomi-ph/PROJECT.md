# viomi-ph

- **Type:** static site / serverless functions
- **Vercel project:** `prj_jgVp4ltOgnsW2T2xG8mUJnhGc6Vs` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_GF9wUWFv7WoQFkhQ7MbpxL7pBj3z`
- **Live URLs:**
- https://viomi-ph.vercel.app
- https://viomiofficialph.com
- https://viomi.majcustodioph.com
- **Source files in deployment:** 123 (0 already in this folder)

> Note: this deployment was uploaded as a **built bundle** (compiled assets, no original source). The original source project lives on the machine it was built on.

## Work on it locally
```bash
cd projects/viomi-ph
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs viomi-ph
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project viomi-ph --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
