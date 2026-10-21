// What each client buys from you. A client building's services decide who works on its floor:
// add "Facebook ads" and the ads staff move in; staff on no service stay on the books (nothing is
// deleted) but leave the floor. Pure, so it's unit-tested.

import { newStaff } from "./city";
import type { CityBuilding, CityService, CityStaff, CityState, StaffRoleId } from "./types";

/** Starting points when adding a service. Every name, note and role can be changed after. */
export const SERVICE_TEMPLATES: { name: string; roles: StaffRoleId[] }[] = [
  { name: "Social media management", roles: ["social", "content", "insights"] },
  { name: "Paid ads (Meta)", roles: ["ads", "adsTracker", "imageCopy"] },
  { name: "Ad creatives", roles: ["scriptWriter", "copyWriter", "imageAI"] },
  { name: "Video editing", roles: ["videoEdit", "videoScript"] },
  { name: "Funnel build", roles: ["funnel", "copyWriter"] },
  { name: "Email marketing", roles: ["email", "copyWriter"] },
  { name: "Community management", roles: ["discord"] },
  { name: "Webinars", roles: ["webinar"] },
  { name: "App support", roles: ["app"] },
  { name: "E-commerce store", roles: ["store"] },
  { name: "Other", roles: ["custom"] },
];

/** Staff on the building's floor: everyone when no services are set, else those on a service (and the reporter). */
export function staffOnFloor(b: Pick<CityBuilding, "services">, staff: CityStaff[]): CityStaff[] {
  const services = b.services ?? [];
  if (!services.length) return staff;
  const on = new Set(services.flatMap((s) => s.staffIds));
  return staff.filter((s) => s.role === "reporter" || on.has(s.id));
}

/** Adds a service, reusing staff already in the building for its roles and hiring the rest. */
export function addService(city: CityState, buildingId: string, name: string, roles: StaffRoleId[], today: string, notes?: string): CityService {
  const b = city.buildings.find((x) => x.id === buildingId);
  if (!b) throw new Error("No such building");
  const here = city.staff.filter((s) => s.buildingId === buildingId);
  const staffIds = roles.map((role) => {
    const s = here.find((x) => x.role === role) ?? newStaff(city, buildingId, role, today);
    if (!city.staff.includes(s)) city.staff.push(s);
    return s.id;
  });
  const svc: CityService = { id: `svc-${Math.random().toString(36).slice(2, 9)}`, name: name.trim() || "Service", notes: notes?.trim() || undefined, staffIds: [...new Set(staffIds)] };
  b.services = [...(b.services ?? []), svc];
  return svc;
}

/** Each staff member's services, for nameplates and briefs. */
export function servicesOf(b: Pick<CityBuilding, "services">, staffId: string): CityService[] {
  return (b.services ?? []).filter((s) => s.staffIds.includes(staffId));
}

/** Plain text staff read: what the client buys and who delivers it. */
export function servicesBrief(b: Pick<CityBuilding, "services">, staff: CityStaff[]): string {
  const list = b.services ?? [];
  if (!list.length) return "";
  const name = (id: string) => staff.find((s) => s.id === id)?.name ?? "someone";
  return `Services this client pays for:\n${list.map((s) => `- ${s.name}${s.notes ? `: ${s.notes.slice(0, 400)}` : ""} (delivered by ${s.staffIds.map(name).join(", ") || "nobody yet"})`).join("\n")}`;
}
