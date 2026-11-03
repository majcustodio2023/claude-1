"use client";

// Turns drawn scenery and characters into plain pictures. A picture costs the browser almost
// nothing to move around, while hundreds of live shapes slow every frame down.

import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const svgText = (node: ReactElement) => {
  const s = renderToStaticMarkup(node);
  return s.startsWith("<svg") && !s.slice(0, 200).includes("xmlns=") ? s.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"') : s;
};

/** A one-off picture (the town, a room). Free it with URL.revokeObjectURL when it's replaced. */
export function picture(node: ReactElement): string {
  return URL.createObjectURL(new Blob([svgText(node)], { type: "image/svg+xml" }));
}

const sprites = new Map<string, string>();

/** A character picture, kept for as long as the page is open (there are only a few looks). */
export function sprite(key: string, node: () => ReactElement): string {
  let url = sprites.get(key);
  if (!url) {
    url = picture(node());
    sprites.set(key, url);
  }
  return url;
}
