import { test, expect } from '@playwright/test';
import { mockMuseum } from './fixtures';
const root = '/cs409-mp2/';
test.beforeEach(async ({ page }) => { await mockMuseum(page); });
test('list displays API records and a connected status', async ({ page }) => { await page.goto(root); await expect(page.getByTestId('artwork')).toHaveCount(6); await expect(page.getByTestId('art-title').first()).toHaveText('Apple Blossom'); await expect(page.getByText('Museum API connected', { exact: true })).toBeVisible(); });
test('search filters as typed, handles accents/case, zero results and clearing', async ({ page }) => {
  await page.goto(`${root}list`); const input = page.getByLabel('Search this collection');
  await input.fill('  APPLE '); await expect(page.getByTestId('artwork')).toHaveCount(2);
  await input.fill('emile'); await expect(page.getByTestId('art-title')).toHaveText('Été');
  await input.fill('nothing-matches-here'); await expect(page.getByRole('heading', { name: 'Nothing here, just yet.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search and filters' }).click(); await expect(page.getByTestId('artwork')).toHaveCount(6);
});
for (const [field, order, titles] of [
  ['title', 'asc', ['Apple Blossom', 'Apple Tree', 'Bowl', 'Clouds', 'Été', 'Zebra Study']],
  ['title', 'desc', ['Zebra Study', 'Été', 'Clouds', 'Bowl', 'Apple Tree', 'Apple Blossom']],
  ['year', 'asc', ['Été', 'Apple Blossom', 'Apple Tree', 'Zebra Study', 'Clouds', 'Bowl']],
  ['year', 'desc', ['Clouds', 'Zebra Study', 'Apple Blossom', 'Apple Tree', 'Été', 'Bowl']],
] as const) test(`${field} ${order} sorting`, async ({ page }) => { await page.goto(`${root}list`); await expect(page.getByTestId('artwork')).toHaveCount(6); await page.getByLabel('Sort by', { exact: true }).selectOption(field); await page.getByLabel('Order', { exact: true }).selectOption(order); await expect(page.getByTestId('art-title')).toHaveText([...titles]); });
test('gallery has images and multi-select filtering works with search', async ({ page }) => {
  await page.goto(`${root}gallery`); await expect(page.locator('.art-card img')).toHaveCount(6);
  await page.getByRole('button', { name: /^Painting/ }).click(); await expect(page.getByTestId('artwork')).toHaveCount(2);
  await page.getByRole('button', { name: /^Print/ }).click(); await expect(page.getByTestId('artwork')).toHaveCount(4);
  await page.getByLabel('Search this collection').fill('Alice'); await expect(page.getByTestId('art-title')).toHaveText(['Apple Tree', 'Clouds']);
});
for (const view of ['list', 'gallery']) test(`${view} opens the correct detail`, async ({ page }) => {
  await page.goto(`${root}${view}`); await page.getByRole('link', { name: 'View Apple Tree', exact: true }).click();
  await expect(page).toHaveURL(/artworks\/10/); await expect(page.getByRole('heading', { name: 'Apple Tree', exact: true })).toBeVisible();
  await expect(page.locator('.art-facts')).toContainText('Test medium'); await expect(page.locator('.art-facts')).toContainText('20 × 30 cm'); await expect(page.locator('.detail-figure img')).toBeVisible();
});
test('previous and next loop through filtered sorted results and preserve return state', async ({ page }) => {
  await page.goto(`${root}list?q=apple&sort=year&order=desc`); await page.getByRole('link', { name: 'View Apple Blossom', exact: true }).click();
  await page.getByRole('link', { name: 'Next artwork', exact: true }).click(); await expect(page.getByTestId('detail')).toHaveAttribute('data-art-id', '10');
  await page.getByRole('link', { name: 'Next artwork', exact: true }).click(); await expect(page.getByTestId('detail')).toHaveAttribute('data-art-id', '8');
  await page.getByRole('link', { name: 'Previous artwork', exact: true }).click(); await expect(page.getByTestId('detail')).toHaveAttribute('data-art-id', '10');
  await page.getByRole('link', { name: 'Back to results' }).click(); await expect(page.getByLabel('Search this collection')).toHaveValue('apple'); await expect(page.getByLabel('Sort by', { exact: true })).toHaveValue('year'); await expect(page.getByLabel('Order', { exact: true })).toHaveValue('desc');
});
test('direct detail route and refresh work', async ({ page }) => {
  await page.goto(`${root}artworks/10?from=gallery&type=Painting`); await expect(page.getByTestId('detail')).toHaveAttribute('data-art-id', '10'); await page.reload(); await expect(page.getByTestId('detail')).toHaveAttribute('data-art-id', '10'); await page.getByRole('link', { name: 'Back to results' }).click(); await expect(page).toHaveURL(/gallery/); await expect(page.getByTestId('artwork')).toHaveCount(2);
});
test('singleton, invalid and nonexistent IDs are safe', async ({ page }) => {
  await page.goto(`${root}artworks/10?q=Apple+Tree`); await expect(page.getByRole('button', { name: 'Next', exact: false })).toBeDisabled(); await page.goto(`${root}artworks/not-a-number`); await expect(page.getByRole('heading', { name: 'Artwork unavailable' })).toBeVisible(); await page.goto(`${root}artworks/999999`); await expect(page.getByText('This artwork could not be found.')).toBeVisible();
});
test('switching views retains query and sort', async ({ page }) => {
  await page.goto(`${root}list?q=apple&sort=year&order=desc`); await page.getByRole('navigation', { name: 'Collection view' }).getByRole('link', { name: 'Gallery', exact: true }).click(); await expect(page.getByLabel('Search this collection')).toHaveValue('apple'); await expect(page.getByLabel('Order', { exact: true })).toHaveValue('desc'); await expect(page.locator('.art-card')).toHaveCount(2);
});
test('API outages use an explicitly labeled real-data snapshot', async ({ page }) => {
  await mockMuseum(page, true); await page.goto(root); await expect(page.getByTestId('artwork')).toHaveCount(6); await expect(page.getByText('Saved museum collection', { exact: true })).toBeVisible(); await expect(page.locator('.notice')).toContainText('bundled real-API snapshot');
});
test('failed images have a usable fallback', async ({ page }) => { await page.route('https://openaccess-cdn.clevelandart.org/**', route => route.abort()); await page.goto(`${root}artworks/10`); await expect(page.getByRole('img', { name: 'Image unavailable: Apple Tree' })).toBeVisible(); });
test('no inline styles or executable scripts or layout tables', async ({ page }) => { await page.goto(root); await expect(page.getByTestId('artwork')).toHaveCount(6); await expect(page.locator('[style]')).toHaveCount(0); await expect(page.locator('script:not([src])')).toHaveCount(0); await expect(page.locator('table')).toHaveCount(0); });
test('mobile views have no horizontal overflow', async ({ page }) => { await page.setViewportSize({ width: 390, height: 844 }); for (const path of ['list', 'gallery', 'artworks/10']) { await page.goto(`${root}${path}`); await expect(page.locator(path.startsWith('artworks') ? '.detail-page' : '[data-testid="artwork"]')).not.toHaveCount(0); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); } });
