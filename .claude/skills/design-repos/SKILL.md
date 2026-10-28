---
name: design-repos
description: Use the local Design Repos Library (~100 influencer-recommended GitHub repos for website design, UI components, landing pages/funnels, SaaS/app starters, mobile, animation, DESIGN.md brand systems and Claude design skills) whenever designing or building a website, landing page, funnel, UI, dashboard, app, design system or any frontend. Trigger on words like design, UI, UX, landing page, website, funnel, hero section, pricing page, dashboard, app screen, component, animation, template, boilerplate, "make it look good", "premium", "modern", "not generic".
---

# Design Repos Library

Local library (101 repos, ~6 GB, shallow clones) of the repos that AI bloggers, YouTube/TikTok/X "repos you need" roundups and the 2026 Claude Code design guides recommend. Use it as the **first stop** for any design or frontend task instead of inventing UI from scratch.

**Location:** `/home/user/design-repos/` (catalog in `README.md`, list in `manifest.tsv`).
If the folder is missing or a repo is absent, restore it: `bash /home/user/design-repos/sync.sh` (shallow clones, ~5 min). Quick lookup: `bash /home/user/design-repos/find.sh <keyword>`.

## Workflow for any design / frontend task

1. **Load a design skill before writing UI.** Read one of these `SKILL.md` files and follow it (pick by task):
   - General web UI, "make it premium": `01-ai-design-skills/impeccable/.claude/skills/impeccable/SKILL.md` or `01-ai-design-skills/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/SKILL.md`
   - Art direction / avoid generic AI look: `01-ai-design-skills/taste-skill/skills/taste-skill/SKILL.md`, `01-ai-design-skills/hallmark/skills/hallmark/SKILL.md`
   - Motion & interaction: `01-ai-design-skills/emilkowalski-skills/skills/animate/SKILL.md` (+ `improve-animations`, `apple-design`), `01-ai-design-skills/design-motion-principles/skills/design-motion-principles/SKILL.md`
   - Persistent per-project design system: `01-ai-design-skills/interface-design/.claude/skills/interface-design/SKILL.md`
   - Mobile screens: `01-ai-design-skills/appllama-skills/skills/appllama-app-design-skill/SKILL.md`
   - Scroll-driven / award-style sites: `01-ai-design-skills/scroll-craft/README.md`
   - Official baseline: `01-ai-design-skills/anthropics-skills/skills/frontend-design/SKILL.md`
   - Audits: `01-ai-design-skills/agent-skills/skills/web-design-guidelines/SKILL.md` (Vercel), `01-ai-design-skills/web-quality-skills/skills/*/SKILL.md`, `01-ai-design-skills/ui-skills/skills/{baseline-ui,improve-ui,fixing-accessibility}/SKILL.md`
2. **Pick a visual direction from a real brand.** Browse `02-design-systems-design-md/awesome-design-md/design-md/<brand>/DESIGN.md` (84 brands: stripe, linear.app, apple, vercel, notion, figma, framer, raycast, superhuman, airbnb, nike, tesla, spotify, claude, cursor, lovable, supabase, shopify, revolut, mercury, posthog, resend, elevenlabs, nvidia, …). More in `brand-design-md`, `oh-my-design`, `design-bites`, `awesome-design-html`. Copy the closest `DESIGN.md` into the project root (or quote its tokens) and design against it. Never default to purple gradients, Inter-everywhere, generic card grids.
3. **Build from existing components instead of hand-rolling.**
   - React/Next: `03-ui-components-react/ui` (shadcn) as the base, then `magicui`, `react-bits`, `motion-primitives`, `cult-ui`, `originui`, `kokonutui`, `animata`, `eldoraui` for animated/marketing pieces; `tremor` for charts; `inspira-ui` for Vue.
   - Plain HTML/Tailwind: `04-tailwind-html-components/` (`hyperui`, `preline`, `flowbite`, `daisyui`, `tailblocks`).
   - Marketing sections (hero, features, pricing, testimonials, CTA, footer): `05-landing-pages-marketing-blocks/cnblocks` (Tailark), `launch-ui`, `page-ui`, `open-react-template`, `astrowind`; portfolio: `portfolio`.
   - Copy the component source into the project (these are copy-paste libraries), keep attribution/licence headers, adapt tokens to the chosen DESIGN.md.
4. **Scaffold whole products from a starter, not from zero.**
   - SaaS / web app: `06-saas-apps-dashboards/open-saas`, `saas-starter` (Next.js official), `create-t3-app`, `SaaS-Boilerplate`.
   - Admin/dashboard: `shadcn-admin`, `next-shadcn-dashboard-starter`, `tabler`. Reference-quality real apps: `midday`, `dub`.
   - Mobile: `07-mobile-apps/react-native-template-obytes`, `react-native-reusables`.
   - Funnels / lead capture / email: `08-funnels-forms-email/autonnel` (ClickFunnels-style landing→checkout→upsell), `openfunnels`, `formbricks`, `react-email`.
   - Visual builders / AI design tools when the user wants a builder: `09-builders-and-ai-design-tools/` (`puck`, `grapesjs`, `webstudio`, `onlook`, `dyad`, `bolt.diy`, `open-lovable`, `screenshot-to-code`, `open-design`).
5. **Add motion deliberately.** `10-animation-motion/` has `motion` (Framer Motion), `GSAP`, `lenis` (smooth scroll), `anime`, `react-three-fiber`, `tsparticles`. Use the motion skill's rules (duration 150–400ms, ease-out for entrances, reduce-motion respected).
6. **Audit before shipping.** Run the checklists in `01-ai-design-skills/agent-skills/skills/web-design-guidelines/SKILL.md` (Vercel) and `01-ai-design-skills/web-quality-skills/skills/` (Core Web Vitals, a11y, SEO). Check contrast, keyboard nav, mobile at 375px, empty/loading/error states.

## How to search the library fast

```bash
bash /home/user/design-repos/find.sh pricing        # files/repos with "pricing"
grep -ril "testimonial" /home/user/design-repos/05-landing-pages-marketing-blocks --include=*.tsx | head
ls /home/user/design-repos/02-design-systems-design-md/awesome-design-md/design-md/
```

Prefer `Grep`/`Glob` on the category folder over reading whole repos. Skip `node_modules` and `.git`.

## Rules

- Always cite which repo a component or pattern came from in the code comment or summary, and respect its licence (most are MIT/Apache; `GSAP` is free but check plugin terms; `tabler`, `preline` have their own terms).
- Don't `npm install` a whole library when copying one component is enough.
- If the task names a brand or style ("like Linear", "Apple-ish", "Stripe clean"), check `awesome-design-md` first for a matching DESIGN.md.
- If the library is absent (fresh session), run `sync.sh` or clone only the needed repo from `manifest.tsv`.
- Keep the user's stack: don't switch frameworks to match a repo; port the pattern instead.
