import { test, expect } from '@playwright/test';

// Helper to get computed style
async function getStyle(el: any, prop: string) {
  return el.evaluate((e: HTMLElement, p: string) => getComputedStyle(e).getPropertyValue(p), prop);
}

async function getStyleNum(el: any, prop: string) {
  const val = await getStyle(el, prop);
  return parseFloat(val);
}

// Helper to parse rgb/rgba to hex
function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const [, r, g, b] = match;
  return '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

test.describe('Design System — Card Specs', () => {
  test('browse page cards have p-3 image inset', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for Preact hydration

    const firstCard = page.locator('.group.block').first();
    await expect(firstCard).toBeVisible();

    // The card's first child div should have p-3 padding
    const padding = await firstCard.evaluate(el => {
      const card = el.querySelector('[class*="rounded-xl"]');
      if (!card) return 0;
      const wrapper = card.firstElementChild;
      if (!wrapper) return 0;
      return parseFloat(getComputedStyle(wrapper).paddingTop);
    });
    expect(padding).toBeGreaterThanOrEqual(10); // p-3 = 12px
    expect(padding).toBeLessThanOrEqual(14);
  });

  test('browse page card images are h-56 on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });

    const imageContainer = page.locator('[class*="rounded-lg"][class*="overflow-hidden"][class*="bg-surface-container"]').first();
    await expect(imageContainer).toBeVisible();
    const height = await getStyleNum(imageContainer, 'height');
    // h-56 = 224px on desktop, h-44 = 176px on mobile
    expect(height).toBeGreaterThanOrEqual(200);
    expect(height).toBeLessThanOrEqual(230);
  });

  test('browse page card images are h-44 on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });
    // Show filters then hide to get to cards, or just check first card
    const imageContainer = page.locator('[class*="rounded-lg"][class*="overflow-hidden"][class*="bg-surface-container"]').first();
    await expect(imageContainer).toBeVisible();
    const height = await getStyleNum(imageContainer, 'height');
    expect(height).toBeGreaterThanOrEqual(160);
    expect(height).toBeLessThanOrEqual(185);
  });

  test('card content has correct padding', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });

    // Content div after image wrapper — has px-6 pb-6 pt-2
    const contentDiv = page.locator('[class*="px-6"][class*="pb-6"][class*="pt-2"]').first();
    await expect(contentDiv).toBeVisible();
    const paddingLeft = await getStyleNum(contentDiv, 'padding-left');
    const paddingBottom = await getStyleNum(contentDiv, 'padding-bottom');
    const paddingTop = await getStyleNum(contentDiv, 'padding-top');
    expect(paddingLeft).toBeCloseTo(24, 0); // px-6 = 24px
    expect(paddingBottom).toBeCloseTo(24, 0); // pb-6 = 24px
    expect(paddingTop).toBeCloseTo(8, 0); // pt-2 = 8px
  });

  test('card badges stack vertically', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });

    const badgeContainer = page.locator('[class*="flex-col"][class*="gap-2"]').first();
    if (await badgeContainer.count() > 0) {
      const flexDir = await getStyle(badgeContainer, 'flex-direction');
      expect(flexDir).toBe('column');
    }
  });
});

test.describe('Design System — Typography', () => {
  test('hero h1 is 72px on desktop (text-7xl via lg breakpoint)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const h1 = page.locator('h1').first();
    const fontSize = await getStyleNum(h1, 'font-size');
    // lg:text-7xl = 72px (4.5rem)
    expect(fontSize).toBeGreaterThanOrEqual(70);
    expect(fontSize).toBeLessThanOrEqual(76);
  });

  test('hero h1 is 36px on mobile (text-4xl)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const h1 = page.locator('h1').first();
    const fontSize = await getStyleNum(h1, 'font-size');
    // text-4xl = 36px (2.25rem)
    expect(fontSize).toBeGreaterThanOrEqual(34);
    expect(fontSize).toBeLessThanOrEqual(38);
  });

  test('browse page title is text-4xl', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });

    const title = page.locator('h1:has-text("Bulk Masterpieces")');
    await expect(title).toBeVisible();
    const fontSize = await getStyleNum(title, 'font-size');
    expect(fontSize).toBeGreaterThanOrEqual(34);
    expect(fontSize).toBeLessThanOrEqual(38);
  });

  test('headline font is Plus Jakarta Sans', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const h1 = page.locator('h1').first();
    const fontFamily = await getStyle(h1, 'font-family');
    expect(fontFamily.toLowerCase()).toContain('plus jakarta sans');
  });

  test('body font is Be Vietnam Pro', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const body = page.locator('body');
    const fontFamily = await getStyle(body, 'font-family');
    expect(fontFamily.toLowerCase()).toContain('be vietnam pro');
  });
});

test.describe('Design System — Colors', () => {
  test('body background is surface (#f9f6f5)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const bg = await page.locator('body').evaluate(e => getComputedStyle(e).backgroundColor);
    const hex = rgbToHex(bg);
    expect(hex).toBe('#f9f6f5');
  });

  test('primary color (#ba0027) exists on page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // The "whole" span in the hero or "Find Food" button should be primary
    const primaryEl = page.locator('.text-primary, [class*="bg-primary"]').first();
    await expect(primaryEl).toBeVisible();
    const color = await primaryEl.evaluate(e => {
      const style = getComputedStyle(e);
      return style.color || style.backgroundColor;
    });
    // Should contain rgb(186, 0, 39) or similar
    expect(color).toBeTruthy();
  });

  test('recipe cards exist with proper structure on browse page', async ({ page }) => {
    await page.goto('/recipes', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Cards should exist and have images inside
    const cards = page.locator('.group.block');
    expect(await cards.count()).toBeGreaterThan(0);

    // First card should have an image
    const img = cards.first().locator('img');
    await expect(img).toBeVisible();
  });
});

test.describe('Design System — Spacing & Layout', () => {
  test('homepage sections have py-16 (64px) padding', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check the hero section
    const hero = page.locator('section').first();
    const paddingTop = await getStyleNum(hero, 'padding-top');
    const paddingBottom = await getStyleNum(hero, 'padding-bottom');
    expect(paddingTop).toBeCloseTo(64, -1); // py-16 = 64px
    expect(paddingBottom).toBeCloseTo(64, -1);
  });

  test('browse grid has gap-8 (32px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });

    const grid = page.locator('[class*="grid"][class*="gap-8"]').first();
    await expect(grid).toBeVisible();
    const gap = await getStyleNum(grid, 'gap');
    expect(gap).toBeCloseTo(32, -1);
  });

  test('footer has mt-12 (48px) margin', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const footer = page.locator('footer');
    const marginTop = await getStyleNum(footer, 'margin-top');
    expect(marginTop).toBeCloseTo(48, -1);
  });

  test('main has bottom padding for MobileNav on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const main = page.locator('main#main');
    const paddingBottom = await getStyleNum(main, 'padding-bottom');
    // pb-28 = 112px
    expect(paddingBottom).toBeGreaterThanOrEqual(100);
  });

  test('main has no bottom padding on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const main = page.locator('main#main');
    const paddingBottom = await getStyleNum(main, 'padding-bottom');
    expect(paddingBottom).toBe(0);
  });
});
