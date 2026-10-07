import axios from 'axios';
import { mkdir, writeFile } from 'node:fs/promises';
const endpoint = 'https://openaccess-api.clevelandart.org/api/artworks/';
const fields = 'id,title,creators,creation_date,creation_date_earliest,type,technique,measurements,culture,creditline,images,url,share_license_status';
const records = new Map();
for (const type of ['Painting', 'Print', 'Sculpture']) {
  const { data } = await axios.get(endpoint, { params: { cc0: '', has_image: 1, type, limit: 24, orderby: 'id', fields }, timeout: 30000 });
  if (!Array.isArray(data.data) || data.data.length !== 24) throw new Error(`Incomplete ${type} response`);
  for (const item of data.data) {
    if (item.share_license_status !== 'CC0' || !item.images?.web?.url || !item.title || !item.id) throw new Error(`Unusable record: ${item.id}`);
    records.set(item.id, item);
  }
  console.log(`${type}: ${data.data.length} real records`);
  await new Promise(resolve => setTimeout(resolve, 1100));
}
if (records.size !== 72) throw new Error('Refusing to save an incomplete selection.');
await mkdir('public/data', { recursive: true });
await writeFile('public/data/collection.json', JSON.stringify({ collectedAt: new Date().toISOString(), source: endpoint, selection: '24 CC0 artworks with images in each of Painting, Print and Sculpture, ordered by ID. Search is limited to this selection.', data: [...records.values()] }, null, 2) + '\n');
console.log('Saved 72 real Cleveland Museum of Art records.');
