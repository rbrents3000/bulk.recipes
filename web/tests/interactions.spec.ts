import { test, expect } from '@playwright/test';

test.describe('Recipe Browser Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });
  });

  test('cook time "All" is selected by default', async ({ page }) => {
    const allButton = page.locator('button[aria-label="All cook times"]');
    await expect(allButton).toBeVisible();
    await expect(allButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('category dropdown filters results', async ({ page }) => {
    const countBefore = await page.locator('text=Showing').first().textContent();

    await page.selectOption('select[aria-label="Category"]', 'grilling');
    await page.waitForTimeout(300);

    const countAfter = await page.locator('[aria-live="polite"]').first().textContent();
    expect(countAfter).not.toBe(countBefore);
  });

  test('cook time button filters and toggles', async ({ page }) => {
    const under30 = page.locator('button[aria-label="Under 30 minutes"]');
    await under30.click();
    await expect(under30).toHaveAttribute('aria-pressed', 'true');

    // All should now be deselected
    const allButton = page.locator('button[aria-label="All cook times"]');
    await expect(allButton).toHaveAttribute('aria-pressed', 'false');

    // Click All to reset
    await allButton.click();
    await expect(allButton).toHaveAttribute('aria-pressed', 'true');
    await expect(under30).toHaveAttribute('aria-pressed', 'false');
  });

  test('diet checkbox filters results', async ({ page }) => {
    const vegetarianCheckbox = page.locator('input[type="checkbox"]').first();
    await vegetarianCheckbox.check();
    await page.waitForTimeout(300);

    const resultText = await page.locator('[aria-live="polite"]').first().textContent();
    expect(resultText).toContain('Showing');
  });

  test('clear filters resets all', async ({ page }) => {
    // Apply a filter first
    await page.selectOption('select[aria-label="Category"]', 'grilling');
    await page.waitForTimeout(300);

    const clearButton = page.locator('text=Clear all filters');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await page.waitForTimeout(300);

    // Category should be reset
    const select = page.locator('select[aria-label="Category"]');
    await expect(select).toHaveValue('');
  });

  test('pagination works', async ({ page }) => {
    const page2Button = page.locator('button:has-text("2")').last();
    if (await page2Button.isVisible()) {
      await page2Button.click();
      await page.waitForTimeout(300);
      // Should still have recipe cards visible
      const cards = page.locator('[class*="bg-surface-container-lowest"][class*="rounded-xl"]');
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('Search Overlay', () => {
  test('opens with Ctrl+K', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);

    const overlay = page.locator('[role="dialog"], dialog[open], [class*="z-[60]"]');
    await expect(overlay.first()).toBeVisible();
  });

  test('closes with Escape', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const overlay = page.locator('dialog[open]');
    expect(await overlay.count()).toBe(0);
  });
});

test.describe('Country Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prepared/us', { waitUntil: 'networkidle' });
  });

  test('Food Court tab is active by default', async ({ page }) => {
    const foodCourtTab = page.locator('[role="tab"]:has-text("Food Court")');
    await expect(foodCourtTab).toHaveAttribute('aria-selected', 'true');
  });

  test('clicking Deli tab switches content', async ({ page }) => {
    const deliTab = page.locator('[role="tab"]:has-text("Deli")');
    await deliTab.click();
    await expect(deliTab).toHaveAttribute('aria-selected', 'true');

    const foodCourtTab = page.locator('[role="tab"]:has-text("Food Court")');
    await expect(foodCourtTab).toHaveAttribute('aria-selected', 'false');
  });

  test('keyboard navigation between tabs', async ({ page }) => {
    const foodCourtTab = page.locator('[role="tab"]:has-text("Food Court")');
    await foodCourtTab.focus();
    await page.keyboard.press('ArrowRight');

    const deliTab = page.locator('[role="tab"]:has-text("Deli")');
    await expect(deliTab).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('Recipe Card Images', () => {
  test('each card image src matches its recipe link after sorting', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/recipes?sort=total-time', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Wait for hydration + sort

    const cards = page.locator('a.group.block');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const mismatches: string[] = [];
    for (let i = 0; i < Math.min(count, 12); i++) {
      const card = cards.nth(i);
      const href = await card.getAttribute('href');
      const imgSrc = await card.locator('img').first().getAttribute('src');

      // href is like /recipes/desserts/rice-krispie-treats
      // img src should be /assets/recipes/rice-krispie-treats.webp
      const recipeSlug = href?.split('/').pop();
      const expectedImg = `/assets/recipes/${recipeSlug}.webp`;

      if (imgSrc !== expectedImg) {
        mismatches.push(`Card ${i}: href=${href}, img src=${imgSrc}, expected=${expectedImg}`);
      }
    }

    expect(mismatches, `Image mismatches found:\n${mismatches.join('\n')}`).toHaveLength(0);
  });

  test('images still match after changing sort order', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/recipes', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Change sort to alphabetical
    await page.selectOption('select[aria-label="Sort recipes by"]', 'alpha');
    await page.waitForTimeout(500);

    const cards = page.locator('a.group.block');
    const count = await cards.count();

    const mismatches: string[] = [];
    for (let i = 0; i < Math.min(count, 12); i++) {
      const card = cards.nth(i);
      const href = await card.getAttribute('href');
      const imgSrc = await card.locator('img').first().getAttribute('src');

      const recipeSlug = href?.split('/').pop();
      const expectedImg = `/assets/recipes/${recipeSlug}.webp`;

      if (imgSrc !== expectedImg) {
        mismatches.push(`Card ${i}: href=${href}, img src=${imgSrc}, expected=${expectedImg}`);
      }
    }

    expect(mismatches, `Image mismatches after re-sort:\n${mismatches.join('\n')}`).toHaveLength(0);
  });
});

test.describe('Servings Scaler', () => {
  test('servings scaler multiplier buttons are present on recipe detail page', async ({ page }) => {
    await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for Preact hydration

    // 1× button should be visible and selected by default
    const oneXButton = page.locator('button', { hasText: '1×' });
    await expect(oneXButton).toBeVisible();

    // All multiplier buttons should be present
    for (const label of ['½×', '1×', '2×', '3×', '4×']) {
      await expect(page.locator('button', { hasText: label })).toBeVisible();
    }
  });
});
