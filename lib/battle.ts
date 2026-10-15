// Turn-based boss battles. Gear you wear sets your stats and unlocks skills; bosses have
// their own moves, telegraph big attacks and get angry at low HP. Everything here is pure
// (pass in a random function), so the UI just plays back the events a round returns.

import { itemById } from "./items";
import type { FightRank } from "./loot";
import type { TrackerData } from "./types";

export type StatKey = "hp" | "atk" | "def" | "spd" | "crit";
export type Stats = Record<StatKey, number>;
export const STAT_LABEL: Record<StatKey, string> = { hp: "HP", atk: "Attack", def: "Defense", spd: "Speed", crit: "Crit %" };

export const BASE_STATS: Stats = { hp: 120, atk: 14, def: 6, spd: 10, crit: 8 };
export const MAX_ENERGY = 100;
const START_ENERGY = 30;
const ENERGY_PER_TURN = 15;
const ENERGY_WHEN_HIT = 8;
const CRIT_MULT = 1.8;

/** Look of a move, used for animation colours and sound. */
export type Fx = "slash" | "impact" | "fire" | "thunder" | "holy" | "dark" | "heal" | "shield" | "cosmic" | "laser" | "buff";

export type SkillId =
  | "strike" | "guard" | "smash"
  | "arcane" | "inferno" | "oni-rage" | "iaido" | "barrage" | "mend" | "quake" | "reap"
  | "resolve" | "dive" | "hellfire" | "aegis" | "bloom" | "thunder" | "shadow-step" | "supernova";

export interface Skill {
  id: SkillId;
  name: string;
  desc: string;
  /** Energy it costs. */
  cost: number;
  /** Rounds before it can be used again. */
  cooldown?: number;
  fx: Fx;
  power?: number;
  hits?: number;
  /** Extra crit chance, in percent. */
  critBonus?: number;
  /** Ignores the boss's defense. */
  pierce?: boolean;
  /** Share of max HP healed. */
  heal?: number;
  /** Share of damage dealt healed back. */
  lifesteal?: number;
  /** Share of max HP added as a shield. */
  shield?: number;
  buff?: { atk?: number; def?: number; turns: number };
  /** Heals this share of max HP each round for some rounds. */
  regen?: { pct: number; turns: number };
  status?: { kind: BossStatus; turns: number; chance: number };
  guard?: boolean;
  /** Dodges the boss's next attack. */
  dodge?: boolean;
  /** Next hit is a sure crit. */
  focus?: boolean;
  /** Always acts before the boss. */
  first?: boolean;
}

export type BossStatus = "burn" | "stun" | "weak" | "break";
export type HeroStatus = "poison" | "weak";
export const STATUS_LABEL: Record<BossStatus | HeroStatus, string> = { burn: "Burning", stun: "Stunned", weak: "Weakened", break: "Armor broken", poison: "Poisoned" };

