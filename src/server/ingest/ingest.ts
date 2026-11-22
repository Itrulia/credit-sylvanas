import '@tanstack/react-start/server-only'
import { REALMS } from '../../config/realms.ts'
import type { RealmConfig } from '../../config/realms.ts'
import { archiveFile, archiveKey, sha256Hex } from './archive.ts'
import type { ArchiveBucket } from './archive.ts'
import { parseFile } from './csv.ts'
import type { RealmRow, RegionRow } from './csv.ts'
import { buildJobs } from './jobs.ts'
import type { Job } from './jobs.ts'

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

export interface IngestOptions {
  kind: 'region' | 'realm'
  /** unix ms */
  now: number
  /** defaults to src/config/realms.ts */
  realms?: readonly RealmConfig[]
}

export interface JobResult {
  url: string
  status: 'imported' | 'skipped' | 'failed'
  reason: string | null
  rows: number
}

// D1 allows 100 bound parameters per statement, so rows travel as one JSON
// parameter read with json_each, 1,000 rows per statement (DESIGN §3).
export const CHUNK = 1_000
const NAME_OWNERS = new Set(['us', 'eu'])

interface ImportRow {
  region: string
  kind: string
  realm: string | null
  source_url: string
  r2_key: string | null
  etag: string | null
  updated_at: number | null
  fetched_at: number
  rows: number
  sha256: string | null
  status: 'imported' | 'skipped' | 'failed'
  reason: string | null
}

const INSERT_IMPORT = `INSERT INTO imports
  (region, kind, realm, source_url, r2_key, etag, updated_at, fetched_at, rows, sha256, status, reason)
  VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`

const importStatement = (db: D1Database, r: ImportRow) =>
  db
    .prepare(INSERT_IMPORT)
    .bind(
      r.region,
      r.kind,
      r.realm,
      r.source_url,
      r.r2_key,
      r.etag,
      r.updated_at,
      r.fetched_at,
      r.rows,
      r.sha256,
      r.status,
      r.reason,
    )

const UPSERT_ITEMS = `INSERT INTO items (id, name, first_seen, last_seen)
  SELECT json_extract(j.value, '$[0]'), json_extract(j.value, '$[1]'), ?1, ?1
  FROM json_each(?2) AS j WHERE true
  ON CONFLICT (id) DO UPDATE SET
    -- us/eu own names; anyone may fill an empty one; an empty name never overwrites
    name = CASE WHEN excluded.name <> '' AND (?3 OR items.name = '') THEN excluded.name ELSE items.name END,
    first_seen = min(items.first_seen, excluded.first_seen),
    last_seen = max(items.last_seen, excluded.last_seen)`

const UPSERT_REGION = `INSERT INTO region_snapshots
  (region, day, item_id, market_value, historical, avg_sale_price, sale_rate, sold_per_day, updated_at, import_id)
  SELECT ?1, ?2, json_extract(j.value, '$[0]'), json_extract(j.value, '$[1]'), json_extract(j.value, '$[2]'),
         json_extract(j.value, '$[3]'), json_extract(j.value, '$[4]'), json_extract(j.value, '$[5]'), ?3,
         (SELECT max(id) FROM imports)
  FROM json_each(?4) AS j WHERE true
  ON CONFLICT (region, day, item_id) DO UPDATE SET
    market_value = excluded.market_value, historical = excluded.historical,
    avg_sale_price = excluded.avg_sale_price, sale_rate = excluded.sale_rate,
    sold_per_day = excluded.sold_per_day, updated_at = excluded.updated_at,
    import_id = excluded.import_id`

const INSERT_REALM = `INSERT INTO realm_snapshots
  (region, realm, faction, item_id, updated_at, day, market_value, min_buyout, recent, historical, import_id)
  SELECT ?1, ?2, ?3, json_extract(j.value, '$[0]'), ?4, ?5, json_extract(j.value, '$[1]'),
         json_extract(j.value, '$[2]'), json_extract(j.value, '$[3]'), json_extract(j.value, '$[4]'),
         (SELECT max(id) FROM imports)
  FROM json_each(?6) AS j WHERE true
  ON CONFLICT DO NOTHING`

