import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { resetTables } from '../test/reset.ts'
import { seedDay, seedRealmScan } from '../test/seed.ts'
import { getItem } from './item.ts'

resetTables()
const db = env.DB
const D = 20_000
const NOW = D * 86_400_000 + 12 * 3_600_000
const REALMS = [{ region: 'us', slug: 'r', name: 'R', ruleset: 'pvp' }] as const

describe('getItem', () => {
  it('returns the item, its current snapshot and the cross-region strip', async () => {
    await seedDay('us', D - 1, [{ id: 1, name: 'Arcanite Bar', mv: 100 }])
    await seedDay('us', D, [{ id: 2 }])
    await seedDay('eu', D, [{ id: 1, mv: 300 }])
    const r = await getItem(db, { region: 'us', itemId: 1 }, NOW)
    expect(r.item).toEqual({ id: 1, name: 'Arcanite Bar' })
    expect(r.current).toMatchObject({ mv: 100, day: D - 1 })
    expect(r.lastSeenDay).toBe(D - 1)
    expect(r.regions.map((c) => [c.region, c.mv])).toEqual([
      ['eu', 300],
      ['us', 100],
    ])
    expect(r.regions[1].index).toBeCloseTo(-0.5) // us
    expect(r.realm).toBeNull()
    expect(r.realms).toEqual([])
  })

  it('leaves a region out of the strip when its row is 91 days old', async () => {
    await seedDay('eu', D - 90, [{ id: 1, mv: 1 }])
    await seedDay('us', D, [{ id: 1, mv: 100 }])
    const r = await getItem(db, { region: 'us', itemId: 1 }, NOW)
    expect(r.regions.map((c) => [c.region, c.mv])).toEqual([
      ['eu', null],
      ['us', 100],
    ])
    expect(r.regions[0].index).toBeNull()
  })

  it('has no current snapshot when the region last listed it more than 90 days ago', async () => {
    await seedDay('us', D - 90, [{ id: 1 }])
    await seedDay('us', D, [{ id: 2 }])
    const r = await getItem(db, { region: 'us', itemId: 1 }, NOW)
    expect(r.item).not.toBeNull()
    expect(r.current).toBeNull()
    expect(
      (await getItem(db, { region: 'us', itemId: 3 }, NOW)).item,
    ).toBeNull()
  })

  it('reads realm prices for configured realms only, and the selected one', async () => {
    await seedDay('us', D, [{ id: 1 }])
    await seedRealmScan('us', 'r', 'horde', NOW / 1000 - 91 * 86_400, [
      { id: 1, mv: 1 },
    ])
    await seedRealmScan('us', 'r', 'horde', NOW / 1000 - 3_600, [
      { id: 1, mv: 7, minBuyout: 0, hist: 0 },
    ])
    const r = await getItem(
      db,
      { region: 'us', itemId: 1, realm: 'r', faction: 'horde' },
      NOW,
      REALMS,
    )
    expect(r.realms).toHaveLength(1)
    expect(r.realm).toMatchObject({
      realm: 'r',
      faction: 'horde',
      mv: 7,
      minBuyout: 0,
      historical: null,
    })
  })
})
