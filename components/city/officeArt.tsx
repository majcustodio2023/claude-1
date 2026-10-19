// Each worker's private office inside a building, seen from above: walls all round with a
// doorway onto the hall, a floor and rug in their job's style, and two props in the back
// corners that say what they do (a ring light for social, a server rack for the app
// builder…). The building's colour tints the walls, and each person's own seed shifts the
// rug and floor, so no two offices look the same.

import type { ReactNode } from "react";
import { OFFICE_WALL, T, type Station } from "@/lib/city";
import { rng } from "@/lib/avatar";
import { shade } from "../characters";
import { LINE, Plant } from "./art";

type Floor = "plank" | "tile" | "check" | "carpet" | "concrete";
type Prop =
  | "books" | "typewriter" | "cork" | "plant" | "easel" | "paint" | "rack" | "cables" | "reels" | "speaker"
  | "ringlight" | "tripod" | "chart" | "cabinet" | "mailbox" | "headset" | "mic" | "boxes" | "funnel" | "safe" | "lamp" | "whiteboard" | "beanbag";

interface Theme {
  floor: Floor;
  floorC: string;
  rug: string[];
  props: [Prop, Prop];
}

const THEME: Record<string, Theme> = {
  scriptWriter: { floor: "plank", floorC: "#8a5a32", rug: ["#93392a", "#c0392b"], props: ["books", "typewriter"] },
  videoScript: { floor: "plank", floorC: "#7d4c2e", rug: ["#34507a", "#4f78a8"], props: ["books", "lamp"] },
  copyWriter: { floor: "plank", floorC: "#b07a48", rug: ["#2f8f83", "#4fb0a0"], props: ["cork", "plant"] },
  imageCopy: { floor: "check", floorC: "#e8cfa2", rug: ["#e8a33d", "#f4c95d"], props: ["cork", "lamp"] },
  imageAI: { floor: "concrete", floorC: "#a3998f", rug: ["#d9603b", "#f5cfc4"], props: ["easel", "paint"] },
  storyboard: { floor: "plank", floorC: "#a86a43", rug: ["#5a4290", "#a996d6"], props: ["easel", "books"] },
  videoAI: { floor: "tile", floorC: "#3d3a40", rug: ["#2c2148", "#4fb0a0"], props: ["rack", "cables"] },
  videoEdit: { floor: "carpet", floorC: "#3a2a5a", rug: ["#2c2148", "#c0392b"], props: ["reels", "speaker"] },
  social: { floor: "check", floorC: "#f5cfc4", rug: ["#e8a0a0", "#fbf1dc"], props: ["ringlight", "tripod"] },
  content: { floor: "plank", floorC: "#b07a48", rug: ["#6aa645", "#b5d67a"], props: ["books", "beanbag"] },
  insights: { floor: "tile", floorC: "#c8bdae", rug: ["#34507a", "#b4d0e6"], props: ["chart", "cabinet"] },
  ads: { floor: "tile", floorC: "#c8bdae", rug: ["#c0392b", "#e8a33d"], props: ["chart", "safe"] },
  adsTracker: { floor: "concrete", floorC: "#a3998f", rug: ["#3c7a2c", "#b5d67a"], props: ["whiteboard", "chart"] },
  email: { floor: "plank", floorC: "#8a5a32", rug: ["#4f78a8", "#fbf1dc"], props: ["mailbox", "cabinet"] },
  discord: { floor: "carpet", floorC: "#2c2148", rug: ["#5a4290", "#86d0bd"], props: ["headset", "speaker"] },
  webinar: { floor: "carpet", floorC: "#5a2034", rug: ["#93392a", "#f4c95d"], props: ["mic", "ringlight"] },
  app: { floor: "tile", floorC: "#3d3a40", rug: ["#23716a", "#86d0bd"], props: ["rack", "whiteboard"] },
  store: { floor: "plank", floorC: "#a86a43", rug: ["#d9703b", "#f4c95d"], props: ["boxes", "safe"] },
  funnel: { floor: "concrete", floorC: "#c8bdae", rug: ["#5a4290", "#e8a33d"], props: ["funnel", "plant"] },
  custom: { floor: "plank", floorC: "#a86a43", rug: ["#6e4425", "#e8cfa2"], props: ["plant", "cabinet"] },
};

export const officeTheme = (role: string): Theme => THEME[role] ?? THEME.custom;

