# creatopia-live

- **Type:** Next.js app
- **Vercel project:** `prj_vOvmSK8SpwOoOQ7DJZMcJqxpB8sh` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_2xJNKCVWimnYJ5RQEJX7pXtE4zob`
- **Live URLs:**
- https://creatopialive.com
- https://creatopia-live.vercel.app
- **Source files in deployment:** 127 (0 already in this folder)

## Work on it locally
```bash
cd projects/creatopia-live
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs creatopia-live
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project creatopia-live --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```

## Database
Shared Supabase project **agency-tracker** (`wsiajfkjjbhpieuvjikz`), this app uses: public (creatopia_* tables) + creatopia_private.
Schema snapshot: `/supabase/live-snapshot-agency-tracker.sql` (repo root). Public keys: `supabase.env.example`.
