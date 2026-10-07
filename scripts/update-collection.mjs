// Refresh this fixed teaching collection deliberately, not on every build.
// The runtime still revalidates these IDs through Axios against the museum API.
import axios from 'axios';
import { mkdir, writeFile } from 'node:fs/promises';

const endpoint = 'https://api.artic.edu/api/v1/artworks/search';
const fields = ['id', 'title', 'artist_title', 'artist_display', 'date_start', 'date_display', 'artwork_type_title', 'medium_display', 'dimensions', 'place_of_origin', 'credit_line', 'image_id', 'is_public_domain', 'thumbnail'];
const records = new Map();
let iiifUrl;
for (const type of ['Painting', 'Print', 'Sculpture']) {
  const params = {
    query: { bool: { filter: [
      { term: { is_public_domain: true } },
      { exists: { field: 'image_id' } },
      { term: { 'artwork_type_title.keyword': type } }
    ] } },
    fields, limit: 32
  };
  const { data } = await axios.get(endpoint, { params: { params: JSON.stringify(params) }, timeout: 30000 });
  if (!Array.isArray(data.data)) throw new Error(`Invalid ${type} response`);
  iiifUrl = data.config?.iiif_url ?? iiifUrl;
  for (const item of data.data) {
    if (item.is_public_domain === true && item.image_id && item.id && item.title) records.set(item.id, item);
  }
  console.log(`${type}: ${data.data.length} records`);
  await new Promise(resolve => setTimeout(resolve, 1100));
}
if (records.size < 12 || !iiifUrl) throw new Error('Refusing to replace the collection with an incomplete API response.');
const snapshot = {
  collectedAt: new Date().toISOString(),
  source: endpoint,
  selection: 'Up to 32 public-domain works with images in each of Painting, Print, and Sculpture. Search is limited to this fixed selection, not the entire museum.',
  config: { iiif_url: iiifUrl },
  data: [...records.values()]
};
await mkdir('public/data', { recursive: true });
await writeFile('public/data/collection.json', JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Saved ${records.size} real museum records.`);