export const SKILLS: Record<SkillId, Skill> = {
  strike: { id: "strike", name: "Strike", desc: "A solid hit. Free.", cost: 0, fx: "impact", power: 1 },
  guard: { id: "guard", name: "Guard", desc: "Take half damage this round and gain 20 extra energy.", cost: 0, fx: "shield", guard: true },
  smash: { id: "smash", name: "Hero Smash", desc: "A big 1.8x hit.", cost: 40, fx: "impact", power: 1.8 },
  arcane: { id: "arcane", name: "Arcane Bolt", desc: "1.6x magic that ignores defense.", cost: 30, fx: "cosmic", power: 1.6, pierce: true },
  inferno: { id: "inferno", name: "Inferno", desc: "1.4x fire, burns the boss for 3 rounds.", cost: 40, fx: "fire", power: 1.4, status: { kind: "burn", turns: 3, chance: 1 } },
  "oni-rage": { id: "oni-rage", name: "Oni Rage", desc: "+50% attack for 3 rounds, but -30% defense.", cost: 25, cooldown: 4, fx: "dark", buff: { atk: 0.5, def: -0.3, turns: 3 } },
  iaido: { id: "iaido", name: "Iaido Slash", desc: "2.2x lightning-fast cut, +40% crit chance.", cost: 45, fx: "slash", power: 2.2, critBonus: 40 },
  barrage: { id: "barrage", name: "Laser Barrage", desc: "4 shots of 0.55x, each can crit.", cost: 40, fx: "laser", power: 0.55, hits: 4 },
  mend: { id: "mend", name: "Mend", desc: "Heal 30% of your HP.", cost: 35, cooldown: 3, fx: "heal", heal: 0.3 },
  quake: { id: "quake", name: "Ground Pound", desc: "1.7x quake, 60% chance to stun the boss.", cost: 50, fx: "impact", power: 1.7, status: { kind: "stun", turns: 1, chance: 0.6 } },
  reap: { id: "reap", name: "Soul Reap", desc: "2.4x, heals you for half the damage.", cost: 55, fx: "dark", power: 2.4, lifesteal: 0.5 },
  resolve: { id: "resolve", name: "Hero's Resolve", desc: "+30% attack and defense for 3 rounds.", cost: 25, cooldown: 4, fx: "buff", buff: { atk: 0.3, def: 0.3, turns: 3 } },
  dive: { id: "dive", name: "Aerial Dive", desc: "1.5x, always goes first and dodges the next attack.", cost: 35, fx: "impact", power: 1.5, first: true, dodge: true },
  hellfire: { id: "hellfire", name: "Hellfire", desc: "1.3x, burns and weakens the boss.", cost: 40, fx: "fire", power: 1.3, status: { kind: "burn", turns: 3, chance: 1 } },
  aegis: { id: "aegis", name: "Divine Aegis", desc: "Shield for 35% of your HP and heal 15%.", cost: 40, cooldown: 3, fx: "holy", shield: 0.35, heal: 0.15 },
  bloom: { id: "bloom", name: "Sakura Bloom", desc: "Heal 10% of your HP each round for 3 rounds.", cost: 30, cooldown: 4, fx: "heal", regen: { pct: 0.1, turns: 3 } },
  thunder: { id: "thunder", name: "Thunderclap", desc: "1.4x, breaks armor: boss takes +30% for 2 rounds.", cost: 35, fx: "thunder", power: 1.4, status: { kind: "break", turns: 2, chance: 1 } },
  "shadow-step": { id: "shadow-step", name: "Shadow Step", desc: "Dodge the next attack; your next hit is a sure crit.", cost: 25, cooldown: 3, fx: "dark", dodge: true, focus: true },
  supernova: { id: "supernova", name: "Supernova", desc: "3.2x cosmic blast that ignores defense.", cost: 90, fx: "cosmic", power: 3.2, pierce: true },
};

export type Passive = "nimble" | "fury" | "halo" | "bulwark" | "flame-crits" | "sharp-eye" | "kit-beat" | "fox-fire";
export const PASSIVE_DESC: Record<Passive, string> = {
  nimble: "10% chance to dodge any attack",
  fury: "+25% damage while under half HP",
  halo: "Heal 4% of your HP every round",
  bulwark: "Guard blocks 80% instead of 50%",
  "flame-crits": "Crits set the boss on fire",
  "sharp-eye": "Crits deal 2.2x instead of 1.8x",
  "kit-beat": "Kit's beat gives +5 energy every round",
  "fox-fire": "Kit throws fox fire every 3 rounds",
};

export interface Pet {
  name: string;
  power: number;
  status?: { kind: BossStatus; chance: number };
}

export interface ItemPower {
  stats: Partial<Stats>;
  skill?: SkillId;
  passive?: Passive;
  pet?: Pet;
}

