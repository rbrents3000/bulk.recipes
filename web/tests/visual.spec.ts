import { test, expect } from '@playwright/test';

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'browse', path: '/recipes' },
  { name: 'recipe-detail', path: '/recipes/weeknight-dinners/birria-tacos' },
  { name: 'countries', path: '/prepared' },
  { name: 'country-detail', path: '/prepared/us' },
  { name: 'guides', path: '/guides' },
  { name: 'about', path: '/about' },
];

for (const page of pages) {
  test(`screenshot ${page.name}`, async ({ page: browser }, testInfo) => {
    await browser.goto(page.path, { waitUntil: 'networkidle' });
    // Wait for fonts and images to load
    await browser.waitForTimeout(1000);

    const viewport = testInfo.project.name;
    await browser.screenshot({
      path: `tests/screenshots/${page.name}-${viewport}.png`,
      fullPage: true,
    });

    // Basic checks — no horizontal overflow
    const bodyWidth = await browser.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await browser.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
}
