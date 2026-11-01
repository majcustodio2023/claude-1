"use client";

// A small pixel icon for every item, for the inventory grid: gear, potions and monster
// materials. Shapes are 12 x 12 patterns; each item picks a shape and its colours.
// "a" main colour, "b" its shade, "c" highlight, "d" accent. An ink outline is added round it.

import { LINE } from "../city/art";

const SHAPES: Record<string, string[]> = {
  sword: ["..........cc", ".........cac", "........cab.", ".......cab..", "......cab...", ".....cab....", "..d.cab.....", "..ddab......", "...dd.......", "..b.dd......", ".b..........", "b..........."],
  dagger: ["............", "............", "........cc..", ".......cab..", "......cab...", ".....cab....", "...d.ab.....", "...dda......", "....dd......", "...b.d......", "..b.........", "............"],
  club: ["........aa..", ".......aaab.", "......cabab.", "......aaabb.", ".....aaabb..", ".....abb....", "....ab......", "...ab.......", "..ab........", ".ab.........", "ab..........", "............"],
  hammer: ["...bbbbbb...", "..baaaaaab..", "..bacccaab..", "..baaaaaab..", "...bbddbb...", ".....dd.....", ".....dd.....", ".....dd.....", ".....dd.....", ".....dd.....", "....dddd....", "............"],
  staff: [".....cc.....", "....caac....", "....aaaa....", ".....aa.....", ".....dd.....", ".....dd.....", ".....dd.....", ".....dd.....", ".....dd.....", ".....dd.....", ".....dd.....", ".....dd....."],
  spear: [".....c......", "....cac.....", "....aab.....", ".....b......", ".....d......", "....ad......", ".....d......", ".....da.....", ".....d......", "....ad......", ".....d......", ".....d......"],
  gun: ["............", "............", "..bbbbbbbbc.", ".baaaaaaaab.", ".bacccaaaab.", ".baaaaaaaab.", "..bbdd.bbb..", "...ddd......", "...dd.......", "...dd.......", "............", "............"],
  scythe: ["....aaaaaa..", "..aacccc.aa.", ".ac.......d.", "a.........d.", "..........d.", ".........d..", ".........d..", "........d...", "........d...", ".......d....", ".......d....", "......d....."],
  hat: [".....aa.....", "....aaab....", "...aacab....", "...aaaabb...", "..aaaaaabb..", "..aaaaaaab..", ".dddddddddd.", "bbbbbbbbbbbb", "............", "............", "............", "............"],
  helm: ["....aaaa....", "..aaccaaab..", ".aacaaaaaab.", ".aaaaaaaaab.", "aaaaaaaaaabb", "aaaaaaaaaabb", ".dddddddddd.", ".b........b.", "............", "............", "............", "............"],
  ears: ["............", ".a........a.", ".aa......aa.", ".aca....aca.", ".acca..acca.", ".aaaaaaaaaa.", "..dddddddd..", "............", "............", "............", "............", "............"],
  horns: ["a..........a", "aa........aa", ".ab......ba.", ".aab....baa.", "..aabbbbaa..", "...dddddd...", "............", "............", "............", "............", "............", "............"],
  ring: ["............", "...cccccc...", "..c......c..", ".a........a.", "..aa....aa..", "...aaaaaa...", "............", "............", "............", "............", "............", "............"],
  crown: ["..a..a..a...", "..aa.aa.aa..", ".acaaacaaa..", ".aaaaaaaaa..", ".adadadada..", ".aaaaaaaaa..", "............", "............", "............", "............", "............", "............"],
  leaf: ["......a.....", "....aaab....", "...aacaab...", "..aacaaaab..", "..aaaaaaab..", ".aaaaabaaab.", ".abbbbbbbbb.", "dddddddddddd", "............", "............", "............", "............"],
  mask: ["............", "............", ".aaaaaaaaaa.", "aaaaaaaaaaaa", "aabbaaaabbaa", "aabbaaaabbaa", ".aaaaaaaaaa.", "..aadaadaa..", "...a....a...", "............", "............", "............"],
  glasses: ["............", "............", "............", "dddddddddddd", "daaaadddaaaa", "dacaad.dacaa", ".aaa....aaa.", "............", "............", "............", "............", "............"],
  patch: ["...........d", "..........d.", "..aaaaa..d..", ".aaaaaaad...", ".aacaaaa....", ".aaaaaaa....", "..aaaaa.....", ".d..........", "d...........", "............", "............", "............"],
  scar: ["............", "..........a.", ".........a..", "...d....a...", "....d..a....", ".....da.....", ".....ad.....", "....a..d....", "...a....d...", "..a.........", "............", "............"],
  cape: ["..dddddddd..", "..aaaaaaaa..", ".aaacaaaaab.", ".aacaaaaaab.", ".aaaaaaaaab.", "aaaaaaaaaabb", "aaaaaaaaaabb", "aaaaaaaaaabb", "abababababab", "............", "............", "............"],
  wings: ["c..........c", "cc........cc", "aac......caa", "aaac....caaa", "aaaab..baaaa", ".aaab..baaa.", "..aab..baa..", "...ab..ba...", "....b..b....", "............", "............", "............"],
  jet: ["..aa....aa..", ".acaa..acaa.", ".aaaa..aaaa.", ".aaaabbaaaa.", ".aaaa..aaaa.", ".aaaa..aaaa.", ".bbbb..bbbb.", "..dd....dd..", "..cd....cd..", "...d.....d..", "............", "............"],
  shell: ["...aaaaaa...", "..accaaaab..", ".acaaabaaab.", "aaaaaabaaaab", "aaaaaabaaaab", "aaaaaabaaaab", ".aaaaabaaab.", "..aaaabaab..", "...aaabab...", "............", "............", "............"],
  orb: ["............", "....cccc....", "...caaaac...", "..caaaaaab..", "..caccaaab..", "..caaaaaab..", "..caaaaaab..", "...baaaab...", "....bbbb....", "............", "............", "............"],
  sparkle: [".....c......", ".....c......", "..d..a..d...", "...daaad....", "cccaacaaccc.", "...daaad....", "..d..a..d...", ".....c......", ".....c......", "............", "............", "............"],
  slime: ["............", "............", "............", ".....aa.....", "....acaa....", "...aacaaa...", "..aadaadaa..", "..aaaaaaaa..", ".aaaaaaaaaa.", ".bbbbbbbbbb.", "............", "............"],
  ghost: ["....aaaa....", "...aaaaaa...", "..aaaaaaaa..", "..adaadaaa..", "..aaaaaaaa..", "..aaaaaaaa..", "..aaaaaaab..", "..aaaaaabb..", "..a.a.a.b...", "............", "............", "............"],
  dragon: ["......d.....", ".....aaa....", "..b..adaa...", ".bb..aaa....", ".baaaaa.....", "..acca......", "..a..a......", "............", "............", "............", "............", "............"],
  sprout: ["...a...a....", "....a.a.....", ".....a......", "....dddd....", "...dbddbd...", "...dddddd...", "....d..d....", "............", "............", "............", "............", "............"],
  bee: [".cc..cc.....", "..cccc......", "...aaaaa....", "..aadaadaa..", ".aaaaaaaaab.", ".abbbaaabbb.", "..aaaaaaa...", "...b..b.....", "............", "............", "............", "............"],
  bow: ["............", ".aa......aa.", "aaaa....aaaa", "aacaa..aacaa", "aaaaaddaaaaa", "aaaaaddaaaaa", "aaaa....aaaa", ".aa......aa.", "............", "............", "............", "............"],
  band: ["............", "............", "............", "aaaaaaaaaaaa", "acccccdccccc", "aaaaaaaaaaaa", "..........aa", "...........a", "............", "............", "............", "............"],
  phones: ["...aaaaaa...", "..a......a..", ".a........a.", ".a........a.", "bdd......ddb", "bdd......ddb", "bdd......ddb", ".bb......bb.", "............", "............", "............", "............"],
  bell: ["............", "aaaaaaaaaaaa", "bbbbbbbbbbbb", ".....dd.....", "....dccd....", "...dcddd....", "...ddddd....", "....dbd.....", "............", "............", "............", "............"],
  chain: ["............", "aa.aa.aa.aa.", "a.ca.ca.ca.c", ".aa.aa.aa.aa", "......d.....", ".....ddd....", ".....dcd....", "......d.....", "............", "............", "............", "............"],
  tails: ["a.....a.....", "aa...aa...a.", ".aa.aa...aa.", ".aaaaa..aa..", "..aaaaaaa...", "..aaaaaa....", "...aaaa.....", "...cccc.....", "............", "............", "............", "............"],
  // potions and materials
  potion: ["....dddd....", "....bccb....", ".....cc.....", "....caac....", "...caaaab...", "..caaaaaab..", "..acaaaaab..", "..aaaaaaab..", "..baaaaabb..", "...bbbbbb...", "............", "............"],
  herb: ["............", ".....a......", "....aaa.a...", "...aacaaaa..", "..aacaaab...", "...aaab.....", ".a..db......", ".aa.d.......", "..ad........", "...d........", "...d........", "............"],
  jar: ["...dddddd...", "...bbbbbb...", "..aaaaaaaa..", ".acaaaaaaab.", ".acaaaaaaab.", ".aaaaaaaaab.", ".aaaaaaaaab.", ".baaaaaaabb.", "..bbbbbbbb..", "............", "............", "............"],
  blob: ["............", "............", "....aaa.....", "...acaaa....", "..acaaaaa...", "..aaaaaaab..", ".aaaaaaaabb.", ".bbbbbbbbb..", "............", "............", "............", "............"],
  fluff: ["...c..c.....", ".c..cccc.c..", "..cccaaccc..", ".ccaaaaaacc.", "..caaaaaac..", ".c.ccaacc.c.", "....c..c....", "............", "............", "............", "............", "............"],
  stinger: ["............", "...........c", "..........ca", ".........cab", "........cab.", ".......cab..", "......ab....", ".....dd.....", "....ddd.....", "....dd......", "............", "............"],
  spore: ["............", "...c....c...", ".c..aaaa..c.", "...acaaaa...", "..aacaaaab..", "..aaaaaaab..", "...aaaaab...", ".c..bbbb..c.", "....c...c...", "............", "............", "............"],
  bark: ["............", "..aaaaaaaa..", ".abbaaabbab.", ".aaaabaaaab.", ".abaaaabaab.", ".aaabaaaaab.", ".dddaabdddb.", ".abaaaaabab.", "..bbbbbbbb..", "............", "............", "............"],
  fang: ["............", "..aaaa......", "..accaa.....", "...acaab....", "....aaab....", ".....aab....", ".....aab....", "......ab....", ".......b....", "............", "............", "............"],
  plate: ["............", "....aaaa....", "..aaccaaab..", ".aacaaaaab..", ".aaaaaaaabb.", "..aaaaaabb..", "...aaabbb...", ".....bb.....", "............", "............", "............", "............"],
  heart: ["............", "..aa...aa...", ".acca.aaaa..", ".acaaaaaaab.", ".aaaaaaaaab.", "..aaaaaaab..", "...aaaaab...", "....aaab....", ".....ab.....", "............", "............", "............"],
  acorn: ["....dd......", "..bbbbbb....", ".bccbbbbb...", ".bbbbbbbb...", "..aaaaaa....", "..acaaaa....", "..aaaaaa....", "...aaaa.....", "....aa......", "............", "............", "............"],
};

