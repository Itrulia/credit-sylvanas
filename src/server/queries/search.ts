import '@tanstack/react-start/server-only'
import type { Region } from '../../lib/search.ts'
import type { SearchRow } from '../types.ts'
import { tokenFilter } from './shared.ts'

// LIKE, not FTS5: there are about 12k names.
export async function searchItems(
  db: D1Database,
  { region, q }: { region: Region; q: string },
): Promise<SearchRow[]> {
  const f = tokenFilter(q, 2)
  const prefixParam = 2 + f.binds.length
  const prefixOrder = f.prefix
    ? `(i.name LIKE ?${prefixParam} ESCAPE '\\') DESC,`
    : ''
  const rows = await db
    .prepare(
      `WITH cur AS (SELECT max(day) AS d FROM region_snapshots WHERE region = ?1)
       SELECT i.id, i.name, s.market_value, s.sold_per_day
       FROM items i LEFT JOIN region_snapshots s ON s.region = ?1 AND s.day = (SELECT d FROM cur) AND s.item_id = i.id
       WHERE ${f.sql}
       ORDER BY ${prefixOrder} coalesce(s.sold_per_day, 0) DESC, length(i.name), i.id
       LIMIT 8`,
    )
    .bind(region, ...f.binds, ...(f.prefix ? [f.prefix] : []))
    .all<{
      id: number
      name: string
      market_value: number | null
      sold_per_day: number | null
    }>()
  return rows.results.map((r) => ({
    id: r.id,
    name: r.name,
    mv: r.market_value,
    spd: r.sold_per_day,
  }))
}
