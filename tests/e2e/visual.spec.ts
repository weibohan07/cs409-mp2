import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// No mocked network: this test requires an actual browser API connection and images.
// The separate rubric test verifies the labeled outage fallback.
test('live museum API and real images render on desktop and mobile', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await mkdir('test-results/visual', { recursive: true });
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto('/cs409-mp2/gallery');
  await expect(page.getByTestId('artwork')).toHaveCount(72);
  await expect(page.getByText('Museum API connected', { exact: true })).toBeVisible({ timeout: 50000 });
  await writeFile('test-results/visual/data-source-status.txt', await page.locator('.source-status').innerText());
  await expect.poll(() => page.locator('.art-card img').first().evaluate(image => (image as HTMLImageElement).naturalWidth), { timeout: 20000 }).toBeGreaterThan(1);
  await page.screenshot({ path: 'test-results/visual/gallery-desktop.png' });
  await page.getByTestId('artwork').first().getByRole('link').click();
  await expect(page.getByTestId('detail')).toBeVisible();
  await expect.poll(() => page.locator('.detail-figure img').evaluate(image => (image as HTMLImageElement).naturalWidth), { timeout: 20000 }).toBeGreaterThan(1);
  await page.screenshot({ path: 'test-results/visual/detail-desktop.png', fullPage: true });
  await page.reload();
  await expect(page.getByTestId('detail')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator('.detail-figure img').evaluate(image => (image as HTMLImageElement).naturalWidth), { timeout: 20000 }).toBeGreaterThan(1);
  await page.screenshot({ path: 'test-results/visual/detail-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto('/cs409-mp2/list');
  await expect(page.getByTestId('artwork').first()).toBeVisible();
  await expect.poll(() => page.locator('.art-row img').first().evaluate(image => (image as HTMLImageElement).naturalWidth), { timeout: 20000 }).toBeGreaterThan(1);
  await page.screenshot({ path: 'test-results/visual/list-mobile.png' });
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.screenshot({ path: 'test-results/visual/list-desktop.png' });
  expect(errors).toEqual([]);
});