type IconSpec = [shape: string, a: string, b: string, c: string, d: string];

const ICONS: Record<string, IconSpec> = {
  "cat-ears": ["ears", "#4a3040", "#2b1d2e", "#e8a0a0", "#3b2416"],
  "devil-horns": ["horns", "#c0502f", "#93392a", "#e8954a", "#3b2416"],
  halo: ["ring", "#f4c95d", "#cf8a1f", "#fbe29a", "#fbe29a"],
  "wizard-hat": ["hat", "#5a4290", "#3a2a5a", "#a996d6", "#f4c95d"],
  kabuto: ["helm", "#93392a", "#6b2a22", "#c0502f", "#e8a33d"],
  "flame-crown": ["crown", "#e8a33d", "#cf8a1f", "#fbe29a", "#d9703b"],
  shades: ["glasses", "#3d3a40", "#2b1d2e", "#7aa3cc", "#2b1d2e"],
  eyepatch: ["patch", "#3d3a40", "#2b1d2e", "#5a5458", "#6e4425"],
  scar: ["scar", "#cf6f7d", "#a8475e", "#e8a0a0", "#cf6f7d"],
  "oni-mask": ["mask", "#c0502f", "#2b1d2e", "#e8954a", "#fbf1dc"],
  katana: ["sword", "#c8bdae", "#7d7574", "#fbf1dc", "#e8a33d"],
  laser: ["gun", "#7d7574", "#3d3a40", "#86d0bd", "#5a5458"],
  staff: ["staff", "#4fb0a0", "#2f8f83", "#c4ead9", "#8a5a32"],
  hammer: ["hammer", "#7d7574", "#5a5458", "#e4dacb", "#6e4425"],
  scythe: ["scythe", "#5a4290", "#3a2a5a", "#a996d6", "#3a2a5a"],
  "red-cape": ["cape", "#c0502f", "#93392a", "#e8954a", "#e8a33d"],
  jetpack: ["jet", "#a3998f", "#7d7574", "#fbf1dc", "#d9703b"],
  "demon-wings": ["wings", "#7a2f45", "#5a2034", "#a8475e", "#5a2034"],
  "angel-wings": ["wings", "#fbf1dc", "#b4d0e6", "#ffffff", "#b4d0e6"],
  sakura: ["sparkle", "#e8a0a0", "#cf6f7d", "#f5cfc4", "#cf6f7d"],
  electric: ["sparkle", "#4fb0a0", "#2f8f83", "#c4ead9", "#f4c95d"],
  shadow: ["orb", "#5a4290", "#3a2a5a", "#a996d6", "#2c2148"],
  galaxy: ["orb", "#3a2a5a", "#2c2148", "#fbe29a", "#a996d6"],
  slime: ["slime", "#6aa645", "#4f8a3a", "#b5d67a", "#2b1d2e"],
  ghost: ["ghost", "#fbf1dc", "#c8bdae", "#ffffff", "#2b1d2e"],
  "mini-dragon": ["dragon", "#4f8a3a", "#93392a", "#b5d67a", "#c0502f"],
  "leaf-cap": ["leaf", "#6aa645", "#3e6b32", "#b5d67a", "#8a5a32"],
  "mushroom-helm": ["helm", "#c0502f", "#93392a", "#fbf1dc", "#e8cfa2"],
  "wolf-mask": ["mask", "#a3998f", "#2b1d2e", "#e4dacb", "#fbf1dc"],
  "oak-club": ["club", "#8a5a32", "#4e2f1d", "#c9955a", "#6aa645"],
  "fang-dagger": ["dagger", "#fbf1dc", "#c8bdae", "#ffffff", "#6e4425"],
  "thorn-spear": ["spear", "#e8cfa2", "#6e4425", "#fbf1dc", "#6e4425"],
  "grove-blade": ["sword", "#6aa645", "#3e6b32", "#b5d67a", "#8a5a32"],
  "moss-cloak": ["cape", "#4f8a3a", "#2f4a2a", "#8cc05a", "#c9955a"],
  "beetle-shell": ["shell", "#2a6a6e", "#1f4a52", "#86d0bd", "#2a6a6e"],
  firefly: ["sparkle", "#f4c95d", "#cf8a1f", "#fbe29a", "#b5d67a"],
  "pet-sprout": ["sprout", "#6aa645", "#2b1d2e", "#b5d67a", "#c9955a"],
  "pet-bee": ["bee", "#f4c95d", "#2b1d2e", "#c4ead9", "#2b1d2e"],
  "kit-bow": ["bow", "#cf6f7d", "#a8475e", "#f5cfc4", "#a8475e"],
  "kit-ninja": ["band", "#34507a", "#23314f", "#c8bdae", "#c8bdae"],
  "kit-headphones": ["phones", "#3d3a40", "#2b1d2e", "#7d7574", "#c0502f"],
  "kit-wizard": ["hat", "#34507a", "#23314f", "#7aa3cc", "#f4c95d"],
  "kit-crown": ["crown", "#e8a33d", "#cf8a1f", "#fbe29a", "#c0502f"],
  "kit-shades": ["glasses", "#3d3a40", "#2b1d2e", "#e8a0a0", "#2b1d2e"],
  "kit-monocle": ["ring", "#e8a33d", "#cf8a1f", "#b4d0e6", "#e8a33d"],
  "kit-bell": ["bell", "#c0502f", "#93392a", "#fbe29a", "#e8a33d"],
  "kit-bandana": ["band", "#c0502f", "#93392a", "#fbf1dc", "#fbf1dc"],
  "kit-chain": ["chain", "#e8a33d", "#cf8a1f", "#fbe29a", "#e8a33d"],
  "kit-ninetails": ["tails", "#e8954a", "#d9703b", "#fbf1dc", "#fbf1dc"],
  "red-herb": ["herb", "#c0502f", "#93392a", "#e8954a", "#3e6b32"],
  "red-potion": ["potion", "#c0502f", "#93392a", "#f5cfc4", "#8a5a32"],
  "blue-potion": ["potion", "#4f78a8", "#34507a", "#b4d0e6", "#8a5a32"],
  "green-potion": ["potion", "#6aa645", "#3e6b32", "#b5d67a", "#8a5a32"],
  "honey-jar": ["jar", "#e8a33d", "#cf8a1f", "#fbe29a", "#8a5a32"],
  jelly: ["blob", "#8cc05a", "#4f8a3a", "#d3f0a0", "#2b1d2e"],
  fluff: ["fluff", "#f4c95d", "#cf8a1f", "#fbf1dc", "#2b1d2e"],
  stinger: ["stinger", "#e4dacb", "#a3998f", "#ffffff", "#f4c95d"],
  spore: ["spore", "#86d0bd", "#4fb0a0", "#c4ead9", "#2b1d2e"],
  bark: ["bark", "#8a5a32", "#4e2f1d", "#c9955a", "#6aa645"],
  fang: ["fang", "#fbf1dc", "#c8bdae", "#ffffff", "#2b1d2e"],
  carapace: ["plate", "#2a6a6e", "#1f4a52", "#86d0bd", "#2b1d2e"],
  heartwood: ["heart", "#93392a", "#6b2a22", "#e8954a", "#2b1d2e"],
  "crown-acorn": ["acorn", "#e8a33d", "#cf8a1f", "#fbe29a", "#6aa645"],
};

