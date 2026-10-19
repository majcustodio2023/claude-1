// How the app looks: color theme, design style, layout, size and header.
// Saved in settings.appearance; applied as CSS variables and data-* attributes on <html>.

export type StyleId = "pixel" | "pixel-clean" | "pixel-chunky";
export type LayoutId = "tabs" | "sidebar" | "dock";
export type DensityId = "compact" | "comfy" | "large";
export type HeaderId = "hero" | "slim";
export type WidthId = "normal" | "wide";

export interface Appearance {
  theme?: string;
  style?: StyleId;
  layout?: LayoutId;
  density?: DensityId;
  header?: HeaderId;
  width?: WidthId;
  /** Turn off the moving effects (speed lines, bobbing, pop-ins). */
  calm?: boolean;
}

export interface Theme {
  id: string;
  name: string;
  light?: boolean;
  bg: string;
  card: string;
  card2: string;
  ink: string;
  muted: string;
  line: string;
  outline: string;
  accent: string;
  hero: string;
  gold: string;
  good: string;
  warn: string;
  bad: string;
  /** Input and empty-bar backgrounds. */
  field: string;
}

// Every theme is a Dawnterra pixel palette: the same cozy RPG look, light or dark. Text colours
// keep strong contrast against their cards (body text at least 7:1, muted text at least 4.5:1).
const night = { good: "#8cc05a", warn: "#e8954a", bad: "#e8735a" };

export const THEMES: Theme[] = [
  { id: "dawn", name: "Dawnterra Parchment", light: true, bg: "#dcc39a", card: "#f6e8c8", card2: "#ecd6ab", ink: "#3b2416", muted: "#76563c", line: "#c9a978", outline: "#3b2416", accent: "#277a71", hero: "#cf5530", gold: "#cf8a1f", good: "#3f7f2f", warn: "#d9822b", bad: "#c0392b", field: "#fdf5e3" },
  { id: "meadow", name: "Spring Meadow", light: true, bg: "#b9cf94", card: "#f5f1d8", card2: "#e6e3bf", ink: "#26301c", muted: "#55613f", line: "#b7bd8a", outline: "#26301c", accent: "#2a6a6e", hero: "#c0502f", gold: "#b5770f", good: "#3e6b32", warn: "#c4701f", bad: "#b03a2a", field: "#fcfaea" },
  { id: "snow", name: "Winter Hollow", light: true, bg: "#c3cfdb", card: "#f4f2ec", card2: "#e3e3df", ink: "#1f2638", muted: "#4d5872", line: "#b6bfcc", outline: "#1f2638", accent: "#34507a", hero: "#a8475e", gold: "#b5770f", good: "#3e6b32", warn: "#c4701f", bad: "#b03a2a", field: "#ffffff" },
  { id: "dusk", name: "Dawnterra Night", bg: "#1d1622", card: "#2e2433", card2: "#3a2e40", ink: "#f6e7cc", muted: "#cbb597", line: "#584460", outline: "#0f0a12", accent: "#4fb0a0", hero: "#e8754a", gold: "#f2b866", field: "#241b29", ...night },
  { id: "tavern", name: "Ember Tavern", bg: "#1e140e", card: "#33231a", card2: "#402d21", ink: "#fbead0", muted: "#d6b994", line: "#6a4a33", outline: "#0d0805", accent: "#86d0bd", hero: "#ef7a45", gold: "#f4c95d", field: "#26190f", ...night },
  { id: "forest", name: "Moonlit Forest", bg: "#0f1d17", card: "#1b3026", card2: "#233c30", ink: "#eef5e0", muted: "#b5cdae", line: "#3a5c46", outline: "#07100b", accent: "#86d0bd", hero: "#e8954a", gold: "#f4c95d", field: "#13241c", ...night },
  { id: "dungeon", name: "Dungeon Stone", bg: "#16161b", card: "#26252c", card2: "#302f37", ink: "#f1ece2", muted: "#c3bcb0", line: "#4c4a55", outline: "#08080a", accent: "#7aa3cc", hero: "#e46b5a", gold: "#f4c95d", field: "#1c1c21", ...night },
  { id: "ocean", name: "Harbour at Night", bg: "#0e1a29", card: "#18293d", card2: "#20344b", ink: "#eef4fa", muted: "#b4c6d8", line: "#34507a", outline: "#060c14", accent: "#86d0bd", hero: "#e8954a", gold: "#f4c95d", field: "#12202f", ...night },
  { id: "sakura", name: "Sakura Grove", bg: "#25141f", card: "#381e2f", card2: "#45263a", ink: "#fff0f2", muted: "#e3bccb", line: "#6b3a56", outline: "#10070c", accent: "#86d0bd", hero: "#e8a0a0", gold: "#f4c95d", field: "#2c1725", ...night },
  { id: "royal", name: "Wizard Tower", bg: "#17122a", card: "#261f42", card2: "#30284f", ink: "#f4efff", muted: "#c9bdea", line: "#4f4280", outline: "#08051a", accent: "#86d0bd", hero: "#e8954a", gold: "#f4c95d", field: "#1c1633", ...night },
];

/** Themes from before everything became pixel art, and the pixel theme closest to each. */
const OLD_THEMES: Record<string, string> = {
  comic: "dusk", neon: "royal", cyberpunk: "tavern", sunset: "tavern", bloodmoon: "dungeon", matrix: "forest", mono: "dungeon", arctic: "snow",
  paper: "dawn", daylight: "snow", candy: "meadow",
};

