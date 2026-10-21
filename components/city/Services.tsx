"use client";

// A client building's services: what the client buys from you and who delivers each one. Once a
// building has services, its floor shows the staff on them (plus the reporter). Staff on no service
// aren't deleted; they just leave the floor until a service needs them again.

import { useState } from "react";
import { useTracker } from "../App";
import { Icon } from "../icons";
import { Badge, Btn } from "../ui";
import { EditButton, SaveButton } from "../editable";
import { ROLE_LIST, titleOf } from "@/lib/city";
import { SERVICE_TEMPLATES, addService, staffOnFloor } from "@/lib/services";
import type { CityBuilding, StaffRoleId } from "@/lib/types";

export function ServicesPanel({ building }: { building: CityBuilding }) {
  const { data, update, today } = useTracker();
  const [editing, setEditing] = useState("");
  const [adding, setAdding] = useState(false);
  const [tpl, setTpl] = useState(0);
  const [name, setName] = useState(SERVICE_TEMPLATES[0].name);
  const [roles, setRoles] = useState<StaffRoleId[]>(SERVICE_TEMPLATES[0].roles);
  if (building.kind === "home" || building.kind === "training" || building.kind === "weapons" || building.kind === "armor") return null;
  const staff = (data.city?.staff ?? []).filter((s) => s.buildingId === building.id);
  const services = building.services ?? [];
  const floor = new Set(staffOnFloor(building, staff).map((s) => s.id));
  const off = staff.filter((s) => !floor.has(s.id));
  const edit = (fn: (b: CityBuilding) => void) => update((d) => fn(d.city!.buildings.find((b) => b.id === building.id)!));

  return (
    <div className="mt-4 border-t-2 border-line pt-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="briefcase" size={22} />
        <h4 className="font-display text-xl tracking-wide flex-1">Services</h4>
        {!adding && <Btn className="text-sm py-1" onClick={() => setAdding(true)}>Add a service</Btn>}
      </div>
      {services.length === 0 && !adding && <p className="text-base text-muted">No services listed yet, so everyone in the building works the floor. Add what this client pays for and the right staff move in.</p>}
      <ul className="space-y-2">
        {services.map((svc) =>
          editing === svc.id ? (
            <li key={svc.id} className="border-2 border-outline rounded-md p-2 space-y-2 bg-card-2">
              <input className="w-full text-base" value={svc.name} onChange={(e) => edit((b) => void (b.services!.find((x) => x.id === svc.id)!.name = e.target.value))} placeholder="Service name" />
              <textarea className="w-full text-base" rows={2} value={svc.notes ?? ""} onChange={(e) => edit((b) => void (b.services!.find((x) => x.id === svc.id)!.notes = e.target.value))} placeholder="What's included, deliverables, how often" />
              <div className="text-sm font-extrabold">Who delivers it</div>
              <div className="flex flex-wrap gap-2">
                {staff.map((s) => (
                  <label key={s.id} className="flex items-center gap-1 text-base">
                    <input
                      type="checkbox"
                      checked={svc.staffIds.includes(s.id)}
                      onChange={(e) =>
                        edit((b) => {
                          const x = b.services!.find((y) => y.id === svc.id)!;
                          x.staffIds = e.target.checked ? [...x.staffIds, s.id] : x.staffIds.filter((id) => id !== s.id);
                        })
                      }
                    />
                    {s.name} <span className="text-muted">({titleOf(s)})</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <SaveButton onClick={() => setEditing("")} />
                <Btn kind="danger" onClick={() => confirm(`Remove ${svc.name}? Its staff stay on the books.`) && (edit((b) => void (b.services = b.services!.filter((x) => x.id !== svc.id))), setEditing(""))}>Remove</Btn>
              </div>
            </li>
          ) : (
            <li key={svc.id} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold">{svc.name}</div>
                {svc.notes && <div className="text-base text-muted whitespace-pre-wrap">{svc.notes}</div>}
                <div className="flex flex-wrap gap-1 mt-1">
                  {svc.staffIds.map((id) => staff.find((s) => s.id === id)).filter(Boolean).map((s) => <Badge key={s!.id} tone="accent">{s!.name} · {titleOf(s!)}</Badge>)}
                  {!svc.staffIds.length && <Badge tone="warn">Nobody on it</Badge>}
                </div>
              </div>
              <EditButton onClick={() => setEditing(svc.id)} />
            </li>
          ),
        )}
      </ul>
      {adding && (
        <div className="border-2 border-outline rounded-md p-2 space-y-2 bg-card-2 mt-2">
          <select
            className="w-full text-base"
            value={tpl}
            onChange={(e) => {
              const i = Number(e.target.value);
              setTpl(i);
              setName(SERVICE_TEMPLATES[i].name);
              setRoles(SERVICE_TEMPLATES[i].roles);
            }}
          >
            {SERVICE_TEMPLATES.map((t, i) => <option key={t.name} value={i}>{t.name}</option>)}
          </select>
          <input className="w-full text-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="Service name, as you sell it" />
          <div className="text-sm font-extrabold">Staff it needs (existing staff are reused, the rest are hired)</div>
          <div className="flex flex-wrap gap-2">
            {ROLE_LIST.filter((r) => r.id !== "reporter").map((r) => (
              <label key={r.id} className="flex items-center gap-1 text-base">
                <input type="checkbox" checked={roles.includes(r.id)} onChange={(e) => setRoles(e.target.checked ? [...roles, r.id] : roles.filter((x) => x !== r.id))} />
                {r.title}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Btn kind="primary" disabled={!name.trim()} onClick={() => {
                update((d) => void addService(d.city!, building.id, name, roles, today));
                // Start the next one fresh.
                setAdding(false);
                setTpl(0);
                setName(SERVICE_TEMPLATES[0].name);
                setRoles(SERVICE_TEMPLATES[0].roles);
              }}>Add service</Btn>
            <Btn onClick={() => setAdding(false)}>Cancel</Btn>
          </div>
        </div>
      )}
      {services.length > 0 && off.length > 0 && <p className="text-sm text-muted mt-2">Off the floor (on no service): {off.map((s) => s.name).join(", ")}. Tick them on a service to bring them back.</p>}
    </div>
  );
}
