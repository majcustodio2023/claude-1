import "server-only";
import { graphGet } from "./meta";
import { secretKey } from "./city";
import { chunks, dueJob, jobContext, jobOf, type Job } from "./cityJobs";
import { getAnthropicKey, getData, getStaffSecret, updateStaffWork } from "./store";
import type { CityStaff, StaffWork, TrackerData } from "./types";

// Runs city staff jobs on Claude (Kit's key) and keeps what they make on the server.

const MODEL = process.env.KIT_MODEL ?? "claude-sonnet-5-5";

export const NO_KEY = "Staff work with the same Claude key as Kit. Add it in Kit's chat on HQ first.";

/** Today in the business's time zone. */
export function businessDay(data: TrackerData, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: data.settings.timeZone || "Asia/Manila" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

async function claude(key: string, system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 4096, system, messages: [{ role: "user", content: user }] }),
    cache: "no-store",
  });
  const json = (await res.json()) as { content?: { type: string; text?: string }[]; error?: { message: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `Claude API error ${res.status}`);
  return (json.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

/** The page's real numbers, when the insights analyst has a page ID and a token. */
async function pageNumbers(s: CityStaff): Promise<string | null> {
  const pageId = s.setup?.pageId?.trim();
  const token = await getStaffSecret(secretKey(s.id, "metaToken"));
  if (!pageId || !token) return null;
  type Count = { summary?: { total_count?: number } };
  const page = await graphGet<{ name?: string; followers_count?: number; fan_count?: number }>(`${pageId}?fields=name,followers_count,fan_count`, token);
  const posts = await graphGet<{ data: { message?: string; created_time: string; shares?: { count: number }; reactions?: Count; comments?: Count }[] }>(
    `${pageId}/posts?fields=message,created_time,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)&limit=15`,
    token,
  );
  const rows = posts.data.map(
    (p) => `- ${p.created_time.slice(0, 10)}: reactions ${p.reactions?.summary?.total_count ?? 0}, comments ${p.comments?.summary?.total_count ?? 0}, shares ${p.shares?.count ?? 0}. "${(p.message ?? "(no text)").replace(/\s+/g, " ").slice(0, 140)}"`,
  );
  return `Live page data from Meta (pulled ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC):\nPage: ${page.name ?? pageId}. Followers: ${page.followers_count ?? "n/a"}. Page likes: ${page.fan_count ?? "n/a"}.\nLast ${rows.length} posts:\n${rows.join("\n") || "(no posts)"}`;
}

/** One job, done and saved. Returns the whole work list. */
export async function doJob(staffId: string, jobId?: string, input?: string, auto = false): Promise<{ work: StaffWork[]; entry?: StaffWork; skipped?: boolean }> {
  const key = await getAnthropicKey();
  if (!key) throw new Error(NO_KEY);
  const data = await getData();
  const s = data.city?.staff.find((x) => x.id === staffId);
  if (!s) throw new Error("They aren't in the city any more.");
  const today = businessDay(data);
  let job: Job | undefined;
  if (auto) {
    job = dueJob(data, s, today) ?? undefined;
    if (!job) return { work: data.staffWork ?? [], skipped: true };
  } else job = jobOf(s, jobId);
  if (!job) throw new Error(`${s.name} doesn't have a job like that.`);
  const given = (input ?? "").trim();
  if (job.input?.required && given.length < 10) throw new Error(`Paste the ${job.input.label.toLowerCase()} first.`);

  let live: string | null = null;
  if (s.role === "insights") {
    try {
      live = await pageNumbers(s);
    } catch (e) {
      if (!given) throw new Error(`Couldn't read the page from Meta: ${(e as Error).message}. Check the page ID and token, or paste the numbers.`);
    }
    if (!live && !given) throw new Error("Paste the page numbers, or add the page ID and a Meta token in my setup so I can pull them myself.");
  }

  const building = data.city?.buildings.find((b) => b.id === s.buildingId);
  const system = [
    jobContext(data, s, building, today, live ?? undefined),
    "Write the finished work, ready to copy and use. Start straight with the work (no preamble). Use clear headings and short lines so it reads well on a phone. Never invent numbers, results or testimonials; where a real detail is missing, leave a clearly marked [placeholder].",
  ].join("\n\n");
  const user = [`Your job now: ${job.label}.`, job.brief, given && `${job.input?.label ?? "Input"}:\n"""\n${given.slice(0, 30000)}\n"""`].filter(Boolean).join("\n\n");
  const text = await claude(key, system, user);
  const entry: StaffWork = {
    id: `work-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    staffId: s.id,
    buildingId: s.buildingId,
    jobId: job.id,
    label: job.label,
    text,
    input: given ? given.slice(0, 300) : undefined,
    auto: auto || undefined,
    day: today,
    at: new Date().toISOString(),
  };
  const work = await updateStaffWork((list) => [entry, ...list]);
  return { work, entry };
}

/** The daily round: everyone who's set up does what's due, a few at a time. */
export async function runDailyWork(): Promise<{ done: number; failed: string[] }> {
  if (!(await getAnthropicKey())) return { done: 0, failed: [] };
  const data = await getData();
  const today = businessDay(data);
  const due = (data.city?.staff ?? []).filter((s) => dueJob(data, s, today));
  let done = 0;
  const failed: string[] = [];
  for (let i = 0; i < due.length; i += 4) {
    const results = await Promise.allSettled(due.slice(i, i + 4).map((s) => doJob(s.id, undefined, undefined, true)));
    results.forEach((r, k) => (r.status === "fulfilled" ? !r.value.skipped && done++ : failed.push(`${due[i + k].name}: ${(r.reason as Error).message}`)));
  }
  return { done, failed };
}

/** Posts a piece of work to the staff member's Discord channel with their bot. */
export async function postToDiscord(workId: string): Promise<StaffWork[]> {
  const data = await getData();
  const w = (data.staffWork ?? []).find((x) => x.id === workId);
  const s = w && data.city?.staff.find((x) => x.id === w.staffId);
  if (!w || !s) throw new Error("That work isn't there any more.");
  const channel = s.setup?.channel?.trim();
  const token = await getStaffSecret(secretKey(s.id, "botToken"));
  if (!token || !channel) throw new Error(`Add the Discord bot token and the channel ID in ${s.name}'s setup first.`);
  for (const part of chunks(w.text, 1900)) {
    const res = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(channel)}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: part, allowed_mentions: { parse: [] } }),
      cache: "no-store",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(`Discord said: ${j.message ?? res.status}. Check the bot is in the server and can post in that channel.`);
    }
  }
  return updateStaffWork((list) => list.map((x) => (x.id === workId ? { ...x, sent: "Posted to Discord" } : x)));
}
