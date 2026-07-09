import { useState } from 'react';
import SitePlan, { TYPE_COLORS } from './SitePlan';
import UnitPopup from './UnitPopup';
import { UNITS, UNIT_TYPES, fmtPrice } from '../data/units';

export default function SitePlanSlide({ goTo }) {
  const [selected, setSelected] = useState(null);
  const [activeType, setActiveType] = useState(null);

  const list = activeType ? UNITS.filter((u) => u.type === activeType) : UNITS;
  const stepUnit = (d) => {
    if (!selected) return;
    const idx = list.findIndex((u) => u.n === selected);
    if (idx === -1) return setSelected(list[0]?.n ?? null);
    const next = list[(idx + d + list.length) % list.length];
    setSelected(next.n);
  };

  return (
    <div className="slide-siteplan-dark" style={{ position: 'absolute', inset: 0 }}>
      <div className="slide-pad">
        <div className="sp-layout">
          <div className="sp-side">
            <div className="slide-head">
              <h2 className="rise">Pick the door with your name on it.</h2>
              <p className="rise d1">
                75 garage condos across four models, from an 840 SF two-car bay
                to the 1,680 SF two-story Signature. Every one is deeded real
                estate. Tap a unit to see it.
              </p>
            </div>
            <div className="sp-chips rise d2">
              <button className={!activeType ? 'chip active' : 'chip'} onClick={() => setActiveType(null)}>
                All 75 units
              </button>
              {Object.values(UNIT_TYPES).map((t) => (
                <button
                  key={t.key}
                  className={activeType === t.key ? 'chip active' : 'chip'}
                  style={{ '--chip-color': TYPE_COLORS[t.key] }}
                  onClick={() => setActiveType(activeType === t.key ? null : t.key)}
                >
                  <span className="chip-dot" />
                  {t.name} · from {fmtPrice(t.price)}
                </button>
              ))}
            </div>
            <a
              className="cta cta-ghost cta-small sp-download rise d3"
              href="/assets/siteplan.jpg"
              download="LDG-Waterside-Phase2-Site-Plan.jpg"
            >
              &darr;&nbsp; Download the site plan
            </a>
            <p className="footnote sp-legend-note rise d3">
              All units shown available for presale. Pricing per the Phase 2
              schedule; confirm final terms in your purchase documents.
            </p>
          </div>
          <div className="sp-stage rise d1">
            <SitePlan selected={selected} onSelect={setSelected} activeType={activeType} />
          </div>
        </div>
      </div>

      {selected && (
        <UnitPopup
          unitN={selected}
          onClose={() => setSelected(null)}
          onStep={stepUnit}
          onWalkthrough={() => goTo(3)}
        />
      )}
    </div>
  );
}
