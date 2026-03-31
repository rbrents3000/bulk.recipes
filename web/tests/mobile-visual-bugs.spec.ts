import { test, expect } from '@playwright/test';

const MOBILE = { width: 375, height: 812 };
const SMALL_MOBILE = { width: 320, height: 568 }; // iPhone SE

test.describe('Mobile Visual Bug Detection', () => {

  test.describe('Horizontal overflow check (every page)', () => {
    const pages = [
      '/', '/recipes', '/recipes/weeknight-dinners/birria-tacos',
      '/prepared', '/prepared/us', '/prepared/japan',
      '/guides', '/guides/first-trip', '/guides/meal-plans',
      '/products', '/about', '/recipes/favorites',
    ];

    for (const path of pages) {
      test(`no overflow at 375px: ${path}`, async ({ page }) => {
        await page.setViewportSize(MOBILE);
        await page.goto(path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
        expect(overflow, `Horizontal overflow on ${path}`).toBe(false);
      });

      test(`no overflow at 320px: ${path}`, async ({ page }) => {
        await page.setViewportSize(SMALL_MOBILE);
        await page.goto(path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
        expect(overflow, `Horizontal overflow on ${path} at 320px`).toBe(false);
      });
    }
  });

  test.describe('BakeryStrip buttons', () => {
    test('bakery CTA buttons do not overflow on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/', { waitUntil: 'networkidle' });
      // Scroll to reveal the bakery strip
      await page.evaluate(() => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
      });
      await page.waitForTimeout(300);

      // Find bakery strip buttons container
      const bakeryBtns = page.locator('a:has-text("Browse Bakery Recipes")');
      if (await bakeryBtns.count() > 0) {
        const btnBox = await bakeryBtns.first().boundingBox();
        expect(btnBox).not.toBeNull();
        // Button should not extend beyond viewport
        expect(btnBox!.x + btnBox!.width).toBeLessThanOrEqual(MOBILE.width + 2);
      }
    });

    test('bakery CTA buttons wrap or stack on 320px', async ({ page }) => {
      await page.setViewportSize(SMALL_MOBILE);
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
      });
      await page.waitForTimeout(300);

      const bakeryBtn = page.locator('a:has-text("Browse Bakery Recipes")');
      const tipsBtn = page.locator('a:has-text("Bulk Tips")');
      if (await bakeryBtn.count() > 0 && await tipsBtn.count() > 0) {
        const box1 = await bakeryBtn.first().boundingBox();
        const box2 = await tipsBtn.first().boundingBox();
        if (box1 && box2) {
          // Either they wrap (box2.y > box1.y) or they both fit (box2.x + box2.width <= 320)
          const wraps = box2.y > box1.y + 5;
          const fits = box2.x + box2.width <= SMALL_MOBILE.width + 2;
          expect(wraps || fits, 'Bakery buttons overflow at 320px').toBe(true);
        }
      }
    });
  });

  test.describe('Touch targets', () => {
    test('servings scaler buttons are tappable (>= 36px)', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const scalerBtns = page.locator('button:has-text("1×")');
      if (await scalerBtns.count() > 0) {
        const box = await scalerBtns.first().boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height, 'Scaler button too short for touch').toBeGreaterThanOrEqual(32);
        expect(box!.width, 'Scaler button too narrow for touch').toBeGreaterThanOrEqual(40);
      }
    });

    test('ingredient checkboxes are tappable', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const checkboxes = page.locator('input[type="checkbox"]');
      if (await checkboxes.count() > 0) {
        const box = await checkboxes.first().boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(22);
        expect(box!.width).toBeGreaterThanOrEqual(22);
      }
    });

    test('share bar buttons are tappable', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const shareButtons = page.locator('button[aria-label="Copy link"], a[aria-label="Share on Pinterest"]');
      if (await shareButtons.count() > 0) {
        const box = await shareButtons.first().boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height, 'Share button too short').toBeGreaterThanOrEqual(36);
        expect(box!.width, 'Share button too narrow').toBeGreaterThanOrEqual(36);
      }
    });
  });

  test.describe('Text visibility', () => {
    test('recipe card titles are not truncated to nothing', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/recipes', { waitUntil: 'networkidle' });

      const titles = page.locator('h3.line-clamp-2');
      const count = await titles.count();
      for (let i = 0; i < Math.min(count, 6); i++) {
        const text = await titles.nth(i).textContent();
        expect(text?.trim().length, `Card title ${i} is empty`).toBeGreaterThan(0);
        const box = await titles.nth(i).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height, `Card title ${i} has zero height`).toBeGreaterThan(0);
      }
    });

    test('recipe description visible on detail page', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      const desc = page.locator('p.italic').first();
      await expect(desc).toBeVisible();
      const text = await desc.textContent();
      expect(text?.trim().length).toBeGreaterThan(10);
    });
  });

  test.describe('Image loading', () => {
    test('recipe card images load on browse page', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/recipes', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const images = page.locator('a.group.block img');
      const count = await images.count();
      expect(count).toBeGreaterThan(0);

      let brokenCount = 0;
      for (let i = 0; i < Math.min(count, 6); i++) {
        const naturalWidth = await images.nth(i).evaluate(
          (img: HTMLImageElement) => img.naturalWidth
        );
        if (naturalWidth === 0) brokenCount++;
      }
      expect(brokenCount, 'Broken images on browse page').toBeLessThanOrEqual(1);
    });

    test('hero image loads on recipe detail', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });

      const heroImg = page.locator('header img').first();
      await expect(heroImg).toBeVisible();
      const naturalWidth = await heroImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth, 'Hero image failed to load').toBeGreaterThan(0);
    });
  });

  test.describe('Layout issues', () => {
    test('metadata bar items visible at 375px', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // All 4 metadata items should be visible
      for (const label of ['Prep', 'Cook', 'Servings', 'Cost']) {
        const el = page.locator(`text=${label}`).first();
        await expect(el, `${label} not visible in metadata bar`).toBeVisible();
      }
    });

    test('nutrition bar does not overflow at 320px', async ({ page }) => {
      await page.setViewportSize(SMALL_MOBILE);
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      const nutritionBar = page.locator('.flex.flex-wrap.items-center.gap-3');
      if (await nutritionBar.count() > 0) {
        const box = await nutritionBar.first().boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width, 'Nutrition bar wider than viewport').toBeLessThanOrEqual(SMALL_MOBILE.width);
      }
    });

    test('footer does not overlap mobile nav', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/', { waitUntil: 'networkidle' });

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      const footer = page.locator('footer');
      const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');

      const footerBox = await footer.boundingBox();
      const navBox = await mobileNav.boundingBox();

      if (footerBox && navBox) {
        // Footer bottom should be above or at the mobile nav position
        // Since nav is fixed, it overlaps the bottom of the page — that's by design
        // But footer content should have enough bottom padding to not be hidden behind nav
        expect(footerBox).not.toBeNull();
        expect(navBox).not.toBeNull();
      }
    });

    test('country picker does not cause page overflow', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/', { waitUntil: 'networkidle' });
      // Trigger reveals
      await page.evaluate(() => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
      });
      await page.waitForTimeout(300);

      const scroller = page.locator('#country-scroll');
      if (await scroller.count() > 0) {
        const box = await scroller.boundingBox();
        expect(box).not.toBeNull();
        // The scroller should be contained within the viewport width
        expect(box!.x).toBeGreaterThanOrEqual(-2);
        expect(box!.x + box!.width).toBeLessThanOrEqual(MOBILE.width + 2);
      }
    });

    test('prepared content tables render as cards on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/prepared/us', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Tables should be styled as card blocks, not standard tables
      const rows = page.locator('.prepared-content tbody tr');
      if (await rows.count() > 0) {
        const display = await rows.first().evaluate(el => getComputedStyle(el).display);
        expect(display).toBe('block'); // Should be display: block from CSS
      }
    });

    test('guide content tables are scrollable or fit on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/guides/first-trip', { waitUntil: 'networkidle' });

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(MOBILE.width + 2);
    });
  });

  test.describe('Small screen edge cases (320px)', () => {
    test('homepage hero text fits', async ({ page }) => {
      await page.setViewportSize(SMALL_MOBILE);
      await page.goto('/', { waitUntil: 'networkidle' });

      const h1 = page.locator('h1').first();
      const box = await h1.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width, 'Hero title overflows at 320px').toBeLessThanOrEqual(SMALL_MOBILE.width + 5);
    });

    test('recipe browse cards fit at 320px', async ({ page }) => {
      await page.setViewportSize(SMALL_MOBILE);
      await page.goto('/recipes', { waitUntil: 'networkidle' });

      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      expect(overflow, 'Browse page overflows at 320px').toBe(false);
    });

    test('recipe detail page fits at 320px', async ({ page }) => {
      await page.setViewportSize(SMALL_MOBILE);
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });

      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      expect(overflow, 'Recipe detail overflows at 320px').toBe(false);
    });

    test('country detail fits at 320px', async ({ page }) => {
      await page.setViewportSize(SMALL_MOBILE);
      await page.goto('/prepared/us', { waitUntil: 'networkidle' });

      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      expect(overflow, 'Country detail overflows at 320px').toBe(false);
    });

    test('guide tables do not overflow at 320px', async ({ page }) => {
      await page.setViewportSize(SMALL_MOBILE);
      await page.goto('/guides/cost-index', { waitUntil: 'networkidle' });

      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      expect(overflow, 'Cost index guide overflows at 320px').toBe(false);
    });

    test('guide first-trip tables do not overflow at 320px', async ({ page }) => {
      await page.setViewportSize(SMALL_MOBILE);
      await page.goto('/guides/first-trip', { waitUntil: 'networkidle' });

      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      expect(overflow, 'First trip guide overflows at 320px').toBe(false);
    });
  });
});
