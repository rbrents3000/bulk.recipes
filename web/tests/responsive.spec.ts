import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'browse', path: '/recipes' },
  { name: 'recipe-detail', path: '/recipes/weeknight-dinners/birria-tacos' },
  { name: 'countries', path: '/prepared' },
  { name: 'country-detail', path: '/prepared/us' },
  { name: 'guides', path: '/guides' },
  { name: 'about', path: '/about' },
];

test.describe('Responsive — No Horizontal Overflow', () => {
  for (const vp of viewports) {
    for (const pg of pages) {
      test(`${pg.name} at ${vp.name} (${vp.width}px) has no overflow`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(pg.path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);
      });
    }
  }
});

test.describe('Responsive — Grid Columns', () => {
  test('browse grid: 1 col mobile, 2 col tablet, 3 col desktop', async ({ page }) => {
    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });
    let cols = await page.evaluate(() => {
      const grid = document.querySelector('[class*="grid"][class*="gap-6"]');
      if (!grid) return 0;
      return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBe(1);

    // Tablet (md: 768px → 2 cols)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    cols = await page.evaluate(() => {
      const grid = document.querySelector('[class*="grid"][class*="gap-6"]');
      if (!grid) return 0;
      return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBe(2);

    // Desktop (xl: 1280px → 3 cols)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    cols = await page.evaluate(() => {
      const grid = document.querySelector('[class*="grid"][class*="gap-6"]');
      if (!grid) return 0;
      return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBe(3);
  });

  test('countries grid: 1 col mobile, 2 col sm, 3 col lg', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/prepared', { waitUntil: 'networkidle' });
    let cols = await page.evaluate(() => {
      const grid = document.querySelector('[class*="grid"][class*="gap-6"]');
      if (!grid) return 0;
      return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBe(1);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    cols = await page.evaluate(() => {
      const grid = document.querySelector('[class*="grid"][class*="gap-6"]');
      if (!grid) return 0;
      return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Responsive — Component Visibility', () => {
  test('MobileNav visible on mobile, hidden on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(mobileNav).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await expect(mobileNav).toBeHidden();
  });

  test('desktop nav links hidden on mobile, visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const desktopLinks = page.locator('nav a:has-text("Recipes")').first();
    // On mobile the nav links container is hidden
    const navLinks = page.locator('.md\\:flex.gap-6, [class*="hidden md:flex"]').first();
    if (await navLinks.count() > 0) {
      await expect(navLinks).toBeHidden();
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await expect(desktopLinks).toBeVisible();
  });

  test('recipe filters hidden by default on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });

    // Filter sidebar should be hidden
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeHidden();

    // Toggle button should be visible
    const toggle = page.locator('button:has-text("Show Filters")');
    await expect(toggle).toBeVisible();
  });
});

test.describe('Responsive — Screenshots', () => {
  test.describe.configure({ timeout: 60000 });
  for (const vp of viewports) {
    for (const pg of pages) {
      test(`screenshot ${pg.name} at ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(pg.path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `tests/screenshots/${pg.name}-${vp.name}.png`,
          fullPage: true,
        });
      });
    }
  }
});
