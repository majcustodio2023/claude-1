// App Store sales report parsing, kept apart from the server code so it can be tested.

/** Sums Apple's sales TSV per app. Updates (product type 7) are counted apart from downloads. */
export function parseSalesTsv(tsv: string): Map<string, { downloads: number; updates: number; proceeds: Record<string, number> }> {
  const [head, ...lines] = tsv.trim().split(/\r?\n/);
  const cols = head.split("\t");
  const col = (name: string) => cols.indexOf(name);
  const [iTitle, iType, iUnits, iPro, iCur] = [col("Title"), col("Product Type Identifier"), col("Units"), col("Developer Proceeds"), col("Currency of Proceeds")];
  const out = new Map<string, { downloads: number; updates: number; proceeds: Record<string, number> }>();
  for (const line of lines) {
    const c = line.split("\t");
    const title = c[iTitle] || "App";
    const r = out.get(title) ?? { downloads: 0, updates: 0, proceeds: {} };
    const units = Number(c[iUnits]) || 0;
    if (/^(7|7F|7T|F7)$/.test(c[iType] ?? "")) r.updates += units;
    else r.downloads += units;
    const money = (Number(c[iPro]) || 0) * units;
    if (money) r.proceeds[c[iCur] || "?"] = (r.proceeds[c[iCur] || "?"] ?? 0) + money;
    out.set(title, r);
  }
  return out;
}
