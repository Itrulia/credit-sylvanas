// Copy from DESIGN §7. Each label has an info popover; the full sentence goes on About.
export const GLOSSARY = {
  marketValue: {
    label: 'Market value',
    text: 'What this usually sells for right now, based on auction listings over the last couple of weeks.',
  },
  historical: {
    label: '60-day average',
    text: 'Market value averaged over about 60 days. Compare it with market value to spot spikes and dips.',
  },
  avgSalePrice: {
    label: 'Avg. sale price',
    text: 'What buyers actually paid on average when this item sold.',
  },
  saleRate: {
    label: 'Sale rate',
    text: 'Share of listings that sell. 25% means about 1 in 4 auctions finds a buyer.',
  },
  // the per-realm vs region-total wording still needs a human check against the TSM docs before launch
  soldPerDay: {
    label: 'Sold per day',
    text: 'Average units sold per day across the region.',
  },
  minBuyout: {
    label: 'Lowest buyout',
    text: 'Cheapest buyout on this realm at the last scan.',
  },
  recent: {
    label: 'Latest scan value',
    text: 'Market value from the most recent scan only. Reacts fast but can be noisy.',
  },
  goldPerDay: {
    label: 'Gold per day',
    text: 'Sold per day times average sale price.',
  },
  vsHist: {
    label: 'vs 60-day avg',
    text: "How today's market value compares with the 60-day average. +20% means 20% pricier than usual.",
  },
  change: {
    label: 'Change',
    text: 'Market value change since the previous daily update.',
  },
  popularity: {
    label: 'Popularity',
    text: 'Change in units sold per day. Only items that sold at least one a day before the change count.',
  },
  index: {
    label: 'Cross-region index',
    text: "How this region's market value compares with the middle value across US, EU, KR and TW. +20% means 20% pricier than the typical region.",
  },
  spread: {
    label: 'Spread',
    text: 'Gap between the cheapest and priciest region, as a share of the median. A high spread means the same item costs very different amounts by region.',
  },
} as const

export type GlossaryKey = keyof typeof GLOSSARY
