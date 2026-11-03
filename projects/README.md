# All projects (Vercel + Supabase) in one place

This folder is the local home for every project in the **Aacio** Vercel team (43 projects) and the
Supabase databases behind them (4 projects). Each sub-folder has a `PROJECT.md` with the live URLs,
the Vercel/Supabase IDs, and the exact commands to work on it and deploy it from this laptop.

## One-time setup on the laptop

```bash
git clone https://github.com/majcustodio2023/claude-1.git && cd claude-1
npm install -g vercel supabase          # CLIs
vercel login                            # browser login to the Aacio team
```

## Get the source of every project (one command)

The source of each project is downloaded straight from its latest Vercel production deployment
(verified file-by-file against Vercel's content hashes). Create a token at
https://vercel.com/account/tokens (team: Aacio), then:

```bash
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs            # all 42 projects
VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs jaytees    # just one
node tools/pull-vercel-sources.mjs --verify                     # check what is present
```

It also writes `.vercel/project.json` in each folder, so `vercel dev`, `vercel env pull` and
`vercel --prod` work immediately from inside `projects/<name>/`.

## Connect to the live services

- **Vercel:** every folder is pre-linked to its project (IDs in `inventory.json`). Secrets come from
  `vercel env pull .env.local` inside the project folder, never from this repo.
- **Supabase:** projects with a database have `supabase.env.example` (URL + public keys only) and a
  full `supabase/schema.sql` snapshot. Link the CLI with `npx supabase link --project-ref <ref>`.
  - `jaytees` → Supabase project **jaytees** (`qanzoabxpglcuhzscwha`)
  - `dwell-realty` → Supabase project **dwell-realty** (`zzhnkdvidtoirgmbbkmd`)
  - `rasengan`, `creatopia-live`, `insightcma`, `dermatrend-aesthetics` and this repo's tracker share
    Supabase project **agency-tracker** (`wsiajfkjjbhpieuvjikz`); snapshot at
    `../supabase/live-snapshot-agency-tracker.sql`
  - `shift-founder-webinar` → Supabase project **shift-founder-webinar** (`gbjniglezninsaybharr`), currently paused

## Project index

### JT's restaurant

| Project | Live URL | Type | Files | Database |
|---|---|---|---|---|
| [`jaytees`](jaytees/PROJECT.md) | https://jaytees.vercel.app | Next.js | 268 | jaytees |

### RDR funnels & systems

| Project | Live URL | Type | Files | Database |
|---|---|---|---|---|
| [`rdr-andoy`](rdr-andoy/PROJECT.md) | https://rdr-andoy.vercel.app | static/serverless | 38 |  |
| [`rdr-landing`](rdr-landing/PROJECT.md) | https://rdr-landing.vercel.app | static/serverless | 50 |  |
| [`rdr-pursuit`](rdr-pursuit/PROJECT.md) | https://rdr-pursuit.vercel.app | Next.js | 140 |  |
| [`rdr-studio`](rdr-studio/PROJECT.md) | https://rdr-studio.vercel.app | static/serverless | 79 |  |
| [`rdr-nexus`](rdr-nexus/PROJECT.md) | https://rdr-nexus.vercel.app | static/serverless | 9 |  |
| [`rdr-meta-domination`](rdr-meta-domination/PROJECT.md) | https://rdrmeta.majcustodioph.com | static/serverless | 66 |  |
| [`rdr-system`](rdr-system/PROJECT.md) | https://rdr-system.vercel.app | Next.js | 117 |  |

### Viomi

| Project | Live URL | Type | Files | Database |
|---|---|---|---|---|
| [`viomi-ph`](viomi-ph/PROJECT.md) | https://viomi-ph.vercel.app | static/serverless (built bundle only) | 123 |  |
| [`viomi-unveil`](viomi-unveil/PROJECT.md) | https://viomi-unveil.vercel.app | static/serverless (built bundle only) | 220 |  |
| [`viomi-plan`](viomi-plan/PROJECT.md) | https://viomi-plan.vercel.app | static/serverless | 14 |  |

### Everything else

| Project | Live URL | Type | Files | Database |
|---|---|---|---|---|
| [`claude-1`](claude-1/PROJECT.md) | https://claude-1-kohl.vercel.app | Next.js (this repo) | 0 | agency-tracker — public (tracker_*, prototype_*) |
| [`laundrodream`](laundrodream/PROJECT.md) | https://laundrodream.vercel.app | static/serverless | 75 |  |
| [`dist`](dist/PROJECT.md) | https://dist-nine-eta-24.vercel.app | static/serverless (built bundle only) | 220 |  |
| [`ora`](ora/PROJECT.md) | https://ora-chi-roan.vercel.app | Vite | 249 |  |
| [`valmora`](valmora/PROJECT.md) | https://valmora-ten.vercel.app | Vite | 233 |  |
| [`tourist-house`](tourist-house/PROJECT.md) | https://tourist-house.vercel.app | Vite | 116 |  |
| [`aacio-services`](aacio-services/PROJECT.md) | https://majcustodioservices.com | static/serverless | 170 |  |
| [`letsinvest`](letsinvest/PROJECT.md) | https://letsinvest-sigma.vercel.app | Vite | 36 |  |
| [`padala-proxy`](padala-proxy/PROJECT.md) | https://padala-proxy.vercel.app | static/serverless | 2 |  |
| [`dhs-rise`](dhs-rise/PROJECT.md) | https://dhs-rise.vercel.app | static/serverless | 45 |  |
| [`cov-design-lab`](cov-design-lab/PROJECT.md) | https://cov-design-lab.vercel.app | static/serverless | 6 |  |
| [`dermatrend-aesthetics`](dermatrend-aesthetics/PROJECT.md) | https://dermatrendph.com | static/serverless | 88 | agency-tracker — dermatrend |
| [`ever`](ever/PROJECT.md) | https://ever-nine.vercel.app | static/serverless | 10 |  |
| [`hiverooms-davao`](hiverooms-davao/PROJECT.md) | https://hiverooms-davao.vercel.app | Next.js | 44 |  |
| [`clinic-front-office`](clinic-front-office/PROJECT.md) | https://clinic-front-office.vercel.app | Next.js | 51 |  |
| [`enrollment-engine`](enrollment-engine/PROJECT.md) | https://enroll.majcustodioph.com | Next.js | 46 |  |
| [`hebrews-cafe`](hebrews-cafe/PROJECT.md) | https://hebrews-cafe-eosin.vercel.app | static/serverless | 44 |  |
| [`recruitment-autopilot`](recruitment-autopilot/PROJECT.md) | https://recruitment-autopilot.vercel.app | Next.js | 67 |  |
| [`domestica`](domestica/PROJECT.md) | https://domestica-one.vercel.app | Next.js | 92 |  |
| [`fundraising-autopilot`](fundraising-autopilot/PROJECT.md) | https://fundraising-autopilot.vercel.app | Next.js | 46 |  |
| [`ofw-investor-box`](ofw-investor-box/PROJECT.md) | https://invest.majcustodioph.com | Next.js | 44 |  |
| [`creatopia-live`](creatopia-live/PROJECT.md) | https://creatopialive.com | Next.js | 127 | agency-tracker — public (creatopia_* tables) + creatopia_private |
| [`maj-insurance-funnel`](maj-insurance-funnel/PROJECT.md) | https://insurance.majcustodioph.com | Express | 3 |  |
| [`aacio-ad-media`](aacio-ad-media/PROJECT.md) | https://aacio-ad-media.vercel.app | static/serverless | 22 |  |
| [`sarah-recode-workshop`](sarah-recode-workshop/PROJECT.md) | https://sarah.majcustodioph.com | Next.js | 165 |  |
| [`dwell-realty`](dwell-realty/PROJECT.md) | https://dwellrealtyph.com | Next.js | 105 | dwell-realty |
| [`rasengan`](rasengan/PROJECT.md) | https://rasenganapp.com | Next.js | 159 | agency-tracker — public (rasengan_* tables) + rasengan_private |
| [`insightcma`](insightcma/PROJECT.md) | https://insightscma.com | Next.js | 108 | agency-tracker — insightcma |
| [`ebook-majcustodioph`](ebook-majcustodioph/PROJECT.md) | https://ebook.majcustodioph.com | static/serverless | 2 |  |
| [`maj-custodio`](maj-custodio/PROJECT.md) | https://maj-custodio.vercel.app | static/serverless | 2 |  |
| [`temporary-agile-celesta-jx4zwfh`](temporary-agile-celesta-jx4zwfh/PROJECT.md) | https://temporary-agile-celesta-jx4zwfh.vercel.app | static/serverless (built bundle only) | 28 |  |
| [`shift-founder-webinar`](shift-founder-webinar/PROJECT.md) | https://wendyalferez.com | static/serverless | 37 | shift-founder-webinar (INACTIVE (paused)) |

`inventory.json` is the machine-readable version of this table. `MANIFEST.json` in each folder lists
every source file with its SHA-1, which is what the pull script verifies against.
