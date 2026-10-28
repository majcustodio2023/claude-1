// Shape and validation of an application from the /rdr page. No server-only imports, so tests can use it.

export interface Application {
  name: string;
  business: string;
  role?: string;
  email: string;
  phone?: string;
  industry?: string;
  goals: string[];
  offer?: string;
  worth?: string;
  challenge?: string;
  links?: string;
  source?: string;
}

export interface StoredApplication extends Application {
  id: string;
  receivedAt: string;
}

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function parseApplication(body: unknown): { ok: true; value: Application } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Send the application as JSON." };
  const b = body as Record<string, unknown>;
  const name = str(b.name, 120);
  const business = str(b.business, 160);
  const email = str(b.email, 160);
  if (name.length < 2) return { ok: false, error: "Tell us your name." };
  if (business.length < 2) return { ok: false, error: "Tell us the name of your business." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter an email address we can reply to." };
  const goals = Array.isArray(b.goals) ? b.goals.map((g) => str(g, 40)).filter(Boolean).slice(0, 10) : [];
  // Honeypot: real visitors never fill this.
  if (str(b.website)) return { ok: false, error: "Could not send." };
  return {
    ok: true,
    value: {
      name,
      business,
      role: str(b.role, 120) || undefined,
      email,
      phone: str(b.phone, 60) || undefined,
      industry: str(b.industry, 120) || undefined,
      goals,
      offer: str(b.offer, 40) || undefined,
      worth: str(b.worth, 120) || undefined,
      challenge: str(b.challenge, 2000) || undefined,
      links: str(b.links, 600) || undefined,
      source: str(b.source, 120) || undefined,
    },
  };
}

