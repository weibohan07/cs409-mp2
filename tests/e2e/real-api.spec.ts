import { test, expect } from '@playwright/test';
import axios from 'axios';

test('canonical museum API supplies CC0 metadata, CORS headers and the actual image', async () => {
  test.setTimeout(45000);
  const { data, headers } = await axios.get('https://openaccess-api.clevelandart.org/api/artworks', {
    params: { cc0: '', has_image: 1, type: 'Painting', limit: 1 },
    headers: { Origin: 'https://weibohan07.github.io' }, timeout: 15000,
  });
  expect(headers['access-control-allow-origin']).toBe('*');
  expect(data.data).toHaveLength(1);
  const record = data.data[0];
  expect(record.share_license_status).toBe('CC0');
  expect(typeof record.id).toBe('number');
  expect(record.images.web.url).toMatch(/^https:\/\/openaccess-cdn\.clevelandart\.org\//);
  const image = await axios.get(record.images.web.url, { responseType: 'arraybuffer', timeout: 15000 });
  expect(image.headers['content-type']).toMatch(/^image\//);
  expect(image.data.length).toBeGreaterThan(1000);
});
