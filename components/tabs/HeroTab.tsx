"use client";

import { useState } from "react";
import { ITEMS, RARITY, SLOT_LABEL, itemById, shopStock, type Item } from "@/lib/items";
import { REWARD, buyItem, ensureGame } from "@/lib/loot";
import type { HeroLook, ItemSlot } from "@/lib/types";
import { useTracker } from "../App";
import { HERO_DEFAULTS, Hero } from "../characters";
import { Badge, Btn, Card, toast } from "../ui";
import { HELP } from "../help";

const SKINS = ["#ffe6d1", "#ffd9b8", "#f1c27d", "#d9a066", "#a86b3c", "#7a4a26", "#4b2e1a"];
const HAIR_COLORS = ["#2a2f7a", "#16131f", "#e8e8f0", "#ffd23f", "#ff8a1f", "#d62839", "#ff8fc0", "#7b2cbf", "#2ec4b6", "#4caf50"];
const EYES = ["#ffae00", "#4fd2ff", "#d62839", "#7b2cbf", "#4caf50", "#8d5524", "#ff5fae"];
const OUTFITS = ["#2c2b6b", "#16131f", "#c1121f", "#1b4332", "#3a0ca3", "#f1f1f1", "#ff8a1f", "#0077b6"];
const HAIRS: [NonNullable<HeroLook["hair"]>, string][] = [
  ["spiky", "Spiky"],
  ["long", "Long"],
  ["mohawk", "Mohawk"],
  ["bob", "Bob"],
];
const SLOTS: ItemSlot[] = ["hat", "face", "weapon", "back", "aura", "pet"];

export default function HeroTab() {
  const { data, update, today } = useTracker();
  const game = data.game;
  const look = { ...HERO_DEFAULTS, ...game?.look };
  const equipped = Object.values(game?.equipped ?? {}).filter(Boolean) as string[];
  const [pose, setPose] = useState(false);
  const stock = shopStock(today);
  const gear = Object.keys(data.heroGear ?? {});

  const setLook = (patch: Partial<HeroLook>) => update((d) => void (ensureGame(d, today).look = { ...d.game!.look, ...patch }));
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
    toast(`Bought ${item.name}! Equipped.`);
  };

  return (
    <div className="space-y-5">
      <Card title={`Hero locker · ${game?.coins ?? 0} 🪙`} icon="🦸" glow="hero" help={HELP.hero}>
        <div className="grid md:grid-cols-[minmax(0,260px)_1fr] gap-6 items-start">
          <div className="text-center">
            <div className="bg-card-2 border-[3px] border-outline rounded-[14px] p-3 shadow-[4px_4px_0_#0b0a14] inline-block">
              <Hero size={230} mood="ready" attacking={pose} gear={gear} className="bob max-w-full h-auto" />
            </div>
            <div className="mt-3 flex justify-center gap-2">
              <Btn onClick={() => setPose(!pose)}>{pose ? "Stand" : "Battle pose"}</Btn>
              <Btn onClick={() => confirm("Reset your look to the default?") && update((d) => void (ensureGame(d, today).look = {}))}>Reset look</Btn>
            </div>
          </div>
          <div className="space-y-4 min-w-0">
            <Swatches label="Skin" value={look.skin} options={SKINS} onPick={(skin) => setLook({ skin })} />
            <div>
              <div className="text-base font-extrabold text-muted mb-1.5">Hair style</div>
              <div className="flex gap-2 flex-wrap">
                {HAIRS.map(([id, name]) => (
                  <button key={id} className={`btn ${look.hair === id ? "btn-primary" : "btn-ghost"} px-3`} onClick={() => setLook({ hair: id })}>
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <Swatches label="Hair colour" value={look.hairColor} options={HAIR_COLORS} onPick={(hairColor) => setLook({ hairColor })} />
            <Swatches label="Eyes" value={look.eyes} options={EYES} onPick={(eyes) => setLook({ eyes })} />
            <Swatches label="Suit" value={look.outfit} options={OUTFITS} onPick={(outfit) => setLook({ outfit })} />
            <Swatches label="Chest panel" value={look.accent} options={["#ffd23f", "#4fd2ff", "#ff5fae", "#6ee77a", "#f1f1f1", "#ff8a1f"]} onPick={(accent) => setLook({ accent })} />
            <Swatches label="Scarf" value={look.scarf} options={["#ff3b4f", "#ffd23f", "#4fd2ff", "#16131f", "#f1f1f1", "#7b2cbf", "#6ee77a"]} onPick={(scarf) => setLook({ scarf })} />
            <label className="flex items-center gap-2 text-base font-bold">
              <input type="checkbox" checked={look.achievementGear} onChange={(e) => setLook({ achievementGear: e.target.checked })} /> Show achievement gear ({gear.length})
            </label>
          </div>
        </div>
      </Card>

      <Card title="Your items" icon="🎒" help={HELP.inventory}>
        {!game?.owned.length ? (
          <p className="text-lg text-muted">No items yet. Buy some in the shop below, or find loot in 🎁 tasks and boss fights.</p>
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
                    <button key={i.id} className={`btn ${game.equipped[slot] === i.id ? "btn-primary" : "btn-ghost"} px-3`} onClick={() => equip(slot, i.id)} style={{ borderColor: RARITY[i.rarity].color }}>
                      {i.name}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title={`Item shop · new stock in ${stock.restockIn} day${stock.restockIn === 1 ? "" : "s"}`} icon="🛒" glow="gold" help={HELP.shop}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stock.items.map((i) => {
            const owned = game?.owned.includes(i.id);
            const short = (game?.coins ?? 0) < i.price;
            return (
              <div key={i.id} className="bg-card-2 border-[3px] border-outline rounded-[12px] p-2.5 text-center shadow-[3px_3px_0_#0b0a14]" style={{ borderColor: RARITY[i.rarity].color }}>
                <div className="flex justify-center">
                  <Hero size={120} items={[...equipped.filter((e) => itemById(e)?.slot !== i.slot), i.id]} gear={gear} />
                </div>
                <div className="font-display text-lg tracking-wide leading-tight mt-1">{i.name}</div>
                <div className="text-sm font-extrabold" style={{ color: RARITY[i.rarity].color }}>
                  {RARITY[i.rarity].label} · {SLOT_LABEL[i.slot]}
                </div>
                <div className="mt-2">
                  {owned ? (
                    <Badge tone="good">Owned</Badge>
                  ) : (
                    <Btn kind={short ? "ghost" : "primary"} disabled={short} onClick={() => buy(i)}>
                      {i.price} 🪙
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
            <li>Boss defeated (deal fully paid): mini game, 60 to 400 coins, plus loot</li>
            <li>🎁 on a task = guaranteed loot when you finish it. Other tasks sometimes drop a surprise too.</li>
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
                          · 🎁 {item.name}
                        </span>
                      )}
                    </span>
                    {l.coins ? <span className={`font-display tracking-wide shrink-0 ${l.coins > 0 ? "text-gold" : "text-muted"}`}>{l.coins > 0 ? "+" : ""}{l.coins} 🪙</span> : null}
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
            className={`w-9 h-9 rounded-full border-[3px] ${value === c ? "border-white scale-110" : "border-outline"} shadow-[2px_2px_0_#0b0a14]`}
            style={{ background: c }}
          />
        ))}
        <label className="w-9 h-9 rounded-full border-[3px] border-outline grid place-content-center cursor-pointer text-sm font-extrabold overflow-hidden relative" title="Pick any colour">
          🎨
          <input type="color" value={value} onChange={(e) => onPick(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
      </div>
    </div>
  );
}
