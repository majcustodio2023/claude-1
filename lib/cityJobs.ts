// The real jobs city staff do. Each job is a brief for Claude (the same key Kit uses), built
// from the staff member's setup and what the app knows about their client. Staff who are set up
// do their daily job on their own; you can also ask for any job from their Work pop-up.

import { groupOf } from "./adgroups";
import { buildingName, clientsOf, roleOf, setupProgress, titleOf } from "./city";
import type { CityBuilding, CityStaff, StaffRoleId, StaffWork, TrackerData } from "./types";

export interface Job {
  id: string;
  label: string;
  /** What they say while doing it. */
  doing: string;
  /** The brief. The staff setup and the client's details are added to it. */
  brief: string;
  /** Something you paste for the job (an email, reviews, numbers). */
  input?: { label: string; placeholder: string; required?: boolean };
  /** Done on their own every N days once they're set up (1 = daily). Jobs that need input never are. */
  every?: number;
}

/** What a role can't do yet without a live connection, said plainly in their Work pop-up. */
export const NOT_LIVE: Partial<Record<StaffRoleId, string>> = {
  social: "I write the posts and replies. Posting them to your pages for you needs the page connected with publishing rights, which isn't switched on yet, so copy them over for now.",
  email: "I can't open the inbox myself yet: reading Gmail needs a live Gmail connection, which isn't built. Paste an email (or a few) and I'll sort them and draft the replies.",
  insights: "With the page ID and a Meta token I pull the page's follower count and recent posts myself. Without them, paste the numbers from Meta Business Suite.",
  discord: "Add a bot token and a channel ID and I can post straight to that channel. Reading and answering members live isn't built yet, so paste their questions and I'll draft the answers.",
  app: "I don't read the app stores myself yet. Paste new reviews and I'll draft the replies.",
  store: "I don't read the store's orders myself yet. Paste products or numbers and I'll work from them.",
};

const J = (j: Job) => j;

