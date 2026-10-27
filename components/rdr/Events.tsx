import { formatEventDate, nextEvent } from "@/lib/rdr/events";
import { ApplyButton } from "./ui";

/** Shows only the next active event. No expired dates, no invented urgency. */
export function NextEvent({ cta }: { cta: string }) {
  const e = nextEvent();
  if (!e) {
    return (
      <div className="rdr-event-none">
        <p className="t-sub">The next live event with Boss RDR has not been announced yet.</p>
        <p className="t-soft">Apply and tell the team you want in; you will hear about the next date before it goes public.</p>
        <ApplyButton offer="events">{cta}</ApplyButton>
      </div>
    );
  }
  return (
    <div className="rdr-event">
      <p className="when">{formatEventDate(e)}</p>
      <p className="t-sub">{e.title}</p>
      <p>
        {e.venue ? `${e.venue}, ` : ""}
        {e.city}
      </p>
      {e.note && <p>{e.note}</p>}
      <a className="rbtn" href={e.url} target="_blank" rel="noopener">
        {cta}
      </a>
    </div>
  );
}
