import { UNITS, UNIT_TYPES, UNIT_RECTS } from '../data/units';

// Brand palette tuned for the dark technical drawing
const TYPE_COLORS = {
  signature: '#d09659',
  deluxe: '#9cc3d9',
  premier: '#a9d2a6',
  standard: '#d8d0c1',
};

const INK_BG = '#131110';
const PAVE = '#242220';
const PAVE_EDGE = 'rgba(255, 255, 255, 0.07)';
const CARD = '#1c1916';
const CARD_EDGE = 'rgba(197, 139, 78, 0.55)';
const COPPER = '#c58b4e';
const LABEL = 'rgba(244, 239, 231, 0.88)';
const FAINT = 'rgba(244, 239, 231, 0.4)';

// Site pad and roads, traced from the architect plan (viewBox 1000x1600)
const PAVEMENT =
  'M302,196 L388,166 L520,236 L660,268 L736,318 L736,978 L692,1004 ' +
  'L692,1240 L722,1318 L642,1420 L420,1434 L298,1408 L260,1322 L302,1240 Z';
const PARKWAY = 'M120,1548 L920,1312 L920,1384 L120,1620 Z';
const ENTRY_DRIVE = 'M640,1396 L744,1350 L770,1396 L668,1444 Z';

function Amenity({ x, y, w, h, lines, sub }) {
  const cy = y + h / 2;
  const base = sub ? cy - 2 : cy + (lines.length === 2 ? -3 : 4);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" fill={CARD} stroke={CARD_EDGE} strokeWidth="1.2" />
      {lines.map((t, i) => (
        <text
          key={t}
          x={x + w / 2}
          y={base + i * 14}
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          letterSpacing="2.2"
          fill={COPPER}
        >
          {t}
        </text>
      ))}
      {sub && (
        <text x={x + w / 2} y={base + lines.length * 14} textAnchor="middle" fontSize="8.5" fill={FAINT}>
          {sub}
        </text>
      )}
    </g>
  );
}

function StallRow({ x, y, w, h, step = 13 }) {
  const ticks = [];
  for (let tx = x + step; tx < x + w; tx += step) {
    ticks.push(<line key={tx} x1={tx} y1={y} x2={tx} y2={y + h} stroke={PAVE_EDGE} strokeWidth="0.8" />);
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={PAVE_EDGE} strokeWidth="1" />
      {ticks}
    </g>
  );
}

