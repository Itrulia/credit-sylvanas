import { plural } from '../plural'
import type { Catalog } from '../types'

type Counts = {
  n: number
  count: string
  up: number
  down: number
  flat: number
}

const items = ({ n, count }: { n: number; count: string }) =>
  plural(n, { one: `${count} item`, other: `${count} items` })

export const heatmap = {
  headTitle: ({ region }: { region: string }) =>
    `Heatmaps · ${region} Forever AH`,
  headDescription: ({ region }: { region: string }) =>
    `See where the top ${region} Forever auction house items cost more or less than in other regions and than their 60-day average. Pricing data from TradeSkillMaster.`,
  pageTitle: ({ region }: { region: string }) => `${region} price heatmaps`,
  realmNote: () => 'Heatmaps are region-wide.',
  emptyTitle: ({ region }: { region: string }) =>
    `Not enough trading in ${region} to build a heatmap.`,
  emptyLink: () => 'Browse all items',
  emptyBody: () => 'Items need about one sale every two days to count.',

  controlsItemsLabel: () => 'Items',
  controlsShowLabel: () => 'Show',
  metricIndex: () => 'vs other regions',
  metricPrice: () => 'Price',

  itemColumn: () => 'Item',
  spreadLabel: () => 'Spread',

  acrossTitle: () => 'Across regions',
  acrossNeedsTwoTitle: () => 'Cross-region comparison needs two regions.',
  acrossNeedsTwoBody: ({ region }: { region: string }) =>
    `Only ${region} has prices so far. The other two heatmaps still work.`,
  acrossIntro: ({ count, region }: { count: number; region: string }) =>
    `Top ${count} items by gold traded per day in ${region}. Each cell compares that region's market value with the median of every region that lists it. Regions have separate economies. A higher price means the item is scarcer there.`,
  acrossLegendCheaper: () => 'Cheaper than other regions',
  acrossLegendPricier: () => 'Pricier than other regions',
  acrossCaption: ({
    n,
    region,
    sort,
  }: {
    n: number
    region: string
    sort: string
  }) =>
    `Top ${n} ${region} items, market value in each region against the other regions. Sorted by ${sort}.`,
  acrossCaptionFiltered: ({ count, sort }: { count: number; sort: string }) =>
    `Top ${count} items (only ${count} pass the trading filter), market value in each region against the other regions. Sorted by ${sort}.`,
  regionCurrent: () => '(this region)',
  regionNoData: () => '(no data yet)',
  cellNoPrices: ({ region }: { region: string }) => `No ${region} prices yet`,
  cellNotListed: ({ region }: { region: string }) => `Not listed in ${region}`,
  cellNoSpread: () => 'Needs two regions',
  sortVolume: () => 'gold traded per day',
  sortSpread: () => 'spread',
  sortName: () => 'name',
  sortedAsc: ({ sort }: { sort: string }) => `Sorted by ${sort}, A to Z first.`,
  sortedDesc: ({ sort }: { sort: string }) =>
    `Sorted by ${sort}, highest first.`,

  momentumTitle: () => 'Against the 60-day average',
  momentumIntro: ({ region }: { region: string }) =>
    `Today's market value against each item's own 60-day average in ${region}. Pricier first.`,
  momentumLegendCheaper: () => 'Cheaper than usual',
  momentumLegendPricier: () => 'Pricier than usual',
  momentumSummary: ({ n, count, up, down, flat }: Counts) =>
    `${items({ n, count })}: ${up} pricier than usual, ${down} cheaper, ${flat} about usual.`,
  momentumSummaryWithMissing: ({
    n,
    count,
    up,
    down,
    flat,
    none,
  }: Counts & { none: number }) =>
    `${items({ n, count })}: ${up} pricier than usual, ${down} cheaper, ${flat} about usual, ${none} without a 60-day average.`,

  dailyTitle: () => 'Day by day',
  dailyIntro: () =>
    'Market value change since the previous daily update, last 14 days.',
  dailyLegendFell: () => 'Fell',
  dailyLegendRose: () => 'Rose',
  dailyLoading: () => 'Loading daily changes…',
  dailyNeedsWeekTitle: () => 'Daily changes need a week of daily updates.',
  dailyStartsTitle: ({ date }: { date: string }) =>
    `Daily changes start on ${date}.`,
  dailyWaitBody: ({ days, region }: { days: number; region: string }) =>
    `We've saved ${days} of 7 daily updates for ${region}. Until then, the 60-day heatmap above works from day one.`,
  dailyCaption: ({
    count,
    region,
    days,
  }: {
    count: number
    region: string
    days: number
  }) =>
    `Market value change since the previous daily update for the top ${count} ${region} items, last ${days} days.`,

  binAtMost: ({ pct }: { pct: string }) => `${pct}% or less`,
  binAtLeast: ({ pct }: { pct: string }) => `${pct}% or more`,
  binRange: ({ from, to }: { from: string; to: string }) => `${from} to ${to}%`,
} satisfies Catalog
