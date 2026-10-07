import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { errorMessage, getArtwork } from './api';
import { ArtworkImage, EmptyState } from './components';
import { useCollection } from './CollectionContext';
import { neighbors, parseQuery, queryParams, selectArtworks } from './model';
import type { Artwork, View } from './model';

export default function DetailPage() {
  const { id: routeId = '' } = useParams();
  const id = /^[1-9]\d*$/.test(routeId) ? Number(routeId) : NaN;
  const validId = Number.isSafeInteger(id);
  const [params] = useSearchParams();
  const from: View = params.get('from') === 'gallery' ? 'gallery' : 'list';
  const query = useMemo(() => parseQuery(params), [params]);
  const { works, source } = useCollection();
  const found = works.find(work => work.id === id);
  const [fetched, setFetched] = useState<{ id: number; work: Artwork | null; error: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const results = useMemo(() => selectArtworks(works, query), [works, query]);
  const navigation = neighbors(results, id);
  const work = found ?? (fetched?.id === id ? fetched.work : null);
  const error = !validId ? 'This artwork ID is not valid.' : fetched?.id === id ? fetched.error : '';
  const back = { pathname: `/${from}`, search: `?${queryParams(query)}` };
  const detailLink = (target: Artwork) => ({ pathname: `/artworks/${target.id}`, search: `?${queryParams(query, from)}` });

  useEffect(() => {
    if (!validId || found || source === 'loading') return;
    const controller = new AbortController();
    setFetched(null);
    getArtwork(id, controller.signal)
      .then(item => { if (!controller.signal.aborted) setFetched({ id, work: item, error: '' }); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setFetched({ id, work: null, error: errorMessage(reason) }); });
    return () => controller.abort();
  }, [id, validId, found, source, attempt]);
  useEffect(() => { document.title = work ? `${work.title} — Cabinet` : 'Artwork — Cabinet'; }, [work]);

  if (error && !work) return <><Link className="back-link" to={back}>← Back to results</Link><EmptyState title="Artwork unavailable" action={validId ? <button className="button" onClick={() => setAttempt(value => value + 1)}>Try again</button> : undefined}>{error}</EmptyState></>;
  if (!work) return <><Link className="back-link" to={back}>← Back to results</Link><EmptyState title="Taking a closer look…">Loading artwork details.</EmptyState></>;
  const canNavigate = results.length > 1 && navigation.index >= 0;
  const facts = [
    ['Date', work.date], ['Artwork type', work.type], ['Medium', work.medium],
    ['Dimensions', work.dimensions], ['Place of origin', work.origin],
  ];
  return <article className="detail-page" data-testid="detail" data-art-id={work.id}>
    <div className="detail-topline"><Link className="back-link" to={back}>← Back to results</Link><span>COLLECTION OBJECT / {work.id}</span></div>
    <div className="detail-grid">
      <figure className="detail-figure"><ArtworkImage key={`${work.id}-${work.imageId}`} work={work} large />
        <figcaption>{work.publicDomain ? 'Public-domain artwork' : 'Rights information available from the museum'} · Art Institute of Chicago</figcaption>
      </figure>
      <div className="detail-information">
        <p className="eyebrow">{work.type} <span aria-hidden="true">/</span> {work.date}</p>
        <h1>{work.title}</h1><p className="detail-artist">{work.artist}</p>
        {work.artistDisplay && <p className="artist-description">{work.artistDisplay}</p>}
        <dl className="art-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not recorded'}</dd></div>)}</dl>
        {work.credit && <div className="credit-block"><h2>Credit line</h2><p>{work.credit}</p></div>}
        <a className="museum-link" href={`https://www.artic.edu/artworks/${work.id}`} target="_blank" rel="noreferrer">View museum record <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
      </div>
    </div>
    <nav className="detail-navigation" aria-label="Artwork navigation">
      {canNavigate && navigation.previous ? <Link className="neighbor neighbor--previous" to={detailLink(navigation.previous)} aria-label="Previous artwork"><span>← Previous</span><strong>{navigation.previous.title}</strong></Link> : <button className="neighbor" disabled>← Previous</button>}
      <div className="position"><strong>{navigation.index >= 0 ? `${navigation.index + 1} / ${results.length}` : 'Outside selection'}</strong><span>{results.length === 1 && navigation.index === 0 ? 'Only matching work' : 'In your current results'}</span></div>
      {canNavigate && navigation.next ? <Link className="neighbor neighbor--next" to={detailLink(navigation.next)} aria-label="Next artwork"><span>Next →</span><strong>{navigation.next.title}</strong></Link> : <button className="neighbor neighbor--next" disabled>Next →</button>}
    </nav>
    {navigation.index >= 0 ? <p className="navigation-note">Previous and next follow your current search, filters, and sort order. The last work loops back to the first.</p>
      : <p className="navigation-note">This work is outside the current results. {found ? <Link to={{ pathname: `/artworks/${work.id}`, search: `?${queryParams({ ...query, q: '', types: [] }, from)}` }}>Clear filters to browse the selection.</Link> : <Link to="/list">Explore the selected collection.</Link>}</p>}
  </article>;
}
