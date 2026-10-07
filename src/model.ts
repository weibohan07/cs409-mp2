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
  iiifUrl: string;
  publicDomain: boolean;
}
export type SortKey = 'title' | 'year' | 'artist';
export type Direction = 'asc' | 'desc';
export type View = 'list' | 'gallery';
export interface BrowseQuery { q: string; types: string[]; sort: SortKey; direction: Direction }

const text = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

export function normalizeArtwork(raw: unknown, iiifUrl: string): Artwork | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.id !== 'number' || !Number.isSafeInteger(item.id) || item.id <= 0) return null;
  if (typeof item.title !== 'string' || !item.title.trim()) return null;
  const thumbnail = item.thumbnail as { alt_text?: unknown } | null;
  return {
    id: item.id, title: item.title.trim(),
    artist: text(item.artist_title, 'Unidentified artist'), artistDisplay: text(item.artist_display),
    year: typeof item.date_start === 'number' && Number.isFinite(item.date_start) ? item.date_start : null,
    date: text(item.date_display, 'Date not recorded'), type: text(item.artwork_type_title, 'Other'),
    medium: text(item.medium_display), dimensions: text(item.dimensions),
    origin: text(item.place_of_origin), credit: text(item.credit_line),
    imageId: item.is_public_domain === true ? text(item.image_id) || null : null,
    imageAlt: text(thumbnail?.alt_text, item.title),
    iiifUrl: /^https:\/\//.test(iiifUrl) ? iiifUrl.replace(/\/$/, '') : 'https://www.artic.edu/iiif/2',
    publicDomain: item.is_public_domain === true,
  };
}
export function parseQuery(params: URLSearchParams): BrowseQuery {
  const sort = params.get('sort');
  return { q: params.get('q') ?? '', types: [...new Set(params.getAll('type').filter(Boolean))],
    sort: sort === 'year' || sort === 'artist' ? sort : 'title',
    direction: params.get('order') === 'desc' ? 'desc' : 'asc' };
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
      // Unknown dates remain last in both directions, rather than becoming year zero.
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
export function imageUrl(work: Artwork, width = 600): string | null {
  return work.imageId ? `${work.iiifUrl}/${encodeURIComponent(work.imageId)}/full/${width},/0/default.jpg` : null;
}
