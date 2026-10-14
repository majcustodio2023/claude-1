// Avatars are drawn from a short code like "person:3.1.0.5.2.7.4.0.9.1": a kind plus one
// number per trait (hair, eyes, colour…). No code means an automatic one picked from the
// name, so every person, boss and client gets a face without anyone choosing.

export type AvatarKind = "person" | "beast" | "monster" | "robot" | "emblem";

export const BG = ["#ffd23f", "#ff5f7a", "#5ad1ff", "#7c5cff", "#3ee08f", "#ff9f1c", "#f15bb5", "#00bbf9", "#9b5de5", "#fee440", "#2ec4b6", "#e63946", "#1d3557", "#f4a261", "#cdb4db", "#2b2d42"];
export const SKIN = ["#ffe3c8", "#ffd9b8", "#f5c49c", "#e8b48a", "#d39b6b", "#b97a4f", "#8d5a3b", "#6b4129", "#f9d7d0", "#c4e3ff", "#c8f2c2"];
export const HAIR = ["#1b1b2f", "#2a2f7a", "#5a3825", "#8b5a2b", "#d4a14a", "#f2d16b", "#f5f5f5", "#9aa0b4", "#ff5f7a", "#ff3b4f", "#ff9f1c", "#7c5cff", "#2ec4b6", "#3ee08f", "#5ad1ff", "#f15bb5", "#b5179e"];
export const EYE = ["#ffae00", "#3a86ff", "#2ec4b6", "#e63946", "#7c5cff", "#3ee08f", "#8b5a2b", "#1b1b2f", "#f15bb5", "#ffd23f"];
export const OUTFIT = ["#2c2b6b", "#e63946", "#1d3557", "#2ec4b6", "#ff9f1c", "#7c5cff", "#16151f", "#f5f5f5", "#3ee08f", "#f15bb5", "#5ad1ff", "#8b5a2b"];
export const FUR = ["#ff8c42", "#f5f5f5", "#9aa0b4", "#7a4a2a", "#d4a14a", "#2b2d42", "#ff5f7a", "#7c5cff", "#5ad1ff", "#3ee08f", "#ffd23f", "#b5179e", "#c08552", "#e63946"];
export const MONSTER = ["#7b2cbf", "#b5179e", "#d62839", "#2b9348", "#3a86ff", "#ff9f1c", "#5a189a", "#06d6a0", "#118ab2", "#ef476f", "#6c757d", "#ffd166", "#2b2d42", "#80ed99"];
export const METAL = ["#c0c7d6", "#5ad1ff", "#ff5f7a", "#ffd23f", "#3ee08f", "#7c5cff", "#ff9f1c", "#2c2b6b", "#f5f5f5", "#e63946", "#3a3a4a"];
export const EMBLEM_ICONS = [
  "swords", "shield", "dragon", "flame", "bolt", "star", "trophy", "crosshair", "rocket", "brain", "diamond", "coin", "income", "megaphone", "target",
  "fox", "robot", "demon", "helmet", "moon", "leaf", "boom", "sparkles", "gamepad", "chart", "briefcase", "handshake", "medal", "film", "home",
  "shop", "bank", "radar", "palette", "key", "lock", "gift", "scroll", "squad", "hexagon",
];

export interface Trait {
  key: string;
  label: string;
  count: number;
  /** Colour swatches, when the trait is a colour. */
  colors?: string[];
  names?: string[];
}

const bg: Trait = { key: "bg", label: "Background", count: BG.length, colors: BG };
const pattern: Trait = { key: "pattern", label: "Backdrop", count: 5, names: ["Plain", "Halftone", "Speed lines", "Stripes", "Sunburst"] };
const eyeColor: Trait = { key: "eyeColor", label: "Eye colour", count: EYE.length, colors: EYE };
const outfit: Trait = { key: "outfit", label: "Outfit", count: OUTFIT.length, colors: OUTFIT };
const EXTRAS = ["None", "Glasses", "Round glasses", "Headset", "Cap", "Headband", "Eyepatch", "Bandage", "Blush", "Earrings", "Cat ears", "Little horns", "Star clip", "Shades", "Headphones", "Freckles"];
const EYES = ["Anime", "Sharp", "Sparkly", "Happy", "Fierce", "Sleepy", "Wink", "Glowing", "Dots"];
const MOUTHS = ["Smile", "Big grin", "Calm", "Cat", "Smirk", "Surprised", "Fang", "Teeth", "Serious"];

