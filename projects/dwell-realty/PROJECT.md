# dwell-realty

- **Type:** Next.js app
- **Vercel project:** `prj_c3H4yepkk13tarJU0PnCAqQEixu3` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_6887ggXAo3vYAKNrLAQV9zN84ghS`
- **Live URLs:**
- https://dwellrealtyph.com
- https://dwell-realty.vercel.app
- **Source files in deployment:** 105 (0 already in this folder)

## Work on it locally
```bash
cd projects/dwell-realty
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs dwell-realty
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project dwell-realty --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```

## Database
Supabase project **dwell-realty** (`zzhnkdvidtoirgmbbkmd`), schemas: dwell.
Schema snapshot: `supabase/schema.sql`. Public keys: `supabase.env.example`.
