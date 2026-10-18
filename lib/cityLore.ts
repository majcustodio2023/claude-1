// The city's townspeople, their gossip, the quests they hand out, and the small talk the
// staff make. Something is stirring beyond the Danger gate in the north...
//
// Lore in short: Nova City was built on the ruins of the old ad market. North of the gate
// lie the Hollow Wilds, home of the Ghosted: monsters born from leads that went cold,
// invoices nobody paid and scope that crept. Lately the Static, a grey fog, has been
// seeping under the gate, and the old-timers say the Algorithm Beast is waking.

import { isWriter } from "./cityPrompts";
import { setupProgress } from "./city";
import type { TrackerData } from "./types";

export interface Reply {
  label: string;
  /** Node to go to; blank ends the talk */
  next?: string;
  /** Accept this quest */
  quest?: string;
}

export interface LoreNode {
  text: string;
  replies: Reply[];
}

export interface Quest {
  id: string;
  title: string;
  /** What to do, shown in the quest log */
  goal: string;
  coins: number;
  need: number;
  progress: (d: TrackerData) => number;
}

const doneMissions = (d: TrackerData) =>
  (d.clientTasks ?? []).filter((t) => t.status === "done").length + (d.city?.buildings ?? []).reduce((a, b) => a + (b.todos ?? []).filter((t) => t.done).length, 0);

export const QUESTS: Quest[] = [
  {
    id: "ready-staff",
    title: "Strength in numbers",
    goal: "Give one of your staff everything they need (all green on their checklist).",
    coins: 60,
    need: 1,
    progress: (d) => (d.city?.staff ?? []).filter((s) => setupProgress(s, d.integrations?.staffKeys).total > 0 && !setupProgress(s, d.integrations?.staffKeys).missing.length).length,
  },
  { id: "three-missions", title: "Busy hands", goal: "Finish 3 missions in any building.", coins: 50, need: 3, progress: doneMissions },
  {
    id: "first-words",
    title: "Words that sell",
    goal: "Have one of the Ad Creatives writers write something for you.",
    coins: 40,
    need: 1,
    progress: (d) => (d.city?.staff ?? []).filter((s) => isWriter(s.role)).reduce((a, s) => a + (s.outputs?.length ?? 0), 0),
  },
  {
    id: "moving-picture",
    title: "A moving picture",
    goal: "Get a video made at the AI Video Maker (an AI video, or an edit marked done).",
    coins: 70,
    need: 1,
    progress: (d) => (d.creatives ?? []).filter((c) => c.kind === "video" && c.status === "ready").length + (d.city?.videoRequests ?? []).filter((r) => r.status === "done").length,
  },
];

export const questById = (id: string) => QUESTS.find((q) => q.id === id);

/** How far along an accepted quest is, counted from when it was accepted. */
export function questState(d: TrackerData, id: string): "new" | "active" | "done" {
  const q = questById(id);
  const taken = d.city?.quests?.[id];
  if (!q || !taken) return "new";
  return q.progress(d) - taken.base >= q.need ? "done" : "active";
}

export const questProgress = (d: TrackerData, id: string) => {
  const q = questById(id)!;
  const taken = d.city?.quests?.[id];
  return Math.min(q.need, Math.max(0, q.progress(d) - (taken?.base ?? 0)));
};

export type Spot = "gate" | "plaza-left" | "plaza-right" | "corner";

export interface Citizen {
  id: string;
  name: string;
  title: string;
  color: string;
  spot: Spot;
  /** The look seed for their character */
  seed: string;
  quest?: string;
  bubbles: string[];
  nodes: Record<string, LoreNode>;
}