function chunks<T>(rows: readonly T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < rows.length; i += CHUNK) {
    out.push(rows.slice(i, i + CHUNK))
  }
  return out
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function runJob(
  db: D1Database,
  archive: ArchiveBucket,
  fetchFn: FetchFn,
  job: Job,
  nowMs: number,
): Promise<JobResult> {
  const fetchedAt = Math.floor(nowMs / 1000)
  const base: ImportRow = {
    region: job.region,
    kind: job.kind,
    realm: job.realm,
    source_url: job.url,
    r2_key: null,
    etag: null,
    updated_at: null,
    fetched_at: fetchedAt,
    rows: 0,
    sha256: null,
    status: 'failed',
    reason: null,
  }
  const record = async (
    row: Partial<ImportRow> & Pick<ImportRow, 'status'>,
  ) => {
    const full = { ...base, ...row }
    await importStatement(db, full).run()
    return {
      url: job.url,
      status: full.status,
      reason: full.reason,
      rows: full.rows,
    }
  }

  // ETag from the newest row whatever its status, so a broken or unchanged
  // file is not downloaded again on every run (TSM term 4)
  const lastEtag = await db
    .prepare(
      'SELECT etag FROM imports WHERE source_url = ?1 AND etag IS NOT NULL ORDER BY id DESC LIMIT 1',
    )
    .bind(job.url)
    .first<{ etag: string }>()
  const lastImported = await db
    .prepare(
      `SELECT updated_at, rows FROM imports WHERE source_url = ?1 AND status = 'imported' ORDER BY id DESC LIMIT 1`,
    )
    .bind(job.url)
    .first<{ updated_at: number; rows: number }>()

  let res: Response
  try {
    res = await fetchFn(job.url, {
      headers: lastEtag ? { 'If-None-Match': lastEtag.etag } : {},
      signal: AbortSignal.timeout(60_000),
    })
  } catch (e) {
    return record({ status: 'failed', reason: `fetch failed: ${message(e)}` })
  }

  if (res.status === 304) {
    return record({
      status: 'skipped',
      reason: 'not modified',
      etag: lastEtag?.etag ?? null,
    })
  }
  if (res.status === 404) {
    return record({ status: 'failed', reason: 'no such file' })
  }
  if (res.status !== 200) {
    return record({ status: 'failed', reason: `HTTP ${res.status}` })
  }

  const etag = res.headers.get('ETag')
  const text = await res.text()
  const sha256 = await sha256Hex(text)
  const parsed = parseFile(job.kind, text, fetchedAt)
  if (!parsed.ok) {
    return record({ status: 'failed', reason: parsed.reason, etag, sha256 })
  }
  const { rows, updatedAt, updatedAtIso } = parsed
  const meta = { etag, sha256, updated_at: updatedAt, rows: rows.length }

  if (lastImported && rows.length < lastImported.rows * 0.5) {
    return record({
      ...meta,
      status: 'failed',
      reason: `row count ${rows.length} is under half of the last import (${lastImported.rows})`,
    })
  }
  if (lastImported?.updated_at === updatedAt) {
    return record({ ...meta, status: 'skipped', reason: 'same updatedAt' })
  }

  const r2Key = archiveKey(job.region, updatedAtIso, job.realm)
  try {
    await archiveFile(archive, r2Key, text)
  } catch (e) {
    return record({
      ...meta,
      status: 'failed',
      reason: `archive failed: ${message(e)}`,
    })
  }

  const day = Math.floor(updatedAt / 86_400)
  const statements: D1PreparedStatement[] = [
    importStatement(db, {
      ...base,
      ...meta,
      r2_key: r2Key,
      status: 'imported',
      reason: null,
    }),
  ]
  const overwriteNames =
    job.kind === 'region' && NAME_OWNERS.has(job.region) ? 1 : 0
  for (const part of chunks(rows)) {
    statements.push(
      db
        .prepare(UPSERT_ITEMS)
        .bind(
          day,
          JSON.stringify(part.map((r) => [r.itemId, r.name])),
          overwriteNames,
        ),
    )
  }
  if (job.kind === 'region') {
    for (const part of chunks(rows as RegionRow[])) {
      const json = JSON.stringify(
        part.map((r) => [r.itemId, r.mv, r.hist, r.asp, r.saleRate, r.spd]),
      )
      statements.push(
        db.prepare(UPSERT_REGION).bind(job.region, day, updatedAt, json),
      )
    }
  } else {
    for (const part of chunks(rows as RealmRow[])) {
      const json = JSON.stringify(
        part.map((r) => [r.itemId, r.mv, r.minBuyout, r.recent, r.hist]),
      )
      statements.push(
        db
          .prepare(INSERT_REALM)
          .bind(job.region, job.slug, job.faction, updatedAt, day, json),
      )
    }
  }

  try {
    // one batch = one transaction: a failure rolls the whole file back, including the imported row
    await db.batch(statements)
  } catch (e) {
    return record({
      ...meta,
      r2_key: r2Key,
      status: 'failed',
      reason: `write failed: ${message(e)}`,
    })
  }
  return { url: job.url, status: 'imported', reason: null, rows: rows.length }
}

/** The one ingest entry point: scheduled handler, tests and the seed script all call it. */
export async function runIngest(
  db: D1Database,
  archive: ArchiveBucket,
  fetchFn: FetchFn,
  opts: IngestOptions,
): Promise<JobResult[]> {
  const jobs = buildJobs(opts.kind, opts.realms ?? REALMS)
  const results: JobResult[] = []
  // one after another, each in isolation
  for (const job of jobs) {
    try {
      results.push(await runJob(db, archive, fetchFn, job, opts.now))
    } catch (e) {
      results.push({
        url: job.url,
        status: 'failed',
        reason: message(e),
        rows: 0,
      })
    }
  }
  return results
}
