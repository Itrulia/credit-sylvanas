import { m } from '#/paraglide/messages.js'

// Copy from DESIGN §7, in m.shell. Each label has an info popover; the full sentence goes on About.
export const GLOSSARY = {
  marketValue: {
    label: m.shell_glossaryMarketValueLabel(),
    text: m.shell_glossaryMarketValueText(),
  },
  historical: {
    label: m.shell_glossaryHistoricalLabel(),
    text: m.shell_glossaryHistoricalText(),
  },
  avgSalePrice: {
    label: m.shell_glossaryAvgSalePriceLabel(),
    text: m.shell_glossaryAvgSalePriceText(),
  },
  saleRate: {
    label: m.shell_glossarySaleRateLabel(),
    text: m.shell_glossarySaleRateText(),
  },
  // the per-realm vs region-total wording still needs a human check against the TSM docs before launch
  soldPerDay: {
    label: m.shell_glossarySoldPerDayLabel(),
    text: m.shell_glossarySoldPerDayText(),
  },
  minBuyout: {
    label: m.shell_glossaryMinBuyoutLabel(),
    text: m.shell_glossaryMinBuyoutText(),
  },
  recent: {
    label: m.shell_glossaryRecentLabel(),
    text: m.shell_glossaryRecentText(),
  },
  goldPerDay: {
    label: m.shell_glossaryGoldPerDayLabel(),
    text: m.shell_glossaryGoldPerDayText(),
  },
  vsHist: {
    label: m.shell_glossaryVsHistLabel(),
    text: m.shell_glossaryVsHistText(),
  },
  change: {
    label: m.shell_glossaryChangeLabel(),
    text: m.shell_glossaryChangeText(),
  },
  popularity: {
    label: m.shell_glossaryPopularityLabel(),
    text: m.shell_glossaryPopularityText(),
  },
  rising: {
    label: m.shell_glossaryRisingLabel(),
    text: m.shell_glossaryRisingText(),
  },
  index: {
    label: m.shell_glossaryIndexLabel(),
    text: m.shell_glossaryIndexText(),
  },
  volatile: {
    label: m.shell_glossaryVolatileLabel(),
    text: m.shell_glossaryVolatileText(),
  },
  spread: {
    label: m.shell_glossarySpreadLabel(),
    text: m.shell_glossarySpreadText(),
  },
} as const

export type GlossaryKey = keyof typeof GLOSSARY
