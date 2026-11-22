import { describe, expect, it } from 'vitest'
import { squarify } from './treemap'

const area = (r: { w: number; h: number }) => r.w * r.h

describe('squarify', () => {
  it('gives each tile an area proportional to its value and fills the box', () => {
    const values = [60, 25, 10, 5]
    const rects = squarify(values, 200, 100)
    rects.forEach((r, i) => {
      expect(area(r)).toBeCloseTo((values[i] / 100) * 20_000, 6)
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(200 + 1e-9)
      expect(r.y + r.h).toBeLessThanOrEqual(100 + 1e-9)
    })
  })

  it('lays four equal values out as a 2x2 grid of squares', () => {
    const rects = squarify([1, 1, 1, 1], 100, 100)
    for (const r of rects) {
      expect(r.w).toBeCloseTo(50, 6)
      expect(r.h).toBeCloseTo(50, 6)
    }
    expect(new Set(rects.map((r) => `${r.x},${r.y}`)).size).toBe(4)
  })

  it('survives zero values and an empty list', () => {
    expect(squarify([], 10, 10)).toEqual([])
    const rects = squarify([5, 0], 10, 10)
    expect(area(rects[0])).toBeCloseTo(100, 6)
    expect(area(rects[1])).toBe(0)
    expect(rects.every((r) => Number.isFinite(r.x + r.y + r.w + r.h))).toBe(
      true,
    )
  })
})
