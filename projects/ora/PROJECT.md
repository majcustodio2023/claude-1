# ora

- **Type:** Vite (React) app
- **Vercel project:** `prj_8Xy902YOaAxTdmdiBhWnfbNcGVUK` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_CboECaniwwYrnrTQ5AmT4CSFkWjP`
- **Live URLs:**
- https://ora-chi-roan.vercel.app
- **Source files in deployment:** 249 (0 already in this folder)

## Work on it locally
```bash
cd projects/ora
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs ora
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project ora --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
