"use client";

import type { Contact } from "@/lib/types";
import { CONTACT_FIELDS as FIELDS, cleanContact, webLink } from "@/lib/contact";
import { Icon } from "./icons";
import { TextInput } from "./ui";

// Contact info for anyone in the app (squad, clients, bosses). Fields to fill while
// editing; tappable chips (call, email, chat, website, map) once saved.


export function ContactFields({ value, onChange }: { value: Contact | undefined; onChange: (c: Contact | undefined) => void }) {
  const v = value ?? {};
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {FIELDS.map((f) => (
        <label key={f.key} className="block text-sm font-extrabold uppercase text-muted">
          {f.label}
          <TextInput
            className="w-full mt-1 text-base normal-case font-bold"
            type={f.type}
            value={v[f.key]}
            placeholder={f.placeholder}
            onChange={(x) => {
              // Keep what's typed as is (spaces included); empty fields drop out.
              const next: Contact = { ...v, [f.key]: x || undefined };
              onChange(Object.values(next).some(Boolean) ? next : undefined);
            }}
          />
        </label>
      ))}
    </div>
  );
}

/** Saved contact info as tappable chips. Renders nothing when there's none. */
export function ContactChips({ value, className = "" }: { value: Contact | undefined; className?: string }) {
  const c = cleanContact(value);
  if (!c) return null;
  const chip = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-outline bg-card-2 text-sm font-bold max-w-full min-w-0";
  const link = `${chip} hover:bg-accent/25 text-ink no-underline`;
  const label = (t: string) => <span className="truncate">{t}</span>;
  const chatHref = c.chat ? webLink(c.chat) : null;
  const siteHref = c.website ? webLink(c.website) : null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {(c.person || c.company) && (
        <span className={chip}>
          <Icon name="user" size={16} />
          {label([c.person, c.company].filter(Boolean).join(" · "))}
        </span>
      )}
      {c.phone && (
        <a className={link} href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} title={`Call ${c.phone}`}>
          <Icon name="phone" size={16} />
          {label(c.phone)}
        </a>
      )}
      {c.email && (
        <a className={link} href={`mailto:${c.email}`} title={`Email ${c.email}`}>
          <Icon name="mail" size={16} />
          {label(c.email)}
        </a>
      )}
      {c.chat &&
        (chatHref ? (
          <a className={link} href={chatHref} target="_blank" rel="noopener noreferrer" title="Open chat">
            <Icon name="chat" size={16} />
            {label(c.chat.replace(/^https?:\/\/(www\.)?/i, ""))}
          </a>
        ) : (
          <span className={chip}>
            <Icon name="chat" size={16} />
            {label(c.chat)}
          </span>
        ))}
      {c.website &&
        (siteHref ? (
          <a className={link} href={siteHref} target="_blank" rel="noopener noreferrer" title="Open website">
            <Icon name="globe" size={16} />
            {label(c.website.replace(/^https?:\/\/(www\.)?/i, ""))}
          </a>
        ) : (
          <span className={chip}>
            <Icon name="globe" size={16} />
            {label(c.website)}
          </span>
        ))}
      {c.address && (
        <a className={link} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`} target="_blank" rel="noopener noreferrer" title="Open in maps">
          <Icon name="pin" size={16} />
          {label(c.address)}
        </a>
      )}
    </div>
  );
}
