import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { resetTables } from '../test/reset.ts'
import { seedDay, seedRealmScan } from '../test/seed.ts'
import { listItems } from './list.ts'

resetTables()
const db = env.DB
const D = 20_000
const args = {
  region: 'us',
  q: '',
  sort: 'soldPerDay',
  dir: 'desc',
  page: 1,
} as const

describe('listItems', () => {
  it('lists the current day, sorts by a whitelisted column and pages by 50', async () => {
    await seedDay('us', D - 90, [{ id: 999 }])
    await seedDay(
      'us',
      D,
      Array.from({ length: 60 }, (_, i) => ({
        id: i + 1,
        name: `Thing ${i + 1}`,
        spd: i,
        hist: i === 0 ? 0 : 10_000,
      })),
    )
    const first = await listItems(db, args)
    expect(first.total).toBe(60)
    expect(first.rows).toHaveLength(50)
    expect(first.rows[0].id).toBe(60)
    expect(first.rows.some((r) => r.id === 999)).toBe(false)
    const second = await listItems(db, { ...args, page: 2 })
    expect(second.rows).toHaveLength(10)
    const byName = await listItems(db, {
      ...args,
      sort: 'name',
      dir: 'asc',
      q: 'thing 1',
    })
    expect(byName.rows.map((r) => r.name).slice(0, 3)).toEqual([
      'Thing 1',
      'Thing 10',
      'Thing 11',
    ])
    // tokens AND together: 'thing' and '1' (Thing 1, 10 to 19, 21, 31, 41, 51)
    expect(byName.total).toBe(15)
    // vsHist is null for hist = 0 and sorts last both ways
    const vs = await listItems(db, { ...args, sort: 'vsHist', dir: 'asc' })
    expect(vs.rows.at(-1)?.id).not.toBe(1)
    const vsPage2 = await listItems(db, {
      ...args,
      sort: 'vsHist',
      dir: 'asc',
      page: 2,
    })
    expect(vsPage2.rows.at(-1)?.id).toBe(1)
  })

  it('sorts by gold per day, sold per day times average sale price', async () => {
    await seedDay('us', D, [
      { id: 1, spd: 10, asp: 100 },
      { id: 2, spd: 1, asp: 5_000 },
      { id: 3, spd: 100, asp: 20 },
    ])
    const rows = await listItems(db, { ...args, sort: 'goldPerDay' })
    expect(rows.rows.map((r) => r.id)).toEqual([2, 3, 1])
  })

  it('adds the latest realm scan when a realm is set', async () => {
    await seedDay('us', D, [{ id: 1 }, { id: 2 }])
    const t = D * 86_400
    await seedRealmScan('us', 'r', 'horde', t - 3_600, [{ id: 1, mv: 1 }])
    await seedRealmScan('us', 'r', 'horde', t, [{ id: 1, mv: 5, minBuyout: 4 }])
    const { rows } = await listItems(db, {
      ...args,
      sort: 'name',
      dir: 'asc',
      realm: 'r',
      faction: 'horde',
    })
    expect(rows.map((r) => [r.id, r.realmMv, r.minBuyout])).toEqual([
      [1, 5, 4],
      [2, null, null],
    ])
  })
})
