"use client";

// The inventory, laid out like the classic online RPG windows: an Equipment window with your
// hero in the middle and a slot for every piece of gear around them, a Status panel with your
// battle stats, and the bag as a grid of item squares in three tabs (Item, Equip, Etc). Pick a
// square to read about it; gear shows exactly how your stats would change before you put it on.
// Double-click gear to wear it. Potions can be drunk here, and loot sold at the camp merchant.

import { useMemo, useState } from "react";
import { useTracker } from "../App";
import { useHeroLevel } from "../BossFight";
import { PixelHero } from "../pixelate";
import { ItemIcon } from "./ItemIcon";
import { SLOT_LABEL, itemById, isKitSlot } from "@/lib/items";
import { ITEM_POWER, PASSIVE_DESC, SKILLS, heroLoadout, itemPowerText, type StatKey } from "@/lib/battle";
import { DAILY_SELL_CAP, anyItem, bagCount, bagItemById, bagTabs, equipItem, rarityColor, rarityInk, rarityLabel, sellItem, sellRoom, unequipSlot } from "@/lib/bag";
import { sfx } from "@/lib/sound";
import { toast } from "../ui";
import type { ItemSlot } from "@/lib/types";

type Tab = "items" | "equip" | "etc";
const TABS: { id: Tab; label: string }[] = [
  { id: "items", label: "Item" },
  { id: "equip", label: "Equip" },
  { id: "etc", label: "Etc" },
];
const LEFT: ItemSlot[] = ["hat", "face", "weapon"];
const RIGHT: ItemSlot[] = ["back", "aura", "pet"];
const KIT: ItemSlot[] = ["kit-head", "kit-face", "kit-neck", "kit-tail"];
const STATS: { k: StatKey; label: string }[] = [
  { k: "hp", label: "HP" },
  { k: "atk", label: "ATK" },
  { k: "def", label: "DEF" },
  { k: "spd", label: "SPD" },
  { k: "crit", label: "CRIT" },
];

