#!/usr/bin/env node
/**
 * Generate bulk-style recipe images using the Ideogram API.
 *
 * Usage:
 *   node scripts/generate-images.mjs                    # generate all missing images
 *   node scripts/generate-images.mjs --all              # regenerate ALL images
 *   node scripts/generate-images.mjs --recipe birria-tacos  # single recipe by slug
 *   node scripts/generate-images.mjs --dry-run          # preview prompts without calling API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require(path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'web'), 'node_modules', 'sharp'));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RECIPES_DIR = path.join(ROOT, 'recipes');
const IMAGES_DIR = path.join(ROOT, 'web', 'public', 'assets', 'recipes');

const API_KEY = process.env.IDEOGRAM_API_KEY || '8fapI0rCLtSwS851d_hTYAVTLvpSZgY34x27sppTIgqLJdZeifgSEMsYua3IDXciLxgwWXtP3qEPSfrKC1WcxA';
const API_URL = 'https://api.ideogram.ai/generate';
const CONCURRENCY = 2; // parallel API calls
const DELAY_MS = 1500; // delay between batches to avoid rate limits

// ---------------------------------------------------------------------------
// Parse recipe frontmatter (minimal YAML parser for our needs)
// ---------------------------------------------------------------------------
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  const result = {};
  let currentKey = null;
  for (const line of yaml.split('\n')) {
    const kvMatch = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      let val = kvMatch[2].trim();
      // Strip quotes
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      // Handle > or >- (block scalars - just grab next lines)
      if (val === '>' || val === '>-' || val === '|' || val === '|-') {
        result[currentKey] = '';
        continue;
      }
      result[currentKey] = val;
    } else if (currentKey && line.startsWith('  ') && !line.trim().startsWith('-')) {
      // Continuation of block scalar
      if (typeof result[currentKey] === 'string') {
        result[currentKey] += (result[currentKey] ? ' ' : '') + line.trim();
      }
    } else if (line.trim().startsWith('- ') && currentKey) {
      // Array item - skip for our purposes, we mainly need title/category/servings
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Collect all recipes
// ---------------------------------------------------------------------------
function collectRecipes(dir, recipes = [], prefix = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      collectRecipes(path.join(dir, entry.name), recipes, prefix ? `${prefix}/${entry.name}` : entry.name);
    } else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
      const filePath = path.join(dir, entry.name);
      const content = fs.readFileSync(filePath, 'utf-8');
      const meta = parseFrontmatter(content);
      const slug = entry.name.replace('.md', '');
      recipes.push({
        slug,
        filePath,
        category: prefix || meta.category || '',
        title: meta.title || slug.replace(/-/g, ' '),
        description: meta.description || '',
        servings: meta.servings || '',
        imagePath: path.join(IMAGES_DIR, `${slug}.webp`),
      });
    }
  }
  return recipes;
}

// ---------------------------------------------------------------------------
// Category-specific bulk cues
// ---------------------------------------------------------------------------
const CATEGORY_CUES = {
  'appetizers': 'arranged on a large catering platter for a party, dozens of pieces, bulk appetizer spread',
  'soups': 'in a massive stock pot or Dutch oven filled to the brim, with a large ladle, batch cooking for a crowd',
  'weeknight-dinners': 'in a large casserole dish or big cast iron skillet, family-sized portions, big batch home cooking',
  'desserts': 'full-sized whole dessert on a large platter or full sheet pan of treats, bakery-scale batch, impressive presentation',
  'drinks': 'in a large glass beverage dispenser or huge pitcher, with multiple filled glasses around it, party-scale batch drink',
  'grilling': 'on a large loaded grill or big cutting board, generous quantities of grilled meat, outdoor cookout for a crowd',
  'meal-prep': 'with multiple meal prep containers being filled in a row, assembly-line batch cooking, organized large-quantity preparation',
  'slow-cooker': 'in a large slow cooker or crockpot filled to the brim, big batch comfort food, low and slow cooking',
  'salads': 'in an enormous serving bowl, tossed with abundant fresh ingredients, large batch salad for a gathering',
  'snacks': 'in big bowls and bags being portioned out, large Costco-sized batch, bulk snack preparation',
  'feeding-a-crowd': 'on large aluminum catering trays or hotel pans, buffet-style setup for dozens of people, massive quantity',
  'rotisserie-chicken': 'large batch made with shredded rotisserie chicken, generous family-sized portions in a big dish, bulk home cooking',
  'costco-copycats/bakery': 'full bakery-sized batch, multiple pieces arranged on a large wooden board or bakery display, Costco bakery-scale quantity',
  'costco-copycats/deli': 'Costco deli-counter style presentation, large quantity on a big platter or in a large container, warehouse-scale portion',
  'costco-copycats/food-court': 'Costco food court style, large servings, multiple portions visible, cafeteria-scale batch',
  'costco-copycats/international': 'large batch international dish, generous portions in big serving vessels, bulk preparation',
};

function getCategoryCue(category) {
  // Try exact match first, then parent category
  if (CATEGORY_CUES[category]) return CATEGORY_CUES[category];
  const parent = category.split('/')[0];
  if (CATEGORY_CUES[parent]) return CATEGORY_CUES[parent];
  return 'large batch, bulk cooking, generous quantities, multiple servings visible';
}

// ---------------------------------------------------------------------------
// Dish-type overrides — when the title tells us what vessel makes sense,
// override the generic category cue so we don't get nonsense like
// "smoothie in a beverage dispenser" or "pizza on a cutting board."
// ---------------------------------------------------------------------------
const DISH_OVERRIDES = [
  [/pizza/i,       'whole large pizza on a big wooden board or sheet pan, multiple pizzas visible, generous toppings, bulk batch'],
  [/smoothie/i,    'multiple tall glasses of smoothie in a row, a large blender pitcher full in the background, bulk meal-prep smoothies'],
  [/soup|chowder|chili|stew|pozole|pho/i, 'in a massive stock pot or Dutch oven filled to the brim, with a large ladle, batch cooking for a crowd'],
  [/taco/i,        'on a large aluminum catering tray packed with dozens of tacos, garnishes and dipping sauces alongside, bulk taco spread'],
  [/sandwich|sub|hoagie/i, 'a large platter stacked with many sandwiches, cut and arranged for a party, bulk sandwich platter'],
  [/burger/i,      'multiple burgers arranged on a large wooden board or sheet pan, big batch cookout style'],
  [/pancake|waffle/i, 'tall stacks on a large platter, with many more on a griddle in the background, big batch breakfast'],
  [/muffin/i,      'full muffin tin just out of the oven, with more cooling on wire racks, big bakery batch'],
  [/cookie/i,      'dozens of cookies cooling on multiple wire racks and sheet pans, big batch baking'],
  [/brownie/i,     'a large pan of brownies cut into squares, full sheet pan, big batch baking'],
  [/cake/i,        'a full whole cake on a large cake stand or platter, impressive size, bakery presentation'],
  [/bread/i,       'multiple fresh loaves on a large cutting board, big batch baking, golden crusts'],
  [/salad/i,       'in an enormous serving bowl, tossed with abundant fresh ingredients, large batch for a gathering'],
  [/pasta|spaghetti|penne|ziti|ravioli|mac/i, 'in a large casserole dish or big deep serving bowl, generous heaping portions, family-style bulk pasta'],
  [/rice|fried rice|pilaf/i, 'in a huge serving bowl or big wok, large batch, generous portions for a crowd'],
  [/curry|masala/i, 'in a large pot or deep serving dish, with a big bowl of rice alongside, generous batch cooking'],
  [/wings/i,       'piled high on a massive platter, dozens of crispy wings, big game-day batch'],
  [/ribs/i,        'full rack of ribs on a large cutting board, multiple racks visible, big cookout batch'],
  [/roast|brisket/i, 'a massive piece of meat on a large cutting board, sliced thick, big batch for a crowd'],
  [/dip|hummus|guacamole/i, 'in a large serving bowl surrounded by a huge spread of chips and dippers, party-sized batch'],
  [/croissant/i,   'arranged in abundance on a large wooden board, full bakery-style batch, multiple croissants'],
  [/dumpling|gyoza|wonton/i, 'dozens of dumplings arranged on a large bamboo steamer or sheet pan, big batch handmade'],
];

// ---------------------------------------------------------------------------
// Build the image prompt
// ---------------------------------------------------------------------------
function buildPrompt(recipe) {
  // Check for dish-type-specific override first
  let cue = null;
  for (const [pattern, override] of DISH_OVERRIDES) {
    if (pattern.test(recipe.title)) {
      cue = override;
      break;
    }
  }
  // Fall back to category cue
  if (!cue) cue = getCategoryCue(recipe.category);

  // Include a short description snippet so Ideogram knows what the dish
  // actually looks like (crucial for international/niche dishes)
  let descSnippet = '';
  if (recipe.description) {
    // Take first ~120 chars of description, trim to last complete word
    let d = recipe.description.replace(/\s+/g, ' ').trim().slice(0, 120);
    d = d.replace(/\s\S*$/, ''); // trim partial word
    descSnippet = ` — ${d}`;
  }

  return [
    `Overhead food photography of ${recipe.title}${descSnippet}`,
    cue,
    `warm kitchen lighting, photorealistic, no text, no watermark, no labels`,
  ].join(', ');
}

// ---------------------------------------------------------------------------
// Call Ideogram API
// ---------------------------------------------------------------------------
async function generateImage(prompt) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Api-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_request: {
        prompt,
        aspect_ratio: 'ASPECT_4_3',
        model: 'V_2_TURBO',
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ideogram API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!data.data?.[0]?.url) {
    throw new Error(`No image URL in response: ${JSON.stringify(data)}`);
  }
  return data.data[0].url;
}

// ---------------------------------------------------------------------------
// Download image, resize to 800x600, and convert to WebP
// ---------------------------------------------------------------------------
async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await sharp(buffer)
    .resize(800, 600, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(destPath);
}

// ---------------------------------------------------------------------------
// Sleep helper
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const regenerateAll = args.includes('--all');
  const dryRun = args.includes('--dry-run');
  const recipeFilter = args.includes('--recipe') ? args[args.indexOf('--recipe') + 1] : null;

  const recipes = collectRecipes(RECIPES_DIR);
  console.log(`Found ${recipes.length} recipes`);

  // Filter
  let toProcess = recipes;
  if (recipeFilter) {
    toProcess = recipes.filter(r => r.slug === recipeFilter);
    if (toProcess.length === 0) {
      console.error(`No recipe found with slug "${recipeFilter}"`);
      process.exit(1);
    }
  } else if (!regenerateAll) {
    toProcess = recipes.filter(r => !fs.existsSync(r.imagePath));
    console.log(`${toProcess.length} recipes missing images`);
  }

  if (toProcess.length === 0) {
    console.log('Nothing to generate. Use --all to regenerate existing images.');
    return;
  }

  console.log(`Will generate ${toProcess.length} images${dryRun ? ' (DRY RUN)' : ''}...\n`);

  let success = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (recipe) => {
      const prompt = buildPrompt(recipe);
      console.log(`[${i + batch.indexOf(recipe) + 1}/${toProcess.length}] ${recipe.slug}`);
      console.log(`  Prompt: ${prompt.slice(0, 120)}...`);

      if (dryRun) {
        console.log(`  (dry run — skipped)\n`);
        return;
      }

      try {
        const imageUrl = await generateImage(prompt);
        await downloadImage(imageUrl, recipe.imagePath);
        console.log(`  ✓ Saved to ${path.relative(ROOT, recipe.imagePath)}\n`);
        success++;
      } catch (err) {
        console.error(`  ✗ Failed: ${err.message}\n`);
        failed++;
      }
    });

    await Promise.all(promises);

    // Rate limit delay between batches
    if (i + CONCURRENCY < toProcess.length && !dryRun) {
      await sleep(DELAY_MS);
    }
  }

  if (!dryRun) {
    console.log(`\nDone! ${success} generated, ${failed} failed.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