export const AVATAR_TRAITS: Record<AvatarKind, Trait[]> = {
  person: [
    bg,
    pattern,
    { key: "skin", label: "Skin", count: SKIN.length, colors: SKIN },
    { key: "hair", label: "Hair", count: 15, names: ["Spiky", "Bob", "Side swoop", "Messy", "Buzz", "Mohawk", "Bun", "Long", "Ponytail", "Twin tails", "Wavy", "Hime cut", "Curly", "Hoodie", "Pompadour"] },
    { key: "hairColor", label: "Hair colour", count: HAIR.length, colors: HAIR },
    { key: "eyes", label: "Eyes", count: EYES.length, names: EYES },
    eyeColor,
    { key: "mouth", label: "Mouth", count: MOUTHS.length, names: MOUTHS },
    { key: "extra", label: "Extra", count: EXTRAS.length, names: EXTRAS },
    outfit,
  ],
  beast: [
    bg,
    pattern,
    { key: "species", label: "Animal", count: 13, names: ["Fox", "Cat", "Wolf", "Bear", "Panda", "Rabbit", "Owl", "Tiger", "Dragon", "Dog", "Monkey", "Penguin", "Raccoon"] },
    { key: "fur", label: "Fur", count: FUR.length, colors: FUR },
    { key: "eyes", label: "Eyes", count: EYES.length, names: EYES },
    eyeColor,
    { key: "mouth", label: "Mouth", count: MOUTHS.length, names: MOUTHS },
    { key: "extra", label: "Extra", count: EXTRAS.length, names: EXTRAS },
    outfit,
  ],
  monster: [
    bg,
    pattern,
    { key: "shape", label: "Body", count: 9, names: ["Demon", "Slime", "Ghost", "Skull", "Golem", "Cyclops", "Dragon", "Kraken", "Imp"] },
    { key: "color", label: "Colour", count: MONSTER.length, colors: MONSTER },
    { key: "eyes", label: "Eyes", count: 6, names: ["Angry", "Glowing", "One big eye", "Three eyes", "Beady", "Hollow"] },
    eyeColor,
    { key: "mouth", label: "Mouth", count: 6, names: ["Fangs", "Wide grin", "Tusks", "Stitched", "Roar", "Little fangs"] },
    { key: "horns", label: "Horns", count: 7, names: ["None", "Demon", "Ram", "Unicorn", "Antennae", "Spikes", "Bull"] },
    { key: "extra", label: "Extra", count: 7, names: ["None", "Crown", "Scar", "Flame aura", "Dark halo", "Bandage", "Forehead gem"] },
  ],
  robot: [
    bg,
    pattern,
    { key: "head", label: "Head", count: 6, names: ["Box", "Rounded", "Dome", "Wedge", "Hex", "Retro TV"] },
    { key: "color", label: "Plating", count: METAL.length, colors: METAL },
    { key: "visor", label: "Eyes", count: 7, names: ["Visor", "Round", "Mono-eye", "LED grid", "X eyes", "Angry", "Happy LEDs"] },
    { key: "glow", label: "Glow", count: EYE.length, colors: EYE },
    { key: "antenna", label: "Top", count: 6, names: ["None", "Antenna", "Twin antennae", "Radar ears", "Halo", "Fins"] },
    { key: "mouth", label: "Mouth", count: 5, names: ["Grill", "LED smile", "None", "Speaker", "Bolts"] },
  ],
  emblem: [
    bg,
    { key: "shape", label: "Shape", count: 7, names: ["Shield", "Circle", "Hexagon", "Star", "Diamond", "Banner", "Winged"] },
    { key: "icon", label: "Symbol", count: EMBLEM_ICONS.length, names: EMBLEM_ICONS },
    { key: "color", label: "Colour", count: MONSTER.length, colors: MONSTER },
    { key: "accent", label: "Trim", count: BG.length, colors: BG },
  ],
};

export const AVATAR_KINDS: { kind: AvatarKind; label: string }[] = [
  { kind: "person", label: "People" },
  { kind: "beast", label: "Animals" },
  { kind: "monster", label: "Bosses" },
  { kind: "robot", label: "Robots" },
  { kind: "emblem", label: "Emblems" },
];

export interface AvatarSpec {
  kind: AvatarKind;
  t: number[];
}

/** How many different avatars a kind can make. */
export function avatarCount(kind: AvatarKind): number {
  return AVATAR_TRAITS[kind].reduce((a, t) => a * t.count, 1);
}

export function encodeAvatar(a: AvatarSpec): string {
  return `${a.kind}:${a.t.join(".")}`;
}

export function parseAvatar(value: string | undefined): AvatarSpec | null {
  const m = value?.match(/^(person|beast|monster|robot|emblem):([\d.]+)$/);
  if (!m) return null;
  const kind = m[1] as AvatarKind;
  const traits = AVATAR_TRAITS[kind];
  const nums = m[2].split(".").map(Number);
  // Missing or out-of-range traits wrap round, so codes stay valid if options change.
  return { kind, t: traits.map((tr, i) => ((nums[i] ?? 0) % tr.count + tr.count) % tr.count) };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Small seeded random generator (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomAvatar(kind: AvatarKind, seed: number | string): AvatarSpec {
  const r = rng(typeof seed === "number" ? seed : hashString(seed));
  return { kind, t: AVATAR_TRAITS[kind].map((tr) => Math.floor(r() * tr.count)) };
}

/** The saved avatar, or an automatic one from the seed (usually the id or name). */
export function resolveAvatar(value: string | undefined, seed: string, kind: AvatarKind): AvatarSpec {
  return parseAvatar(value) ?? randomAvatar(kind, `${kind}|${seed}`);
}

/** A page of ready-made avatars to pick from. */
export function avatarPage(kind: AvatarKind, page: number, size = 48): AvatarSpec[] {
  return Array.from({ length: size }, (_, i) => randomAvatar(kind, `${kind}#${page}#${i}`));
}
