// Underwriting figures transcribed verbatim from Jon's Investment Docs
// (Documents/Investment Docs, LUXE Dream Garage Waterside):
// - "Financials - Phase II Pricing.pdf"  -> allCash scenario (1,260 SF, no debt)
// - "Financial Analysis.pdf"             -> financed scenario (1,308 SF unit average, 50% LTV)
// Do not edit numbers without a source document.

export const SCENARIOS = {
  allCash: {
    key: 'allCash',
    label: 'All cash',
    unitBasis: '1,260 SF unit, Phase 2 presale pricing, no financing',
    holdYears: 10,
    metrics: {
      irr: '8.65%',
      grossProfit: '$611,024',
      avgCapRate: '8.11%',
      yieldOnCost: '7.38%',
      cashOnCash: '7.01%',
    },
    assumptions: [
      ['Purchase price', '$567,000 ($450 / SF)'],
      ['Closing costs', '5.00% ($28,350)'],
      ['Total cost basis', '$622,926'],
      ['Lease income (NNN)', '$29 / SF ($36,540 / yr)'],
      ['Annual rent escalations', '5.00%'],
      ['General vacancy', '5.00%'],
      ['Est. annual value growth', '4.00%'],
      ['Terminal value (yr 10)', '$839,299'],
      ['Net sale proceeds', '$797,334'],
    ],
    cashFlows: [-622926, 34713, 36449, 38271, 40185, 42194, 44304, 46519, 48845, 51287, 851185],
  },
  financed: {
    key: 'financed',
    label: 'Financed · 50% LTV',
    unitBasis: '1,308 SF unit average, 50% LTV, 5.5% interest, 25-year amortization',
    holdYears: 10,
    metrics: {
      irr: '10.68%',
      grossProfit: '$512,273',
      avgCapRate: '7.12%',
      yieldOnCost: '6.52%',
      cashOnCash: '5.20%',
    },
    assumptions: [
      ['Purchase price', '$577,443 ($441 / SF)'],
      ['Closing costs', '5.00% ($28,872)'],
      ['Total cost basis', '$630,993'],
      ['Loan amount', '$288,722 (50% LTV)'],
      ['Annual loan payment', '$21,276'],
      ['Lease income (NNN)', '$25 / SF ($32,700 / yr)'],
      ['Annual rent escalations', '5.00%'],
      ['General vacancy', '5.00%'],
      ['Est. annual value growth', '5.00%'],
      ['Terminal value (yr 10)', '$940,594'],
      ['Net sale proceeds', '$893,564'],
    ],
    cashFlows: [-342271, 9789, 11342, 12973, 14686, 16484, 18372, 20354, 22436, 24621, 703488],
  },
};

export const SALES_CONTACT = {
  brokerage: 'Compass Florida',
  email: 'adnan.dedic@compass.com',
};
