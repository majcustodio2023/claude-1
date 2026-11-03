"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { goals, offers } from "@/lib/rdr/content";

type Status = "idle" | "sending" | "done" | "error";

export function ApplyModal() {
  const [open, setOpen] = useState(false);
  const [offer, setOffer] = useState("general");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const onApply = (e: Event) => {
      const d = (e as CustomEvent<{ offer?: string; source?: string }>).detail ?? {};
      opener.current = document.activeElement;
      setOffer(d.offer ?? "general");
      setSource(d.source ?? "");
      setStatus("idle");
      setError("");
      setOpen(true);
    };
    window.addEventListener("rdr:apply", onApply);
    return () => window.removeEventListener("rdr:apply", onApply);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>("input, select, textarea, button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panel.current) {
        const f = Array.from(panel.current.querySelectorAll<HTMLElement>("input, select, textarea, button, a[href]")).filter((el) => !el.hasAttribute("disabled"));
        if (!f.length) return;
        const firstEl = f[0];
        const lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      business: fd.get("business"),
      role: fd.get("role"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      industry: fd.get("industry"),
      goals: fd.getAll("goals"),
      offer: fd.get("offer"),
      worth: fd.get("worth"),
      challenge: fd.get("challenge"),
      links: fd.get("links"),
      website: fd.get("website"),
      source,
    };
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/rdr/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not send the application.");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  const offerName = offers.find((o) => o.key === offer)?.name;

  return (
    <div className="rdr-modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="panel" role="dialog" aria-modal="true" aria-labelledby="rdr-apply-title" ref={panel}>
        <div className="top">
          <div>
            <h2 id="rdr-apply-title" className="t-h3 t-display">
              {status === "done" ? "Received." : "Tell me what you want to grow."}
            </h2>
            {status !== "done" && <p className="t-soft" style={{ marginTop: 8 }}>Free to apply. My team reviews every qualified application.</p>}
          </div>
          <button type="button" className="close" aria-label="Close" onClick={() => setOpen(false)} />
        </div>

        {status === "done" ? (
          <div className="done">
            <p className="t-statement">Your application is with the RDR team. We read every qualified one and reply by email.</p>
            <p className="t-soft">While you wait, the case studies and platforms on this page show what we look for in a story worth selling.</p>
            <button type="button" className="rbtn" onClick={() => setOpen(false)}>
              Back to the page
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="stack-lg" noValidate>
            <div className="field-row">
              <div>
                <label htmlFor="ap-name">Your name</label>
                <input id="ap-name" name="name" required autoComplete="name" />
              </div>
              <div>
                <label htmlFor="ap-role">Your role</label>
                <input id="ap-role" name="role" placeholder="Founder, CEO, owner" autoComplete="organization-title" />
              </div>
            </div>
            <div className="field-row">
              <div>
                <label htmlFor="ap-business">Your company</label>
                <input id="ap-business" name="business" required autoComplete="organization" />
              </div>
              <div>
                <label htmlFor="ap-industry">Industry</label>
                <input id="ap-industry" name="industry" placeholder="Food, beauty, industrial, services…" />
              </div>
            </div>
            <div className="field-row">
              <div>
                <label htmlFor="ap-email">Email</label>
                <input id="ap-email" name="email" type="email" required autoComplete="email" inputMode="email" />
              </div>
              <div>
                <label htmlFor="ap-phone">Mobile or Viber</label>
                <input id="ap-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" />
              </div>
            </div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontWeight: 600, marginBottom: 8 }}>What do you need? Pick everything that applies.</legend>
              <div className="goals">
                {goals.map((g) => (
                  <label key={g.key}>
                    <input type="checkbox" name="goals" value={g.key} />
                    {g.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="field-row">
              <div>
                <label htmlFor="ap-offer">Platform you have in mind</label>
                <select id="ap-offer" name="offer" defaultValue={offer}>
                  <option value="general">Not sure yet, point me to the right one</option>
                  {offers.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ap-worth">What is one new customer, franchisee, distributor or partnership worth to you?</label>
                <input id="ap-worth" name="worth" placeholder="₱" inputMode="numeric" />
              </div>
            </div>
            <div>
              <label htmlFor="ap-challenge">Your offer, your numbers, your challenge, your goal</label>
              <textarea id="ap-challenge" name="challenge" placeholder="What you sell, roughly where the business is today, and what outcome you want from being known." />
            </div>
            <div>
              <label htmlFor="ap-links">Links to your website or pages</label>
              <input id="ap-links" name="links" placeholder="https://" inputMode="url" />
            </div>
            <div style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
              <label htmlFor="ap-website">Website</label>
              <input id="ap-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            {error && <p className="err" role="alert">{error}</p>}
            <button type="submit" className="rbtn rbtn-lg rbtn-block" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : offerName ? `Send my application for ${offerName}` : "Send my application to Boss RDR"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
