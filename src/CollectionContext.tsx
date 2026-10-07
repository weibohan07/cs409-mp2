import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { errorMessage, getLiveCollection, getSnapshot, readCache } from './api';
import type { Artwork } from './model';
type Source = 'loading' | 'live' | 'cached' | 'snapshot' | 'error';
interface CollectionState { works: Artwork[]; source: Source; refreshing: boolean; error: string; collectedAt: string }
interface CollectionValue extends CollectionState { refresh: () => void }
const Context = createContext<CollectionValue | null>(null);
const initialState: CollectionState = { works: [], source: 'loading', refreshing: true, error: '', collectedAt: '' };

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const generation = useRef(0);
  const load = useCallback(async (force: boolean) => {
    const current = ++generation.current;
    setState(previous => ({ ...previous, refreshing: true, error: '' }));
    try {
      const snapshot = await getSnapshot();
      if (current !== generation.current) return;
      const cached = readCache(snapshot);
      const initial = cached ?? snapshot;
      setState({ ...initial, source: cached ? 'cached' : 'snapshot', refreshing: true, error: '' });
      if (cached && !force) {
        setState(previous => ({ ...previous, refreshing: false }));
        return;
      }
      try {
        const live = await getLiveCollection(snapshot);
        if (current === generation.current) setState({ ...live, source: 'live', refreshing: false, error: '' });
      } catch (error) {
        if (current === generation.current) setState(previous => ({ ...previous, refreshing: false, error: errorMessage(error) }));
      }
    } catch (error) {
      if (current === generation.current) setState(previous => ({ ...previous, source: 'error', refreshing: false, error: errorMessage(error) }));
    }
  }, []);
  useEffect(() => { void load(false); return () => { generation.current += 1; }; }, [load]);
  const refresh = useCallback(() => { void load(true); }, [load]);
  return <Context.Provider value={{ ...state, refresh }}>{children}</Context.Provider>;
}
export function useCollection(): CollectionValue {
  const value = useContext(Context);
  if (!value) throw new Error('CollectionProvider is missing.');
  return value;
}