export const JOBS: Partial<Record<StaffRoleId, Job[]>> = {
  content: [
    J({
      id: "week",
      label: "This week's posts",
      doing: "Writing this week's posts",
      every: 7,
      brief:
        "Write 7 ready-to-post social media posts for the week, one per day (Monday to Sunday), spread across the content pillars. For each post give: the day, the pillar, a scroll-stopping hook (first line), the full caption, a call to action tied to what we're promoting, 5 to 8 hashtags, and a one-line visual idea (photo, carousel or reel and what's in it).",
    }),
    J({
      id: "today",
      label: "Today's post",
      doing: "Writing today's post",
      every: 1,
      brief:
        "Write today's post: one strong hook, the full caption, a call to action, hashtags, and a visual idea. Then give a 30-second reel script for the same idea (hook, 3 beats, CTA) with on-screen text for each beat.",
    }),
    J({
      id: "calendar",
      label: "30-day content calendar",
      doing: "Planning the content calendar",
      brief:
        "Make a 30-day content calendar as a table: day, pillar, format (post, carousel, reel, story), topic, and hook. Balance the pillars, put the hardest sell on days with the warmest content before them, and end with 3 notes on how to reuse the best ideas.",
    }),
    J({
      id: "carousel",
      label: "Carousel",
      doing: "Designing a carousel",
      brief: "Write a 7-slide carousel: the text on each slide (short, bold, readable on a phone), what the image on each slide shows, and the caption to post with it.",
      input: { label: "Topic (optional)", placeholder: "Leave blank and I'll pick the best one" },
    }),
  ],
  social: [
    J({
      id: "plan",
      label: "This week's posting plan",
      doing: "Planning this week's posts",
      every: 7,
      brief:
        "Make this week's posting plan for each platform given, at the posts-per-week number. For every post: platform, day and best time, format, the full caption written for that platform, hashtags, and a visual idea. Match the brand voice.",
    }),
    J({
      id: "replies",
      label: "Comment and DM replies",
      doing: "Drafting replies",
      brief:
        "Write replies in the brand voice. If comments or DMs are pasted, reply to each one. If nothing is pasted, write 10 ready-to-use reply templates for the most common comments and DMs this business gets (price questions, 'how does it work', complaints, praise, 'interested').",
      input: { label: "Comments or DMs (optional)", placeholder: "Paste comments or messages to answer" },
    }),
    J({
      id: "today",
      label: "Today's posts",
      doing: "Writing today's posts",
      every: 1,
      brief: "Write today's post for each platform given (adapted to each one), plus 3 story ideas for today.",
    }),
  ],
  insights: [
    J({
      id: "report",
      label: "Page report",
      doing: "Reading the page numbers",
      every: 1,
      brief:
        "Write a short, plain-language page report from the numbers below: how the page is doing, the best and worst posts and why, and 3 specific things to post or change next. Use only the numbers given; if something isn't in the data, don't invent it.",
      input: { label: "Numbers (optional if the page is connected)", placeholder: "Paste reach, engagement, followers, top posts from Meta Business Suite" },
    }),
  ],
  email: [
    J({
      id: "sort",
      label: "Sort and draft replies",
      doing: "Reading your emails",
      brief:
        "For each email pasted below: a one-line summary, whether it needs the boss (flag anything about the topics I watch for), how urgent it is, and a ready-to-send reply draft. Put the ones that need action first.",
      input: { label: "Emails", placeholder: "Paste one or more emails (sender, subject, body)", required: true },
    }),
  ],
  discord: [
    J({
      id: "week",
      label: "This week's announcements",
      doing: "Planning this week in the server",
      every: 7,
      brief:
        "Write this week's Discord plan: a Monday announcement, one community event (with the full announcement post), 3 conversation starters for quiet days, and a Friday wins thread prompt. Use Discord formatting (bold, short lines, emoji only where Discord users expect them). Keep each post under 1,800 characters.",
    }),
    J({
      id: "welcome",
      label: "Welcome message and rules",
      doing: "Writing the welcome post",
      brief: "Write the server's welcome message for new members and a clear rules post that matches the tone and rules given. Keep each under 1,800 characters.",
    }),
    J({
      id: "answers",
      label: "Answer member questions",
      doing: "Answering questions",
      brief: "Draft a friendly, on-brand answer to each question pasted. Flag anything that needs the boss to answer personally.",
      input: { label: "Questions", placeholder: "Paste the members' questions", required: true },
    }),
  ],
  app: [
    J({
      id: "release",
      label: "Release notes and listing",
      doing: "Writing release notes",
      every: 7,
      brief:
        "Write store release notes for the next release (short, benefit-first, under 500 characters), a 'What's new' social post announcing it, and 3 improvements to the store listing (title, subtitle, first lines of the description) to lift installs.",
    }),
    J({
      id: "reviews",
      label: "Reply to reviews",
      doing: "Reading new reviews",
      brief: "Draft a reply to each review pasted: thank, fix, or explain, in under 350 characters each. Then list the top 3 issues users raise.",
      input: { label: "Reviews", placeholder: "Paste the reviews", required: true },
    }),
  ],
  store: [
    J({
      id: "carts",
      label: "Abandoned cart messages",
      doing: "Chasing abandoned carts",
      every: 7,
      brief:
        "Write a 3-message abandoned cart sequence (1 hour, 24 hours, 72 hours) as emails with subject lines, plus a short SMS or chat version of each. Then give one promo idea for this week.",
    }),
    J({
      id: "products",
      label: "Product descriptions",
      doing: "Writing product copy",
      brief: "Write a product title, a benefit-led description (under 120 words), and 5 bullet points for each product pasted.",
      input: { label: "Products", placeholder: "Paste product names and details", required: true },
    }),
  ],
  funnel: [
    J({
      id: "followups",
      label: "Follow-ups for open deals",
      doing: "Following up the deals",
      every: 7,
      brief:
        "For each open deal listed, write a short, personal follow-up message to move it to the next stage (lead to proposal, proposal to signed). Lead with value, end with one clear next step. Then name the deal most likely to close this week and why.",
    }),
  ],
  webinar: [
    J({
      id: "reminders",
      label: "Reminder messages",
      doing: "Writing the reminders",
      every: 7,
      brief:
        "Write the webinar reminder sequence: 7 days before, 1 day before, 1 hour before, and 'we're live', each as an email (subject + body) and a short chat message. Then a replay email for people who missed it. Use the real date, time and sign-up link.",
    }),
    J({
      id: "promo",
      label: "Sign-up push posts",
      doing: "Writing sign-up posts",
      brief: "Write 5 social posts to push sign-ups, each with a different angle (pain, curiosity, proof, urgency, FAQ), with the sign-up link.",
    }),
  ],
  ads: [
    J({
      id: "hooks",
      label: "New hooks and ad copy",
      doing: "Testing new hooks",
      every: 7,
      brief:
        "Suggest 10 new ad hooks to test against the current campaigns (mix of pain, outcome, curiosity, proof), then write 2 complete ad variations (primary text, headline under 40 characters, description) using the two strongest hooks. Say which result each one is built to get.",
      input: { label: "Numbers (optional)", placeholder: "Paste spend, results and cost per result so I can tell what's working" },
    }),
  ],
  storyboard: [
    J({
      id: "board",
      label: "Storyboard",
      doing: "Drawing up the storyboard",
      brief:
        "Turn the script or idea below into a shot-by-shot storyboard for a short vertical video (9:16). Number every shot and give: length in seconds, framing (wide, medium, close-up, over-the-shoulder, screen recording, B-roll), what we see, camera movement, on-screen text, the spoken line, and the transition to the next shot. Then a one-line shoot list (locations, props, people) and an edit note for the video editor (pace, music mood, where the captions go).",
      input: { label: "Script or idea", placeholder: "Paste the script, or describe the video in a few lines", required: true },
    }),
    J({
      id: "shots",
      label: "B-roll shot list",
      doing: "Listing B-roll shots",
      brief:
        "Write a B-roll shot list for the topic below: 15 short shots that can be filmed on a phone in a day, each with what to film, where, the framing and how many seconds to get. Group them by location so the shoot is quick.",
      input: { label: "Topic", placeholder: "What the video is about", required: true },
    }),
  ],
  videoScript: [
    J({
      id: "script",
      label: "Video script",
      doing: "Writing the script",
      brief:
        "Write a short-form video script (30 to 60 seconds) for the topic below. Give 3 hook options (first 3 seconds, spoken and on-screen text), then the full script in beats with timings, what's on screen for each beat, and one clear call to action at the end. Write it the way people talk, short lines, no jargon.",
      input: { label: "Topic, offer or link", placeholder: "What the video is about, who it's for, or a sales page link", required: true },
    }),
    J({
      id: "long",
      label: "YouTube script",
      doing: "Outlining a long video",
      brief:
        "Write a YouTube video script for the topic below (8 to 12 minutes): a title and thumbnail text (3 options each), a cold open hook, the intro, 4 to 6 chapters with talking points and examples, a mid-roll call to action, and the outro. Mark where B-roll or screen recordings go.",
      input: { label: "Topic", placeholder: "What the video is about and who it's for", required: true },
    }),
    J({
      id: "hooks",
      label: "20 video hooks",
      doing: "Writing hooks",
      brief: "Write 20 scroll-stopping hooks for short videos on the topic below, mixed across angles (pain, curiosity, contrarian, proof, story, list). Give each the spoken line and the on-screen text.",
      input: { label: "Topic", placeholder: "What the videos are about", required: true },
    }),
  ],
  custom: [
    J({
      id: "job",
      label: "Do my job",
      doing: "Working on it",
      every: 1,
      brief: "Do today's piece of your job (described below) and hand over the finished work, ready to use. If the job needs something you don't have, do everything you can and say exactly what's missing.",
      input: { label: "Extra direction (optional)", placeholder: "Anything specific for today" },
    }),
  ],
};

