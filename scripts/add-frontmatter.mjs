import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const RECIPES_DIR = join(REPO_ROOT, 'recipes');
const DIETARY_FILE = join(REPO_ROOT, 'guides', 'dietary.md');

// Parse dietary.md to build lookup map
function parseDietaryIndex() {
  const content = readFileSync(DIETARY_FILE, 'utf-8');
  const lines = content.split('\n');
  const dietaryMap = {};

  for (const line of lines) {
    // Match table rows like: | [Recipe](../recipes/path/file.md) | Category | $X.XX | ✓ | | ✓ |
    const match = line.match(/\|\s*\[.*?\]\(\.\.\/recipes\/(.+?\.md)\)\s*\|.*?\|.*?\|\s*(✓?)\s*\|\s*(✓?)\s*\|\s*(✓?)\s*\|/);
    if (match) {
      const filePath = match[1];
      const fileName = basename(filePath, '.md');
      dietaryMap[fileName] = {
        vegetarian: match[2] === '✓',
        gluten_free: match[3] === '✓',
        dairy_free: match[4] === '✓',
      };
    }
  }
  return dietaryMap;
}

// Recursively find all .md files excluding README.md
function findRecipeFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...findRecipeFiles(fullPath));
    } else if (entry.endsWith('.md') && entry !== 'README.md') {
      files.push(fullPath);
    }
  }
  return files;
}

// Parse a recipe file and extract metadata
function parseRecipe(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Skip if already has frontmatter
  if (lines[0].trim() === '---') {
    return null;
  }

  // Line 1: Title
  const titleLine = lines[0] || '';
  let title = titleLine.replace(/^#\s+/, '').trim();
  // Strip "Copycat Costco [Region] " prefix variations
  title = title.replace(/^Copycat Costco\s+(?:Korea\s+|Japan\s+|France\s+|China\s+|Mexico\s+|Canada\s+|Bakery\s+|Deli\s+)?/i, '').trim();

  // Line 3: Description (blockquote)
  const descLine = lines[2] || '';
  const description = descLine.replace(/^>\s*/, '').trim();

  // Find metadata line (scan lines 4-10 for **Prep:**)
  let metaLine = '';
  let metaLineIndex = -1;
  for (let i = 4; i < Math.min(lines.length, 12); i++) {
    if (lines[i] && lines[i].includes('**Prep:**')) {
      metaLine = lines[i];
      metaLineIndex = i;
      break;
    }
  }

  if (!metaLine) {
    console.warn(`  WARNING: No metadata found in ${filePath}`);
    return null;
  }

  // Parse metadata fields
  const prepMatch = metaLine.match(/\*\*Prep:\*\*\s*(.+?)\s*\|/);
  const cookMatch = metaLine.match(/\*\*Cook:\*\*\s*(.+?)\s*\|/);
  const servingsMatch = metaLine.match(/\*\*Servings:\*\*\s*(.+?)\s*\|/);
  const costMatch = metaLine.match(/\*\*Cost:\*\*\s*~?\$?([\d.]+)\/([\w+]+)/);

  const prep = prepMatch ? prepMatch[1].trim() : 'unknown';
  const cook = cookMatch ? cookMatch[1].trim() : 'unknown';
  const servings = servingsMatch ? servingsMatch[1].trim() : 'unknown';
  const cost = costMatch ? parseFloat(costMatch[1]) : 0;
  const costUnit = costMatch ? costMatch[2].trim() : 'serving';

  // Category from path
  const relPath = relative(RECIPES_DIR, filePath);
  const category = dirname(relPath).replace(/\\/g, '/');

  return { title, description, prep, cook, servings, cost, costUnit, category, content, lines };
}

// Generate YAML frontmatter
function generateFrontmatter(recipe, dietary) {
  const fileName = basename(recipe.filePath, '.md');
  const diet = dietary[fileName] || { vegetarian: false, gluten_free: false, dairy_free: false };

  const yaml = [
    '---',
    `title: "${recipe.title.replace(/"/g, '\\"')}"`,
    `description: "${recipe.description.replace(/"/g, '\\"')}"`,
    `prep: "${recipe.prep}"`,
    `cook: "${recipe.cook}"`,
    `servings: "${recipe.servings}"`,
    `cost: ${recipe.cost}`,
    `cost_unit: "${recipe.costUnit}"`,
    `category: "${recipe.category}"`,
    `vegetarian: ${diet.vegetarian}`,
    `gluten_free: ${diet.gluten_free}`,
    `dairy_free: ${diet.dairy_free}`,
    '---',
    '',
  ];

  return yaml.join('\n');
}

// Main
function main() {
  console.log('Parsing dietary index...');
  const dietary = parseDietaryIndex();
  console.log(`  Found ${Object.keys(dietary).length} dietary entries`);

  console.log('\nFinding recipe files...');
  const files = findRecipeFiles(RECIPES_DIR);
  console.log(`  Found ${files.length} recipe files`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const filePath of files) {
    const recipe = parseRecipe(filePath);

    if (recipe === null) {
      if (readFileSync(filePath, 'utf-8').startsWith('---')) {
        skipped++;
        console.log(`  SKIP (already has frontmatter): ${relative(RECIPES_DIR, filePath)}`);
      } else {
        errors++;
      }
      continue;
    }

    recipe.filePath = filePath;
    const frontmatter = generateFrontmatter(recipe, dietary);
    const newContent = frontmatter + recipe.content;

    writeFileSync(filePath, newContent, 'utf-8');
    processed++;
  }

  console.log(`\nDone!`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${files.length}`);
}

main();
