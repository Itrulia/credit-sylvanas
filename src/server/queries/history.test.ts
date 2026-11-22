import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { resetTables } from '../test/reset.ts'
import { seedDay, seedRealmScan } from '../test/seed.ts'
import { itemHistory } from './history.ts'

resetTables()
const db = env.DB
const D = 20_000
const NOW = D * 86_400_000 + 12 * 3_600_000

describe('itemHistory', () => {
  it('returns 90 days for the region and the other regions, never older', async () => {
    await seedDay('us', D - 90, [{ id: 1, mv: 1 }])
    await seedDay('eu', D - 90, [{ id: 1, mv: 1 }])
    await seedDay('us', D - 89, [{ id: 1, mv: 10 }])
    await seedDay('us', D, [{ id: 1, mv: 20 }])
    await seedDay('eu', D, [{ id: 1, mv: 30 }])
    await seedDay('kr', D, [{ id: 1, mv: 0 }])
    const h = await itemHistory(db, { region: 'us', itemId: 1 }, NOW)
    expect(h.points.map((p) => [p.day, p.mv])).toEqual([
      [D - 89, 10],
      [D, 20],
    ])
    expect(h.others).toEqual([{ region: 'eu', points: [{ day: D, mv: 30 }] }])
    expect(h.realm).toBeNull()
    expect(h.firstDay).toBe(D - 89)
  })

  it('keeps every realm scan and the last scan per day', async () => {
    await seedDay('us', D, [{ id: 1 }])
    const t = D * 86_400
    await seedRealmScan('us', 'r', 'alliance', t - 91 * 86_400, [
      { id: 1, mv: 1 },
    ])
    await seedRealmScan('us', 'r', 'alliance', t + 3_600, [{ id: 1, mv: 5 }])
    await seedRealmScan('us', 'r', 'alliance', t + 7_200, [
      { id: 1, mv: 6, minBuyout: 2 },
    ])
    const h = await itemHistory(
      db,
      { region: 'us', itemId: 1, realm: 'r', faction: 'alliance' },
      NOW,
    )
    expect(h.realm).toEqual({
      daily: [{ day: D, mv: 6, minBuyout: 2 }],
      scans: [
        { t: t + 3_600, mv: 5 },
        { t: t + 7_200, mv: 6 },
      ],
    })
  })
})