export const CITIZENS: Citizen[] = [
  {
    id: "bram",
    name: "Old Bram",
    title: "Gatekeeper",
    color: "#9aa0b4",
    spot: "gate",
    seed: "bram-gatekeeper",
    quest: "ready-staff",
    bubbles: ["Don't go near the gate…", "The fog came back last night.", "Forty years I've watched this gate."],
    nodes: {
      start: {
        text: "Easy there, hero. That gate stays shut. Beyond it are the Hollow Wilds, where the Ghosted live. Leads that went cold. Invoices nobody paid. They don't stay dead.",
        replies: [
          { label: "Ghosted? Like clients who stop replying?", next: "ghosted" },
          { label: "I'm not scared of a few monsters.", next: "brave" },
          { label: "Just passing by.", next: "" },
        ],
      },
      ghosted: {
        text: "Every client who ghosts you leaves something behind. Out there it grows teeth. Lately there's a grey fog under the gate. We call it the Static. Lamps flicker when it rolls in.",
        replies: [
          { label: "What can I do about it?", next: "offer" },
          { label: "That's… a lot. Bye.", next: "" },
        ],
      },
      brave: {
        text: "Ha! They all say that. The last fellow who went out alone came back with no followers and a 0.2% click-through rate. You'll need a crew that's ready.",
        replies: [
          { label: "Then how do I get ready?", next: "offer" },
          { label: "Fine, fine. Later.", next: "" },
        ],
      },
      offer: {
        text: "Get your people ready. Pick one of your staff and give them everything they ask for, every light green. A ready crew keeps the Static back. Do that and I'll pay you for your trouble.",
        replies: [
          { label: "Deal. I'll get someone ready.", quest: "ready-staff", next: "accepted" },
          { label: "Not today.", next: "" },
        ],
      },
      accepted: { text: "Good. And hero… when the gate does open, you'll want armour. The smiths in town know.", replies: [{ label: "Got it.", next: "" }] },
      waiting: {
        text: "Nobody's ready yet. Talk to your staff; the ones with red lights on their checklist are waiting on you. The fog's thicker tonight.",
        replies: [
          { label: "On it.", next: "" },
          { label: "Tell me about the gate again.", next: "start" },
        ],
      },
      after: {
        text: "Feel that? The air's lighter. A ready crew does that. One day this gate will open, and the Ghosted will come to you, or you to them. Gear up.",
        replies: [
          { label: "What's out there, really?", next: "beast" },
          { label: "I'll be ready.", next: "" },
        ],
      },
      beast: {
        text: "Old stories say something sleeps at the heart of the Wilds. The Algorithm Beast. Every few years it wakes and changes all the rules. Reach vanishes overnight. The last time, half the old town went dark.",
        replies: [{ label: "…Noted.", next: "" }],
      },
    },
  },
  {
    id: "pip",
    name: "Pip",
    title: "Newspaper kid",
    color: "#ffd23f",
    spot: "plaza-right",
    seed: "pip-news",
    quest: "three-missions",
    bubbles: ["Extra! Extra!", "Fog spotted near the north gate!", "Read all about it!"],
    nodes: {
      start: {
        text: "Extra, extra! Fountain ran backwards at midnight! Lamps on North Street flickered for an hour! Nobody's saying it, but everybody's thinking it: something's coming!",
        replies: [
          { label: "What's coming?", next: "coming" },
          { label: "Fountains don't run backwards, Pip.", next: "skeptic" },
          { label: "Got any work for me?", next: "offer" },
        ],
      },
      coming: {
        text: "Folks say the Static. Grey fog that eats attention. Where it passes, posts get no likes and inboxes go quiet. The busy parts of town don't get it, though. Funny that.",
        replies: [
          { label: "So staying busy keeps it away?", next: "offer" },
          { label: "Sounds like a slow week, not a curse.", next: "skeptic" },
        ],
      },
      skeptic: {
        text: "That's what the guy at the old ad market said. Now it's ruins with a fountain on top. I'm just the paper kid, boss. I print what I see.",
        replies: [
          { label: "Okay, okay. Anything I can help with?", next: "offer" },
          { label: "See you around, Pip.", next: "" },
        ],
      },
      offer: {
        text: "Here's a headline I wanna print: 'Hero clears three missions!' Busy towns don't fog up. Finish three missions anywhere and I'll put you on the front page, and pay you.",
        replies: [
          { label: "You've got yourself a headline.", quest: "three-missions", next: "accepted" },
          { label: "Maybe later.", next: "" },
        ],
      },
      accepted: { text: "Front page, here we come! Mission boards are inside every building. Go go go!", replies: [{ label: "Going!", next: "" }] },
      waiting: { text: "Still waiting on my headline, boss! Mission boards are inside every building.", replies: [{ label: "Working on it.", next: "" }, { label: "Any news?", next: "coming" }] },
      after: {
        text: "HERO CLEARS THREE MISSIONS! Sold out in an hour! Oh, and between us: a courier said she saw a shape in the fog. Tall. Like a thousand unread messages stacked into a man.",
        replies: [
          { label: "That's horrifying.", next: "" },
          { label: "Print the next one when I beat it.", next: "" },
        ],
      },
    },
  },
  {
    id: "ume",
    name: "Granny Ume",
    title: "Bench philosopher",
    color: "#ff9fc8",
    spot: "plaza-left",
    seed: "granny-ume-bench",
    quest: "first-words",
    bubbles: ["Lovely day for it.", "Words are a kind of magic, dear.", "Sit, sit."],
    nodes: {
      start: {
        text: "Sit with me a while, dear. I sold soap in the old market before there was a city here. Do you know what kept us alive? Words. The right words on the right sign.",
        replies: [
          { label: "What happened to the old market?", next: "market" },
          { label: "Tell me about the right words.", next: "offer" },
          { label: "I can't stay, Granny.", next: "" },
        ],
      },
      market: {
        text: "The Static came. Everyone shouted the same tired lines, 'game changer', 'not just this, but that', and the fog loved it. It ate every boring word. Only the honest, specific ones survived.",
        replies: [
          { label: "So good copy fights the fog?", next: "offer" },
          { label: "That's a strange story.", next: "strange" },
        ],
      },
      strange: { text: "The best ones are, dear. Now, are you going to help an old woman or just stand there looking heroic?", replies: [{ label: "Help, of course.", next: "offer" }, { label: "Looking heroic, mostly.", next: "" }] },
      offer: {
        text: "Your writers at the Ad Creatives building are good with words. Have one of them write something real for you. Bring words that would've survived the old market, and I'll give you a little something.",
        replies: [
          { label: "I'll get them writing.", quest: "first-words", next: "accepted" },
          { label: "Another time.", next: "" },
        ],
      },
      accepted: { text: "Mind you give them a proper landing page. Writers are like soup: they're only as good as what you put in.", replies: [{ label: "Yes, Granny.", next: "" }] },
      waiting: { text: "No words yet? The writers are in the Ad Creatives building, the orange one. Go on.", replies: [{ label: "On my way.", next: "" }] },
      after: {
        text: "Now THAT would have sold soap. Keep words like these and the Static will never find you. Here, for your trouble. Don't spend it all at the smith's.",
        replies: [
          { label: "Thank you, Granny.", next: "" },
          { label: "Will the fog really come?", next: "fog" },
        ],
      },
      fog: { text: "It always comes back, dear. The trick is to be too busy, too clear and too kind for it to stick.", replies: [{ label: "I'll remember.", next: "" }] },
    },
  },
  {
    id: "stranger",
    name: "???",
    title: "Hooded stranger",
    color: "#7c5cff",
    spot: "corner",
    seed: "hooded-stranger-x",
    quest: "moving-picture",
    bubbles: ["…", "It's watching.", "The Beast is waking."],
    nodes: {
      start: {
        text: "…You're the one they call the hero. The Beast in the Wilds is waking. It only notices what moves. Still pictures are nothing to it.",
        replies: [
          { label: "Who are you?", next: "who" },
          { label: "What does it want?", next: "want" },
          { label: "You're creepy. Bye.", next: "" },
        ],
      },
      who: { text: "Someone who saw the old market fall. That's all you need. Ask a better question.", replies: [{ label: "What does the Beast want?", next: "want" }, { label: "Nope.", next: "" }] },
      want: {
        text: "Attention. Always attention. Feed it something that moves, a video with a hook in its first breath, and it will remember your name kindly when it wakes.",
        replies: [
          { label: "So you want a video.", next: "offer" },
          { label: "I don't negotiate with beasts.", next: "" },
        ],
      },
      offer: { text: "Make one. At the Video Maker. Bring me proof it moves, and I'll make it worth your while.", replies: [{ label: "Fine. One video.", quest: "moving-picture", next: "accepted" }, { label: "Not yet.", next: "" }] },
      accepted: { text: "…Good. Don't keep it waiting.", replies: [{ label: "…Okay.", next: "" }] },
      waiting: { text: "Still nothing that moves. The purple building. The director there shoots with Higgsfield. The editor takes your own footage.", replies: [{ label: "Going.", next: "" }] },
      after: {
        text: "It moved. It noticed. You've bought yourself time, hero. When the gate opens, come find me. I'll be the one not running.",
        replies: [{ label: "That's not reassuring.", next: "" }, { label: "See you at the gate.", next: "" }],
      },
    },
  },
];

