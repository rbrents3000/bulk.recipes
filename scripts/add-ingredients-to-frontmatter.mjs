import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECIPES_DIR = join(__dirname, '..', 'recipes');

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

// Extract list items (- prefixed) from a section
function extractListItems(body, heading) {
  const regex = new RegExp(`## ${heading}[\\s]*\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = body.match(regex);
  if (!match) return [];
  return match[1].split('\n')
    .filter(line => line.trim().startsWith('- '))
    .map(line => line.replace(/^[\s]*-\s*/, '').trim())
    .filter(line => line.length > 0);
}

// Extract numbered steps from a section
function extractNumberedSteps(body, heading) {
  const regex = new RegExp(`## ${heading}[\\s]*\\n([\\s\\S]*?)(?=\\n## |\\n>|$)`);
  const match = body.match(regex);
  if (!match) return [];
  return match[1].split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\s*\d+\.\s*/, '').trim())
    .filter(line => line.length > 0);
}

// Extract paragraph text from a section
function extractParagraph(body, heading) {
  const regex = new RegExp(`## ${heading}[\\s]*\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = body.match(regex);
  if (!match) return '';
  return match[1].split('\n')
    .filter(line => line.trim() && !line.startsWith('#') && !line.startsWith('>'))
    .map(line => line.trim())
    .join(' ')
    .trim();
}

// Escape a string for YAML (handle quotes, colons, etc.)
function yamlString(s) {
  // If the string contains special YAML chars, wrap in double quotes
  if (s.includes('"')) {
    return `'${s}'`;
  }
  if (s.includes(':') || s.includes('#') || s.includes("'") || s.includes('*') || s.includes('|') || s.includes('>') || s.includes('{') || s.includes('}') || s.includes('[') || s.includes(']') || s.includes('`') || s.startsWith('-') || s.startsWith(' ')) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return `"${s}"`;
}

// Format a YAML array
function yamlArray(name, items) {
  if (items.length === 0) return `${name}: []\n`;
  let yaml = `${name}:\n`;
  for (const item of items) {
    yaml += `  - ${yamlString(item)}\n`;
  }
  return yaml;
}

function main() {
  const files = findRecipeFiles(RECIPES_DIR);
  console.log(`Found ${files.length} recipe files`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');

    // Check if file has frontmatter
    if (!content.startsWith('---')) {
      console.warn(`  SKIP (no frontmatter): ${relative(RECIPES_DIR, filePath)}`);
      skipped++;
      continue;
    }

    // Check if already has costco_ingredients (don't double-process)
    if (content.includes('costco_ingredients:')) {
      console.log(`  SKIP (already migrated): ${relative(RECIPES_DIR, filePath)}`);
      skipped++;
      continue;
    }

    // Split frontmatter and body
    const parts = content.split('---');
    if (parts.length < 3) {
      console.warn(`  ERROR (bad frontmatter): ${relative(RECIPES_DIR, filePath)}`);
      errors++;
      continue;
    }

    const existingFrontmatter = parts[1].trim();
    const body = parts.slice(2).join('---'); // Rejoin in case body has ---

    // Extract data from body
    const costcoIngredients = extractListItems(body, 'Costco Shopping List');
    const otherIngredients = extractListItems(body, 'Other Ingredients');
    const instructions = extractNumberedSteps(body, 'Instructions');
    const storage = extractParagraph(body, 'Storage');
    const leftoverIdeas = extractListItems(body, 'Leftover Ideas');

    // Build new frontmatter
    let newFrontmatter = existingFrontmatter + '\n';
    newFrontmatter += yamlArray('costco_ingredients', costcoIngredients);
    newFrontmatter += yamlArray('other_ingredients', otherIngredients);
    newFrontmatter += yamlArray('instructions', instructions);
    newFrontmatter += `storage: ${yamlString(storage)}\n`;
    newFrontmatter += yamlArray('leftover_ideas', leftoverIdeas);

    // Write back
    const newContent = `---\n${newFrontmatter}---${body}`;
    writeFileSync(filePath, newContent, 'utf-8');
    processed++;

    // Log progress every 20 files
    if (processed % 20 === 0) {
      console.log(`  Processed ${processed}...`);
    }
  }

  console.log(`\nDone!`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${files.length}`);
}

main();
