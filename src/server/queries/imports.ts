import '@tanstack/react-start/server-only'
import type { ImportLogRow } from '../types.ts'

// Raw reasons can carry D1, R2 or fetch error text (see errors.ts); the
// public log only ever shows one of these fixed labels.
const REASONS: [RegExp, string][] = [
  [/^(not modified|same updatedAt)$/, 'File unchanged'],
  [/^no such file$/, 'No file published'],
  [/^(fetch failed|HTTP )/, 'Download failed'],
  [/^(archive|write) failed/, 'Storage error'],
  [/^row count /, 'File much smaller than usual'],
  [
    /^(unexpected header|no rows|no valid rows|\d+ of \d+ rows|rows carry|unparseable|implausible)/,
    'File format changed',
  ],
]

export function publicReason(reason: string | null): string | null {
  if (reason === null) {
    return null
  }
  return REASONS.find(([re]) => re.test(reason))?.[1] ?? 'File rejected'
}

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
    reason: publicReason(r.reason),
    sha: r.sha,
  }))
}
