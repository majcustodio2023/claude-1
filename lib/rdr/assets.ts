// Pictures the team supplies for /rdr. Paths are under /public/rdr. Leave an entry empty or
// remove it and the page falls back to type (brand and media names set as wordmarks).

export const assets = {
  heroPhoto: "" as string, // e.g. "/rdr/photos/boss-rdr.jpg"
  signature: "" as string, // e.g. "/rdr/photos/signature.png"
  proof: [] as { src: string; caption: string }[], // e.g. { src: "/rdr/proof/facebook.png", caption: "Facebook insights, Jan 2022 to Jul 2026" }
  brandLogos: {} as Record<string, string>, // e.g. { "Pablings Barbershop": "/rdr/brands/pablings.svg" }
  mediaLogos: {} as Record<string, string>, // e.g. { GMA: "/rdr/media/gma.svg" }
  studio: [] as string[], // e.g. ["/rdr/studio/1.jpg"]
  gci: [] as string[],
  pablings: { before: "", after: "" },
  cmv: "" as string,
  cinemaSkin: { feature: "", founder: "", inquiries: [] as string[] },
};
