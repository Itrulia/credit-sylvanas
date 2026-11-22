import '@tanstack/react-start/server-only'
import type { HotBy, Region } from '../../lib/search.ts'
import type { HotRow } from '../types.ts'
import { LIQUID, toHotRow } from './shared.ts'
import type { HotSql } from './shared.ts'

export async function hottest(
  db: D1Database,
  { region, by, limit }: { region: Region; by: HotBy; limit: number },
): Promise<HotRow[]> {
  const order = by === 'traded' ? 's.sold_per_day DESC' : 'gold_volume DESC'
  const rows = await db
    .prepare(
      `WITH cur AS (SELECT max(day) AS d FROM region_snapshots WHERE region = ?1)
       SELECT s.item_id, i.name, s.market_value, s.historical, s.avg_sale_price, s.sale_rate, s.sold_per_day,
              CAST(s.sold_per_day * s.avg_sale_price AS INTEGER) AS gold_volume,
              (s.market_value - s.historical) * 1.0 / NULLIF(s.historical, 0) AS vs_hist,
              (s.market_value - p.market_value) * 1.0 / NULLIF(p.market_value, 0) AS d1
       FROM region_snapshots s JOIN items i ON i.id = s.item_id
       LEFT JOIN region_snapshots p ON p.region = s.region AND p.item_id = s.item_id
         AND p.day = (SELECT max(day) FROM region_snapshots
                      WHERE region = ?1 AND day < (SELECT d FROM cur) AND day >= (SELECT d FROM cur) - 3)
       WHERE s.region = ?1 AND s.day = (SELECT d FROM cur) AND ${LIQUID}
         AND s.sold_per_day * s.avg_sale_price >= 10000
       ORDER BY ${order}, s.item_id LIMIT ?2`,
    )
    .bind(region, limit)
    .all<HotSql>()
  return rows.results.map(toHotRow)
}
