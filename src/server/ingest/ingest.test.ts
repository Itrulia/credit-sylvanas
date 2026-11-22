import { env } from 'cloudflare:workers'
import { createScheduledController } from 'cloudflare:test'
import { describe, expect, it, vi } from 'vitest'
import usCsv from '../__fixtures__/region-items.csv?raw'
import euCsv from '../__fixtures__/region-items-eu.csv?raw'
import realmCsv from '../__fixtures__/realm-items.csv?raw'
import { clearArchive, resetTables } from '../test/reset.ts'
import { sentEtag, stubFetch } from '../test/stub-fetch.ts'
import { REGION_HEADER } from './csv.ts'
import { sha256Hex } from './archive.ts'
import { runIngest } from './ingest.ts'
import { REALM_CRON, REGION_CRON, runScheduled } from './jobs.ts'

resetTables()

const US = 'forever/us/region/items.csv'
const EU = 'forever/eu/region/items.csv'
const NOW = Date.UTC(2026, 10, 22, 19, 30)
const db = env.DB
const archive = env.ARCHIVE

const imports = () =>
  db
    .prepare('SELECT * FROM imports ORDER BY id')
    .all<Record<string, unknown>>()
    .then((r) => r.results)
const count = (sql: string) =>
  db
    .prepare(sql)
    .first<{ n: number }>()
    .then((r) => r?.n ?? 0)

function regionFile(n: number, iso: string, name = (i: number) => `Item ${i}`) {
  const lines = Array.from(
    { length: n },
    (_, i) => `${i + 1},${name(i + 1)},${100 + i},100,90,0.5,2,${iso}`,
  )
  return [REGION_HEADER, ...lines].join('\n') + '\n'
}

