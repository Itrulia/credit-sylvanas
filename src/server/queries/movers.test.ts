import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { resetTables } from '../test/reset.ts'
import { seedDay } from '../test/seed.ts'
import { movers } from './movers.ts'

resetTables()
const db = env.DB
const D = 20_000
const base = { asp: 10_000, spd: 5 }

describe('movers', () => {
  it('ranks vs 60-day average on day one and reports d1/d7 as unavailable', async () => {
    await seedDay('us', D - 90, [{ id: 9, mv: 99_000, hist: 10_000, ...base }])
    await seedDay('us', D, [
      { id: 1, mv: 13_000, hist: 10_000, ...base },
      { id: 2, mv: 11_000, hist: 10_000, ...base },
      { id: 3, mv: 7_000, hist: 10_000, ...base },
      { id: 4, mv: 10_020, hist: 10_000, ...base }, // under the 0.5% floor
      { id: 5, mv: 300_000, hist: 10_000, ...base }, // past 20x
    ])
    const up = await movers(db, {
      region: 'us',
      by: 'price',
      metric: 'vs_hist',
      dir: 1,
    })
    expect(up.rows.map((r) => r.id)).toEqual([1, 2])
    expect(up.rows[0]).toMatchObject({ change: 0.3, from: 10_000, to: 13_000 })
    expect(up.available).toEqual({ d1: false, d7: false, d7From: D + 7 })
    const down = await movers(db, {
      region: 'us',
      by: 'price',
      metric: 'vs_hist',
      dir: -1,
    })
    expect(down.rows.map((r) => r.id)).toEqual([3])
  })

  it('compares with the previous day and a week back, for price and sales', async () => {
    await seedDay('us', D - 8, [
      { id: 1, mv: 10_000, ...base, spd: 2 },
      { id: 2, mv: 10_000, ...base, spd: 0.5 },
    ])
    await seedDay('us', D - 1, [
      { id: 1, mv: 10_000, ...base, spd: 4 },
      { id: 2, mv: 10_000, ...base },
    ])
    await seedDay('us', D, [
      { id: 1, mv: 12_000, ...base, spd: 8 },
      { id: 2, mv: 9_000, ...base, spd: 6 },
    ])
    const d1 = await movers(db, {
      region: 'us',
      by: 'price',
      metric: 'd1',
      dir: 1,
    })
    expect(d1.rows.map((r) => [r.id, r.change, r.from, r.to])).toEqual([
      [1, 0.2, 10_000, 12_000],
    ])
    expect(d1.available).toMatchObject({ d1: true, d7: true })
    const sales = await movers(db, {
      region: 'us',
      by: 'sales',
      metric: 'd7',
      dir: 1,
    })
    // item 2 sold under 1 a day a week ago, so it does not count
    expect(sales.rows.map((r) => [r.id, r.change, r.from, r.to])).toEqual([
      [1, 3, 2, 8],
    ])
  })

  it('has no vs_hist window for sales', async () => {
    await expect(
      movers(db, { region: 'us', by: 'sales', metric: 'vs_hist', dir: 1 }),
    ).rejects.toThrow()
  })
})
