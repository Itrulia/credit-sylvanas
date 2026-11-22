import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { resetTables } from '../test/reset.ts'
import { seedDay } from '../test/seed.ts'
import { searchItems } from './search.ts'
import { tokenFilter } from './shared.ts'

resetTables()
const db = env.DB
const D = 20_000

describe('searchItems', () => {
  it('ANDs tokens, prefers prefix matches and busy items, and matches ids exactly', async () => {
    await seedDay('us', D - 90, [{ id: 7, name: 'Arcanite Ancient' }])
    await seedDay('us', D, [
      { id: 1, name: 'Arcanite Bar', spd: 1 },
      { id: 2, name: 'Bar of Arcanite', spd: 50 },
      { id: 3, name: 'Arcanite Reaper', spd: 3 },
      { id: 4, name: '100% Pure_Gold', spd: 1 },
    ])
    const rows = await searchItems(db, { region: 'us', q: 'arcanite bar' })
    expect(rows.map((r) => r.id)).toEqual([1, 2])
    const prefix = await searchItems(db, { region: 'us', q: 'arcan' })
    expect(prefix.map((r) => r.id)).toEqual([3, 1, 7, 2])
    // the 91-day-old item still matches by name but carries no current price
    expect(prefix.find((r) => r.id === 7)).toMatchObject({
      mv: null,
      spd: null,
    })
    expect(
      (await searchItems(db, { region: 'us', q: '3' })).map((r) => r.id),
    ).toEqual([3])
    expect(
      (await searchItems(db, { region: 'us', q: '100%' })).map((r) => r.id),
    ).toEqual([4])
    expect(await searchItems(db, { region: 'us', q: '0%P' })).toEqual([])
  })
})

describe('tokenFilter', () => {
  it('escapes LIKE wildcards and caps tokens at 5', () => {
    const f = tokenFilter('a_b 1% c\\d e f g', 1)
    expect(f.binds).toEqual(['%a\\_b%', '%1\\%%', '%c\\\\d%', '%e%', '%f%'])
  })
})