export const citizenById = (id: string) => CITIZENS.find((c) => c.id === id);

/** Where a citizen's talk starts, depending on their quest. */
export function citizenStart(d: TrackerData, c: Citizen): string {
  if (!c.quest) return "start";
  const st = questState(d, c.quest);
  if (st === "active") return "waiting";
  if (st === "done") return "after";
  return "start";
}

/** Small talk staff make when you ask how they're doing. Each has your two ways to answer, and theirs. */
export const STAFF_CHATS: { line: string; replies: [string, string][] }[] = [
  {
    line: "Can I tell you something weird? Reach in the north district dropped forty percent overnight. Like something swallowed it.",
    replies: [
      ["Probably just the algorithm.", "That's what scares me. Old Bram at the gate says the Algorithm is a beast that wakes up."],
      ["Keep an eye on it for me.", "Already am, boss. I'll put it in the Progress Room if it happens again."],
    ],
  },
  {
    line: "Honestly? I love this job. Some days I feel like I'm the only one keeping the Static away from our clients.",
    replies: [
      ["You're doing great.", "Ehehe… you didn't have to say that. But thanks. Really."],
      ["Less talking, more working.", "Yes boss! Right away boss! …Rude, but fair."],
    ],
  },
  {
    line: "Did you see the fountain last night? Pip swears it ran backwards. I was here late and the lamps went grey for a second.",
    replies: [
      ["You should go home earlier.", "And miss the drama? Never. Also there's a lot to do."],
      ["Tell me if it happens again.", "You'll be the first to know. Well, after Pip. Pip knows everything first."],
    ],
  },
  {
    line: "If that gate ever opens, I want to be on your team. I've been practicing my battle cry. Want to hear it?",
    replies: [
      ["Let's hear it!", "FOR THE CLIENTS!! …Okay that was louder than I meant."],
      ["Please don't.", "Too late, it's in my heart now. You'll hear it on the battlefield."],
    ],
  },
  {
    line: "Quick question: am I doing enough? Be honest. I can take it.",
    replies: [
      ["You're doing plenty.", "Okay. Okay! Good. I'll keep going then."],
      ["Fill in your checklist and you'll do more.", "Fair! Give me what's on my list and watch me fly."],
    ],
  },
  {
    line: "A client went quiet on us last week. Then I heard something scratching at the north gate. Coincidence, right?",
    replies: [
      ["Definitely a coincidence.", "Right. Totally. I'm going to send them a follow-up anyway. Just in case."],
      ["Follow up before it grows teeth.", "That's what Bram says too! Writing the follow-up now."],
    ],
  },
];

