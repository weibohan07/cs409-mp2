// Deliberately synthetic test records. Production uses public/data/collection.json.
import type { Page } from '@playwright/test';
export const records = [
  [30, 'Zebra Study', 1910, 'Painting', 'Zoë Painter'],
  [10, 'Apple Tree', 1880, 'Painting', 'Alice Example'],
  [70, 'Été', -100, 'Print', 'Émile Printmaker'],
  [22, 'Bowl', null, 'Sculpture', 'Unknown Artist'],
  [900, 'Clouds', 2001, 'Print', 'Alice Example'],
  [8, 'Apple Blossom', 1880, 'Sculpture', 'Bo Artist'],
].map(([id, title, year, type, artist]) => ({ id, title, date_start: year, date_display: year === null ? 'Date not recorded' : String(year), artwork_type_title: type, artist_title: artist, artist_display: artist, medium_display: 'Test medium', dimensions: '20 × 30 cm', place_of_origin: 'Test origin', credit_line: 'Synthetic automated-test fixture', is_public_domain: true, image_id: `test-${id}` }));
export const snapshot = { data: records, config: { iiif_url: 'https://www.artic.edu/iiif/2' }, collectedAt: '2026-10-06T00:00:00.000Z' };
export async function mockMuseum(page: Page, unavailable = false) {
  await page.route('**/data/collection.json', route => route.fulfill({ json: snapshot }));
  await page.route('https://api.artic.edu/api/v1/artworks**', route => {
    if (unavailable) return route.abort('failed');
    const url = new URL(route.request().url());
    const id = Number(url.pathname.split('/').at(-1));
    if (id) {
      const data = records.find(record => record.id === id);
      return route.fulfill({ status: data ? 200 : 404, json: { ...snapshot, data: data ?? { error: 'Not found' } } });
    }
    const ids = new Set((url.searchParams.get('ids') ?? '').split(',').map(Number));
    return route.fulfill({ json: { ...snapshot, data: ids.size && !ids.has(0) ? records.filter(record => ids.has(record.id as number)) : records } });
  });
  await page.route('https://www.artic.edu/iiif/2/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1kAAAAASUVORK5CYII=', 'base64') }));
}
