# dermatrend-aesthetics

- **Type:** static site / serverless functions
- **Vercel project:** `prj_1xs9FxH7AzqQPbORMR9RPRvRDzIY` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_46LjTCWeoSjgZBcDT4AxBs2L33tf`
- **Live URLs:**
- https://dermatrendph.com
- https://dermatrend.majcustodioph.com
- https://dermatrend-aesthetics.vercel.app
- **Source files in deployment:** 88 (0 already in this folder)

## Work on it locally
```bash
cd projects/dermatrend-aesthetics
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs dermatrend-aesthetics
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project dermatrend-aesthetics --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```

## Database
Shared Supabase project **agency-tracker** (`wsiajfkjjbhpieuvjikz`), this app uses: dermatrend.
Schema snapshot: `/supabase/live-snapshot-agency-tracker.sql` (repo root). Public keys: `supabase.env.example`.
