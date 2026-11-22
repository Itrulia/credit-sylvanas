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
    // 91 days old: a huge sales day that must not lift the baseline of item 1
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
    const rows = await rising(db, { region: 'us' })
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
    expect(await rising(db, { region: 'us' })).toEqual([])
  })

  it('stays within the region', async () => {
    await seedBaseline([{ id: 1, mv: 10_000, spd: 4 }])
    await seedDay('eu', D, [{ id: 1, mv: 12_000, spd: 8 }])
    expect(await rising(db, { region: 'eu' })).toEqual([])
  })
})
