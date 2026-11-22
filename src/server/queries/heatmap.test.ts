import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { resetTables } from '../test/reset.ts'
import { seedDay } from '../test/seed.ts'
import {
  buildDailyChange,
  buildHeatmap,
  crossRegion,
  dailyChange,
} from './heatmap.ts'

resetTables()
const db = env.DB
const D = 20_000
const NOW = D * 86_400_000 + 12 * 3_600_000

describe('crossRegion', () => {
  it("reads each region's latest day", async () => {
    await seedDay('us', D - 1, [
      { id: 1, mv: 1 },
      { id: 2, mv: 1 },
    ])
    await seedDay('us', D, [{ id: 1, mv: 100 }])
    await seedDay('eu', D, [
      { id: 1, mv: 200 },
      { id: 2, mv: 0 },
    ])
    const r = await crossRegion(db, [1, 2], NOW)
    expect(r.regionsWithData.sort()).toEqual(['eu', 'us'])
    expect(r.cells.map((c) => [c.itemId, c.region, c.mv]).sort()).toEqual([
      [1, 'eu', 200],
      [1, 'us', 100],
    ])
  })

  it('ignores a region whose latest day is past 90 days', async () => {
    await seedDay('eu', D - 90, [{ id: 1, mv: 5 }])
    await seedDay('us', D, [{ id: 1, mv: 100 }])
    const r = await crossRegion(db, [1], NOW)
    expect(r.regionsWithData).toEqual(['us'])
    expect(r.cells.map((c) => [c.itemId, c.region, c.mv])).toEqual([
      [1, 'us', 100],
    ])
  })
})

describe('dailyChange', () => {
  it('computes d1 with a 3-day lookback, null after a gap and on the first day', async () => {
    await seedDay('us', D - 90, [{ id: 1, mv: 1 }])
    await seedDay('us', D - 10, [
      { id: 1, mv: 100 },
      { id: 2, mv: 100 },
    ])
    await seedDay('us', D - 5, [{ id: 1, mv: 200 }])
    await seedDay('us', D - 4, [
      { id: 1, mv: 100 },
      { id: 2, mv: 120 },
    ])
    await seedDay('us', D, [
      { id: 1, mv: 150 },
      { id: 2, mv: 120 },
    ])
    const rows = await dailyChange(db, { region: 'us', ids: [1, 2] })
    expect(rows).toEqual([
      { itemId: 1, day: D - 10, d1: null },
      { itemId: 1, day: D - 5, d1: null },
      { itemId: 1, day: D - 4, d1: -0.5 },
      { itemId: 1, day: D, d1: null },
      { itemId: 2, day: D - 10, d1: null },
      { itemId: 2, day: D - 4, d1: null },
      { itemId: 2, day: D, d1: null },
    ])
  })
})

describe('buildHeatmap', () => {
  it('indexes each cell against the cross-region median', async () => {
    const liquid = { asp: 10_000, spd: 5 }
    await seedDay('us', D, [
      { id: 1, mv: 100, ...liquid },
      { id: 2, mv: 100, ...liquid, spd: 1 },
    ])
    await seedDay('eu', D, [{ id: 1, mv: 300 }])
    const r = await buildHeatmap(db, { region: 'us', n: 10 }, NOW)
    expect(r.regionsWithData).toEqual(['us', 'eu'])
    expect(r.rows.map((x) => x.id)).toEqual([1, 2])
    expect(r.rows[0].cells.us?.index).toBeCloseTo(-0.5)
    expect(r.rows[1].cells.eu).toBeNull()
    expect(r.rows[0].spread).toBeCloseTo(1)
    expect(r.rows[1].spread).toBeNull()
    expect(r.rows[1].cells.us?.index).toBeNull()
  })
})

describe('buildDailyChange', () => {
  it('is unavailable before 7 scan days', async () => {
    await seedDay('us', D - 1, [{ id: 1, asp: 10_000, spd: 5 }])
    await seedDay('us', D, [{ id: 1, asp: 10_000, spd: 5 }])
    expect(await buildDailyChange(db, { region: 'us', n: 10 })).toEqual({
      available: false,
      days: 2,
      from: D + 5,
    })
  })

  it('aligns d1 to the day columns, null for a missing day', async () => {
    const liquid = { asp: 10_000, spd: 5 }
    for (let d = D - 6; d <= D; d++) {
      await seedDay(
        'us',
        d,
        d === D - 3
          ? [{ id: 1, mv: 100, ...liquid }]
          : [
              { id: 1, mv: 100, ...liquid },
              { id: 2, mv: 100 + d - D + 6, ...liquid },
            ],
      )
    }
    const r = await buildDailyChange(db, { region: 'us', n: 10 })
    expect(r.available).toBe(true)
    if (r.available) {
      expect(r.cols).toHaveLength(7)
      expect(r.rows[0].d1).toEqual([null, 0, 0, 0, 0, 0, 0])
      expect(r.rows[1].d1[3]).toBeNull()
      expect(r.rows[1].d1[1]).toBeCloseTo(0.01)
    }
  })
})
