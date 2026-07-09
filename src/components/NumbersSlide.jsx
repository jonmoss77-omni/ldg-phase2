import { useMemo, useState } from 'react';
import { SCENARIOS } from '../data/investment';
import { UNIT_TYPES, fmtPrice } from '../data/units';

// Growth rates trace to the underwriting docs ("Est. annual value growth"):
// Phase II Pricing (all cash) 4.00%, Financial Analysis (financed) 5.00%.
const GROWTH = { allCash: 0.04, financed: 0.05 };

const DOCS = [
  {
    href: '/assets/docs/LDG-Waterside-Financial-Analysis.pdf',
    name: 'Financial Analysis',
    sub: 'Financed scenario · 50% LTV · 10-year hold',
  },
  {
    href: '/assets/docs/LDG-Waterside-Phase-II-Pricing.pdf',
    name: 'Phase II Pricing',
    sub: 'All-cash scenario · presale pricing schedule',
  },
];

function CashFlowChart({ flows }) {
  const w = 640, h = 220, pad = 26;
  const max = Math.max(...flows.map(Math.abs));
  const barW = (w - pad * 2) / flows.length;
  const zero = h / 2;
  const scale = (h / 2 - 24) / max;
  const fmt = (v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : v);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="cf-chart" role="img" aria-label="Projected annual cash flow">
      <line x1={pad} y1={zero} x2={w - pad} y2={zero} stroke="#c9c2b4" strokeWidth="1" />
      {flows.map((v, i) => {
        const bh = Math.max(2, Math.abs(v) * scale);
        const x = pad + i * barW + 3;
        const y = v >= 0 ? zero - bh : zero;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW - 6} height={bh} rx="2"
              fill={v >= 0 ? '#1e7d4f' : '#b3452e'} fillOpacity="0.85" />
            <text x={x + (barW - 6) / 2} y={h - 6} fontSize="10" textAnchor="middle" fill="#6d675e">
              {i === 0 ? 'Buy' : `Y${i}`}
            </text>
            <text x={x + (barW - 6) / 2} y={v >= 0 ? y - 4 : y + bh + 11} fontSize="8.5"
              textAnchor="middle" fill="#6d675e">{fmt(v)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function AppreciationChart({ price, growth, years }) {
  const w = 420, h = 150, padL = 8, padR = 8, padT = 14, padB = 18;
  const maxYears = 10;
  const maxVal = price * Math.pow(1 + growth, maxYears);
  const px = (yr) => padL + (yr / maxYears) * (w - padL - padR);
  const py = (v) => padT + (1 - v / maxVal) * (h - padT - padB);
  const pts = Array.from({ length: maxYears + 1 }, (_, yr) => [px(yr), py(price * Math.pow(1 + growth, yr))]);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const sel = pts[years];
  const area = `${line} L${px(maxYears)},${h - padB} L${px(0)},${h - padB} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="calc-chart" role="img" aria-label="Projected value over the holding period">
      <path d={area} fill="rgba(197,139,78,0.16)" />
      <path d={line} fill="none" stroke="#c58b4e" strokeWidth="2.5" />
      <line x1={sel[0]} y1={padT} x2={sel[0]} y2={h - padB} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 4" />
      <circle cx={sel[0]} cy={sel[1]} r="5" fill="#c58b4e" stroke="#fff" strokeWidth="2" />
      {[0, 5, 10].map((yr) => (
        <text key={yr} x={px(yr)} y={h - 4} fontSize="10" textAnchor={yr === 0 ? 'start' : yr === 10 ? 'end' : 'middle'} fill="rgba(255,255,255,0.55)">
          {yr === 0 ? 'Today' : `Year ${yr}`}
        </text>
      ))}
    </svg>
  );
}

export default function NumbersSlide() {
  const [key, setKey] = useState('financed');
  const [pop, setPop] = useState(null); // 'cashflow' | 'assumptions' | 'docs'
  const [calcType, setCalcType] = useState('deluxe');
  const [years, setYears] = useState(5);
  const s = SCENARIOS[key];
  const growth = GROWTH[key];

  const calc = useMemo(() => {
    const price = UNIT_TYPES[calcType].price;
    const future = price * Math.pow(1 + growth, years);
    return { price, future, gain: future - price, pct: (future / price - 1) * 100 };
  }, [calcType, years, growth]);

  return (
    <div className="slide-light slide-numbers" style={{ position: 'absolute', inset: 0 }}>
      <div className="slide-pad">
        <div className="slide-head">
          <h2 className="rise">The garage that pays for the next car.</h2>
          <p className="rise d1">
            A garage condo at Waterside is deeded Florida real estate. Use it,
            lease it, or sell it. Every figure below traces to the developer&rsquo;s
            underwriting documents.
          </p>
        </div>

        <div className="num-layout">
          <div className="num-main">
            <div className="inv-toggle rise d1">
              {Object.values(SCENARIOS).map((sc) => (
                <button key={sc.key} className={sc.key === key ? 'chip active' : 'chip'} onClick={() => setKey(sc.key)}>
                  {sc.label}
                </button>
              ))}
            </div>
            <p className="inv-basis rise d1">{s.unitBasis} · {s.holdYears}-year hold</p>

            <div className="inv-metrics rise d2">
              {[
                ['IRR', s.metrics.irr],
                ['Gross profit', s.metrics.grossProfit],
                ['Avg cap rate', s.metrics.avgCapRate],
                ['Yield on cost', s.metrics.yieldOnCost],
                ['Cash on cash', s.metrics.cashOnCash],
              ].map(([label, value]) => (
                <div className="inv-metric" key={label}>
                  <span className="spec-label">{label}</span>
                  <span className="inv-value">{value}</span>
                </div>
              ))}
            </div>

            <div className="insight-row rise d3">
              <button className="insight-btn" onClick={() => setPop('cashflow')}>
                <span className="ib-icon">▦</span> 10-year cash flow
              </button>
              <button className="insight-btn" onClick={() => setPop('assumptions')}>
                <span className="ib-icon">≡</span> Underwriting assumptions
              </button>
              <button className="insight-btn" onClick={() => setPop('docs')}>
                <span className="ib-icon">↓</span> Download the Investment Overview
              </button>
            </div>

            <p className="footnote num-foot">
              Source: Luxe Dream Garage Waterside underwriting (Financial
              Analysis and Phase II Pricing, Omni Group Ventures). Projections
              are estimates, not a guarantee of future performance. Confirm all
              figures in your purchase documents.
            </p>
          </div>

          <div className="num-side rise d2">
            <div className="calc-card">
              <h3>What could your unit be worth?</h3>
              <p className="calc-sub">
                Pick a model and a holding period. Growth uses the underwriting&rsquo;s
                estimated annual value growth of {(growth * 100).toFixed(0)}% for
                this scenario.
              </p>
              <div className="calc-row">
                {Object.values(UNIT_TYPES).map((t) => (
                  <button
                    key={t.key}
                    className={calcType === t.key ? 'calc-chip active' : 'calc-chip'}
                    onClick={() => setCalcType(t.key)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <div className="calc-slider-row">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  aria-label="Holding period in years"
                />
                <span className="calc-years">{years} {years === 1 ? 'year' : 'years'}</span>
              </div>
              <div className="calc-readout">
                <div>
                  <span className="cr-label">Projected value · year {years}</span>
                  <span className="cr-big">{fmtPrice(Math.round(calc.future))}</span>
                </div>
                <div>
                  <span className="cr-label">Projected appreciation</span>
                  <span className="cr-small">+{fmtPrice(Math.round(calc.gain))} · {calc.pct.toFixed(0)}%</span>
                </div>
              </div>
              <AppreciationChart price={calc.price} growth={growth} years={years} />
              <p className="calc-note">
                Presale price {fmtPrice(calc.price)} for the {UNIT_TYPES[calcType].name}.
                Projection compounds the underwriting growth estimate only; it
                excludes lease income, costs, and taxes, and is not a guarantee.
              </p>
            </div>
          </div>
        </div>
      </div>

      {pop && (
        <div className="insight-scrim" onClick={() => setPop(null)}>
          <div className="insight-pop" onClick={(e) => e.stopPropagation()}>
            <button className="up-close" onClick={() => setPop(null)} aria-label="Close">×</button>
            {pop === 'cashflow' && (
              <>
                <h3>Projected annual cash flow · {s.label}</h3>
                <CashFlowChart flows={s.cashFlows} />
                <p className="footnote" style={{ marginTop: 10 }}>
                  Year 10 includes net sale proceeds. Figures verbatim from the
                  underwriting cash flow schedule.
                </p>
              </>
            )}
            {pop === 'assumptions' && (
              <>
                <h3>Underwriting assumptions · {s.label}</h3>
                <div className="inv-assumptions">
                  <table>
                    <tbody>
                      {s.assumptions.map(([k2, v]) => (
                        <tr key={k2}><td>{k2}</td><td>{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {pop === 'docs' && (
              <>
                <h3>Investment Overview</h3>
                <div className="doc-list">
                  {DOCS.map((d) => (
                    <a key={d.href} className="doc-link" href={d.href} download>
                      <span className="dl-icon">⤓</span>
                      <span>
                        {d.name}
                        <span className="dl-sub">{d.sub}</span>
                      </span>
                    </a>
                  ))}
                </div>
                <p className="footnote" style={{ marginTop: 12 }}>
                  Both underwriting documents are provided by Omni Group
                  Ventures. Share them with your advisor.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
