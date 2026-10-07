import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCollection } from './CollectionContext';
import { imageUrl, queryParams } from './model';
import type { Artwork, BrowseQuery, Direction, SortKey, View } from './model';

export function ArtworkImage({ work, large = false }: { work: Artwork; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = imageUrl(work);
  return <div className={`art-image ${large ? 'art-image--large' : ''} ${loaded ? 'is-loaded' : ''}`}>
    {!src || failed ? <div className="image-fallback" role="img" aria-label={`Image unavailable: ${work.title}`}><span aria-hidden="true">▧</span><small>Image unavailable</small></div>
      : <img src={src} alt={work.imageAlt} loading={large ? 'eager' : 'lazy'} decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
  </div>;
}
export function SourceStatus() {
  const { source, refreshing, error, collectedAt, refresh } = useCollection();
  const label = source === 'live' ? 'Museum API connected' : source === 'cached' ? 'Recent browser cache' : source === 'snapshot' ? 'Saved museum collection' : source === 'error' ? 'Collection unavailable' : 'Opening the collection';
  return <div className="source-status"><div className="source-status__line">
    <span className={`status-dot ${source === 'live' ? 'status-dot--live' : ''}`} aria-hidden="true" /><span>{refreshing ? 'Checking museum data…' : label}</span>
    {!refreshing && collectedAt && <span className="source-date"> · {new Date(collectedAt).toLocaleDateString('en-US')}</span>}
    <button className="text-button" onClick={refresh} disabled={refreshing}>{refreshing ? 'Updating…' : 'Refresh data'}</button>
  </div>{error && <p className="notice" role="status">{error} {source === 'snapshot' ? 'Displaying the bundled real-API snapshot; its images still require a connection.' : source === 'cached' ? 'Displaying cached museum data.' : ''}</p>}</div>;
}
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <section className="empty-state"><span className="empty-state__mark" aria-hidden="true">C.</span><h2>{title}</h2>{children && <p>{children}</p>}{action}</section>;
}
export function BrowseControls({ query, types, onChange }: { query: BrowseQuery; types: { name: string; count: number }[]; onChange: (query: BrowseQuery, typing?: boolean) => void }) {
  const toggleType = (name: string) => onChange({ ...query, types: query.types.includes(name) ? query.types.filter(type => type !== name) : [...query.types, name] });
  return <section className="browse-controls" aria-label="Collection controls"><div className="controls-row">
    <div className="search-control" role="search"><label htmlFor="art-search">Search this collection</label><div className="search-input-wrap"><span aria-hidden="true" className="search-symbol">⌕</span>
      <input id="art-search" type="search" value={query.q} onChange={event => onChange({ ...query, q: event.target.value }, true)} placeholder="Title, artist, or artwork ID…" autoComplete="off" />
      {query.q && <button className="clear-search" aria-label="Clear search" onClick={() => onChange({ ...query, q: '' })}>×</button>}
    </div></div>
    <div className="sort-control"><label htmlFor="sort-field">Sort by</label><select id="sort-field" value={query.sort} onChange={event => onChange({ ...query, sort: event.target.value as SortKey })}><option value="title">Title</option><option value="year">Year</option><option value="artist">Artist</option></select></div>
    <div className="sort-control"><label htmlFor="sort-order">Order</label><select id="sort-order" value={query.direction} onChange={event => onChange({ ...query, direction: event.target.value as Direction })}><option value="asc">Ascending ↑</option><option value="desc">Descending ↓</option></select></div>
  </div><fieldset className="type-filter"><legend>Filter by artwork type <span>— select one or more</span></legend><div className="filter-buttons">
    <button className="filter-button" aria-pressed={query.types.length === 0} onClick={() => onChange({ ...query, types: [] })}>All works</button>
    {types.map(type => <button key={type.name} className="filter-button" aria-pressed={query.types.includes(type.name)} onClick={() => toggleType(type.name)}>{type.name} <span aria-hidden="true">{type.count}</span></button>)}
  </div></fieldset></section>;
}
export function ArtworkEntry({ work, view, query }: { work: Artwork; view: View; query: BrowseQuery }) {
  return <li className={view === 'gallery' ? 'art-card' : 'art-row'} data-testid="artwork" data-art-id={work.id} data-year={work.year ?? ''} data-type={work.type}>
    <Link className="artwork-link" to={{ pathname: `/artworks/${work.id}`, search: `?${queryParams(query, view)}` }} aria-label={`View ${work.title}`}>
      <ArtworkImage key={`${work.id}-${work.imageId}`} work={work} /><div className="art-info"><span className="art-type">{work.type}</span><h2 data-testid="art-title">{work.title}</h2><p>{work.artist}</p></div><span className="art-date">{work.date}</span><span className="row-arrow" aria-hidden="true">↗</span>
    </Link></li>;
}