export const jobsOf = (s: CityStaff): Job[] => JOBS[s.role] ?? [];
export const jobOf = (s: CityStaff, id?: string): Job | undefined => jobsOf(s).find((j) => j.id === id) ?? jobsOf(s)[0];

/** The job a staff member does on their own today, if any (set up, switched on, and not done yet). */
export function dueJob(data: TrackerData, s: CityStaff, today: string): Job | null {
  if (s.autoWork === false) return null;
  if (setupProgress(s, data.integrations?.staffKeys ?? []).missing.length) return null;
  const mine = (data.staffWork ?? []).filter((w) => w.staffId === s.id);
  if (mine.some((w) => w.day === today)) return null;
  const auto = jobsOf(s).filter((j) => j.every && !j.input?.required);
  if (s.role === "funnel" && !openDeals(data).length) return null;
  // The page report needs real numbers: only on its own when the page is connected.
  if (s.role === "insights" && !(s.setup?.pageId && (data.integrations?.staffKeys ?? []).includes(`${s.id}:metaToken`))) return null;
  if (s.role === "webinar" && !(s.setup?.date && s.setup.date >= today)) return null;
  // First day on the job: the big one. After that, whatever is due, the most often first.
  for (const j of [...auto].sort((a, b) => (mine.length ? a.every! - b.every! : b.every! - a.every!))) {
    const last = mine.find((w) => w.jobId === j.id)?.day;
    if (!last || daysBetween(last, today) >= j.every!) return j;
  }
  return null;
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const openDeals = (data: TrackerData) => data.deals.filter((d) => d.stage !== "won" && d.stage !== "lost");

/** Everything the staff member knows: who they are, their client, their setup. Secrets are never included. */
export function jobContext(data: TrackerData, s: CityStaff, b: CityBuilding | undefined, today: string, extra?: string): string {
  const role = roleOf(s);
  const lines: string[] = [];
  const brand = data.settings.businessName || "the business";
  lines.push(`You are ${s.name}, the ${titleOf(s)} for ${b ? buildingName(data, b) : brand}. You work for ${brand}. Today is ${today}.`);
  if (data.settings.businessDescription?.trim()) lines.push(`About ${brand}: ${data.settings.businessDescription.trim().slice(0, 1500)}`);
  const setup = role.needs.filter((n) => !n.secret && s.setup?.[n.key]?.trim()).map((n) => `- ${n.label}: ${s.setup![n.key].trim().slice(0, 6000)}`);
  if (setup.length) lines.push(`Your setup:\n${setup.join("\n")}`);
  if (b) {
    const clients = clientsOf(b)
      .map((id) => (data.clients ?? []).find((c) => c.id === id))
      .filter(Boolean);
    for (const c of clients) {
      const bits = [c!.name, c!.notes?.trim(), c!.contact?.website && `Website: ${c!.contact.website}`].filter(Boolean);
      lines.push(`Client: ${bits.join(". ").slice(0, 3000)}`);
    }
    const ids = clientsOf(b);
    const tasks = (data.clientTasks ?? []).filter((t) => ids.includes(t.clientId) && t.status !== "done").map((t) => `- ${t.title}${t.details ? `: ${t.details.slice(0, 200)}` : ""}`);
    const todos = (b.todos ?? []).filter((t) => !t.done).map((t) => `- ${t.title}`);
    if (tasks.length || todos.length) lines.push(`Open missions:\n${[...tasks, ...todos].slice(0, 15).join("\n")}`);
    if (b.progressNote) lines.push(`Latest note: ${b.progressNote}`);
  }
  if (s.role === "funnel") {
    const deals = openDeals(data).map((d) => `- ${d.name}${d.client ? ` (${d.client})` : ""}: ${d.stage}, value ${d.value}${d.notes ? `. Notes: ${d.notes.slice(0, 300)}` : ""}`);
    lines.push(deals.length ? `Open deals:\n${deals.slice(0, 20).join("\n")}` : "There are no open deals right now.");
  }
  if (s.role === "ads" && b) {
    const ids = clientsOf(b);
    const names = data.trackedCampaigns.filter((t) => ids.some((id) => groupOf(data, t).key === `client:${id}`)).map((t) => `- ${t.name}${t.targetCpl ? ` (target cost per result ${t.targetCpl})` : ""}`);
    if (names.length) lines.push(`Campaigns:\n${names.join("\n")}`);
  }
  if (extra) lines.push(extra);
  return lines.join("\n\n");
}

/** Today's work for a staff member, newest first. */
export const workOf = (data: TrackerData, staffId: string): StaffWork[] => (data.staffWork ?? []).filter((w) => w.staffId === staffId);

/** Splits text into pieces under the limit, on line breaks where possible. */
export function chunks(text: string, max: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const line of text.split("\n")) {
    if ((cur + "\n" + line).length > max && cur) {
      out.push(cur);
      cur = "";
    }
    let l = line;
    while (l.length > max) {
      out.push(l.slice(0, max));
      l = l.slice(max);
    }
    cur = cur ? `${cur}\n${l}` : l;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
