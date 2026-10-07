import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArtwork, parseQuery, queryParams, selectArtworks, neighbors, imageUrl } from '../.test-build/model.js';
const raw = (id, title, year, type = 'Painting', artist = 'Alice') => ({ id, title, date_start: year, artwork_type_title: type, artist_title: artist, is_public_domain: true, image_id: `image-${id}` });
const works = [raw(30, 'Zebra', 1910), raw(10, 'Apple', 1880), raw(70, 'Été', -100, 'Print', 'Émile'), raw(22, 'Bowl', null, 'Sculpture'), raw(900, 'Clouds', 2001, 'Print')].map(item => normalizeArtwork(item, 'https://www.artic.edu/iiif/2'));
const query = { q: '', types: [], sort: 'title', direction: 'asc' };
const ids = entries => entries.map(work => work.id);

test('normalization rejects invalid IDs and titles', () => {
  for (const value of [null, {}, { id: '1', title: 'A' }, { id: -1, title: 'A' }, { id: 1, title: '' }]) assert.equal(normalizeArtwork(value, ''), null);
});
test('nullable fields have useful display values without inventing dates', () => {
  const work = normalizeArtwork({ id: 1, title: 'A' }, '');
  assert.equal(work.year, null); assert.equal(work.artist, 'Unidentified artist'); assert.equal(work.imageId, null);
});
test('copyright-restricted artwork does not expose an image', () => {
  assert.equal(normalizeArtwork({ ...raw(1, 'A', 1900), is_public_domain: false }, '').imageId, null);
});
test('search matches title, artist and ID; ignores case, whitespace and accents', () => {
  assert.deepEqual(ids(selectArtworks(works, { ...query, q: '  ETE emile  ' })), [70]);
  assert.deepEqual(ids(selectArtworks(works, { ...query, q: '900' })), [900]);
});
test('search can return no results and clearing restores the collection', () => {
  assert.equal(selectArtworks(works, { ...query, q: 'no-such-title' }).length, 0);
  assert.equal(selectArtworks(works, query).length, 5);
});
test('selected types use OR; query and selected types use AND', () => {
  assert.deepEqual(ids(selectArtworks(works, { ...query, types: ['Print', 'Sculpture'] })), [22, 900, 70]);
  assert.deepEqual(ids(selectArtworks(works, { ...query, q: 'Alice', types: ['Print'] })), [900]);
});
for (const [sort, asc, desc] of [
  ['title', [10, 22, 900, 70, 30], [30, 70, 900, 22, 10]],
  ['year', [70, 10, 30, 900, 22], [900, 30, 10, 70, 22]],
  ['artist', [10, 22, 30, 900, 70], [70, 10, 22, 30, 900]],
]) {
  test(`${sort} sorts ascending`, () => assert.deepEqual(ids(selectArtworks(works, { ...query, sort })), asc));
  test(`${sort} sorts descending`, () => assert.deepEqual(ids(selectArtworks(works, { ...query, sort, direction: 'desc' })), desc));
}
test('sorting never mutates source collection', () => {
  const before = ids(works); selectArtworks(works, { ...query, direction: 'desc' }); assert.deepEqual(ids(works), before);
});
test('URL state round-trips multiple types and special characters', () => {
  const original = { q: 'Café & art', types: ['Print', 'Sculpture'], sort: 'year', direction: 'desc' };
  const params = queryParams(original, 'gallery'); assert.deepEqual(parseQuery(params), original); assert.equal(params.get('from'), 'gallery');
});
test('invalid URL controls receive safe defaults', () => {
  assert.deepEqual(parseQuery(new URLSearchParams('sort=bad&order=bad&type=Print&type=Print')), { ...query, types: ['Print'] });
});
test('next and previous cycle through the actual ordered results, not numeric IDs', () => {
  const sorted = selectArtworks(works, query);
  assert.equal(neighbors(sorted, 10).previous.id, 30); assert.equal(neighbors(sorted, 30).next.id, 10);
  assert.equal(neighbors(sorted, 22).previous.id, 10); assert.equal(neighbors(sorted, 22).next.id, 900);
});
test('empty, missing, and singleton navigation are safe', () => {
  assert.equal(neighbors([], 10).next, null); assert.equal(neighbors(works, 999).previous, null);
  assert.equal(neighbors([works[0]], 30).next.id, 30);
});
test('image URLs use IIIF and missing images remain null', () => {
  assert.match(imageUrl(works[0]), /\/image-30\/full\/600,\/0\/default.jpg$/);
  assert.equal(imageUrl({ ...works[0], imageId: null }), null);
});
