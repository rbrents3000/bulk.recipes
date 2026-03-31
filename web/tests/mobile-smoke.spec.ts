import { test, expect } from '@playwright/test';

const MOBILE = { width: 375, height: 812 };

test.describe('Mobile Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
  });

  test.describe('Navigation', () => {
    test('mobile nav has all 5 items (4 links + search)', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      const nav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(nav).toBeVisible();
      const items = nav.locator('a, button');
      expect(await items.count()).toBe(5);
    });

    test('mobile nav highlights active page', async ({ page }) => {
      await page.goto('/recipes', { waitUntil: 'networkidle' });
      const recipesLink = page.locator('nav[aria-label="Mobile navigation"] a[data-href="/recipes"]');
      await expect(recipesLink).toHaveClass(/text-primary/);
    });

    test('tapping mobile nav link navigates', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      // Use evaluate to click directly — Astro dev toolbar can intercept pointer events
      await page.evaluate(() => {
        const link = document.querySelector('nav[aria-label="Mobile navigation"] a[data-href="/guides"]') as HTMLAnchorElement;
        if (link) link.click();
      });
      await page.waitForURL('**/guides', { timeout: 10000 });
      expect(page.url()).toContain('/guides');
    });

    test('desktop nav links hidden on mobile', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      const desktopNav = page.locator('nav[aria-label="Main navigation"] .hidden.md\\:flex');
      if (await desktopNav.count() > 0) {
        await expect(desktopNav.first()).toBeHidden();
      }
    });
  });

  test.describe('Homepage', () => {
    test('hero text is visible and readable', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
      await expect(h1).toContainText('crew');
    });

    test('hero search form works on mobile', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      const input = page.locator('#hero-search');
      await expect(input).toBeVisible();
      await input.fill('chicken');
      await page.locator('button[type="submit"]:has-text("Find Food")').click();
      await page.waitForURL('**/recipes?q=chicken');
      expect(page.url()).toContain('q=chicken');
    });

    test('category bento grid renders 2 columns', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      const bentoGrid = page.locator('.grid.grid-cols-2').first();
      if (await bentoGrid.count() > 0) {
        const cols = await bentoGrid.evaluate(el =>
          getComputedStyle(el).gridTemplateColumns.split(' ').length
        );
        expect(cols).toBe(2);
      }
    });

    test('country picker scrolls horizontally', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      const scroller = page.locator('#country-scroll');
      await expect(scroller).toBeVisible();
      const scrollWidth = await scroller.evaluate(el => el.scrollWidth);
      const clientWidth = await scroller.evaluate(el => el.clientWidth);
      expect(scrollWidth).toBeGreaterThan(clientWidth);
    });
  });

  test.describe('Recipe Browser', () => {
    test('filter toggle button visible on mobile', async ({ page }) => {
      await page.goto('/recipes', { waitUntil: 'networkidle' });
      const toggle = page.locator('button:has-text("Show Filters")');
      await expect(toggle).toBeVisible();
    });

    test('filter toggle opens and closes sidebar', async ({ page }) => {
      await page.goto('/recipes', { waitUntil: 'networkidle' });
      const toggle = page.locator('button:has-text("Show Filters")');
      await toggle.click();
      await page.waitForTimeout(300);

      const sidebar = page.locator('#filter-sidebar');
      await expect(sidebar).toBeVisible();

      const hideToggle = page.locator('button:has-text("Hide Filters")');
      await hideToggle.click();
      await page.waitForTimeout(300);
      await expect(sidebar).toBeHidden();
    });

    test('recipe cards render in single column on mobile', async ({ page }) => {
      await page.goto('/recipes', { waitUntil: 'networkidle' });
      const cards = page.locator('a.group.block');
      expect(await cards.count()).toBeGreaterThan(0);

      // First two cards should be stacked vertically (not side by side)
      if (await cards.count() >= 2) {
        const box1 = await cards.nth(0).boundingBox();
        const box2 = await cards.nth(1).boundingBox();
        if (box1 && box2) {
          expect(box2.y).toBeGreaterThan(box1.y + box1.height - 10);
        }
      }
    });

    test('inline search works', async ({ page }) => {
      await page.goto('/recipes', { waitUntil: 'networkidle' });
      // Open filters to access search
      await page.locator('button:has-text("Show Filters")').click();
      await page.waitForTimeout(300);

      const searchInput = page.locator('input[aria-label="Search recipes"]');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('pizza');
      await page.waitForTimeout(500);

      const resultText = await page.locator('[aria-live="polite"]').first().textContent();
      expect(resultText).toContain('Showing');
    });
  });

  test.describe('Recipe Detail', () => {
    test('recipe title and description visible', async ({ page }) => {
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
      await expect(h1).toContainText('Birria');
    });

    test('hero image loads', async ({ page }) => {
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      const heroImg = page.locator('article img').first();
      await expect(heroImg).toBeVisible();
    });

    test('metadata bar does not overflow', async ({ page }) => {
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      const metaBar = page.locator('.grid.grid-cols-1').first();
      if (await metaBar.count() > 0) {
        const box = await metaBar.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeLessThanOrEqual(MOBILE.width + 2);
      }
    });

    test('nutrition bar wraps on narrow screen', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      // Should not overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(322);
    });

    test('costco ingredient checklist renders', async ({ page }) => {
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const checklist = page.locator('text=Costco List');
      await expect(checklist).toBeVisible();
    });

    test('ingredient checkbox toggles', async ({ page }) => {
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      const checkbox = page.locator('input[type="checkbox"]').first();
      await expect(checkbox).toBeVisible();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    });

    test('share bar visible', async ({ page }) => {
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const shareLabel = page.locator('text=Share').first();
      await expect(shareLabel).toBeVisible();
    });

    test('breadcrumbs visible and navigable', async ({ page }) => {
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      const homeLink = breadcrumb.locator('a:has-text("Home")');
      await expect(homeLink).toBeVisible();
    });

    test('instruction steps render', async ({ page }) => {
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      const steps = page.locator('ol li');
      expect(await steps.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Country Pages', () => {
    test('country grid renders on mobile', async ({ page }) => {
      await page.goto('/prepared', { waitUntil: 'networkidle' });
      const cards = page.locator('a.group.block');
      expect(await cards.count()).toBeGreaterThan(0);
    });

    test('country detail page loads with tabs', async ({ page }) => {
      await page.goto('/prepared/japan', { waitUntil: 'networkidle' });
      const flag = page.locator('img[src*="flags/jp"]');
      await expect(flag).toBeVisible();

      const tabs = page.locator('[role="tab"]');
      expect(await tabs.count()).toBeGreaterThanOrEqual(2);
    });

    test('tab switching works on mobile', async ({ page }) => {
      await page.goto('/prepared/us', { waitUntil: 'networkidle' });
      const deliTab = page.locator('[role="tab"]:has-text("Deli")');
      await deliTab.click();
      await expect(deliTab).toHaveAttribute('aria-selected', 'true');

      const panel = page.locator('[role="tabpanel"]');
      await expect(panel).toBeVisible();
      const content = await panel.textContent();
      expect(content).toContain('Rotisserie Chicken');
    });
  });

  test.describe('Guides', () => {
    test('guides index loads with cards', async ({ page }) => {
      await page.goto('/guides', { waitUntil: 'networkidle' });
      const h1 = page.locator('main h1').first();
      await expect(h1).toContainText('Playbook');

      const cards = page.locator('a.group.block');
      expect(await cards.count()).toBeGreaterThan(0);
    });

    test('guide detail page renders markdown content', async ({ page }) => {
      await page.goto('/guides/first-trip', { waitUntil: 'networkidle' });
      const article = page.locator('article');
      await expect(article).toBeVisible();

      const h1 = article.locator('h1');
      await expect(h1).toContainText('First Costco Trip');
    });
  });

  test.describe('Favorites', () => {
    test('favorites page shows empty state', async ({ page }) => {
      await page.goto('/recipes/favorites', { waitUntil: 'networkidle' });
      const emptyState = page.locator('#favorites-empty');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('No favorites yet');
    });

    test('favoriting a recipe shows it on favorites page', async ({ page }) => {
      // First, favorite a recipe
      await page.goto('/recipes/weeknight-dinners/birria-tacos', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const heartBtn = page.locator('button[aria-label="Add to favorites"]').first();
      if (await heartBtn.count() > 0) {
        await heartBtn.click();
        await page.waitForTimeout(300);
      }

      // Now check favorites page
      await page.goto('/recipes/favorites', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const cards = page.locator('[data-favorite-card]:not(.hidden)');
      expect(await cards.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Search', () => {
    test('search opens from mobile nav', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      const searchBtn = page.locator('nav[aria-label="Mobile navigation"] button[aria-label="Search"]');
      await searchBtn.click();
      await page.waitForTimeout(500);

      const overlay = page.locator('#search-overlay');
      await expect(overlay).not.toHaveClass(/hidden/);
    });

    test('search closes on backdrop click', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.locator('nav[aria-label="Mobile navigation"] button[aria-label="Search"]').click();
      await page.waitForTimeout(500);

      // Click the backdrop (outside the search box)
      await page.locator('#search-overlay').click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);

      const overlay = page.locator('#search-overlay');
      await expect(overlay).toHaveClass(/hidden/);
    });
  });

  test.describe('404', () => {
    test('404 page renders with navigation options', async ({ page }) => {
      await page.goto('/nonexistent-page-12345', { waitUntil: 'networkidle' });
      const h1 = page.locator('main h1').first();
      await expect(h1).toContainText('404');

      const homeLink = page.locator('a:has-text("Go Home")');
      await expect(homeLink).toBeVisible();
    });
  });
});