/** What each piece of gear does in battle. Every wearable item has an entry. */
export const ITEM_POWER: Record<string, ItemPower> = {
  "cat-ears": { stats: { spd: 3, crit: 2 }, passive: "nimble" },
  "devil-horns": { stats: { atk: 4, hp: 10 }, passive: "fury" },
  halo: { stats: { hp: 20, def: 1 }, passive: "halo" },
  "wizard-hat": { stats: { atk: 2, crit: 2 }, skill: "arcane" },
  kabuto: { stats: { def: 6, hp: 30 }, passive: "bulwark" },
  "flame-crown": { stats: { atk: 5, hp: 30, crit: 4 }, skill: "inferno", passive: "flame-crits" },
  shades: { stats: { crit: 5 }, passive: "sharp-eye" },
  eyepatch: { stats: { crit: 4, atk: 2 } },
  scar: { stats: { atk: 3, crit: 4, hp: 10 } },
  "oni-mask": { stats: { atk: 5, crit: 3 }, skill: "oni-rage" },
  katana: { stats: { atk: 6, spd: 2 }, skill: "iaido" },
  laser: { stats: { atk: 5, crit: 2 }, skill: "barrage" },
  staff: { stats: { atk: 4, hp: 15 }, skill: "mend" },
  hammer: { stats: { atk: 9, spd: -2 }, skill: "quake" },
  scythe: { stats: { atk: 11, crit: 5 }, skill: "reap" },
  "red-cape": { stats: { hp: 15, def: 1 }, skill: "resolve" },
  jetpack: { stats: { spd: 6 }, skill: "dive" },
  "demon-wings": { stats: { atk: 4, spd: 3, hp: 15 }, skill: "hellfire" },
  "angel-wings": { stats: { hp: 40, def: 4, spd: 3 }, skill: "aegis" },
  sakura: { stats: { hp: 15, spd: 2 }, skill: "bloom" },
  electric: { stats: { atk: 3, spd: 4 }, skill: "thunder" },
  shadow: { stats: { spd: 4, crit: 6 }, skill: "shadow-step" },
  galaxy: { stats: { atk: 6, hp: 30, def: 2, spd: 3, crit: 4 }, skill: "supernova" },
  slime: { stats: { hp: 10 }, pet: { name: "Slime", power: 0.3 } },
  ghost: { stats: { hp: 10, spd: 1 }, pet: { name: "Ghost", power: 0.35, status: { kind: "weak", chance: 0.25 } } },
  "mini-dragon": { stats: { hp: 20, atk: 2 }, pet: { name: "Mini dragon", power: 0.55, status: { kind: "burn", chance: 0.25 } } },
  "kit-bow": { stats: { hp: 8 } },
  "kit-ninja": { stats: { spd: 2 } },
  "kit-headphones": { stats: { hp: 5 }, passive: "kit-beat" },
  "kit-wizard": { stats: { atk: 2 } },
  "kit-crown": { stats: { hp: 20, def: 2 } },
  "kit-shades": { stats: { crit: 3 } },
  "kit-monocle": { stats: { crit: 4 } },
  "kit-bell": { stats: { hp: 10 } },
  "kit-bandana": { stats: { spd: 2 } },
  "kit-chain": { stats: { atk: 3, def: 2 } },
  "kit-ninetails": { stats: { atk: 5, hp: 20 }, passive: "fox-fire" },
};

/** Achievement gear (earned on the Hero card) adds this much per piece. */
export const ACHIEVEMENT_BONUS: Partial<Stats> = { hp: 8, atk: 1, def: 1 };
/** Each hero level adds this much, up to LEVEL_CAP levels. */
export const LEVEL_BONUS: Partial<Stats> = { hp: 5, atk: 1 };
const LEVEL_CAP = 12;

export interface Loadout {
  stats: Stats;
  /** Where each stat came from, for the stats card. */
  sources: { label: string; stats: Partial<Stats> }[];
  skills: SkillId[];
  passives: Passive[];
  pets: Pet[];
  /** Kit items worn: Kit's cheer heals more with each. */
  kitGear: number;
}

const add = (a: Stats, b: Partial<Stats>, times = 1) => {
  for (const k of Object.keys(b) as StatKey[]) a[k] += (b[k] ?? 0) * times;
};

/** Stats and skills from what the hero is wearing, their achievement gear and level. */
export function heroLoadout(equipped: string[], achievements = 0, level = 1): Loadout {
  const stats = { ...BASE_STATS };
  const sources: Loadout["sources"] = [{ label: "Base", stats: { ...BASE_STATS } }];
  const lv = Math.max(0, Math.min(LEVEL_CAP, level - 1));
  if (lv) {
    const s: Partial<Stats> = {};
    for (const k of Object.keys(LEVEL_BONUS) as StatKey[]) s[k] = LEVEL_BONUS[k]! * lv;
    add(stats, s);
    sources.push({ label: `Level ${level}`, stats: s });
  }
  if (achievements) {
    const s: Partial<Stats> = {};
    for (const k of Object.keys(ACHIEVEMENT_BONUS) as StatKey[]) s[k] = ACHIEVEMENT_BONUS[k]! * achievements;
    add(stats, s);
    sources.push({ label: `Achievement gear x${achievements}`, stats: s });
  }
  const skills: SkillId[] = ["strike", "guard", "smash"];
  const passives: Passive[] = [];
  const pets: Pet[] = [];
  let kitGear = 0;
  for (const id of equipped) {
    const p = ITEM_POWER[id];
    if (!p) continue;
    add(stats, p.stats);
    sources.push({ label: itemById(id)?.name ?? id, stats: p.stats });
    if (p.skill && !skills.includes(p.skill)) skills.push(p.skill);
    if (p.passive && !passives.includes(p.passive)) passives.push(p.passive);
    if (p.pet) pets.push(p.pet);
    if (id.startsWith("kit-")) kitGear++;
  }
  stats.spd = Math.max(1, stats.spd);
  stats.crit = Math.min(75, stats.crit);
  return { stats, sources, skills, passives, pets, kitGear };
}

