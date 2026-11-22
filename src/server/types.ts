// Row types returned by server fns. Frozen at the WP0 merge (DESIGN §11).
import type { Faction, Region } from '#/lib/search'

export type ImportKind = 'region' | 'realm'
export type ImportStatus = 'imported' | 'skipped' | 'failed'

export interface RegionStatus {
  hasData: boolean
  /** TSM scan time of the newest imported region file, unix s */
  updatedAt: number | null
  /** when we fetched it, unix s */
  fetchedAt: number | null
  firstDay: number | null
  lastDay: number | null
  /** distinct scan days in the last 90 days */
  days: number
  /** every region with at least one imported region file, for the 503 page */
  regionsWithData: Region[]
}

export interface ImportLogRow {
  fetchedAt: number
  updatedAt: number | null
  region: Region
  kind: ImportKind
  realm: string | null
  rows: number
  status: ImportStatus
  reason: string | null
  /** first 12 hex chars of the SHA-256 */
  sha: string | null
}

export interface HotRow {
  id: number
  name: string
  mv: number
  hist: number
  asp: number
  saleRate: number
  spd: number
  goldVolume: number
  vsHist: number | null
  d1: number | null
}

export interface MoverRow {
  id: number
  name: string
  mv: number
  hist: number
  spd: number
  /** the ratio being ranked */
  change: number
  /** compared values: copper for price, units/day for sales */
  from: number
  to: number
}

export interface MoversResult {
  rows: MoverRow[]
  available: { d1: boolean; d7: boolean; d7From: number | null }
}

export interface RisingResult {
  rows: RisingRow[]
  /** region days with snapshots in the 30 days before the latest */
  days: number
}

export interface RisingRow {
  id: number
  name: string
  mv: number
  /** market value change against about 7 days earlier */
  change: number
  spd: number
  /** the item's average sold/day over the previous 30 days */
  avgSpd: number
  /** spd / avgSpd */
  lift: number
}

export interface SearchRow {
  id: number
  name: string
  mv: number | null
  spd: number | null
}

export interface ListRow {
  id: number
  name: string
  mv: number
  hist: number
  vsHist: number | null
  asp: number
  saleRate: number
  spd: number
  realmMv?: number | null
  minBuyout?: number | null
}

export interface ListResult {
  rows: ListRow[]
  total: number
}

export interface RegionCell {
  region: Region
  day: number | null
  mv: number | null
  hist: number | null
  spd: number | null
  updatedAt: number | null
  /** mv / median(mv of regions with mv > 0) - 1 */
  index: number | null
}

export interface ItemCurrent {
  mv: number
  hist: number
  asp: number
  saleRate: number
  spd: number
  updatedAt: number
  day: number
}

export interface RealmPrice {
  realm: string
  faction: Faction
  updatedAt: number
  day: number
  mv: number
  minBuyout: number
  recent: number
  historical: number | null
}

export interface ItemResult {
  item: { id: number; name: string } | null
  current: ItemCurrent | null
  lastSeenDay: number | null
  regions: RegionCell[]
  /** the selected realm-faction, when one is set */
  realm: RealmPrice | null
  /** every configured realm-faction of the region with a scan in the last 90 days */
  realms: RealmPrice[]
}

export interface HistoryPoint {
  day: number
  mv: number
  hist: number
  asp: number
  spd: number
}

export interface ItemHistory {
  points: HistoryPoint[]
  others: { region: Region; points: { day: number; mv: number }[] }[]
  realm: null | {
    daily: { day: number; mv: number; minBuyout: number }[]
    scans: { t: number; mv: number }[]
  }
  firstDay: number | null
}

export interface HeatCell {
  mv: number
  hist: number
  index: number | null
}

export interface HeatRow extends HotRow {
  cells: Record<Region, HeatCell | null>
  spread: number | null
}

export interface HeatmapResult {
  rows: HeatRow[]
  regionsWithData: Region[]
}

export type DailyChange =
  | { available: false; days: number; from: number | null }
  | {
      available: true
      cols: number[]
      rows: { id: number; name: string; d1: (number | null)[] }[]
    }
