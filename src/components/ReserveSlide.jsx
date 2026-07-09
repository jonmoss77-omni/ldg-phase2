import { SALES_CONTACT } from '../data/investment';

export default function ReserveSlide() {
  return (
    <div className="slide-reserve" style={{ position: 'absolute', inset: 0 }}>
      <div className="reserve-bg" style={{ backgroundImage: 'url(/assets/hero.jpg)' }} />
      <div className="reserve-content">
        <h2 className="rise">The collection is waiting on the collector.</h2>
        <p className="rise d1">
          Phase 2 breaks ground once presale commitments are in place. Early
          reservations choose their unit first.
        </p>
        <div className="hero-ctas rise d2" style={{ justifyContent: 'center' }}>
          <a className="cta" href="https://luxedreamgarage.com/reserve-your-unit/" target="_blank" rel="noreferrer">
            Reserve your garage condo
          </a>
          <a className="cta cta-ghost" href={`mailto:${SALES_CONTACT.email}`}>
            Talk to sales · {SALES_CONTACT.brokerage}
          </a>
        </div>
        <p className="footnote reserve-note rise d3">
          Luxe Dream Garage Waterside Phase 2 · 7100 Professional Parkway East,
          Sarasota, FL 34240 · An Omni Group Ventures development. All imagery
          is an artist impression of the completed project.
        </p>
      </div>
    </div>
  );
}
