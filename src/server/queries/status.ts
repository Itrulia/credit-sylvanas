import '@tanstack/react-start/server-only'
import type { Region } from '../../lib/search.ts'
import type { RegionStatus } from '../types.ts'

export const REGIONS_SQL = `SELECT DISTINCT region FROM imports WHERE kind = 'region' AND status = 'imported' ORDER BY region`

// Reads imports only (a few thousand rows), never the snapshot tables.
export async function regionStatus(
  db: D1Database,
  region: Region,
): Promise<RegionStatus> {
  const [latest, span, regions] = await db.batch<Record<string, number | null>>(
    [
      db
        .prepare(
          `SELECT updated_at, fetched_at FROM imports
         WHERE region = ?1 AND kind = 'region' AND status = 'imported'
         ORDER BY updated_at DESC, id DESC LIMIT 1`,
        )
        .bind(region),
      db
        .prepare(
          `WITH d AS (SELECT DISTINCT updated_at / 86400 AS day FROM imports
                    WHERE region = ?1 AND kind = 'region' AND status = 'imported'),
              m AS (SELECT max(day) AS mx FROM d)
         SELECT min(day) AS first_day, max(day) AS last_day, count(day) AS days
         FROM d, m WHERE d.day >= m.mx - 89`,
        )
        .bind(region),
      db.prepare(REGIONS_SQL),
    ],
  )
  const row = latest.results[0] as Record<string, number | null> | undefined
  const s = (span.results[0] as Record<string, number | null> | undefined) ?? {}
  return {
    hasData: Boolean(row),
    updatedAt: row?.updated_at ?? null,
    fetchedAt: row?.fetched_at ?? null,
    firstDay: s.first_day ?? null,
    lastDay: s.last_day ?? null,
    days: s.days ?? 0,
    regionsWithData: regions.results.map((r) => r.region as unknown as Region),
  }
}
