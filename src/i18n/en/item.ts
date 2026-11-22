import { plural } from '../plural'
import type { Catalog } from '../types'

const days = (n: number) => plural(n, { one: `${n} day`, other: `${n} days` })
const side = (below: boolean) => (below ? 'below' : 'above')
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAYS_PLURAL = [
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
  'Sundays',
]

export const item = {
  // page head and header
  headTitle: ({ name, region }: { name: string; region: string }) =>
    `${name} price · ${region} Forever AH`,
  headDescription: ({
    name,
    region,
    value,
    sold,
  }: {
    name: string
    region: string
    value: string
    sold: string
  }) =>
    `${name} on the ${region} Forever auction house: market value ${value}, sells about ${sold} a day. Price history updated daily.`,
  idLabel: ({ id }: { id: number }) => `#${id}`,
  volatileBadge: () => 'Volatile',
  favouriteButton: () => 'Favourite',
  droppedTitle: ({ region, date }: { region: string; date: string }) =>
    `Not seen in ${region} in the latest update (${date}).`,
  droppedBody: ({ date }: { date: string }) =>
    `Showing the last known prices from ${date}.`,
  regionAverageNote: ({ region }: { region: string }) =>
    `Region prices average every ${region} realm. Prices on your realm may differ.`,

  // not found
  unknownHeadTitle: ({ id, site }: { id: number; site: string }) =>
    `Item #${id} not found · ${site}`,
  unknownTitle: ({ id }: { id: number }) =>
    `We don't have prices for item #${id}.`,
  unknownBody: () => 'It may not be tradable, or nobody has listed it yet.',
  searchItemsLink: () => 'Search items',
  elsewhereHeadTitle: ({
    name,
    region,
    site,
  }: {
    name: string
    region: string
    site: string
  }) => `${name} isn't on the ${region} auction house · ${site}`,
  elsewhereTitle: ({ name, region }: { name: string; region: string }) =>
    `${name} isn't on the ${region} auction house.`,
  elsewhereListLead: () => "It's listed in:",
  elsewhereListSeparator: () => ', ',
  elsewhereListTail: () => '.',

  // price block
  priceHeading: () => 'Current price',
  marketValueLabel: () => 'Market value',
  vsHistLabel: () => 'vs 60-day average',
  noRecentSales: () => 'No recent sales',

  // region strip
  regionsHeading: () => 'All regions',
  regionsCaption: () => 'Market value in each region against the other regions',
  regionColumn: () => 'Region',
  vsOtherRegionsColumn: () => 'vs other regions',
  notListedReason: ({ region }: { region: string }) =>
    `Not listed in ${region}`,

  // realm prices
  realmsHeading: () => 'Realm prices',
  realmsCaption: () => 'Realm prices for this item',
  realmColumn: () => 'Realm',
  factionColumn: () => 'Faction',
  rulesetColumn: () => 'Ruleset',
  lowestBuyoutLabel: () => 'Lowest buyout',
  latestScanColumn: () => 'Latest scan value',
  noListings: () => 'No listings',
  factionAlliance: () => 'Alliance',
  factionHorde: () => 'Horde',
  rulesetNormal: () => 'Normal',
  rulesetPvp: () => 'PvP',
  rulesetRp: () => 'RP',
  rulesetRpPvp: () => 'RP-PvP',

  // statistics grid and card shell
  statsHeading: () => 'Statistics',
  statsLoading: () => 'Loading statistics…',
  rangeSelectLabel: ({ title }: { title: string }) => `Range for ${title}`,
  rangeShort: ({ days: n }: { days: number }) => `${n}D`,
  rangeLong: ({ days: n }: { days: number }) => days(n),
  rangeNote: ({ n }: { n: number }) => `Showing all ${days(n)} we have.`,
  historyNote: ({ n, date }: { n: number; date: string }) =>
    `${days(n)} of history (since ${date}).`,
  salesRegionOnly: () => 'Sales are only published per region.',
  tableCaption: ({ title, scope }: { title: string; scope: string }) =>
    `${title}, ${scope}`,
  dayColumn: () => 'Day',
  soldPerDayLabel: () => 'Sold per day',
  histLabel: () => '60-day average',

  // card 1: market value and quantity
  valueTitle: () => 'Market value and quantity',
  historyStarts: ({ date }: { date: string }) =>
    `Price history starts ${date}.`,
  onlyPointDate: ({ date }: { date: string }) => `on ${date}.`,
  fillsInNote: () =>
    'We save one snapshot a day, so this chart fills in over time. Check back tomorrow for the first trend.',
  noRealmScans: ({ realm }: { realm: string }) =>
    `No scans for ${realm} in this range.`,
  realmValueLabel: () => 'Realm market value',
  endLabelBuyout: () => 'Buyout',
  endLabelRealm: () => 'Realm',
  endLabelAvg: () => 'Avg',
  endLabelValue: () => 'Value',

  // card 2: regions or realm vs region
  compareRegionsTitle: () => 'Other regions',
  compareRealmTitle: () => 'This realm vs region',
  regionSeries: ({ region }: { region: string }) => `${region} region`,
  thisRegionSeries: ({ region }: { region: string }) =>
    `${region} (this region)`,
  realmHistoryStarts: ({ realm, date }: { realm: string; date: string }) =>
    `${realm} history starts ${date}.`,
  realmNoScans: ({ realm }: { realm: string }) =>
    `${realm} has no scans for this item yet.`,
  realmCompareHint: () =>
    'The comparison appears after the second day of realm scans.',
  onlyRegionHistory: ({ region }: { region: string }) =>
    `Only ${region} has a price history for this item so far.`,
  otherRegionsHint: () =>
    'Other regions appear here once they list it on two daily updates.',
  compareTableScope: () => 'market value by day',
  seriesLegend: () => 'Series',
  regionsLegend: () => 'Regions',

  // cards 3 and 4: heatmaps
  heatmapValueTitle: () => 'Heatmap: market value',
  heatmapSalesTitle: () => 'Heatmap: sales',
  hourlyPending: ({
    realm,
    min,
    n,
  }: {
    realm: string
    min: number
    n: number
  }) =>
    `Hourly view for ${realm} starts after ${days(min)} of scans (${n} so far).`,
  heatmapNeedsWeek: () => 'The heatmap needs a week of daily updates.',
  heatmapProgress: ({
    n,
    min,
    region,
  }: {
    n: number
    min: number
    region: string
  }) => `We have ${n} of ${min} for this item in ${region}.`,
  heatmapPickRange: () => 'Pick 30D or 90D to see more.',
  heatmapFirstWeek: ({ date }: { date: string }) =>
    `The first full week ends ${date}.`,
  noSalesTitle: () => 'No recorded sales in this range.',
  noSalesBody: ({ region, days: n }: { region: string; days: number }) =>
    `TSM saw no ${region} sales for this item in the last ${days(n)}.`,
  heatmapHourlyCaption: ({ realm, days: n }: { realm: string; days: number }) =>
    `Each square is the average for that weekday and hour (UTC) on ${realm}, from ${days(n)} of scans.`,
  heatmapSalesCaption: ({ days: n }: { days: number }) =>
    `Each square is one day and shows how far its sales sit from the ${n}-day median: redder means more sales than usual, bluer fewer.`,
  heatmapValueCaption: ({ days: n }: { days: number }) =>
    `Each square is one day and shows how far it sits from the ${n}-day median: redder above, bluer below.`,
  perDay: ({ n }: { n: string }) => `${n} a day`,
  medianHourReference: () => 'the median hour',
  rangeMedianReference: ({ days: n }: { days: number }) =>
    `the ${n}-day median`,
  hourSlot: ({ weekday, hour }: { weekday: number; hour: string }) =>
    `${WEEKDAYS[weekday]} ${hour}:00 UTC`,
  weekdayShort: ({ weekday }: { weekday: number }) => WEEKDAYS[weekday],
  weekdayHourColumn: () => 'Weekday and hour',
  vsMedianColumn: () => 'vs median',

  // summary sentences (stats.ts)
  valueSteady: ({ value, n }: { value: string; n: number }) =>
    `Market value held steady at ${value} over ${days(n)}.`,
  valueChanged: ({
    fell,
    pct,
    n,
    from,
    to,
  }: {
    fell: boolean
    pct: string
    n: number
    from: string
    to: string
  }) =>
    `Market value ${fell ? 'fell' : 'rose'} ${pct} over ${days(n)}, from ${from} to ${to}.`,
  valueLow: ({ value, date }: { value: string; date: string }) =>
    `Low ${value} on ${date}.`,
  valueSold: ({ n }: { n: string }) => `Sold about ${n} a day on average.`,
  compareSummary: ({
    days: n,
    region,
    pct,
    below,
    k,
  }: {
    days: number
    region: string
    pct: string
    below: boolean
    k: number
  }) =>
    `In the last ${days(n)} ${region} averaged ${pct} ${side(below)} the median of ${plural(k, { one: `${k} region`, other: `${k} regions` })}.`,
  realmCompareSummary: ({
    realm,
    pct,
    below,
    region,
  }: {
    realm: string
    pct: string
    below: boolean
    region: string
  }) => `${realm} averaged ${pct} ${side(below)} the ${region} market value.`,
  hourlySlotLabel: ({ weekday, hour }: { weekday: number; hour: string }) =>
    `${WEEKDAYS_PLURAL[weekday]} at ${hour}:00 UTC`,
  heatmapFlatHourly: () =>
    'Every slot sits within 0.5% of the median, so no time stands out.',
  heatmapFlatDaily: ({ days: n }: { days: number }) =>
    `Every day sits within 0.5% of the ${n}-day median.`,
  heatmapHourlySummary: ({
    hi,
    hiPct,
    hiBelow,
    lo,
    loPct,
    loBelow,
  }: {
    hi: string
    hiPct: string
    hiBelow: boolean
    lo: string
    loPct: string
    loBelow: boolean
  }) =>
    `Highest on ${hi}, ${hiPct} ${side(hiBelow)} the median. Lowest on ${lo}, ${loPct} ${side(loBelow)}.`,
  heatmapDailySummary: ({
    hi,
    hiPct,
    hiBelow,
    lo,
    loPct,
    loBelow,
    days: n,
  }: {
    hi: string
    hiPct: string
    hiBelow: boolean
    lo: string
    loPct: string
    loBelow: boolean
    days: number
  }) =>
    `Highest on ${hi}, ${hiPct} ${side(hiBelow)} the ${n}-day median. Lowest on ${lo}, ${loPct} ${side(loBelow)}. TSM values average several days, so this does not point to a best weekday.`,
} satisfies Catalog
