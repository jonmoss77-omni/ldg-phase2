import { useCallback, useEffect, useRef, useState } from 'react';
import WelcomeSlide from './components/WelcomeSlide';
import LocationSlide from './components/LocationSlide';
import SitePlanSlide from './components/SitePlanSlide';
import WalkthroughSlide from './components/WalkthroughSlide';
import NumbersSlide from './components/NumbersSlide';
import ReserveSlide from './components/ReserveSlide';

const SLIDES = [
  { key: 'welcome', label: 'Welcome', Comp: WelcomeSlide },
  { key: 'location', label: 'Location', Comp: LocationSlide },
  { key: 'siteplan', label: 'Site Plan', Comp: SitePlanSlide },
  { key: 'walkthrough', label: 'Walk Through', Comp: WalkthroughSlide },
  { key: 'numbers', label: 'The Numbers', Comp: NumbersSlide },
  { key: 'reserve', label: 'Reserve', Comp: ReserveSlide },
];

export default function App() {
  const initial = (() => {
    const k = window.location.hash.replace('#', '');
    const i = SLIDES.findIndex((s) => s.key === k);
    return i >= 0 ? i : 0;
  })();
  const [index, setIndex] = useState(initial);
  const [visited, setVisited] = useState(() => new Set([initial]));
  const indexRef = useRef(index);

  const goTo = useCallback((i) => {
    const next = Math.max(0, Math.min(SLIDES.length - 1, i));
    indexRef.current = next;
    setIndex(next);
    setVisited((v) => (v.has(next) ? v : new Set(v).add(next)));
    history.replaceState(null, '', `#${SLIDES[next].key}`);
  }, []);
  const step = useCallback((d) => goTo(indexRef.current + d), [goTo]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  // Warm the Cesium chunk (~1.3MB gzip) while the visitor is still on the
  // opening slide, so the 3D aerial is ready the moment they reach Location.
  useEffect(() => {
    const t = setTimeout(() => { import('cesium'); }, 2500);
    return () => clearTimeout(t);
  }, []);

  // Touch swipe
  const touch = useRef(null);
  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  };

  return (
    <div className="deck" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="topbar">
        <button className="brand" onClick={() => goTo(0)}>
          <img className="brand-logo" src="/assets/brand/ldg-logo.png" alt="Luxe Dream Garage" />
          <span className="brand-sub">Waterside Phase 2</span>
        </button>
        <nav className="tabs">
          {SLIDES.slice(0, 5).map((s, i) => (
            <button key={s.key} className={i === index ? 'tab active' : 'tab'} onClick={() => goTo(i)}>
              {s.label}
            </button>
          ))}
        </nav>
        <a className="cta cta-small" href="https://luxedreamgarage.com/reserve-your-unit/" target="_blank" rel="noreferrer">
          Reserve
        </a>
      </header>

      {SLIDES.map((s, i) => {
        const offset = i - index;
        const near = Math.abs(offset) <= 1;
        return (
          <section
            key={s.key}
            className={`slide${near ? ' on-deck' : ''}${offset === 0 ? ' active' : ''}`}
            style={{ transform: `translateX(${offset * 100}%)` }}
            aria-hidden={offset !== 0}
          >
            <s.Comp active={offset === 0} mounted={visited.has(i)} near={near} goNext={() => step(1)} goTo={goTo} />
          </section>
        );
      })}

      <button className="deck-arrow prev" onClick={() => step(-1)} disabled={index === 0} aria-label="Previous">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <button className="deck-arrow next" onClick={() => step(1)} disabled={index === SLIDES.length - 1} aria-label="Next">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>

      <div className="deck-dots" role="tablist" aria-label="Slides">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            className={i === index ? 'deck-dot active' : 'deck-dot'}
            onClick={() => goTo(i)}
            aria-label={s.label}
          />
        ))}
      </div>
    </div>
  );
}
