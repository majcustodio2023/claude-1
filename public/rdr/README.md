# Assets for the Boss RDR landing page (/rdr)

Drop real files here and the page picks them up (see `lib/rdr/assets.ts` for the list it reads):

- `photos/boss-rdr.jpg` — the final photo of Boss RDR with entrepreneurs (3:2).
- `photos/signature.png` — Boss RDR's signature (transparent PNG).
- `proof/*.png|jpg` — analytics screenshots (Facebook, YouTube, TikTok). Add each to `assets.ts` with a caption.
- `brands/<slug>.png|svg` — client logos; name them after the brand in `assets.ts`.
- `media/<slug>.png|svg` — national media logos.
- `studio/*.jpg` — studio gallery.
- `gci/*.jpg` — GCI event photos.

Until a file exists, the page shows the brand or media name set in type instead of an empty box.
