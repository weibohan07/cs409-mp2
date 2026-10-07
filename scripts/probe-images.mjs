import axios from 'axios';
import { readFile } from 'node:fs/promises';
const snapshot = JSON.parse(await readFile('public/data/collection.json', 'utf8'));
const id = snapshot.data[0].image_id;
for (const width of [600, 843]) {
  const url = `${snapshot.config.iiif_url}/${id}/full/${width},/0/default.jpg`;
  try {
    const response = await axios.get(url, { timeout: 12000, responseType: 'arraybuffer', validateStatus: () => true });
    const type = response.headers['content-type'] ?? '';
    console.log(JSON.stringify({ url, status: response.status, type, bytes: response.data.length, message: type.startsWith('image/') ? 'Image response received' : Buffer.from(response.data).toString('utf8').slice(0, 350) }));
  } catch (error) { console.log(JSON.stringify({ url, error: error.message })); }
  await new Promise(resolve => setTimeout(resolve, 1100));
}
