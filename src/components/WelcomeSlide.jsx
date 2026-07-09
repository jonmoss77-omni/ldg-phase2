import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function WelcomeSlide({ goNext }) {
  const [film, setFilm] = useState(false);

  useEffect(() => {
    if (!film) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setFilm(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [film]);

  return (
    <div className="slide-welcome" style={{ position: 'absolute', inset: 0 }}>
      <video className="hero-video" src="/assets/flythrough.mp4" autoPlay muted loop playsInline />
      <div className="hero-shade" />
      <div className="hero-content">
        <p className="hero-kicker rise">Luxe Dream Garage · Waterside · Sarasota, Florida</p>
        <h1 className="rise d1">Your collection deserves an address.</h1>
        <p className="hero-sub rise d2">
          75 deeded garage condos behind a private gate at Waterside. Phase 2
          presale is open. This is where it will stand.
        </p>
        <div className="hero-ctas rise d3">
          <button className="cta" onClick={() => setFilm(true)}>Watch the film</button>
          <button className="cta cta-ghost" onClick={goNext}>Begin the tour</button>
        </div>
      </div>
      <p className="hero-note">Renderings and film are artist impressions of the completed Phase 2.</p>

      {film && createPortal((
        <div className="film-modal" onClick={() => setFilm(false)} role="dialog" aria-modal="true" aria-label="Luxe Dream Garage presentation film">
          <div className="film-inner" onClick={(e) => e.stopPropagation()}>
            <button className="film-close" onClick={() => setFilm(false)} aria-label="Close">×</button>
            <iframe
              src="https://www.youtube-nocookie.com/embed/GO1zqS1fyas?autoplay=1&rel=0&playsinline=1"
              title="Luxe Dream Garage Waterside presentation film"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
