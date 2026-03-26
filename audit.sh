#!/usr/bin/env bash
# audit.sh — Automated audit for bulk.recipes repository (Issue #4)
# Checks recipe completeness, link integrity, guide coverage, and cost consistency.

set -euo pipefail

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

  # H1 title
  if ! head -5 "$file" | grep -q '^# '; then
    error "$rel: Missing H1 title"
  fi

  # Description blockquote (within first 5 lines)
  if ! head -5 "$file" | grep -q '^> '; then
    error "$rel: Missing description blockquote in header"
  fi

  # Metadata line
  if ! grep -q '\*\*Prep:\*\*' "$file"; then
    error "$rel: Missing metadata line (Prep/Cook/Servings/Cost)"
  fi

  # Costco Shopping List
  if ! grep -q '^## Costco Shopping List' "$file"; then
    error "$rel: Missing '## Costco Shopping List' section"
  fi

  # Other Ingredients
  if ! grep -q '^## Other Ingredients' "$file"; then
    error "$rel: Missing '## Other Ingredients' section"
  fi

  # Instructions
  if ! grep -q '^## Instructions' "$file"; then
    error "$rel: Missing '## Instructions' section"
  fi

  # Numbered steps
  if ! grep -q '^[0-9]\+\.' "$file"; then
    warn "$rel: No numbered steps found in Instructions"
  fi

  # Blockquote tip
  if ! grep -q '> \*\*Tip' "$file"; then
    warn "$rel: No blockquote tip found"
  fi

  # Storage
  if ! grep -q '^## Storage' "$file"; then
    error "$rel: Missing '## Storage' section"
  fi

  # Leftover Ideas
  if ! grep -q '^## Leftover Ideas' "$file"; then
    error "$rel: Missing '## Leftover Ideas' section"
  fi
done

echo ""
echo "=== LINK VALIDATION ==="
echo ""

# Resolve a relative path from a base directory to an absolute path
resolve_path() {
  local base_dir="$1"
  local rel_path="$2"
  # Strip anchor fragments
  rel_path="${rel_path%%#*}"
  # Strip query params
  rel_path="${rel_path%%\?*}"
  # Skip empty
  [[ -z "$rel_path" ]] && return 1
  # Combine
  local target="$base_dir/$rel_path"
  # Normalize by resolving .. and .
  # Use cd/pwd trick
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

BROKEN_LINKS=0

# Scan all .md files for relative links
while IFS= read -r mdfile; do
  rel_md="${mdfile#$REPO_ROOT/}"
  base_dir="$(dirname "$mdfile")"

  # Extract relative links: [text](path) where path doesn't start with http
  grep -oP '\[(?:[^\]]*)\]\((?!https?://|mailto:)([^)]+)\)' "$mdfile" 2>/dev/null | \
    grep -oP '\((?!https?://|mailto:)\K[^)]+' | while read -r link; do
      # Strip anchor
      file_path="${link%%#*}"
      [[ -z "$file_path" ]] && continue

      resolved="$(resolve_path "$base_dir" "$file_path")"
      if [[ ! -e "$resolved" ]]; then
        error "$rel_md: Broken link -> $link"
        ((BROKEN_LINKS++)) || true
      fi
    done
done < <(find "$REPO_ROOT" -name "*.md" -not -path "*/.git/*" -type f)

echo ""
echo "=== COVERAGE: COST INDEX ==="
echo ""

# Extract all recipe paths referenced in cost-index.md (normalized to repo-relative)
COST_INDEX="$REPO_ROOT/guides/cost-index.md"
declare -A COST_INDEX_RECIPES
declare -A COST_INDEX_PRICES

while IFS= read -r link; do
  # Links are like ../recipes/category/recipe.md
  # Resolve relative to guides/
  resolved="$(resolve_path "$REPO_ROOT/guides" "$link")"
  rel_resolved="${resolved#$REPO_ROOT/}"
  COST_INDEX_RECIPES["$rel_resolved"]=1

  # Extract price for this link's row
  # Find the line containing this link and extract the cost column
  price=$(grep -F "$link" "$COST_INDEX" | grep -oP '\$[0-9]+\.[0-9]+' | head -1) || true
  if [[ -n "$price" ]]; then
    COST_INDEX_PRICES["$rel_resolved"]="$price"
  fi
done < <(grep -oP '\]\(\K\.\./recipes/[^)]+' "$COST_INDEX" 2>/dev/null)

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
  resolved="$(resolve_path "$REPO_ROOT/guides" "$link")"
  rel_resolved="${resolved#$REPO_ROOT/}"
  DIETARY_RECIPES["$rel_resolved"]=1
done < <(grep -oP '\]\(\K\.\./recipes/[^)]+' "$DIETARY_INDEX" 2>/dev/null)

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
  # Extract cost from recipe metadata line
  recipe_cost=$(grep -oP '\*\*Cost:\*\* ~?\$\K[0-9]+\.[0-9]+' "$file" | head -1) || true
  index_price="${COST_INDEX_PRICES[$rel]:-}"

  if [[ -n "$recipe_cost" && -n "$index_price" ]]; then
    # Strip $ from index price
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
