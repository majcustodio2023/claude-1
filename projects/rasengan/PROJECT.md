# rasengan

- **Type:** Next.js app
- **Vercel project:** `prj_aK4ZCSaU5CjijLPLkPaAAcGWfPl7` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_EqDsQqaSZ67tdpXYue3jFzL4qvzY`
- **Live URLs:**
- https://rasenganapp.com
- https://rasengan.majcustodioph.com
- https://rasengan-seven.vercel.app
- **Source files in deployment:** 159 (0 already in this folder)

## Work on it locally
```bash
cd projects/rasengan
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs rasengan
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project rasengan --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```

## Database
Shared Supabase project **agency-tracker** (`wsiajfkjjbhpieuvjikz`), this app uses: public (rasengan_* tables) + rasengan_private.
Schema snapshot: `/supabase/live-snapshot-agency-tracker.sql` (repo root). Public keys: `supabase.env.example`.
