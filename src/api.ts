import axios from 'axios';
import { normalizeArtwork } from './model';
import type { Artwork } from './model';

const client = axios.create({ baseURL: 'https://api.artic.edu/api/v1', timeout: 10000 });
const fields = 'id,title,artist_title,artist_display,date_start,date_display,artwork_type_title,medium_display,dimensions,place_of_origin,credit_line,image_id,is_public_domain,thumbnail';
const cacheKey = 'cabinet.collection.v1';
const cacheLifetime = 60 * 60 * 1000;
interface ApiResponse { data: unknown; config?: { iiif_url?: string }; collectedAt?: string }
export interface Collection { works: Artwork[]; collectedAt: string }

function readWorks(response: ApiResponse): Artwork[] {
  if (!Array.isArray(response.data)) throw new Error('The museum returned an unexpected response.');
  const iiif = response.config?.iiif_url ?? 'https://www.artic.edu/iiif/2';
  const works = response.data.map(raw => normalizeArtwork(raw, iiif)).filter((work): work is Artwork => work !== null);
  if (!works.length) throw new Error('No usable artworks were returned.');
  return [...new Map(works.map(work => [work.id, work])).values()];
}
let snapshotPromise: Promise<Collection> | undefined;
export function getSnapshot(): Promise<Collection> {
  if (!snapshotPromise) {
    snapshotPromise = axios.get<ApiResponse>(`${import.meta.env.BASE_URL}data/collection.json`, { timeout: 10000 })
      .then(({ data }) => ({ works: readWorks(data), collectedAt: data.collectedAt ?? '' }))
      .catch((error: unknown) => { snapshotPromise = undefined; throw error; });
  }
  return snapshotPromise;
}
export function readCache(snapshot: Collection): Collection | null {
  try {
    const raw = JSON.parse(localStorage.getItem(cacheKey) ?? 'null') as { savedAt: number; ids: string; response: ApiResponse } | null;
    const ids = snapshot.works.map(work => work.id).sort((a, b) => a - b).join(',');
    if (!raw || raw.ids !== ids || !Number.isFinite(raw.savedAt) || Date.now() - raw.savedAt > cacheLifetime || raw.savedAt > Date.now()) return null;
    const works = readWorks(raw.response);
    if (works.map(work => work.id).sort((a, b) => a - b).join(',') !== ids) return null;
    return { works, collectedAt: new Date(raw.savedAt).toISOString() };
  } catch { return null; }
}
let livePromise: Promise<Collection> | undefined;
export function getLiveCollection(snapshot: Collection): Promise<Collection> {
  if (livePromise) return livePromise;
  livePromise = (async () => {
    const rawWorks: unknown[] = [];
    let iiif = 'https://www.artic.edu/iiif/2';
    // Batch calls instead of requesting every card, render, or search keystroke.
    for (let start = 0; start < snapshot.works.length; start += 32) {
      const ids = snapshot.works.slice(start, start + 32).map(work => work.id).join(',');
      const { data } = await client.get<ApiResponse>('/artworks', { params: { ids, fields, limit: 100 } });
      if (!Array.isArray(data.data)) throw new Error('The museum returned an unexpected response.');
      rawWorks.push(...data.data);
      iiif = data.config?.iiif_url ?? iiif;
    }
    const response: ApiResponse = { data: rawWorks, config: { iiif_url: iiif } };
    const works = readWorks(response);
    const expectedIds = new Set(snapshot.works.map(work => work.id));
    if (works.length !== expectedIds.size || works.some(work => !expectedIds.has(work.id))) {
      throw new Error('The museum returned an incomplete collection; the saved edition remains available.');
    }
    const savedAt = Date.now();
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ savedAt, ids: [...expectedIds].sort((a, b) => a - b).join(','), response }));
    } catch { /* A full cache or private browsing must not break the app. */ }
    return { works, collectedAt: new Date(savedAt).toISOString() };
  })().finally(() => { livePromise = undefined; });
  return livePromise;
}
export async function getArtwork(id: number, signal: AbortSignal): Promise<Artwork> {
  const { data } = await client.get<ApiResponse>(`/artworks/${id}`, { params: { fields }, signal });
  const work = normalizeArtwork(data.data, data.config?.iiif_url ?? 'https://www.artic.edu/iiif/2');
  if (!work) throw new Error('This artwork is not available.');
  return work;
}
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) return 'This artwork could not be found.';
    if (error.response?.status === 429) return 'The museum is receiving too many requests. Please retry in a moment.';
    if (!error.response) return 'The museum could not be reached. Check your connection and try again.';
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
