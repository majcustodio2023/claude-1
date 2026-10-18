"use client";

import { useState } from "react";
import { ITEMS, RARITY, SLOT_LABEL, isKitSlot, itemById, shopStock, type Item } from "@/lib/items";
import { PERSONAS } from "@/lib/personas";
import { REWARD, buyItem, ensureGame } from "@/lib/loot";
import type { HeroLook, ItemSlot } from "@/lib/types";
import { useTracker } from "../App";
import { Hero, KIT_LOOKS, Kit, shade } from "../characters";
import { HERO_DEFAULTS, HERO_GROUPS, HERO_OPTIONS, heroChoiceLabel, heroLookCount, randomHeroLook, type HeroOption } from "@/lib/heroLook";
import { EditButton, Field, SaveButton } from "../editable";
import { Badge, Btn, Card, toast } from "../ui";
import { HELP } from "../help";
import { Glyph, Icon } from "../icons";
import BossFight, { useHeroLevel } from "../BossFight";
import { PASSIVE_DESC, SKILLS, STAT_LABEL, itemPowerText, loadoutFor, statText, type StatKey } from "@/lib/battle";
import { sfx } from "@/lib/sound";
import { COVERS, CUSTOM_COVER, activeCover, buyCover, ownsCover, type Cover } from "@/lib/covers";
import { CoverArt, shrinkCover } from "../covers";
import { useRef } from "react";

const SLOTS: ItemSlot[] = ["hat", "face", "weapon", "back", "aura", "pet", "kit-head", "kit-face", "kit-neck", "kit-tail"];
const FURS = ["#ff8a1f", "#2b2140", "#ff5fae", "#8a6a3a", "#4f6bff", "#f4efe4", "#e8e8f0", "#d62839", "#6ee77a", "#ffd23f"];