function FloorPattern({ id, floor, c }: { id: string; floor: Floor; c: string }) {
  const dk = shade(c, -0.18);
  const lt = shade(c, 0.12);
  if (floor === "plank")
    return (
      <pattern id={id} width="64" height="16" patternUnits="userSpaceOnUse">
        <rect width="64" height="16" fill={c} />
        <path d="M0 15.5 H64 M24 0 V16" stroke={dk} strokeWidth="2" />
      </pattern>
    );
  if (floor === "tile")
    return (
      <pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill={c} />
        <path d="M0 19 H20 M19 0 V20" stroke={dk} strokeWidth="2" />
        <rect x="3" y="3" width="5" height="2" fill={lt} />
      </pattern>
    );
  if (floor === "check")
    return (
      <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill={c} />
        <rect width="12" height="12" fill={dk} />
        <rect x="12" y="12" width="12" height="12" fill={dk} />
      </pattern>
    );
  if (floor === "carpet")
    return (
      <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill={c} />
        <rect x="2" y="2" width="2" height="2" fill={lt} />
        <rect x="10" y="10" width="2" height="2" fill={lt} />
      </pattern>
    );
  return (
    <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill={c} />
      <path d="M4 10 h6 M22 30 h8 M30 6 h3" stroke={dk} strokeWidth="2" />
      <rect x="14" y="18" width="3" height="3" fill={lt} />
    </pattern>
  );
}

