# hiverooms-davao

- **Type:** Next.js app
- **Vercel project:** `prj_15aUuaTtLFIavH5wDl6N6ggANJfC` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_7GukDTDePogaaGYvd4HWkG8Ufv54`
- **Live URLs:**
- https://hiverooms-davao.vercel.app
- https://hiverooms.majcustodioph.com
- **Source files in deployment:** 44 (0 already in this folder)

## Work on it locally
```bash
cd projects/hiverooms-davao
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs hiverooms-davao
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project hiverooms-davao --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```