export const GATE: LoreNode[] = [
  {
    text: "A rusted iron gate wrapped in chains. Grey fog curls out from under it, and something on the other side breathes slow and deep. The sign reads: DANGER. DO NOT ENTER.",
    replies: [{ label: "Push the gate", next: "1" }, { label: "Back away", next: "" }],
  },
  {
    text: "The chains rattle but hold. From the fog, a whisper: \"…not yet, hero. Gear up. We'll be waiting.\" The gate is sealed, for now.",
    replies: [{ label: "…Okay then.", next: "" }],
  },
];

export interface Shopkeeper {
  kind: "weapons" | "armor";
  name: string;
  title: string;
  color: string;
  seed: string;
  greet: string;
  news: string;
  slots: string[];
}

export const SHOPKEEPERS: Record<"weapons" | "armor", Shopkeeper> = {
  weapons: {
    kind: "weapons",
    name: "Tetsu",
    title: "Blacksmith",
    color: "#ff9f1c",
    seed: "tetsu-smith",
    greet: "Welcome to Blade & Bolt! Every blade here is forged for one thing: what's coming out of that gate. Take your pick.",
    news: "Three nights now I've heard something scratching the north gate. I've been forging double. When it opens, you'll want something sharp.",
    slots: ["weapon", "pet"],
  },
  armor: {
    kind: "armor",
    name: "Madame Rhea",
    title: "Armorer",
    color: "#5ad1ff",
    seed: "rhea-armor",
    greet: "Iron Threads, darling. Armour, capes, masks, auras. Looking good is half of surviving. Try anything on.",
    news: "A customer came in from the north road with frost on her cape in October. She said the fog whispered her name. I gave her a halo, half price.",
    slots: ["hat", "face", "back", "aura"],
  },
};
