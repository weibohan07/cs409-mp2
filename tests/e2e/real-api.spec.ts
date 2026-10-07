import { test, expect } from '@playwright/test';
import axios from 'axios';

// Node/Axios transport verifies the upstream independently of browser CORS.
// This does not claim that direct cross-origin browser access is available.
test('official API returns genuine CC0 metadata and its corresponding image', async () => {
  test.setTimeout(60000);
  const options = { params: { cc0: '', has_image: 1, type: 'Painting', limit: 1 }, headers: { Origin: 'https://weibohan07.github.io' }, timeout: 15000 };
  const { data, headers } = await axios.get('https://openaccess-api.clevelandart.org/api/artworks/', options);
  expect(data.data).toHaveLength(1);
  const record = data.data[0];
  expect(record.share_license_status).toBe('CC0');
  expect(typeof record.id).toBe('number');
  expect(record.images.web.url).toMatch(/^https:\/\/openaccess-cdn\.clevelandart\.org\//);
  const image = await axios.get(record.images.web.url, { responseType: 'arraybuffer', timeout: 15000 });
  expect(image.headers['content-type']).toMatch(/^image\//);
  expect(image.data.length).toBeGreaterThan(1000);
  console.log('Upstream API reachable through Node/Axios. Browser CORS allow-origin:', headers['access-control-allow-origin'] ?? '(not supplied; browser must use the labeled snapshot)');
  // Check whether the canonical no-trailing-slash variant differs; never change
  // browser security settings or proxy through an unrelated third-party service.
  const canonical = await axios.get('https://openaccess-api.clevelandart.org/api/artworks', options);
  console.log('Canonical endpoint CORS allow-origin:', canonical.headers['access-control-allow-origin'] ?? '(not supplied)');
});
