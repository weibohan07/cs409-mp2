import { Component, useEffect } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BrowsePage from './BrowsePage';
import DetailPage from './DetailPage';
import { EmptyState, SourceStatus } from './components';
import { parseQuery, queryParams } from './model';
class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Cabinet render error', error, info.componentStack); }
  render() { return this.state.failed ? <EmptyState title="Something interrupted your visit" action={<button className="button" onClick={() => window.location.reload()}>Reload the collection</button>}>Please reload the page to try again.</EmptyState> : this.props.children; }
}
function ScrollOnNavigation() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
export default function App() {
  const location = useLocation();
  const search = `?${queryParams(parseQuery(new URLSearchParams(location.search)))}`;
  return <><a href="#main-content" className="skip-link">Skip to content</a>
    <header className="site-header"><div className="header-inner"><Link className="brand" to="/list" aria-label="Cabinet home"><span className="brand-mark" aria-hidden="true">C</span><span>cabinet<span className="brand-period">.</span></span></Link>
      <nav className="primary-nav" aria-label="Main navigation"><Link to={{ pathname: '/list', search }} aria-current={location.pathname === '/list' ? 'page' : undefined}>Collection</Link><Link to={{ pathname: '/gallery', search }} aria-current={location.pathname === '/gallery' ? 'page' : undefined}>Gallery</Link></nav><span className="header-note">ART, OPEN TO EVERYONE.</span>
    </div></header>
    <main id="main-content" className="site-main"><AppErrorBoundary><ScrollOnNavigation /><Routes>
      <Route path="/" element={<Navigate to="/list" replace />} /><Route path="/list" element={<BrowsePage view="list" />} /><Route path="/gallery" element={<BrowsePage view="gallery" />} /><Route path="/artworks/:id" element={<DetailPage />} />
      <Route path="*" element={<EmptyState title="This room is not in the collection" action={<Link className="button" to="/list">Back to the collection</Link>}>The address may be incorrect. Your next discovery is one click away.</EmptyState>} />
    </Routes><SourceStatus /></AppErrorBoundary></main>
    <footer className="site-footer"><div><Link className="footer-brand" to="/list">cabinet.</Link><p>A little room for curiosity.</p></div><p>An independent student project, not an official museum site.<br />Collection data and images from the <a href="https://www.clevelandart.org/" target="_blank" rel="noreferrer">Cleveland Museum of Art</a>.</p><span className="footer-project">CS 409 / MP 2</span></footer>
  </>;
}
