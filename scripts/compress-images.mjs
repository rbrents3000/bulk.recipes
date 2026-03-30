#!/usr/bin/env node
/**
 * Compress all recipe images to proper WebP format at 800x600.
 * Run this after generate-images.mjs to shrink PNGs saved as .webp.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require(path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'web'), 'node_modules', 'sharp'));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '..', 'web', 'public', 'assets', 'recipes');
const BATCH_SIZE = 10;

async function main() {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp'));
  console.log(`Found ${files.length} images to compress`);

  let compressed = 0;
  let skipped = 0;
  let totalBefore = 0;
  let totalAfter = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (file) => {
      const filePath = path.join(IMAGES_DIR, file);
      const stat = fs.statSync(filePath);
      const sizeBefore = stat.size;
      totalBefore += sizeBefore;

      // Skip if already small (likely already compressed)
      if (sizeBefore < 100_000) {
        skipped++;
        totalAfter += sizeBefore;
        return;
      }

      try {
        const buffer = fs.readFileSync(filePath);
        const output = await sharp(buffer)
          .resize(800, 600, { fit: 'cover' })
          .webp({ quality: 80 })
          .toBuffer();

        fs.writeFileSync(filePath, output);
        const sizeAfter = output.length;
        totalAfter += sizeAfter;
        const pct = ((1 - sizeAfter / sizeBefore) * 100).toFixed(0);
        console.log(`  ${file}: ${(sizeBefore/1024).toFixed(0)}KB → ${(sizeAfter/1024).toFixed(0)}KB (${pct}% smaller)`);
        compressed++;
      } catch (err) {
        console.error(`  ${file}: FAILED - ${err.message}`);
        totalAfter += sizeBefore;
        skipped++;
      }
    }));
  }

  console.log(`\nDone! ${compressed} compressed, ${skipped} skipped`);
  console.log(`Total: ${(totalBefore/1024/1024).toFixed(1)}MB → ${(totalAfter/1024/1024).toFixed(1)}MB`);
}

main().catch(err => { console.error(err); process.exit(1); });
