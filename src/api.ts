import axios from 'axios';
import { normalizeArtwork } from './model';
import type { Artwork } from './model';
const client = axios.create({ baseURL: 'https://openaccess-api.clevelandart.org/api', timeout: 15000 });
const fields = 'id,title,creators,creation_date,creation_date_earliest,type,technique,measurements,culture,creditline,images,url,share_license_status';
const cacheKey = 'cabinet.cma.collection.v1';
const cacheLifetime = 60 * 60 * 1000;
interface ApiResponse { data: unknown; collectedAt?: string }
export interface Collection { works: Artwork[]; collectedAt: string }
function readWorks(response: ApiResponse): Artwork[] {
  if (!Array.isArray(response.data)) throw new Error('The museum returned an unexpected response.');
  const works = response.data.map(raw => normalizeArtwork(raw)).filter((work): work is Artwork => work !== null);
  if (!works.length) throw new Error('No usable artworks were returned.');
  return [...new Map(works.map(work => [work.id, work])).values()];
}
let snapshotPromise: Promise<Collection> | undefined;
export function getSnapshot(): Promise<Collection> {
  if (!snapshotPromise) snapshotPromise = axios.get<ApiResponse>(`${import.meta.env.BASE_URL}data/collection.json`, { timeout: 10000 })
    .then(({ data }) => ({ works: readWorks(data), collectedAt: data.collectedAt ?? '' }))
    .catch((error: unknown) => { snapshotPromise = undefined; throw error; });
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
    for (const type of ['Painting', 'Print', 'Sculpture']) {
      const { data } = await client.get<ApiResponse>('/artworks/', { params: { cc0: '', has_image: 1, type, limit: 24, orderby: 'id', fields } });
      if (!Array.isArray(data.data)) throw new Error('The museum returned an unexpected response.');
      rawWorks.push(...data.data);
    }
    const response: ApiResponse = { data: rawWorks };
    const works = readWorks(response);
    const expectedIds = new Set(snapshot.works.map(work => work.id));
    if (works.length !== expectedIds.size || works.some(work => !expectedIds.has(work.id))) throw new Error('The live selection changed or was incomplete. The saved edition remains available.');
    const savedAt = Date.now();
    try { localStorage.setItem(cacheKey, JSON.stringify({ savedAt, ids: [...expectedIds].sort((a, b) => a - b).join(','), response })); } catch { /* A full cache must not break browsing. */ }
    return { works, collectedAt: new Date(savedAt).toISOString() };
  })().finally(() => { livePromise = undefined; });
  return livePromise;
}
export async function getArtwork(id: number, signal: AbortSignal): Promise<Artwork> {
  const { data } = await client.get<ApiResponse>(`/artworks/${id}`, { params: { fields }, signal });
  const work = normalizeArtwork(data.data);
  if (!work) throw new Error('This artwork could not be found.');
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
