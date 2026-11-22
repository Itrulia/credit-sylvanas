import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { resetTables } from '../test/reset.ts'
import { seedDay } from '../test/seed.ts'
import { hottest } from './hottest.ts'

resetTables()
const db = env.DB
const D = 20_000

describe('hottest', () => {
  it('ranks liquid items by gold volume or units sold, with d1 once a previous day exists', async () => {
    await seedDay('us', D - 90, [{ id: 9, spd: 999, asp: 99_999 }]) // 91 days old
    await seedDay('us', D - 1, [{ id: 1, mv: 8_000 }])
    await seedDay('us', D, [
      {
        id: 1,
        name: 'Gold mover',
        mv: 10_000,
        hist: 8_000,
        asp: 10_000,
        spd: 10,
      },
      { id: 2, name: 'Volume', mv: 100, hist: 100, asp: 100, spd: 500 },
      { id: 3, name: 'Illiquid', spd: 0.1 },
      { id: 4, name: 'Outlier asp', mv: 10, hist: 10, asp: 10_000, spd: 10 },
      { id: 5, name: 'Tiny', asp: 10, spd: 1 },
    ])
    const gold = await hottest(db, { region: 'us', by: 'gold', limit: 10 })
    expect(gold.map((r) => r.id)).toEqual([1, 2])
    expect(gold[0]).toMatchObject({
      name: 'Gold mover',
      goldVolume: 100_000,
      vsHist: 0.25,
      d1: 0.25,
    })
    expect(gold[1].d1).toBeNull()
    const traded = await hottest(db, { region: 'us', by: 'traded', limit: 1 })
    expect(traded.map((r) => r.id)).toEqual([2])
    expect(gold.some((r) => r.id === 9)).toBe(false)
  })

  it('ignores a previous day more than 3 days back', async () => {
    await seedDay('us', D - 4, [{ id: 1, mv: 5_000 }])
    await seedDay('us', D, [{ id: 1, spd: 10 }])
    const [row] = await hottest(db, { region: 'us', by: 'gold', limit: 10 })
    expect(row.d1).toBeNull()
  })
})