export default function Inventory({ onClose, hp, onDrink, merchant = false }: { onClose: () => void; hp?: { cur: number; max: number }; onDrink?: (id: string) => void; merchant?: boolean }) {
  const { data, update, today } = useTracker();
  const level = useHeroLevel();
  const game = data.game;
  const [tab, setTab] = useState<Tab>("equip");
  const [sel, setSel] = useState<string>("");
  const tabs = bagTabs(game);
  const list = tabs[tab];
  const equippedMap = game?.equipped ?? {};
  const equipped = Object.values(equippedMap).filter(Boolean) as string[];
  const achievements = Object.keys(data.heroGear ?? {}).length;
  const now = useMemo(() => heroLoadout(equipped, achievements, level), [equipped.join(","), achievements, level]); // eslint-disable-line react-hooks/exhaustive-deps

  const item = sel ? anyItem(sel) : undefined;
  const gear = sel ? itemById(sel) : undefined;
  const wearing = gear ? equippedMap[gear.slot] === gear.id : false;
  const owned = gear ? game?.owned.includes(gear.id) : false;
  // What your stats would be with the picked gear on (or off, if you're wearing it).
  const preview = useMemo(() => {
    if (!gear || !owned) return null;
    const eq = { ...equippedMap } as Record<string, string | undefined>;
    eq[gear.slot] = wearing ? undefined : gear.id;
    return heroLoadout(Object.values(eq).filter(Boolean) as string[], achievements, level);
  }, [sel, wearing, owned, equipped.join(","), achievements, level]); // eslint-disable-line react-hooks/exhaustive-deps

  const wear = (id: string) => {
    const g = itemById(id);
    if (!g) return;
    if (equippedMap[g.slot] === id) {
      update((d) => unequipSlot(d, g.slot, today));
      sfx("click");
      return;
    }
    update((d) => {
      const err = equipItem(d, id, today);
      if (err) toast(err);
    });
    sfx("buff");
  };
  const sell = (id: string, n: number) => {
    const res = sellItem(structuredClone(data), id, n, today);
    if ("error" in res) return toast(res.error);
    update((d) => void sellItem(d, id, n, today));
    sfx("coin");
    toast(`Sold for ${res.coins} coins`);
    if (bagCount(game, id) - n <= 0 && !itemById(id)) setSel("");
  };

  const slotBox = (slot: ItemSlot, small = false) => {
    const id = equippedMap[slot];
    const it = id ? itemById(id) : undefined;
    return (
      <button
        key={slot}
        type="button"
        onClick={() => (id ? (setSel(id), setTab("equip")) : setTab("equip"))}
        onDoubleClick={() => id && wear(id)}
        className={`inv-slot flex items-center gap-2 text-left ${id && sel === id ? "inv-picked" : ""}`}
        style={it ? { boxShadow: `inset 0 0 0 3px ${rarityColor(it.rarity)}` } : undefined}
        title={it ? `${it.name} (double-click to take off)` : `${SLOT_LABEL[slot]}: empty`}
      >
        <span className="inv-cell-sm grid place-content-center shrink-0">{id ? <ItemIcon id={id} size={small ? 30 : 36} /> : null}</span>
        <span className="min-w-0">
          <span className="block text-xs font-extrabold uppercase text-[#8a5a32] leading-none">{SLOT_LABEL[slot].replace("Kit's ", "Kit ")}</span>
          <span className="block font-bold leading-tight truncate">{it?.name ?? "Empty"}</span>
        </span>
      </button>
    );
  };

  const sellable = item && bagCount(game, item.id) > 0;
  const room = sellRoom(game, today);

  return (
    <div className="fixed inset-0 z-[85] bg-[#1a1218]/70 overflow-y-auto p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="Inventory" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-3">
        {/* Equipment + status */}
        <section className="inv-win">
          <header className="inv-title">
            <span>Equipment</span>
          </header>
          <div className="p-3 grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            <div className="flex flex-col gap-2">{LEFT.map((s) => slotBox(s))}</div>
            <div className="w-[120px] sm:w-[170px] flex justify-center">
              <PixelHero look={game?.look} items={preview && gear && !wearing ? [...equipped.filter((e) => itemById(e)?.slot !== gear.slot), gear.id] : equipped} gear={Object.keys(data.heroGear ?? {})} size={170} className="w-full h-auto" />
            </div>
            <div className="flex flex-col gap-2">{RIGHT.map((s) => slotBox(s))}</div>
          </div>
          <div className="px-3">
            <div className="text-sm font-extrabold uppercase text-[#8a5a32] mb-1">Kit wears</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{KIT.map((s) => slotBox(s, true))}</div>
          </div>
          <div className="p-3">
            <div className="inv-sub">
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-display text-2xl leading-none">Status</span>
                <span className="font-bold text-[#5a5458]">Level {level}{hp ? ` · HP now ${hp.cur}/${hp.max}` : ""}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {STATS.map(({ k, label }) => {
                  const v = Math.round(now.stats[k]);
                  const p = preview ? Math.round(preview.stats[k]) : v;
                  const d = p - v;
                  return (
                    <div key={k} className="bg-[#fffaf0] border-[3px] border-[#2b1d2e] py-1">
                      <div className="text-sm font-extrabold text-[#8a5a32]">{label}</div>
                      <div className="font-display text-2xl leading-none tabular-nums">
                        {d ? p : v}
                        {k === "crit" ? "%" : ""}
                      </div>
                      <div className={`text-base font-extrabold leading-tight min-h-[1.25rem] ${d > 0 ? "text-[#3e6b32]" : d < 0 ? "text-[#c0502f]" : "text-transparent"}`}>{d ? `${d > 0 ? "+" : ""}${d}` : "0"}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(preview ?? now).skills.map((s) => (
                  <span key={s} className={`text-sm font-extrabold px-2 py-0.5 border-2 border-[#2b1d2e] ${now.skills.includes(s) ? "bg-[#f3e2c0]" : "bg-[#8cc05a]"}`} title={SKILLS[s].desc}>
                    {SKILLS[s].name}
                    {!now.skills.includes(s) && " (new)"}
                  </span>
                ))}
                {now.skills.filter((s) => preview && !preview.skills.includes(s)).map((s) => (
                  <span key={`x${s}`} className="text-sm font-extrabold px-2 py-0.5 border-2 border-[#2b1d2e] bg-[#e8a0a0] line-through">
                    {SKILLS[s].name}
                  </span>
                ))}
              </div>
              {preview && <p className="mt-2 text-base font-bold text-[#5a5458]">{wearing ? "Taking it off would change your stats like this." : "Putting it on would change your stats like this."}</p>}
            </div>
          </div>
        </section>

        {/* The bag */}
        <section className="inv-win flex flex-col">
          <header className="inv-title">
            <span>Inventory</span>
            <button type="button" onClick={onClose} className="inv-close" aria-label="Close inventory">
              Close
            </button>
          </header>
          <div className="flex gap-1 px-3 pt-3">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => (setTab(t.id), setSel(""))} className={`inv-tab ${tab === t.id ? "inv-tab-on" : ""}`}>
                {t.label} <span className="opacity-60">{tabs[t.id].length}</span>
              </button>
            ))}
          </div>
          <div className="px-3">
            <div className="inv-grid">
              {list.map((id) => {
                const it = anyItem(id)!;
                const n = bagCount(game, id);
                const g = itemById(id);
                const on = g && equippedMap[g.slot] === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => (setSel(id), sfx("click"))}
                    onDoubleClick={() => (g ? wear(id) : bagItemById(id)?.use && onDrink?.(id))}
                    className={`inv-cell ${sel === id ? "inv-picked" : ""}`}
                    style={{ boxShadow: `inset 0 0 0 3px ${rarityColor(it.rarity)}` }}
                    title={it.name}
                  >
                    <ItemIcon id={id} size={40} />
                    {(!g || n > 0) && <span className="inv-count">{g ? `+${n}` : n}</span>}
                    {on && <span className="inv-e">E</span>}
                  </button>
                );
              })}
              {Array.from({ length: Math.max(0, 28 - list.length) }, (_, i) => (
                <span key={`e${i}`} className="inv-cell inv-empty" />
              ))}
            </div>
          </div>
          {/* details */}
          <div className="p-3 mt-auto">
            <div className="inv-sub min-h-[150px]">
              {item ? (
                <div className="flex gap-3">
                  <div className="shrink-0 bg-[#fffaf0] border-[3px] border-[#2b1d2e] p-1.5 h-fit" style={{ boxShadow: `inset 0 0 0 3px ${rarityColor(item.rarity)}` }}>
                    <ItemIcon id={item.id} size={64} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-2xl sm:text-3xl leading-none">{item.name}</div>
                    <div className="text-base font-extrabold uppercase mt-0.5" style={{ color: rarityInk(item.rarity) }}>
                      {rarityLabel(item.rarity)} · {gear ? `${SLOT_LABEL[gear.slot]}${isKitSlot(gear.slot) ? "" : " gear"}` : item.kind === "potion" ? "Potion" : "Monster loot"}
                    </div>
                    {item.about && <p className="text-lg font-bold leading-snug mt-1">{item.about}</p>}
                    {gear && ITEM_POWER[gear.id] && (
                      <p className="text-lg font-extrabold leading-snug mt-1 text-[#3e6b32]">
                        {[itemPowerText(gear.id).stats, ITEM_POWER[gear.id].skill ? `Skill: ${SKILLS[ITEM_POWER[gear.id].skill!].name}` : "", ITEM_POWER[gear.id].passive ? PASSIVE_DESC[ITEM_POWER[gear.id].passive!] : "", ITEM_POWER[gear.id].pet ? "Fights with you every round" : ""].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {gear && bagCount(game, gear.id) > 0 && <p className="text-base font-bold text-[#5a5458]">You have {bagCount(game, gear.id)} spare {bagCount(game, gear.id) === 1 ? "copy" : "copies"} to sell.</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {gear && owned && (
                        <button type="button" className={`inv-btn ${wearing ? "" : "inv-btn-go"}`} onClick={() => wear(gear.id)}>
                          {wearing ? "Take off" : equippedMap[gear.slot] ? `Swap in (replaces ${itemById(equippedMap[gear.slot])?.name})` : "Equip"}
                        </button>
                      )}
                      {item.kind === "potion" && onDrink && bagCount(game, item.id) > 0 && (
                        <button type="button" className="inv-btn inv-btn-go" onClick={() => onDrink(item.id)} disabled={hp ? hp.cur >= hp.max && !bagItemById(item.id)?.use?.cure : false}>
                          Drink ({bagCount(game, item.id)} left)
                        </button>
                      )}
                      {merchant && sellable && (
                        <>
                          <button type="button" className="inv-btn" onClick={() => sell(item.id, 1)} disabled={room < item.sell}>
                            Sell 1 for {item.sell}
                          </button>
                          {bagCount(game, item.id) > 1 && (
                            <button type="button" className="inv-btn" onClick={() => sell(item.id, bagCount(game, item.id))} disabled={room < item.sell}>
                              Sell all
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-lg font-bold text-[#5a5458]">
                  {list.length ? "Pick an item to see what it does. Double-click gear to put it on or take it off." : tab === "items" ? "No potions yet. Monsters out in the Wilds drop herbs and potions." : tab === "etc" ? "No monster loot yet. Beat monsters in the Wilds to collect it." : "No gear yet."}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 font-extrabold text-lg text-[#fbf1dc] [text-shadow:2px_2px_0_#2b1d2e]">
              <span>Coins: {game?.coins ?? 0}</span>
              {merchant ? <span>Merchant can still pay {room} of {DAILY_SELL_CAP} coins today</span> : <span>Sell loot to Wren at the Wilds camp</span>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
