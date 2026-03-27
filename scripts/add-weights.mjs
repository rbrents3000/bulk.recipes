/**
 * Add gram weight annotations to other_ingredients in all recipes.
 * E.g. "1 cup all-purpose flour" → "1 cup (120g) all-purpose flour"
 *
 * Usage: node scripts/add-weights.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(join(process.cwd(), 'web', 'package.json'));
const matter = require('gray-matter');
import { WEIGHTS } from './weight-data.mjs';

const RECIPES_DIR = join(process.cwd(), 'recipes');

// Units we can convert
const VOLUME_UNITS = ['cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons'];
const WEIGHT_UNITS = ['lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces'];
const ALL_UNITS = [...VOLUME_UNITS, ...WEIGHT_UNITS];

// Normalize unit to lookup key
function normalizeUnit(u) {
  u = u.toLowerCase();
  if (['cup', 'cups'].includes(u)) return 'cup';
  if (['tbsp', 'tablespoon', 'tablespoons'].includes(u)) return 'tbsp';
  if (['tsp', 'teaspoon', 'teaspoons'].includes(u)) return 'tsp';
  if (['lb', 'lbs', 'pound', 'pounds'].includes(u)) return 'lb';
  if (['oz', 'ounce', 'ounces'].includes(u)) return 'oz';
  return u;
}

// Parse quantity from start of string
function parseQty(str) {
  str = str.trim();

  // Mixed number: "1 1/2 cups"
  let m = str.match(/^(\d+)\s+(\d+)\/(\d+)\s+(.+)/);
  if (m) return { qty: parseInt(m[1]) + parseInt(m[2]) / parseInt(m[3]), rest: m[4] };

  // Fraction: "1/2 cup"
  m = str.match(/^(\d+)\/(\d+)\s+(.+)/);
  if (m) return { qty: parseInt(m[1]) / parseInt(m[2]), rest: m[3] };

  // Decimal or integer: "2.5 lbs"
  m = str.match(/^([\d.]+)\s+(.+)/);
  if (m) return { qty: parseFloat(m[1]), rest: m[2] };

  return null;
}

// Try to find the ingredient name in our weights table
function findWeight(name) {
  name = name.toLowerCase().trim();
  if (WEIGHTS[name] !== undefined) return WEIGHTS[name];

  // Strip common prefixes
  const cleaned = name.replace(/^(fresh|dried|frozen|organic|raw|cooked|canned)\s+/i, '').trim();
  if (WEIGHTS[cleaned] !== undefined) return WEIGHTS[cleaned];

  // Singular/plural
  if (WEIGHTS[name.replace(/s$/, '')] !== undefined) return WEIGHTS[name.replace(/s$/, '')];
  if (WEIGHTS[name + 's'] !== undefined) return WEIGHTS[name + 's'];

  // Fuzzy substring
  for (const [key, data] of Object.entries(WEIGHTS)) {
    if (data === null) continue;
    if (name.includes(key) || key.includes(name)) return data;
  }

  return null;
}

// Round to nearest 5g
function roundTo5(g) {
  return Math.round(g / 5) * 5;
}

// Process a single other_ingredient string
function annotate(ingredient) {
  // Skip if already has weight annotation
  if (/\(\d+g\)/.test(ingredient)) return ingredient;
  // Skip "to taste", "for serving", etc.
  if (/to taste|for (serving|garnish)|as needed|optional/i.test(ingredient)) return ingredient;

  const parsed = parseQty(ingredient);
  if (!parsed) return ingredient;

  const { qty, rest } = parsed;

  // Try to extract unit
  const unitMatch = rest.match(new RegExp(`^(${ALL_UNITS.join('|')})\\b\\s*(.*)`, 'i'));
  if (!unitMatch) return ingredient;

  const rawUnit = unitMatch[1];
  const itemName = unitMatch[2]
    .replace(/^(of|fresh|dried|frozen|grated|minced|diced|chopped|sliced|shredded|packed|cold|cubed)\s+/gi, '')
    .replace(/,.*$/, '')
    .trim();

  const normUnit = normalizeUnit(rawUnit);
  const weights = findWeight(itemName);

  if (!weights || !weights[normUnit]) return ingredient;

  const grams = roundTo5(qty * weights[normUnit]);
  if (grams < 5) return ingredient; // skip negligible

  // Insert weight annotation after the unit
  // "1 cup all-purpose flour" → "1 cup (120g) all-purpose flour"
  const qtyStr = ingredient.substring(0, ingredient.toLowerCase().indexOf(rawUnit.toLowerCase()) + rawUnit.length);
  const afterUnit = ingredient.substring(qtyStr.length);

  return `${qtyStr} (${grams}g)${afterUnit}`;
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
let totalAnnotated = 0;
let totalIngredients = 0;
let annotatedIngredients = 0;

for (const file of files) {
  const raw = readFileSync(file, 'utf-8');
  const { data, content } = matter(raw);

  const others = data.other_ingredients || [];
  if (others.length === 0) continue;

  let changed = false;
  const updated = others.map(ing => {
    totalIngredients++;
    const result = annotate(ing);
    if (result !== ing) {
      annotatedIngredients++;
      changed = true;
    }
    return result;
  });

  if (changed) {
    data.other_ingredients = updated;
    const out = matter.stringify(content, data);
    writeFileSync(file, out);
    totalAnnotated++;
  }
}

console.log(`\n── Results ──`);
console.log(`Recipes modified: ${totalAnnotated}`);
console.log(`Ingredients with weights: ${annotatedIngredients} / ${totalIngredients}`);
console.log(`Coverage: ${Math.round(annotatedIngredients / totalIngredients * 100)}%`);
