import { describe, expect, it } from 'vitest'
import {
  byVsHist,
  heatCell,
  momentumSummary,
  nextSort,
  sortAnnouncement,
} from './heat'

describe('heatCell', () => {
  it('fills by bin with binInk text in both themes', () => {
    const strong = heatCell(0.4)
    expect(strong.style).toEqual({ background: 'var(--div-p4)' })
    expect(strong.className).toContain('heat-cell')
    expect(strong.className).toContain('text-card')
    expect(strong.className).toContain('dark:text-background')
    const mild = heatCell(-0.03)
    expect(mild.style).toEqual({ background: 'var(--div-n1)' })
    expect(mild.className).toContain('text-foreground')
    expect(mild.className).toContain('dark:text-foreground')
  })

  it('hatches a missing value', () => {
    const cell = heatCell(null)
    expect(cell.style).toBeUndefined()
    expect(cell.className).toContain('hatch')
    expect(cell.className).toContain('heat-cell')
  })
})

describe('momentumSummary', () => {
  it('counts pricier, cheaper and about-usual items by bin', () => {
    const rows = [0.3, 0.1, 0.01, -0.2, -0.019, null].map((vsHist) => ({
      vsHist,
    }))
    expect(momentumSummary(rows)).toBe(
      '6 items: 2 pricier than usual, 1 cheaper, 2 about usual, 1 without a 60-day average.',
    )
    expect(momentumSummary([{ vsHist: 0.5 }])).toBe(
      '1 item: 1 pricier than usual, 0 cheaper, 0 about usual.',
    )
  })
})

describe('byVsHist', () => {
  it('sorts pricier first with nulls last', () => {
    const rows = [null, -0.1, 0.2, 0].map((vsHist, id) => ({ id, vsHist }))
    expect(byVsHist(rows).map((r) => r.vsHist)).toEqual([0.2, 0, -0.1, null])
  })
})

describe('sort helpers', () => {
  it('toggles a header back to the volume default', () => {
    expect(nextSort('volume', 'spread')).toBe('spread')
    expect(nextSort('spread', 'spread')).toBe('volume')
    expect(nextSort('spread', 'name')).toBe('name')
  })

  it('announces the sort in the copy-deck wording', () => {
    expect(sortAnnouncement('volume')).toBe(
      'Sorted by gold traded per day, highest first.',
    )
    expect(sortAnnouncement('spread')).toBe('Sorted by spread, highest first.')
    expect(sortAnnouncement('name')).toBe('Sorted by name, A to Z first.')
  })
})
