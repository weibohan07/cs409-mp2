import axios from 'axios';
const { data } = await axios.get('https://openaccess-api.clevelandart.org/api/artworks/', { params: { cc0: '', has_image: 1, type: 'Painting', limit: 1 }, timeout: 20000 });
if (!data.data?.length) throw new Error('No public-domain museum records returned');
const work = data.data[0];
console.log(JSON.stringify({ title: work.title, id: work.id, license: work.share_license_status, image: work.images?.web?.url }));
const response = await axios.get(work.images.web.url, { timeout: 20000, responseType: 'arraybuffer' });
console.log(JSON.stringify({ status: response.status, contentType: response.headers['content-type'], bytes: response.data.length }));
if (!response.headers['content-type']?.startsWith('image/')) throw new Error('The endpoint did not return an image');
