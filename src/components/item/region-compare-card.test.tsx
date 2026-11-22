// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { HistoryPoint, ItemHistory } from '#/server/types'
import { RegionCompareCard } from './region-compare-card'

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(cleanup)

const START = Date.parse('2026-11-02T00:00:00Z') / 86_400_000
const points = (n: number): HistoryPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    day: START + i,
    mv: 11_000,
    hist: 10_000,
    asp: 9_000,
    spd: 4,
  }))
const other = (n: number, mv = 10_000) =>
  Array.from({ length: n }, (_, i) => ({ day: START + i, mv }))
const base = {
  region: 'us' as const,
  range: '30d' as const,
  onRangeChange: vi.fn(),
  realm: null,
  realmName: null,
}

describe('RegionCompareCard', () => {
  it('shows the one-region empty state', () => {
    render(<RegionCompareCard {...base} points={points(10)} others={[]} />)
    expect(
      screen.getByText('Only US has a price history for this item so far.'),
    ).toBeTruthy()
  })

  it('counts a region with a single point as missing', () => {
    render(
      <RegionCompareCard
        {...base}
        points={points(10)}
        others={[{ region: 'eu', points: other(1) }]}
      />,
    )
    expect(screen.getByText(/Only US has a price history/)).toBeTruthy()
  })

  it('compares regions with a legend and a matching table', async () => {
    render(
      <RegionCompareCard
        {...base}
        points={points(10)}
        others={[{ region: 'eu', points: other(10, 9_000) }]}
      />,
    )
    expect(
      screen.getByText(
        'In the last 10 days US averaged 10.0% above the median of 2 regions.',
      ),
    ).toBeTruthy()
    const legend = screen.getByRole('list', { name: 'Regions' })
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['US (this region)', 'EU'])
    await userEvent.click(screen.getByRole('button', { name: 'Show as table' }))
    const table = screen.getByRole('table')
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Day', 'US', 'EU'])
    expect(within(table).getAllByRole('row')).toHaveLength(11)
  })

  it('compares the realm with the region', () => {
    const realm: NonNullable<ItemHistory['realm']> = {
      daily: other(5, 9_900).map((p) => ({ ...p, minBuyout: 9_000 })),
      scans: [],
    }
    render(
      <RegionCompareCard
        {...base}
        points={points(10)}
        others={[]}
        realm={realm}
        realmName="Nightslayer"
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'This realm vs region' }),
    ).toBeTruthy()
    expect(
      screen.getByText('Nightslayer averaged 10.0% below the US market value.'),
    ).toBeTruthy()
  })

  it('says when the realm history is too new', () => {
    const realm: NonNullable<ItemHistory['realm']> = {
      daily: [{ day: START + 9, mv: 9_000, minBuyout: 8_000 }],
      scans: [],
    }
    render(
      <RegionCompareCard
        {...base}
        points={points(10)}
        others={[]}
        realm={realm}
        realmName="Nightslayer"
      />,
    )
    expect(
      screen.getByText('Nightslayer history starts 11 Nov 2026.'),
    ).toBeTruthy()
  })
})