export default function HeroTab() {
  const { data, update, today } = useTracker();
  const game = data.game;
  const equipped = Object.values(game?.equipped ?? {}).filter(Boolean) as string[];
  const stock = shopStock(today);
  const gear = Object.keys(data.heroGear ?? {});

  const equip = (slot: ItemSlot, id?: string) =>
    update((d) => {
      const g = ensureGame(d, today);
      if (id) g.equipped[slot] = id;
      else delete g.equipped[slot];
    });
  const buy = (item: Item) => {
    // Check against what's on screen first; the same checks run again inside the update.
    const err = buyItem(structuredClone(data), item.id, today);
    if (err) return toast(err);
    update((d) => void buyItem(d, item.id, today));
    sfx("coin");
    toast(`Bought ${item.name}! Equipped.`);
  };

  return (
    <div className="space-y-5">
      <HeroLocker />

      <CoverShop />

      <BattleStats />

      <KitLocker />

      <Card title="Your items" icon="🎒" help={HELP.inventory}>
        {!game?.owned.length ? (
          <p className="text-lg text-muted">No items yet. Buy some in the shop below, or find loot in <Icon name="gift" size={20} /> tasks and boss fights.</p>
        ) : (
          <div className="space-y-3">
            {SLOTS.map((slot) => {
              const mine = ITEMS.filter((i) => i.slot === slot && game.owned.includes(i.id));
              if (!mine.length) return null;
              return (
                <div key={slot} className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-lg tracking-wide w-20">{SLOT_LABEL[slot]}</span>
                  <button className={`btn ${!game.equipped[slot] ? "btn-primary" : "btn-ghost"} px-3`} onClick={() => equip(slot)}>
                    None
                  </button>
                  {mine.map((i) => (
                    <button key={i.id} className={`btn ${game.equipped[slot] === i.id ? "btn-primary" : "btn-ghost"} px-3 flex-col !items-start !gap-0 text-left`} onClick={() => equip(slot, i.id)} style={{ borderColor: RARITY[i.rarity].color }}>
                      <span>{i.name}</span>
                      <span className="text-xs normal-case font-bold opacity-80">{[itemPowerText(i.id).stats, itemPowerText(i.id).extra].filter(Boolean).join(" · ")}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title={`Item shop · new stock ${stock.restockIn === 1 ? "tomorrow" : `in ${stock.restockIn} days`}`} icon="🛒" glow="gold" help={HELP.shop}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stock.items.map((i) => {
            const owned = game?.owned.includes(i.id);
            const short = (game?.coins ?? 0) < i.price;
            return (
              <div key={i.id} className="bg-card-2 border-[3px] border-outline rounded-[12px] p-2.5 text-center shadow-[3px_3px_0_var(--color-outline)]" style={{ borderColor: RARITY[i.rarity].color }}>
                <div className="flex justify-center h-[135px] items-center">
                  {isKitSlot(i.slot) ? (
                    <Kit size={115} items={[...equipped.filter((e) => itemById(e)?.slot !== i.slot), i.id]} />
                  ) : (
                    <Hero size={120} items={[...equipped.filter((e) => itemById(e)?.slot !== i.slot), i.id]} gear={gear} />
                  )}
                </div>
                <div className="font-display text-lg tracking-wide leading-tight mt-1">{i.name}</div>
                <div className="text-sm font-extrabold" style={{ color: RARITY[i.rarity].color }}>
                  {RARITY[i.rarity].label} · {SLOT_LABEL[i.slot]}
                </div>
                <PowerLine id={i.id} />
                <div className="mt-2">
                  {owned ? (
                    <Badge tone="good">Owned</Badge>
                  ) : (
                    <Btn kind={short ? "ghost" : "primary"} disabled={short} onClick={() => buy(i)}>
                      {i.price} <Icon name="coin" size={20} />
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-base text-muted mt-3">Legendary items never show up here. They only drop as loot.</p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="How to earn coins" icon="🪙">
          <ul className="text-lg space-y-1.5 font-bold">
            <li>Daily quest done: +{REWARD.quest}</li>
            <li>Mission done: +{REWARD.task}</li>
            <li>Client task done: +{REWARD.clientTask}</li>
            <li>Bill paid in full: +{REWARD.bill}</li>
            <li>Boss defeated (deal fully paid): turn-based battle, 60 to 400 coins, plus loot</li>
            <li><Icon name="gift" size={20} /> on a task = guaranteed loot when you finish it. Other tasks sometimes drop a surprise too.</li>
          </ul>
        </Card>
        <Card title="Loot log" icon="📜">
          {!game?.log.length ? (
            <p className="text-lg text-muted">Nothing yet.</p>
          ) : (
            <ul className="space-y-1.5 text-base max-h-72 overflow-y-auto">
              {game.log.map((l, i) => {
                const item = itemById(l.item);
                return (
                  <li key={i} className="flex gap-2 justify-between">
                    <span className="min-w-0 break-words">
                      {l.text}
                      {item && (
                        <span className="font-extrabold" style={{ color: RARITY[item.rarity].color }}>
                          {" "}
                          · <Icon name="gift" size={20} /> {item.name}
                        </span>
                      )}
                    </span>
                    {l.coins ? <span className={`font-display tracking-wide shrink-0 ${l.coins > 0 ? "text-gold" : "text-muted"}`}>{l.coins > 0 ? "+" : ""}{l.coins} <Icon name="coin" size={20} /></span> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function PowerLine({ id }: { id: string }) {
  const p = itemPowerText(id);
  if (!p.stats && !p.extra) return null;
  return (
    <div className="text-xs font-bold leading-snug mt-1">
      {p.stats && <div className="text-ink">{p.stats}</div>}
      {p.extra && <div className="text-gold">{p.extra}</div>}
    </div>
  );
}

/** Battle stats from gear, achievements and level, plus a practice fight to try them. */
function BattleStats() {
  const { data } = useTracker();
  const level = useHeroLevel();
  const lo = loadoutFor(data, level);
  const [practice, setPractice] = useState(false);
  return (
    <Card
      title="Battle stats"
      icon={<Icon name="swords" size={24} />}
      glow="hero"
      actions={
        <Btn kind="hero" onClick={() => setPractice(true)}>
          <Icon name="swords" size={20} /> Practice battle
        </Btn>
      }
    >
      <div className="grid grid-cols-5 gap-2">
        {(Object.keys(STAT_LABEL) as StatKey[]).map((k) => (
          <div key={k} className="bg-card-2 border-[3px] border-outline rounded-[10px] text-center p-2 min-w-0">
            <div className="text-xs font-extrabold uppercase text-muted truncate">{STAT_LABEL[k]}</div>
            <div className="font-display text-2xl sm:text-3xl tracking-wide tabular-nums">{lo.stats[k]}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <div className="text-sm font-extrabold uppercase text-muted mb-1">Skills</div>
          <ul className="space-y-1 text-base">
            {lo.skills.map((s) => (
              <li key={s}>
                <b>{SKILLS[s].name}</b> <span className="text-gold text-sm font-extrabold">{SKILLS[s].cost ? `${SKILLS[s].cost} EN` : "free"}</span> <span className="text-muted">· {SKILLS[s].desc}</span>
              </li>
            ))}
            {lo.passives.map((p) => (
              <li key={p} className="text-muted">
                <b className="text-ink">Passive:</b> {PASSIVE_DESC[p]}
              </li>
            ))}
            {lo.pets.map((p) => (
              <li key={p.name} className="text-muted">
                <b className="text-ink">{p.name}</b> attacks every round
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-sm font-extrabold uppercase text-muted mb-1">Where your stats come from</div>
          <ul className="space-y-0.5 text-base">
            {lo.sources.map((s) => (
              <li key={s.label} className="flex justify-between gap-2">
                <span className="font-bold">{s.label}</span>
                <span className="text-muted text-sm text-right">{statText(s.stats)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-base text-muted mt-3">Wear gear from the shop or loot to raise your stats and unlock skills. Each slot holds one item, so pick the mix that suits your style. When a deal is fully paid, its boss shows up to fight.</p>
      {practice && <BossFight practice onClose={() => setPractice(false)} />}
    </Card>
  );
}

/** Your hero: a clean card with the look, and a full editor behind "Customize look". */
function HeroLocker() {
  const { data, update, today } = useTracker();
  const game = data.game;
  const look = { ...HERO_DEFAULTS, ...game?.look };
  const gear = Object.keys(data.heroGear ?? {});
  const [pose, setPose] = useState(false);
  const [editing, setEditing] = useState(false);
  const [group, setGroup] = useState<(typeof HERO_GROUPS)[number]>("Hair");
  const setLook = (patch: Partial<HeroLook>) => update((d) => void (ensureGame(d, today).look = { ...d.game!.look, ...patch }));
  const pick = (o: HeroOption) => heroChoiceLabel(o, look[o.key]);
  const opt = (key: HeroOption["key"]) => HERO_OPTIONS.find((o) => o.key === key)!;
  const summary: [string, string][] = [
    ["Hair", pick(opt("hair"))],
    ["Top", pick(opt("top"))],
    ["Bottoms", pick(opt("bottoms"))],
    ["Eyes", pick(opt("eyeStyle"))],
    ["Headwear", pick(opt("headwear"))],
    ["On your back", pick(opt("back"))],
  ];

  return (
    <Card
      title={
        <>
          Hero locker · {game?.coins ?? 0} <Icon name="coin" size={22} />
        </>
      }
      icon="🦸"
      glow="hero"
      help={HELP.hero}
      actions={!editing && <EditButton label="Customize look" title="Change your hero's hair, face, clothes and extras" onClick={() => setEditing(true)} />}
    >
      <div className="grid md:grid-cols-[minmax(0,280px)_1fr] gap-6 items-start">
        <div className={`text-center md:sticky md:top-4 ${editing ? "max-md:sticky max-md:top-0 max-md:z-20 max-md:bg-card max-md:py-2 max-md:-mx-1" : ""}`}>
          <div className="bg-card-2 border-[3px] border-outline rounded-[14px] p-3 shadow-[4px_4px_0_var(--color-outline)] inline-block">
            <Hero size={240} mood="ready" attacking={pose} gear={gear} className={`bob max-w-full h-auto ${editing ? "max-md:w-[130px]" : ""}`} />
          </div>
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            <Btn onClick={() => setPose(!pose)}>{pose ? "Stand" : "Battle pose"}</Btn>
            {editing && (
              <Btn onClick={() => setLook(randomHeroLook())}>
                <Icon name="sparkles" size={20} /> Random look
              </Btn>
            )}
          </div>
        </div>

        {!editing ? (
          <div className="space-y-4 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {summary.map(([label, value]) => (
                <Field key={label} label={label}>
                  {value}
                </Field>
              ))}
            </div>
            <p className="text-base text-muted">
              {look.achievementGear ? `Showing ${gear.length} piece${gear.length === 1 ? "" : "s"} of achievement gear.` : "Achievement gear is hidden."} Shop items you wear show on top of your look.
            </p>
          </div>
        ) : (
          <div className="space-y-4 min-w-0">
            <p className="text-sm text-muted font-bold">{bigCount(heroLookCount())} possible looks. Changes show on your hero right away.</p>
            <div className="flex gap-1.5 flex-wrap" role="tablist">
              {HERO_GROUPS.map((g) => (
                <button key={g} type="button" role="tab" aria-selected={group === g} onClick={() => setGroup(g)} className={`btn px-4 py-1.5 ${group === g ? "btn-primary" : "btn-ghost"}`}>
                  {g}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {HERO_OPTIONS.filter((o) => o.group === group).map((o) => (
                <OptionRow key={o.key} option={o} value={look[o.key]} look={look} onPick={(v) => setLook({ [o.key]: v })} />
              ))}
            </div>
            <label className="flex items-center gap-2 text-base font-bold">
              <input type="checkbox" className="w-5 h-5" checked={look.achievementGear} onChange={(e) => setLook({ achievementGear: e.target.checked })} /> Show achievement gear ({gear.length})
            </label>
            <div className="flex gap-2 flex-wrap">
              <SaveButton label="Save look" onClick={() => setEditing(false)} />
              <Btn onClick={() => confirm("Reset your look to the default?") && update((d) => void (ensureGame(d, today).look = {}))}>Reset look</Btn>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function bigCount(n: number): string {
  for (const [v, w] of [[1e18, "quintillion"], [1e15, "quadrillion"], [1e12, "trillion"], [1e9, "billion"], [1e6, "million"]] as const) if (n >= v) return `Over ${Math.floor(n / v).toLocaleString()} ${w}`;
  return n.toLocaleString();
}

function OptionRow({ option: o, value, look, onPick }: { option: HeroOption; value: string; look: Required<HeroLook>; onPick: (v: string) => void }) {
  if (o.colors) {
    // An empty colour means "a shade of the top", shown as its own swatch.
    const swatch = (c: string) => c || shade(look.outfit, -0.35);
    return (
      <div>
        <div className="text-base font-extrabold text-muted mb-1.5">{o.label}</div>
        <div className="flex gap-2 flex-wrap items-center">
          {o.colors.map((c) => (
            <button
              key={c || "auto"}
              type="button"
              aria-label={c ? `${o.label} ${c}` : `${o.label} matches the top`}
              title={c ? undefined : "Match the top"}
              onClick={() => onPick(c)}
              className={`w-9 h-9 rounded-full border-[3px] ${value === c ? "border-white scale-110" : "border-outline"} shadow-[2px_2px_0_var(--color-outline)] ${c ? "" : "grid place-content-center text-[10px] font-extrabold text-white"}`}
              style={{ background: swatch(c) }}
            >
              {c ? null : "AUTO"}
            </button>
          ))}
          <label className="w-9 h-9 rounded-full border-[3px] border-outline grid place-content-center cursor-pointer overflow-hidden relative" title="Pick any colour">
            <Icon name="palette" size={20} />
            <input type="color" value={swatch(value)} onChange={(e) => onPick(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={`${o.label}: any colour`} />
          </label>
        </div>
      </div>
    );
  }
  const list = o.choices ?? [];
  const i = Math.max(0, list.findIndex((c) => c[0] === value));
  const step = (d: number) => onPick(list[(i + d + list.length) % list.length][0]);
  return (
    <div>
      <div className="text-base font-extrabold text-muted mb-1.5">
        {o.label} <span className="font-bold text-sm">({i + 1} of {list.length})</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" className="btn btn-ghost px-3 py-1 text-xl" onClick={() => step(-1)} aria-label={`Previous ${o.label}`}>
          ‹
        </button>
        <select className="flex-1 min-w-0 max-w-64 text-lg font-bold" value={list[i]?.[0]} onChange={(e) => onPick(e.target.value)} aria-label={o.label}>
          {list.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost px-3 py-1 text-xl" onClick={() => step(1)} aria-label={`Next ${o.label}`}>
          ›
        </button>
      </div>
    </div>
  );
}

/** Kit's personality (sets its look and how it talks) and colours. */
function KitLocker() {
  const { data, update, today } = useTracker();
  const persona = data.settings.kitPersona ?? "kit";
  const base = KIT_LOOKS[persona] ?? KIT_LOOKS.kit;
  const kl = data.game?.kitLook ?? {};
  const setKit = (patch: { fur?: string; eyes?: string }) =>
    update((d) => {
      const g = ensureGame(d, today);
      g.kitLook = { ...g.kitLook, ...patch };
      for (const k of Object.keys(g.kitLook) as ("fur" | "eyes")[]) if (!g.kitLook[k]) delete g.kitLook[k];
    });
  return (
    <Card title="Kit's locker" icon="🦊" glow="gold" help={HELP.kitLocker}>
      <div className="grid md:grid-cols-[minmax(0,260px)_1fr] gap-6 items-start">
        <div className="text-center">
          <div className="bg-card-2 border-[3px] border-outline rounded-[14px] p-3 shadow-[4px_4px_0_var(--color-outline)] inline-block">
            <Kit size={200} talking className="bob max-w-full h-auto" />
          </div>
        </div>
        <div className="space-y-4 min-w-0">
          <div>
            <div className="text-base font-extrabold text-muted mb-1.5">Personality (changes how Kit looks and talks)</div>
            <div className="flex gap-2 flex-wrap">
              {PERSONAS.map((p) => (
                <button key={p.id} className={`btn ${persona === p.id ? "btn-primary" : "btn-ghost"} px-3`} onClick={() => update((d) => void (d.settings.kitPersona = p.id))}>
                  <Glyph value={p.emoji} size={20} /> {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Swatches label="Fur" value={kl.fur ?? base.fur} options={FURS} onPick={(fur) => setKit({ fur })} />
            {kl.fur && <Btn onClick={() => setKit({ fur: undefined })}>Match personality</Btn>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Swatches label="Eyes" value={kl.eyes ?? base.eyes} options={["#0b0a14", "#ff2a4f", "#ffd23f", "#4fd2ff", "#6ee77a", "#c77dff"]} onPick={(eyes) => setKit({ eyes })} />
            {kl.eyes && <Btn onClick={() => setKit({ eyes: undefined })}>Match personality</Btn>}
          </div>
          <p className="text-base text-muted">Kit&apos;s outfits (hats, shades, collars and more) show up in the shop. Wear them under &ldquo;Your items&rdquo;.</p>
        </div>
      </div>
    </Card>
  );
}

function Swatches({ label, value, options, onPick }: { label: string; value: string; options: string[]; onPick: (v: string) => void }) {
  return (
    <div>
      <div className="text-base font-extrabold text-muted mb-1.5">{label}</div>
      <div className="flex gap-2 flex-wrap items-center">
        {options.map((c) => (
          <button
            key={c}
            aria-label={`${label} ${c}`}
            onClick={() => onPick(c)}
            className={`w-9 h-9 rounded-full border-[3px] ${value === c ? "border-white scale-110" : "border-outline"} shadow-[2px_2px_0_var(--color-outline)]`}
            style={{ background: c }}
          />
        ))}
        <label className="w-9 h-9 rounded-full border-[3px] border-outline grid place-content-center cursor-pointer text-sm font-extrabold overflow-hidden relative" title="Pick any colour">
          <Icon name="palette" size={20} />
          <input type="color" value={value} onChange={(e) => onPick(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
      </div>
    </div>
  );
}

/** Backgrounds for the banner your hero stands on: free ones, ones bought with coins, or your own picture. */
function CoverShop() {
  const { data, update, today } = useTracker();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const current = activeCover(data);
  const coins = data.game?.coins ?? 0;
  const image = data.game?.coverImage;

  const pick = (c: Cover) => {
    const err = buyCover(structuredClone(data), c.id, today);
    if (err) return toast(err);
    const bought = !ownsCover(data, c.id);
    update((d) => void buyCover(d, c.id, today));
    if (bought) {
      sfx("coin");
      toast(`Bought the ${c.name} cover!`);
    }
  };
  const upload = async (f: File) => {
    setBusy(true);
    try {
      const url = await shrinkCover(f);
      update((d) => {
        const g = ensureGame(d, today);
        g.coverImage = url;
        g.cover = CUSTOM_COVER;
      });
      toast("Your picture is on the banner.");
    } catch (e) {
      toast((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <Card title="Banner covers" icon={<Icon name="image" size={24} />} glow="cyan" help={HELP.covers}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {COVERS.map((c) => {
          const owned = ownsCover(data, c.id);
          const on = current === c.id;
          return (
            <div key={c.id} className={`bg-card-2 border-[3px] rounded-[12px] p-2 shadow-[3px_3px_0_var(--color-outline)] ${on ? "border-gold" : "border-outline"}`}>
              <CoverArt id={c.id} className="w-full aspect-[4/1] rounded-[8px] border-2 border-outline block bg-card" />
              <div className="flex items-center justify-between gap-2 mt-2">
                <div className="min-w-0">
                  <div className="font-display text-lg tracking-wide leading-tight">{c.name}</div>
                  <div className="text-sm font-extrabold" style={{ color: RARITY[c.rarity].color }}>
                    {c.price === 0 ? "Free" : RARITY[c.rarity].label}
                  </div>
                </div>
                {on ? (
                  <Badge tone="gold">In use</Badge>
                ) : owned ? (
                  <Btn onClick={() => pick(c)}>Use</Btn>
                ) : (
                  <Btn kind={coins < c.price ? "ghost" : "primary"} disabled={coins < c.price} onClick={() => pick(c)} title={coins < c.price ? `You need ${c.price - coins} more coins` : `Buy for ${c.price} coins`}>
                    {c.price} <Icon name="coin" size={20} />
                  </Btn>
                )}
              </div>
            </div>
          );
        })}
        <div className={`bg-card-2 border-[3px] rounded-[12px] p-2 shadow-[3px_3px_0_var(--color-outline)] ${current === CUSTOM_COVER ? "border-gold" : "border-outline border-dashed"}`}>
          {image ? (
            <CoverArt id={CUSTOM_COVER} image={image} className="w-full aspect-[4/1] rounded-[8px] border-2 border-outline block" />
          ) : (
            <button className="w-full aspect-[4/1] rounded-[8px] border-2 border-dashed border-line grid place-items-center text-muted font-bold" onClick={() => file.current?.click()}>
              <span className="flex items-center gap-2"><Icon name="image" size={22} /> Your own picture</span>
            </button>
          )}
          <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
            <div className="min-w-0">
              <div className="font-display text-lg tracking-wide leading-tight">Your own picture</div>
              <div className="text-sm font-extrabold text-muted">Free · wide pictures look best</div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {image && current !== CUSTOM_COVER && <Btn onClick={() => update((d) => void (ensureGame(d, today).cover = CUSTOM_COVER))}>Use</Btn>}
              {current === CUSTOM_COVER && <Badge tone="gold">In use</Badge>}
              <Btn kind={image ? "ghost" : "primary"} disabled={busy} onClick={() => file.current?.click()}>{busy ? "Loading…" : image ? "Change" : "Upload"}</Btn>
              {image && (
                <Btn kind="ghost" onClick={() => confirm("Remove your banner picture?") && update((d) => {
                  const g = ensureGame(d, today);
                  delete g.coverImage;
                  if (g.cover === CUSTOM_COVER) delete g.cover;
                })}>
                  Remove
                </Btn>
              )}
            </div>
          </div>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => (e.target.files?.[0] && upload(e.target.files[0]), (e.target.value = ""))} />
        </div>
      </div>
    </Card>
  );
}