describe('runIngest', () => {
  it('imports region files, records provenance and archives the raw file', async () => {
    await clearArchive()
    const fetchFn = stubFetch({
      [US]: { body: usCsv, etag: '"us1"' },
      [EU]: { body: euCsv, etag: '"eu1"' },
    })
    const results = await runIngest(db, archive, fetchFn, {
      kind: 'region',
      now: NOW,
    })

    expect(results.map((r) => [r.status, r.reason])).toEqual([
      ['imported', null],
      ['imported', null],
      ['failed', 'no such file'],
      ['failed', 'no such file'],
    ])
    expect(fetchFn).toHaveBeenCalledTimes(4)

    const [us] = await imports()
    const key = 'forever/us/region/items/2026-11-20T08:54:05Z.csv.gz'
    expect(us).toMatchObject({
      region: 'us',
      kind: 'region',
      status: 'imported',
      rows: 40,
      etag: '"us1"',
      r2_key: key,
      updated_at: Date.parse('2026-11-20T08:54:05Z') / 1000,
      fetched_at: NOW / 1000,
    })

    const obj = await archive.get(key)
    expect(obj?.httpMetadata?.contentType).toBe('application/gzip')
    const raw = await new Response(
      obj!.body.pipeThrough(new DecompressionStream('gzip')),
    ).text()
    expect(raw).toBe(usCsv)
    expect(us.sha256).toBe(await sha256Hex(raw))

    expect(
      await count(
        `SELECT count(*) AS n FROM region_snapshots WHERE region = 'us'`,
      ),
    ).toBe(40)
    expect(
      await count(
        `SELECT count(*) AS n FROM region_snapshots s WHERE region = 'us' AND import_id <> ${Number(us.id)}`,
      ),
    ).toBe(0)
    const stray = await count(
      'SELECT count(*) AS n FROM region_snapshots s LEFT JOIN imports i ON i.id = s.import_id WHERE i.id IS NULL',
    )
    expect(stray).toBe(0)
  })

  it('fails loudly on a header mismatch and writes no prices', async () => {
    const fetchFn = stubFetch({
      [US]: { body: 'itemId,name,price\n1,x,3\n', etag: '"bad"' },
    })
    const [us] = await runIngest(db, archive, fetchFn, {
      kind: 'region',
      now: NOW,
    })
    expect(us.status).toBe('failed')
    expect(us.reason).toMatch(/unexpected header/)
    expect(await count('SELECT count(*) AS n FROM region_snapshots')).toBe(0)
  })

  it('reuses the ETag of a failed 200 on the next run', async () => {
    const fetchFn = stubFetch({ [US]: { body: 'garbage', etag: '"broken"' } })
    await runIngest(db, archive, fetchFn, { kind: 'region', now: NOW })
    await runIngest(db, archive, fetchFn, {
      kind: 'region',
      now: NOW + 3_600_000,
    })
    expect(sentEtag(fetchFn, 0)).toBeNull()
    expect(sentEtag(fetchFn, 4)).toBe('"broken"')
    const rows = await imports()
    expect(
      rows
        .filter(
          (r) =>
            r.source_url === `https://public-data.tradeskillmaster.com/${US}`,
        )
        .map((r) => [r.status, r.reason]),
    ).toEqual([
      ['failed', expect.stringMatching(/header/)],
      ['skipped', 'not modified'],
    ])
  })

  it('records a 304 as skipped', async () => {
    const fetchFn = stubFetch({ [US]: { body: usCsv, etag: '"same"' } })
    await runIngest(db, archive, fetchFn, { kind: 'region', now: NOW })
    const [second] = await runIngest(db, archive, fetchFn, {
      kind: 'region',
      now: NOW + 1000,
    })
    expect(second).toMatchObject({ status: 'skipped', reason: 'not modified' })
    expect(sentEtag(fetchFn, 4)).toBe('"same"')
  })

  it('skips an unchanged updatedAt without writing to R2', async () => {
    await clearArchive()
    await runIngest(
      db,
      archive,
      stubFetch({ [US]: { body: usCsv, etag: '"a"' } }),
      { kind: 'region', now: NOW },
    )
    const put = vi.spyOn(archive, 'put')
    const [second] = await runIngest(
      db,
      archive,
      stubFetch({ [US]: { body: usCsv, etag: '"b"' } }),
      {
        kind: 'region',
        now: NOW + 1000,
      },
    )
    expect(second).toMatchObject({
      status: 'skipped',
      reason: 'same updatedAt',
    })
    expect(put).not.toHaveBeenCalled()
    put.mockRestore()
    expect((await archive.list()).objects).toHaveLength(1)
  })

  it('fails when the row count drops under half of the last import', async () => {
    await runIngest(
      db,
      archive,
      stubFetch({
        [US]: { body: regionFile(100, '2026-11-20T08:54:05Z'), etag: '"1"' },
      }),
      {
        kind: 'region',
        now: NOW,
      },
    )
    const [second] = await runIngest(
      db,
      archive,
      stubFetch({
        [US]: { body: regionFile(40, '2026-11-21T08:54:05Z'), etag: '"2"' },
      }),
      { kind: 'region', now: NOW + 86_400_000 },
    )
    expect(second.status).toBe('failed')
    expect(second.reason).toMatch(/under half/)
  })

  it('upserts a later scan on the same day and adds the next day', async () => {
    await runIngest(
      db,
      archive,
      stubFetch({
        [US]: { body: regionFile(3, '2026-11-20T01:00:00Z'), etag: '"1"' },
      }),
      {
        kind: 'region',
        now: NOW,
      },
    )
    const later = regionFile(3, '2026-11-20T09:00:00Z').replace(
      '1,Item 1,100,',
      '1,Item 1,555,',
    )
    await runIngest(
      db,
      archive,
      stubFetch({ [US]: { body: later, etag: '"2"' } }),
      { kind: 'region', now: NOW },
    )
    const next = regionFile(3, '2026-11-21T09:00:00Z')
    await runIngest(
      db,
      archive,
      stubFetch({ [US]: { body: next, etag: '"3"' } }),
      {
        kind: 'region',
        now: NOW + 86_400_000,
      },
    )
    const rows = await db
      .prepare(
        `SELECT day, market_value, updated_at FROM region_snapshots WHERE region = 'us' AND item_id = 1 ORDER BY day`,
      )
      .all<{ day: number; market_value: number; updated_at: number }>()
    expect(rows.results.map((r) => r.market_value)).toEqual([555, 100])
    expect(rows.results[0].updated_at).toBe(
      Date.parse('2026-11-20T09:00:00Z') / 1000,
    )
    const item = await db
      .prepare('SELECT first_seen, last_seen FROM items WHERE id = 1')
      .first()
    expect(item).toEqual({
      first_seen: rows.results[0].day,
      last_seen: rows.results[1].day,
    })
  })

  it('lets only us and eu overwrite item names', async () => {
    const KR = 'forever/kr/region/items.csv'
    await runIngest(
      db,
      archive,
      stubFetch({
        [US]: {
          body: regionFile(2, '2026-11-20T08:00:00Z', (i) => `US ${i}`),
          etag: '"u"',
        },
        [KR]: {
          body: regionFile(3, '2026-11-20T08:00:00Z', (i) => `KR ${i}`),
          etag: '"k"',
        },
      }),
      { kind: 'region', now: NOW },
    )
    const names = await db
      .prepare('SELECT name FROM items ORDER BY id')
      .all<{ name: string }>()
    expect(names.results.map((r) => r.name)).toEqual(['US 1', 'US 2', 'KR 3'])
  })

  it('accepts empty names but never lets one overwrite a known name', async () => {
    const KR = 'forever/kr/region/items.csv'
    await runIngest(
      db,
      archive,
      stubFetch({
        [US]: {
          body: regionFile(2, '2026-11-20T08:00:00Z', (i) =>
            i === 1 ? '' : `US ${i}`,
          ),
          etag: '"u"',
        },
        [KR]: {
          body: regionFile(2, '2026-11-20T08:00:00Z', (i) =>
            i === 1 ? 'KR 1' : '',
          ),
          etag: '"k"',
        },
      }),
      { kind: 'region', now: NOW },
    )
    const names = await db
      .prepare('SELECT name FROM items ORDER BY id')
      .all<{ name: string }>()
    expect(names.results.map((r) => r.name)).toEqual(['KR 1', 'US 2'])
  })

  it('writes a 2,500-row file in three chunks inside one batch', async () => {
    const batch = vi.spyOn(db, 'batch')
    const started = Date.now()
    const [us] = await runIngest(
      db,
      archive,
      stubFetch({
        [US]: {
          body: regionFile(2_500, '2026-11-20T08:54:05Z'),
          etag: '"big"',
        },
      }),
      { kind: 'region', now: NOW },
    )
    expect(us.status).toBe('imported')
    expect(batch).toHaveBeenCalledTimes(1)
    // 1 import + 3 item chunks + 3 snapshot chunks
    expect(batch.mock.calls[0][0]).toHaveLength(7)
    batch.mockRestore()
    expect(await count('SELECT count(*) AS n FROM region_snapshots')).toBe(
      2_500,
    )

    // a full 7,800-row file stays far below the 30 s batch limit
    const t = Date.now()
    await runIngest(
      db,
      archive,
      stubFetch({
        [US]: {
          body: regionFile(7_800, '2026-11-21T08:54:05Z'),
          etag: '"full"',
        },
      }),
      { kind: 'region', now: NOW + 86_400_000 },
    )
    expect(Date.now() - t).toBeLessThan(10_000)
    expect(t - started).toBeLessThan(10_000)
  })

  it('rolls the whole file back when the batch fails on its last statement', async () => {
    await runIngest(
      db,
      archive,
      stubFetch({
        [US]: { body: regionFile(3, '2026-11-20T08:00:00Z'), etag: '"1"' },
      }),
      {
        kind: 'region',
        now: NOW,
      },
    )
    const realBatch = db.batch.bind(db)
    const spy = vi.spyOn(db, 'batch').mockImplementation((stmts) =>
      realBatch([
        ...stmts,
        // breaks the region CHECK, so the transaction aborts on its last statement
        db.prepare(
          `INSERT INTO imports (region, kind, source_url, fetched_at, status) VALUES ('xx', 'region', 'u', 0, 'failed')`,
        ),
      ]),
    )
    const [second] = await runIngest(
      db,
      archive,
      stubFetch({
        [US]: { body: regionFile(3, '2026-11-21T08:00:00Z'), etag: '"2"' },
      }),
      { kind: 'region', now: NOW + 86_400_000 },
    )
    spy.mockRestore()
    expect(second.status).toBe('failed')
    expect(second.reason).toMatch(/write failed/)
    const rows = await imports()
    const usRows = rows.filter((r) => r.region === 'us')
    expect(usRows.map((r) => r.status)).toEqual(['imported', 'failed'])
    expect(usRows[1].r2_key).toBe(
      'forever/us/region/items/2026-11-21T08:00:00Z.csv.gz',
    )
    expect(
      await count('SELECT count(DISTINCT day) AS n FROM region_snapshots'),
    ).toBe(1)
  })

  it('keeps every day of a 100-day run', async () => {
    for (let d = 0; d < 100; d++) {
      const iso = new Date(Date.UTC(2026, 5, 1, 8) + d * 86_400_000)
        .toISOString()
        .replace('.000', '')
      await runIngest(
        db,
        archive,
        stubFetch({ [US]: { body: regionFile(2, iso), etag: `"d${d}"` } }),
        {
          kind: 'region',
          now: Date.parse(iso) + 3_600_000,
        },
      )
    }
    expect(
      await count(
        `SELECT count(DISTINCT day) AS n FROM region_snapshots WHERE region = 'us'`,
      ),
    ).toBe(100)
  })

  it('makes no fetch for realm jobs while realms.ts is empty', async () => {
    const fetchFn = stubFetch({})
    expect(
      await runIngest(db, archive, fetchFn, { kind: 'realm', now: NOW }),
    ).toEqual([])
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('ingests configured realm files for both factions and rejects a 1970 scan', async () => {
    const realms = [
      { region: 'us', slug: 'test', name: 'Test', ruleset: 'pvp' },
    ] as const
    const good = realmCsv.replaceAll(
      '1970-03-03T08:58:00Z',
      '2026-11-22T08:58:00Z',
    )
    const fetchFn = stubFetch({
      'forever/us/realm/test-alliance/items.csv': { body: good, etag: '"a"' },
      'forever/us/realm/test-horde/items.csv': { body: realmCsv, etag: '"h"' },
    })
    const results = await runIngest(db, archive, fetchFn, {
      kind: 'realm',
      now: NOW,
      realms,
    })
    expect(results.map((r) => r.status)).toEqual(['imported', 'failed'])
    expect(results[1].reason).toMatch(/implausible updatedAt/)
    const rows = await count(
      `SELECT count(*) AS n FROM realm_snapshots WHERE realm = 'test' AND faction = 'alliance'`,
    )
    expect(rows).toBe(20)
    const [first] = await imports()
    expect(first).toMatchObject({
      kind: 'realm',
      realm: 'test-alliance',
      r2_key:
        'forever/us/realm/test-alliance/items/2026-11-22T08:58:00Z.csv.gz',
    })
  })

  it('never removes rows: no such statement anywhere in ingest', () => {
    const word = ['DEL', 'ETE'].join('')
    const sources = import.meta.glob('./*.ts', {
      query: '?raw',
      import: 'default',
      eager: true,
    })
    const files = Object.entries(sources).filter(
      ([f]) => !f.endsWith('.test.ts'),
    )
    expect(files.length).toBeGreaterThanOrEqual(4)
    for (const [file, text] of files) {
      expect(new RegExp(`\\b${word}\\b`, 'i').test(text), file).toBe(false)
    }
  })
})

describe('runScheduled', () => {
  it('runs the region ingest for REGION_CRON', async () => {
    const fetchFn = stubFetch({ [US]: { body: usCsv, etag: '"x"' } })
    const results = await runScheduled(
      createScheduledController({ cron: REGION_CRON, scheduledTime: NOW }),
      db,
      archive,
      fetchFn,
    )
    expect(results[0].status).toBe('imported')
    expect(fetchFn).toHaveBeenCalledTimes(4)
  })

  it('makes no request for REALM_CRON with no realms', async () => {
    const fetchFn = stubFetch({})
    await runScheduled(
      createScheduledController({ cron: REALM_CRON, scheduledTime: NOW }),
      db,
      archive,
      fetchFn,
    )
    expect(fetchFn).not.toHaveBeenCalled()
    expect(
      await count(`SELECT count(*) AS n FROM imports WHERE kind = 'realm'`),
    ).toBe(0)
  })

  it('throws on an unknown cron', async () => {
    await expect(
      runScheduled(
        createScheduledController({ cron: '* * * * *' }),
        db,
        archive,
        stubFetch({}),
      ),
    ).rejects.toThrow('Unknown cron * * * * *')
  })

  it('throws when a file fails for a reason other than a missing file', async () => {
    const fetchFn = stubFetch({ [US]: { body: 'nope', etag: '"n"' } })
    await expect(
      runScheduled(
        createScheduledController({ cron: REGION_CRON, scheduledTime: NOW }),
        db,
        archive,
        fetchFn,
      ),
    ).rejects.toThrow(/ingest failed/)
  })
})
