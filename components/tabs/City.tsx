"use client";

// The City tab: the big Enter button, and the planner where the city's name, buildings,
// rooms and AI staff are set. The city itself is components/city/CityGame.

import { useEffect, useState } from "react";
import { useTracker } from "../App";
import { Badge, Btn, Card } from "../ui";
import { EditButton, EditableText, SaveButton } from "../editable";
import { Hero } from "../characters";
import { Icon } from "../icons";
import CityGame from "../city/CityGame";
import { HELP } from "../help";
import { ROLE_LIST, buildingName, ensureCity, newBuilding, newStaff, removeBuilding, roleOf, roofColor, setupProgress, titleOf, visibleBuildings } from "@/lib/city";
import { uid } from "@/lib/finance";
import { sfx } from "@/lib/sound";
import type { CityBuilding, StaffRoleId } from "@/lib/types";

const KIND_LABEL: Record<string, string> = { client: "Client department", video: "Studio", acquisition: "Studio", creative: "Studio", custom: "Building" };

export default function City({ goTo }: { goTo: (tab: string) => void }) {
  const { data, update, today } = useTracker();
  const [playing, setPlaying] = useState(false);

  // Build the city the first time, and a department for each new client.
  const clientKey = (data.clients ?? []).map((c) => `${c.id}:${c.archived ? 1 : 0}`).join(",");
  useEffect(() => {
    const probe = structuredClone({ city: data.city, clients: data.clients }) as typeof data;
    if (ensureCity(probe, today)) update((d) => void ensureCity(d, today));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientKey, Boolean(data.city)]);

  const city = data.city;
  if (!city) return null;
  const buildings = visibleBuildings(data);
  const staff = city.staff.filter((s) => buildings.some((b) => b.id === s.buildingId));
  const keys = data.integrations?.staffKeys ?? [];
  const waiting = staff.filter((s) => setupProgress(s, keys).missing.length).length;

  const enter = () => {
    sfx("door");
    setPlaying(true);
  };

  return (
    <div className="space-y-5">
      <section className="hud hud-hero overflow-hidden">
        <div className="speed-lines" />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-4 items-center p-5 sm:p-7">
          <div>
            <div className="text-sm font-extrabold uppercase tracking-widest text-gold">Your AI city</div>
            <h1 className="comic-num text-5xl sm:text-7xl leading-none uppercase mt-1">{city.name}</h1>
            <p className="text-lg font-bold text-muted mt-2 max-w-xl">
              {buildings.length} buildings, {staff.length} AI staff at work.{" "}
              {waiting ? `${waiting} of them are waiting on setup from you.` : "Everyone is set up."}
            </p>
            <button type="button" onClick={enter} className="mt-5 btn btn-primary px-12 py-4 font-display tracking-widest -rotate-1" style={{ fontSize: "2.6rem", lineHeight: 1 }}>
              ENTER
            </button>
          </div>
          <div className="flex items-end justify-center gap-1 max-md:hidden">
            {staff.slice(0, 3).map((s) => (
              <Hero key={s.id} look={s.look} items={[]} size={92} className="bob" />
            ))}
            <Hero size={150} mood="hype" gear={Object.keys(data.heroGear ?? {})} className="bob drop-shadow-[5px_5px_0_var(--color-outline)]" />
          </div>
        </div>
      </section>

      <Card title="City planner" icon="layout" help={HELP.city}>
        <div className="space-y-4">
          <EditableText label="City name" value={city.name} onChange={(v) => update((d) => void (d.city!.name = v.trim() || d.city!.name))} placeholder="Name your city" />
          <div className="grid gap-3 lg:grid-cols-2">
            {buildings.map((b) => (
              <BuildingCard key={b.id} building={b} />
            ))}
          </div>
          <NewBuilding />
        </div>
      </Card>

      {playing && (
        <CityGame
          onExit={() => setPlaying(false)}
          goTo={(t) => {
            setPlaying(false);
            goTo(t);
          }}
        />
      )}
    </div>
  );
}

