import { test } from '@playwright/test';

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'browse', path: '/recipes' },
  { name: 'recipe-detail', path: '/recipes/weeknight-dinners/birria-tacos' },
  { name: 'countries', path: '/prepared' },
  { name: 'country-detail', path: '/prepared/us' },
  { name: 'guides', path: '/guides' },
  { name: 'favorites', path: '/recipes/favorites' },
];

test.describe('Mobile scroll screenshots', () => {
  for (const pg of pages) {
    test(`${pg.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(pg.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      // Scroll through to trigger IntersectionObserver reveals
      const height = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < height; y += 400) {
        await page.evaluate(yy => window.scrollTo(0, yy), y);
        await page.waitForTimeout(150);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await page.screenshot({ path: `tests/screenshots/scroll-${pg.name}.png`, fullPage: true });
    });
  }
});
