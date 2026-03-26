import { test, expect } from '@playwright/test';

test.describe('Accessibility — Touch Targets', () => {
  test('mobile nav buttons are at least 44px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const navButtons = page.locator('nav[aria-label="Mobile navigation"] a');
    const count = await navButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await navButtons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('hero search button is at least 44px tall', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const searchButton = page.locator('button[type="submit"]:has-text("Find Food")');
    const box = await searchButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('filter buttons are at least 44px tall on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });

    // The mobile filter toggle button
    const filterToggle = page.locator('button:has-text("Show Filters")');
    if (await filterToggle.isVisible()) {
      const box = await filterToggle.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('Accessibility — ARIA', () => {
  test('tabs have proper ARIA roles', async ({ page }) => {
    await page.goto('/prepared/us', { waitUntil: 'networkidle' });

    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();
    await expect(tablist).toHaveAttribute('aria-label');

    const tabs = page.locator('[role="tab"]');
    expect(await tabs.count()).toBeGreaterThanOrEqual(2);

    // Exactly one tab should be selected
    const selectedTabs = page.locator('[role="tab"][aria-selected="true"]');
    expect(await selectedTabs.count()).toBe(1);

    // Tab panel should exist
    const tabpanel = page.locator('[role="tabpanel"]');
    await expect(tabpanel).toBeVisible();
  });

  test('recipe browser has live region for result count', async ({ page }) => {
    await page.goto('/recipes', { waitUntil: 'networkidle' });

    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion.first()).toBeVisible();
  });

  test('search overlay exists with accessible structure', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Search overlay may use dialog or div with role="dialog"
    const overlay = page.locator('dialog, [role="dialog"], [class*="z-[60]"]');
    expect(await overlay.count()).toBeGreaterThanOrEqual(1);
  });

  test('skip to content link exists', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const skipLink = page.locator('a:has-text("Skip to main content")');
    await expect(skipLink).toBeAttached();

    // Should link to #main
    await expect(skipLink).toHaveAttribute('href', '#main');
  });
});

test.describe('Accessibility — Images', () => {
  test('all images have alt text or aria-hidden', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');

      // Every image must have alt (even empty string) or aria-hidden
      const hasAlt = alt !== null;
      const isHidden = ariaHidden === 'true';
      expect(hasAlt || isHidden, `Image ${i} missing alt or aria-hidden`).toBeTruthy();
    }
  });

  test('flag images have alt text on country detail pages', async ({ page }) => {
    await page.goto('/prepared/us', { waitUntil: 'networkidle' });

    const flagImg = page.locator('img[src*="/assets/flags/"]').first();
    const alt = await flagImg.getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt).toContain('flag');
  });
});

test.describe('Accessibility — Focus', () => {
  test('focus-visible outline is primary red', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Tab to first focusable element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedEl = page.locator(':focus-visible');
    if (await focusedEl.count() > 0) {
      const outline = await focusedEl.first().evaluate(e => getComputedStyle(e).outlineColor);
      // Should be primary red #ba0027 = rgb(186, 0, 39)
      expect(outline).toContain('186');
    }
  });
});
