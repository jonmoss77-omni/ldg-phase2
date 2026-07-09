import { useEffect } from 'react';
import { UNITS, UNIT_TYPES, fmtPrice, fmtSqft } from '../data/units';

export default function UnitPopup({ unitN, onClose, onStep, onWalkthrough }) {
  const unit = UNITS.find((u) => u.n === unitN);
  const type = UNIT_TYPES[unit.type];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="unit-popup-scrim" onClick={onClose}>
      <div className="unit-popup" onClick={(e) => e.stopPropagation()}>
        <div className="up-media">
          <div className="up-badges">
            <span className="badge badge-available">Available for presale</span>
            <span className="badge badge-impression">Artist impression</span>
          </div>
          <img className="up-render" src={type.render} alt={`${type.name} garage condo rendering`} />
          <div className="up-plan">
            <img src={type.plan} alt={`${type.name} unit plan`} />
          </div>
        </div>
        <div className="up-body">
          <div className="panel-title-row">
            <h2>Unit {unit.n}</h2>
            <span className="type-pill">{type.name}</span>
          </div>
          <p className="tagline">{type.tagline}</p>

          <div className="spec-grid">
            <div className="spec">
              <span className="spec-label">Footprint</span>
              <span className="spec-value">{type.dims}</span>
            </div>
            <div className="spec">
              <span className="spec-label">Area</span>
              <span className="spec-value">{fmtSqft(type.sqft)} SF</span>
            </div>
            <div className="spec">
              <span className="spec-label">Capacity</span>
              <span className="spec-value">{type.capacity}</span>
            </div>
            <div className="spec">
              <span className="spec-label">Ceiling & layout</span>
              <span className="spec-value">{type.levels}</span>
            </div>
          </div>

          <div className="price-row">
            <div>
              <span className="spec-label">Presale price</span>
              <div className="price">{fmtPrice(type.price)}</div>
            </div>
            <a
              className="cta"
              href="https://luxedreamgarage.com/reserve-your-unit/"
              target="_blank"
              rel="noreferrer"
            >
              Reserve Unit {unit.n}
            </a>
          </div>

          <button className="cta cta-ghost-ink cta-small" style={{ marginTop: 12 }} onClick={onWalkthrough}>
            Step inside a {type.name} in 360&deg;
          </button>

          <p className="footnote">
            *Vehicle capacity shown with optional lift configuration. All
            imagery is an artist impression of the completed Phase 2.
          </p>
        </div>

        <div className="up-step">
          <button onClick={() => onStep(-1)} aria-label="Previous unit">‹</button>
          <button onClick={() => onStep(1)} aria-label="Next unit">›</button>
        </div>
        <button className="up-close" onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>
  );
}
