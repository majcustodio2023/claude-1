# shift-founder-webinar

- **Type:** static site / serverless functions
- **Vercel project:** `prj_b9uy4tkM0vCqoz2CTPkDrBMP7qrH` (team Aacio `team_7TMvjA3mhfMiAEHMXYivSf4l`)
- **Latest production deployment:** `dpl_4kx3oTStt5qb3cNSJA2NMUkYWciN`
- **Live URLs:**
- https://wendyalferez.com
- https://shift-founder-webinar.vercel.app
- **Source files in deployment:** 37 (0 already in this folder)

## Work on it locally
```bash
cd projects/shift-founder-webinar
# 1) get the source (one command, needs VERCEL_TOKEN once): from the repo root
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs shift-founder-webinar
# 2) connect this folder to the Vercel project (writes .vercel/project.json)
npx vercel link --yes --project shift-founder-webinar --scope aacio
# 3) pull the real environment variables (secrets) from Vercel
npx vercel env pull .env.local
# 4) run / deploy
npm install && npx vercel dev        # local
npx vercel --prod                    # deploy to production
```

## Database
Supabase project **shift-founder-webinar** (`gbjniglezninsaybharr`) is PAUSED (inactive). Restore it from the Supabase dashboard before working on it; its schema could not be exported while paused.