function BuildingCard({ building }: { building: CityBuilding }) {
  const { data, update, today } = useTracker();
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<StaffRoleId>("social");
  const [room, setRoom] = useState("");
  const keys = data.integrations?.staffKeys ?? [];
  const staff = (data.city?.staff ?? []).filter((s) => s.buildingId === building.id);
  const edit = (fn: (b: CityBuilding) => void) => update((d) => fn(d.city!.buildings.find((x) => x.id === building.id)!));
  return (
    <div className="bg-card-2 border-[3px] border-outline rounded-[10px] p-3">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-md border-[3px] border-outline shrink-0" style={{ background: roofColor(building) }} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl tracking-wide leading-none truncate">{buildingName(data, building)}</div>
          <div className="text-sm font-extrabold text-muted">{KIND_LABEL[building.kind]} · {staff.length} staff · {2 + (building.rooms?.length ?? 0)} rooms</div>
        </div>
        {editing ? <SaveButton onClick={() => setEditing(false)} label="Done" /> : <EditButton onClick={() => setEditing(true)} />}
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {staff.map((s) => {
          const missing = setupProgress(s, keys).missing.length;
          return (
            <li key={s.id} className="flex items-center gap-1.5 bg-card border-2 border-outline rounded-lg pl-1 pr-2 py-0.5">
              <span className="w-8 h-9 overflow-hidden grid place-content-center">
                <Hero look={s.look} items={[]} size={34} />
              </span>
              <span className="leading-tight">
                <span className="block font-extrabold text-base">{s.name}</span>
                <span className="block text-xs font-bold" style={{ color: roleOf(s).color }}>{titleOf(s)}</span>
              </span>
              {missing > 0 && !editing && <span className="w-2.5 h-2.5 rounded-full bg-bad ml-1" title="Waiting on setup" />}
              {editing && s.role !== "reporter" && (
                <button type="button" className="ml-1 text-bad" title={`Let ${s.name} go`} aria-label={`Remove ${s.name}`} onClick={() => update((d) => void (d.city!.staff = d.city!.staff.filter((x) => x.id !== s.id)))}>
                  <Icon name="boom" size={18} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {(building.rooms?.length ?? 0) > 0 && !editing && (
        <div className="mt-2 text-sm font-bold text-muted">Rooms: Progress Room, Mission Room, {building.rooms!.map((r) => r.name).join(", ")}</div>
      )}
      {editing && (
        <div className="mt-3 space-y-3 border-t-2 border-line pt-3">
          {building.kind !== "client" && <EditableText label="Building name" value={building.name} onChange={(v) => edit((b) => void (b.name = v.trim() || b.name))} />}
          <label className="flex items-center gap-2 font-bold">
            Roof colour
            <input type="color" value={roofColor(building)} onChange={(e) => edit((b) => void (b.color = e.target.value))} className="w-12 h-9 p-0 border-2 border-outline rounded" />
          </label>
          <div className="flex gap-2 flex-wrap items-center">
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRoleId)} className="flex-1 min-w-44">
              {ROLE_LIST.filter((r) => r.id !== "reporter").map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
            <Btn kind="primary" onClick={() => (update((d) => void d.city!.staff.push(newStaff(d.city!, building.id, role, today))), sfx("coin"))}>
              Hire
            </Btn>
          </div>
          <div>
            <div className="text-sm font-extrabold uppercase text-muted mb-1">Rooms</div>
            <ul className="flex flex-wrap gap-2 mb-2">
              <li><Badge tone="gold">Progress Room</Badge></li>
              <li><Badge tone="accent">Mission Room</Badge></li>
              {(building.rooms ?? []).map((r) => (
                <li key={r.id} className="flex items-center gap-1">
                  <Badge tone="hero">{r.name}</Badge>
                  <button type="button" className="text-bad" aria-label={`Remove ${r.name}`} onClick={() => edit((b) => void (b.rooms = (b.rooms ?? []).filter((x) => x.id !== r.id)))}>
                    <Icon name="boom" size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 flex-wrap">
              <input className="flex-1 min-w-44" value={room} placeholder="New room, e.g. Content Vault" onChange={(e) => setRoom(e.target.value)} />
              <Btn
                onClick={() => {
                  if (!room.trim()) return;
                  edit((b) => void (b.rooms = [...(b.rooms ?? []), { id: uid("room"), name: room.trim() }]));
                  setRoom("");
                }}
              >
                Add room
              </Btn>
            </div>
          </div>
          <Btn
            kind="danger"
            onClick={() => {
              if (confirm(`Knock down ${buildingName(data, building)} and let its staff go? ${building.clientId ? "The client itself stays in Clients." : ""}`)) update((d) => removeBuilding(d.city!, building.id));
            }}
          >
            Knock down building
          </Btn>
        </div>
      )}
    </div>
  );
}

function NewBuilding() {
  const { update, today } = useTracker();
  const [name, setName] = useState("");
  const add = () => {
    if (!name.trim()) return;
    update((d) => void newBuilding(d.city!, { kind: "custom", name: name.trim() }, ["reporter"], today));
    setName("");
    sfx("loot");
  };
  return (
    <div className="flex gap-2 flex-wrap">
      <input className="flex-1 min-w-52" value={name} placeholder="Build something new, e.g. Recruitment Center" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
      <Btn kind="primary" onClick={add}>
        <Icon name="home" size={20} /> Build
      </Btn>
    </div>
  );
}