export default function SitePlan({ selected, onSelect, activeType }) {
  const unitByN = Object.fromEntries(UNITS.map((u) => [u.n, u]));

  const galleryHatch = [];
  for (let y = 822; y <= 1072; y += 14) {
    galleryHatch.push(
      <line key={`a${y}`} x1="464" y1={y} x2="528" y2={y} stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" />,
      <line key={`b${y}`} x1="546" y1={y} x2="608" y2={y} stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" />,
    );
  }

  return (
    <div className="siteplan-wrap">
      <svg
        viewBox="0 0 1000 1600"
        className="siteplan-svg"
        role="img"
        aria-label="Phase 2 site plan, a technical drawing with all 75 garage condos"
      >
        {/* Sheet */}
        <rect x="0" y="0" width="1000" height="1600" fill={INK_BG} />
        {/* Preserve planting, kept barely-there */}
        <g fill="#1a2018" opacity="0.55">
          <ellipse cx="140" cy="560" rx="210" ry="500" />
          <ellipse cx="880" cy="720" rx="150" ry="540" />
          <ellipse cx="480" cy="70" rx="470" ry="120" />
          <ellipse cx="180" cy="1500" rx="200" ry="150" />
          <ellipse cx="880" cy="1520" rx="200" ry="150" />
        </g>
        <rect x="16" y="16" width="968" height="1568" fill="none" stroke="rgba(197,139,78,0.32)" strokeWidth="1.4" />

        {/* Sheet title block */}
        <text x="958" y="58" textAnchor="end" fontSize="15" fontWeight="700" letterSpacing="3.4" fill={COPPER}>
          WATERSIDE · PHASE 2
        </text>
        <text x="958" y="80" textAnchor="end" fontSize="10.5" letterSpacing="2.6" fill={FAINT}>
          SITE PLAN · 75 GARAGE CONDOS · GATED CAMPUS
        </text>

        {/* Ground */}
        <path d={PAVEMENT} fill={PAVE} stroke={PAVE_EDGE} strokeWidth="1.5" />
        <path d={PARKWAY} fill="#201e1c" stroke={PAVE_EDGE} strokeWidth="1.2" />
        <line x1="140" y1="1583" x2="915" y2="1348" stroke="rgba(255,255,255,0.16)" strokeWidth="1.4" strokeDasharray="16 12" />
        <path d={ENTRY_DRIVE} fill={PAVE} stroke={PAVE_EDGE} strokeWidth="1.2" />

        {/* Gated entry marker */}
        <line x1="654" y1="1394" x2="686" y2="1380" stroke={COPPER} strokeWidth="2.4" />
        <circle cx="654" cy="1394" r="3.4" fill={COPPER} />
        <circle cx="686" cy="1380" r="3.4" fill={COPPER} />
        <text x="740" y="1478" textAnchor="middle" fontSize="10.5" letterSpacing="2.4" fill={COPPER} transform="rotate(-16.5 740 1478)">
          GATED ENTRY
        </text>

        {/* Road labels */}
        <text x="470" y="1502" fontSize="21" letterSpacing="6" fill={LABEL} textAnchor="middle" transform="rotate(-16.5 470 1502)">
          PROFESSIONAL PARKWAY
        </text>
        <text x="152" y="700" fontSize="19" letterSpacing="6" fill={FAINT} textAnchor="middle" transform="rotate(-90 152 700)">
          COMMUNICATIONS PARKWAY
        </text>

        {/* Amenities */}
        <Amenity x={468} y={752} w={144} h={36} lines={['DETAIL BAY']} />
        <g>
          <rect x="452" y="800" width="168" height="292" rx="4" fill={CARD} stroke={CARD_EDGE} strokeWidth="1.2" />
          {galleryHatch}
          <rect x="452" y="915" width="168" height="66" fill={INK_BG} opacity="0.86" />
          <text x="536" y="944" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="2.6" fill={COPPER}>
            THE GALLERY
          </text>
          <text x="536" y="960" textAnchor="middle" fontSize="8.5" fill={FAINT}>
            VERTICAL CAR STORAGE
          </text>
        </g>
        <Amenity x={452} y={1102} w={168} h={78} lines={['LUXE CLUB', 'SHOWROOM']} />
        <Amenity x={430} y={1190} w={190} h={42} lines={['VALET']} />
        <Amenity x={306} y={1194} w={62} h={30} lines={['DETAIL']} />
        <Amenity x={306} y={1232} w={50} h={58} lines={['LOUNGE']} />

        {/* Guest parking */}
        <StallRow x={318} y={1300} w={116} h={58} />
        <StallRow x={452} y={1312} w={150} h={58} />

        {/* Units */}
        {UNIT_RECTS.map((r) => {
          const unit = unitByN[r.n];
          const type = UNIT_TYPES[unit.type];
          const isSelected = selected === r.n;
          const dimmed = activeType && unit.type !== activeType;
          const small = r.h < 26;
          const cx = r.x + r.w / 2;
          const cy = r.y + r.h / 2;
          return (
            <g
              key={r.n}
              data-unit={r.n}
              className={`unit-hotspot${isSelected ? ' selected' : ''}${dimmed ? ' dimmed' : ''}`}
              onClick={() => onSelect(r.n)}
            >
              <rect
                className="unit-block"
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                rx="2.5"
                fill={TYPE_COLORS[unit.type]}
                fillOpacity={dimmed ? 0.08 : 0.85}
                stroke={isSelected ? '#ffffff' : 'rgba(12,11,10,0.6)'}
                strokeWidth={isSelected ? 2.4 : 1}
              />
              <circle
                cx={cx}
                cy={cy}
                r={small ? 8.6 : 11}
                fill={isSelected ? COPPER : 'rgba(12, 11, 10, 0.5)'}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1.1"
                opacity={dimmed ? 0.25 : 1}
              />
              <text
                x={cx}
                y={cy + (small ? 3.4 : 4.2)}
                textAnchor="middle"
                fontSize={small ? 10 : 12}
                fontWeight="650"
                fill="#fff"
                opacity={dimmed ? 0.3 : 1}
              >
                {r.n}
              </text>
              <title>{`Unit ${r.n} · ${type.name} · ${type.dims}`}</title>
            </g>
          );
        })}

        {/* Compass, matching the plan's true-north arrow */}
        <g transform="translate(862 1178)">
          <g transform="rotate(38)">
            <line x1="0" y1="26" x2="0" y2="-18" stroke={COPPER} strokeWidth="2" />
            <polygon points="0,-32 -8,-12 8,-12" fill={COPPER} />
          </g>
          <text x="-26" y="30" fontSize="14" fontWeight="700" fill={LABEL}>
            N
          </text>
        </g>
      </svg>
    </div>
  );
}

export { TYPE_COLORS };
