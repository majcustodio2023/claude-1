# recruitment-autopilot

- **Type:** Next.js app
- **Vercel project:** `prj_mqy6ZGA70lHG53CAERSHVwdzKM8t` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_9dCeqzWcuAAGaNPor1tSot4dTony`
- **Live URLs:**
- https://recruitment-autopilot.vercel.app
- **Source files in deployment:** 67 (0 already in this folder)

## Work on it locally
```bash
cd projects/recruitment-autopilot
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs recruitment-autopilot
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project recruitment-autopilot --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