export const STYLES: { id: StyleId; name: string; about: string }[] = [
  { id: "pixel", name: "Framed", about: "Parchment cards in a wooden frame with a hard pixel shadow. The Dawnterra look." },
  { id: "pixel-clean", name: "Clean", about: "Same pixel font and square corners, thin borders and no frames. Calm for work." },
  { id: "pixel-chunky", name: "Chunky", about: "Thick borders and big stepped shadows, like an old console menu." },
];

/** Every style is a pixel style; older saved styles map to the nearest one. */
const OLD_STYLES: Record<string, StyleId> = { comic: "pixel", retro: "pixel-chunky", cyber: "pixel-chunky", sleek: "pixel-clean", minimal: "pixel-clean" };

export const LAYOUTS: { id: LayoutId; name: string; about: string }[] = [
  { id: "tabs", name: "Top tabs", about: "Tabs across the top, like now." },
  { id: "sidebar", name: "Side menu", about: "A menu down the left side; content beside it." },
  { id: "dock", name: "Bottom dock", about: "An app-style bar at the bottom of the screen." },
];

export const DENSITIES: { id: DensityId; name: string; px: number }[] = [
  { id: "compact", name: "Compact", px: 16 },
  { id: "comfy", name: "Comfortable", px: 18 },
  { id: "large", name: "Large", px: 20 },
];

/** Ready-made looks that set everything at once. */
export const PRESETS: { id: string; name: string; about: string; look: Appearance }[] = [
  { id: "dawnterra", name: "Dawnterra", about: "The cozy parchment look of the city, everywhere.", look: { theme: "dawn", style: "pixel", layout: "tabs", density: "comfy", header: "hero", width: "normal" } },
  { id: "night", name: "Dawnterra Night", about: "The same world after sundown. Dark and easy on the eyes.", look: { theme: "dusk", style: "pixel", layout: "tabs", density: "comfy", header: "hero", width: "normal" } },
  { id: "tavern", name: "Tavern Ops", about: "Warm dark tavern with a side menu and a slim header, for long work sessions.", look: { theme: "tavern", style: "pixel-clean", layout: "sidebar", density: "comfy", header: "slim", width: "wide" } },
  { id: "dungeon", name: "Dungeon Crawler", about: "Stone-dark, chunky menus and a bottom dock, like a console RPG.", look: { theme: "dungeon", style: "pixel-chunky", layout: "dock", density: "comfy", header: "hero", width: "normal" } },
  { id: "winter", name: "Winter Desk", about: "Bright and clean, side menu, compact. Work mode.", look: { theme: "snow", style: "pixel-clean", layout: "sidebar", density: "compact", header: "slim", width: "wide" } },
  { id: "grove", name: "Quiet Grove", about: "Moonlit forest, big text, nothing moving.", look: { theme: "forest", style: "pixel-clean", layout: "tabs", density: "large", header: "slim", width: "normal", calm: true } },
];

export const DEFAULT_LOOK: Required<Omit<Appearance, "calm">> & { calm: boolean } = { theme: "dawn", style: "pixel", layout: "tabs", density: "comfy", header: "hero", width: "normal", calm: false };

export function resolveLook(a: Appearance | undefined) {
  const look = { ...DEFAULT_LOOK, ...Object.fromEntries(Object.entries(a ?? {}).filter(([, v]) => v !== undefined)) } as typeof DEFAULT_LOOK;
  look.style = STYLES.some((s) => s.id === look.style) ? look.style : (OLD_STYLES[look.style] ?? "pixel");
  look.theme = themeById(look.theme).id;
  return look;
}

export const themeById = (id: string | undefined) => THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === OLD_THEMES[id ?? ""]) ?? THEMES[0];

/** "#ff5fae" -> "255 95 174", for use inside rgb(... / alpha). */
function rgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** CSS variables for a theme. */
export function themeVars(t: Theme): Record<string, string> {
  return {
    "--color-bg": t.bg,
    "--color-card": t.card,
    "--color-card-2": t.card2,
    "--color-ink": t.ink,
    "--color-muted": t.muted,
    "--color-line": t.line,
    "--color-outline": t.outline,
    "--color-accent": t.accent,
    "--color-hero": t.hero,
    "--color-gold": t.gold,
    "--color-good": t.good,
    "--color-warn": t.warn,
    "--color-bad": t.bad,
    "--color-field": t.field,
    "--rgb-accent": rgb(t.accent),
    "--rgb-hero": rgb(t.hero),
    "--rgb-gold": rgb(t.gold),
    "--rgb-good": rgb(t.good),
  };
}

/** Puts a look on the page: theme colors, style, layout and text size. */
export function applyLook(a: Appearance | undefined) {
  if (typeof document === "undefined") return;
  const look = resolveLook(a);
  const t = themeById(look.theme);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(themeVars(t))) root.style.setProperty(k, v);
  root.style.colorScheme = t.light ? "light" : "dark";
  root.style.fontSize = `${DENSITIES.find((d) => d.id === look.density)?.px ?? 18}px`;
  // All styles are pixel styles: data-style turns the pixel look on, data-pix picks the variant.
  root.dataset.style = "pixel";
  root.dataset.pix = look.style;
  root.dataset.layout = look.layout;
  root.dataset.calm = look.calm ? "1" : "0";
  root.dataset.light = t.light ? "1" : "0";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t.bg);
}
