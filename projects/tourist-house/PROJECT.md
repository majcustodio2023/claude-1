# tourist-house

- **Type:** Vite (React) app
- **Vercel project:** `prj_PH7Md8izxdGYT6lDhi78LhFPrI8N` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_AZKGb8V2xKxfyi3ygkghzWM2CE7L`
- **Live URLs:**
- https://tourist-house.vercel.app
- **Source files in deployment:** 116 (0 already in this folder)

## Work on it locally
```bash
cd projects/tourist-house
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs tourist-house
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project tourist-house --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
