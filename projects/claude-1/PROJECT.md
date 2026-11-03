# claude-1

- **Type:** Next.js app
- **Vercel project:** `prj_lFIQNjyNZ3Lc4LhLFhzZdpkzRxhr` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_6g8Vu5QraAG4FEFHc7aq7e53X5Zi`
- **Live URLs:**
- https://claude-1-kohl.vercel.app
- https://tracker.majcustodioph.com
- https://prototypemaker.majcustodioph.com
- **Source files in deployment:** 0 (0 already in this folder)

> This is the repository you are in (deployed from GitHub). Nothing to pull.

## Work on it locally
```bash
cd projects/claude-1
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs claude-1
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project claude-1 --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```

## Database
Shared Supabase project **agency-tracker** (`wsiajfkjjbhpieuvjikz`), this app uses: public (tracker_*, prototype_*).
Schema snapshot: `/supabase/live-snapshot-agency-tracker.sql` (repo root). Public keys: `supabase.env.example`.
