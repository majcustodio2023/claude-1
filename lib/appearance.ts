// How the app looks: color theme, design style, layout, size and header.
// Saved in settings.appearance; applied as CSS variables and data-* attributes on <html>.

export type StyleId = "comic" | "sleek" | "cyber" | "retro" | "minimal" | "pixel";
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

const dark = { good: "#5cf28b", warn: "#ffa53a", bad: "#ff4d5e", outline: "#0b0a14" };

export const THEMES: Theme[] = [
  { id: "comic", name: "Comic Night", bg: "#13122a", card: "#1e1c3d", card2: "#272552", ink: "#fff8ec", muted: "#c4bfe6", line: "#3b3870", accent: "#3fd0ff", hero: "#ff5fae", gold: "#ffd23f", field: "#121027", ...dark },
  { id: "neon", name: "Neon Tokyo", bg: "#0a0618", card: "#160d2f", card2: "#21143f", ink: "#f6f1ff", muted: "#bfb2e8", line: "#3a2766", accent: "#00f0ff", hero: "#ff2bd6", gold: "#f9f871", field: "#0d0820", ...dark },
  { id: "cyberpunk", name: "Cyberpunk", bg: "#0d0b07", card: "#1a170f", card2: "#262115", ink: "#fffbe6", muted: "#cfc6a3", line: "#4a4128", accent: "#00e5ff", hero: "#ff3864", gold: "#fcee0a", field: "#110f09", ...dark },
  { id: "ocean", name: "Deep Ocean", bg: "#071a2b", card: "#0e2a42", card2: "#143653", ink: "#eef8ff", muted: "#a9c6dc", line: "#24506f", accent: "#4dd8ff", hero: "#7b8cff", gold: "#ffd166", field: "#06182a", ...dark },
  { id: "forest", name: "Spirit Forest", bg: "#0f1d14", card: "#18301f", card2: "#203c28", ink: "#f1fbec", muted: "#b5d2b0", line: "#335a3c", accent: "#7ee081", hero: "#c3f73a", gold: "#f4d35e", field: "#0c1910", ...dark },
  { id: "sakura", name: "Sakura", bg: "#26121f", card: "#361b2e", card2: "#44233a", ink: "#fff2f7", muted: "#e3bcd0", line: "#653a56", accent: "#ffb7d5", hero: "#ff6fa5", gold: "#ffd6a5", field: "#1f0e19", ...dark },
  { id: "sunset", name: "Sunset Drive", bg: "#2b1020", card: "#3d1730", card2: "#4b1d3b", ink: "#fff3ea", muted: "#e6b9b4", line: "#6e2d55", accent: "#ff9e5e", hero: "#ff5d73", gold: "#ffd166", field: "#230b1a", ...dark },
  { id: "royal", name: "Royal Purple", bg: "#120e24", card: "#1f1840", card2: "#2a2152", ink: "#f7f2ff", muted: "#c3b6ea", line: "#43377a", accent: "#b28dff", hero: "#e05cff", gold: "#f5c542", field: "#0f0b1f", ...dark },
  { id: "bloodmoon", name: "Blood Moon", bg: "#160809", card: "#261012", card2: "#331618", ink: "#fff1ee", muted: "#e0b0aa", line: "#5c2427", accent: "#ff7a59", hero: "#ff2e4d", gold: "#ffb347", field: "#120607", ...dark },
  { id: "matrix", name: "Matrix", bg: "#020a04", card: "#07160b", card2: "#0c2112", ink: "#e9ffef", muted: "#9fd4ae", line: "#1d4a2a", accent: "#39ff88", hero: "#00e676", gold: "#c6ff00", field: "#020904", ...dark },
  { id: "mono", name: "Midnight Mono", bg: "#101012", card: "#1b1b1f", card2: "#25252b", ink: "#f5f5f7", muted: "#b3b3bb", line: "#3a3a42", accent: "#e9e9ee", hero: "#a8a8b3", gold: "#ffffff", field: "#0c0c0e", ...dark },
  { id: "arctic", name: "Arctic", bg: "#0c1620", card: "#142331", card2: "#1b2e3f", ink: "#f2f8fc", muted: "#b4c7d6", line: "#2d4a60", accent: "#8fe3ff", hero: "#c2a8ff", gold: "#e8f6ff", field: "#09121a", ...dark },
  { id: "dawn", name: "Dawnterra Parchment", light: true, bg: "#dcc39a", card: "#f6e8c8", card2: "#ecd6ab", ink: "#3b2416", muted: "#76563c", line: "#c9a978", outline: "#3b2416", accent: "#2f8f83", hero: "#d9603b", gold: "#cf8a1f", good: "#4f9a3a", warn: "#d9822b", bad: "#c0392b", field: "#fdf5e3" },
  { id: "paper", name: "Manga Paper", light: true, bg: "#f2ecdf", card: "#fffaf0", card2: "#f3ead7", ink: "#1d1a2e", muted: "#5c5770", line: "#d9cfb8", outline: "#1d1a2e", accent: "#0a84d6", hero: "#e0306f", gold: "#f2b705", good: "#1e9e52", warn: "#e07b00", bad: "#d62839", field: "#ffffff" },
  { id: "daylight", name: "Daylight", light: true, bg: "#eef2f8", card: "#ffffff", card2: "#f1f4f9", ink: "#101828", muted: "#5a6474", line: "#d6dde8", outline: "#1b2333", accent: "#2f6fec", hero: "#9b51e0", gold: "#f5a623", good: "#17a05d", warn: "#e3780c", bad: "#e5383b", field: "#ffffff" },
  { id: "candy", name: "Candy Pop", light: true, bg: "#fdeef6", card: "#ffffff", card2: "#fff1f8", ink: "#2b1638", muted: "#76618a", line: "#f0cfe2", outline: "#2b1638", accent: "#00b3e6", hero: "#ff4fa0", gold: "#ffc400", good: "#13b36b", warn: "#ff8a00", bad: "#f0254d", field: "#ffffff" },
];

