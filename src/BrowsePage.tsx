import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArtworkEntry, BrowseControls, EmptyState } from './components';
import { useCollection } from './CollectionContext';
import { parseQuery, queryParams, selectArtworks } from './model';
import type { BrowseQuery, View } from './model';
export default function BrowsePage({ view }: { view: View }) {
  const { works, source, refresh } = useCollection();
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => parseQuery(params), [params]);
  const results = useMemo(() => selectArtworks(works, query), [works, query]);
  const types = useMemo(() => [...new Set(works.map(work => work.type))].sort().map(name => ({ name, count: works.filter(work => work.type === name).length })), [works]);
  useEffect(() => { document.title = `${view === 'gallery' ? 'Gallery' : 'Collection'} — Cabinet`; }, [view]);
  const change = (next: BrowseQuery, typing = false) => setParams(queryParams(next), { replace: typing });
  const clear = () => change({ ...query, q: '', types: [] });
  return <><section className="collection-heading"><div><p className="eyebrow"><span className="tiny-rule" /> THE OPEN COLLECTION · CLEVELAND</p><h1>A collection worth<br /><em>looking at.</em></h1><p className="intro">A small cabinet of art, made for curiosity. Find a familiar name,<br className="desktop-break" /> discover something unexpected, and take a closer look.</p></div><div className="edition-stamp" aria-label="Selected works from the Cleveland Museum of Art"><strong>{works.length ? String(works.length).padStart(2, '0') : '—'}</strong><span>SELECTED WORKS</span><span>PAINT · PRINT · FORM</span></div></section>
    <BrowseControls query={query} types={types} onChange={change} />
    <div className="results-bar"><p role="status" aria-live="polite" data-testid="result-count">Showing <strong>{results.length}</strong> of {works.length} works</p><nav className="view-switch" aria-label="Collection view"><Link className={view === 'list' ? 'is-active' : ''} aria-current={view === 'list' ? 'page' : undefined} to={{ pathname: '/list', search: `?${queryParams(query)}` }}><span aria-hidden="true">☷</span> List</Link><Link className={view === 'gallery' ? 'is-active' : ''} aria-current={view === 'gallery' ? 'page' : undefined} to={{ pathname: '/gallery', search: `?${queryParams(query)}` }}><span aria-hidden="true">▦</span> Gallery</Link></nav></div>
    {source === 'loading' ? <EmptyState title="Opening the cabinet…">Loading the selected museum collection.</EmptyState> : source === 'error' && !works.length ? <EmptyState title="The collection could not be loaded" action={<button className="button" onClick={refresh}>Retry loading</button>}>Please check your connection and try again.</EmptyState> : !results.length ? <EmptyState title="Nothing here, just yet." action={<button className="button" onClick={clear}>Clear search and filters</button>}>Try a different title or artist, or give your filters a little more room.</EmptyState> : <ul className={view === 'gallery' ? 'gallery-grid' : 'art-list'} aria-label={view === 'gallery' ? 'Artwork gallery' : 'Artwork list'}>{results.map(work => <ArtworkEntry key={work.id} work={work} view={view} query={query} />)}</ul>}
    <p className="collection-note">You are searching a fixed selection, not the entire museum. Multiple types are combined with “or”; search and type filters are combined with “and”.</p>
  </>;
}
