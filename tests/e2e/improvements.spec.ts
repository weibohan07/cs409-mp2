import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { records } from './fixtures';

const root = '/cs409-mp2/';
const sample = Array.from({ length: 72 }, (_, index) => {
  const item = records[index % records.length];
  return { ...item, id: index + 1000, title: `Work ${String(index).padStart(2, '0')}`, images: {
    web: { url: `https://openaccess-cdn.clevelandart.org/test/${index}_web.jpg` },
    print: { url: `https://openaccess-cdn.clevelandart.org/test/${index}_print.jpg` },
  } };
});
async function museum(page: Page) {
  await page.route('**/data/collection.json', route => route.fulfill({ json: { data: sample, collectedAt: '2026-10-06T00:00:00Z' } }));
  await page.route('https://openaccess-api.clevelandart.org/api/artworks**', route => {
    const url = new URL(route.request().url());
    const id = Number(url.pathname.split('/').at(-1));
    const type = url.searchParams.get('type');
    return route.fulfill({ json: { data: id ? sample.find(work => work.id === id) : sample.filter(work => !type || work.type === type) } });
  });
  await page.route('https://openaccess-cdn.clevelandart.org/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1kAAAAASUVORK5CYII=', 'base64') }));
}
const scrollY = (page: Page) => page.evaluate(() => window.scrollY);
async function expectScroll(page: Page, y: number) {
  await expect.poll(async () => Math.abs(await scrollY(page) - y)).toBeLessThan(4);
}
test.beforeEach(async ({ page }) => { await museum(page); });

for (const view of ['list', 'gallery']) test(`${view}: Back to results restores position even after next and detail reload`, async ({ page }) => {
  await page.goto(`${root}${view}?q=Work&sort=year&order=desc`);
  await expect(page.getByTestId('artwork')).toHaveCount(72);
  await expect(page.getByText('Museum API connected', { exact: true })).toBeVisible();
  const artwork = page.getByTestId('artwork').nth(30).getByRole('link');
  await artwork.scrollIntoViewIfNeeded();
  const before = await scrollY(page);
  expect(before).toBeGreaterThan(1000);
  await artwork.click();
  await expect(page.getByTestId('detail')).toBeVisible();
  await expectScroll(page, 0);
  await page.getByRole('link', { name: 'Next artwork (top)', exact: true }).click();
  await page.reload();
  await expect(page.getByTestId('detail')).toBeVisible();
  await page.getByRole('link', { name: 'Back to results' }).click();
  await expect(page.getByTestId('artwork')).toHaveCount(72);
  await expectScroll(page, before);
  await expect(page.getByLabel('Search this collection')).toHaveValue('Work');
  await expect(page.getByLabel('Order', { exact: true })).toHaveValue('desc');
});

test('browser back restores a result position and forward opens the detail at the top', async ({ page }) => {
  await page.goto(`${root}list`);
  await expect(page.getByTestId('artwork')).toHaveCount(72);
  const item = page.getByTestId('artwork').nth(35).getByRole('link');
  await item.scrollIntoViewIfNeeded();
  const before = await scrollY(page);
  await item.click();
  await expect(page.getByTestId('detail')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('artwork')).toHaveCount(72);
  await expectScroll(page, before);
  await page.goForward();
  await expect(page.getByTestId('detail')).toBeVisible();
  await expectScroll(page, 0);
});

test('result reload waits for the collection before restoring and separates filter positions', async ({ page }) => {
  await page.goto(`${root}gallery?type=Painting`);
  await expect(page.getByTestId('artwork')).toHaveCount(24);
  await page.getByTestId('artwork').nth(18).scrollIntoViewIfNeeded();
  const paintingY = await scrollY(page);
  await page.reload();
  await expect(page.getByTestId('artwork')).toHaveCount(24);
  await expectScroll(page, paintingY);
  await page.getByTestId('artwork').nth(18).getByRole('link').click();
  await expect(page.getByTestId('detail')).toBeVisible();
  await page.goto(`${root}gallery?type=Sculpture`);
  await expect(page.getByTestId('artwork')).toHaveCount(24);
  await expectScroll(page, 0);
});

test('larger image loads only on demand, opens as a modal and Escape restores focus', async ({ page }) => {
  const largeRequests: string[] = [];
  page.on('request', request => { if (request.url().endsWith('_print.jpg')) largeRequests.push(request.url()); });
  await page.goto(`${root}artworks/1000`);
  await expect(page.getByTestId('detail')).toBeVisible();
  expect(largeRequests).toEqual([]);
  const opener = page.getByRole('button', { name: 'Open full-size image' });
  await opener.click();
  const viewer = page.getByRole('dialog', { name: 'Work 00', exact: true });
  await expect(viewer).toBeVisible();
  await expect.poll(() => largeRequests.length).toBe(1);
  await expect(viewer.locator('img')).toHaveAttribute('src', /_print\.jpg$/);
  expect(await viewer.evaluate(element => element.matches(':modal'))).toBe(true);
  await expect(page.getByRole('button', { name: 'Close full-size image' })).toBeFocused();
  await expect(page.locator('[style]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/art-viewer-open/);
});

test('close button and backdrop close the viewer without losing detail scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${root}artworks/1000`);
  const opener = page.getByRole('button', { name: 'Open full-size image' });
  await opener.scrollIntoViewIfNeeded();
  const before = await scrollY(page);
  await opener.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close full-size image' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expectScroll(page, before);
  await opener.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expectScroll(page, before);
});

test('viewer falls back to the normal image when high-resolution media fails', async ({ page }) => {
  await page.route('**/*_print.jpg', route => route.abort('failed'));
  await page.goto(`${root}artworks/1000`);
  await page.getByRole('button', { name: 'Open full-size image' }).click();
  const image = page.getByRole('dialog').locator('img');
  await expect(image).toHaveAttribute('src', /_web\.jpg$/);
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('status').filter({ hasText: 'Loading larger image' })).toHaveCount(0);
});

for (const width of [1280, 390]) test(`top navigation is visible and follows the same result cycle at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(`${root}artworks/1000?type=Painting&sort=title`);
  const quick = page.getByRole('navigation', { name: 'Quick artwork navigation', exact: true });
  const bottom = page.getByRole('navigation', { name: 'Artwork navigation', exact: true });
  await expect(quick).toBeInViewport();
  await expect(quick.getByRole('link', { name: 'Next artwork (top)', exact: true })).toHaveAttribute('href', (await bottom.getByRole('link', { name: 'Next artwork', exact: true }).getAttribute('href'))!);
  await quick.getByRole('link', { name: 'Previous artwork (top)', exact: true }).click();
  await expect(page.getByTestId('detail')).toHaveAttribute('data-art-id', '1067');
  await expect(quick).toContainText('24 / 24');
  await quick.getByRole('link', { name: 'Next artwork (top)', exact: true }).click();
  await expect(page.getByTestId('detail')).toHaveAttribute('data-art-id', '1000');
  await page.locator('.art-facts').scrollIntoViewIfNeeded();
  await expect(quick).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto(`${root}artworks/1000?q=Work+00`);
  await expect(quick.getByRole('button', { name: 'Next artwork (top)' })).toBeDisabled();
  await expect(quick.getByRole('button', { name: 'Previous artwork (top)' })).toBeDisabled();
});

test('leaving an open viewer via browser history removes the scroll lock', async ({ page }) => {
  await page.goto(`${root}gallery`);
  await page.getByTestId('artwork').first().getByRole('link').click();
  await page.getByRole('button', { name: 'Open full-size image' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('artwork')).toHaveCount(72);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/art-viewer-open/);
});
