/**
 * Estimate per-serving nutrition for all recipes and write to frontmatter.
 *
 * Usage: node scripts/estimate-nutrition.mjs
 *
 * - Parses ingredient strings from costco_ingredients + other_ingredients
 * - Matches against the nutrition lookup table
 * - Sums calories/protein/carbs/fat per recipe, divides by servings
 * - Writes a `nutrition` field into each recipe's YAML frontmatter
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(join(process.cwd(), 'web', 'package.json'));
const matter = require('gray-matter');
import { NUTRITION } from './nutrition-data.mjs';

const RECIPES_DIR = join(process.cwd(), 'recipes');

// ── Unit conversion to normalize quantities ──
const UNIT_TO_TBSP = {
  'tsp': 1/3, 'teaspoon': 1/3, 'teaspoons': 1/3,
  'tbsp': 1, 'tablespoon': 1, 'tablespoons': 1,
  'cup': 16, 'cups': 16,
  'oz': 2, 'ounce': 2, 'ounces': 2,
  'lb': 32, 'lbs': 32, 'pound': 32, 'pounds': 32,
  'clove': null, 'cloves': null,
  'stalk': null, 'stalks': null,
  'medium': null, 'large': null, 'small': null,
  'slice': null, 'slices': null,
  'piece': null, 'pieces': null,
  'fillet': null, 'fillets': null,
  'link': null, 'links': null,
  'sheet': null, 'sheets': null,
  'whole': null,
  'can': null, 'cans': null,
  'bag': null, 'bags': null,
  'pack': null, 'packs': null,
  'pinch': null,
  'sprig': null, 'sprigs': null,
  'bunch': null,
  'head': null,
  'leaf': null, 'leaves': null,
};

// Parse reference amount from nutrition table
function parseRef(ref) {
  const m = ref.match(/^([\d.\/]+)\s+(.+)$/);
  if (!m) return { qty: 1, unit: ref };
  let qty = m[1].includes('/') ? eval(m[1]) : parseFloat(m[1]);
  return { qty, unit: m[2].toLowerCase().trim() };
}

// Parse quantity from ingredient string
// Handles: "2.5 lbs", "1/2 cup", "1 large", "3", leading fractions
function parseQty(str) {
  str = str.trim();

  // Mixed number: "1 1/2 cups"
  let m = str.match(/^(\d+)\s+(\d+)\/(\d+)\s+(.+)/);
  if (m) return { qty: parseInt(m[1]) + parseInt(m[2]) / parseInt(m[3]), rest: m[4] };

  // Fraction: "1/2 cup"
  m = str.match(/^(\d+)\/(\d+)\s+(.+)/);
  if (m) return { qty: parseInt(m[1]) / parseInt(m[2]), rest: m[3] };

  // Decimal or integer: "2.5 lbs", "3 cloves"
  m = str.match(/^([\d.]+)\s+(.+)/);
  if (m) return { qty: parseFloat(m[1]), rest: m[2] };

  // No number: "Salt to taste"
  return { qty: 1, rest: str };
}

// Extract unit from the rest of the string
function parseUnit(rest) {
  rest = rest.toLowerCase().trim();
  // Remove parenthetical info
  rest = rest.replace(/\(.*?\)/g, '').trim();

  // Try to match a known unit at the start
  for (const unit of Object.keys(UNIT_TO_TBSP)) {
    const re = new RegExp(`^${unit}s?\\b\\s*(.*)`, 'i');
    const m = rest.match(re);
    if (m) {
      const item = m[1].replace(/^(of|fresh|dried|grated|minced|diced|chopped|sliced|shredded|packed|cold|cubed)\s+/gi, '').trim();
      return { unit, item: item || rest };
    }
  }

  // No unit found — the rest is the item name
  return { unit: null, item: rest };
}

// Costco format: "Kirkland Product Name — 2.5 lbs (~$8.00, pack info)"
function parseCostcoIngredient(raw) {
  const parts = raw.split(' — ');
  const name = parts[0].replace(/^Kirkland\s+(Signature\s+)?/i, '').trim();

  if (parts.length < 2) return { name: name.toLowerCase(), qty: 1, unit: null };

  // Get quantity part (before parenthetical price)
  let qtyStr = parts[1].split('(')[0].trim();
  // Remove trailing comma
  qtyStr = qtyStr.replace(/,\s*$/, '').trim();

  const { qty, rest } = parseQty(qtyStr);
  const { unit } = parseUnit(rest);

  return { name: name.toLowerCase(), qty, unit };
}

// Other format: "1 large yellow onion, diced"
function parseOtherIngredient(raw) {
  // Remove prep instructions after comma
  let cleaned = raw.split(',')[0].trim();
  // Also handle "for serving/garnish"
  cleaned = cleaned.replace(/\s+(for\s+\w+|to taste|as needed|optional|adjust.*|or more).*$/i, '').trim();

  const { qty, rest } = parseQty(cleaned);
  const { unit, item } = parseUnit(rest);

  return { name: item.toLowerCase(), qty, unit };
}

// Try to match an ingredient name to the nutrition lookup
function findNutrition(name) {
  // Direct match
  if (NUTRITION[name]) return { key: name, data: NUTRITION[name] };

  // Try removing common prefixes/suffixes
  const cleaned = name
    .replace(/^(fresh|dried|frozen|organic|raw|cooked|canned|kirkland|costco)\s+/i, '')
    .replace(/\s+(fresh|dried|frozen)$/i, '')
    .trim();
  if (NUTRITION[cleaned]) return { key: cleaned, data: NUTRITION[cleaned] };

  // Try singular/plural
  const singular = name.replace(/s$/, '');
  if (NUTRITION[singular]) return { key: singular, data: NUTRITION[singular] };
  const plural = name + 's';
  if (NUTRITION[plural]) return { key: plural, data: NUTRITION[plural] };

  // Fuzzy: check if any key is contained in the name or vice versa
  for (const [key, data] of Object.entries(NUTRITION)) {
    if (name.includes(key) || key.includes(name)) {
      return { key, data };
    }
  }

  return null;
}

// Convert ingredient quantity to the reference unit for nutrition lookup
function estimateMultiplier(ingredientQty, ingredientUnit, refQty, refUnit) {
  // Same unit family
  const ingTbsp = ingredientUnit ? UNIT_TO_TBSP[ingredientUnit] : null;
  const refTbsp = UNIT_TO_TBSP[refUnit.split(' ')[0]];

  if (ingTbsp !== null && ingTbsp !== undefined && refTbsp !== null && refTbsp !== undefined) {
    // Both are volume/weight units — convert via tbsp
    const ingInTbsp = ingredientQty * ingTbsp;
    const refInTbsp = refQty * refTbsp;
    return ingInTbsp / refInTbsp;
  }

  // Countable units (pieces, cloves, etc.) — just use raw quantity ratio
  if (ingredientUnit === null || UNIT_TO_TBSP[ingredientUnit] === null) {
    return ingredientQty / refQty;
  }

  // Fallback: rough estimate
  return ingredientQty / refQty;
}

// ── Main ──
function getAllRecipeFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...getAllRecipeFiles(full));
    } else if (entry.endsWith('.md') && entry !== 'README.md') {
      files.push(full);
    }
  }
  return files;
}

const files = getAllRecipeFiles(RECIPES_DIR);
let totalProcessed = 0;
let totalWithNutrition = 0;
let unmatchedSet = new Set();

for (const file of files) {
  const raw = readFileSync(file, 'utf-8');
  const { data, content } = matter(raw);

  const servings = parseInt(data.servings) || 4;
  const costcoIngredients = data.costco_ingredients || [];
  const otherIngredients = data.other_ingredients || [];

  let totalCal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
  let matchedCount = 0;
  let totalCount = costcoIngredients.length + otherIngredients.length;

  // Process costco ingredients
  for (const ing of costcoIngredients) {
    const parsed = parseCostcoIngredient(ing);
    const match = findNutrition(parsed.name);
    if (match) {
      const ref = parseRef(match.data.ref);
      const mult = estimateMultiplier(parsed.qty, parsed.unit, ref.qty, ref.unit);
      totalCal += match.data.cal * mult;
      totalProtein += match.data.p * mult;
      totalCarbs += match.data.c * mult;
      totalFat += match.data.f * mult;
      matchedCount++;
    } else {
      unmatchedSet.add(parsed.name);
    }
  }

  // Process other ingredients
  for (const ing of otherIngredients) {
    const parsed = parseOtherIngredient(ing);
    const match = findNutrition(parsed.name);
    if (match) {
      const ref = parseRef(match.data.ref);
      const mult = estimateMultiplier(parsed.qty, parsed.unit, ref.qty, ref.unit);
      totalCal += match.data.cal * mult;
      totalProtein += match.data.p * mult;
      totalCarbs += match.data.c * mult;
      totalFat += match.data.f * mult;
      matchedCount++;
    } else {
      unmatchedSet.add(parsed.name);
    }
  }

  // Per serving
  const nutrition = {
    calories: Math.round(totalCal / servings),
    protein: Math.round(totalProtein / servings),
    carbs: Math.round(totalCarbs / servings),
    fat: Math.round(totalFat / servings),
  };

  // Only write if we matched at least 50% of ingredients
  const coverage = totalCount > 0 ? matchedCount / totalCount : 0;
  if (coverage >= 0.5) {
    data.nutrition = nutrition;
    const updated = matter.stringify(content, data);
    writeFileSync(file, updated);
    totalWithNutrition++;
  }

  totalProcessed++;
  const rel = relative(RECIPES_DIR, file);
  const pct = Math.round(coverage * 100);
  if (coverage < 0.5) {
    console.log(`  SKIP ${rel} (${pct}% matched, ${matchedCount}/${totalCount})`);
  }
}

console.log(`\n── Results ──`);
console.log(`Processed: ${totalProcessed} recipes`);
console.log(`Nutrition added: ${totalWithNutrition} recipes`);
console.log(`Skipped (low coverage): ${totalProcessed - totalWithNutrition}`);
console.log(`\nUnmatched ingredients (${unmatchedSet.size}):`);
[...unmatchedSet].sort().forEach(i => console.log(`  - ${i}`));
