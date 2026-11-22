import '@tanstack/react-start/server-only'
import { indexCells, spreadOf } from '../../lib/heatmap.ts'
import type { Region } from '../../lib/search.ts'
import type { DailyChange, HeatRow, HeatmapResult } from '../types.ts'
import { hottest } from './hottest.ts'
import { regionStatus } from './status.ts'

export interface CrossRegionCell {
  itemId: number
  region: Region
  mv: number
  hist: number
}

/**
 * Cells from each region's latest day (not the item's last-seen day), so a
 * delisted item shows as missing. Regions whose latest day is past the 90-day
 * window count as having no data.
 */
export async function crossRegion(
  db: D1Database,
  ids: number[],
  nowMs: number,
): Promise<{ cells: CrossRegionCell[]; regionsWithData: Region[] }> {
  const today = Math.floor(nowMs / 86_400_000)
  // one index seek per region instead of a GROUP BY over the whole table
  const cur = `WITH r(region) AS (VALUES ('us'), ('eu'), ('kr'), ('tw')),
    cur AS (SELECT region, (SELECT max(day) FROM region_snapshots s WHERE s.region = r.region) AS d FROM r)`
  const [cells, regions] = await db.batch<
    Record<string, number | string | null>
  >([
    db
      .prepare(
        `${cur}
         SELECT s.item_id, s.region, s.market_value, s.historical
         FROM region_snapshots s JOIN cur ON cur.region = s.region AND s.day = cur.d
         WHERE cur.d >= ?2 - 89 AND s.item_id IN (SELECT value FROM json_each(?1)) AND s.market_value > 0`,
      )
      .bind(JSON.stringify(ids), today),
    db.prepare(`${cur} SELECT region FROM cur WHERE d >= ?1 - 89`).bind(today),
  ])
  return {
    cells: cells.results.map((r) => ({
      itemId: r.item_id as number,
      region: r.region as Region,
      mv: r.market_value as number,
      hist: r.historical as number,
    })),
    regionsWithData: regions.results.map((r) => r.region as Region),
  }
}

/** d1 per item and day for the last 14 snapshot days; a step counts only within 3 days. */
export async function dailyChange(
  db: D1Database,
  { region, ids }: { region: Region; ids: number[] },
): Promise<{ itemId: number; day: number; d1: number | null }[]> {
  const rows = await db
    .prepare(
      `WITH cur AS (SELECT max(day) d FROM region_snapshots WHERE region = ?1),
       w AS (
         SELECT item_id, day, market_value,
                LAG(market_value) OVER (PARTITION BY item_id ORDER BY day) AS prev_mv,
                LAG(day) OVER (PARTITION BY item_id ORDER BY day) AS prev_day
         FROM region_snapshots
         WHERE region = ?1 AND item_id IN (SELECT value FROM json_each(?2))
           AND day BETWEEN (SELECT d FROM cur) - 16 AND (SELECT d FROM cur))
       SELECT item_id, day,
              CASE WHEN day - prev_day <= 3
                   THEN (market_value - prev_mv) * 1.0 / NULLIF(prev_mv, 0) END AS d1
       FROM w WHERE day > (SELECT d FROM cur) - 14 ORDER BY item_id, day`,
    )
    .bind(region, JSON.stringify(ids))
    .all<{ item_id: number; day: number; d1: number | null }>()
  return rows.results.map((r) => ({ itemId: r.item_id, day: r.day, d1: r.d1 }))
}

const REGION_ORDER: Region[] = ['us', 'eu', 'kr', 'tw']

/** getHeatmap logic: top n by gold, then each region's latest price, index and spread. */
export async function buildHeatmap(
  db: D1Database,
  { region, n }: { region: Region; n: number },
  nowMs: number,
): Promise<HeatmapResult> {
  const top = await hottest(db, { region, by: 'gold', limit: n })
  const { cells, regionsWithData } = await crossRegion(
    db,
    top.map((r) => r.id),
    nowMs,
  )
  const byItem = new Map<number, CrossRegionCell[]>()
  for (const c of cells) {
    byItem.set(c.itemId, [...(byItem.get(c.itemId) ?? []), c])
  }
  const rows: HeatRow[] = top.map((row) => {
    const raw = Object.fromEntries(
      REGION_ORDER.map((r) => [r, null]),
    ) as Record<Region, { mv: number; hist: number } | null>
    for (const c of byItem.get(row.id) ?? []) {
      raw[c.region] = { mv: c.mv, hist: c.hist }
    }
    return { ...row, cells: indexCells(raw), spread: spreadOf(raw) }
  })
  return {
    rows,
    regionsWithData: REGION_ORDER.filter((r) => regionsWithData.includes(r)),
  }
}

/** getDailyChange logic: available once the region has 7 scan days. */
export async function buildDailyChange(
  db: D1Database,
  { region, n }: { region: Region; n: number },
): Promise<DailyChange> {
  const status = await regionStatus(db, region)
  if (status.days < 7) {
    return {
      available: false,
      days: status.days,
      from: status.firstDay === null ? null : status.firstDay + 6,
    }
  }
  const top = await hottest(db, { region, by: 'gold', limit: n })
  const changes = await dailyChange(db, { region, ids: top.map((r) => r.id) })
  const cols = [...new Set(changes.map((c) => c.day))].sort((a, b) => a - b)
  const index = new Map(cols.map((d, i) => [d, i]))
  const perItem = new Map<number, (number | null)[]>()
  for (const c of changes) {
    const row = perItem.get(c.itemId) ?? cols.map(() => null)
    row[index.get(c.day)!] = c.d1
    perItem.set(c.itemId, row)
  }
  return {
    available: true,
    cols,
    rows: top.map((r) => ({
      id: r.id,
      name: r.name,
      d1: perItem.get(r.id) ?? cols.map(() => null),
    })),
  }
}
