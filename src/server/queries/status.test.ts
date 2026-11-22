import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { resetTables } from '../test/reset.ts'
import { seedDay } from '../test/seed.ts'
import { importLog, publicReason } from './imports.ts'
import { regionStatus } from './status.ts'

resetTables()
const db = env.DB
const D = 20_000

describe('regionStatus', () => {
  it('reports no data before the first import', async () => {
    expect(await regionStatus(db, 'us')).toEqual({
      hasData: false,
      updatedAt: null,
      fetchedAt: null,
      firstDay: null,
      lastDay: null,
      days: 0,
      regionsWithData: [],
    })
  })

  it('counts only the last 90 days and never touches a snapshot table', async () => {
    await seedDay('us', D - 90, [{ id: 1 }]) // 91 days back: outside the window
    await seedDay('us', D - 89, [{ id: 1 }])
    await seedDay('us', D - 1, [{ id: 1 }])
    await seedDay('us', D, [{ id: 1 }])
    await seedDay('eu', D, [{ id: 1 }])
    const prepare = vi.spyOn(db, 'prepare')
    const s = await regionStatus(db, 'us')
    const sql = prepare.mock.calls.map((c) => c[0]).join('\n')
    prepare.mockRestore()
    expect(sql).not.toMatch(/region_snapshots|realm_snapshots/)
    expect(s).toEqual({
      hasData: true,
      updatedAt: D * 86_400 + 3_600,
      fetchedAt: D * 86_400 + 3_660,
      firstDay: D - 89,
      lastDay: D,
      days: 3,
      regionsWithData: ['eu', 'us'],
    })
  })
})

describe('importLog', () => {
  it('returns metadata only, newest first, with a short hash', async () => {
    await seedDay('us', D - 1, [{ id: 1 }])
    await seedDay('eu', D, [{ id: 1 }])
    const rows = await importLog(db, 20)
    expect(rows.map((r) => r.region)).toEqual(['eu', 'us'])
    for (const r of rows) {
      expect(r).not.toHaveProperty('source_url')
      expect(r).not.toHaveProperty('sourceUrl')
      expect(r).not.toHaveProperty('r2_key')
      expect(r).not.toHaveProperty('r2Key')
      expect(r).not.toHaveProperty('etag')
      expect(r.sha).toHaveLength(12)
    }
    expect(await importLog(db, 1)).toHaveLength(1)
  })
})

describe('publicReason', () => {
  // raw reasons can hold D1, R2 or fetch error text, which never reaches visitors
  it.each([
    [null, null],
    ['not modified', 'File unchanged'],
    ['same updatedAt', 'File unchanged'],
    ['no such file', 'No file published'],
    ['fetch failed: getaddrinfo ENOTFOUND 10.0.0.1', 'Download failed'],
    ['HTTP 503', 'Download failed'],
    ['archive failed: R2 internal error', 'Storage error'],
    ['write failed: D1_ERROR: no such table: items', 'Storage error'],
    [
      'row count 10 is under half of the last import (7000)',
      'File much smaller than usual',
    ],
    ['unexpected header: a,b,c', 'File format changed'],
    ['12 of 40 rows failed validation', 'File format changed'],
    ['something new', 'File rejected'],
  ])('%s -> %s', (raw, label) => {
    expect(publicReason(raw)).toBe(label)
  })

  it('is what importLog returns', async () => {
    await db
      .prepare(
        `INSERT INTO imports (region, kind, source_url, fetched_at, status, reason) VALUES ('us', 'region', 'u', 1, 'failed', 'write failed: D1_ERROR: boom')`,
      )
      .run()
    const [row] = await importLog(db, 1)
    expect(row.reason).toBe('Storage error')
  })
})
