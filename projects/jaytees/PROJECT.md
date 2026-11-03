# jaytees

- **Type:** Next.js app
- **Vercel project:** `prj_HRBnVDaF5KGpNQD7DTaoLPeYcNRe` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_EXFaYJ8pLoMyXRaAyatbL21t68Xg`
- **Live URLs:**
- https://jaytees.vercel.app
- https://jaytees.majcustodioph.com
- **Source files in deployment:** 268 (6 already in this folder)

## Work on it locally
```bash
cd projects/jaytees
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs jaytees
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project jaytees --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```

## Database
Supabase project **jaytees** (`qanzoabxpglcuhzscwha`), schemas: public, viomi.
Schema snapshot: `supabase/schema.sql`. Public keys: `supabase.env.example`.
