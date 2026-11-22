import { m } from '#/i18n'

// Copy from DESIGN §7, in m.shell. Each label has an info popover; the full sentence goes on About.
export const GLOSSARY = {
  marketValue: {
    label: m.shell.glossaryMarketValueLabel(),
    text: m.shell.glossaryMarketValueText(),
  },
  historical: {
    label: m.shell.glossaryHistoricalLabel(),
    text: m.shell.glossaryHistoricalText(),
  },
  avgSalePrice: {
    label: m.shell.glossaryAvgSalePriceLabel(),
    text: m.shell.glossaryAvgSalePriceText(),
  },
  saleRate: {
    label: m.shell.glossarySaleRateLabel(),
    text: m.shell.glossarySaleRateText(),
  },
  // the per-realm vs region-total wording still needs a human check against the TSM docs before launch
  soldPerDay: {
    label: m.shell.glossarySoldPerDayLabel(),
    text: m.shell.glossarySoldPerDayText(),
  },
  minBuyout: {
    label: m.shell.glossaryMinBuyoutLabel(),
    text: m.shell.glossaryMinBuyoutText(),
  },
  recent: {
    label: m.shell.glossaryRecentLabel(),
    text: m.shell.glossaryRecentText(),
  },
  goldPerDay: {
    label: m.shell.glossaryGoldPerDayLabel(),
    text: m.shell.glossaryGoldPerDayText(),
  },
  vsHist: {
    label: m.shell.glossaryVsHistLabel(),
    text: m.shell.glossaryVsHistText(),
  },
  change: {
    label: m.shell.glossaryChangeLabel(),
    text: m.shell.glossaryChangeText(),
  },
  popularity: {
    label: m.shell.glossaryPopularityLabel(),
    text: m.shell.glossaryPopularityText(),
  },
  rising: {
    label: m.shell.glossaryRisingLabel(),
    text: m.shell.glossaryRisingText(),
  },
  index: {
    label: m.shell.glossaryIndexLabel(),
    text: m.shell.glossaryIndexText(),
  },
  volatile: {
    label: m.shell.glossaryVolatileLabel(),
    text: m.shell.glossaryVolatileText(),
  },
  spread: {
    label: m.shell.glossarySpreadLabel(),
    text: m.shell.glossarySpreadText(),
  },
} as const

export type GlossaryKey = keyof typeof GLOSSARY
