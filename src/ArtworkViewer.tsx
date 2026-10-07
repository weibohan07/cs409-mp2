import { useEffect, useId, useRef, useState } from 'react';
import { ArtworkImage } from './components';
import type { Artwork } from './model';
import './detail-enhancements.css';

export default function ArtworkViewer({ work }: { work: Artwork }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [usePreview, setUsePreview] = useState(false);
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const backdropPress = useRef(false);
  const titleId = useId();
  const src = usePreview ? work.imageId : work.largeImageUrl ?? work.imageId;

  useEffect(() => {
    const element = dialog.current;
    const opener = trigger.current;
    if (!open || !element) return;
    element.showModal();
    document.documentElement.classList.add('art-viewer-open');
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      document.documentElement.classList.remove('art-viewer-open');
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  const show = () => { setLoaded(false); setFailed(false); setUsePreview(false); setOpen(true); };
  const handleImageError = () => {
    if (!usePreview && work.imageId && src !== work.imageId) setUsePreview(true);
    else setFailed(true);
  };
  return <>
    <div className="detail-image-control">
      <ArtworkImage work={work} large />
      {work.imageId && <button ref={trigger} className="art-viewer-trigger" type="button" aria-label="Open full-size image" aria-haspopup="dialog" onClick={show}><span>View larger <span aria-hidden="true">⛶</span></span></button>}
    </div>
    <dialog ref={dialog} className="art-viewer" aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); setOpen(false); }}
      onClose={() => setOpen(false)}
      onPointerDown={event => { backdropPress.current = event.target === event.currentTarget; }}
      onClick={event => { if (backdropPress.current && event.target === event.currentTarget) setOpen(false); }}>
      <div className="art-viewer-header"><h2 id={titleId}>{work.title}</h2><button ref={closeButton} className="art-viewer-close" type="button" aria-label="Close full-size image" onClick={() => setOpen(false)}>Close <span aria-hidden="true">×</span></button></div>
      <div className={`art-viewer-stage${loaded ? ' is-loaded' : ''}`}>
        {open && !failed && src && <img className="art-viewer-image" src={src} alt={work.imageAlt} decoding="async" onLoad={() => setLoaded(true)} onError={handleImageError} />}
        {open && !loaded && !failed && <p className="art-viewer-message" role="status">Loading larger image…</p>}
        {failed && <p className="art-viewer-message" role="status">This image could not be loaded. Close the viewer and try again.</p>}
      </div>
      <p className="art-viewer-caption">{work.artist} · {work.date}<span>Press Esc or click outside to close.</span></p>
    </dialog>
  </>;
}
