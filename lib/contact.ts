// Contact info helpers shared by the squad, clients and deals.

import type { Contact } from "./types";

export const CONTACT_FIELDS: { key: keyof Contact; label: string; placeholder: string; type?: string }[] = [
  { key: "person", label: "Contact person", placeholder: "Who you talk to" },
  { key: "company", label: "Company", placeholder: "Business name" },
  { key: "phone", label: "Phone", placeholder: "+63 917 123 4567", type: "tel" },
  { key: "email", label: "Email", placeholder: "name@company.com", type: "email" },
  { key: "chat", label: "Chat", placeholder: "Messenger / WhatsApp link or @handle" },
  { key: "website", label: "Website or page", placeholder: "company.com" },
  { key: "address", label: "Address", placeholder: "City or full address" },
];

/** Cleans a contact: trims fields and drops empty ones. Undefined when nothing is left. */
export function cleanContact(c: Contact | undefined): Contact | undefined {
  if (!c) return undefined;
  const out: Contact = {};
  for (const f of CONTACT_FIELDS) {
    const v = c[f.key]?.trim();
    if (v) out[f.key] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export const hasContact = (c: Contact | undefined) => !!cleanContact(c);

/** A safe https link for a website or chat link the user typed, or null if it isn't one. */
export function webLink(v: string): string | null {
  const s = v.trim();
  if (/^https?:\/\//i.test(s)) return s;
  // Bare domains like "company.com" or "m.me/name".
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(s)) return `https://${s}`;
  return null;
}

