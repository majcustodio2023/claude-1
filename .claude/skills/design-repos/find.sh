#!/bin/bash
# Quick lookup: bash find.sh <keyword>   e.g. "pricing", "hero", "bento", "testimonial", "DESIGN.md"
# Lists repos whose name/category matches, then files inside the library matching the keyword.
ROOT="$(cd "$(dirname "$0")" && pwd)"; q="${1:?keyword}"
echo "== repos matching '$q'"; grep -i "$q" "$ROOT/manifest.tsv" | sed 's/\t/  /'
echo "== files matching '$q' (first 60)"
find "$ROOT" -path '*/node_modules' -prune -o -path '*/.git' -prune -o -iname "*${q}*" -print 2>/dev/null | sed "s|$ROOT/||" | head -60
