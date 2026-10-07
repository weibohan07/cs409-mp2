// Synthetic CMA-shaped fixtures are only used in automated tests.
import type { Page } from '@playwright/test';
export const records = [[30, 'Zebra Study', 1910, 'Painting', 'Zoë Painter'], [10, 'Apple Tree', 1880, 'Painting', 'Alice Example'], [70, 'Été', -100, 'Print', 'Émile Printmaker'], [22, 'Bowl', null, 'Sculpture', 'Unknown Artist'], [900, 'Clouds', 2001, 'Print', 'Alice Example'], [8, 'Apple Blossom', 1880, 'Sculpture', 'Bo Artist']].map(([id, title, year, type, artist]) => ({ id, title, creation_date_earliest: year, creation_date: year === null ? 'Date not recorded' : String(year), type, creators: [{ description: artist }], technique: 'Test medium', measurements: '20 × 30 cm', culture: ['Test origin'], creditline: 'Synthetic automated-test fixture', share_license_status: 'CC0', url: `https://www.clevelandart.org/art/test-${id}`, images: { web: { url: `https://openaccess-cdn.clevelandart.org/test/${id}.jpg` } } }));
export const snapshot = { data: records, collectedAt: '2026-10-06T00:00:00.000Z' };
export async function mockMuseum(page: Page, unavailable = false) {
  await page.route('**/data/collection.json', route => route.fulfill({ json: snapshot }));
  await page.route('https://openaccess-api.clevelandart.org/api/artworks**', route => {
    if (unavailable) return route.abort('failed');
    const url = new URL(route.request().url());
    const id = Number(url.pathname.split('/').at(-1));
    if (id) { const data = records.find(record => record.id === id); return route.fulfill({ status: data ? 200 : 404, json: { data: data ?? null } }); }
    const type = url.searchParams.get('type');
    return route.fulfill({ json: { data: type ? records.filter(record => record.type === type) : records } });
  });
  await page.route('https://openaccess-cdn.clevelandart.org/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1kAAAAASUVORK5CYII=', 'base64') }));
}
