# Design Repos Library

A local library of the GitHub repos that AI bloggers, YouTube/X/TikTok "repos you need" roundups, and Claude Code design guides keep recommending for **website design, UI, landing pages/funnels, apps, and systems**. Everything here is a shallow clone (`--depth 1`) so it stays small and current.

Researched 2026-10-27. Star counts are approximate, taken from roundups published Feb–Oct 2026 (GitHub's API was not reachable from this session), so treat them as "order of magnitude".

- `manifest.tsv` – the source of truth: `<category>\t<owner/repo>`
- `sync.sh` – re-clones anything missing (`--update` also pulls)
- `find.sh <keyword>` – quick lookup of repos/files by keyword
- `.skill/design-repos/SKILL.md` – the Claude skill that teaches Claude to use this library (installed to `~/.claude/skills/design-repos`)

## 01 · AI design skills (install into Claude / agents)

These are the "make Claude stop producing generic AI UI" skills that every 2026 Claude Code design guide lists.

| Repo | ~Stars | Why it's recommended |
|---|---|---|
| anthropics/skills | 138k | Anthropic's official skills, incl. `frontend-design` (the baseline every other skill builds on) |
| nextlevelbuilder/ui-ux-pro-max-skill | 140k | The most-cited community skill: searchable design-intelligence DB (styles, palettes, font pairings, UX rules), detects stack and generates a design system |
| Leonxlnx/taste-skill | 100k | "Art direction" for coding agents: layout, typography, motion, density dials, redesign audits |
| emilkowalski/skills | 50k | Emil Kowalski's (Vercel/Linear motion) skills for designers and engineers |
| Nutlope/hallmark | 38k | Anti-AI-slop design skill for Claude Code, Cursor, Codex |
| pbakaus/impeccable | 37–52k | Paul Bakaus' expansion of frontend-design: typography, color, spatial, motion, interaction, responsive, UX writing refs |
| Dammyjay93/interface-design | — | Design engineering for Claude Code with a persistent design-system file and slash commands |
| vercel-labs/agent-skills | — | Vercel's `web-design-guidelines`: audits UI code against 100+ UX/accessibility rules |
| ibelick/ui-skills | — | `baseline-ui`, `fixing-accessibility`, `fixing-motion-performance` |
| google-labs-code/stitch-skills | 8.6k | Google Stitch skills: design-md, enhance-prompt, react-components, shadcn-ui |
| superdesigndev/superdesign-skill | — | Turns generic AI UI into polished frontend; investigates existing UI first |
| alchaincyf/huashu-design | 27k | Prompt → deliverable designs, prototypes, slides |
| MengTo/Skills | 7k | Meng To (DesignCode) agent skills for designers and builders |
| Appllama/appllama-skills | 3.4k | Top app patterns → native-quality **mobile** screens |
| nateherkai/scroll-craft | 4k | Scroll-driven immersive websites |
| kylezantos/design-motion-principles | 1.4k | Audits what should animate and how |
| freshtechbro/claudedesignskills | — | 23 animation skills (GSAP, Framer Motion, Lottie) + 3D |
| addyosmani/web-quality-skills | — | Core Web Vitals, a11y, SEO, best-practice audits |
| Owl-Listener/designer-skills | 3k | 63 design skills + 27 commands: research, systems, UI, delivery |
| plugin87/ux-ui-agent-skills | 3k | Design architect with tokens and accessibility checks |
| bitjaru/styleseed | — | 69 design rules, 48 shadcn components, brand skins |
| claudekit/frontend-design-pro-demo | — | 11 named aesthetics with HTML/CSS demos and the prompts that made them |
| Trystan-SA/claude-design-system-prompt | 2k | Reverse-engineered design-collaborator prompt library |

## 02 · Design systems as DESIGN.md (style references for real brands)

| Repo | ~Stars | Why |
|---|---|---|
| VoltAgent/awesome-design-md | 112k | The viral one: DESIGN.md files for 70+ real sites (Stripe, Linear, Apple, Cursor, Claude…) with light/dark preview HTML |
| VoltAgent/awesome-claude-design | — | 68 brand DESIGN.md files sorted by industry, Claude Design format |
| SpaceZephyr/brand-design-md | — | Design language of 62 brands on demand |
| kwakseongjae/oh-my-design | — | Installs 500+ company DESIGN.md references |
| google-labs-code/design.md | — | The official DESIGN.md spec (Google Labs) |
| educlopez/design-bites | — | Curated DESIGN.md for inspiring sites |
| yzfly/awesome-design-html | — | 115 brand-themed HTML designs as a skill |
| Manavarya09/design-extract | 4.4k | Extract a website's design system into tokens |
| yuvrajangadsingh/brandmd | — | URL → DESIGN.md + CSS variables + Tailwind config, no LLM |

## 03 · React/Next UI component libraries (copy-paste, animated)

| Repo | ~Stars | Why |
|---|---|---|
| shadcn-ui/ui | 120k+ | The default component base for v0, Lovable, every 2026 starter |
| magicuidesign/magicui | 15k+ | Animated marketing components (bento, marquee, shiny buttons, globe) |
| DavidHDev/react-bits | 26–37k | Text effects and micro-interactions, many pure CSS (RSC friendly) |
| ibelick/motion-primitives | — | Text/hover/transition primitives you compose |
| nolly-studio/cult-ui | — | Shadcn-style animated components |
| origin-space/originui | — | 400+ copy-paste Tailwind/shadcn components |
| kokonut-labs/kokonutui | — | 100+ Tailwind + shadcn components for Next.js |
| codse/animata | — | Hand-crafted animated interaction components |
| karthikmudunuri/eldoraui | — | Animated components, Framer Motion |
| ansub/syntaxUI | — | Free UI snippets and animated sections |
| Ali-Hussein-dev/indie-ui | — | Reusable styled components for indie builders |
| tremorlabs/tremor | — | Dashboard/chart components on Tailwind |
| nyxb-ui/ui | — | Animated Next.js component set |
| unovue/inspira-ui | — | Aceternity/Magic UI ports for **Vue/Nuxt** |
| lucide-icons/lucide | — | The icon set shadcn and most starters use |
| birobirobiro/awesome-shadcn-ui | — | The big list of shadcn blocks/themes/tools |
| 2-fly-4-ai/awesome-shadcnui | — | Second shadcn ecosystem list |

Not clonable (no public repo): Aceternity UI, Hover.dev, Shadcnblocks (paid/site-only). Use Magic UI / React Bits / Inspira as the open equivalents.

## 04 · Tailwind / plain-HTML components (no framework)

| Repo | ~Stars | Why |
|---|---|---|
| htmlstreamofficial/preline | — | Preline UI, 640+ Tailwind components |
| themesberg/flowbite | — | 400+ components, JS interactivity |
| markmead/hyperui | — | 500+ copy-paste HTML/Tailwind v4 components, MIT |
| saadeghi/daisyui | 41k | Theme-able Tailwind component classes |
| mertJF/tailblocks | — | Ready-made Tailwind page blocks |

## 05 · Landing pages, marketing blocks, portfolios

| Repo | ~Stars | Why |
|---|---|---|
| meschacirung/cnblocks | 1.8k | **Tailark**: 300+ marketing blocks (hero, features, pricing, testimonials, CTA, footer) |
| launch-ui/launch-ui | — | Landing-page components built on shadcn |
| danmindru/page-ui | — | Landing page components + templates (Shipixen) |
| cruip/open-react-template | 4.7k | Free React/Next landing template |
| onwidget/astrowind | — | Most popular Astro + Tailwind marketing template |
| satnaing/astro-paper | — | Minimal Astro blog theme |
| dillionverma/portfolio | — | The Magic UI portfolio template everyone forks |

## 06 · SaaS starters, dashboards, full apps

| Repo | ~Stars | Why |
|---|---|---|
| wasp-lang/open-saas | 14k+ | Most complete free SaaS boilerplate (auth, Stripe, jobs, admin, shadcn) |
| nextjs/saas-starter | 15.8k | Official Next.js + Postgres + Drizzle + Stripe + shadcn |
| t3-oss/create-t3-app | 29k | Type-safe Next.js/tRPC/Tailwind/Prisma scaffold |
| ixartz/Next-js-Boilerplate | — | Production Next.js boilerplate |
| ixartz/SaaS-Boilerplate | — | SaaS variant with auth, i18n, landing |
| satnaing/shadcn-admin | — | The go-to shadcn admin dashboard |
| Kiranism/next-shadcn-dashboard-starter | — | Next 15 + shadcn dashboard starter |
| tabler/tabler | — | Classic open admin UI kit |
| midday-ai/midday | — | Real commercial product with top-tier UI, open source |
| dubinc/dub | — | Dub.co, often cited as "best-looking OSS app" |

## 07 · Mobile apps

| Repo | Why |
|---|---|
| obytes/react-native-template-obytes | Production Expo starter |
| mrzachnugent/react-native-reusables | shadcn for React Native (NativeWind) |

## 08 · Funnels, forms, email

| Repo | Why |
|---|---|
| autonnel/autonnel | Open-source ClickFunnels alternative: landing → checkout → upsell, A/B tests |
| aialvi/openfunnels | Self-hosted funnel builder + CRM-lite, drag-and-drop editor |
| formbricks/formbricks | Open-source surveys/forms (Typeform alternative) |
| resend/react-email | Build emails in React |

## 09 · Builders and AI design tools

| Repo | ~Stars | Why |
|---|---|---|
| puckeditor/puck | — | Visual page builder for React |
| GrapesJS/grapesjs | — | Drag-and-drop web builder framework |
| webstudio-is/webstudio | — | Open-source Webflow alternative |
| onlook-dev/onlook | 27k | "Cursor for designers": visual editor for Next/Tailwind code |
| dyad-sh/dyad | 21k | Local open-source Lovable/v0/Bolt alternative |
| stackblitz-labs/bolt.diy | — | Self-hosted Bolt with any LLM |
| firecrawl/open-lovable | — | Clone any website into React |
| abi/screenshot-to-code | 71k | Screenshot/URL → HTML/Tailwind/React |
| wandb/openui | — | Describe UI, get it rendered live |
| nexu-io/open-design | 104k | Local-first collaborative AI design workspace |
| OpenCoworkAI/open-codesign | 8k | Open-source Claude Design alternative |
| nexu-io/html-anything | 9k | Agentic HTML editor with 75 skills |
| superdesigndev/superdesign | — | In-IDE design agent |
| INSANE0777/Awwwards-mcp | — | MCP server for Awwwards-level inspiration |

## 10 · Animation and motion

| Repo | Why |
|---|---|
| motiondivision/motion | Motion (ex Framer Motion) |
| greensock/GSAP | GSAP, now fully free |
| darkroomengineering/lenis | Smooth scroll used on award sites |
| juliangarnier/anime | anime.js v4 |
| pmndrs/react-three-fiber | Three.js in React |
| tsparticles/tsparticles | Particle backgrounds |

## 11 · Awesome lists and meta resources

| Repo | ~Stars | Why |
|---|---|---|
| bradtraversy/design-resources-for-developers | 67k | Fonts, colors, icons, stock, UI kits, AI design tools |
| rohitg00/awesome-claude-design | — | Claude Design prompts, skills, video teardowns |
| zhuyansen/awesome-claude-design-skills | — | 190+ design skills graded by type and security |
| wilwaldon/Claude-Code-Frontend-Design-Toolkit | — | Everything that makes Claude Code frontends look better |
| hesreallyhim/awesome-claude-code | 57k | The main Claude Code resource list |
| obra/superpowers | 240k | Plan/test-first skills framework for Claude Code |

## Sources used for the research

- https://github.com/zhuyansen/awesome-claude-design-skills
- https://github.com/wilwaldon/Claude-Code-Frontend-Design-Toolkit
- https://github.com/rohitg00/awesome-claude-design
- https://snyk.io/articles/top-claude-skills-ui-ux-engineers/
- https://www.chaseai.io/blog/claude-code-frontend-design-skills
- https://medium.com/@hii_mohit/9-best-ui-skills-for-claude-code-in-2026-i-tested-them-all-58fe42809376
- https://pasqualepillitteri.it/en/news/576/claude-code-skills-design-uiux-guide
- https://www.firecrawl.dev/blog/best-github-repos
- https://blog.stackademic.com/12-github-repos-every-frontend-dev-should-star-in-2026-9b97abd19582
- https://www.pkgpulse.com/guides/react-bits-vs-aceternity-magic-ui-2026
- https://21st.dev/blog/react-bits-alternatives
- https://dev.to/naymur/top-shadcn-ui-free-components-and-block-libraries-every-developer-should-bookmark-4gba
- https://adminlte.io/blog/nextjs-saas-templates/
- https://starterpick.com/guides/best-free-open-source-saas-boilerplates-2026
- https://speckyboy.com/tailwind-css-web-templates/
- https://blog.brightcoding.dev/2026/09/16/voltagentawesome-design-md-designmd-files-for-ai-ui-generation
- https://www.remio.ai/post/voltagent-awesome-goes-viral-but-design-md-tests-a-bigger-promise
- https://vp0.com/blogs/open-source-lovable-alternative.md
- https://peerlist.io/aialvi/project/openfunnels
- https://www.producthunt.com/products/autonnel
- https://medium.com/synthetic-futures/11-best-github-repos-for-claude-code-that-will-10x-your-next-project-in-2026-b300a120bd8b
