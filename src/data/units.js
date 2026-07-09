// Single source of truth for all 75 Phase 2 garage condos.
// Pricing confirmed by Jon 2026-07-04. Availability defaults to Available at launch.

export const UNIT_TYPES = {
  signature: {
    key: 'signature',
    name: 'Signature',
    dims: "28' x 60'",
    sqft: 1680,
    capacity: '6 vehicles*',
    price: 730800,
    levels: '22 ft ceiling · mezzanine',
    render: '/assets/units/signature.jpg',
    plan: '/assets/plans/signature-side.jpg',
    tagline: 'The flagship. A private two-story showroom with a mezzanine made for late nights and long stories.',
  },
  deluxe: {
    key: 'deluxe',
    name: 'Deluxe',
    dims: "28' x 50'",
    sqft: 1400,
    capacity: '4 vehicles*',
    price: 598500,
    levels: '22 ft ceiling · mezzanine',
    render: '/assets/units/deluxe.jpg',
    plan: '/assets/plans/deluxe-side.jpg',
    tagline: 'Room for the collection you have and the one you are still building, with a mezzanine overlooking it all.',
  },
  premier: {
    key: 'premier',
    name: 'Premier',
    dims: "20' x 45'",
    sqft: 900,
    capacity: '2 vehicles*',
    price: 391500,
    levels: '22 ft ceiling · optional mezzanine',
    render: '/assets/units/premier.jpg',
    plan: 'https://luxedreamgarage.com/wp-content/uploads/2026/04/LDG-Premier-Garage-Floor-Plan.jpg',
    tagline: 'A deep, gallery-clean bay for the pair that matters most, steps from the Luxe Club.',
  },
  standard: {
    key: 'standard',
    name: 'Standard',
    dims: "28' x 30'",
    sqft: 840,
    capacity: '2 vehicles*',
    price: 365400,
    levels: '22 ft ceiling · optional mezzanine',
    render: '/assets/units/standard.jpg',
    plan: '/assets/plans/standard-side.jpg',
    tagline: 'Your first foothold at Waterside. Every ownership privilege, sized for two.',
  },
};

const typeForUnit = (n) => {
  if (n >= 1 && n <= 13) return 'signature';
  if (n >= 14 && n <= 25) return 'deluxe';
  if (n >= 26 && n <= 43) return 'premier';
  if (n >= 44 && n <= 58) return 'deluxe';
  return 'standard'; // 59-75
};

export const UNITS = Array.from({ length: 75 }, (_, i) => {
  const n = i + 1;
  return { n, type: typeForUnit(n), status: 'available' };
});

export const fmtPrice = (p) => '$' + p.toLocaleString('en-US');
export const fmtSqft = (s) => s.toLocaleString('en-US');

// ---- Site plan hotspot geometry ----
// Coordinates live in the 1000x1600 pixel space of /assets/siteplan.jpg.
// Each column is parametric: first unit's center y, per-row spacing, box x/w/h.
// Calibrated against the artwork; tweak here if overlay drifts.

const COLUMNS = [
  // West building, Deluxe segment: 58 (top) down to 44. 28 ft row pitch.
  { from: 58, to: 44, x: 314, w: 66, h: 31, y0: 200, dy: 36.4 },
  // West building, Premier segment: 43 down to 26. 20 ft row pitch, gap after 44.
  { from: 43, to: 26, x: 316, w: 58, h: 21, y0: 750, dy: 25.3 },
  // Center building, Signature column: 13 (top) down to 1
  { from: 13, to: 1, x: 458, w: 84, h: 31, y0: 300, dy: 36.6 },
  // Center building, Deluxe column: 14 (top) down to 25
  { from: 14, to: 25, x: 546, w: 64, h: 31, y0: 342, dy: 36.2 },
  // East building, Standard column: 59 (top) down to 75
  { from: 59, to: 75, x: 686, w: 42, h: 31, y0: 342, dy: 36.4 },
];

export const UNIT_RECTS = COLUMNS.flatMap(({ from, to, x, w, h, y0, dy }) => {
  const step = from < to ? 1 : -1;
  const count = Math.abs(to - from) + 1;
  return Array.from({ length: count }, (_, i) => {
    const n = from + i * step;
    return { n, x, y: y0 + i * dy - h / 2, w, h };
  });
});
