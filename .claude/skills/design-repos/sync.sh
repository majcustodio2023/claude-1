#!/bin/bash
# Restores / updates the design-repos library from manifest.tsv (shallow clones).
# manifest.tsv columns: <category> <owner/repo> [folder-name]
# Usage: bash sync.sh            -> clone anything missing
#        bash sync.sh --update   -> also git pull existing clones
set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"
UPDATE="${1:-}"
while IFS=$'\t' read -r cat_ repo folder; do
  [ -z "${repo:-}" ] && continue
  name="${folder:-${repo#*/}}"; dest="$ROOT/$cat_/$name"
  if [ -d "$dest/.git" ]; then
    if [ "$UPDATE" = "--update" ]; then (cd "$dest" && git pull --quiet --depth 1 2>/dev/null && echo "UPDATED $repo"); else echo "OK      $repo"; fi
  else
    mkdir -p "$ROOT/$cat_"
    if git clone --quiet --depth 1 --single-branch "https://github.com/$repo" "$dest" 2>/dev/null; then echo "CLONED  $repo -> $cat_/$name"; else echo "FAILED  $repo"; fi
  fi
done < "$ROOT/manifest.tsv"
