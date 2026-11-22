import '@tanstack/react-start/server-only'
import type { MoverBy, MoverMetric, Region } from '../../lib/search.ts'
import type { MoverRow, MoversResult } from '../types.ts'

// The ranked column comes from this whitelist, never from input.
const CHANGE = {
  price: { vs_hist: 'vs_hist', d1: 'd1', d7: 'd7' },
  sales: { d1: 'd1_sales', d7: 'd7_sales' },
} as const

const FROM_TO = {
  vs_hist: ['historical', 'market_value'],
  d1: ['p_mv', 'market_value'],
  d7: ['w_mv', 'market_value'],
  d1_sales: ['p_spd', 'sold_per_day'],
  d7_sales: ['w_spd', 'sold_per_day'],
} as const

export interface MoversArgs {
  region: Region
  by: MoverBy
  metric: MoverMetric
  dir: 1 | -1
}

export async function movers(
  db: D1Database,
  { region, by, metric, dir }: MoversArgs,
): Promise<MoversResult> {
  const column = (
    CHANGE[by] as Record<string, keyof typeof FROM_TO | undefined>
  )[metric]
  if (!column) {
    throw new Error(`No ${metric} window for ${by}`)
  }
  const [from, to] = FROM_TO[column]
  const [rows, meta] = await db.batch<Record<string, number | string | null>>([
    db
      .prepare(
        `WITH cur AS (SELECT max(day) d FROM region_snapshots WHERE region = ?1),
              prv AS (SELECT max(day) d FROM region_snapshots WHERE region = ?1
                      AND day < (SELECT d FROM cur) AND day >= (SELECT d FROM cur) - 3),
              wk AS (SELECT max(day) d FROM region_snapshots WHERE region = ?1
                     AND day BETWEEN (SELECT d FROM cur) - 9 AND (SELECT d FROM cur) - 7),
              m AS (
           SELECT s.item_id, i.name, s.market_value, s.historical, s.sold_per_day,
                  p.market_value AS p_mv, w.market_value AS w_mv, p.sold_per_day AS p_spd, w.sold_per_day AS w_spd,
                  (s.market_value - s.historical) * 1.0 / s.historical AS vs_hist,
                  (s.market_value - p.market_value) * 1.0 / NULLIF(p.market_value, 0) AS d1,
                  (s.market_value - w.market_value) * 1.0 / NULLIF(w.market_value, 0) AS d7,
                  CASE WHEN p.sold_per_day >= 1 THEN (s.sold_per_day - p.sold_per_day) / p.sold_per_day END AS d1_sales,
                  CASE WHEN w.sold_per_day >= 1 THEN (s.sold_per_day - w.sold_per_day) / w.sold_per_day END AS d7_sales
           FROM region_snapshots s JOIN items i ON i.id = s.item_id
           LEFT JOIN region_snapshots p ON p.region = s.region AND p.day = (SELECT d FROM prv) AND p.item_id = s.item_id
           LEFT JOIN region_snapshots w ON w.region = s.region AND w.day = (SELECT d FROM wk) AND w.item_id = s.item_id
           WHERE s.region = ?1 AND s.day = (SELECT d FROM cur)
             AND s.market_value >= 100 AND s.historical >= 100
             AND s.sold_per_day >= 1 AND s.sold_per_day * s.avg_sale_price >= 10000
             AND s.market_value BETWEEN s.historical / 20 AND s.historical * 20)
         SELECT * FROM m
         WHERE ${column} IS NOT NULL AND ${column} * ?2 > 0.005
         ORDER BY ${column} * ?2 DESC, item_id
         LIMIT 10`,
      )
      .bind(region, dir),
    db
      .prepare(
        `WITH cur AS (SELECT max(day) d FROM region_snapshots WHERE region = ?1)
         SELECT
           (SELECT max(day) FROM region_snapshots WHERE region = ?1
              AND day < (SELECT d FROM cur) AND day >= (SELECT d FROM cur) - 3) AS prv,
           (SELECT max(day) FROM region_snapshots WHERE region = ?1
              AND day BETWEEN (SELECT d FROM cur) - 9 AND (SELECT d FROM cur) - 7) AS wk,
           (SELECT min(day) FROM region_snapshots WHERE region = ?1 AND day >= (SELECT d FROM cur) - 89) AS first_day`,
      )
      .bind(region),
  ])
  const m = meta.results[0] ?? {}
  return {
    rows: rows.results.map((r): MoverRow => ({
      id: r.item_id as number,
      name: r.name as string,
      mv: r.market_value as number,
      hist: r.historical as number,
      spd: r.sold_per_day as number,
      change: r[column] as number,
      from: r[from] as number,
      to: r[to] as number,
    })),
    available: {
      d1: m.prv != null,
      d7: m.wk != null,
      d7From: m.first_day != null ? (m.first_day as number) + 7 : null,
    },
  }
}