/** The pixel icon for an item, `size` pixels wide. Unknown ids get a plain bag. */
export function ItemIcon({ id, size = 40, dim = false }: { id: string; size?: number; dim?: boolean }) {
  const [shape, a, b, c, d] = ICONS[id] ?? ["jar", "#a8743f", "#6e4425", "#e0b57a", "#4e2f1d"];
  const rows = SHAPES[shape];
  const pal: Record<string, string> = { a, b, c, d };
  const at = (i: number, j: number) => (j >= 0 && j < 12 && i >= 0 && i < 12 ? pal[rows[j][i]] : undefined);
  const out: { i: number; j: number; col: string }[] = [];
  for (let j = -1; j <= 12; j++)
    for (let i = -1; i <= 12; i++) {
      const col = at(i, j);
      if (col) out.push({ i, j, col });
      else if (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1)) out.push({ i, j, col: LINE });
    }
  return (
    <svg viewBox="-1 -1 14 14" width={size} height={size} shapeRendering="crispEdges" aria-hidden style={dim ? { filter: "grayscale(1)", opacity: 0.45 } : undefined}>
      {out.map((p) => (
        <rect key={`${p.i},${p.j}`} x={p.i} y={p.j} width="1.02" height="1.02" fill={p.col} />
      ))}
    </svg>
  );
}

export const hasIcon = (id: string) => id in ICONS;
