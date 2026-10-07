export interface Artwork {
  id: number;
  title: string;
  artist: string;
  artistDisplay: string;
  year: number | null;
  date: string;
  type: string;
  medium: string;
  dimensions: string;
  origin: string;
  credit: string;
  imageId: string | null;
  imageAlt: string;
  museumUrl: string;
  publicDomain: boolean;
}
export type SortKey = 'title' | 'year' | 'artist';
export type Direction = 'asc' | 'desc';
export type View = 'list' | 'gallery';
export interface BrowseQuery { q: string; types: string[]; sort: SortKey; direction: Direction }
const text = (value: unknown, fallback = ''): string => typeof value === 'string' && value.trim() ? value.trim() : fallback;
const object = (value: unknown): Record<string, unknown> => typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};

// Convert the documented Cleveland Museum of Art response into our UI model.
export function normalizeArtwork(raw: unknown): Artwork | null {
  const item = object(raw);
  if (typeof item.id !== 'number' || !Number.isSafeInteger(item.id) || item.id <= 0 || !text(item.title)) return null;
  const creators = Array.isArray(item.creators) ? item.creators.map(object) : [];
  const artist = creators.map(creator => text(creator.description).replace(/\s*\([^)]*\)\s*$/, '')).filter(Boolean).join('; ');
  const image = text(object(object(item.images).web).url);
  const allowedImage = /^https:\/\/openaccess-cdn\.clevelandart\.org\//.test(image) && item.share_license_status === 'CC0';
  const origin = Array.isArray(item.culture) ? item.culture.filter(value => typeof value === 'string').join('; ') : '';
  const museumUrl = text(item.url);
  return {
    id: item.id, title: text(item.title), artist: artist || 'Unidentified artist',
    artistDisplay: creators.map(creator => text(creator.description)).filter(Boolean).join('; '),
    year: typeof item.creation_date_earliest === 'number' && Number.isFinite(item.creation_date_earliest) ? item.creation_date_earliest : null,
    date: text(item.creation_date, 'Date not recorded'), type: text(item.type, 'Other'),
    medium: text(item.technique), dimensions: text(item.measurements), origin,
    credit: text(item.creditline), imageId: allowedImage ? image : null,
    imageAlt: `${text(item.title)}${artist ? `, by ${artist}` : ''}`,
    museumUrl: /^https:\/\/(www\.)?clevelandart\.org\//.test(museumUrl) ? museumUrl : `https://openaccess-api.clevelandart.org/api/artworks/${item.id}`,
    publicDomain: item.share_license_status === 'CC0',
  };
}
export function parseQuery(params: URLSearchParams): BrowseQuery {
  const sort = params.get('sort');
  return { q: params.get('q') ?? '', types: [...new Set(params.getAll('type').filter(Boolean))], sort: sort === 'year' || sort === 'artist' ? sort : 'title', direction: params.get('order') === 'desc' ? 'desc' : 'asc' };
}
export function queryParams(query: BrowseQuery, from?: View): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  for (const type of query.types) params.append('type', type);
  if (query.sort !== 'title') params.set('sort', query.sort);
  if (query.direction !== 'asc') params.set('order', query.direction);
  if (from) params.set('from', from);
  return params;
}
const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('en');
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
export function selectArtworks(artworks: readonly Artwork[], query: BrowseQuery): Artwork[] {
  const words = fold(query.q.trim()).split(/\s+/).filter(Boolean);
  const selectedTypes = new Set(query.types);
  return artworks.filter(work => {
    const haystack = fold(`${work.title} ${work.artist} ${work.id}`);
    return words.every(word => haystack.includes(word)) && (!selectedTypes.size || selectedTypes.has(work.type));
  }).sort((a, b) => {
    let comparison: number;
    if (query.sort === 'year') {
      if (a.year === null && b.year === null) return a.id - b.id;
      if (a.year === null) return 1;
      if (b.year === null) return -1;
      comparison = a.year - b.year;
    } else comparison = collator.compare(a[query.sort], b[query.sort]);
    return (query.direction === 'asc' ? comparison : -comparison) || a.id - b.id;
  });
}
export function neighbors(works: readonly Artwork[], id: number) {
  const index = works.findIndex(work => work.id === id);
  if (index < 0 || works.length === 0) return { index: -1, previous: null, next: null };
  return { index, previous: works[(index - 1 + works.length) % works.length], next: works[(index + 1) % works.length] };
}
export function imageUrl(work: Artwork): string | null { return work.imageId; }
