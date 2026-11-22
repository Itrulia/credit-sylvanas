import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { resetTables } from '../test/reset.ts'
import { seedDay } from '../test/seed.ts'
import type { SeedRow } from '../test/seed.ts'
import { rising } from './rising.ts'

resetTables()
const db = env.DB
const D = 20_000

/** 20 days of baseline (D-27..D-8), each item at the given sold/day and price. */
async function seedBaseline(rows: SeedRow[], from = D - 27) {
  for (let day = from; day <= D - 8; day++) {
    await seedDay('us', day, rows)
  }
}

describe('rising', () => {
  it('keeps items up at least 5% on the week and selling 1.25x their 30-day average, ranked by price change', async () => {
    // outside the 30-day window: a huge sales day that must not lift item 1's baseline
    await seedDay('us', D - 90, [{ id: 1, spd: 10_000 }])
    await seedBaseline([
      { id: 1, mv: 10_000, spd: 4 },
      { id: 2, mv: 10_000, spd: 4 },
      { id: 3, mv: 10_000, spd: 4 },
      { id: 4, mv: 10_000, spd: 4 },
      { id: 5, mv: 10_000, spd: 4, asp: 100 },
    ])
    await seedDay('us', D, [
      { id: 1, name: 'Up 10%', mv: 11_000, spd: 5 },
      { id: 2, name: 'Up 50%', mv: 15_000, spd: 8 },
      { id: 3, name: 'Up 4%', mv: 10_400, spd: 8 },
      { id: 4, name: 'Flat sales', mv: 15_000, spd: 4.9 },
      { id: 5, name: 'Thin', mv: 15_000, spd: 8, asp: 100 },
    ])
    const { rows, days } = await rising(db, { region: 'us' })
    expect(days).toBe(20)
    expect(rows.map((r) => r.id)).toEqual([2, 1])
    expect(rows[1]).toMatchObject({
      name: 'Up 10%',
      mv: 11_000,
      spd: 5,
      avgSpd: 4,
    })
    expect(rows[1].change).toBeCloseTo(0.1)
    expect(rows[1].lift).toBeCloseTo(1.25)
  })

  it('needs 14 days of the item in the previous 30', async () => {
    await seedBaseline([{ id: 1, mv: 10_000, spd: 4 }], D - 20) // 13 days
    await seedDay('us', D - 40, [{ id: 1, mv: 10_000, spd: 4 }]) // outside 30
    await seedDay('us', D, [{ id: 1, mv: 12_000, spd: 8 }])
    expect((await rising(db, { region: 'us' })).rows).toEqual([])
  })

  it('stays within the region', async () => {
    await seedBaseline([{ id: 1, mv: 10_000, spd: 4 }])
    await seedDay('eu', D, [{ id: 1, mv: 12_000, spd: 8 }])
    expect(await rising(db, { region: 'eu' })).toEqual({ rows: [], days: 0 })
  })

  it('ignores a junk week-ago price', async () => {
    await seedBaseline([{ id: 1, mv: 1, hist: 500, spd: 4 }])
    await seedDay('us', D, [{ id: 1, mv: 500, hist: 500, spd: 8 }])
    expect((await rising(db, { region: 'us' })).rows).toEqual([])
  })

  it('compares with the latest day 7 to 9 days back', async () => {
    await seedBaseline([{ id: 1, mv: 5_000, spd: 4 }])
    await seedDay('us', D - 8, [{ id: 1, mv: 10_000, spd: 4 }])
    await seedDay('us', D, [{ id: 1, mv: 11_000, spd: 8 }])
    const { rows } = await rising(db, { region: 'us' })
    expect(rows).toHaveLength(1)
    expect(rows[0].change).toBeCloseTo(0.1)
  })

  it('skips an item missing on the week-ago day', async () => {
    for (let day = D - 27; day <= D - 9; day++) {
      await seedDay('us', day, [{ id: 1, mv: 10_000, spd: 4 }])
    }
    await seedDay('us', D - 8, [{ id: 2, mv: 10_000, spd: 4 }])
    await seedDay('us', D, [{ id: 1, mv: 12_000, spd: 8 }])
    expect((await rising(db, { region: 'us' })).rows).toEqual([])
  })

  it('returns nothing when the region has no day 7 to 9 days back', async () => {
    for (const day of [
      ...Array.from({ length: 21 }, (_, i) => D - 30 + i),
      ...Array.from({ length: 6 }, (_, i) => D - 6 + i),
    ]) {
      await seedDay('us', day, [{ id: 1, mv: 10_000, spd: 4 }])
    }
    await seedDay('us', D, [{ id: 1, mv: 12_000, spd: 8 }])
    expect(await rising(db, { region: 'us' })).toEqual({ rows: [], days: 27 })
  })

  it('counts only snapshot days in the previous 30', async () => {
    for (let day = D - 60; day <= D - 31; day++) {
      await seedDay('us', day, [{ id: 1 }])
    }
    await seedDay('us', D - 3, [{ id: 1 }])
    await seedDay('us', D, [{ id: 1 }])
    expect((await rising(db, { region: 'us' })).days).toBe(1)
  })
})
