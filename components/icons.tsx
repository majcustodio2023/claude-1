import type { ReactNode, SVGProps } from "react";

// The app's own icon set: duotone line icons on a 24px grid, drawn in currentColor
// so they pick up the theme. A soft fill (the "tone" layer) gives them weight.

const tone = { fill: "currentColor", opacity: 0.28, stroke: "none" } as const;

const P: Record<string, ReactNode> = {
  home: (
    <>
      <path {...tone} d="M5 10.5 12 4.5l7 6V20H5z" />
      <path d="M3 11.5 12 3.8l9 7.7M5.5 9.6V20.2h13V9.6" />
      <path d="M10 20.2v-5.4h4v5.4" />
    </>
  ),
  shop: (
    <>
      <path {...tone} d="M6.2 7h14l-1.6 7.6H7.6z" />
      <path d="M2.8 3.8h2.6l2.4 11h10.6l2-8H6.2" />
      <circle cx="9.4" cy="19" r="1.7" />
      <circle cx="17" cy="19" r="1.7" />
    </>
  ),
  income: (
    <>
      <path {...tone} d="M7 9.5c-2.4 2.2-3.3 5-2.6 7.5.6 2.2 2.8 3.4 7.6 3.4s7-1.2 7.6-3.4c.7-2.5-.2-5.3-2.6-7.5z" />
      <path d="M7 9.5c-2.4 2.2-3.3 5-2.6 7.5.6 2.2 2.8 3.4 7.6 3.4s7-1.2 7.6-3.4c.7-2.5-.2-5.3-2.6-7.5z" />
      <path d="M8.5 9.5 7 4.2c1.6.8 3.2.8 5 0 1.8.8 3.4.8 5 0l-1.5 5.3" />
      <path d="M13.8 12.6c-.5-.6-1.2-.8-1.9-.8-1 0-1.9.5-1.9 1.4 0 2 3.9 1 3.9 3 0 .9-.9 1.5-2 1.5-.8 0-1.6-.3-2.1-.9M12 10.7v1.1M12 17.7v1.1" />
    </>
  ),
  swords: (
    <>
      <path d="M4 4h3.5l9 9M4 4v3.5l9 9" />
      <path d="M20 4h-3.5l-9 9M20 4v3.5l-9 9" />
      <path d="m14 17.5 3.5-3.5M6.5 14l3.5 3.5M16.2 16.2l3.6 3.6M7.8 16.2l-3.6 3.6" />
    </>
  ),
  receipt: (
    <>
      <path {...tone} d="M5.5 3h13v18l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5z" />
      <path d="M5.5 3h13v18l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </>
  ),
  checkin: (
    <>
      <path {...tone} d="M4 4h11v16H4z" />
      <path d="M15 12.5V20H4V4h11v2" />
      <path d="M7 8.5h5M7 12h3.5M7 15.5h2.5" />
      <path d="M19.5 5.5 21 7l-7.5 7.5-2.4.9.9-2.4z" />
    </>
  ),
  clients: (
    <>
      <path {...tone} d="M3 7.5h18V19H3z" />
      <path d="M3 19V6.2C3 5.5 3.5 5 4.2 5h4.5l2 2.5h9.1c.7 0 1.2.5 1.2 1.2V19z" />
      <circle cx="12" cy="12.2" r="2" />
      <path d="M8.6 17.5c.6-1.6 1.9-2.5 3.4-2.5s2.8.9 3.4 2.5" />
    </>
  ),
  target: (
    <>
      <circle {...tone} cx="11" cy="13" r="8" />
      <circle cx="11" cy="13" r="8" />
      <circle cx="11" cy="13" r="4.4" />
      <circle cx="11" cy="13" r="1" fill="currentColor" />
      <path d="m11 13 7.5-7.5M16.2 4.2l2.3 1.3 1.3 2.3" />
    </>
  ),
  squad: (
    <>
      <path {...tone} d="M12 3 4.5 6v5.5c0 4.6 3.1 8.1 7.5 9.5 4.4-1.4 7.5-4.9 7.5-9.5V6z" />
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.1 7.5 9.5 4.4-1.4 7.5-4.9 7.5-9.5V6z" />
      <circle cx="12" cy="10" r="2.3" />
      <path d="M8.3 16c.8-1.8 2.1-2.8 3.7-2.8s2.9 1 3.7 2.8" />
    </>
  ),
  radar: (
    <>
      <path {...tone} d="M12 12 19 5.5A9.5 9.5 0 0 1 21.5 12z" />
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 12 19 5.5" />
      <circle cx="15.6" cy="9" r="1.1" fill="currentColor" />
    </>
  ),
  palette: (
    <>
      <path {...tone} d="M12 3a9 9 0 0 0 0 18c1.4 0 2-.9 2-1.9 0-1.4-1.3-1.8-1.3-3 0-1 .8-1.6 1.8-1.6h2.4A4.1 4.1 0 0 0 21 10.4C21 6.3 17 3 12 3z" />
      <path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-.9 2-1.9 0-1.4-1.3-1.8-1.3-3 0-1 .8-1.6 1.8-1.6h2.4A4.1 4.1 0 0 0 21 10.4C21 6.3 17 3 12 3z" />
      <circle cx="7.5" cy="11" r="1.2" fill="currentColor" />
      <circle cx="10" cy="7" r="1.2" fill="currentColor" />
      <circle cx="15" cy="7.3" r="1.2" fill="currentColor" />
    </>
  ),
  gear: (
    <>
      <circle {...tone} cx="12" cy="12" r="7" />
      <path d="M10.3 3h3.4l.5 2.4 1.8.8 2.1-1.3 2.4 2.4-1.3 2.1.8 1.8 2.4.5v3.4l-2.4.5-.8 1.8 1.3 2.1-2.4 2.4-2.1-1.3-1.8.8-.5 2.4h-3.4l-.5-2.4-1.8-.8-2.1 1.3-2.4-2.4 1.3-2.1-.8-1.8L3 13.7v-3.4l2.4-.5.8-1.8-1.3-2.1 2.4-2.4 2.1 1.3 1.8-.8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  gift: (
    <>
      <path {...tone} d="M4 11h16v10H4z" />
      <path d="M3 7.5h18V11H3zM4.5 11v10h15V11M12 7.5V21" />
      <path d="M12 7.5c-1.5-3-5-4-5.5-1.8C6.1 7.4 9 7.5 12 7.5c3 0 5.9-.1 5.5-1.8-.5-2.2-4-1.2-5.5 1.8z" />
    </>
  ),
  coin: (
    <>
      <circle {...tone} cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="6" />
      <path d="M12 8.5v7M10 10.2h3.2a1.3 1.3 0 0 1 0 2.6h-2.4a1.3 1.3 0 0 0 0 2.6H14" />
    </>
  ),
  dragon: (
    <>
      <path {...tone} d="M3.5 19.5c-.8-4.5 1.2-8.5 5.5-10L7.5 4l4.3 3.6L14 3.5l1.2 4.6c3 .6 5.3 2.4 6.3 5.2l-4.5 1.2-2 2.5H11l-1.5 2.5z" />
      <path d="M3.5 19.5c-.8-4.5 1.2-8.5 5.5-10L7.5 4l4.3 3.6L14 3.5l1.2 4.6c3 .6 5.3 2.4 6.3 5.2l-4.5 1.2-2 2.5H11l-1.5 2.5z" />
      <path d="M12.5 11.2c.8-.6 1.8-.6 2.6 0M19 12.2l.1.1M15 16.5l-.8 1.5M12.5 16.5l-.5 1.3" />
    </>
  ),
  shield: (
    <>
      <path {...tone} d="M12 3 4.5 6v5.5c0 4.6 3.1 8.1 7.5 9.5 4.4-1.4 7.5-4.9 7.5-9.5V6z" />
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.1 7.5 9.5 4.4-1.4 7.5-4.9 7.5-9.5V6z" />
      <path d="m8.5 12 2.4 2.4 4.6-5" />
    </>
  ),
  trophy: (
    <>
      <path {...tone} d="M7 3.5h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 3.5h10v5a5 5 0 0 1-10 0zM7 5.5H4.2c0 3 1.2 4.6 3.3 5M17 5.5h2.8c0 3-1.2 4.6-3.3 5" />
      <path d="M12 13.5v3.5M8 20.5h8M9.5 20.5c0-1.9 1-3.5 2.5-3.5s2.5 1.6 2.5 3.5" />
    </>
  ),
  bolt: (
    <>
      <path {...tone} d="M13.5 2.5 5 13.5h6l-1.5 8 8.5-11h-6z" />
      <path d="M13.5 2.5 5 13.5h6l-1.5 8 8.5-11h-6z" />
    </>
  ),
  scroll: (
    <>
      <path {...tone} d="M6.5 4h11v13.5a2.5 2.5 0 0 1-2.5 2.5H6.5z" />
      <path d="M6.5 17V4h12a2 2 0 0 1 2 2v1.5h-2M6.5 4a2 2 0 0 0-2 2v1.5h2" />
      <path d="M18.5 7.5v10a2.5 2.5 0 0 1-2.5 2.5H5.5a2.5 2.5 0 0 0 2.5-2.5V17" />
      <path d="M9.5 8.5h6M9.5 11.5h6M9.5 14.5h4" />
    </>
  ),
  flame: (
    <>
      <path {...tone} d="M12 21.5c-4 0-6.5-2.6-6.5-6.2 0-4 3.3-6 3.8-10.3 2.7 1.7 3.6 4 3.6 6 1-.6 1.6-1.6 1.8-3 1.9 1.8 3.8 4.4 3.8 7.3 0 3.6-2.5 6.2-6.5 6.2z" />
      <path d="M12 21.5c-4 0-6.5-2.6-6.5-6.2 0-4 3.3-6 3.8-10.3 2.7 1.7 3.6 4 3.6 6 1-.6 1.6-1.6 1.8-3 1.9 1.8 3.8 4.4 3.8 7.3 0 3.6-2.5 6.2-6.5 6.2z" />
      <path d="M12 21.5c-1.7 0-2.8-1.1-2.8-2.7 0-1.9 1.6-2.6 2.1-4.3 1.7 1 3.5 2.4 3.5 4.3 0 1.6-1.1 2.7-2.8 2.7z" />
    </>
  ),
  bank: (
    <>
      <path {...tone} d="M3.5 9 12 4l8.5 5z" />
      <path d="M3 9.2 12 4l9 5.2zM3 20.5h18M4.5 18h15" />
      <path d="M6 11.5V18M10 11.5V18M14 11.5V18M18 11.5V18" />
    </>
  ),
  megaphone: (
    <>
      <path {...tone} d="M4 9.5h4l9-5v15l-9-5H4z" />
      <path d="M4 9.5h4l9-5v15l-9-5H4zM8 14.5l1.5 5.5h2.5L11 15.8" />
      <path d="M20 9.5c.8.7 1.2 1.6 1.2 2.5s-.4 1.8-1.2 2.5" />
    </>
  ),
  star: (
    <>
      <path {...tone} d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z" />
      <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z" />
    </>
  ),
  sparkles: (
    <>
      <path {...tone} d="M10 3c.6 4 2.4 5.8 6.5 6.5-4.1.7-5.9 2.5-6.5 6.5-.6-4-2.4-5.8-6.5-6.5C7.6 8.8 9.4 7 10 3z" />
      <path d="M10 3c.6 4 2.4 5.8 6.5 6.5-4.1.7-5.9 2.5-6.5 6.5-.6-4-2.4-5.8-6.5-6.5C7.6 8.8 9.4 7 10 3zM18 14c.3 2 1.2 2.9 3 3.2-1.8.3-2.7 1.2-3 3.3-.3-2.1-1.2-3-3-3.3 1.8-.3 2.7-1.2 3-3.2z" />
    </>
  ),
  speaker: (
    <>
      <path {...tone} d="M4 9h3.5L13 4.5v15L7.5 15H4z" />
      <path d="M4 9h3.5L13 4.5v15L7.5 15H4z" />
      <path d="M16.5 9c.8.8 1.2 1.9 1.2 3s-.4 2.2-1.2 3M19 6.5c1.5 1.5 2.3 3.4 2.3 5.5S20.5 16 19 17.5" />
    </>
  ),
  mute: (
    <>
      <path {...tone} d="M4 9h3.5L13 4.5v15L7.5 15H4z" />
      <path d="M4 9h3.5L13 4.5v15L7.5 15H4zM17 9.5l5 5M22 9.5l-5 5" />
    </>
  ),
  mic: (
    <>
      <rect {...tone} x="8.5" y="3" width="7" height="11.5" rx="3.5" />
      <rect x="8.5" y="3" width="7" height="11.5" rx="3.5" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
    </>
  ),
  fox: (
    <>
      <path {...tone} d="M4 4.5 8.5 8h7L20 4.5l-1 8.3c-.7 4-3.4 6.7-7 7.7-3.6-1-6.3-3.7-7-7.7z" />
      <path d="M4 4.5 8.5 8h7L20 4.5l-1 8.3c-.7 4-3.4 6.7-7 7.7-3.6-1-6.3-3.7-7-7.7z" />
      <path d="M7.5 12.5 10 14M16.5 12.5 14 14M10.8 17.2h2.4L12 18.4z" />
    </>
  ),
  calendar: (
    <>
      <path {...tone} d="M4 5.5h16V10H4z" />
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
      <path d="M8 14h2M11.5 14h2M15 14h1.5M8 17h2M11.5 17h2" />
    </>
  ),
  spend: (
    <>
      <path {...tone} d="M3 7.5h14v10H3z" />
      <rect x="3" y="7.5" width="14" height="10" rx="1.5" />
      <circle cx="10" cy="12.5" r="2.3" />
      <path d="M19 5.5h3M20.5 4v3M19 11h3" />
    </>
  ),
  party: (
    <>
      <path {...tone} d="m3.5 20.5 4-12 8.5 8.5z" />
      <path d="m3.5 20.5 4-12 8.5 8.5zM6 13l5 5M12.5 3.5c.8 1.2.8 2.3 0 3.5M20.5 11.5c-1.2-.8-2.3-.8-3.5 0M15 5l.5-1.5M19 9l1.5-.5M16.5 7.5 20 4" />
    </>
  ),
  briefcase: (
    <>
      <path {...tone} d="M3 8h18v11H3z" />
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8.5 7.5V5.5c0-.8.7-1.5 1.5-1.5h4c.8 0 1.5.7 1.5 1.5v2M3 12.5h18M10.5 12.5v1.5h3v-1.5" />
    </>
  ),
  check: (
    <>
      <circle {...tone} cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="9" />
      <path d="m7.5 12.3 3 3 6-6.3" />
    </>
  ),
  film: (
    <>
      <path {...tone} d="M3 9.5h18V20H3z" />
      <rect x="3" y="9.5" width="18" height="10.5" rx="1.5" />
      <path d="m3.4 9.3-.6-3 16.2-3.3.6 3zM7.5 5.4l2.4 3M12.6 4.4l2.4 3" />
    </>
  ),
  backpack: (
    <>
      <path {...tone} d="M5.5 10a6.5 6.5 0 0 1 13 0v10.5h-13z" />
      <path d="M5.5 10a6.5 6.5 0 0 1 13 0v10.5h-13zM9.5 4.2V3h5v1.2" />
      <path d="M8.5 20.5V15h7v5.5M8.5 12h7" />
    </>
  ),
  box: (
    <>
      <path {...tone} d="M3.5 7.5 12 3.5l8.5 4v9.5L12 21l-8.5-4z" />
      <path d="M3.5 7.5 12 3.5l8.5 4v9.5L12 21l-8.5-4zM3.5 7.5 12 11.5l8.5-4M12 11.5V21M7.8 5.5l8.5 4" />
    </>
  ),
  demon: (
    <>
      <path {...tone} d="M5 8.5c0-1.5.5-3 1.5-4.5L9 7h6l2.5-3c1 1.5 1.5 3 1.5 4.5 2 2 2 5.5 0 8.5-1.5 2.4-4 3.5-7 3.5s-5.5-1.1-7-3.5c-2-3-2-6.5 0-8.5z" />
      <path d="M5 8.5c0-1.5.5-3 1.5-4.5L9 7h6l2.5-3c1 1.5 1.5 3 1.5 4.5 2 2 2 5.5 0 8.5-1.5 2.4-4 3.5-7 3.5s-5.5-1.1-7-3.5c-2-3-2-6.5 0-8.5z" />
      <path d="m7.5 11 3 1.3M16.5 11l-3 1.3M9 16.5l1.2-1 1.8 1 1.8-1 1.2 1" />
    </>
  ),
  lock: (
    <>
      <path {...tone} d="M5 10.5h14V21H5z" />
      <rect x="5" y="10.5" width="14" height="10.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
    </>
  ),
  rocket: (
    <>
      <path {...tone} d="M14.5 4.5c2.5-1.2 4.6-1.2 5-.8.4.4.4 2.5-.8 5L12.5 15 9 11.5z" />
      <path d="M14.5 4.5c2.5-1.2 4.6-1.2 5-.8.4.4.4 2.5-.8 5L12.5 15 9 11.5z" />
      <path d="M9 11.5 5.5 11l3-3.5h4M12.5 15l.5 3.5 3.5-3v-4" />
      <path d="M7 17c-1.5.2-2.5 1.3-3 3 1.7-.5 2.8-1.5 3-3z" />
      <circle cx="15.5" cy="8.5" r="1.4" />
    </>
  ),
  robot: (
    <>
      <path {...tone} d="M5 8.5h14v10.5H5z" />
      <rect x="5" y="8.5" width="14" height="11" rx="3" />
      <path d="M12 8.5V5.5M2.5 13v3M21.5 13v3" />
      <circle cx="12" cy="4.5" r="1.1" />
      <circle cx="9" cy="13.5" r="1.2" fill="currentColor" />
      <circle cx="15" cy="13.5" r="1.2" fill="currentColor" />
      <path d="M9.5 16.8h5" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3.6-3.6a4 4 0 0 0-5.7-5.7l-1.1 1.1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3.6 3.6a4 4 0 0 0 5.7 5.7l1.1-1.1" />
    </>
  ),
  boom: (
    <>
      <path {...tone} d="m12 2.5 1.8 5 4.7-2.8-1.9 5.2 5.2.9-4.6 2.8 3.3 4.3-5.4-.8-.6 5.4L12 18l-2.5 4.5-.6-5.4-5.4.8 3.3-4.3-4.6-2.8 5.2-.9-1.9-5.2 4.7 2.8z" />
      <path d="m12 2.5 1.8 5 4.7-2.8-1.9 5.2 5.2.9-4.6 2.8 3.3 4.3-5.4-.8-.6 5.4L12 18l-2.5 4.5-.6-5.4-5.4.8 3.3-4.3-4.6-2.8 5.2-.9-1.9-5.2 4.7 2.8z" />
    </>
  ),
  moon: (
    <>
      <path {...tone} d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </>
  ),
  chaos: (
    <>
      <circle {...tone} cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="9" />
      <path d="M7 9.2c.8-.8 2-.8 2.8 0M14.2 8.2l2.6 2M14.2 10.2l2.6-2" />
      <path d="M7.5 14c1 2.2 2.6 3.3 4.5 3.3s3.5-1.1 4.5-3.3z" />
    </>
  ),
  helmet: (
    <>
      <path {...tone} d="M3.5 15.5a8.5 8.5 0 0 1 17 0z" />
      <path d="M3.5 15.5a8.5 8.5 0 0 1 17 0zM2 15.5h20v2.5H2zM12 7v8.5" />
    </>
  ),
  angry: (
    <>
      <circle {...tone} cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="9" />
      <path d="m7 8.5 3 1.5M17 8.5l-3 1.5M8.5 16.5c1-1.2 2.2-1.8 3.5-1.8s2.5.6 3.5 1.8" />
    </>
  ),
  leaf: (
    <>
      <path {...tone} d="M4.5 19.5C4.5 10 10 4.5 20 4c-.5 10-6 15.5-15.5 15.5z" />
      <path d="M4.5 19.5C4.5 10 10 4.5 20 4c-.5 10-6 15.5-15.5 15.5zM4.5 19.5 13 11" />
    </>
  ),
  handshake: (
    <>
      <path {...tone} d="m8 13 4-4 3 1.5 4.5-1L21 15l-6 4.5z" />
      <path d="M2 9.5 6 6l4 1.5M22 9.5 18 6l-4 1.5-4 3.5a1.5 1.5 0 0 0 2.1 2.1L15 11l4.5 4M6 14.5l3.5 3.5M8.5 13l3.5 3.5M11.5 12.5l3 3M2 9.5l4 6.5M19.5 15l-4.5 4" />
    </>
  ),
  brain: (
    <>
      <path {...tone} d="M12 5.5C11 3.5 7.5 3.5 6.8 6 4.5 6.2 3.5 8.5 4.5 10.5c-1.8 1.5-1.2 4.4.8 5.2.2 2.5 3 3.8 5 2.5.4.8 1 1.3 1.7 1.3z" />
      <path d="M12 5.5C11 3.5 7.5 3.5 6.8 6 4.5 6.2 3.5 8.5 4.5 10.5c-1.8 1.5-1.2 4.4.8 5.2.2 2.5 3 3.8 5 2.5.4.8 1 1.3 1.7 1.3V5.5zM12 5.5c1-2 4.5-2 5.2.5 2.3.2 3.3 2.5 2.3 4.5 1.8 1.5 1.2 4.4-.8 5.2-.2 2.5-3 3.8-5 2.5-.4.8-1 1.3-1.7 1.3" />
      <path d="M8 10c1 0 2 .8 2 2M16 10c-1 0-2 .8-2 2" />
    </>
  ),
  gamepad: (
    <>
      <path {...tone} d="M6.5 7.5h11c2.5 0 4 2.5 4.3 6.5.2 3-1.5 4.5-3.3 3l-2.5-2.5h-8L5.5 17c-1.8 1.5-3.5 0-3.3-3 .3-4 1.8-6.5 4.3-6.5z" />
      <path d="M6.5 7.5h11c2.5 0 4 2.5 4.3 6.5.2 3-1.5 4.5-3.3 3l-2.5-2.5h-8L5.5 17c-1.8 1.5-3.5 0-3.3-3 .3-4 1.8-6.5 4.3-6.5zM7.5 10v4M5.5 12h4" />
      <circle cx="15.5" cy="11" r=".9" fill="currentColor" />
      <circle cx="17.8" cy="13" r=".9" fill="currentColor" />
    </>
  ),
  chart: (
    <>
      <path {...tone} d="M6 13h3v7H6zM11 9h3v11h-3zM16 5h3v15h-3z" />
      <path d="M3 20.5h18M6 13h3v7H6zM11 9h3v11h-3zM16 5h3v15h-3z" />
    </>
  ),
  diamond: (
    <>
      <path {...tone} d="M6.5 4h11l4 5.5L12 20.5 2.5 9.5z" />
      <path d="M6.5 4h11l4 5.5L12 20.5 2.5 9.5zM2.5 9.5h19M9 4l-1.5 5.5L12 20.5l4.5-11L15 4" />
    </>
  ),
  hexagon: (
    <>
      <path {...tone} d="m12 2.8 8 4.6v9.2l-8 4.6-8-4.6V7.4z" />
      <path d="m12 2.8 8 4.6v9.2l-8 4.6-8-4.6V7.4z" />
      <path d="m12 7.5 4 2.3v4.4l-4 2.3-4-2.3V9.8z" />
    </>
  ),
  crosshair: (
    <>
      <circle {...tone} cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    </>
  ),
  medal: (
    <>
      <circle {...tone} cx="12" cy="15" r="6" />
      <path d="M8 3h3l2 5.5M16 3h-3M9.5 3l2.5 6.3L14.5 3" />
      <circle cx="12" cy="15" r="6" />
      <path d="m12 12 1 2 2.1.3-1.5 1.5.4 2.1L12 17l-2 1 .4-2.2-1.5-1.5L11 14z" />
    </>
  ),
  transfer: (
    <>
      <path d="M4 8.5h15M15 4.5l4 4-4 4M20 15.5H5M9 11.5l-4 4 4 4" />
    </>
  ),
  pencil: (
    <>
      <path {...tone} d="M15.5 4.5 19.5 8.5 8 20H4v-4z" />
      <path d="M15.5 4.5 19.5 8.5 8 20H4v-4zM13 7l4 4" />
    </>
  ),
  layout: (
    <>
      <path {...tone} d="M3.5 4h6v16h-6z" />
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M9.5 4v16M9.5 10h11" />
    </>
  ),
  phone: (
    <>
      <path {...tone} d="M5 3.5h3.5l1.8 4.6-2.4 1.6a11 11 0 0 0 6.4 6.4l1.6-2.4 4.6 1.8V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z" />
      <path d="M5 3.5h3.5l1.8 4.6-2.4 1.6a11 11 0 0 0 6.4 6.4l1.6-2.4 4.6 1.8V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z" />
    </>
  ),
  mail: (
    <>
      <rect {...tone} x="3" y="5.5" width="18" height="13" rx="2" />
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.8 7 8.2 6 8.2-6" />
    </>
  ),
  chat: (
    <>
      <path {...tone} d="M4 5.5h16v10H10l-4.5 4v-4H4z" />
      <path d="M4 5.5h16v10H10l-4.5 4v-4H4z" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" strokeWidth="2.6" />
    </>
  ),
  pin: (
    <>
      <path {...tone} d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  globe: (
    <>
      <circle {...tone} cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z" />
    </>
  ),
  user: (
    <>
      <circle {...tone} cx="12" cy="8" r="4" />
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1-4 3.8-6 7.5-6s6.5 2 7.5 6" />
    </>
  ),
  key: (
    <>
      <circle {...tone} cx="8" cy="15" r="5" />
      <circle cx="8" cy="15" r="5" />
      <path d="m11.5 11.5 8-8M16.5 6.5l2.5 2.5M14.5 8.5l2 2" />
    </>
  ),
};

export type IconName = keyof typeof P;
export const ICON_NAMES = Object.keys(P) as IconName[];

export function Icon({ name, size = 22, className = "", strokeWidth = 1.9, ...rest }: { name: IconName | string; size?: number; className?: string; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  const body = P[name];
  if (!body) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 align-[-0.2em] ${className}`}
      aria-hidden
      {...rest}
    >
      {body}
    </svg>
  );
}

/** Emoji the app used to show, mapped to the icon that replaces it. */
export const EMOJI_ICON: Record<string, IconName> = {
  "🏠": "home", "🛒": "shop", "💰": "income", "⚔️": "swords", "⚔": "swords", "🧾": "receipt", "📝": "checkin", "✍": "pencil", "✎": "pencil",
  "🗂️": "clients", "🗂": "clients", "🎯": "target", "🦸": "squad", "📡": "radar", "🎨": "palette", "⚙️": "gear", "⚙": "gear", "🎁": "gift",
  "🪙": "coin", "🐉": "dragon", "🛡": "shield", "🏆": "trophy", "🏅": "medal", "⚡": "bolt", "📜": "scroll", "🔥": "flame", "🏦": "bank",
  "📣": "megaphone", "★": "star", "✦": "sparkles", "✨": "sparkles", "🔊": "speaker", "🔈": "mute", "🎤": "mic", "🦊": "fox", "📅": "calendar",
  "💸": "spend", "🎉": "party", "💼": "briefcase", "✅": "check", "🎬": "film", "🎒": "backpack", "📦": "box", "👹": "demon", "🔒": "lock",
  "🚀": "rocket", "◎": "crosshair", "◉": "target", "🤖": "robot", "🔗": "link", "💥": "boom", "🌑": "moon", "🤪": "chaos", "🪖": "helmet",
  "😤": "angry", "🍃": "leaf", "🤝": "handshake", "🧠": "brain", "🎮": "gamepad", "⬢": "hexagon", "📊": "chart", "◆": "diamond", "💎": "diamond",
};

/** Shows an icon for a known emoji or icon name; anything else is shown as given. */
export function Glyph({ value, size, className }: { value: ReactNode; size?: number; className?: string }) {
  if (typeof value !== "string") return <>{value}</>;
  const name = (P[value] ? value : EMOJI_ICON[value]) as IconName | undefined;
  return name ? <Icon name={name} size={size} className={className} /> : <>{value}</>;
}

const EMOJI_RE = new RegExp(`(${Object.keys(EMOJI_ICON).sort((a, b) => b.length - a.length).map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "u");

/** Text with any known emoji swapped for its icon, e.g. toasts like "+20 🪙 Paid rent". */
export function WithIcons({ text, size = 18 }: { text: string; size?: number }) {
  const parts = text.split(EMOJI_RE);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) => (EMOJI_ICON[p] ? <Icon key={i} name={EMOJI_ICON[p]} size={size} className="mx-0.5" /> : p.replace(/️/g, "")))}
    </>
  );
}
