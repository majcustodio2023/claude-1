# Agency Tracker

A gamified HQ for running an agency or small business: money in vs. the monthly expense and revenue targets, cash on hand and runway, recurring clients, deals, expenses, daily/weekly check-ins, team, tasks, a daily briefing and to-do list, a chat sidekick (Kit), Meta Ads analysis and automation across several ad accounts, and AI ad creatives.

Everything business-specific is a setting: owner and business name, currency, number/date format, time zone, revenue goal, targets, the optional daily Bible verse, and Creatives quick prompts. A new install starts empty and asks for the basics on the HQ screen.

## What's in it

- **HQ**: stay-afloat meter (expenses covered) and revenue-goal meter, money breakdown, War chest (cash on hand, runway, safety buffer, 4-month forecast, balance check-ins across accounts), advice built from the current numbers, an optional daily KJV verse, and a to-do list generated each day from collections, deals, tasks and ads. Achievements unlock permanent gear for the hero.
- **Income**: recurring streams per month with a "Mark collected" button. Streams can be fixed, variable (enter actual sales each month) or a percent of a client's revenue with a minimum.
- **Boss Deals**: deals and one-off receivables, each a lead, closed and to collect, or collected. "Closed & collected" records the full payment and adds it to money made; deposits can be recorded separately. Open deals never count as money made.
- **Expenses**: fixed monthly lines (with optional start/end months, e.g. a loan repaid over six months), paid checkboxes, and other spending such as ad spend.
- **Daily log**: leads, booked calls, show-ups, closes, ad spend, energy, wins and blockers. Weekly totals show on Today.
- **Tasks**: an Eisenhower checklist (do / schedule / delegate / eliminate) with owners and due dates. **Team**: members, cost, and their open tasks.
- **Meta Ads**: add ad accounts (yours and teammates'), save an access token per account, pick which campaigns to track, and analyze them: cost per result, ROAS, link CTR, CPC, CPM, frequency, hook rate (3s views ÷ impressions), hold rate (ThruPlays ÷ 3s views), plus per-ad results. Each campaign is **View only** (suggestions), **Manage** (suggestions get one-click buttons to pause losing ads or change the daily budget ±20%, each confirmed before it's sent to Meta), or **Autopilot** (the same changes applied once a day on their own, with limits: at most 3 pauses a run and never the best ad, budget raises only up to a max daily budget you set, and at most one budget change every 3 days). Every Autopilot run is logged in the app.
- **Creatives**: generate ad images with Higgsfield (Soul) from a prompt, animate any image into a 5–15s video (Kling via Higgsfield), or add your own videos and images by public link (Google Drive and Dropbox share links are converted to direct downloads). "Make test ad" on a campaign set to Manage or Autopilot uploads the media to that ad account and creates a **paused** ad in the same ad set as the campaign's best single image/video ad, copying its page, text, headline, link and button.

## Running locally

```bash
npm install
npm run dev     # http://localhost:3000, data saved in .data/tracker.json
npm test
```

## Deploying (Vercel)

1. Create a Supabase project (or use an existing one) and run `supabase/schema.sql`, then register your `TRACKER_DB_KEY` with the insert at the bottom of that file.
2. Import this repo in Vercel and set the variables from `.env.example`.
3. Add the subdomain (e.g. `hq.yourdomain.com`) under the project's Domains.
4. For the daily Autopilot run, set `CRON_SECRET` (any long random string). Vercel Cron calls `/api/cron/autopilot` at 01:00 UTC with it (change the schedule in `vercel.json`); without it the route stays closed and only the in-app "Run now" button works.

## Meta tokens

Use a System User token from Meta Business Settings (doesn't expire) with `ads_read`, plus `ads_management` if you'll use Manage mode. Tokens are checked against Meta, encrypted with `APP_SECRET`, and never returned to the browser.

## Higgsfield key

Create an API key at cloud.higgsfield.ai and paste it in the Creatives tab as `KEY_ID:KEY_SECRET`. It's encrypted with `APP_SECRET` like the Meta tokens and never returned to the browser. Generations use your Higgsfield credits.

## Kit chat

Kit (the fox on HQ) can chat, using Claude. Paste a Claude API key from console.anthropic.com in the Mission briefing card, or set `ANTHROPIC_API_KEY` in Vercel (`KIT_MODEL` overrides the model). Kit sees a live status report (money, cash, deals, quests, tasks, campaigns) and can rewrite today's briefing or add quests. Replies can be read aloud, and the 🎤 button takes voice input in browsers that support speech recognition (Chrome, Edge, Safari).
