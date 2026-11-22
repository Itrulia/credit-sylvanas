import '@tanstack/react-start/server-only'
import type { ImportLogRow } from '../types.ts'

// Metadata only: no source URL, R2 key or ETag ever leaves this query.
export async function importLog(
  db: D1Database,
  limit: number,
): Promise<ImportLogRow[]> {
  const rows = await db
    .prepare(
      `SELECT fetched_at, updated_at, region, kind, realm, rows, status, reason, substr(sha256, 1, 12) AS sha
       FROM imports ORDER BY id DESC LIMIT ?1`,
    )
    .bind(limit)
    .all<{
      fetched_at: number
      updated_at: number | null
      region: ImportLogRow['region']
      kind: ImportLogRow['kind']
      realm: string | null
      rows: number
      status: ImportLogRow['status']
      reason: string | null
      sha: string | null
    }>()
  return rows.results.map((r) => ({
    fetchedAt: r.fetched_at,
    updatedAt: r.updated_at,
    region: r.region,
    kind: r.kind,
    realm: r.realm,
    rows: r.rows,
    status: r.status,
    reason: r.reason,
    sha: r.sha,
  }))
}
