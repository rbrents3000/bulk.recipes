#!/usr/bin/env bash
# audit.sh — Automated audit for bulk.recipes repository (Issue #4)
# Checks recipe completeness, link integrity, guide coverage, and cost consistency.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
ERRORS=0
WARNINGS=0

error() {
  echo "[ERROR] $1"
  ((ERRORS++)) || true
}

warn() {
  echo "[WARN]  $1"
  ((WARNINGS++)) || true
}

# Build canonical list of recipe files (relative to repo root)
mapfile -t RECIPE_FILES < <(find "$REPO_ROOT/recipes" -name "*.md" ! -name "README.md" -type f | sort | while read -r f; do
  echo "${f#$REPO_ROOT/}"
done)

echo "=== RECIPE COMPLETENESS ==="
echo ""

for rel in "${RECIPE_FILES[@]}"; do
  file="$REPO_ROOT/$rel"

  # Skip YAML frontmatter (---...---) and check first 5 content lines
  if ! grep -q '^# ' "$file"; then
    error "$rel: Missing H1 title"
  fi

  if ! head -20 "$file" | grep -q '^> '; then
    error "$rel: Missing description blockquote in header"
  fi

  if ! grep -q '\*\*Prep:\*\*' "$file"; then
    error "$rel: Missing metadata line (Prep/Cook/Servings/Cost)"
  fi

  if ! grep -q '^## Costco Shopping List' "$file"; then
    error "$rel: Missing '## Costco Shopping List' section"
  fi

  if ! grep -q '^## Other Ingredients' "$file"; then
    error "$rel: Missing '## Other Ingredients' section"
  fi

  if ! grep -q '^## Instructions' "$file"; then
    error "$rel: Missing '## Instructions' section"
  fi

  if ! grep -q '^[0-9]\.' "$file" && ! grep -q '^[0-9][0-9]\.' "$file"; then
    warn "$rel: No numbered steps found in Instructions"
  fi

  if ! grep -q '> \*\*Tip' "$file"; then
    warn "$rel: No blockquote tip found"
  fi

  if ! grep -q '^## Storage' "$file"; then
    error "$rel: Missing '## Storage' section"
  fi

  if ! grep -q '^## Leftover Ideas' "$file"; then
    error "$rel: Missing '## Leftover Ideas' section"
  fi
done

echo ""
echo "=== LINK VALIDATION ==="
echo ""

resolve_path() {
  local base_dir="$1"
  local rel_path="$2"
  rel_path="${rel_path%%#*}"
  rel_path="${rel_path%%\?*}"
  [[ -z "$rel_path" ]] && return 1
  local target="$base_dir/$rel_path"
  local dir
  dir="$(dirname "$target")"
  local base
  base="$(basename "$target")"
  if [[ -d "$dir" ]]; then
    echo "$(cd "$dir" && pwd)/$base"
  else
    echo "$target"
  fi
}

extract_links() {
  local file="$1"
  grep -o '\[[^]]*\]([^)]*)' "$file" 2>/dev/null | \
    sed 's/.*](//' | sed 's/)$//' | \
    grep -v '^https\?://' | grep -v '^mailto:' || true
}

extract_recipe_links() {
  local file="$1"
  grep -o '\]([^)]*)' "$file" 2>/dev/null | \
    sed 's/^](//' | sed 's/)$//' | \
    grep '^\.\./recipes/' || true
}

extract_index_cost() {
  local file="$1"
  local link="$2"
  grep -F "$link" "$file" | grep -o '\$[0-9]*\.[0-9]*' | head -1 || true
}

BROKEN_LINKS=0
TMPLINKS=$(mktemp)
trap "rm -f $TMPLINKS" EXIT

while IFS= read -r mdfile; do
  rel_md="${mdfile#$REPO_ROOT/}"
  base_dir="$(dirname "$mdfile")"

  extract_links "$mdfile" > "$TMPLINKS"
  while IFS= read -r link; do
    [[ -z "$link" ]] && continue
    file_path="${link%%#*}"
    [[ -z "$file_path" ]] && continue

    resolved="$(resolve_path "$base_dir" "$file_path" 2>/dev/null)" || continue
    if [[ ! -e "$resolved" ]]; then
      error "$rel_md: Broken link -> $link"
      ((BROKEN_LINKS++)) || true
    fi
  done < "$TMPLINKS"
done < <(find "$REPO_ROOT" -name "*.md" -not -path "*/.git/*" -not -path "*/node_modules/*" -not -path "*/web/*" -type f)

echo ""
echo "=== COVERAGE: COST INDEX ==="
echo ""

COST_INDEX="$REPO_ROOT/guides/cost-index.md"
declare -A COST_INDEX_RECIPES
declare -A COST_INDEX_PRICES

while IFS= read -r link; do
  [[ -z "$link" ]] && continue
  resolved="$(resolve_path "$REPO_ROOT/guides" "$link" 2>/dev/null)" || continue
  rel_resolved="${resolved#$REPO_ROOT/}"
  COST_INDEX_RECIPES["$rel_resolved"]=1

  price=$(extract_index_cost "$COST_INDEX" "$link")
  if [[ -n "$price" ]]; then
    COST_INDEX_PRICES["$rel_resolved"]="$price"
  fi
done < <(extract_recipe_links "$COST_INDEX")

for rel in "${RECIPE_FILES[@]}"; do
  if [[ -z "${COST_INDEX_RECIPES[$rel]:-}" ]]; then
    error "$rel: Not listed in guides/cost-index.md"
  fi
done

echo ""
echo "=== COVERAGE: DIETARY INDEX ==="
echo ""

DIETARY_INDEX="$REPO_ROOT/guides/dietary.md"
declare -A DIETARY_RECIPES

while IFS= read -r link; do
  [[ -z "$link" ]] && continue
  resolved="$(resolve_path "$REPO_ROOT/guides" "$link" 2>/dev/null)" || continue
  rel_resolved="${resolved#$REPO_ROOT/}"
  DIETARY_RECIPES["$rel_resolved"]=1
done < <(extract_recipe_links "$DIETARY_INDEX")

for rel in "${RECIPE_FILES[@]}"; do
  if [[ -z "${DIETARY_RECIPES[$rel]:-}" ]]; then
    error "$rel: Not listed in guides/dietary.md"
  fi
done

echo ""
echo "=== COST CONSISTENCY ==="
echo ""

for rel in "${RECIPE_FILES[@]}"; do
  file="$REPO_ROOT/$rel"
  recipe_cost=$(grep -o '\*\*Cost:\*\* [~]*\$[0-9]*\.[0-9]*' "$file" | grep -o '[0-9]*\.[0-9]*' | head -1) || true
  index_price="${COST_INDEX_PRICES[$rel]:-}"

  if [[ -n "$recipe_cost" && -n "$index_price" ]]; then
    index_num="${index_price#\$}"
    if [[ "$recipe_cost" != "$index_num" ]]; then
      warn "$rel: Recipe=\$$recipe_cost, cost-index=$index_price"
    fi
  fi
done

echo ""
echo "=== SUMMARY ==="
echo ""
echo "Recipe files scanned: ${#RECIPE_FILES[@]}"
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"

if [[ $ERRORS -gt 0 ]]; then
  exit 1
else
  exit 0
fi
