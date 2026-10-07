import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { useCollection } from './CollectionContext';
import { parseQuery, queryParams } from './model';

const storageKey = 'cabinet.result-scroll.v1';
const positions = new Map<string, number>();
let loaded = false;
const isBrowse = (path: string) => path === '/list' || path === '/gallery';
function readPosition(key: string): number {
  if (!loaded) {
    loaded = true;
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]');
      if (Array.isArray(saved)) for (const entry of saved) {
        if (Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] >= 0) positions.set(entry[0], entry[1]);
      }
    } catch { /* Browsing also works when session storage is blocked. */ }
  }
  return positions.get(key) ?? 0;
}
function savePosition(key: string, y: number) {
  positions.delete(key);
  positions.set(key, y);
  while (positions.size > 80) positions.delete(positions.keys().next().value!);
  try { sessionStorage.setItem(storageKey, JSON.stringify([...positions])); } catch { /* Keep the in-memory copy. */ }
}
interface Visit { key: string; path: string; resultsKey: string; y: number; pending: number | null }

export default function BrowseScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { source } = useCollection();
  const ready = source !== 'loading';
  const visit = useRef<Visit | null>(null);
  const query = parseQuery(new URLSearchParams(location.search));
  const resultsKey = `${location.pathname}?${queryParams({ ...query, types: [...query.types].sort() })}`;

  useLayoutEffect(() => {
    const original = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    // Capture before React replaces a long result list with a short detail page.
    // Reading scrollY only after unmount would record the browser's clamped value.
    const record = () => {
      const current = visit.current;
      if (current && isBrowse(current.path) && current.pending === null) current.y = window.scrollY;
    };
    const persist = () => {
      record();
      const current = visit.current;
      if (current && isBrowse(current.path) && current.pending === null) savePosition(current.resultsKey, current.y);
    };
    window.addEventListener('scroll', record, { passive: true });
    document.addEventListener('click', persist, true);
    window.addEventListener('pagehide', persist);
    return () => {
      persist();
      window.history.scrollRestoration = original;
      window.removeEventListener('scroll', record);
      document.removeEventListener('click', persist, true);
      window.removeEventListener('pagehide', persist);
    };
  }, []);

  useLayoutEffect(() => {
    const previous = visit.current;
    if (!previous || previous.key !== location.key) {
      if (previous && isBrowse(previous.path) && previous.pending === null) savePosition(previous.resultsKey, previous.y);
      const keepCurrent = previous?.path === location.pathname && isBrowse(location.pathname) && navigationType !== 'POP';
      const returning = !previous || navigationType === 'POP' || previous.path.startsWith('/artworks/');
      const target = isBrowse(location.pathname) && returning ? readPosition(resultsKey) : 0;
      visit.current = { key: location.key, path: location.pathname, resultsKey, y: keepCurrent ? window.scrollY : target, pending: keepCurrent ? null : target };
    }
    const current = visit.current;
    // On a refresh, wait for the saved/API collection to create the result rows.
    if (!current || current.pending === null || (isBrowse(current.path) && !ready)) return;
    window.scrollTo({ top: current.pending, left: 0, behavior: 'instant' });
    current.y = window.scrollY;
    current.pending = null;
  }, [location.key, location.pathname, resultsKey, navigationType, ready]);
  return null;
}
