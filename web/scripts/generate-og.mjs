import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import sharp from 'sharp';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECIPES_DIR = path.resolve(__dirname, '../../recipes');
const IMAGES_DIR = path.resolve(__dirname, '../public/assets/recipes');
const OUTPUT_DIR = path.resolve(__dirname, '../public/og');

const WIDTH = 1200;
const HEIGHT = 630;
const PHOTO_WIDTH = 480;
const BRAND_COLOR = '#ba0027';
const BG_COLOR = '#fafafa';

// Load fonts
const fontBold = fs.readFileSync(path.join(__dirname, 'fonts/PlusJakartaSans-Bold.ttf'));
const fontRegular = fs.readFileSync(path.join(__dirname, 'fonts/PlusJakartaSans-Regular.ttf'));

const fonts = [
  { name: 'Plus Jakarta Sans', data: fontBold, weight: 700, style: 'normal' },
  { name: 'Plus Jakarta Sans', data: fontRegular, weight: 400, style: 'normal' },
];

function getAllRecipes() {
  const recipes = [];

  function scanDir(dir, categoryPrefix) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const nextPrefix = categoryPrefix ? `${categoryPrefix}/${entry}` : entry;
        scanDir(fullPath, nextPrefix);
      } else if (entry.endsWith('.md') && entry !== 'README.md' && categoryPrefix) {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const { data } = matter(raw);
        const slug = entry.replace('.md', '');
        recipes.push({
          id: `${categoryPrefix}/${slug}`,
          slug,
          category: categoryPrefix,
          ...data,
        });
      }
    }
  }

  scanDir(RECIPES_DIR, '');
  return recipes;
}

function buildDietBadges(recipe) {
  const badges = [];
  if (recipe.vegetarian) badges.push({ label: 'VEG', bg: '#dcfce7', color: '#166534' });
  if (recipe.gluten_free) badges.push({ label: 'GF', bg: '#fef3c7', color: '#92400e' });
  if (recipe.dairy_free) badges.push({ label: 'DF', bg: '#dbeafe', color: '#1e40af' });
  return badges;
}

function buildOgMarkup(recipe, hasPhoto) {
  const title = recipe.title || 'Untitled Recipe';
  const cost = recipe.cost ?? 0;
  const costDisplay = recipe.cost_unit === 'serving'
    ? `$${cost.toFixed(2)}/serving`
    : `$${cost.toFixed(2)}/${recipe.cost_unit || 'batch'}`;
  const cook = recipe.cook || '';
  const servings = recipe.servings || '';

  const badges = buildDietBadges(recipe);
  const categoryLabel = (recipe.category || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const leftPanel = hasPhoto
    ? {
        type: 'div',
        props: {
          style: {
            width: `${PHOTO_WIDTH}px`,
            height: `${HEIGHT}px`,
            backgroundColor: '#e5e5e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          },
          children: {
            type: 'div',
            props: {
              style: {
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '120px',
              },
              children: '🍽',
            },
          },
        },
      }
    : {
        type: 'div',
        props: {
          style: {
            width: `${PHOTO_WIDTH}px`,
            height: `${HEIGHT}px`,
            background: `linear-gradient(135deg, ${BRAND_COLOR} 0%, #8b0019 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          },
          children: {
            type: 'div',
            props: {
              style: {
                fontSize: '120px',
                display: 'flex',
              },
              children: '🍽',
            },
          },
        },
      };

  return {
    type: 'div',
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        display: 'flex',
        backgroundColor: BG_COLOR,
      },
      children: [
        leftPanel,
        {
          type: 'div',
          props: {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '40px 48px',
            },
            children: [
              // Top: brand + category
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: '8px' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '20px',
                          fontWeight: 700,
                          color: BRAND_COLOR,
                          letterSpacing: '1px',
                        },
                        children: 'BULK.RECIPES',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '13px',
                          fontWeight: 400,
                          color: '#737373',
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                        },
                        children: categoryLabel,
                      },
                    },
                  ],
                },
              },
              // Middle: title
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: title.length > 35 ? '36px' : '44px',
                    fontWeight: 700,
                    color: '#171717',
                    lineHeight: 1.15,
                    display: 'flex',
                  },
                  children: title,
                },
              },
              // Bottom: metadata + badges
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: '12px' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          gap: '24px',
                          fontSize: '18px',
                          fontWeight: 400,
                          color: '#525252',
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: { display: 'flex' },
                              children: `${cook}`,
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: { display: 'flex' },
                              children: costDisplay,
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: { display: 'flex' },
                              children: `Serves ${servings}`,
                            },
                          },
                        ],
                      },
                    },
                    ...(badges.length > 0
                      ? [
                          {
                            type: 'div',
                            props: {
                              style: { display: 'flex', gap: '8px' },
                              children: badges.map(b => ({
                                type: 'div',
                                props: {
                                  style: {
                                    backgroundColor: b.bg,
                                    color: b.color,
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    padding: '4px 12px',
                                    borderRadius: '9999px',
                                    display: 'flex',
                                  },
                                  children: b.label,
                                },
                              })),
                            },
                          },
                        ]
                      : []),
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function generateImage(recipe) {
  const photoPath = path.join(IMAGES_DIR, `${recipe.slug}.png`);
  const hasPhoto = fs.existsSync(photoPath);

  const markup = buildOgMarkup(recipe, hasPhoto);
  const svg = await satori(markup, { width: WIDTH, height: HEIGHT, fonts });

  let image = sharp(Buffer.from(svg));

  // If we have a recipe photo, composite it onto the left panel
  if (hasPhoto) {
    const photo = await sharp(photoPath)
      .resize(PHOTO_WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    const base = await image.png().toBuffer();
    image = sharp(base).composite([{ input: photo, left: 0, top: 0 }]);
  }

  const outputPath = path.join(OUTPUT_DIR, `${recipe.id}.png`);
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });

  await image.png({ quality: 80, compressionLevel: 9 }).toFile(outputPath);
}

async function generateDefault() {
  const markup = {
    type: 'div',
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${BRAND_COLOR} 0%, #8b0019 100%)`,
        flexDirection: 'column',
        gap: '16px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontSize: '64px',
              fontWeight: 700,
              color: 'white',
              display: 'flex',
            },
            children: 'BULK.RECIPES',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '24px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.85)',
              display: 'flex',
            },
            children: 'The unofficial field guide to cooking with Costco groceries',
          },
        },
      ],
    },
  };

  const svg = await satori(markup, { width: WIDTH, height: HEIGHT, fonts });
  const outputPath = path.join(OUTPUT_DIR, 'default.png');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outputPath);
}

async function main() {
  const recipes = getAllRecipes();
  console.log(`Generating OG images for ${recipes.length} recipes...`);

  // Generate default OG image
  await generateDefault();
  console.log('  Generated default.png');

  // Process in batches of 10
  const BATCH_SIZE = 10;
  let done = 0;
  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(r => generateImage(r)));
    done += batch.length;
    console.log(`  ${done}/${recipes.length} recipes processed`);
  }

  console.log('Done!');
}

main().catch(err => {
  console.error('OG image generation failed:', err);
  process.exit(1);
});