/** The loadout for the player's current gear, achievements and level. */
export function loadoutFor(data: TrackerData, level: number): Loadout {
  const equipped = Object.values(data.game?.equipped ?? {}).filter(Boolean) as string[];
  return heroLoadout(equipped, Object.keys(data.heroGear ?? {}).length, level);
}

// ---------- Bosses ----------

export type BossMoveId = "slam" | "flurry" | "drain" | "creep" | "harden" | "heal" | "ghost" | "charge" | "unleash";

export interface BossMove {
  id: BossMoveId;
  name: string;
  desc: string;
  fx: Fx;
  power?: number;
  hits?: number;
  heal?: number;
  status?: { kind: HeroStatus; turns: number };
  /** Takes this much energy from the hero. */
  drainEnergy?: number;
  defBuff?: number;
}

export const BOSS_MOVES: Record<BossMoveId, BossMove> = {
  slam: { id: "slam", name: "Budget Cut", desc: "A heavy swing.", fx: "impact", power: 1 },
  flurry: { id: "flurry", name: "Endless Revisions", desc: "3 quick hits.", fx: "slash", power: 0.42, hits: 3 },
  drain: { id: "drain", name: "Late Payment", desc: "Poisons you for 3 rounds.", fx: "dark", power: 0.7, status: { kind: "poison", turns: 3 } },
  creep: { id: "creep", name: "Scope Creep", desc: "Weakens you: -25% damage for 2 rounds.", fx: "dark", power: 0.6, status: { kind: "weak", turns: 2 } },
  harden: { id: "harden", name: "Fine Print", desc: "Raises its defense for 3 rounds.", fx: "shield", defBuff: 0.6 },
  heal: { id: "heal", name: "Discount Request", desc: "Heals 12% of its HP.", fx: "heal", heal: 0.12 },
  ghost: { id: "ghost", name: "Ghosted", desc: "A sneaky hit that drains 25 energy.", fx: "dark", power: 0.75, drainEnergy: 25 },
  charge: { id: "charge", name: "Charging up", desc: "Gathering power for a huge attack next round. Guard!", fx: "buff" },
  unleash: { id: "unleash", name: "Mega Invoice", desc: "A huge 2.6x attack.", fx: "fire", power: 2.6 },
};

const OPTIONAL_MOVES: BossMoveId[] = ["flurry", "drain", "creep", "harden", "heal", "ghost"];