/** One prop about 40 x 44, drawn from its top-left corner. */
function PropArt({ kind, x, y, seed }: { kind: Prop; x: number; y: number; seed: number }) {
  const r = rng(seed);
  let body: ReactNode;
  switch (kind) {
    case "books":
      body = (
        <>
          <rect width="40" height="44" fill="#6e4425" />
          {[0, 1].map((row) => (
            <g key={row}>
              <rect x="4" y={4 + row * 20} width="32" height="16" fill="#3b2416" strokeWidth="2" />
              {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} x={6 + i * 6} y={8 + row * 20} width="5" height="12" fill={["#c0392b", "#2f8f83", "#e8a33d", "#5a4290", "#6aa645"][Math.floor(r() * 5)]} strokeWidth="1.5" />
              ))}
            </g>
          ))}
        </>
      );
      break;
    case "typewriter":
      body = (
        <>
          <rect x="0" y="16" width="40" height="26" fill="#a86a43" />
          <rect x="6" y="6" width="28" height="16" fill="#3d3a40" />
          <rect x="10" y="0" width="20" height="10" fill="#fbf1dc" strokeWidth="2" />
          <path d="M10 14 h20 M10 18 h20" stroke="#c8bdae" strokeWidth="2" />
        </>
      );
      break;
    case "cork":
      body = (
        <>
          <rect width="40" height="36" fill="#c99862" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={4 + (i % 2) * 18} y={4 + Math.floor(i / 2) * 16} width="14" height="12" fill={["#f4c95d", "#e8a0a0", "#86d0bd", "#b5d67a"][i]} strokeWidth="1.5" />
          ))}
        </>
      );
      break;
    case "plant":
      return <Plant x={x + 20} y={y + 42} s={1} seed={seed} />;
    case "lamp":
      body = (
        <>
          <circle cx="20" cy="14" r="20" fill="url(#a-glow)" stroke="none" />
          <path d="M20 18 V40 M12 42 h16" strokeWidth="3" />
          <path d="M8 18 L14 2 H26 L32 18 Z" fill="#f4c95d" />
        </>
      );
      break;
    case "easel":
      body = (
        <>
          <path d="M6 44 L16 6 M34 44 L24 6" stroke="#6e4425" strokeWidth="4" />
          <rect x="4" y="2" width="32" height="26" fill="#fbf1dc" />
          <circle cx="14" cy="14" r="5" fill="#d9603b" strokeWidth="1.5" />
          <path d="M8 24 l8 -6 l6 4 l8 -8" fill="none" stroke="#4f78a8" strokeWidth="2.5" />
        </>
      );
      break;
    case "paint":
      body = (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={i * 13} y={18 + (i % 2) * 6} width="12" height="18" fill="#c8bdae" strokeWidth="2" />
              <rect x={i * 13} y={18 + (i % 2) * 6} width="12" height="5" fill={["#d9603b", "#4f78a8", "#f4c95d"][i]} strokeWidth="2" />
            </g>
          ))}
          <path d="M4 44 q8 -6 16 0 q8 6 16 0" fill="none" stroke="#d9603b" strokeWidth="3" />
        </>
      );
      break;
    case "rack":
      body = (
        <>
          <rect x="4" width="32" height="44" fill="#2b2d42" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x="8" y={4 + i * 10} width="24" height="7" fill="#4a4e69" strokeWidth="1.5" />
              <rect x="10" y={6 + i * 10} width="3" height="3" fill={i % 2 ? "#86d0bd" : "#b5d67a"} stroke="none" />
            </g>
          ))}
        </>
      );
      break;
    case "cables":
      body = <path d="M2 40 C10 20 30 44 22 26 S38 10 30 4" fill="none" stroke="#2b2d42" strokeWidth="5" />;
      break;
    case "reels":
      body = (
        <>
          <rect width="40" height="44" fill="#4a3b4f" />
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(20 ${12 + i * 20})`}>
              <circle r="8" fill="#2b2d42" />
              <circle r="2.5" fill="#c8bdae" strokeWidth="1" />
            </g>
          ))}
        </>
      );
      break;
    case "speaker":
      body = (
        <>
          <rect x="6" width="28" height="44" fill="#3d3a40" />
          <circle cx="20" cy="12" r="6" fill="#7d7574" strokeWidth="2" />
          <circle cx="20" cy="30" r="9" fill="#7d7574" strokeWidth="2" />
        </>
      );
      break;
    case "ringlight":
      body = (
        <>
          <circle cx="20" cy="14" r="22" fill="url(#a-glow)" stroke="none" />
          <circle cx="20" cy="14" r="12" fill="none" stroke="#fbf1dc" strokeWidth="6" />
          <circle cx="20" cy="14" r="15" fill="none" strokeWidth="2" />
          <path d="M20 28 V42 M10 44 L20 36 L30 44" strokeWidth="3" />
        </>
      );
      break;
    case "tripod":
      body = (
        <>
          <rect x="12" y="2" width="16" height="24" fill="#3d3a40" />
          <rect x="15" y="5" width="10" height="16" fill="#86d0bd" strokeWidth="1.5" />
          <path d="M20 26 V36 M8 44 L20 34 L32 44" strokeWidth="3" />
        </>
      );
      break;
    case "chart":
      body = (
        <>
          <rect width="40" height="34" fill="#fbf1dc" />
          {[8, 18, 28].map((bx, i) => (
            <rect key={bx} x={bx - 3} y={28 - (i + 1) * 7} width="6" height={(i + 1) * 7} fill={["#d9603b", "#e8a33d", "#6aa645"][i]} strokeWidth="1.5" />
          ))}
          <path d="M4 40 h32" strokeWidth="3" />
        </>
      );
      break;
    case "whiteboard":
      body = (
        <>
          <rect width="40" height="32" fill="#fbf1dc" />
          <path d="M6 10 h16 M6 16 h22 M6 22 h12" stroke="#4f78a8" strokeWidth="2" />
          <path d="M28 20 l4 4 l6 -10" fill="none" stroke="#c0392b" strokeWidth="2.5" />
          <path d="M8 32 v10 M32 32 v10" strokeWidth="3" />
        </>
      );
      break;
    case "cabinet":
      body = (
        <>
          <rect x="4" width="32" height="44" fill="#a3998f" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x="8" y={4 + i * 13} width="24" height="10" fill="#c8bdae" strokeWidth="1.5" />
              <rect x="16" y={8 + i * 13} width="8" height="2" fill={LINE} stroke="none" />
            </g>
          ))}
        </>
      );
      break;
    case "mailbox":
      body = (
        <>
          <path d="M8 18 Q8 4 20 4 Q32 4 32 18 V30 H8 Z" fill="#4f78a8" />
          <rect x="30" y="8" width="3" height="12" fill="#c0392b" strokeWidth="1.5" />
          <path d="M20 30 V44" strokeWidth="4" />
          <rect x="12" y="14" width="16" height="9" fill="#fbf1dc" strokeWidth="1.5" />
        </>
      );
      break;
    case "headset":
      body = (
        <>
          <path d="M20 44 V24 M12 44 h16" strokeWidth="3" />
          <path d="M8 22 Q8 4 20 4 Q32 4 32 22" fill="none" strokeWidth="4" />
          <rect x="4" y="16" width="8" height="12" fill="#5a4290" />
          <rect x="28" y="16" width="8" height="12" fill="#5a4290" />
        </>
      );
      break;
    case "mic":
      body = (
        <>
          <path d="M20 22 V40 M10 44 h20" strokeWidth="3" />
          <rect x="13" y="2" width="14" height="22" rx="7" fill="#7d7574" />
          <path d="M14 10 h12 M14 15 h12" strokeWidth="1.5" />
        </>
      );
      break;
    case "boxes":
      body = (
        <>
          <rect x="0" y="20" width="22" height="22" fill="#c99862" />
          <rect x="18" y="24" width="22" height="18" fill="#a86a43" />
          <rect x="6" y="2" width="20" height="18" fill="#e8cfa2" />
          <path d="M11 20 v22 M29 24 v18 M16 2 v18" strokeWidth="1.5" />
        </>
      );
      break;
    case "funnel":
      body = (
        <>
          <rect width="40" height="34" fill="#fbf1dc" />
          <path d="M6 6 H34 L24 18 V28 H16 V18 Z" fill="#e8a33d" strokeWidth="2" />
          <path d="M8 34 v10 M32 34 v10" strokeWidth="3" />
        </>
      );
      break;
    case "safe":
      body = (
        <>
          <rect x="2" y="6" width="36" height="36" fill="#7d7574" />
          <circle cx="20" cy="24" r="8" fill="#c8bdae" strokeWidth="2" />
          <path d="M20 18 v6 h5" strokeWidth="2" />
          <rect x="30" y="18" width="4" height="12" fill="#e8a33d" strokeWidth="1.5" />
        </>
      );
      break;
    case "beanbag":
      body = <ellipse cx="20" cy="30" rx="19" ry="13" fill={["#e8a0a0", "#86d0bd", "#f4c95d"][Math.floor(r() * 3)]} />;
      break;
  }
  return (
    <g transform={`translate(${x} ${y})`} stroke={LINE} strokeWidth="2.5" strokeLinejoin="round">
      {body}
    </g>
  );
}

/** A worker's office: floor, rug, the two job props and its four walls with a doorway at the top. */
export function Office({ st, role, buildingColor, seed }: { st: Station; role: string; buildingColor: string; seed: number }) {
  const o = st.office;
  const d = st.door;
  const t = officeTheme(role);
  const r = rng(seed);
  const k = OFFICE_WALL;
  const wallC = shade(buildingColor, 0.25);
  const wallTop = shade(buildingColor, -0.35);
  const id = `of-${st.staffId}`;
  const rugC = t.rug[0];
  const rugTrim = t.rug[1];
  const rugW = o.w - 2 * k - 20 - Math.floor(r() * 3) * 6;
  const rugH = 2.1 * T;
  const rugX = o.x + o.w / 2 - rugW / 2;
  const rugY = o.y + k + 0.55 * T;
  const stripes = Math.floor(r() * 3);
  return (
    <g>
      <defs>
        <FloorPattern id={id} floor={t.floor} c={shade(t.floorC, (r() - 0.5) * 0.12)} />
      </defs>
      <rect x={o.x} y={o.y} width={o.w} height={o.h} fill={`url(#${id})`} />
      <g stroke={LINE} strokeWidth="3">
        <rect x={rugX} y={rugY} width={rugW} height={rugH} fill={rugC} />
        <rect x={rugX + 6} y={rugY + 6} width={rugW - 12} height={rugH - 12} fill="none" stroke={rugTrim} strokeWidth="3" strokeDasharray={stripes === 1 ? "8 6" : undefined} />
        {stripes === 2 && <path d={`M${rugX + 6} ${rugY + rugH / 2} H${rugX + rugW - 6}`} stroke={rugTrim} strokeWidth="3" />}
      </g>
      <PropArt kind={t.props[0]} x={o.x + k + 4} y={o.y + k + 6} seed={seed + 1} />
      <PropArt kind={t.props[1]} x={o.x + o.w - k - 44} y={o.y + k + 6} seed={seed + 2} />
      {/* walls: a coloured cap with a darker top edge, open at the doorway */}
      <g stroke={LINE} strokeWidth="3" strokeLinejoin="round">
        {[
          { x: o.x, y: o.y, w: d.x - o.x, h: k },
          { x: d.x + d.w, y: o.y, w: o.x + o.w - d.x - d.w, h: k },
          { x: o.x, y: o.y, w: k, h: o.h },
          { x: o.x + o.w - k, y: o.y, w: k, h: o.h },
          { x: o.x, y: o.y + o.h - k, w: o.w, h: k },
        ].map((w, i) => (
          <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} fill={wallC} />
        ))}
        <path d={`M${o.x} ${o.y + 2} H${d.x} M${d.x + d.w} ${o.y + 2} H${o.x + o.w}`} stroke={wallTop} strokeWidth="3" />
        {/* a doormat in the doorway */}
        <rect x={d.x + 8} y={o.y + k + 2} width={d.w - 16} height="10" fill={rugTrim} strokeWidth="2" />
      </g>
    </g>
  );
}
