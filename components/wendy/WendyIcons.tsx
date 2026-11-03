// Wendy's own line icons: soft, rounded strokes (no emoji, no icon fonts).

type Name =
  | "wand"
  | "sparkle"
  | "palette"
  | "type"
  | "camera"
  | "cart"
  | "calendar"
  | "check"
  | "link"
  | "gear"
  | "heart"
  | "browser"
  | "close"
  | "pen"
  | "plus"
  | "copy"
  | "refresh"
  | "trash"
  | "eye";

const PATHS: Record<Name, React.ReactNode> = {
  wand: (
    <>
      <path d="M4 20 15 9" />
      <path d="m14 6 4 4" />
      <path d="M18 2.5v3M16.5 4h3M21 8.5v2M20 9.5h2M9 3.5v2M8 4.5h2" />
    </>
  ),
  sparkle: <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" />,
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.3 0 2-.8 2-1.8 0-1.3-1.2-1.6-1.2-2.8 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3Z" />
      <circle cx="7.5" cy="11" r="1.2" />
      <circle cx="10.5" cy="7" r="1.2" />
      <circle cx="15" cy="7.5" r="1.2" />
    </>
  ),
  type: (
    <>
      <path d="M4 7V5h12v2M10 5v14M7.5 19h5" />
      <path d="M14 12h6M17 12v7M15.5 19h3" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.2 10.5h10.6L20 7H6.2" />
      <circle cx="9" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M4 10h16M9 3v4M15 3v4" />
      <path d="m9.5 15 1.8 1.8 3.4-3.6" />
    </>
  ),
  check: <path d="m5 12.5 4.2 4.2L19 7" />,
  link: (
    <>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />,
  browser: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="3" />
      <path d="M3 9h18" />
      <circle cx="6.5" cy="6.8" r=".6" />
      <circle cx="8.8" cy="6.8" r=".6" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  pen: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="3" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.6L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.3 4.6L20 16" />
      <path d="M20 20v-4h-4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

export function WIcon({ name, size = 22, className, fill }: { name: Name; size?: number; className?: string; fill?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={fill ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/** Wendy's mark: a crowned, ribboned W in a soft circle. */
export function WendyMark({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="wd-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7a45b8" />
          <stop offset="0.55" stopColor="#5e2b97" />
          <stop offset="1" stopColor="#d9579a" />
        </linearGradient>
        <linearGradient id="wd-mark-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4fa" />
          <stop offset="1" stopColor="#f8cfe0" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#wd-mark-bg)" />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" />
      <path d="M22 17.5 25.5 13l3.2 4 3.3-5 3.3 5 3.2-4 3.5 4.5-1.6 3.2H23.6Z" fill="url(#wd-mark-gold)" />
      <path
        d="M15.5 25.5h6l4.6 16 5.9-16h0l5.9 16 4.6-16h6L40.8 48h-5.2L32 37.6 28.4 48h-5.2Z"
        fill="#fff"
      />
      <circle cx="49" cy="17" r="2.2" fill="#fff" fillOpacity="0.85" />
      <circle cx="14" cy="45" r="1.5" fill="#fff" fillOpacity="0.7" />
    </svg>
  );
}
