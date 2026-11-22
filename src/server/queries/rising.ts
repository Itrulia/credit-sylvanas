import '@tanstack/react-start/server-only'
import type { Region } from '../../lib/search.ts'
import type { RisingRow } from '../types.ts'

// Today's liquid risers first (a small set), then their 30-day sales baseline
// through the item index (INDEXED BY, pinned in plan.test.ts), so the region's
// 30-day block is never scanned whole.
export const RISING_SQL = `WITH cur AS (SELECT max(day) d FROM region_snapshots WHERE region = ?1),
     wk AS (SELECT max(day) d FROM region_snapshots WHERE region = ?1
            AND day BETWEEN (SELECT d FROM cur) - 9 AND (SELECT d FROM cur) - 7),
     t AS (
  SELECT s.item_id, s.market_value, s.sold_per_day,
         (s.market_value - w.market_value) * 1.0 / w.market_value AS change
  FROM region_snapshots s
  JOIN region_snapshots w ON w.region = s.region AND w.day = (SELECT d FROM wk) AND w.item_id = s.item_id
  WHERE s.region = ?1 AND s.day = (SELECT d FROM cur)
    AND s.sold_per_day * s.avg_sale_price >= 10000
    AND w.market_value > 0 AND s.market_value >= w.market_value * 1.05),
     b AS (
  SELECT t.item_id, avg(h.sold_per_day) AS avg_spd, count(*) AS n
  FROM t JOIN region_snapshots AS h INDEXED BY region_snapshots_item ON h.item_id = t.item_id AND h.region = ?1
    AND h.day BETWEEN (SELECT d FROM cur) - 30 AND (SELECT d FROM cur) - 1
  GROUP BY t.item_id)
SELECT t.item_id, i.name, t.market_value, t.sold_per_day, t.change, b.avg_spd
FROM t JOIN b ON b.item_id = t.item_id JOIN items i ON i.id = t.item_id
WHERE b.n >= 14 AND b.avg_spd > 0 AND t.sold_per_day >= b.avg_spd * 1.25
ORDER BY t.change DESC, t.item_id
LIMIT 10`

interface RisingSql {
  item_id: number
  name: string
  market_value: number
  sold_per_day: number
  change: number
  avg_spd: number
}

export async function rising(
  db: D1Database,
  { region }: { region: Region },
): Promise<RisingRow[]> {
  const rows = await db.prepare(RISING_SQL).bind(region).all<RisingSql>()
  return rows.results.map((r) => ({
    id: r.item_id,
    name: r.name,
    mv: r.market_value,
    change: r.change,
    spd: r.sold_per_day,
    avgSpd: r.avg_spd,
    lift: r.sold_per_day / r.avg_spd,
  }))
}
