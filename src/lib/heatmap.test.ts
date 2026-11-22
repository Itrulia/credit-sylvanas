import { describe, expect, it } from 'vitest'
import { indexCells, sortHeatRows, spreadOf } from './heatmap'

const cell = (mv: number) => ({ mv, hist: mv })

describe('indexCells', () => {
  it('compares each region with the median of listing regions', () => {
    const out = indexCells({
      us: cell(100),
      eu: cell(200),
      kr: cell(300),
      tw: null,
    })
    expect(out.us?.index).toBeCloseTo(-0.5)
    expect(out.eu?.index).toBeCloseTo(0)
    expect(out.kr?.index).toBeCloseTo(0.5)
    expect(out.tw).toBeNull()
  })

  it('is null with fewer than 2 listings', () => {
    const out = indexCells({ us: cell(100), eu: null, kr: null, tw: null })
    expect(out.us?.index).toBeNull()
  })
})

describe('spreadOf', () => {
  it('is (max - min) / median', () => {
    expect(
      spreadOf({ us: cell(100), eu: cell(200), kr: cell(300), tw: null }),
    ).toBeCloseTo(1)
    expect(spreadOf({ us: cell(100), eu: null, kr: null, tw: null })).toBeNull()
  })
})

describe('sortHeatRows', () => {
  const rows = [
    { name: 'b', goldVolume: 1, spread: null },
    { name: 'a', goldVolume: 3, spread: 0.2 },
    { name: 'c', goldVolume: 2, spread: 0.9 },
  ]
  it('sorts by volume, spread (nulls last) and name', () => {
    expect(sortHeatRows(rows, 'volume').map((r) => r.name)).toEqual([
      'a',
      'c',
      'b',
    ])
    expect(sortHeatRows(rows, 'spread').map((r) => r.name)).toEqual([
      'c',
      'a',
      'b',
    ])
    expect(sortHeatRows(rows, 'name').map((r) => r.name)).toEqual([
      'a',
      'b',
      'c',
    ])
  })
})
