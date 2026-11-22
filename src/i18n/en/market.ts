import type { Catalog } from '../types'

type Window = 'vs_hist' | 'd1' | 'd7'

const PHRASE: Record<Window, string> = {
  vs_hist: 'against the 60-day average',
  d1: 'since the previous daily update',
  d7: 'over the last 7 days',
}

export const market = {
  // route
  headTitle: ({ region }: { region: string }) =>
    `${region} Forever auction house prices`,
  headDescription: ({ region }: { region: string }) =>
    `Daily WoW Forever auction house prices for ${region}: most traded items, biggest price moves and price history. Pricing data from TradeSkillMaster.`,
  heading: ({ region }: { region: string }) => `${region} auction house`,
  regionWideNote: () => 'Market overview is region-wide.',
  hottestHeading: () => 'Hottest',
  movesHeading: () => 'Biggest moves',
  risingHeading: () => 'Rising with demand',
  risingLoading: () => 'Loading rising items…',
  mapHeading: () => 'Market map',

  // shared table headers
  itemHeader: () => 'Item',
  marketValueHeader: () => 'Market value',
  vsHistHeader: () => 'vs 60-day avg',
  changeHeader: () => 'Change',
  soldPerDayHeader: () => 'Sold/day',
  goldPerDayHeader: () => 'Gold/day',

  // hottest
  rankHeader: () => 'Rank',
  rankByLabel: () => 'Rank by',
  hottestTabGold: () => 'Most gold traded',
  hottestTabSold: () => 'Most sold',
  hottestRanked: ({
    region,
    hot,
  }: {
    region: string
    hot: 'gold' | 'traded'
  }) =>
    hot === 'gold'
      ? `Ranked by gold traded per day across ${region}.`
      : `Ranked by units sold per day across ${region}.`,
  hottestEmpty: ({ region }: { region: string }) =>
    `Not enough trading in ${region} to rank items yet. Items need about one sale every two days to count.`,
  hottestCaption: ({
    n,
    region,
    hot,
  }: {
    n: number
    region: string
    hot: 'gold' | 'traded'
  }) =>
    hot === 'gold'
      ? `Top ${n} ${region} items by gold traded per day`
      : `Top ${n} ${region} items by units sold per day`,
  hottestLabel: ({ region }: { region: string }) => `Hottest ${region} items`,
  seeAllItems: () => 'See all items',

  // rising
  risingIntro: () =>
    'Up at least 5% in a week and selling at least 1.25 times their usual amount per day.',
  risingChangeHeader: () => '7 days',
  risingLift: ({ lift }: { lift: string }) => `${lift}× usual`,
  risingCaption: ({ n, region }: { n: number; region: string }) =>
    `Top ${n} ${region} items rising in price while selling more than usual`,
  risingLabel: ({ region }: { region: string }) =>
    `${region} items rising with demand`,
  risingStartsOn: ({
    date,
    days,
    need,
  }: {
    date: string
    days: number
    need: number
  }) => `Starts on ${date} (${days} of ${need} earlier daily updates so far).`,
  risingStartsLater: ({ days, need }: { days: number; need: number }) =>
    `Starts on the 15th daily update (${days} of ${need} earlier daily updates so far).`,
  risingNeed: ({ need }: { need: number }) =>
    `Sales need ${need} earlier daily updates to compare with.`,
  risingEmpty: ({ region }: { region: string }) =>
    `No item is rising with demand today. In ${region}, nothing that trades at least 1g a day and has two weeks of sales is up 5% on the week while selling more than usual.`,

  // biggest moves
  moverIncrease: () => 'Biggest increase',
  moverDecrease: () => 'Biggest decrease',
  moverNothing: ({ window }: { window: Window }) =>
    `Nothing moved more than 0.5% ${PHRASE[window]}.`,
  moverCaption: ({
    n,
    region,
    by,
    dir,
    window,
  }: {
    n: number
    region: string
    by: 'price' | 'sales'
    dir: 1 | -1
    window: Window
  }) =>
    `Top ${n} ${region} items by ${by === 'price' ? 'price' : 'popularity'} ${dir > 0 ? 'increase' : 'decrease'}, ${PHRASE[window]}.`,
  moverFew: ({ n }: { n: number }) => `Only ${n} items moved more than 0.5%.`,
  moverPerDay: ({ from, to }: { from: string; to: string }) =>
    `${from} → ${to} a day`,
  introPriceVsHist: () =>
    "Today's market value compared with the 60-day average.",
  introPriceD1: () =>
    "Today's market value compared with the previous daily update.",
  introPriceD7: () => "Today's market value compared with 7 days ago.",
  introSalesD1: () =>
    'Change in units sold per day since the previous daily update.',
  introSalesD7: () => 'Change in units sold per day since 7 days ago.',
  measureLabel: () => 'Measure',
  measurePrice: () => 'Price',
  measurePopularity: () => 'Popularity',
  windowLabel: () => 'Window',
  windowVsHist: () => 'vs 60-day avg',
  windowD1: () => 'Last update',
  windowD7: () => '7 days',
  reasonNoSalesAverage: () => 'TSM has no 60-day sales average.',
  reasonD1On: ({ date }: { date: string }) =>
    `Last update: available after the second daily update (${date}).`,
  reasonD1Later: () => 'Last update: available after the second daily update.',
  reasonD7On: ({ date, days }: { date: string; days: number }) =>
    `7 days: available from ${date} (${days} of 7 days so far).`,
  reasonD7Later: ({ days }: { days: number }) =>
    `7 days: available from the eighth daily update (${days} of 7 days so far).`,
  popularityStartsOn: ({ date }: { date: string }) =>
    `Popularity changes start on ${date}.`,
  popularityStartsLater: () =>
    'Popularity changes start on the second daily update.',
  popularityNeed: () => 'Sales need two daily updates to compare.',

  // market map
  mapEmpty: ({ region }: { region: string }) =>
    `Not enough trading in ${region} to draw a market map yet. Items need about one sale every two days to count.`,
  mapIntroD1: () =>
    'Tile size is gold traded per day. Colour is the market value change since the previous daily update.',
  mapIntroVsHist: () =>
    "Tile size is gold traded per day. Colour is today's price against the 60-day average.",
  listView: () => 'List view',
  mapListCaption: ({ n, region }: { n: number; region: string }) =>
    `Top ${n} ${region} items by gold traded per day`,
  mapListLabel: ({ region }: { region: string }) =>
    `Market map list, ${region}`,
  mapTileTitle: ({ name, change }: { name: string; change: string }) =>
    `${name}, ${change}`,
  mapSummaryD1: ({ n, up, down }: { n: number; up: number; down: number }) =>
    `Top ${n} items by gold traded per day. ${up} rose since the previous daily update, ${down} fell.`,
  mapSummaryVsHist: ({
    n,
    up,
    down,
  }: {
    n: number
    up: number
    down: number
  }) =>
    `Top ${n} items by gold traded per day. ${up} above usual, ${down} below.`,
  mapLegendFell: () => 'Fell',
  mapLegendRose: () => 'Rose',
  mapLegendCheaper: () => 'Cheaper than usual',
  mapLegendPricier: () => 'Pricier than usual',
  mapLoading: () => 'Loading market map…',
  mapSlow: () => 'Still loading. This is taking longer than usual.',
} satisfies Catalog
