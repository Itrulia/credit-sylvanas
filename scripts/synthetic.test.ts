import { describe, expect, it } from 'vitest'
import { walkBack } from './synthetic.ts'

const row = {
  itemId: 42,
  mv: 10_000,
  hist: 9_000,
  asp: 9_500,
  saleRate: 0.3,
  spd: 10,
}

describe('walkBack', () => {
  it('is deterministic per region and item', () => {
    expect(walkBack('us', row, 20_000)).toEqual(walkBack('us', row, 20_000))
    expect(walkBack('us', row, 20_000)).not.toEqual(walkBack('eu', row, 20_000))
  })

  it('writes 89 days within +-25% of the real value', () => {
    const days = walkBack('us', row, 20_000)
    expect(days).toHaveLength(89)
    for (const d of days) {
      expect(d.mv).toBeGreaterThanOrEqual(7_500)
      expect(d.mv).toBeLessThanOrEqual(12_500)
      expect(Number.isInteger(d.mv)).toBe(true)
      expect(d.spd).toBeGreaterThanOrEqual(7.5)
      expect(d.spd).toBeLessThanOrEqual(12.5)
    }
  })
})
