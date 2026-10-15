// Everything the player can change about their hero, in one list so the editor, the
// drawing and "Random look" all agree. Values are short ids; colours are #rrggbb.

import type { HeroLook } from "./types";
import { EYE, HAIR, OUTFIT, SKIN } from "./avatar";

export const HERO_DEFAULTS: Required<HeroLook> = {
  skin: "#ffd9b8",
  hair: "spiky",
  hairColor: "#2a2f7a",
  eyes: "#ffae00",
  eyeStyle: "hero",
  mouth: "auto",
  marks: "blush",
  eyewear: "none",
  headwear: "none",
  earrings: "none",
  top: "hero",
  outfit: "#2c2b6b",
  accent: "#ffd23f",
  emblem: "bolt",
  neck: "scarf",
  scarf: "#ff3b4f",
  back: "none",
  backColor: "#d62839",
  bottoms: "pants",
  bottomsColor: "",
  shoes: "#16131f",
  gloves: "none",
  achievementGear: true,
};

/** Hair styles: the four classic hero cuts plus the avatar set (index into avatars.tsx hair). */
export const HERO_HAIR: [string, string, number | null][] = [
  ["spiky", "Spiky hero", null],
  ["long", "Long layers", null],
  ["mohawk", "Big mohawk", null],
  ["bob", "Rounded bob", null],
  ["wild", "Wild spikes", 0],
  ["fringe", "Fringe bob", 1],
  ["swoop", "Side swoop", 2],
  ["messy", "Messy", 3],
  ["buzz", "Buzz cut", 4],
  ["crest", "Crest", 5],
  ["bun", "Top bun", 6],
  ["straight", "Long straight", 7],
  ["ponytail", "Ponytail", 8],
  ["twintails", "Twin tails", 9],
  ["wavy", "Long wavy", 10],
  ["hime", "Hime cut", 11],
  ["curly", "Curly", 12],
  ["pompadour", "Pompadour", 14],
  ["bald", "Bald", null],
];

const opt = (pairs: [string, string][]) => pairs;

export interface HeroOption {
  key: Exclude<keyof HeroLook, "achievementGear">;
  label: string;
  group: "Face" | "Hair" | "Outfit" | "Extras";
  choices?: [string, string][];
  colors?: string[];
}

const ACCENTS = ["#ffd23f", "#4fd2ff", "#ff5fae", "#6ee77a", "#f1f1f1", "#ff8a1f", "#d62839", "#7b2cbf", "#16131f", "#2ec4b6"];
const BOTTOMS = ["", "#16131f", "#2c2b6b", "#1d3557", "#5a3825", "#9aa0b4", "#f1f1f1", "#d62839", "#2b9348", "#7b2cbf"];