export interface BossSpec {
  name: string;
  tier: number;
  stats: Stats;
  moves: BossMoveId[];
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Bigger deals make tougher bosses: tier 1 to 10 by the deal's share of the monthly goal. */
export function bossTier(dealValue: number, goal: number): number {
  if (!(goal > 0)) return 4;
  return Math.max(1, Math.min(10, Math.round((dealValue / goal) * 10)));
}

export function makeBoss(name: string, seed: string, tier: number): BossSpec {
  const t = Math.max(1, Math.min(10, tier));
  const h = hash(seed);
  // Three of the optional moves, picked by the deal so each boss fights differently.
  const pool = [...OPTIONAL_MOVES];
  const moves: BossMoveId[] = ["slam", "charge"];
  for (let i = 0; i < 3; i++) moves.push(pool.splice((h >>> (i * 5)) % pool.length, 1)[0]);
  return {
    name,
    tier: t,
    stats: { hp: 130 + t * 26, atk: 10 + t * 1.25, def: 3 + t * 0.8, spd: 7 + t, crit: 5 + t },
    moves,
  };
}

// ---------- Battle state ----------

interface Timed<K> {
  kind: K;
  turns: number;
}

export interface HeroSide {
  maxHp: number;
  hp: number;
  energy: number;
  shield: number;
  stats: Stats;
  statuses: Timed<HeroStatus>[];
  buffs: { atk: number; def: number; turns: number }[];
  regen: { pct: number; turns: number }[];
  cooldowns: Partial<Record<SkillId, number>>;
  dodge: boolean;
  focus: boolean;
}

export interface BossSide {
  name: string;
  maxHp: number;
  hp: number;
  stats: Stats;
  statuses: Timed<BossStatus>[];
  defBuff: { pct: number; turns: number } | null;
  moves: BossMoveId[];
  /** What it will do next round (shown to the player). */
  intent: BossMoveId;
  enraged: boolean;
  lastHeal: number;
}

export interface Battle {
  round: number;
  hero: HeroSide;
  boss: BossSide;
  loadout: Loadout;
  over: "win" | "lose" | null;
  log: string[];
}

export type BattleEvent =
  | { kind: "act"; who: "hero" | "boss" | "pet" | "kit"; name: string; fx: Fx; special: boolean }
  | { kind: "damage"; target: "hero" | "boss"; amount: number; crit: boolean; fx: Fx; blocked?: boolean }
  | { kind: "heal"; target: "hero" | "boss"; amount: number }
  | { kind: "shield"; amount: number }
  | { kind: "dodge"; who: "hero" }
  | { kind: "status"; target: "hero" | "boss"; text: string }
  | { kind: "energy"; amount: number }
  | { kind: "text"; text: string }
  | { kind: "enrage" }
  | { kind: "end"; result: "win" | "lose" };

export function startBattle(loadout: Loadout, spec: BossSpec): Battle {
  const boss: BossSide = {
    name: spec.name,
    maxHp: Math.round(spec.stats.hp),
    hp: Math.round(spec.stats.hp),
    stats: spec.stats,
    statuses: [],
    defBuff: null,
    moves: spec.moves,
    intent: "slam",
    enraged: false,
    lastHeal: -9,
  };
  return {
    round: 1,
    hero: {
      maxHp: loadout.stats.hp,
      hp: loadout.stats.hp,
      energy: START_ENERGY,
      shield: 0,
      stats: loadout.stats,
      statuses: [],
      buffs: [],
      regen: [],
      cooldowns: {},
      dodge: false,
      focus: false,
    },
    boss,
    loadout,
    over: null,
    log: [],
  };
}

const has = (b: Battle, p: Passive) => b.loadout.passives.includes(p);

/** Why a skill can't be used right now, or null if it can. */
export function skillBlocked(b: Battle, id: SkillId): string | null {
  const s = SKILLS[id];
  const cd = b.hero.cooldowns[id] ?? 0;
  if (cd > 0) return `Ready in ${cd} round${cd === 1 ? "" : "s"}`;
  if (b.hero.energy < s.cost) return `Needs ${s.cost} energy`;
  return null;
}

function heroAtk(b: Battle): number {
  const h = b.hero;
  let m = 1 + h.buffs.reduce((a, x) => a + x.atk, 0);
  if (h.statuses.some((s) => s.kind === "weak")) m *= 0.75;
  if (has(b, "fury") && h.hp < h.maxHp / 2) m *= 1.25;
  return h.stats.atk * m;
}

function heroDef(b: Battle): number {
  return Math.max(0, b.hero.stats.def * (1 + b.hero.buffs.reduce((a, x) => a + x.def, 0)));
}

function bossDef(b: Battle): number {
  return b.boss.stats.def * (1 + (b.boss.defBuff?.pct ?? 0));
}

const mitigate = (raw: number, def: number) => raw * (40 / (40 + def));

function hitBoss(b: Battle, ev: BattleEvent[], power: number, rand: () => number, opts: { critBonus?: number; pierce?: boolean; fx: Fx; atk?: number; canCrit?: boolean }): number {
  const crit = opts.canCrit !== false && (b.hero.focus || rand() * 100 < b.hero.stats.crit + (opts.critBonus ?? 0));
  if (crit) b.hero.focus = false;
  let dmg = (opts.atk ?? heroAtk(b)) * power * (0.92 + rand() * 0.16);
  if (!opts.pierce) dmg = mitigate(dmg, bossDef(b));
  if (crit) dmg *= has(b, "sharp-eye") ? 2.2 : CRIT_MULT;
  if (b.boss.statuses.some((s) => s.kind === "break")) dmg *= 1.3;
  const amount = Math.max(1, Math.round(dmg));
  b.boss.hp = Math.max(0, b.boss.hp - amount);
  ev.push({ kind: "damage", target: "boss", amount, crit, fx: opts.fx });
  if (crit && has(b, "flame-crits")) addBossStatus(b, ev, "burn", 2);
  return amount;
}

function addBossStatus(b: Battle, ev: BattleEvent[], kind: BossStatus, turns: number) {
  const cur = b.boss.statuses.find((s) => s.kind === kind);
  if (cur) cur.turns = Math.max(cur.turns, turns);
  else b.boss.statuses.push({ kind, turns });
  ev.push({ kind: "status", target: "boss", text: STATUS_LABEL[kind] });
}

function healHero(b: Battle, ev: BattleEvent[], amount: number) {
  const h = b.hero;
  const got = Math.min(Math.round(amount), h.maxHp - h.hp);
  if (got <= 0) return;
  h.hp += got;
  ev.push({ kind: "heal", target: "hero", amount: got });
}

function heroAct(b: Battle, id: SkillId, ev: BattleEvent[], rand: () => number) {
  const s = SKILLS[id];
  const h = b.hero;
  h.energy -= s.cost;
  if (s.cooldown) h.cooldowns[id] = s.cooldown + 1;
  ev.push({ kind: "act", who: "hero", name: s.name, fx: s.fx, special: id !== "strike" && id !== "guard" });
  if (s.guard) ev.push({ kind: "text", text: "You brace yourself." });
  if (s.power) {
    let dealt = 0;
    for (let i = 0; i < (s.hits ?? 1) && b.boss.hp > 0; i++) dealt += hitBoss(b, ev, s.power, rand, { critBonus: s.critBonus, pierce: s.pierce, fx: s.fx });
    if (s.lifesteal) healHero(b, ev, dealt * s.lifesteal);
  }
  if (s.heal) healHero(b, ev, h.maxHp * s.heal);
  if (s.shield) {
    const amt = Math.round(h.maxHp * s.shield);
    h.shield += amt;
    ev.push({ kind: "shield", amount: amt });
  }
  if (s.buff) {
    h.buffs.push({ atk: s.buff.atk ?? 0, def: s.buff.def ?? 0, turns: s.buff.turns });
    ev.push({ kind: "status", target: "hero", text: s.buff.atk && s.buff.def && s.buff.def > 0 ? "Power up!" : "Attack up!" });
  }
  if (s.regen) {
    h.regen.push({ ...s.regen });
    ev.push({ kind: "status", target: "hero", text: "Regenerating" });
  }
  if (s.status && b.boss.hp > 0 && rand() < s.status.chance) addBossStatus(b, ev, s.status.kind, s.status.turns);
  if (id === "hellfire" && b.boss.hp > 0) addBossStatus(b, ev, "weak", 2);
  if (s.dodge) h.dodge = true;
  if (s.focus) {
    h.focus = true;
    ev.push({ kind: "status", target: "hero", text: "Focused: next hit crits" });
  }
}

function bossAct(b: Battle, ev: BattleEvent[], rand: () => number, guarding: boolean) {
  const boss = b.boss;
  if (boss.statuses.some((s) => s.kind === "stun")) {
    ev.push({ kind: "text", text: `${boss.name} is stunned and can't move!` });
    // A stunned boss loses its charge too.
    return;
  }
  const move = BOSS_MOVES[boss.intent];
  ev.push({ kind: "act", who: "boss", name: move.name, fx: move.fx, special: move.id === "unleash" || move.id === "charge" });
  if (move.heal) {
    const got = Math.min(Math.round(boss.maxHp * move.heal), boss.maxHp - boss.hp);
    boss.hp += got;
    boss.lastHeal = b.round;
    ev.push({ kind: "heal", target: "boss", amount: got });
  }
  if (move.defBuff) {
    boss.defBuff = { pct: move.defBuff, turns: 3 };
    ev.push({ kind: "status", target: "boss", text: "Defense up" });
  }
  if (move.id === "charge") ev.push({ kind: "text", text: `${boss.name} is charging a huge attack!` });
  if (move.power) {
    const h = b.hero;
    for (let i = 0; i < (move.hits ?? 1) && h.hp > 0; i++) {
      if (h.dodge || (has(b, "nimble") && rand() < 0.1)) {
        h.dodge = false;
        ev.push({ kind: "dodge", who: "hero" });
        continue;
      }
      let atk = boss.stats.atk * (boss.enraged ? 1.3 : 1);
      if (boss.statuses.some((s) => s.kind === "weak")) atk *= 0.7;
      const crit = rand() * 100 < boss.stats.crit;
      let dmg = mitigate(atk * move.power * (0.92 + rand() * 0.16), heroDef(b));
      if (crit) dmg *= 1.5;
      if (guarding) dmg *= has(b, "bulwark") ? 0.2 : 0.5;
      let amount = Math.max(1, Math.round(dmg));
      let blocked = false;
      if (h.shield > 0) {
        const soak = Math.min(h.shield, amount);
        h.shield -= soak;
        amount -= soak;
        blocked = soak > 0;
      }
      h.hp = Math.max(0, h.hp - amount);
      h.energy = Math.min(MAX_ENERGY, h.energy + ENERGY_WHEN_HIT);
      ev.push({ kind: "damage", target: "hero", amount, crit, fx: move.fx, blocked: blocked || guarding });
    }
    if (move.status && h.hp > 0) {
      const cur = h.statuses.find((s) => s.kind === move.status!.kind);
      if (cur) cur.turns = Math.max(cur.turns, move.status.turns);
      else h.statuses.push({ ...move.status });
      ev.push({ kind: "status", target: "hero", text: STATUS_LABEL[move.status.kind] });
    }
    if (move.drainEnergy) {
      const lost = Math.min(h.energy, move.drainEnergy);
      h.energy -= lost;
      if (lost) ev.push({ kind: "energy", amount: -lost });
    }
  }
}

/** Picks what the boss does next round. Charges up every few rounds, heals when hurt. */
function chooseIntent(b: Battle, rand: () => number): BossMoveId {
  const boss = b.boss;
  if (boss.intent === "charge") return "unleash";
  const every = boss.enraged ? 3 : 4;
  if (b.round % every === 0) return "charge";
  const opts = boss.moves.filter((m) => m !== "charge" && m !== "unleash");
  const usable = opts.filter((m) => {
    if (m === "heal") return boss.hp < boss.maxHp * 0.6 && b.round - boss.lastHeal >= 4;
    if (m === "harden") return !boss.defBuff;
    if (m === "drain") return !b.hero.statuses.some((s) => s.kind === "poison");
    if (m === "creep") return !b.hero.statuses.some((s) => s.kind === "weak");
    return true;
  });
  if (usable.includes("heal")) return "heal";
  // Basic slam is the most common move.
  const weighted = [...usable, "slam", "slam"] as BossMoveId[];
  return weighted[Math.floor(rand() * weighted.length)];
}

function tick<T extends { turns: number }>(list: T[]): T[] {
  return list.map((x) => ({ ...x, turns: x.turns - 1 })).filter((x) => x.turns > 0);
}

/** Plays one round: your move and the boss's, in speed order, then end-of-round effects. */
export function playRound(prev: Battle, id: SkillId, rand: () => number = Math.random): { battle: Battle; events: BattleEvent[] } {
  const b: Battle = structuredClone(prev);
  const ev: BattleEvent[] = [];
  if (b.over || skillBlocked(b, id)) return { battle: prev, events: [] };
  const s = SKILLS[id];
  const guarding = !!s.guard;
  const heroFirst = guarding || s.first || b.hero.stats.spd >= b.boss.stats.spd;
  const hero = () => {
    if (b.hero.hp <= 0) return;
    // The boss may have drained energy before you moved.
    if (skillBlocked(b, id)) {
      ev.push({ kind: "text", text: `Not enough energy for ${s.name}! You strike instead.` });
      return heroAct(b, "strike", ev, rand);
    }
    heroAct(b, id, ev, rand);
  };
  const boss = () => b.boss.hp > 0 && bossAct(b, ev, rand, guarding);
  if (heroFirst) {
    hero();
    boss();
  } else {
    boss();
    hero();
  }

  const h = b.hero;
  const bs = b.boss;
  // Pets and Kit chip in.
  for (const pet of b.loadout.pets) {
    if (bs.hp <= 0) break;
    ev.push({ kind: "act", who: "pet", name: pet.name, fx: pet.status?.kind === "burn" ? "fire" : "impact", special: false });
    hitBoss(b, ev, pet.power, rand, { fx: "impact", canCrit: false });
    if (pet.status && bs.hp > 0 && rand() < pet.status.chance) addBossStatus(b, ev, pet.status.kind, 2);
  }
  if (b.round % 3 === 0 && h.hp > 0) {
    ev.push({ kind: "act", who: "kit", name: "Kit's cheer", fx: "heal", special: false });
    healHero(b, ev, h.maxHp * (0.05 + 0.02 * b.loadout.kitGear));
    if (has(b, "fox-fire") && bs.hp > 0) hitBoss(b, ev, 1.2, rand, { fx: "fire", pierce: true, canCrit: false });
  }

  // Burn and poison, regen, then timers.
  if (bs.hp > 0 && bs.statuses.some((x) => x.kind === "burn")) {
    const amount = Math.max(1, Math.round(h.stats.atk * 0.6));
    bs.hp = Math.max(0, bs.hp - amount);
    ev.push({ kind: "damage", target: "boss", amount, crit: false, fx: "fire" });
  }
  if (h.hp > 0 && h.statuses.some((x) => x.kind === "poison")) {
    const amount = Math.max(1, Math.round(h.maxHp * 0.05));
    h.hp = Math.max(1, h.hp - amount); // poison never finishes you off
    ev.push({ kind: "damage", target: "hero", amount, crit: false, fx: "dark" });
  }
  if (h.hp > 0) {
    for (const r of h.regen) healHero(b, ev, h.maxHp * r.pct);
    if (has(b, "halo")) healHero(b, ev, h.maxHp * 0.04);
  }
  h.regen = tick(h.regen);
  h.buffs = tick(h.buffs);
  h.statuses = tick(h.statuses);
  bs.statuses = tick(bs.statuses);
  if (bs.defBuff && --bs.defBuff.turns <= 0) bs.defBuff = null;
  for (const k of Object.keys(h.cooldowns) as SkillId[]) if (--h.cooldowns[k]! <= 0) delete h.cooldowns[k];
  h.energy = Math.min(MAX_ENERGY, h.energy + ENERGY_PER_TURN + (guarding ? 20 : 0) + (has(b, "kit-beat") ? 5 : 0));

  if (bs.hp <= 0) b.over = "win";
  else if (h.hp <= 0) b.over = "lose";
  if (b.over) {
    ev.push({ kind: "end", result: b.over });
    return { battle: b, events: ev };
  }
  if (!bs.enraged && bs.hp < bs.maxHp * 0.35) {
    bs.enraged = true;
    ev.push({ kind: "enrage" });
  }
  b.round++;
  bs.intent = chooseIntent(b, rand);
  return { battle: b, events: ev };
}

/** Rank for a finished fight: faster wins with more HP left rank higher. */
export function battleRank(b: Battle): FightRank {
  if (b.over !== "win") return "C";
  const hp = b.hero.hp / b.hero.maxHp;
  const rounds = b.round;
  if (hp >= 0.5 && rounds <= 10) return "S";
  if (hp >= 0.25 && rounds <= 14) return "A";
  return "B";
}

/** A simple sensible player, used by tests to check the balance. */
export function autoPick(b: Battle): SkillId {
  const can = (id: SkillId) => b.loadout.skills.includes(id) && !skillBlocked(b, id);
  if (b.boss.intent === "unleash") return can("shadow-step") ? "shadow-step" : can("aegis") ? "aegis" : "guard";
  if (b.hero.hp < b.hero.maxHp * 0.4) for (const id of ["mend", "aegis", "bloom"] as SkillId[]) if (can(id)) return id;
  const attacks = b.loadout.skills.filter((id) => SKILLS[id].power && can(id)).sort((x, y) => SKILLS[y].cost - SKILLS[x].cost);
  return attacks[0] ?? "strike";
}

const SHORT: Record<StatKey, string> = { hp: "HP", atk: "ATK", def: "DEF", spd: "SPD", crit: "CRIT" };

/** "+6 ATK, +2 SPD" for a set of stat changes. */
export function statText(stats: Partial<Stats>): string {
  return (Object.keys(SHORT) as StatKey[])
    .filter((k) => stats[k])
    .map((k) => `${stats[k]! > 0 ? "+" : ""}${stats[k]}${k === "crit" ? "%" : ""} ${SHORT[k]}`)
    .join(", ");
}

/** What an item does in battle, in one short line for the shop and inventory. */
export function itemPowerText(id: string): { stats: string; extra?: string } {
  const p = ITEM_POWER[id];
  if (!p) return { stats: "" };
  const extra = p.skill ? `Skill: ${SKILLS[p.skill].name}` : p.pet ? `Fights with you every round` : p.passive ? PASSIVE_DESC[p.passive] : undefined;
  return { stats: statText(p.stats), extra };
}
