import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

async function expectPaintedImage(image: Locator) {
  // Dimensions can be available before the browser has downloaded/decoded the pixels.
  await expect.poll(() => image.evaluate(element => {
    const img = element as HTMLImageElement;
    return img.complete && img.naturalWidth > 1;
  }), { timeout: 25000 }).toBe(true);
  await image.evaluate(element => (element as HTMLImageElement).decode());
  await expect(image).toHaveCSS('opacity', '1');
}
async function expectViewerImage(image: Locator) {
  await expectPaintedImage(image);
  await expect(image).toBeInViewport({ ratio: 0.99 });
  const box = await image.boundingBox();
  expect(box?.height).toBeGreaterThan(100);
  expect(box?.width).toBeGreaterThan(100);
}

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
  const selected = page.getByTestId('artwork').nth(12);
  await selected.scrollIntoViewIfNeeded();
  const resultsY = await page.evaluate(() => window.scrollY);
  await selected.getByRole('link').click();
  await expect(page.getByTestId('detail')).toBeVisible();
  await expectPaintedImage(page.locator('.detail-figure img'));
  await expect(page.getByRole('navigation', { name: 'Quick artwork navigation' })).toBeInViewport();
  await page.screenshot({ path: 'test-results/visual/detail-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Open full-size image' }).click();
  await expectViewerImage(page.getByRole('dialog').locator('img'));
  await page.screenshot({ path: 'test-results/visual/viewer-desktop.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: 'Back to results' }).click();
  await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - resultsY)).toBeLessThan(4);
  await selected.getByRole('link').click();
  await page.reload();
  await expect(page.getByTestId('detail')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expectPaintedImage(page.locator('.detail-figure img'));
  await page.screenshot({ path: 'test-results/visual/detail-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Open full-size image' }).click();
  await expectViewerImage(page.getByRole('dialog').locator('img'));
  await page.screenshot({ path: 'test-results/visual/viewer-mobile.png' });
  await page.getByRole('button', { name: 'Close full-size image' }).click();
  await page.goto('/cs409-mp2/list');
  await expect(page.getByTestId('artwork').first()).toBeVisible();
  await expect.poll(() => page.locator('.art-row img').first().evaluate(image => (image as HTMLImageElement).naturalWidth), { timeout: 20000 }).toBeGreaterThan(1);
  await page.screenshot({ path: 'test-results/visual/list-mobile.png' });
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.screenshot({ path: 'test-results/visual/list-desktop.png' });
  expect(errors).toEqual([]);
});