export const STYLES: { id: StyleId; name: string; about: string }[] = [
  { id: "pixel", name: "Dawnterra pixel", about: "Cozy pixel-art RPG: parchment cards, square corners, pixel font. Matches the city." },
  { id: "comic", name: "Comic hero", about: "Thick ink outlines, tilted captions, punchy comic font." },
  { id: "sleek", name: "Sleek pro", about: "Soft rounded cards, clean type, no outlines. Calm and modern." },
  { id: "cyber", name: "Cyber HUD", about: "Cut corners, glowing edges and a sci-fi font, like a game HUD." },
  { id: "retro", name: "Retro arcade", about: "Pixel font, square blocks and stepped shadows, 8-bit style." },
  { id: "minimal", name: "Minimal", about: "Flat and quiet. Thin lines, lots of space, nothing extra." },
];

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
  { id: "dawnterra", name: "Dawnterra", about: "The cozy pixel-art look of the city, everywhere.", look: { theme: "dawn", style: "pixel", layout: "tabs", density: "comfy", header: "hero", width: "normal" } },
  { id: "hero", name: "Comic Hero", about: "The original anime comic look.", look: { theme: "comic", style: "comic", layout: "tabs", density: "comfy", header: "hero", width: "normal" } },
  { id: "ops", name: "Cyber Ops", about: "Neon HUD with a side menu and a slim header.", look: { theme: "neon", style: "cyber", layout: "sidebar", density: "comfy", header: "slim", width: "wide" } },
  { id: "pro", name: "Clean Pro", about: "Bright, calm dashboard for work mode.", look: { theme: "daylight", style: "sleek", layout: "sidebar", density: "compact", header: "slim", width: "wide" } },
  { id: "arcade", name: "Retro Arcade", about: "8-bit game screen with a bottom dock.", look: { theme: "matrix", style: "retro", layout: "dock", density: "comfy", header: "hero", width: "normal" } },
  { id: "manga", name: "Manga Page", about: "Black ink on paper, like a printed manga.", look: { theme: "paper", style: "comic", layout: "tabs", density: "comfy", header: "hero", width: "normal" } },
  { id: "zen", name: "Zen", about: "Minimal, big text, nothing moving.", look: { theme: "arctic", style: "minimal", layout: "tabs", density: "large", header: "slim", width: "normal", calm: true } },
];

export const DEFAULT_LOOK: Required<Omit<Appearance, "calm">> & { calm: boolean } = { theme: "dawn", style: "pixel", layout: "tabs", density: "comfy", header: "hero", width: "normal", calm: false };

export function resolveLook(a: Appearance | undefined) {
  return { ...DEFAULT_LOOK, ...Object.fromEntries(Object.entries(a ?? {}).filter(([, v]) => v !== undefined)) } as typeof DEFAULT_LOOK;
}

export const themeById = (id: string | undefined) => THEMES.find((t) => t.id === id) ?? THEMES[0];

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
  root.dataset.style = look.style;
  root.dataset.layout = look.layout;
  root.dataset.calm = look.calm ? "1" : "0";
  root.dataset.light = t.light ? "1" : "0";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t.bg);
}
