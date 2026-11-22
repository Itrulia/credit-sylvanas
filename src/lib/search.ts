import { z } from 'zod'

// Every field with a default is `X.default(d).catch(d)`: `.catch()` alone keeps
// the key required in <Link> and stops stripSearchParams from stripping it.
export const Region = z.enum(['us', 'eu', 'kr', 'tw'])
export type Region = z.infer<typeof Region>
export const Faction = z.enum(['alliance', 'horde'])
export type Faction = z.infer<typeof Faction>
export const Ruleset = z.enum(['normal', 'pvp', 'rp', 'rp-pvp'])
export type Ruleset = z.infer<typeof Ruleset>

export const contextSearch = z.object({
  realm: z.string().optional().catch(undefined),
  faction: Faction.optional().catch(undefined),
})

export const HeatmapN = z.literal([10, 25, 50])
export type HeatmapN = z.infer<typeof HeatmapN>
export const HeatSort = z.enum(['volume', 'spread', 'name'])
export type HeatSort = z.infer<typeof HeatSort>
export const HeatMetric = z.enum(['index', 'price'])
export type HeatMetric = z.infer<typeof HeatMetric>
export const heatmapSearch = z.object({
  n: HeatmapN.default(25).catch(25),
  sort: HeatSort.default('volume').catch('volume'),
  metric: HeatMetric.default('index').catch('index'),
})
export const HEATMAP_DEFAULTS = {
  n: 25,
  sort: 'volume',
  metric: 'index',
} as const

// The UI never shows more than 90 days, so there is no 'all'
export const StatRange = z.enum(['7d', '30d', '90d'])
export type StatRange = z.infer<typeof StatRange>
export const itemSearch = z.object({
  mvRange: StatRange.default('30d').catch('30d'),
  cmpRange: StatRange.default('30d').catch('30d'),
  heatRange: StatRange.default('90d').catch('90d'),
  salesRange: StatRange.default('90d').catch('90d'),
})
export const ITEM_DEFAULTS = {
  mvRange: '30d',
  cmpRange: '30d',
  heatRange: '90d',
  salesRange: '90d',
} as const

export const MoverBy = z.enum(['price', 'sales'])
export type MoverBy = z.infer<typeof MoverBy>
export const MoverMetric = z.enum(['vs_hist', 'd1', 'd7'])
export type MoverMetric = z.infer<typeof MoverMetric>
export const HotBy = z.enum(['gold', 'traded'])
export type HotBy = z.infer<typeof HotBy>
export const marketSearch = z.object({
  hot: HotBy.default('gold').catch('gold'),
  movers: MoverMetric.default('vs_hist').catch('vs_hist'),
  by: MoverBy.default('price').catch('price'),
})
export const MARKET_DEFAULTS = {
  hot: 'gold',
  movers: 'vs_hist',
  by: 'price',
} as const

export const ItemSort = z.enum([
  'name',
  'marketValue',
  'historical',
  'vsHist',
  'avgSalePrice',
  'soldPerDay',
  'saleRate',
])
export type ItemSort = z.infer<typeof ItemSort>
export const SortDir = z.enum(['asc', 'desc'])

/** Rows per items-list page, shared by the SQL and the pager. */
export const PAGE_SIZE = 50
export type SortDir = z.infer<typeof SortDir>
export const itemsSearch = z.object({
  // the router parses a hand-typed ?q=999999 as a number
  q: z
    .union([z.string(), z.number().transform(String)])
    .pipe(z.string().trim().max(64))
    .default('')
    .catch(''),
  sort: ItemSort.default('soldPerDay').catch('soldPerDay'),
  dir: SortDir.default('desc').catch('desc'),
  page: z.number().int().min(1).default(1).catch(1),
})
export const ITEMS_DEFAULTS = {
  q: '',
  sort: 'soldPerDay',
  dir: 'desc',
  page: 1,
} as const

export const RulesetFilter = z.enum(['all', ...Ruleset.options])
export const realmsSearch = z.object({
  ruleset: RulesetFilter.default('all').catch('all'),
})

export const ItemIdParam = z.coerce.number().int().positive().max(1_000_000)
