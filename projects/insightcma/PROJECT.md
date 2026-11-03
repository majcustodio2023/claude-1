# insightcma

- **Type:** Next.js app
- **Vercel project:** `prj_YPVuG9xiJ977cCoAmlW0HJkAjbK6` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_3tpm1vGLEVvCnMWuDvbnAe3NcogT`
- **Live URLs:**
- https://insightscma.com
- https://insightcma.vercel.app
- **Source files in deployment:** 108 (0 already in this folder)

## Work on it locally
```bash
cd projects/insightcma
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs insightcma
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project insightcma --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```

## Database
Shared Supabase project **agency-tracker** (`wsiajfkjjbhpieuvjikz`), this app uses: insightcma.
Schema snapshot: `/supabase/live-snapshot-agency-tracker.sql` (repo root). Public keys: `supabase.env.example`.