export const HERO_OPTIONS: HeroOption[] = [
  { key: "skin", label: "Skin", group: "Face", colors: SKIN },
  { key: "eyeStyle", label: "Eyes", group: "Face", choices: opt([["hero", "Hero"], ["0", "Anime"], ["1", "Sharp"], ["2", "Sparkly"], ["3", "Happy"], ["4", "Fierce"], ["5", "Sleepy"], ["6", "Wink"], ["7", "Glowing"], ["8", "Dots"]]) },
  { key: "eyes", label: "Eye colour", group: "Face", colors: EYE },
  { key: "mouth", label: "Mouth", group: "Face", choices: opt([["auto", "Hero smile"], ["0", "Smile"], ["1", "Big grin"], ["2", "Calm"], ["3", "Cat"], ["4", "Smirk"], ["5", "Surprised"], ["6", "Fang"], ["7", "Teeth"], ["8", "Serious"]]) },
  { key: "marks", label: "Face marks", group: "Face", choices: opt([["blush", "Blush"], ["none", "None"], ["freckles", "Freckles"], ["bandage", "Bandage"], ["scar", "Battle scar"], ["whiskers", "Whisker marks"], ["star", "Star mark"], ["mole", "Beauty mark"]]) },
  { key: "hair", label: "Hair style", group: "Hair", choices: HERO_HAIR.map(([v, l]) => [v, l]) },
  { key: "hairColor", label: "Hair colour", group: "Hair", colors: HAIR },
  { key: "headwear", label: "Headwear", group: "Hair", choices: opt([["none", "None"], ["cap", "Cap"], ["headband", "Headband"], ["catears", "Cat ears"], ["horns", "Little horns"], ["star", "Star clip"], ["headphones", "Headphones"], ["headset", "Headset"], ["beanie", "Beanie"], ["crown", "Mini crown"]]) },
  { key: "top", label: "Top", group: "Outfit", choices: opt([["hero", "Hero suit"], ["hoodie", "Hoodie"], ["jacket", "Open jacket"], ["uniform", "School blazer"], ["suit", "Business suit"], ["gi", "Martial arts gi"], ["armor", "Armor"], ["tee", "T-shirt"], ["tank", "Tank top"], ["sailor", "Sailor top"]]) },
  { key: "outfit", label: "Top colour", group: "Outfit", colors: OUTFIT },
  { key: "accent", label: "Trim colour", group: "Outfit", colors: ACCENTS },
  { key: "emblem", label: "Chest emblem", group: "Outfit", choices: opt([["bolt", "Bolt"], ["none", "None"], ["star", "Star"], ["heart", "Heart"], ["diamond", "Diamond"], ["flame", "Flame"], ["crown", "Crown"], ["coin", "Coin"]]) },
  { key: "bottoms", label: "Bottoms", group: "Outfit", choices: opt([["pants", "Pants"], ["shorts", "Shorts"], ["skirt", "Skirt"], ["cargo", "Cargo pants"]]) },
  { key: "bottomsColor", label: "Bottoms colour", group: "Outfit", colors: BOTTOMS },
  { key: "shoes", label: "Shoes", group: "Outfit", colors: ["#16131f", "#f1f1f1", "#d62839", "#ffd23f", "#4fd2ff", "#7b2cbf", "#5a3825", "#2b9348"] },
  { key: "gloves", label: "Gloves", group: "Outfit", choices: opt([["none", "None"], ["#f1f1f1", "White"], ["#16131f", "Black"], ["#d62839", "Red"], ["#ffd23f", "Gold"], ["#4fd2ff", "Cyan"]]) },
  { key: "neck", label: "Neck", group: "Extras", choices: opt([["scarf", "Hero scarf"], ["none", "None"], ["bandana", "Bandana"], ["necklace", "Necklace"], ["bow", "Bow"], ["tie", "Tie"]]) },
  { key: "scarf", label: "Neck colour", group: "Extras", colors: ["#ff3b4f", "#ffd23f", "#4fd2ff", "#16131f", "#f1f1f1", "#7b2cbf", "#6ee77a", "#ff8a1f", "#ff5fae"] },
  { key: "eyewear", label: "Eyewear", group: "Extras", choices: opt([["none", "None"], ["glasses", "Glasses"], ["round", "Round glasses"], ["shades", "Shades"], ["eyepatch", "Eyepatch"]]) },
  { key: "earrings", label: "Earrings", group: "Extras", choices: opt([["none", "None"], ["studs", "Gold studs"]]) },
  { key: "back", label: "On your back", group: "Extras", choices: opt([["none", "None"], ["cape", "Cape"], ["backpack", "Backpack"], ["wings", "Wings"], ["sword", "Sword sheath"]]) },
  { key: "backColor", label: "Back colour", group: "Extras", colors: ["#d62839", "#16131f", "#2c2b6b", "#ffd23f", "#f1f1f1", "#7b2cbf", "#2ec4b6", "#ff8a1f"] },
];

export const HERO_GROUPS = ["Face", "Hair", "Outfit", "Extras"] as const;

/** How many different looks the editor can make. */
export function heroLookCount(): number {
  return HERO_OPTIONS.reduce((a, o) => a * (o.choices?.length ?? o.colors?.length ?? 1), 1);
}

export function randomHeroLook(rand: () => number = Math.random): HeroLook {
  const look: HeroLook = {};
  for (const o of HERO_OPTIONS) {
    const list = o.choices ? o.choices.map((c) => c[0]) : o.colors ?? [];
    if (list.length) (look as Record<string, string>)[o.key] = list[Math.floor(rand() * list.length)];
  }
  return look;
}

/** The label for a look value, e.g. "Ponytail" for hair "ponytail". */
export function heroChoiceLabel(o: HeroOption, value: string | undefined): string {
  return o.choices?.find((c) => c[0] === value)?.[1] ?? value ?? "";
}
