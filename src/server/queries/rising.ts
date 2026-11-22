import '@tanstack/react-start/server-only'
import type { Region } from '../../lib/search.ts'
import type { RisingResult } from '../types.ts'

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
    AND s.market_value >= 100 AND s.historical >= 100
    AND s.sold_per_day >= 1 AND s.sold_per_day * s.avg_sale_price >= 10000
    AND s.market_value BETWEEN s.historical / 20 AND s.historical * 20
    AND w.market_value >= 100 AND w.market_value BETWEEN s.historical / 20 AND s.historical * 20
    AND s.market_value >= w.market_value * 1.05),
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

// Region days with snapshots in cur-30..cur-1: one PK probe per day, so the
// 30-day block is never scanned to count them.
export const RISING_DAYS_SQL = `WITH RECURSIVE cur AS (SELECT max(day) d FROM region_snapshots WHERE region = ?1),
     d(x) AS (SELECT (SELECT d FROM cur) - 30 UNION ALL SELECT x + 1 FROM d WHERE x < (SELECT d FROM cur) - 1)
SELECT count(*) AS n FROM d
WHERE EXISTS (SELECT 1 FROM region_snapshots WHERE region = ?1 AND day = d.x)`

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
): Promise<RisingResult> {
  const [rows, days] = await db.batch([
    db.prepare(RISING_SQL).bind(region),
    db.prepare(RISING_DAYS_SQL).bind(region),
  ])
  const rowsOut = (rows.results as RisingSql[]).map((r) => ({
    id: r.item_id,
    name: r.name,
    mv: r.market_value,
    change: r.change,
    spd: r.sold_per_day,
    avgSpd: r.avg_spd,
    lift: r.sold_per_day / r.avg_spd,
  }))
  return {
    rows: rowsOut,
    days: (days.results as { n: number }[])[0]?.n ?? 0,
  }
}
