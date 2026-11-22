import type { Catalog } from '../types'

export const shell = {
  // document title, shared by pageHead() and the state pages
  docTitle: ({ page, site }: { page: string; site: string }) =>
    `${page} · ${site}`,

  skipLink: () => 'Skip to content',

  // header
  wordmarkLead: () => 'Credit',
  wordmarkAccent: () => 'Sylvanas',
  mainNavLabel: () => 'Main',
  navMarket: () => 'Market',
  navItems: () => 'Items',
  navHeatmaps: () => 'Heatmaps',
  navRealms: () => 'Realms',
  searchLabel: () => 'Search',
  menuOpenLabel: () => 'Open menu',
  menuTitle: () => 'Menu',

  // region switcher
  regionNavLabel: () => 'Region',
  regionComingLater: ({ region }: { region: string }) =>
    `${region}: coming later`,

  // footer and credit
  footerAbout: () => 'About and data sources',
  footerPrivacy: () => 'Privacy',
  footerImpressum: () => 'Impressum',
  creditLead: () => 'Pricing data from',
  creditLink: () => 'TradeSkillMaster',
  notAffiliated: () =>
    'Credit Sylvanas is a fan project. It is not affiliated with or endorsed by TradeSkillMaster or Blizzard Entertainment. World of Warcraft is a trademark of Blizzard Entertainment, Inc.',
  contactPending: () =>
    "We haven't published a contact address yet. It will appear here.",

  // context bar and freshness
  realmSelected: ({ name }: { name: string }) => `Realm: ${name}`,
  realmAll: () => 'All realms (region)',
  realmNoneTitle: () => "Realm prices aren't available yet.",
  realmNoneBody: ({ region }: { region: string }) =>
    `Forever realm names aren't published anywhere, so we haven't added any realms. Region prices below cover every ${region} realm.`,
  factionLabel: () => 'Faction',
  factionAlliance: () => 'alliance',
  factionHorde: () => 'horde',
  freshnessScanLead: () => 'Prices from TSM scan',
  freshnessImportedLead: () => ', imported',
  staleTitle: () => 'Prices may be out of date.',
  staleBody: ({ date }: { date: string }) =>
    `Last update: ${date}. We're showing the last good data until the next update arrives.`,

  // 404
  notFoundDocPage: () => 'Page not found',
  notFoundTitle: () => 'Page not found.',
  notFoundBody: () =>
    "That page doesn't exist. Try searching for an item instead.",
  notFoundMarketLink: ({ region }: { region: string }) =>
    `Go to ${region} market`,
  notFoundRegionTitle: ({ value }: { value: string }) =>
    `There's no "${value}" region.`,
  notFoundRegionList: ({ regions }: { regions: string }) =>
    `Prices are available for ${regions}.`,
  notFoundRealmTitle: ({ value }: { value: string }) =>
    `We don't track "${value}" yet.`,
  notFoundRealmLink: ({ region }: { region: string }) =>
    `See ${region} region prices`,

  // 500 and section errors
  errorDocPage: () => 'Something broke',
  errorTitle: () => 'Something broke on our side.',
  errorBody: () =>
    "We've logged the error. Try again, or come back in a few minutes.",
  retry: () => 'Try again',
  sectionErrorTitle: () => "These prices didn't load.",
  sectionErrorBody: () => 'Try again in a moment.',

  // 503
  noDataTitle: () => 'No prices yet',
  noDataBody: () =>
    "This site hasn't finished its first daily price update. Prices appear here after it runs.",
  noDataRegionTitle: ({ region }: { region: string }) =>
    `No ${region} prices yet`,
  noDataRegionLead: ({ region }: { region: string }) =>
    `We haven't saved a price update for ${region}. Last successful import:`,
  noDataNoneYet: () => 'none yet',
  noDataRegionTail: () => '. Try another region in the meantime.',
  noDataDevHint: () => 'Dev only: run pnpm db:seed to load local data.',

  // charts, tables, values
  chartShowTable: () => 'Show as table',
  chartHideTable: () => 'Hide table',
  tableScrollLabel: ({ label }: { label: string }) =>
    `${label}, scrolls sideways`,
  infoLabel: ({ term }: { term: string }) => `What is ${term}?`,
  noData: () => 'No data',
  wowheadView: () => 'View on Wowhead',
  wowheadOpens: () => '(opens Wowhead)',

  // Delta screen reader text; value is the unsigned percentage number
  deltaNoHistory: () => 'Not enough history yet',
  deltaUnchanged: () => 'unchanged',
  deltaUp: ({ value }: { value: string }) => `up ${value} percent`,
  deltaDown: ({ value }: { value: string }) => `down ${value} percent`,
  deltaHistSame: () => 'about the same as the 60-day average',
  deltaAboveHist: ({ value }: { value: string }) =>
    `${value} percent above 60-day average`,
  deltaBelowHist: ({ value }: { value: string }) =>
    `${value} percent below 60-day average`,
  deltaDefaultReference: () => 'the cross-region median',
  deltaRefSame: ({ reference }: { reference: string }) =>
    `about the same as ${reference}`,
  deltaAboveRef: ({ value, reference }: { value: string; reference: string }) =>
    `${value} percent above ${reference}`,
  deltaBelowRef: ({ value, reference }: { value: string; reference: string }) =>
    `${value} percent below ${reference}`,

  // glossary (DESIGN §7)
  glossaryMarketValueLabel: () => 'Market value',
  glossaryMarketValueText: () =>
    'What this usually sells for right now, based on auction listings over the last couple of weeks.',
  glossaryHistoricalLabel: () => '60-day average',
  glossaryHistoricalText: () =>
    'Market value averaged over about 60 days. Compare it with market value to spot spikes and dips.',
  glossaryAvgSalePriceLabel: () => 'Avg. sale price',
  glossaryAvgSalePriceText: () =>
    'What buyers actually paid on average when this item sold.',
  glossarySaleRateLabel: () => 'Sale rate',
  glossarySaleRateText: () =>
    'Share of listings that sell. 25% means about 1 in 4 auctions finds a buyer.',
  glossarySoldPerDayLabel: () => 'Sold per day',
  glossarySoldPerDayText: () => 'Average units sold per day across the region.',
  glossaryMinBuyoutLabel: () => 'Lowest buyout',
  glossaryMinBuyoutText: () =>
    'Cheapest buyout on this realm at the last scan.',
  glossaryRecentLabel: () => 'Latest scan value',
  glossaryRecentText: () =>
    'Market value from the most recent scan only. Reacts fast but can be noisy.',
  glossaryGoldPerDayLabel: () => 'Gold per day',
  glossaryGoldPerDayText: () => 'Sold per day times average sale price.',
  glossaryVsHistLabel: () => 'vs 60-day avg',
  glossaryVsHistText: () =>
    "How today's market value compares with the 60-day average. +20% means 20% pricier than usual.",
  glossaryChangeLabel: () => 'Change',
  glossaryChangeText: () =>
    'Market value change since the previous daily update.',
  glossaryPopularityLabel: () => 'Popularity',
  glossaryPopularityText: () =>
    'Change in units sold per day. Only items that sold at least one a day before the change count.',
  glossaryRisingLabel: () => 'Rising with demand',
  glossaryRisingText: () =>
    "Market value at least 5% above 7 days ago, and today's sold per day at least 1.25 times the item's average over the previous 30 days. The item needs 14 days of data in those 30 and about 1g traded a day to count.",
  glossaryIndexLabel: () => 'vs other regions',
  glossaryIndexText: () =>
    "How this region's market value compares with the median of the regions that list the item (US, EU, KR and TW). +20% means 20% pricier than the typical region.",
  glossaryVolatileLabel: () => 'Volatile',
  glossaryVolatileText: () =>
    'Market value is under a fifth or over five times the 60-day average. Prices like that often swing back, so check recent sales before you buy or sell.',
  glossarySpreadLabel: () => 'Spread',
  glossarySpreadText: () =>
    'Gap between the cheapest and priciest region, as a share of the median. A high spread means the same item costs very different amounts by region.',
} satisfies Catalog
